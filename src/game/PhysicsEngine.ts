import * as THREE from 'three';
import { BikeStats, CameraView } from '../types/game';
import { TrackWorld, TrackPoint } from '../3d/TrackBuilder';

export interface PlayerPhysicsState {
  distance: number; // progress along track in meters
  trackOffset: number; // lateral position from center line (-roadWidth/2 to +roadWidth/2)
  speed: number; // km/h
  rpm: number; // 1500 to 16000
  gear: number; // 1 to 6
  rpmRatio: number; // 0.0 to 1.0
  leanAngle: number; // in radians (-0.95 to +0.95)
  pitchAngle: number; // wheelie / stoppie
  nitroAmount: number; // 0 to 100
  isNitroActive: boolean;
  isBraking: boolean;
  isDrifting: boolean;
  isCrashing: boolean;
  crashTimer: number;
  lap: number;
  lapStartTime: number;
  currentLapTime: number;
  bestLapTime: number | null;
  lastLapTime: number | null;
  positionVector: THREE.Vector3;
  directionVector: THREE.Vector3;
}

export class BikePhysicsEngine {
  private stats: BikeStats;
  private track: TrackWorld;
  private roadWidth = 14.0;

  public state: PlayerPhysicsState = {
    distance: 0,
    trackOffset: 0,
    speed: 0,
    rpm: 1500,
    gear: 1,
    rpmRatio: 0,
    leanAngle: 0,
    pitchAngle: 0,
    nitroAmount: 100,
    isNitroActive: false,
    isBraking: false,
    isDrifting: false,
    isCrashing: false,
    crashTimer: 0,
    lap: 1,
    lapStartTime: 0,
    currentLapTime: 0,
    bestLapTime: null,
    lastLapTime: null,
    positionVector: new THREE.Vector3(),
    directionVector: new THREE.Vector3(0, 0, 1),
  };

  // Gear max speeds in km/h
  private gearMaxSpeeds = [0, 95, 150, 205, 255, 295, 360];

  constructor(stats: BikeStats, track: TrackWorld) {
    this.stats = stats;
    this.track = track;
    this.reset(0, 0);
  }

  public reset(startDistance = 0, startOffset = 0) {
    this.state.distance = startDistance;
    this.state.trackOffset = startOffset;
    this.state.speed = 0;
    this.state.rpm = 1500;
    this.state.gear = 1;
    this.state.rpmRatio = 0;
    this.state.leanAngle = 0;
    this.state.pitchAngle = 0;
    this.state.nitroAmount = 100;
    this.state.isNitroActive = false;
    this.state.isBraking = false;
    this.state.isDrifting = false;
    this.state.isCrashing = false;
    this.state.crashTimer = 0;
    this.state.lap = 1;
    this.state.lapStartTime = performance.now();
    this.state.currentLapTime = 0;
  }

