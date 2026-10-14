import * as THREE from 'three';

// ============================================================================
// LOCALIZED MOTORCYCLE PHYSICS RIGIDBODIES & SUSPENSION KINEMATICS
// ============================================================================

export interface MotorcycleKinematicsState {
  // Localized Handlebar physics
  handlebarAngle: number;
  handlebarVelocity: number;
  steeringWobble: number;

  // Localized Front Fork Suspension
  forkCompression: number; // 0 (unloaded) to 0.12m (fully compressed)
  forkVelocity: number;

  // Localized Rear Swingarm Suspension
  swingarmAngle: number; // Pivot rotation in radians
  swingarmVelocity: number;

  // Independent Wheel Spin
  frontWheelRotation: number;
  rearWheelRotation: number;
  frontWheelSpeed: number; // km/h
  rearWheelSpeed: number; // km/h

  // Lean-dependent Tire Contact Patch Friction
  effectiveFrontGrip: number;
  effectiveRearGrip: number;
}

export class MotorcycleKinematicsEngine {
  public state: MotorcycleKinematicsState = {
    handlebarAngle: 0,
    handlebarVelocity: 0,
    steeringWobble: 0,
    forkCompression: 0,
    forkVelocity: 0,
    swingarmAngle: 0,
    swingarmVelocity: 0,
    frontWheelRotation: 0,
    rearWheelRotation: 0,
    frontWheelSpeed: 0,
    rearWheelSpeed: 0,
    effectiveFrontGrip: 1.0,
    effectiveRearGrip: 1.0,
  };

  private frontTireRadius = 0.300; // 120/70 ZR17
  private rearTireRadius = 0.315; // 190/55 ZR17
  private forkRestPosition = 0;
  private swingarmRestAngle = 0;

  /**
   * Updates localized physics for handlebars, front forks, rear swingarm,
   * independent wheel spin, and lean-dependent contact patch friction.
   */
  public update(
    delta: number,
    bikeSpeed: number,
    steerInput: number,
    leanAngle: number,
    isBraking: boolean,
    isNitro: boolean,
    bumpImpulse: number = 0
  ) {
    const s = this.state;
    const absSpeed = Math.abs(bikeSpeed);

    // =============================================================
    // 1. LOCALIZED HANDLEBAR DYNAMICS & GYROSCOPIC STABILITY
    // =============================================================
    // Target handlebar steering angle reduces at high speed due to gyroscopic precession
    const gyroFactor = 1.0 / (1.0 + (absSpeed / 30) * 2.2);
    const targetHandlebar = THREE.MathUtils.clamp(steerInput * 0.28 * gyroFactor, -0.28, 0.28);

    // Handlebar spring-damper reaction
    const steerSpring = 35.0;
    const steerDamp = 8.5;
    const steerAccel = (targetHandlebar - s.handlebarAngle) * steerSpring - s.handlebarVelocity * steerDamp;
    s.handlebarVelocity += steerAccel * delta;
    s.handlebarAngle += s.handlebarVelocity * delta;

    // Road bump feedback inducing micro-wobble on handlebars
    if (bumpImpulse > 0.01) {
      s.steeringWobble += (Math.random() - 0.5) * bumpImpulse * 0.15;
    }
    s.steeringWobble = THREE.MathUtils.lerp(s.steeringWobble, 0, delta * 12.0);

    // =============================================================
    // 2. LOCALIZED FRONT FORK COMPRESSION & DAMPING
    // =============================================================
    // Front suspension dives on braking and compresses on road bumps
    const brakeDiveTarget = isBraking ? Math.min(0.065, (absSpeed / 120) * 0.065) : 0;
    const bumpCompressionTarget = Math.min(0.055, bumpImpulse * 0.04);
    const targetFork = brakeDiveTarget + bumpCompressionTarget;

    const forkSpring = 45.0;
    const forkDamp = 9.0;
    const forkAccel = (targetFork - s.forkCompression) * forkSpring - s.forkVelocity * forkDamp;
    s.forkVelocity += forkAccel * delta;
    s.forkCompression = Math.max(0, Math.min(0.08, s.forkCompression + s.forkVelocity * delta));

    // =============================================================
    // 3. LOCALIZED REAR SWINGARM PIVOT & MONOSHOCK KINEMATICS
    // =============================================================
    // Rear swingarm squats under acceleration and rebounds over road undulations
    const squatTarget = absSpeed > 15 && !isBraking ? (isNitro ? 0.045 : 0.028) : (isBraking ? -0.018 : 0);
    const bumpSwingarmTarget = bumpImpulse * 0.035;
    const targetSwingarm = squatTarget - bumpSwingarmTarget;

    const swingarmSpring = 40.0;
    const swingarmDamp = 8.0;
    const swingarmAccel = (targetSwingarm - s.swingarmAngle) * swingarmSpring - s.swingarmVelocity * swingarmDamp;
    s.swingarmVelocity += swingarmAccel * delta;
    s.swingarmAngle = THREE.MathUtils.lerp(s.swingarmAngle, targetSwingarm, delta * 12.0);

    // =============================================================
    // 4. INDEPENDENT WHEEL SPIN & LEAN-DEPENDENT FRICTION
    // =============================================================
    // Rear wheel can slip/spin under heavy throttle or lock under heavy braking
    let rearDriveFactor = 1.0;
    if (isNitro && absSpeed < 80) rearDriveFactor = 1.25; // Power wheelspin
    if (isBraking && absSpeed > 10) rearDriveFactor = 0.88; // Brake slip

    s.rearWheelSpeed = bikeSpeed * rearDriveFactor;
    s.frontWheelSpeed = isBraking ? bikeSpeed * 0.94 : bikeSpeed;

    const frontRotSpeed = (s.frontWheelSpeed / 3.6 / this.frontTireRadius) * delta;
    const rearRotSpeed = (s.rearWheelSpeed / 3.6 / this.rearTireRadius) * delta;

    s.frontWheelRotation += frontRotSpeed;
    s.rearWheelRotation += rearRotSpeed;

    // Contact Patch Friction based on motorcycle lean angle:
    // As bike leans toward tire shoulder, grip profile shifts
    const absLean = Math.abs(leanAngle);
    // Peak grip at 35-42° (0.6 - 0.73 rad) then falls off near maximum lean edge
    if (absLean < 0.65) {
      s.effectiveFrontGrip = 1.0 + absLean * 0.15;
      s.effectiveRearGrip = 1.0 + absLean * 0.20;
    } else {
      const edgeFalloff = (absLean - 0.65) * 1.8;
      s.effectiveFrontGrip = Math.max(0.65, 1.1 - edgeFalloff);
      s.effectiveRearGrip = Math.max(0.60, 1.15 - edgeFalloff);
    }
  }
}
