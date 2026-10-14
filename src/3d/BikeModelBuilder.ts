import * as THREE from 'three';
import { BikeData } from '../types/game';
import { BikeDamageState, DEFAULT_BIKE_DAMAGE, TimeOfDay, WeatherType } from '../types/openCity';
import {
  getProjectorHeadlightTexture,
  getTaillightEmissiveTexture,
  attachVehicleLighting,
  VehicleLightingController,
} from './VehicleLightingSystem';
import { buildProductionMotorcycle, ProductionBikeMeshInstance } from './motorcycle/ProductionMotorcycleMesh';
import { createRiggedRider, RiggedRiderInstance } from './motorcycle/RiderRagdollSystem';
import { MotorcycleKinematicsEngine } from './motorcycle/MotorcycleKinematics';
import { CityWorldInstance } from './CityWorldBuilder';

export interface BikeModelInstance {
  group: THREE.Group;
  frontWheelGroup: THREE.Group;
  rearWheelGroup: THREE.Group;
  steeringGroup: THREE.Group;
  frontForkGroup: THREE.Group;
  suspensionGroup: THREE.Group;
  tailLightMesh: THREE.Mesh;
  headlightMesh: THREE.Mesh;
  exhaustFlameMesh: THREE.Mesh;
  headlightLight: THREE.SpotLight;
  brakeLightMesh: THREE.Mesh;
  neonLight?: THREE.PointLight;
  riderGroup: THREE.Group;
  riderTorso: THREE.Group;
  riderHead: THREE.Group;
  riderLeftLeg: THREE.Group;
  riderRightLeg: THREE.Group;
  riderLeftArm: THREE.Group;
  riderRightArm: THREE.Group;
  kickstandGroup: THREE.Group;
  leftMirrorGroup: THREE.Group;
  rightMirrorGroup: THREE.Group;
  frameMesh: THREE.Group;
  engineMesh: THREE.Group;
  fuelTankMesh: THREE.Mesh;
  swingarmMesh: THREE.Group;
  forkTubesMesh: THREE.Group;
  lighting?: VehicleLightingController;
  kinematics: MotorcycleKinematicsEngine;
  rider: RiggedRiderInstance;
  productionMesh: ProductionBikeMeshInstance;
  setKickstandDeployed: (deployed: boolean) => void;
  setBraking: (braking: boolean) => void;
  applyDamage: (damage: BikeDamageState) => void;
  triggerCrash: (speed: number, worldPos: THREE.Vector3, heading: number) => void;
  updateAnimation: (
    speed: number,
    rpmRatio: number,
    steerInput: number,
    leanAngle: number,
    isBraking: boolean,
    isNitro: boolean,
    delta: number,
    isCrash?: boolean,
    isVictory?: boolean,
    world?: CityWorldInstance
  ) => void;
  updateDayNightAndWeather?: (timeOfDay: TimeOfDay, weather: WeatherType) => void;
  dispose: () => void;
}

