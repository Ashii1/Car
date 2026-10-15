import * as THREE from 'three';
import { OpenCityBikeStats, CameraView } from '../types/openCity';
import { CityWorldInstance } from '../3d/CityWorldBuilder';

// Pre-allocated static vectors to eliminate per-frame GC stutters
const _camPos = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();
const _targetPos = new THREE.Vector3();

export interface OpenCityPlayerState {
  x: number;
  y: number;
  z: number;
  heading: number; // in radians
  speed: number; // km/h
  rpm: number;
  gear: number;
  rpmRatio: number;
  leanAngle: number;
  pitchAngle: number;
  wheelieAngle: number;
  nitroAmount: number;
  isNitroActive: boolean;
  isBraking: boolean;
  isReversing: boolean;
  isGrounded: boolean;
  airTimeSeconds: number;
  verticalVelocity: number;
  isOnBike: boolean;
  isKickstandDeployed: boolean;
  wantedLevel: number; // 0 to 3 stars
  wantedTimer: number;
  stuntScore: number;
  currentStuntLabel: string;
  // Dynamic Tire Slip & Grip Model
  surfaceType: 'asphalt' | 'wet_asphalt' | 'dirt' | 'slick';
  surfaceFriction: number; // μ friction coefficient (0.35 - 1.10)
  slipAngle: number; // Lateral slip angle in radians
  slipRatio: number; // 0.0 to 1.0
  lateralVelocity: number; // Sideways drift velocity in m/s
  isDrifting: boolean; // True when powersliding / drifting in corners
  driftScore: number;
  // Active Aero & Drive Mode Telemetry
  activeAeroAngle?: number;
  activeAeroDownforceKg?: number;
  isAirbrakeActive?: boolean;
  driveMode?: string;
  ambientLightColor?: string;
  steer?: number;
  gearLabel?: string;
  throttle?: number;
  brake?: number;
}

export class OpenWorldPhysicsEngine {
  public state: OpenCityPlayerState = {
    x: 0,
    y: 0.3,
    z: 20,
    heading: 0,
    speed: 0,
    rpm: 1500,
    gear: 1,
    rpmRatio: 0,
    leanAngle: 0,
    pitchAngle: 0,
    wheelieAngle: 0,
    nitroAmount: 100,
    isNitroActive: false,
    isBraking: false,
    isReversing: false,
    isGrounded: true,
    airTimeSeconds: 0,
    verticalVelocity: 0,
    isOnBike: true,
    isKickstandDeployed: false,
    wantedLevel: 0,
    wantedTimer: 0,
    stuntScore: 0,
    currentStuntLabel: '',
    surfaceType: 'asphalt',
    surfaceFriction: 1.05,
    slipAngle: 0,
    slipRatio: 0,
    lateralVelocity: 0,
    isDrifting: false,
    driftScore: 0,
  };

  private stats: OpenCityBikeStats;
  private world: CityWorldInstance;
  private gearMaxSpeeds = [0, 85, 140, 195, 245, 290, 350];
  private currentSteer = 0;
  private potholeShake = 0;
  private currentFov = 65;
  private defaultBaseFov = 65;
  private lateralVel = 0; // Sideways velocity m/s
  private currentWeather: string = 'clear';
  private activeAeroAngle: number = 0;
  private aeroDownforceKg: number = 0;
  private isAirbrakeActive: boolean = false;

  constructor(stats: OpenCityBikeStats, world: CityWorldInstance) {
    this.stats = stats;
    this.world = world;
  }

  public setStats(stats: OpenCityBikeStats) {
    this.stats = stats;
  }

  public setWeather(weather: string) {
    this.currentWeather = weather;
  }

  public setAeroDownforce(angleDeg: number, downforceKg: number, isAirbrake: boolean) {
    this.activeAeroAngle = angleDeg;
    this.aeroDownforceKg = downforceKg;
    this.isAirbrakeActive = isAirbrake;
  }

  public reset(x = 0, z = 20, heading = 0) {
    this.state.x = x;
    this.state.z = z;
    this.state.y = this.world.getGroundHeightAt(x, z);
    this.state.heading = heading;
    this.state.speed = 0;
    this.state.rpm = 1500;
    this.state.gear = 1;
    this.state.verticalVelocity = 0;
    this.state.isGrounded = true;
    this.state.airTimeSeconds = 0;
    this.state.isKickstandDeployed = false;
    this.lateralVel = 0;
    this.state.lateralVelocity = 0;
    this.state.slipAngle = 0;
    this.state.slipRatio = 0;
    this.state.isDrifting = false;
    this.currentSteer = 0;
    this.potholeShake = 0;
  }