  public update(
    delta: number,
    inputs: {
      throttle: number;
      brake: number;
      steer: number; // -1 (left) to +1 (right)
      nitro: boolean;
    },
    weatherGripFactor: number = 1.0,
    onLapComplete?: (lap: number, lapTime: number) => void,
    onCrash?: () => void
  ) {
    const s = this.state;
    const now = performance.now();

    // Lap timer
    s.currentLapTime = (now - s.lapStartTime) / 1000;

    // Handle crash state
    if (s.isCrashing) {
      s.crashTimer -= delta;
      s.speed = Math.max(0, s.speed - 90 * delta);
      if (s.crashTimer <= 0) {
        s.isCrashing = false;
        s.leanAngle = 0;
        s.trackOffset = Math.sign(s.trackOffset) * (this.roadWidth * 0.25); // reset inside road
      }
      this.updateCoordinates();
      return;
    }

    // 1. Nitro management
    if (inputs.nitro && s.nitroAmount > 5 && inputs.throttle > 0.2) {
      s.isNitroActive = true;
      s.nitroAmount = Math.max(0, s.nitroAmount - delta * 24);
    } else {
      s.isNitroActive = false;
      // Gradual refill over time
      s.nitroAmount = Math.min(100, s.nitroAmount + delta * 3.5);
    }

    // 2. Acceleration & Top Speed
    const effectiveTopSpeed = (this.stats.topSpeed + (s.isNitroActive ? 35 : 0));
    const accelMultiplier = (this.stats.acceleration / 50) * (s.isNitroActive ? 1.6 : 1.0);

    if (inputs.throttle > 0 && !inputs.brake) {
      // Natural torque curve per gear
      const speedRatio = s.speed / effectiveTopSpeed;
      const torque = Math.max(0.15, 1.0 - speedRatio * 0.85);
      const accelRate = 22 * accelMultiplier * torque * inputs.throttle;
      s.speed = Math.min(effectiveTopSpeed, s.speed + accelRate * delta);
    } else {
      // Natural rolling resistance and aerodynamic drag
      const drag = 3.5 + Math.pow(s.speed / 100, 2) * 4.5;
      s.speed = Math.max(0, s.speed - drag * delta);
    }

    // 3. Braking
    s.isBraking = inputs.brake > 0.1;
    if (s.isBraking) {
      const brakeForce = (38 + (this.stats.braking / 100) * 40) * inputs.brake;
      s.speed = Math.max(0, s.speed - brakeForce * delta);
    }

    // 4. Automatic Gear Transmission
    const currentGearMax = this.gearMaxSpeeds[s.gear];
    if (s.gear < 6 && s.speed > currentGearMax * 0.96) {
      s.gear++;
    } else if (s.gear > 1 && s.speed < this.gearMaxSpeeds[s.gear - 1] * 0.75) {
      s.gear--;
    }

    // Calculate RPM for audio and HUD tachometer
    const prevGearMax = this.gearMaxSpeeds[s.gear - 1] || 0;
    const gearSpan = Math.max(15, currentGearMax - prevGearMax);
    const speedInGear = Math.max(0, s.speed - prevGearMax);
    s.rpmRatio = Math.min(1.0, Math.max(0.08, speedInGear / gearSpan));
    s.rpm = 1500 + s.rpmRatio * 13500; // up to 15,000 RPM

    // 5. Steering & Lean Dynamics
    // High speed adds gyroscopic stability (requires deliberate lean)
    const speedFactor = Math.min(1.0, Math.max(0.25, s.speed / 120));
    const maxLean = 0.88; // ~50 degrees
    const targetLean = -inputs.steer * maxLean;
    const leanSpeed = (3.5 + (this.stats.handling / 100) * 3.5);
    s.leanAngle = THREE.MathUtils.lerp(s.leanAngle, targetLean, delta * leanSpeed);

    // Lateral displacement based on lean angle and forward speed
    const grip = (this.stats.grip / 100) * weatherGripFactor;
    const lateralVelocity = -Math.sin(s.leanAngle) * (s.speed / 3.6) * 0.85 * grip;
    s.trackOffset += lateralVelocity * delta;

    // 6. Weight transfer & Pitch (suspension visual effect)
    const targetPitch = s.isBraking ? 0.08 : (s.isNitroActive || (inputs.throttle > 0.8 && s.speed < 120) ? -0.06 : 0);
    s.pitchAngle = THREE.MathUtils.lerp(s.pitchAngle, targetPitch, delta * 6);

    // 7. Track limits and crash / wall check
    const halfRoad = this.roadWidth * 0.48;
    if (Math.abs(s.trackOffset) > halfRoad) {
      // Off-road rumble & friction
      s.speed = Math.max(0, s.speed - 35 * delta);
      // Hard wall hit if exceeding barrier limit
      if (Math.abs(s.trackOffset) > halfRoad + 1.8) {
        if (s.speed > 85 && !s.isCrashing) {
          s.isCrashing = true;
          s.crashTimer = 1.6;
          s.speed = Math.max(20, s.speed * 0.3);
          onCrash?.();
        } else {
          // Bounce off barrier
          s.trackOffset = Math.sign(s.trackOffset) * (halfRoad + 1.2);
          s.speed = Math.max(0, s.speed - 40 * delta);
        }
      }
    }

    // 8. Progress along spline
    const distanceStep = (s.speed / 3.6) * delta;
    s.distance += distanceStep;

    // Check lap completion
    if (s.distance >= this.track.totalLength) {
      s.distance = s.distance % this.track.totalLength;
      const lapTime = s.currentLapTime;
      s.lastLapTime = lapTime;
      if (!s.bestLapTime || lapTime < s.bestLapTime) {
        s.bestLapTime = lapTime;
      }
      s.lap++;
      s.lapStartTime = now;
      onLapComplete?.(s.lap, lapTime);
    }

    this.updateCoordinates();
  }

  private updateCoordinates() {
    const pt = this.track.getTrackPointAtProgress(this.state.distance);
    // Position = Spline center + lateral binormal offset
    this.state.positionVector.copy(pt.position).addScaledVector(pt.binormal, this.state.trackOffset);
    // Slight road height offset
    this.state.positionVector.y += 0.32;
    this.state.directionVector.copy(pt.tangent);
  }