export function createBikeModel(
  bikeData: BikeData,
  options: {
    suitColor?: string;
    helmetColor?: string;
    isPlayer?: boolean;
    initialDamage?: BikeDamageState;
    colorOverride?: string;
    rimColorOverride?: string;
    showRider?: boolean;
  } = {}
): BikeModelInstance {
  const root = new THREE.Group();

  // 1. Build Production-Grade 3D Motorcycle Mesh
  const productionMesh = buildProductionMotorcycle(bikeData, {
    colorOverride: options.colorOverride,
    rimColorOverride: options.rimColorOverride,
  });
  root.add(productionMesh.rootGroup);

  // 2. Build Proportionate Rigged Human Rider in Racing Leathers
  const rider = createRiggedRider({
    suitColor: options.suitColor,
    helmetColor: options.helmetColor,
  });

  // Attach rider to motorcycle saddle mount point (at y = 0.78, z = -0.18)
  productionMesh.riderMountPoint.add(rider.group);
  if (options.showRider === false) {
    rider.setVisible(false);
  }

  // 3. Dynamic Underglow & Flame Mesh
  let neonLight: THREE.PointLight | undefined;
  if ((bikeData as any).customization?.hasNeon) {
    const nColorHex = parseInt(((bikeData as any).customization.neonColor || '#00d4ff').replace('#', '0x'));
    neonLight = new THREE.PointLight(nColorHex, 2.8, 4.5, 1.8);
    neonLight.position.set(0, 0.28, 0);
    root.add(neonLight);
  }

  const flameGeo = new THREE.ConeGeometry(0.045, 0.42, 10);
  flameGeo.rotateX(Math.PI / 2);
  const flameMat = new THREE.MeshBasicMaterial({
    color: 0x00f0ff,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
  });
  const exhaustFlameMesh = new THREE.Mesh(flameGeo, flameMat);
  exhaustFlameMesh.position.set(0.24, 0.44, -0.86);
  root.add(exhaustFlameMesh);

  // 4. Dynamic Lighting System (Headlight cone on road + taillight flare sprites)
  const lighting = attachVehicleLighting(root, {
    vehicleType: 'bike',
    bumperFrontZ: 0.95,
    bumperRearZ: -0.72,
    width: 0.68,
    taillightPositions: [{ x: 0, y: 0.90, z: -0.65 }],
  });

  // 5. Physics Kinematics Engine
  const kinematics = new MotorcycleKinematicsEngine();

  let kickstandDeployed = false;
  const setKickstandDeployed = (deployed: boolean) => {
    kickstandDeployed = deployed;
    productionMesh.setKickstand(deployed);
  };

  const setBraking = (braking: boolean) => {
    productionMesh.setBrakeLights(braking);
  };

  const applyDamage = (damage: BikeDamageState) => {
    productionMesh.applyDamageVisuals(damage);
  };

  const initialDamage = options.initialDamage || (bikeData as any).damage || DEFAULT_BIKE_DAMAGE;
  applyDamage(initialDamage);

  // Crash Simulation
  let isCrashing = false;
  let crashTimer = 0;
  let crashSlideRot = 0;

  const triggerCrash = (speed: number, worldPos: THREE.Vector3, heading: number) => {
    isCrashing = true;
    crashTimer = 0;
    crashSlideRot = (Math.random() > 0.5 ? 1 : -1) * (Math.PI / 2.2);

    // Eject rider into ragdoll physics
    const fwdX = Math.sin(heading) * (speed / 3.6);
    const fwdZ = Math.cos(heading) * (speed / 3.6);
    const initialVel = new THREE.Vector3(fwdX, speed * 0.08, fwdZ);
    rider.triggerCrash(initialVel, worldPos, heading);
  };

  // Pre-allocated static vectors to eliminate per-frame garbage collection churn
  const _leftGripWorld = new THREE.Vector3();
  const _rightGripWorld = new THREE.Vector3();
  const _leftPegWorld = new THREE.Vector3();
  const _rightPegWorld = new THREE.Vector3();
  const _rakeAxis = new THREE.Vector3(0, Math.cos(0.42), -Math.sin(0.42)).normalize();

  const updateAnimation = (
    speed: number,
    _rpmRatio: number,
    steerInput: number,
    leanAngle: number,
    isBraking: boolean,
    isNitro: boolean,
    delta: number,
    isCrashParam?: boolean,
    isVictory?: boolean,
    world?: CityWorldInstance
  ) => {
    // Check crash parameter
    if (isCrashParam && !isCrashing) {
      triggerCrash(Math.abs(speed), root.position, root.rotation.y);
    }

    if (isCrashing) {
      crashTimer += delta;

      // Motorcycle slides on its side along the road
      productionMesh.rootGroup.rotation.z = THREE.MathUtils.lerp(
        productionMesh.rootGroup.rotation.z,
        crashSlideRot,
        delta * 6
      );
      productionMesh.rootGroup.position.y = THREE.MathUtils.lerp(
        productionMesh.rootGroup.position.y,
        -0.12,
        delta * 4
      );

      // Update rider ragdoll
      rider.update(delta, 0, 0, 0, false, false, world);

      // Check if crash recovered
      if (!rider.isRagdollActive && crashTimer > 3.0) {
        isCrashing = false;
        crashTimer = 0;
        productionMesh.rootGroup.rotation.z = 0;
        productionMesh.rootGroup.position.y = 0;
        rider.resetToSeated();
      }
      return;
    }

    // Normal Driving Kinematics
    kinematics.update(delta, speed, steerInput, leanAngle, isBraking, isNitro);

    // 1. Wheel spin (pure axle spin around local X)
    productionMesh.frontWheelGroup.rotation.x = kinematics.state.frontWheelRotation;
    productionMesh.rearWheelGroup.rotation.x = kinematics.state.rearWheelRotation;

    // 2. Handlebar steering along mechanical raked fork axis (~24 deg backward rake)
    const RAKE_ANGLE = 0.42; // radians (~24 deg)
    const effectiveSteer = kinematics.state.handlebarAngle + kinematics.state.steeringWobble;
    productionMesh.steeringGroup.quaternion.setFromAxisAngle(_rakeAxis, effectiveSteer);

    // 3. Inverted front fork compression (dives along angled fork tubes)
    const forkCompress = kinematics.state.forkCompression;
    productionMesh.frontForkLowerGroup.position.set(
      0,
      -forkCompress * Math.cos(RAKE_ANGLE),
      forkCompress * Math.sin(RAKE_ANGLE)
    );

    // 4. Rear swingarm pivot & monoshock squat
    productionMesh.swingarmGroup.rotation.x = kinematics.state.swingarmAngle;
    productionMesh.monoshockGroup.scale.y = 1.0 - kinematics.state.swingarmAngle * 0.45;

    // 5. Brake lights & lighting
    setBraking(isBraking);
    lighting.setBraking(isBraking, delta);

    // 6. Nitro exhaust flame
    exhaustFlameMesh.visible = isNitro;
    (exhaustFlameMesh.material as THREE.MeshBasicMaterial).opacity = isNitro ? 0.95 : 0;

    // 7. Rider seated animation + Full Two-Bone Inverse Kinematics (IK)
    if (isVictory) {
      rider.torsoGroup.rotation.x = THREE.MathUtils.lerp(rider.torsoGroup.rotation.x, -0.12, 0.1);
      rider.rightArmGroup.rotation.x = THREE.MathUtils.lerp(rider.rightArmGroup.rotation.x, -2.1, 0.15);
      return;
    }

    rider.update(delta, speed, steerInput, leanAngle, isBraking, kickstandDeployed, world);

    // Inverse Kinematics (IK) locks rider wrists to handlebars and ankles to footpegs with zero slip
    if (rider.state === 'SEATED') {
      // Force fresh matrix hierarchy calculation after steering and chassis kinematics
      productionMesh.rootGroup.updateMatrixWorld(true);

      productionMesh.leftGripMarker.getWorldPosition(_leftGripWorld);
      productionMesh.rightGripMarker.getWorldPosition(_rightGripWorld);
      productionMesh.leftPegMarker.getWorldPosition(_leftPegWorld);
      productionMesh.rightPegMarker.getWorldPosition(_rightPegWorld);

      rider.solveIK(_leftGripWorld, _rightGripWorld, _leftPegWorld, _rightPegWorld);
    }
  };

  const dispose = () => {
    productionMesh.dispose();
    rider.dispose();
    lighting.dispose();
    flameGeo.dispose();
    flameMat.dispose();
    root.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const m = obj as THREE.Mesh;
        m.geometry?.dispose();
        if (Array.isArray(m.material)) m.material.forEach((mat) => mat.dispose());
        else m.material?.dispose();
      }
    });
  };

  return {
    group: root,
    frontWheelGroup: productionMesh.frontWheelGroup,
    rearWheelGroup: productionMesh.rearWheelGroup,
    steeringGroup: productionMesh.steeringGroup,
    frontForkGroup: productionMesh.frontForkLowerGroup,
    suspensionGroup: productionMesh.swingarmGroup,
    tailLightMesh: productionMesh.tailLightMesh,
    headlightMesh: productionMesh.headlightMesh,
    exhaustFlameMesh,
    headlightLight: productionMesh.headlightLight,
    brakeLightMesh: productionMesh.tailLightMesh,
    neonLight,
    riderGroup: rider.group,
    riderTorso: rider.torsoGroup,
    riderHead: rider.headGroup,
    riderLeftLeg: rider.leftLegGroup,
    riderRightLeg: rider.rightLegGroup,
    riderLeftArm: rider.leftArmGroup,
    riderRightArm: rider.rightArmGroup,
    kickstandGroup: productionMesh.kickstandGroup,
    leftMirrorGroup: productionMesh.leftMirrorGroup,
    rightMirrorGroup: productionMesh.rightMirrorGroup,
    frameMesh: productionMesh.frameGroup,
    engineMesh: productionMesh.engineGroup,
    fuelTankMesh: productionMesh.fuelTankMesh,
    swingarmMesh: productionMesh.swingarmGroup,
    forkTubesMesh: productionMesh.frontForkLowerGroup,
    lighting,
    kinematics,
    rider,
    productionMesh,
    setKickstandDeployed,
    setBraking,
    applyDamage,
    triggerCrash,
    updateAnimation,
    updateDayNightAndWeather: (timeOfDay: TimeOfDay, weather: WeatherType) => {
      lighting.updateDayNightAndWeather(timeOfDay, weather);
    },
    dispose,
  };
}
