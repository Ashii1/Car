import * as THREE from 'three';
import { Difficulty, BikeData } from '../types/game';
import { TrackWorld } from '../3d/TrackBuilder';
import { BikeModelInstance, createBikeModel } from '../3d/BikeModelBuilder';
import { INITIAL_BIKES } from '../data/bikesAndTracks';
import { TimeOfDay, WeatherType } from '../types/openCity';

export interface AIRiderInstance {
  id: string;
  name: string;
  bikeData: BikeData;
  model: BikeModelInstance;
  distance: number;
  trackOffset: number; // lateral offset (-4 to +4)
  targetOffset: number;
  speed: number; // km/h
  topSpeed: number;
  accel: number;
  leanAngle: number;
  skill: number;
  lap: number;
  finished: boolean;
  rank: number;
  totalTime: number;
  color: string;
}

const AI_NAMES = [
  'Marco "Apex" Rossi',
  'Kenji Takahashi',
  'Elena Vance',
  'Alexandre Dubois',
  'Mateo Silva',
  'Liam O\'Connor',
  'Yuki Tanaka',
  'Viktor Petrov',
];

const AI_SUIT_COLORS = [
  '#ef4444', // Red
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
];

export class AIManager {
  public opponents: AIRiderInstance[] = [];
  private track: TrackWorld;
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene, track: TrackWorld) {
    this.scene = scene;
    this.track = track;
  }

  public initOpponents(count: number, difficulty: Difficulty) {
    this.clear();

    const difficultyMultipliers = {
      easy: 0.82,
      normal: 0.93,
      hard: 1.02,
      expert: 1.1,
    };
    const diffMult = difficultyMultipliers[difficulty];

    const bikePool = [...INITIAL_BIKES];

    for (let i = 0; i < count; i++) {
      const name = AI_NAMES[i % AI_NAMES.length];
      const bikeData = { ...bikePool[(i + 1) % bikePool.length] };
      const suitColor = AI_SUIT_COLORS[i % AI_SUIT_COLORS.length];

      // Custom bike color for AI
      bikeData.customization = {
        ...bikeData.customization,
        bodyColor: suitColor,
      };

      const model = createBikeModel(bikeData, { suitColor });
      this.scene.add(model.group);

      // Staggered grid starting positions behind player
      const startDistance = -(i + 1) * 9.0;
      const startOffset = ((i % 2 === 0) ? -1 : 1) * 2.8;

      const topSpeed = bikeData.baseStats.topSpeed * diffMult;
      const accel = (bikeData.baseStats.acceleration / 50) * diffMult;

      this.opponents.push({
        id: `ai_${i}`,
        name,
        bikeData,
        model,
        distance: startDistance,
        trackOffset: startOffset,
        targetOffset: startOffset,
        speed: 0,
        topSpeed,
        accel,
        leanAngle: 0,
        skill: 0.9 + Math.random() * 0.2,
        lap: 1,
        finished: false,
        rank: i + 2,
        totalTime: 0,
        color: suitColor,
      });
    }
  }

  public update(delta: number, playerDistance: number, playerOffset: number, totalLaps: number) {
    const trackLen = this.track.totalLength;

    this.opponents.forEach((ai) => {
      if (ai.finished) return;

      ai.totalTime += delta;

      // 1. Look ahead on track curve to anticipate corner curvature
      const lookAheadDist = Math.max(15, (ai.speed / 3.6) * 1.5);
      const aheadPt = this.track.getTrackPointAtProgress(ai.distance + lookAheadDist);
      const currentPt = this.track.getTrackPointAtProgress(ai.distance);

      // Higher curvature requires braking
      const cornerSharpness = aheadPt.curvature;
      let targetSpeed = ai.topSpeed;

      if (cornerSharpness > 1.8) {
        targetSpeed = Math.max(90, ai.topSpeed * 0.55);
      } else if (cornerSharpness > 1.0) {
        targetSpeed = Math.max(130, ai.topSpeed * 0.75);
      }

      // 2. Acceleration / Braking
      const isBraking = ai.speed > targetSpeed + 8;
      if (isBraking) {
        ai.speed = Math.max(targetSpeed, ai.speed - 50 * delta);
      } else {
        const accelRate = 20 * ai.accel * (1 - ai.speed / ai.topSpeed);
        ai.speed = Math.min(targetSpeed, ai.speed + accelRate * delta);
      }

      // 3. Racing line & Overtaking AI behavior
      // Smoothly oscillate or avoid player if too close ahead
      const distToPlayer = (playerDistance - ai.distance + trackLen) % trackLen;
      if (distToPlayer > 0 && distToPlayer < 12 && Math.abs(ai.trackOffset - playerOffset) < 1.8) {
        // Shift lane to overtake
        ai.targetOffset = playerOffset > 0 ? -2.8 : 2.8;
      } else if (Math.random() < 0.01) {
        // Natural racing line drift towards apex
        ai.targetOffset = (Math.random() - 0.5) * 4.5;
      }

      ai.trackOffset = THREE.MathUtils.lerp(ai.trackOffset, ai.targetOffset, delta * 1.2);

      // 4. Lean Angle proportional to corner curvature and lateral steering
      const targetLean = (aheadPt.binormal.x - currentPt.binormal.x) * 12 + (ai.targetOffset - ai.trackOffset) * 0.2;
      const clampedLean = Math.max(-0.85, Math.min(0.85, targetLean));
      ai.leanAngle = THREE.MathUtils.lerp(ai.leanAngle, clampedLean, delta * 3.5);

      // 5. Move along spline
      ai.distance += (ai.speed / 3.6) * delta;

      if (ai.distance >= trackLen) {
        ai.distance = ai.distance % trackLen;
        ai.lap++;
        if (ai.lap > totalLaps) {
          ai.finished = true;
          ai.speed = Math.max(40, ai.speed * 0.5);
        }
      }

      // 6. Update 3D Model position & orientation
      const pt = this.track.getTrackPointAtProgress(ai.distance);
      const pos = pt.position.clone()
        .addScaledVector(pt.binormal, ai.trackOffset);
      pos.y += 0.32;

      ai.model.group.position.copy(pos);

      // Rotate bike to face track tangent
      ai.model.group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), pt.tangent);
      // Apply banking/lean
      ai.model.group.rotateOnAxis(new THREE.Vector3(0, 0, 1), -ai.leanAngle);

      // Update bike & rider animations
      const rpmRatio = Math.min(1.0, (ai.speed % 60) / 60);
      ai.model.updateAnimation(
        ai.speed,
        rpmRatio,
        clampedLean,
        ai.leanAngle,
        isBraking,
        false,
        delta,
        false,
        ai.finished && ai.rank === 1
      );
    });
  }

  // Calculate ranks across player and all AI riders
  public calculateRanks(playerDistance: number, playerLap: number): { playerRank: number; totalRacers: number } {
    const trackLen = this.track.totalLength;
    const playerTotalScore = (playerLap - 1) * trackLen + playerDistance;

    const allRacers = [
      { id: 'player', totalScore: playerTotalScore },
      ...this.opponents.map((ai) => ({
        id: ai.id,
        totalScore: (ai.lap - 1) * trackLen + ai.distance,
      })),
    ];

    allRacers.sort((a, b) => b.totalScore - a.totalScore);

    let playerRank = 1;
    allRacers.forEach((r, idx) => {
      const rank = idx + 1;
      if (r.id === 'player') {
        playerRank = rank;
      } else {
        const ai = this.opponents.find((o) => o.id === r.id);
        if (ai) ai.rank = rank;
      }
    });

    return {
      playerRank,
      totalRacers: allRacers.length,
    };
  }

  public updateLighting(timeOfDay: TimeOfDay, weather: WeatherType) {
    this.opponents.forEach((ai) => {
      ai.model.updateDayNightAndWeather?.(timeOfDay, weather);
    });
  }

  public clear() {
    this.opponents.forEach((ai) => {
      this.scene.remove(ai.model.group);
      ai.model.dispose();
    });
    this.opponents = [];
  }
}