  public toggleMount() {
    this.state.isOnBike = !this.state.isOnBike;
    if (!this.state.isOnBike) {
      this.state.speed = 0;
      this.state.isKickstandDeployed = true;
    } else {
      this.state.isKickstandDeployed = false;
    }
  }

  public toggleKickstand() {
    this.state.isKickstandDeployed = !this.state.isKickstandDeployed;
    if (this.state.isKickstandDeployed) {
      this.state.speed = 0;
    }
  }

  public applyPotholeImpact(speedLoss: number, shakeIntensity: number) {
    if (this.state.speed > 0) {
      this.state.speed = Math.max(0, this.state.speed - speedLoss);
    } else if (this.state.speed < 0) {
      this.state.speed = Math.min(0, this.state.speed + speedLoss);
    }
    this.potholeShake = shakeIntensity;
  }

  public triggerPoliceAlert() {
    this.state.wantedLevel = Math.min(3, this.state.wantedLevel + 1);
    this.state.wantedTimer = 18; // 18 seconds to evade
  }

  public update(
    delta: number,
    inputs: {
      throttle: number; // 0 to 1
      brake: number; // 0 to 1
      steer: number; // -1 to 1
      nitro: boolean;
      wheelie: boolean;
      reverse: boolean;
      gear?: string;
    },
    onStuntReward?: (score: number, label: string) => void,
    onCollision?: (speed: number) => void
  ) {
    const s = this.state;

    // Decay wanted level if player evades
    if (s.wantedLevel > 0) {
      s.wantedTimer -= delta;
      if (s.wantedTimer <= 0) {
        s.wantedLevel = Math.max(0, s.wantedLevel - 1);
        if (s.wantedLevel > 0) s.wantedTimer = 15;
      }
    }

    // ON-FOOT CHARACTER MODE
    if (!s.isOnBike) {
      let targetWalkSpeed = 0;
      if (inputs.throttle > 0) {
        targetWalkSpeed = inputs.nitro ? 18.0 : 9.5; // Sprint (18 km/h) or Jog (9.5 km/h)
      } else if (inputs.reverse || inputs.brake > 0) {
        targetWalkSpeed = -5.8; // Step backward / backpedal (-5.8 km/h)
      }

      // Smooth inertia acceleration & deceleration
      s.speed = THREE.MathUtils.lerp(s.speed, targetWalkSpeed, Math.min(1.0, delta * 14.0));
      if (Math.abs(s.speed) < 0.08 && targetWalkSpeed === 0) s.speed = 0;

      // Steer rotates heading
      s.heading += inputs.steer * delta * 3.4;
      if (s.speed !== 0) {
        s.x += Math.sin(s.heading) * (s.speed / 3.6) * delta;
        s.z += Math.cos(s.heading) * (s.speed / 3.6) * delta;
      }
      s.y = this.world.getGroundHeightAt(s.x, s.z);
      s.leanAngle = 0;
      s.pitchAngle = 0;
      s.wheelieAngle = 0;
      return;
    }

    // MOTORCYCLE / CAR DRIVING MODE
    // 1. Kickstand / Foot-down check
    if (s.isKickstandDeployed) {
      if (inputs.throttle > 0.1) {
        // Automatically retract kickstand on throttle
        s.isKickstandDeployed = false;
      } else {
        s.speed = 0;
        s.leanAngle = THREE.MathUtils.lerp(s.leanAngle, -0.14, delta * 6.0); // rest on side stand
        return;
      }
    }

    // 2. Nitrous Oxide Boost
    if (inputs.nitro && s.nitroAmount > 5 && inputs.throttle > 0.3) {
      s.isNitroActive = true;
      s.nitroAmount = Math.max(0, s.nitroAmount - delta * 25);
    } else {
      s.isNitroActive = false;
      s.nitroAmount = Math.min(100, s.nitroAmount + delta * 4);
    }

    // 3. Transmission Gear Gate & Acceleration Mechanics (P, R, N, D)
    const effectiveTopSpeed = this.stats.topSpeed + (s.isNitroActive ? 40 : 0);
    // Punchy, responsive acceleration for rapid thrilling takeoffs (0-100 in ~3.0s)
    const accelRate = (this.stats.acceleration / 45) * (s.isNitroActive ? 1.8 : 1.0) * 36;
    const handlingProfile = this.stats.handlingCharacteristics;

    // Detect target gear from transmission or automatic driving intent
    const selectedGear = inputs.gear || (s.speed < -0.4 ? 'R' : 'D1');
    const isPark = selectedGear === 'P';
    const isNeutral = selectedGear === 'N';
    const isReverseGear = selectedGear === 'R';

    if (isPark) {
      // Mechanical Park Lock: Car locked stationary at 0
      s.speed = THREE.MathUtils.lerp(s.speed, 0, delta * 24.0);
      if (Math.abs(s.speed) < 0.05) s.speed = 0;
      s.isBraking = true;
      s.isReversing = false;
      if (inputs.throttle > 0) {
        s.rpm = THREE.MathUtils.lerp(s.rpm, 1200 + inputs.throttle * 5800, delta * 12.0);
      } else {
        s.rpm = THREE.MathUtils.lerp(s.rpm, 850, delta * 8.0);
      }
    } else if (isNeutral) {
      // Disengaged neutral: free revving, natural rolling friction
      s.isBraking = inputs.brake > 0.1;
      s.isReversing = s.speed < -0.2;
      const drag = 4.5 + Math.pow(Math.abs(s.speed) / 100, 2) * 5.0;
      if (s.speed > 0) s.speed = Math.max(0, s.speed - drag * delta);
      else if (s.speed < 0) s.speed = Math.min(0, s.speed + drag * delta);

      if (inputs.brake > 0) {
        const brakeForce = (50 + (this.stats.braking / 100) * 50) * inputs.brake;
        if (s.speed > 0) s.speed = Math.max(0, s.speed - brakeForce * delta);
        else if (s.speed < 0) s.speed = Math.min(0, s.speed + brakeForce * delta);
      }

      if (inputs.throttle > 0) {
        s.rpm = THREE.MathUtils.lerp(s.rpm, 1200 + inputs.throttle * 6800, delta * 14.0);
      } else {
        s.rpm = THREE.MathUtils.lerp(s.rpm, 850, delta * 8.0);
      }
    } else if (isReverseGear) {
      // EXPLICIT REVERSE GEAR [R]:
      s.isReversing = true;
      const maxReverseKmh = -65.0;
      const reverseAccel = accelRate * 0.9;
      const reverseDemand = Math.max(inputs.throttle, inputs.reverse ? 1.0 : (Math.abs(s.speed) < 1.0 ? inputs.brake : 0));

      if (reverseDemand > 0) {
        s.isBraking = false;
        s.speed = Math.max(maxReverseKmh, s.speed - reverseAccel * reverseDemand * delta);
        s.rpm = THREE.MathUtils.lerp(s.rpm, 1200 + (Math.abs(s.speed) / 65) * 5200, delta * 12.0);
      } else if (inputs.brake > 0 && s.speed < -0.5) {
        // Active braking to stop while reversing
        s.isBraking = true;
        const brakeForce = (50 + (this.stats.braking / 100) * 50) * inputs.brake;
        s.speed = Math.min(0, s.speed + brakeForce * delta);
        s.rpm = THREE.MathUtils.lerp(s.rpm, 950, delta * 8.0);
      } else {
        s.isBraking = false;
        const drag = 6.0;
        if (s.speed < 0) s.speed = Math.min(0, s.speed + drag * delta);
        else if (s.speed > 0) s.speed = Math.max(0, s.speed - drag * delta);
        s.rpm = THREE.MathUtils.lerp(s.rpm, 900, delta * 6.0);
      }
    } else {
      // FORWARD DRIVE (D / D1..D6):
      // Clean forward driving and predictable braking:
      if (s.speed > 0.2 && inputs.brake > 0) {
        // Active forward braking - stops vehicle cleanly to 0 km/h without sudden jerky reversing
        s.isBraking = true;
        s.isReversing = false;
        const brakeForce = (55 + (this.stats.braking / 100) * 55) * inputs.brake;
        const airbrakeDrag = (this.isAirbrakeActive ? Math.min(32, (this.aeroDownforceKg * 0.32)) : 0) * inputs.brake;
        s.speed = Math.max(0, s.speed - (brakeForce + airbrakeDrag) * delta);
        if (s.speed < 0.25) {
          s.speed = 0;
        }
      } else if (s.speed < -0.2 && inputs.throttle > 0) {
        // Pressing Gas [W] while rolling backward: quickly arrest reverse speed and launch forward
        s.isBraking = true;
        s.isReversing = false;
        s.speed = Math.min(0, s.speed + 75.0 * delta);
        if (s.speed >= -0.25) {
          s.speed = 0.5;
        }
      } else if (inputs.reverse || (s.speed <= 0.2 && inputs.brake > 0.25 && inputs.throttle <= 0)) {
        // Intentional reverse when stationary
        s.isReversing = true;
        s.isBraking = false;
        const maxReverseKmh = -55.0;
        const revPower = Math.max(inputs.brake, inputs.reverse ? 1.0 : 0);
        s.speed = Math.max(maxReverseKmh, s.speed - accelRate * 0.85 * revPower * delta);
        s.rpm = THREE.MathUtils.lerp(s.rpm, 1200 + (Math.abs(s.speed) / 55) * 4800, delta * 10.0);
      } else if (inputs.throttle > 0 && !inputs.brake) {
        // Forward Acceleration: high torque punch & smooth climb
        s.isReversing = false;
        s.isBraking = false;
        const speedRatio = Math.max(0, s.speed / effectiveTopSpeed);
        const curveExp = handlingProfile?.curveExponent ?? 1.0;
        let curveFactor = 1.0;
        if (curveExp > 1.0) {
          curveFactor = 0.65 + Math.pow(Math.max(0.05, speedRatio), curveExp - 1.0) * 0.75;
        } else if (curveExp < 1.0) {
          curveFactor = 0.85 + Math.pow(Math.max(0.05, 1.0 - speedRatio), 1.0 - curveExp) * 0.55;
        }
        const torque = Math.max(0.35, (1.0 - speedRatio * 0.65) * curveFactor);
        s.speed = Math.min(effectiveTopSpeed, s.speed + accelRate * torque * inputs.throttle * delta);
      } else {
        // Natural rolling coast
        s.isReversing = s.speed < -0.2;
        s.isBraking = false;
        const drag = 3.5 + Math.pow(Math.abs(s.speed) / 100, 2) * 4.5;
        if (s.speed > 0) s.speed = Math.max(0, s.speed - drag * delta);
        else if (s.speed < 0) s.speed = Math.min(0, s.speed + drag * delta);
      }
    }

    // 5. Transmission & RPM
    const absSpeed = Math.abs(s.speed);
    if (s.isReversing) {
      s.gear = 1;
      s.gearLabel = 'R';
    } else if (isPark) {
      s.gear = 0;
      s.gearLabel = 'P';
    } else if (isNeutral) {
      s.gear = 0;
      s.gearLabel = 'N';
    } else {
      const currentGearMax = this.gearMaxSpeeds[s.gear];
      if (s.gear < 6 && absSpeed > currentGearMax * 0.95) s.gear++;
      else if (s.gear > 1 && absSpeed < this.gearMaxSpeeds[s.gear - 1] * 0.72) s.gear--;
      s.gearLabel = `D${s.gear}`;

      const prevGearMax = this.gearMaxSpeeds[s.gear - 1] || 0;
      const gearSpan = Math.max(20, currentGearMax - prevGearMax);
      s.rpmRatio = Math.min(1.0, Math.max(0.08, (absSpeed - prevGearMax) / gearSpan));
      s.rpm = 1500 + s.rpmRatio * 13500;
    }

    // 6. Dynamic Surface Type & High Grip Racing Friction Model
    const isPotholeActive = this.potholeShake > 0.06;
    const isRaining = this.currentWeather === 'rain';

    // High performance paved asphalt across open city roads and avenues
    let baseFriction = 1.35;
    let surface: 'asphalt' | 'wet_asphalt' | 'dirt' | 'slick' = 'asphalt';

    if (isPotholeActive) {
      surface = 'slick';
      baseFriction = 0.55;
    } else if (isRaining) {
      surface = 'wet_asphalt';
      baseFriction = 1.10;
    } else {
      surface = 'asphalt';
      baseFriction = 1.35;
    }

    const gripStatFactor = 0.85 + (this.stats.grip / 100) * 0.45;
    const downforceGripBonus = 1.0 + Math.min(0.25, (this.aeroDownforceKg / 140) * 0.25);
    const mu = baseFriction * gripStatFactor * downforceGripBonus;
    s.surfaceType = surface;
    s.surfaceFriction = mu;
    s.activeAeroAngle = this.activeAeroAngle;
    s.activeAeroDownforceKg = this.aeroDownforceKg;
    s.isAirbrakeActive = this.isAirbrakeActive;

    // 7. Dynamic Responsive Steering & Sharp Cornering Control
    const steerResponsiveness = 18.0;
    this.currentSteer = THREE.MathUtils.lerp(this.currentSteer, inputs.steer, delta * steerResponsiveness);

    let speedTurnFactor = 1.0;
    if (absSpeed < 3.0) {
      speedTurnFactor = 1.35; // Great turning authority for maneuvers
    } else if (absSpeed < 45.0) {
      speedTurnFactor = THREE.MathUtils.lerp(1.35, 1.45, absSpeed / 45.0);
    } else {
      speedTurnFactor = 1.45 / (1.0 + (absSpeed - 45.0) * 0.005);
    }

    const turningRadius = handlingProfile?.turningRadius ?? 2.8;
    const turnRadiusFactor = THREE.MathUtils.clamp(3.0 / turningRadius, 0.9, 1.6);
    const baseTurnSpeed = 2.85 * turnRadiusFactor;
    const demandedTurnRate = this.currentSteer * baseTurnSpeed * speedTurnFactor;

    // Direct, highly responsive turning that gives player confident control
    const effectiveTurnRate = demandedTurnRate;

    const canTurn = absSpeed > 0.05 || inputs.throttle > 0 || Math.abs(this.currentSteer) > 0.05;
    if (canTurn) {
      const isReversingDirection = s.speed < -0.1 || (isReverseGear && inputs.throttle > 0);
      s.heading += effectiveTurnRate * delta * (isReversingDirection ? -1 : 1);
    }

    // Rear Tire Lateral Slip & Powerslide Drift Dynamics
    const vFwd = s.speed / 3.6; // m/s
    const vFwdAbs = Math.abs(vFwd);
    const demandedLatAccel = vFwdAbs * Math.abs(demandedTurnRate);
    const maxLatAccel = mu * 9.81;
    const excessLatG = Math.max(0, demandedLatAccel - maxLatAccel);
    const steerDir = Math.sign(this.currentSteer);

    // Handbrake / Brake Slide Boost (pressing brake in turns kicks out rear for fun arcade drift)
    const brakeDriftBoost = (s.isBraking && Math.abs(this.currentSteer) > 0.25 && vFwdAbs > 6.0) ? 2.2 : 1.0;

    if (excessLatG > 0.15 && vFwdAbs > 4.0) {
      const slipAccel = -steerDir * excessLatG * 0.45 * brakeDriftBoost;
      this.lateralVel += slipAccel * delta;
    } else if (s.isBraking && Math.abs(this.currentSteer) > 0.4 && vFwdAbs > 8.0) {
      this.lateralVel += -steerDir * (8.0 / mu) * delta;
    }

    // Counter-Steering Drift Catch (steering into the slide stabilizes drift angle)
    const isCounterSteer = (steerDir !== 0 && Math.sign(this.lateralVel) === steerDir);
    if (isCounterSteer) {
      this.lateralVel = THREE.MathUtils.lerp(this.lateralVel, 0, delta * 4.5);
    }

    // Restoring Lateral Grip Damping (tires bite into pavement to stop sideways slide)
    const lateralDamping = (mu * 8.5) + (isCounterSteer ? 4.0 : 0);
    this.lateralVel = THREE.MathUtils.lerp(this.lateralVel, 0, delta * lateralDamping);
    this.lateralVel = Math.max(-10, Math.min(10, this.lateralVel));

    s.lateralVelocity = this.lateralVel;
    s.slipAngle = Math.atan2(this.lateralVel, vFwdAbs + 0.1);
    s.slipRatio = Math.min(1.0, (Math.abs(this.lateralVel) / 5.2) + (Math.abs(s.slipAngle) / 0.45));
    s.steer = this.currentSteer;
    s.throttle = inputs.throttle;
    s.brake = inputs.brake;

    const driftThreshold = surface === 'wet_asphalt' || surface === 'slick' ? 0.16 : 0.22;
    s.isDrifting = s.slipRatio > driftThreshold && vFwdAbs > 7.0 && s.isGrounded;

    if (s.isDrifting) {
      s.driftScore += Math.round(s.slipRatio * absSpeed * delta * 6);
      s.currentStuntLabel = isCounterSteer ? 'PRO DRIFT COUNTER' : 'TIRE POWERSLIDE';
    }

    // Natural banking lean angle with dynamic drift counter-roll clamped by bike's maxLeanAngle
    const maxLeanRad = THREE.MathUtils.degToRad(handlingProfile?.maxLeanAngle ?? 55);
    const rawLean = (this.currentSteer * Math.min(maxLeanRad, 0.12 + (absSpeed / 95) * maxLeanRad * 0.9))
      - (s.isDrifting ? this.lateralVel * 0.04 : 0);
    const targetLean = THREE.MathUtils.clamp(rawLean, -maxLeanRad, maxLeanRad);
    s.leanAngle = THREE.MathUtils.lerp(s.leanAngle, targetLean, delta * 7.0);

    // Dynamic Pothole Hazard Vibration Decay
    if (this.potholeShake > 0.01) {
      s.pitchAngle += (Math.random() - 0.5) * this.potholeShake * 0.4;
      s.leanAngle += (Math.random() - 0.5) * this.potholeShake * 0.3;
      this.potholeShake = THREE.MathUtils.lerp(this.potholeShake, 0, delta * 8.0);
    }

    // 8. Stunts & Wheelies
    if (inputs.wheelie && absSpeed > 30 && s.isGrounded) {
      s.wheelieAngle = THREE.MathUtils.lerp(s.wheelieAngle, 0.58, delta * 4.5);
      s.stuntScore += Math.round(absSpeed * delta * 2);
      s.currentStuntLabel = 'POWER WHEELIE';
    } else {
      s.wheelieAngle = THREE.MathUtils.lerp(s.wheelieAngle, 0, delta * 6);
    }

    // Suspension Dive / Squat Pitch
    const brakePitch = s.isBraking ? 0.08 : (inputs.throttle > 0.8 && absSpeed < 100 ? -0.06 : 0);
    s.pitchAngle = THREE.MathUtils.lerp(s.pitchAngle, brakePitch - s.wheelieAngle, delta * 6);

    // 9. 2D World Velocity Integration with Lateral Slip
    // worldVelX = sin(heading) * vFwd + cos(heading) * vLat
    // worldVelZ = cos(heading) * vFwd - sin(heading) * vLat
    const sinH = Math.sin(s.heading);
    const cosH = Math.cos(s.heading);
    const worldVelX = sinH * vFwd + cosH * this.lateralVel;
    const worldVelZ = cosH * vFwd - sinH * this.lateralVel;

    const nextX = s.x + worldVelX * delta;
    const nextZ = s.z + worldVelZ * delta;

    // Smooth arcade wall sliding collision resolution (allows driving along walls without getting stuck)
    let collisionX = false;
    let collisionZ = false;
    for (const obs of this.world.obstacles) {
      if (nextX >= obs.minX && nextX <= obs.maxX && s.z >= obs.minZ && s.z <= obs.maxZ) {
        collisionX = true;
      }
      if (s.x >= obs.minX && s.x <= obs.maxX && nextZ >= obs.minZ && nextZ <= obs.maxZ) {
        collisionZ = true;
      }
      if (collisionX && collisionZ) break;
    }

    if (!collisionX) {
      s.x = nextX;
    } else {
      // Deflect along wall and scrub slight speed instead of dead-stop
      s.speed *= 0.92;
      this.lateralVel *= 0.5;
    }

    if (!collisionZ) {
      s.z = nextZ;
    } else {
      // Deflect along wall and scrub slight speed instead of dead-stop
      s.speed *= 0.92;
      this.lateralVel *= 0.5;
    }

    // Direct head-on corner collision impact
    if (collisionX && collisionZ) {
      if (absSpeed > 65) {
        this.triggerPoliceAlert();
      }
      onCollision?.(absSpeed);
      s.speed = Math.sign(s.speed) * Math.min(Math.abs(s.speed) * 0.45, 12);
    }

    // 9. Gravity, Jumps & Stunt Ramps
    const groundY = this.world.getGroundHeightAt(s.x, s.z);

    // Check stunt ramps launch
    for (const ramp of this.world.stuntRamps) {
      const dist = Math.hypot(s.x - ramp.x, s.z - ramp.z);
      if (dist < ramp.length / 2 && absSpeed > 60 && s.isGrounded) {
        s.verticalVelocity = Math.min(22, (absSpeed / 3.6) * 0.45);
        s.isGrounded = false;
        s.currentStuntLabel = 'INSANE RAMP JUMP';
        break;
      }
    }

    if (!s.isGrounded || s.y > groundY + 0.05) {
      // Airborne
      s.airTimeSeconds += delta;
      s.verticalVelocity -= 22 * delta; // Gravity
      s.y += s.verticalVelocity * delta;

      if (s.y <= groundY) {
        // Landing
        s.y = groundY;
        s.verticalVelocity = 0;
        s.isGrounded = true;

        if (s.airTimeSeconds > 0.5) {
          const jumpBonus = Math.round(s.airTimeSeconds * 300);
          s.stuntScore += jumpBonus;
          onStuntReward?.(jumpBonus, 'BIG AIR LANDING');
        }
        s.airTimeSeconds = 0;
      }
    } else {
      s.y = groundY;
      s.verticalVelocity = 0;
      s.isGrounded = true;
      s.airTimeSeconds = 0;
    }

    // 10. Extended Highway & Road Continuity (No premature warping or dead ends)
    // Continuous travel along the Tamil Nadu expressway corridor past the toll plaza
    // and across the entire 7x10 interconnected road grid
    if (s.z < -870) {
      s.z = -860;
      if (Math.abs(s.x) < 30) s.heading = 0; // Turn around tunnel
    } else if (s.z > 2400) {
      s.z = 2390;
      if (Math.abs(s.x) < 30) s.heading = Math.PI; // Face northwards
    }
    s.x = Math.max(-735, Math.min(735, s.x));
    s.z = Math.max(-870, Math.min(2400, s.z));
  }