  // Camera system positioning with realistic damping
  public updateCamera(
    camera: THREE.Camera,
    viewMode: CameraView,
    speedVibration: boolean = true
  ) {
    const s = this.state;
    const pt = this.track.getTrackPointAtProgress(s.distance);
    const bikePos = s.positionVector;
    const tangent = pt.tangent;
    const binormal = pt.binormal;
    const normal = pt.normal;

    // High speed vibration
    let vibeX = 0;
    let vibeY = 0;
    if (speedVibration && s.speed > 160) {
      const intensity = Math.pow((s.speed - 160) / 180, 2) * 0.06;
      vibeX = (Math.random() - 0.5) * intensity;
      vibeY = (Math.random() - 0.5) * intensity;
    }

    if (viewMode === 'helmetCam') {
      // Helmet action camera POV with micro-vibrations and velocity FOV scaling
      const time = performance.now() * 0.001;
      const speedRatio = Math.min(1.0, s.speed / 240);
      const vibeFreq = 30.0 + speedRatio * 25.0;
      const microAmp = 0.002 + speedRatio * 0.008;
      const microY = Math.sin(time * vibeFreq) * microAmp;
      const microX = Math.cos(time * vibeFreq * 1.2) * microAmp;

      const eyePos = bikePos.clone()
        .addScaledVector(normal, 1.38 + vibeY + microY)
        .addScaledVector(tangent, 0.22)
        .addScaledVector(binormal, -Math.sin(s.leanAngle) * 0.12 + vibeX + microX);
      camera.position.copy(eyePos);

      if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
        const pCam = camera as THREE.PerspectiveCamera;
        pCam.fov = THREE.MathUtils.lerp(pCam.fov, 72 + speedRatio * 20, 0.1);
        pCam.updateProjectionMatrix();
      }

      const lookTarget = eyePos.clone()
        .addScaledVector(tangent, 30)
        .addScaledVector(normal, -0.2)
        .addScaledVector(binormal, -Math.sin(s.leanAngle) * 2.2);
      camera.lookAt(lookTarget);
      camera.rotation.z = -s.leanAngle * 0.35;
    } else if (viewMode === 'firstPerson') {
      // Helmet cockpit view (looking forward over the windshield)
      const eyePos = bikePos.clone()
        .addScaledVector(normal, 1.25 + vibeY)
        .addScaledVector(tangent, 0.35)
        .addScaledVector(binormal, -Math.sin(s.leanAngle) * 0.15 + vibeX);
      camera.position.copy(eyePos);

      const lookTarget = eyePos.clone()
        .addScaledVector(tangent, 25)
        .addScaledVector(normal, -0.4)
        .addScaledVector(binormal, -Math.sin(s.leanAngle) * 2.0);
      camera.lookAt(lookTarget);
    } else if (viewMode === 'rider') {
      // Over-the-shoulder close camera
      const camPos = bikePos.clone()
        .addScaledVector(tangent, -2.4)
        .addScaledVector(normal, 1.6 + vibeY)
        .addScaledVector(binormal, 0.45 + vibeX);
      camera.position.lerp(camPos, 0.3);

      const lookTarget = bikePos.clone()
        .addScaledVector(tangent, 12)
        .addScaledVector(normal, 0.8);
      camera.lookAt(lookTarget);
    } else if (viewMode === 'cinematic') {
      // Low front or side chase angle
      const camPos = bikePos.clone()
        .addScaledVector(tangent, 4.5)
        .addScaledVector(normal, 0.7)
        .addScaledVector(binormal, 2.5);
      camera.position.lerp(camPos, 0.1);
      camera.lookAt(bikePos);
    } else {
      // Default: Dynamic Chase Camera
      // Expands distance and drops slightly lower as speed rises
      const speedExpansion = (s.speed / 300) * 1.6;
      const camDistance = -(4.6 + speedExpansion);
      const camHeight = 1.95 - (s.speed / 300) * 0.25 + vibeY;

      const camTarget = bikePos.clone()
        .addScaledVector(tangent, camDistance)
        .addScaledVector(normal, camHeight)
        .addScaledVector(binormal, Math.sin(s.leanAngle) * 0.6 + vibeX);

      camera.position.lerp(camTarget, 0.25);

      const lookTarget = bikePos.clone()
        .addScaledVector(tangent, 15)
        .addScaledVector(normal, 0.9);
      camera.lookAt(lookTarget);
    }
  }
}