  // Camera tracking modes - Engineered for 100% Road Visibility & Zero Obstruction
  public updateCamera(camera: THREE.Camera, viewMode: CameraView, speedVibration = true) {
    const s = this.state;
    _targetPos.set(s.x, s.y, s.z);

    let vibeY = 0;
    if (speedVibration && Math.abs(s.speed) > 170) {
      vibeY = (Math.random() - 0.5) * 0.04;
    }

    // Restore camera standard FOV smoothly when exiting helmetCam mode
    if (viewMode !== 'helmetCam' && (camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
      const pCam = camera as THREE.PerspectiveCamera;
      if (Math.abs(pCam.fov - this.defaultBaseFov) > 0.08) {
        pCam.fov = THREE.MathUtils.lerp(pCam.fov, this.defaultBaseFov, 0.12);
        pCam.updateProjectionMatrix();
        this.currentFov = pCam.fov;
      }
    }

    // 1. Cinematic 360 Rotating Orbit Camera Mode (Continuous 360° rotation around target)
    if (viewMode === 'drone') {
      const time = performance.now() * 0.001;
      const orbitSpeed = 0.65; // Smooth continuous 360 rotation around rider/bike
      const angle = time * orbitSpeed;

      const camDist = s.isOnBike ? 4.6 : 3.4;
      const camHeight = s.isOnBike ? 1.6 : 1.7;

      _camPos.set(
        s.x + Math.sin(angle) * camDist,
        Math.max(0.5, s.y + camHeight + vibeY),
        s.z + Math.cos(angle) * camDist
      );

      camera.position.lerp(_camPos, 0.18);

      _lookTarget.copy(_targetPos);
      _lookTarget.y += s.isOnBike ? 0.9 : 1.2;
      camera.lookAt(_lookTarget);
      return;
    }

    if (!s.isOnBike) {
      if (viewMode === 'close') {
        // UP-CLOSE CHARACTER INSPECTION CAMERA (FRONT 3/4 PORTRAIT)
        // Allows close-up inspection of human face, eyes, hair, clothes, breathing and blinking!
        const inspectDist = 1.65;
        const inspectAngle = s.heading + 0.32; // Slight 3/4 front angle
        _camPos.set(
          s.x + Math.sin(inspectAngle) * inspectDist,
          s.y + 1.58,
          s.z + Math.cos(inspectAngle) * inspectDist
        );
        camera.position.lerp(_camPos, 0.26);

        _lookTarget.set(s.x, s.y + 1.46, s.z);
        camera.lookAt(_lookTarget);
        return;
      } else if (viewMode === 'firstPerson') {
        // FIRST-PERSON EYE LEVEL CAMERA
        _camPos.set(
          s.x + Math.sin(s.heading) * 0.18,
          s.y + 1.68,
          s.z + Math.cos(s.heading) * 0.18
        );
        camera.position.copy(_camPos);

        _lookTarget.set(
          s.x + Math.sin(s.heading) * 20.0,
          s.y + 1.65,
          s.z + Math.cos(s.heading) * 20.0
        );
        camera.lookAt(_lookTarget);
        return;
      }

      // ON-FOOT THIRD-PERSON ACTION FOLLOWER CAMERA
      const camDist = 3.2;
      _camPos.set(
        s.x - Math.sin(s.heading) * camDist,
        s.y + 1.85,
        s.z - Math.cos(s.heading) * camDist
      );
      camera.position.lerp(_camPos, 0.24);

      _lookTarget.set(
        s.x + Math.sin(s.heading) * 3.5,
        s.y + 1.35,
        s.z + Math.cos(s.heading) * 3.5
      );
      camera.lookAt(_lookTarget);
      return;
    } else if (viewMode === 'helmetCam') {
      // HELMET-MOUNTED ACTION CAMERA (GOPRO / CHIN-MOUNT POV)
      // Mimics authentic helmet-mounted camera with subtle lens vibrations, velocity-scaled FOV & banking roll
      const eyeHeight = 1.39;
      const fwdOffset = 0.22; // In front of visor/face for clear unobstructed road view

      const time = performance.now() * 0.001;
      const speedAbs = Math.abs(s.speed);
      const speedRatio = Math.min(1.0, speedAbs / 230);

      // 1. Subtle Multi-Harmonic Lens Vibration (Engine pulse + road micro-shudder)
      const engineFreq = 22.0 + s.rpmRatio * 26.0;
      const roadFreq = 34.0 + speedRatio * 18.0;
      const vibeAmp = 0.0015 + speedRatio * 0.0075 + (s.isNitroActive ? 0.0035 : 0);

      const microX = (Math.sin(time * engineFreq) * 0.6 + Math.cos(time * roadFreq) * 0.4) * vibeAmp;
      const microY = (Math.cos(time * engineFreq * 1.1) * 0.65 + Math.sin(time * roadFreq * 0.9) * 0.35) * vibeAmp;
      const microZ = Math.sin(time * (engineFreq + roadFreq) * 0.5) * vibeAmp * 0.4;
      const bumpShudder = this.potholeShake > 0 ? (Math.random() - 0.5) * this.potholeShake * 0.04 : 0;

      _camPos.set(
        s.x + Math.sin(s.heading) * fwdOffset + microX,
        s.y + eyeHeight + vibeY + microY + bumpShudder,
        s.z + Math.cos(s.heading) * fwdOffset + microZ
      );
      camera.position.copy(_camPos);

      // 2. Velocity-Based FOV Scaling (Action lens tunnel-vision speed-rush effect)
      // Standstill: 72° wide action lens. At high speed: expands up to 92° (+5° under nitro)
      const targetFov = 72 + speedRatio * 20 + (s.isNitroActive ? 5 : 0);
      this.currentFov = THREE.MathUtils.lerp(this.currentFov, targetFov, 0.09);

      if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
        const pCam = camera as THREE.PerspectiveCamera;
        if (Math.abs(pCam.fov - this.currentFov) > 0.05) {
          pCam.fov = this.currentFov;
          pCam.updateProjectionMatrix();
        }
      }

      // 3. Look Target with head pitch & banking roll
      const lookDist = 32.0;
      const accelPitch = s.isBraking ? -0.04 : s.pitchAngle * 2.5;

      _lookTarget.set(
        _camPos.x + Math.sin(s.heading) * lookDist,
        _camPos.y - 0.03 + accelPitch + Math.sin(time * engineFreq) * 0.015 * speedRatio,
        _camPos.z + Math.cos(s.heading) * lookDist
      );
      camera.lookAt(_lookTarget);

      // Subtle helmet banking roll (camera tilts with rider lean)
      const targetRoll = -s.leanAngle * 0.36;
      camera.rotation.z = THREE.MathUtils.lerp(camera.rotation.z, targetRoll, 0.22);
      return;
    } else if (viewMode === 'firstPerson') {
      // FIRST-PERSON / COCKPIT DASHBOARD VIEW
      // Placed inside the driver's seat at authentic SUV eye level looking through the windshield
      const eyeHeight = 1.38;
      const fwdOffset = 0.04; // Positioned at driver eye level
      const driverSeatOffset = -0.42; // Left-hand drive seating offset

      _camPos.set(
        s.x + Math.sin(s.heading) * fwdOffset + Math.cos(s.heading) * driverSeatOffset,
        s.y + eyeHeight + vibeY,
        s.z + Math.cos(s.heading) * fwdOffset - Math.sin(s.heading) * driverSeatOffset
      );
      camera.position.copy(_camPos);

      // Long lookahead target along road ahead with subtle pitch
      const lookDist = 40.0;
      _lookTarget.set(
        _camPos.x + Math.sin(s.heading) * lookDist,
        _camPos.y - 0.08 + s.pitchAngle * 3,
        _camPos.z + Math.cos(s.heading) * lookDist
      );
      camera.lookAt(_lookTarget);
    } else if (viewMode === 'close') {
      // DYNAMIC LOW-SLUNG SPORTS CAR ACTION VIEW
      // Tight tracking behind the rear spoiler and diffuser
      const camDist = 3.6;
      const shoulderOffset = 0.25;
      _camPos.set(
        s.x - Math.sin(s.heading) * camDist + Math.cos(s.heading) * shoulderOffset,
        s.y + 1.45 + vibeY,
        s.z - Math.cos(s.heading) * camDist - Math.sin(s.heading) * shoulderOffset
      );
      camera.position.lerp(_camPos, 0.26);

      _lookTarget.set(
        s.x + Math.sin(s.heading) * 8.0,
        s.y + 0.95,
        s.z + Math.cos(s.heading) * 8.0
      );
      camera.lookAt(_lookTarget);
    } else {
      // CHASE VIEW (MODERN SPORTS CAR THIRD-PERSON VIEW)
      // Elevated behind the sports car giving expansive vision of the road and traffic ahead
      const speedExpansion = (Math.abs(s.speed) / 250) * 1.1;
      const camDist = 4.8 + speedExpansion;
      const camHeight = 1.95; // Perfect elevation above car roof (1.24m)

      _camPos.set(
        s.x - Math.sin(s.heading) * camDist,
        s.y + camHeight + vibeY,
        s.z - Math.cos(s.heading) * camDist
      );
      camera.position.lerp(_camPos, 0.22);

      // Dynamic forward lookahead target along road
      const lookAheadDist = 9.5;
      _lookTarget.set(
        s.x + Math.sin(s.heading) * lookAheadDist,
        s.y + 1.15,
        s.z + Math.cos(s.heading) * lookAheadDist
      );
      camera.lookAt(_lookTarget);
    }
  }
}
