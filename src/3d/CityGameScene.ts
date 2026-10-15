import * as THREE from 'three';
import {
  OpenCityBike,
  CityMission,
  TimeOfDay,
  WeatherType,
  CameraView,
  DistrictType,
  WantedState,
  BikeDamageState,
  DEFAULT_BIKE_DAMAGE,
} from '../types/openCity';
import { BikeModelInstance, createBikeModel } from './BikeModelBuilder';
import { ModernCarInstance, createModernCarModel, CarDesignStyle, AutomotiveDriveMode } from './ModernCarBuilder';
import { CityWorldInstance, buildCityWorld } from './CityWorldBuilder';
import { OpenWorldPhysicsEngine, OpenCityPlayerState } from '../game/OpenWorldPhysics';
import { CityTrafficManager } from '../game/CityTraffic';
import { PedestrianManager } from '../game/PedestrianManager';
import { MissionManager } from '../game/MissionManager';
import { cityAudio } from '../audio/CityAudioEngine';
import { calculateEffectiveStats } from '../data/openCityCatalog';
import { RoadHazardSystem } from './RoadHazardSystem';
import { HighwayTollSystem } from './HighwayTollSystem';
import { DynamicWeatherEffects } from './DynamicWeatherEffects';
import { DressingStyle } from './motorcycle/RiderRagdollSystem';
import { globalReplayRecorder, SavedReplayClip, ReplayFrame } from '../game/ReplayRecorder';
import { CinematicCameraAngle } from '../components/ReplayModal';
import { PropCarManager } from './PropCarManager';
import { DynamicSunShadowSystem } from './DynamicSunShadowSystem';
import { ModernKidCompanionDrone, DroneSkinId } from './ModernKidCompanionDrone';
import { ModernKidCollectiblesSystem, CollectiblePickupResult } from './ModernKidCollectiblesSystem';

export interface CityGameSceneCallbacks {
  onMissionComplete: (mission: CityMission, rewardCash: number, rewardXp: number) => void;
  onMissionFail: (reason: string) => void;
  onStuntReward: (score: number, label: string) => void;
  onDistrictChange: (district: DistrictType) => void;
  onInfraction?: (type: string, description: string, stars: number) => void;
  onEvadeSuccess?: (rewardCash: number) => void;
  onRadioChatter?: (msg: string) => void;
  onTollPaid?: (fee: number) => void;
  onTollWarning?: (msg: string) => void;
  onPotholeHit?: (severity: 'minor' | 'major', speedLoss: number) => void;
  onBikeDamage?: (damage: BikeDamageState) => void;
  onMountTransition?: (state: 'NONE' | 'MOUNTING' | 'DISMOUNTING', progress: number) => void;
  onKidCollectibleCollected?: (result: CollectiblePickupResult) => void;
  onWebglStatus?: (supported: boolean) => void;
}

export interface CityGameSceneInstance {
  toggleCompanionDrone?: (enabled: boolean) => void;
  setDroneSkin?: (skin: DroneSkinId) => void;
  getCollectiblesStatus?: () => { total: number; active: number; totalCollected: number };
  start: () => void;
  stop: () => void;
  updateInputs: (inputs: {
    throttle: number;
    brake: number;
    steer: number;
    nitro: boolean;
    wheelie: boolean;
    reverse: boolean;
    gear?: string;
  }) => void;
  setCameraView: (view: CameraView) => void;
  setTimeAndWeather: (time: TimeOfDay, weather: WeatherType) => void;
  startMission: (mission: CityMission) => void;
  cancelMission: () => void;
  toggleMount: () => void;
  honkHorn: () => void;
  setDressingStyle: (style: DressingStyle) => void;
  getDressingStyle: () => DressingStyle;
  toggleHelmet: () => boolean;
  setHelmetVisible: (visible: boolean) => void;
  isHelmetVisible: () => boolean;
  teleportTo: (x: number, z: number) => void;
  setBike: (bike: OpenCityBike) => void;
  repairBike: () => void;
  getBikeDamage: () => BikeDamageState;
  setPhotoMode: (active: boolean) => void;
  updatePhotoCamera: (params: {
    orbitAngle: number;
    pitchAngle: number;
    distance: number;
    height: number;
    fov: number;
    roll: number;
  }) => void;
  captureScreenshot: () => string;
  getPlayerState: () => OpenCityPlayerState;
  getWantedState: () => WantedState;
  getActiveMission: () => CityMission | null;
  getMissionTimeRemaining: () => number;
  setCarStyle: (style: CarDesignStyle) => void;
  getCarStyle: () => CarDesignStyle;
  setDriveMode: (mode: AutomotiveDriveMode) => void;
  setAmbientLightColor: (colorHex: string) => void;
  getDriveMode: () => AutomotiveDriveMode;
  getAmbientLightColor: () => string;
  getActiveAeroAngle: () => number;
  getActiveAeroDownforceKg: () => number;
  isAirbrakeActive: () => boolean;
  triggerGearShift: (gear?: string, isDownshift?: boolean) => void;
  getCurrentGear: () => string;
  startReplay: (clip?: SavedReplayClip) => void;
  stopReplay: () => void;
  seekReplay: (time: number) => void;
  setReplayPlaying: (playing: boolean) => void;
  setReplaySpeed: (speed: number) => void;
  setReplayLooping: (loop: boolean) => void;
  setReplayCameraAngle: (angle: CinematicCameraAngle) => void;
  getReplayTime: () => number;
  getReplayDuration: () => number;
  isReplayActive: () => boolean;
  getReplayTelemetry: () => {
    speed: number;
    gear: string;
    rpmRatio: number;
    aeroAngle: number;
    downforceKg: number;
    isAirbrake: boolean;
    carStyle: CarDesignStyle;
    driveMode: AutomotiveDriveMode;
  } | null;
  setGraphicsQuality: (quality: 'low' | 'medium' | 'high' | 'ultra') => void;
  dispose: () => void;
}

export function createSafeWebGLRenderer(
  canvas: HTMLCanvasElement,
  onStatus?: (supported: boolean) => void
): THREE.WebGLRenderer {
  const contextAttrs: WebGLContextAttributes = {
    powerPreference: 'high-performance',
    failIfMajorPerformanceCaveat: false,
    antialias: false,
    alpha: false,
    depth: true,
  };

  let gl: RenderingContext | null = null;
  try {
    gl = canvas.getContext('webgl2', contextAttrs);
  } catch {}

  if (!gl) {
    try {
      gl = canvas.getContext('webgl', contextAttrs) || canvas.getContext('experimental-webgl', contextAttrs);
    } catch {}
  }

  if (gl) {
    try {
      const r = new THREE.WebGLRenderer({
        canvas,
        context: gl as any,
        antialias: false,
        powerPreference: 'high-performance',
      });
      r.debug.checkShaderErrors = false;
      onStatus?.(true);
      return r;
    } catch {}
  }

  // Safe fallback mock renderer if the browser has temporarily blocked WebGL
  onStatus?.(false);
  return {
    domElement: canvas,
    debug: { checkShaderErrors: false },
    shadowMap: { enabled: false, type: 0 },
    toneMapping: 0,
    toneMappingExposure: 1.0,
    setSize: (w: number, h: number) => {
      canvas.width = w;
      canvas.height = h;
    },
    setPixelRatio: () => {},
    render: () => {},
    dispose: () => {},
    getContext: () => null,
  } as unknown as THREE.WebGLRenderer;
}

export function createCityGameScene(
  container: HTMLElement,
  initialBike: OpenCityBike,
  callbacks: CityGameSceneCallbacks
): CityGameSceneInstance {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    65,
    container.clientWidth / container.clientHeight,
    0.1,
    1800
  );

  // Remove any stale canvases or elements from previous hot reloads
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  container.appendChild(canvas);

  const renderer = createSafeWebGLRenderer(canvas, callbacks.onWebglStatus);

  // Prevent browser context loss blacklisting & handle suspend/resume
  const handleContextLost = (e: Event) => {
    e.preventDefault();
    console.warn('WebGL context lost. Pausing render loop.');
    stop();
  };
  const handleContextRestored = () => {
    console.log('WebGL context restored. Resuming render loop.');
    start();
  };
  canvas.addEventListener('webglcontextlost', handleContextLost, false);
  canvas.addEventListener('webglcontextrestored', handleContextRestored, false);

  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(1.0); // Maintain locked 1.0 pixel ratio for maximum framerate and zero lag
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.BasicShadowMap; // BasicShadowMap is significantly faster
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.30;

  // 1. Build City Open World
  const world = buildCityWorld(scene);
  scene.add(world.sunLight.target);

  // Dynamic Sun & Shadow Engine: calculates solar angles, shadow camera frustum, bias, softness, and light shifts
  const sunShadowSystem = new DynamicSunShadowSystem(
    world.sunLight,
    world.ambientLight,
    world.hemiLight,
    scene.fog
  );

  // 2. Build Player Vehicle (Modern Sports Car & Bike Support)
  let currentBike = initialBike;
  let currentDamage: BikeDamageState = currentBike.damage ? { ...currentBike.damage } : { ...DEFAULT_BIKE_DAMAGE };
  let bikeModel = createBikeModel(currentBike as any, { isPlayer: true, initialDamage: currentDamage });
  scene.add(bikeModel.group);
  
  // Create modern sports car as vehicle option (BMW M or Mercedes-Benz AMG)
  const initialStyle: CarDesignStyle =
    currentBike.id.includes('benz') || currentBike.brand?.toUpperCase().includes('BENZ') || currentBike.brand?.toUpperCase().includes('MERCEDES')
      ? 'benz_amg'
      : 'bmw_m';
  let playerCar = createModernCarModel({
    bodyColor: currentBike.customization?.bodyColor || (initialStyle === 'bmw_m' ? '#1d4ed8' : '#090a0f'),
    rimColor: currentBike.customization?.rimColor || '#1e293b',
    isPlayer: true,
    carStyle: initialStyle,
    onGearShift: (_gear, isDownshift) => {
      cityAudio.playGearShiftClick(isDownshift);
    },
  });
  scene.add(playerCar.group);

  // Set initial visibility based on selected vehicle
  const isSupercar = currentBike.category === 'German Supercar';
  playerCar.group.visible = isSupercar;
  bikeModel.group.visible = !isSupercar;

  // Modern Kid Companion Drone (AeroBot Sky-Buddy)
  const kidDrone = new ModernKidCompanionDrone(scene);

  // Modern Kid Collectibles System (Boba tea, Prime hydration, Golden skateboards, Gamer Headset)
  const kidCollectibles = new ModernKidCollectiblesSystem(scene, (pickup) => {
    callbacks.onKidCollectibleCollected?.(pickup);
    kidDrone.triggerStuntCheer();
    callbacks.onStuntReward(pickup.xpReward, `COLLECTED ${pickup.name.toUpperCase()}!`);
  });

  // 3. Dynamic Weather Visual Effects System (Rain particles, road splashes, puddles, tire spray)
  const weatherEffects = new DynamicWeatherEffects(scene);

  // 4. Physics Engine
  const stats = calculateEffectiveStats(currentBike);
  const physics = new OpenWorldPhysicsEngine(stats, world);
  physics.reset(7.6, 20, 0);

  // 5. Traffic & Pedestrian Managers
  const traffic = new CityTrafficManager(scene, {
    onInfraction: (type, desc, stars) => callbacks.onInfraction?.(type, desc, stars),
    onEvadeSuccess: (reward) => callbacks.onEvadeSuccess?.(reward),
    onRadioChatter: (msg) => callbacks.onRadioChatter?.(msg),
  });
  traffic.initTraffic(42);

  const pedestrians = new PedestrianManager(scene);
  pedestrians.initPedestrians(32);

  // 6. Parked Prop Cars Manager (Street & Parking Lot Prop Cars)
  const propCarManager = new PropCarManager(scene, world.obstacles);
  propCarManager.initPropCars();

  // Horn alert timer for pedestrian reactions
  let hornTimer = 0;

  // Collision Impact Handler (arcade bumper physics - no critical damage or dismounting)
  let lastCrashTime = 0;
  const applyCollisionImpact = (speed: number) => {
    const now = performance.now();
    if (speed < 18 || now - lastCrashTime < 600) return;
    lastCrashTime = now;

    cityAudio.playCrash(speed > 60 ? 'heavy' : 'light');

    // Keep vehicle at pristine 0% damage - no red screen or critical damage warnings
    currentDamage.overallDamage = 0;
    currentDamage.fairingScratches = 0;
    currentDamage.fairingCracks = 0;
    currentDamage.leftMirrorMissing = false;
    currentDamage.rightMirrorMissing = false;
    currentDamage.headlightCracked = false;

    callbacks.onBikeDamage?.(currentDamage);
  };

  // 6. Missions Coordinator
  const missions = new MissionManager(scene);

  // 7. Procedural Road Hazard System (Potholes)
  const roadHazards = new RoadHazardSystem(scene);
  roadHazards.initHazards();

  // 8. FASTag Highway Toll Booth System
  const tollPlaza = new HighwayTollSystem(scene, {
    onTollPaid: (fee) => {
      callbacks.onTollPaid?.(fee);
    },
    onTollWarning: (msg) => {
      callbacks.onTollWarning?.(msg);
    },
    onTollViolation: () => {
      callbacks.onInfraction?.('TOLL VIOLATION', 'Speeding through closed FASTag gate (+1 Star)', 1);
    },
  });

  // Scene state
  let animId: number | null = null;
  let isRunning = false;
  let currentCameraView: CameraView = 'chase';
  let currentTimeOfDay: TimeOfDay = 'afternoon';
  let currentWeather: WeatherType = 'clear';
  sunShadowSystem.setTimeOfDay(currentTimeOfDay, true);
  bikeModel.updateDayNightAndWeather?.(currentTimeOfDay, currentWeather);
  traffic.updateLighting(currentTimeOfDay, currentWeather);
  let currentDistrict: DistrictType = 'downtown';
  let templeBellTimer = 4.0;
  let streetLampCullTimer = 0.2;
  let isPhotoMode = false;
  let photoParams = {
    orbitAngle: 0,
    pitchAngle: 0.2,
    distance: 4.2,
    height: 0.8,
    fov: 55,
    roll: 0,
  };

  // Replay System State
  let isReplaying = false;
  let replayTime = 0;
  let replayDuration = 0;
  let isReplayPlaying = true;
  let replaySpeed = 1.0;
  let replayCameraAngle: CinematicCameraAngle = 'tv_broadcast';
  let replayIsLooping = true;
  const broadcastCameraPos = new THREE.Vector3();
  let broadcastAnchorTime = 0;
  let lastReplayFrame: ReplayFrame | null = null;

  const updateReplayCamera = (frame: ReplayFrame, dt: number) => {
    switch (replayCameraAngle) {
      case 'tv_broadcast': {
        camera.fov = 38;
        camera.updateProjectionMatrix();
        const distToCam = Math.hypot(frame.x - broadcastCameraPos.x, frame.z - broadcastCameraPos.z);
        if (distToCam > 48 || distToCam < 4 || broadcastAnchorTime <= 0) {
          broadcastCameraPos.set(
            frame.x + Math.cos(frame.heading) * 18 - Math.sin(frame.heading) * 12,
            frame.y + 4.2,
            frame.z - Math.sin(frame.heading) * 18 - Math.cos(frame.heading) * 12
          );
          broadcastAnchorTime = 6.0;
        }
        broadcastAnchorTime -= dt;
        camera.position.lerp(broadcastCameraPos, 0.12);
        camera.lookAt(frame.x, frame.y + 0.9, frame.z);
        break;
      }
      case 'wheel_apex': {
        camera.fov = 78;
        camera.updateProjectionMatrix();
        const wheelOffset = new THREE.Vector3(
          Math.cos(frame.heading) * 1.35 - Math.sin(frame.heading) * 1.45,
          0.36,
          -Math.sin(frame.heading) * 1.35 - Math.cos(frame.heading) * 1.45
        );
        camera.position.set(frame.x + wheelOffset.x, frame.y + wheelOffset.y, frame.z + wheelOffset.z);
        camera.lookAt(
          frame.x + Math.sin(frame.heading) * 3.8,
          frame.y + 0.52,
          frame.z + Math.cos(frame.heading) * 3.8
        );
        break;
      }
      case 'flyby_orbit': {
        camera.fov = 62;
        camera.updateProjectionMatrix();
        const orbitAngle = replayTime * 0.95;
        camera.position.set(
          frame.x + Math.sin(orbitAngle) * 7.2,
          frame.y + 1.85,
          frame.z + Math.cos(orbitAngle) * 7.2
        );
        camera.lookAt(frame.x, frame.y + 0.85, frame.z);
        break;
      }
      case 'heli_drone': {
        camera.fov = 54;
        camera.updateProjectionMatrix();
        const droneTarget = new THREE.Vector3(
          frame.x - Math.sin(frame.heading) * 13,
          frame.y + 15,
          frame.z - Math.cos(frame.heading) * 13
        );
        camera.position.lerp(droneTarget, 0.14);
        camera.lookAt(frame.x, frame.y + 0.5, frame.z);
        break;
      }
      case 'cockpit_interior': {
        camera.fov = 72;
        camera.updateProjectionMatrix();
        const dx = -Math.cos(frame.heading) * 0.38 + Math.sin(frame.heading) * 0.12;
        const dy = 1.05;
        const dz = Math.sin(frame.heading) * 0.38 + Math.cos(frame.heading) * 0.12;
        camera.position.set(frame.x + dx, frame.y + dy, frame.z + dz);
        camera.lookAt(
          frame.x + Math.sin(frame.heading) * 12,
          frame.y + dy - 0.08,
          frame.z + Math.cos(frame.heading) * 12
        );
        break;
      }
      case 'cinematic_chase':
      default: {
        camera.fov = 68;
        camera.updateProjectionMatrix();
        const chaseTarget = new THREE.Vector3(
          frame.x - Math.sin(frame.heading) * 6.2,
          frame.y + 1.48,
          frame.z - Math.cos(frame.heading) * 6.2
        );
        camera.position.lerp(chaseTarget, 0.22);
        camera.lookAt(
          frame.x + Math.sin(frame.heading) * 2.5,
          frame.y + 0.75,
          frame.z + Math.cos(frame.heading) * 2.5
        );
        break;
      }
    }
  };

  let currentTransmissionGear = 'D1';
  const currentInputs = {
    throttle: 0,
    brake: 0,
    steer: 0,
    nitro: false,
    wheelie: false,
    reverse: false,
    gear: 'D1',
  };

  const parkedBikePos = new THREE.Vector3(0, 0, 20);
  let parkedBikeHeading = 0;

  // Cinematic Leg-Swing Mounting & Dismounting Transition State
  let mountTransitionState: 'NONE' | 'DISMOUNTING' | 'MOUNTING' = 'NONE';
  let mountTransitionProgress = 0;
  let lastReportedPct = -1;
  let footstepTimer = 0;
  let isAutoStoppingToDismount = false;
  const mountStartPos = new THREE.Vector3();
  const mountEndPos = new THREE.Vector3();

  const clock = new THREE.Clock();

  // Animation Loop
  const animate = () => {
    animId = requestAnimationFrame(animate);
    if (!isRunning) return;

    if (isPhotoMode) {
      // Freeze simulation, freely orbit camera around player
      const s = physics.state;
      const targetPos = new THREE.Vector3(s.x, s.y + photoParams.height, s.z);

      const radPitch = photoParams.pitchAngle;
      const radOrbit = s.heading + photoParams.orbitAngle;

      const camX = s.x + Math.sin(radOrbit) * Math.cos(radPitch) * photoParams.distance;
      const camZ = s.z + Math.cos(radOrbit) * Math.cos(radPitch) * photoParams.distance;
      const camY = s.y + photoParams.height + Math.sin(radPitch) * photoParams.distance;

      camera.position.set(camX, Math.max(s.y + 0.1, camY), camZ);
      camera.lookAt(targetPos);
      camera.fov = photoParams.fov;
      camera.rotation.z += photoParams.roll;
      camera.updateProjectionMatrix();

      sunShadowSystem.update(0.016, currentTimeOfDay, s.x, s.y, s.z);
      renderer.render(scene, camera);
      return;
    }

    const delta = Math.min(0.05, clock.getDelta());
    const time = clock.getElapsedTime();

    // Cinematic Replay System Playback Loop
    if (isReplaying) {
      if (isReplayPlaying) {
        replayTime += delta * replaySpeed;
        if (replayTime > replayDuration) {
          if (replayIsLooping) {
            replayTime = 0;
          } else {
            replayTime = replayDuration;
            isReplayPlaying = false;
          }
        }
      }

      const frame = globalReplayRecorder.interpolateFrame(replayTime);
      if (frame) {
        lastReplayFrame = frame;
        playerCar.group.position.set(frame.x, frame.y, frame.z);
        playerCar.group.rotation.set(0, 0, 0);
        playerCar.group.rotateY(frame.heading);
        playerCar.group.rotateX(frame.pitch * 0.4);
        playerCar.group.rotateZ(frame.roll * 0.3);

        playerCar.setBraking(frame.isBraking);
        playerCar.updateAnimation(
          frame.speed,
          frame.rpmRatio,
          frame.steer,
          frame.isBraking,
          frame.isNitro,
          delta,
          currentTimeOfDay,
          currentWeather,
          frame.throttle,
          frame.gear === 'R'
        );

        cityAudio.updateEngine(frame.rpmRatio, frame.throttle, frame.speed);
        updateReplayCamera(frame, delta);

        sunShadowSystem.update(delta, currentTimeOfDay, frame.x, frame.y, frame.z);
      }

      world.skyDome.position.copy(camera.position);
      renderer.render(scene, camera);
      return;
    }

    // 1. Update Physics
    const effectiveInputs = mountTransitionState !== 'NONE'
      ? { throttle: 0, brake: 1, steer: 0, nitro: false, wheelie: false, reverse: false, gear: 'P' }
      : { ...currentInputs, gear: currentTransmissionGear };

    physics.update(
      delta,
      effectiveInputs,
      (score, label) => {
        cityAudio.playStuntChime();
        callbacks.onStuntReward(score, label);
      },
      (impactSpeed) => {
        applyCollisionImpact(impactSpeed);
      }
    );

    const s = physics.state;

    // Smooth auto-stopping deceleration before dismounting
    if (isAutoStoppingToDismount && s.isOnBike) {
      s.isBraking = true;
      s.speed = THREE.MathUtils.lerp(s.speed, 0, delta * 12.0);
      if (Math.abs(s.speed) < 1.0) {
        s.speed = 0;
        isAutoStoppingToDismount = false;
        executeDismount();
      }
    }

    // Play authentic tire screech audio when drifting / powersliding through corners
    if (s.isDrifting && Math.abs(s.speed) > 28) {
      if (Math.random() < 0.28) {
        cityAudio.playTireScreech(Math.min(1.0, 0.5 + s.slipRatio * 0.5));
      }
    }

    // 2. Update District
    const dist = world.getDistrictAtPosition(s.x, s.z);
    if (dist !== currentDistrict) {
      currentDistrict = dist;
      callbacks.onDistrictChange(dist);
    }

    // 3. Update Bike & Human Athlete 3D Transforms
    if (mountTransitionState !== 'NONE') {
      // Cinematic mounting/dismounting interpolation sequence (Smooth athletic timing)
      mountTransitionProgress += delta * 1.15; // ~1.8-2.0s complete sequence
      const t = Math.min(1.0, mountTransitionProgress);
      const easeT = t * t * (3 - 2 * t); // Smooth cubic ease-in-out

      // Fire state progress callback to HUD throttled to percentage changes
      const pct = Math.round(t * 100);
      if (pct !== lastReportedPct) {
        lastReportedPct = pct;
        callbacks.onMountTransition?.(mountTransitionState, t);
      }

      bikeModel.group.position.set(parkedBikePos.x, parkedBikePos.y, parkedBikePos.z);
      bikeModel.group.rotation.set(0, 0, 0);
      bikeModel.group.rotateY(parkedBikeHeading);
      bikeModel.group.rotateZ(0.12 * (1.0 - (mountTransitionState === 'MOUNTING' ? easeT : 0)));
      bikeModel.setKickstandDeployed(true);

      const currentX = THREE.MathUtils.lerp(mountStartPos.x, mountEndPos.x, easeT);
      const currentY = THREE.MathUtils.lerp(mountStartPos.y, mountEndPos.y, easeT);
      const currentZ = THREE.MathUtils.lerp(mountStartPos.z, mountEndPos.z, easeT);
      bikeModel.rider.group.position.set(currentX, currentY, currentZ);
      bikeModel.rider.group.rotation.set(0, parkedBikeHeading, 0);

      // Dedicated Human Biomechanical Kinematics solver:
      bikeModel.rider.animateMountTransition(mountTransitionState, t);

      if (t >= 1.0) {
        if (mountTransitionState === 'DISMOUNTING') {
          mountTransitionState = 'NONE';
          lastReportedPct = -1;
          callbacks.onMountTransition?.('NONE', 1.0);

          // 1. Toggle physics to on-foot
          physics.toggleMount();

          // 2. Set physics state to exact dismount position
          physics.state.x = mountEndPos.x;
          physics.state.y = mountEndPos.y;
          physics.state.z = mountEndPos.z;
          physics.state.heading = parkedBikeHeading;
          physics.state.speed = 0;

          // 3. Set rider on foot at exact location
          bikeModel.rider.setOnFoot(true, mountEndPos, parkedBikeHeading);
        } else if (mountTransitionState === 'MOUNTING') {
          mountTransitionState = 'NONE';
          lastReportedPct = -1;
          callbacks.onMountTransition?.('NONE', 1.0);

          scene.remove(bikeModel.rider.group);
          bikeModel.productionMesh.riderMountPoint.add(bikeModel.rider.group);
          bikeModel.rider.setOnFoot(false);
          bikeModel.rider.resetToSeated();
          bikeModel.setKickstandDeployed(false);

          // 1. Toggle physics to on-bike
          physics.toggleMount();

          // 2. Set physics state to exact parked bike position
          physics.state.x = parkedBikePos.x;
          physics.state.y = parkedBikePos.y;
          physics.state.z = parkedBikePos.z;
          physics.state.heading = parkedBikeHeading;
          physics.state.speed = 0;
          physics.state.leanAngle = 0;

          cityAudio.startEngine(currentBike.soundType);
        }
      }
    } else if (s.isOnBike) {
      if (playerCar.group.visible) {
        // Modern Car Driving Mode
        playerCar.group.position.set(s.x, s.y, s.z);
        playerCar.group.rotation.set(0, 0, 0);
        playerCar.group.rotateY(s.heading);
        playerCar.group.rotateX(s.pitchAngle * 0.4);

        playerCar.setBraking(s.isBraking);
        playerCar.updateAnimation(
          s.speed,
          s.rpmRatio,
          currentInputs.steer,
          s.isBraking,
          s.isNitroActive,
          delta,
          currentTimeOfDay,
          currentWeather,
          currentInputs.throttle,
          currentInputs.reverse
        );
        // Synchronize active aerodynamic downforce and airbrake to physics engine
        const downforceKg = playerCar.getActiveAeroDownforceKg();
        const aeroAngle = playerCar.getActiveAeroAngle();
        const isAirbrake = playerCar.isAirbrakeActive();
        physics.setAeroDownforce(aeroAngle, downforceKg, isAirbrake);

        // Record driving timeline frame for 30-second Cinematic Replay
        globalReplayRecorder.recordFrame(
          s,
          currentInputs,
          {
            gear: playerCar.getCurrentGear?.() || (Math.abs(s.speed) < 1 ? 'P' : 'D1'),
            aeroAngle,
            downforceKg,
            isAirbrake,
            carStyle: playerCar.carStyle,
            driveMode: playerCar.driveMode,
            ambientColor: playerCar.ambientLightColor,
          },
          delta
        );
      } else {
        // Motorcycle / Kid Cyber-Glider Driving Mode
        bikeModel.group.position.set(s.x, s.y, s.z);
        bikeModel.group.rotation.set(0, 0, 0);
        bikeModel.group.rotateY(s.heading);
        bikeModel.group.rotateZ(-s.leanAngle * (Math.PI / 180));
        bikeModel.group.rotateX(s.pitchAngle);

        bikeModel.setBraking(s.isBraking);
        bikeModel.updateAnimation(
          s.speed,
          s.rpmRatio,
          currentInputs.steer,
          s.leanAngle,
          s.isBraking,
          s.isNitroActive,
          delta,
          false,
          false,
          world
        );
      }
    } else {
      // Autonomous On-Foot Human Mode:
      // A. Keep parked modern car stationary at its parked spot
      playerCar.group.position.set(parkedBikePos.x, parkedBikePos.y, parkedBikePos.z);
      playerCar.group.rotation.set(0, 0, 0);
      playerCar.group.rotateY(parkedBikeHeading);
      playerCar.setBraking(false);

      // B. Human athlete runs separately across terrain, roads, sidewalks
      bikeModel.rider.group.position.set(s.x, s.y, s.z);
      bikeModel.rider.group.rotation.set(0, s.heading, 0);

      const isMoving = Math.abs(s.speed) > 0.3;
      const isSprinting = currentInputs.nitro;

      if (isMoving) {
        footstepTimer -= delta;
        if (footstepTimer <= 0) {
          cityAudio.playFootstep(isSprinting);
          footstepTimer = isSprinting ? 0.28 : 0.48;
        }
      } else {
        footstepTimer = 0.1;
      }

      bikeModel.rider.update(
        delta,
        s.speed,
        currentInputs.steer,
        0,
        false,
        false,
        world,
        {
          isMoving,
          moveSpeed: s.speed,
          steer: currentInputs.steer,
          isSprinting,
        }
      );
    }

    // 4. Check Road Pothole Hazards Impact
    const hazardHit = roadHazards.checkHazardImpact(s.x, s.z, Math.abs(s.speed), time);
    if (hazardHit.hit) {
      physics.applyPotholeImpact(hazardHit.speedLoss, hazardHit.shakeIntensity);
      cityAudio.playPotholeThud();
      callbacks.onPotholeHit?.(hazardHit.severity || 'minor', hazardHit.speedLoss);
    }

    // 5. Update Highway FASTag Toll Plaza System
    tollPlaza.update(s.x, s.z, Math.abs(s.speed), delta);

    // 6. Check Traffic Collision & Apply Visual Damage
    const hit = traffic.checkPlayerCollision(s.x, s.z);
    if (hit.collided) {
      applyCollisionImpact(Math.abs(s.speed));
      cityAudio.playTireScreech(0.85);
      s.speed = -s.speed * 0.25;
    }

    // 7. Check Parked Prop Car Collision & Alarm Reaction
    const propHit = propCarManager.handleCollisionWithPlayer(s.x, s.z, s.speed);
    if (propHit && Math.abs(s.speed) > 16) {
      applyCollisionImpact(Math.abs(s.speed));
      cityAudio.playCrash('heavy');
      callbacks.onInfraction?.('VEHICLE ALARM TRIGGERED', `Impact with parked ${propHit.data.name}!`, 1);
    }
    propCarManager.update(delta, currentTimeOfDay, currentWeather);

    // 8. Update Traffic & Pedestrians with AI Behavior System
    traffic.update(
      delta,
      s.x,
      s.z,
      s.heading,
      Math.abs(s.speed),
      s.wheelieAngle > 0.1 || !s.isGrounded,
      currentDistrict
    );
    s.wantedLevel = traffic.wantedState.level;

    if (hornTimer > 0) hornTimer -= delta;
    pedestrians.update(delta, s.x, s.z, Math.abs(s.speed), hornTimer > 0);

    // 8. Update Police Siren Audio
    cityAudio.setPoliceSiren(s.wantedLevel > 0);

    // 9. Update Engine Audio
    cityAudio.updateEngine(s.rpmRatio, currentInputs.throttle, s.speed);

    // 9b. Periodic sacred temple bell chime near Dravidian Temple Gopuram landmark
    templeBellTimer -= delta;
    if (templeBellTimer <= 0) {
      const distToTemple = Math.hypot(s.x - 42, s.z - 260);
      if (distToTemple < 75) {
        cityAudio.playTempleBell();
        templeBellTimer = 18.0;
      } else {
        templeBellTimer = 2.0;
      }
    }

    // 10. Update Active Mission Checkpoints
    missions.update(
      delta,
      s.x,
      s.z,
      s.stuntScore,
      (m, cash, xp) => {
        cityAudio.playCashSound();
        callbacks.onMissionComplete(m, cash, xp);
      },
      (reason) => {
        callbacks.onMissionFail(reason);
      }
    );

    // 11. Center sky dome and throttle nearby street lights at sunset/night
    world.skyDome.position.copy(camera.position);
    if (currentTimeOfDay === 'night' || currentTimeOfDay === 'sunset') {
      streetLampCullTimer -= delta;
      if (streetLampCullTimer <= 0) {
        world.updateNearbyStreetLamps?.(camera.position, currentTimeOfDay === 'night' ? 3.2 : 1.6);
        streetLampCullTimer = 0.35;
      }
    }

    // 12. Update Dynamic Weather Visual Effects (Rain streaks, asphalt splash rings, motorcycle spray, puddles)
    weatherEffects.update(
      delta,
      currentWeather,
      camera.position,
      bikeModel.group.position,
      s.heading,
      s.speed,
      world.getGroundHeightAt(s.x, s.z)
    );

    // 13. Update Camera
    if (mountTransitionState !== 'NONE') {
      const camAngle = parkedBikeHeading - 0.72;
      const camDist = 3.6;
      const camTargetX = THREE.MathUtils.lerp(parkedBikePos.x, mountEndPos.x, 0.5);
      const camTargetZ = THREE.MathUtils.lerp(parkedBikePos.z, mountEndPos.z, 0.5);
      const camTargetY = parkedBikePos.y + 1.25;

      const targetCamPos = new THREE.Vector3(
        camTargetX - Math.sin(camAngle) * camDist,
        parkedBikePos.y + 1.65,
        camTargetZ - Math.cos(camAngle) * camDist
      );
      camera.position.lerp(targetCamPos, 0.22);
      camera.lookAt(camTargetX, camTargetY, camTargetZ);
    } else {
      physics.updateCamera(camera, currentCameraView, true);
    }

    // Calculate dynamic solar position, shadow frustum, normal-bias & realistic daylight shift
    sunShadowSystem.update(delta, currentTimeOfDay, s.x, s.y, s.z);

    // 14. Update Modern Kid Collectibles System & Companion Drone
    kidCollectibles.update(delta, s.x, s.y, s.z);
    kidDrone.update(
      delta,
      { x: s.x, y: s.y, z: s.z },
      s.heading,
      s.speed,
      !s.isGrounded || s.wheelieAngle > 0.1
    );

    renderer.render(scene, camera);
  };

  const start = () => {
    if (!isRunning) {
      isRunning = true;
      clock.start();
      cityAudio.startEngine(currentBike.soundType);
      cityAudio.startMusic();
      animate();
    }
  };

  const stop = () => {
    isRunning = false;
    if (animId) {
      cancelAnimationFrame(animId);
      animId = null;
    }
    cityAudio.stopEngine();
    cityAudio.stopMusic();
    cityAudio.setPoliceSiren(false);
  };

  const updateInputs = (inputs: {
    throttle: number;
    brake: number;
    steer: number;
    nitro: boolean;
    wheelie: boolean;
    reverse: boolean;
    gear?: string;
  }) => {
    currentInputs.throttle = inputs.throttle;
    currentInputs.brake = inputs.brake;
    currentInputs.steer = inputs.steer;
    currentInputs.nitro = inputs.nitro;
    currentInputs.wheelie = inputs.wheelie;
    currentInputs.reverse = inputs.reverse;
    if (inputs.gear) {
      currentTransmissionGear = inputs.gear;
      currentInputs.gear = inputs.gear;
      playerCar.triggerGearShift?.(inputs.gear, false);
    }
  };

  const setCameraView = (view: CameraView) => {
    currentCameraView = view;
    // In first-person cockpit view or helmetCam, hide head/helmet so camera has 100% unobstructed view!
    bikeModel.rider.headGroup.visible = view !== 'firstPerson' && view !== 'helmetCam';
    playerCar.setCockpitView?.(view === 'firstPerson');
  };

  const setTimeAndWeather = (time: TimeOfDay, weather: WeatherType) => {
    currentTimeOfDay = time;
    currentWeather = weather;
    physics.setWeather(weather);
    sunShadowSystem.setTimeOfDay(time, false);
    world.updateDayNightAndWeather(time, weather, camera.position);
    traffic.updateLighting(time, weather);
    bikeModel.updateDayNightAndWeather?.(time, weather);
  };

  const startMission = (mission: CityMission) => {
    missions.startMission(mission);
  };

  const cancelMission = () => {
    missions.cancelMission();
  };

  const executeDismount = () => {
    const s = physics.state;
    // 1. Bring motorcycle to safe stop
    s.speed = 0;
    s.rpmRatio = 0;
    cityAudio.stopEngine();

    parkedBikePos.set(s.x, world.getGroundHeightAt(s.x, s.z), s.z);
    parkedBikeHeading = s.heading;

    // Safe step off location on pavement to left of motorcycle
    const stepLeftX = -Math.cos(s.heading) * 0.95;
    const stepLeftZ = Math.sin(s.heading) * 0.95;
    const finalGroundY = world.getGroundHeightAt(s.x + stepLeftX, s.z + stepLeftZ);

    mountStartPos.set(s.x, s.y, s.z);
    mountEndPos.set(s.x + stepLeftX, finalGroundY, s.z + stepLeftZ);

    mountTransitionState = 'DISMOUNTING';
    mountTransitionProgress = 0;
    lastReportedPct = 0;
    cityAudio.playMountDismountChime(false);
    callbacks.onMountTransition?.('DISMOUNTING', 0);

    // Detach rider from motorcycle saddle and add directly to scene root for animated transition
    bikeModel.productionMesh.riderMountPoint.remove(bikeModel.rider.group);
    scene.add(bikeModel.rider.group);
    bikeModel.rider.group.position.copy(mountStartPos);
    bikeModel.rider.group.rotation.set(0, parkedBikeHeading, 0);

    bikeModel.setKickstandDeployed(true);
    bikeModel.setBraking(false);
  };

  const executeMount = () => {
    const s = physics.state;
    const distToBike = Math.hypot(s.x - parkedBikePos.x, s.z - parkedBikePos.z);
    const nearestProp = propCarManager.getNearestPropCar(s.x, s.z);

    // If standing near a parked prop car, allow entering and driving that prop car!
    if (nearestProp && nearestProp.distance < 4.5 && nearestProp.distance < distToBike) {
      const targetCar = nearestProp.car;
      mountStartPos.set(s.x, s.y, s.z);
      mountEndPos.set(targetCar.data.x, 0, targetCar.data.z);
      parkedBikePos.set(targetCar.data.x, 0, targetCar.data.z);
      parkedBikeHeading = targetCar.data.heading;

      // Adapt player vehicle style and color to match chosen prop car
      if (targetCar.data.styleName === 'bmw_m' || targetCar.data.styleName === 'benz_amg') {
        playerCar.setStyle(targetCar.data.styleName);
      }
      const colorHex = '#' + targetCar.data.color.toString(16).padStart(6, '0');
      playerCar.updateColor(colorHex);

      mountTransitionState = 'MOUNTING';
      mountTransitionProgress = 0;
      lastReportedPct = 0;
      cityAudio.playMountDismountChime(true);
      callbacks.onMountTransition?.('MOUNTING', 0);
      callbacks.onInfraction?.('ENTERING PROP CAR', `Driving ${targetCar.data.name}!`, 0);
      return;
    }

    if (distToBike > 5.0) {
      callbacks.onInfraction?.(
        'APPROACH CAR',
        `You are ${distToBike.toFixed(1)}m away from your car (or get within 4.5m of any parked prop car)`,
        0
      );
      return;
    }

    mountStartPos.set(s.x, s.y, s.z);
    mountEndPos.set(parkedBikePos.x, parkedBikePos.y, parkedBikePos.z);

    mountTransitionState = 'MOUNTING';
    mountTransitionProgress = 0;
    lastReportedPct = 0;
    cityAudio.playMountDismountChime(true);
    callbacks.onMountTransition?.('MOUNTING', 0);
  };

  const toggleMount = () => {
    if (mountTransitionState !== 'NONE') return; // Currently executing animation sequence
    const s = physics.state;

    if (s.isOnBike) {
      if (Math.abs(s.speed) > 3.0) {
        // Automatically smoothly brake and stop to dismount
        isAutoStoppingToDismount = true;
        callbacks.onInfraction?.('STOPPING CAR', 'Slowing down to step out safely...', 0);
        return;
      }
      executeDismount();
    } else {
      executeMount();
    }
  };

  const honkHorn = () => {
    cityAudio.playHorn();
    hornTimer = 2.2; // Alert nearby pedestrians to trigger reactive animations
  };

  const teleportTo = (x: number, z: number) => {
    physics.reset(x, z, physics.state.heading);
  };

  const setBike = (newBike: OpenCityBike) => {
    currentBike = newBike;
    currentDamage = newBike.damage ? { ...newBike.damage } : { ...DEFAULT_BIKE_DAMAGE };
    scene.remove(bikeModel.group);
    scene.remove(bikeModel.rider.group);
    bikeModel.dispose();
    bikeModel = createBikeModel(newBike as any, { isPlayer: true, initialDamage: currentDamage });
    bikeModel.updateDayNightAndWeather?.(currentTimeOfDay, currentWeather);
    scene.add(bikeModel.group);

    const isSupercar = newBike.category === 'German Supercar';
    playerCar.group.visible = isSupercar;
    bikeModel.group.visible = !isSupercar;

    const newStyle: CarDesignStyle =
      newBike.id.includes('benz') || newBike.brand?.toUpperCase().includes('BENZ') || newBike.brand?.toUpperCase().includes('MERCEDES')
        ? 'benz_amg'
        : 'bmw_m';
    playerCar.setStyle(newStyle);

    playerCar.updateColor(
      newBike.customization?.bodyColor || (newStyle === 'bmw_m' ? '#1d4ed8' : '#090a0f'),
      newBike.customization?.rimColor || (newStyle === 'bmw_m' ? '#18181b' : '#cbd5e1')
    );
    if (!physics.state.isOnBike) {
      // Re-detach rider if player was on foot
      bikeModel.productionMesh.riderMountPoint.remove(bikeModel.rider.group);
      scene.add(bikeModel.rider.group);
      bikeModel.rider.setOnFoot(true, new THREE.Vector3(physics.state.x, physics.state.y, physics.state.z), physics.state.heading);
      bikeModel.setKickstandDeployed(true);
    }
    physics.setStats(calculateEffectiveStats(newBike));
  };

  const repairBike = () => {
    currentDamage = { ...DEFAULT_BIKE_DAMAGE };
    bikeModel.applyDamage(currentDamage);
    callbacks.onBikeDamage?.(currentDamage);
  };

  const getBikeDamage = () => currentDamage;

  const setPhotoMode = (active: boolean) => {
    isPhotoMode = active;
    if (active) {
      cityAudio.stopEngine();
      cityAudio.setPoliceSiren(false);
    } else {
      cityAudio.startEngine(currentBike.soundType);
    }
  };

  const updatePhotoCamera = (params: {
    orbitAngle: number;
    pitchAngle: number;
    distance: number;
    height: number;
    fov: number;
    roll: number;
  }) => {
    photoParams = { ...params };
  };

  const captureScreenshot = () => {
    renderer.render(scene, camera);
    return renderer.domElement.toDataURL('image/png');
  };

  const getPlayerState = () => physics.state;
  const getActiveMission = () => missions.activeMission;
  const getMissionTimeRemaining = () => missions.timeRemaining;

  const handleResize = () => {
    if (!container) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  };

  window.addEventListener('resize', handleResize);

  const dispose = () => {
    stop();
    window.removeEventListener('resize', handleResize);
    canvas.removeEventListener('webglcontextlost', handleContextLost);
    canvas.removeEventListener('webglcontextrestored', handleContextRestored);
    scene.remove(bikeModel.rider.group);
    scene.remove(playerCar.group);
    playerCar.dispose();
    bikeModel.dispose();
    weatherEffects.dispose();
    world.dispose();
    traffic.clear();
    pedestrians.clear();
    missions.cancelMission();
    roadHazards.clear();
    tollPlaza.dispose();
    propCarManager.dispose();
    kidDrone.dispose();
    kidCollectibles.dispose();
    // Cleanly dispose renderer without artificially triggering context loss extension
    renderer.dispose();
    if (canvas.parentElement) {
      canvas.parentElement.removeChild(canvas);
    }
  };

  return {
    start,
    stop,
    updateInputs,
    setCameraView,
    setTimeAndWeather,
    startMission,
    cancelMission,
    toggleMount,
    honkHorn,
    setDressingStyle: (style: any) => bikeModel.rider.setDressingStyle(style),
    getDressingStyle: () => bikeModel.rider.dressingStyle,
    toggleHelmet: () => bikeModel.rider.toggleHelmet(),
    setHelmetVisible: (visible: boolean) => bikeModel.rider.setHelmetVisible(visible),
    isHelmetVisible: () => bikeModel.rider.isHelmetVisible,
    teleportTo,
    setBike,
    repairBike,
    getBikeDamage,
    setPhotoMode,
    updatePhotoCamera,
    captureScreenshot,
    getPlayerState,
    getWantedState: () => traffic.wantedState,
    getActiveMission,
    getMissionTimeRemaining,
    setCarStyle: (style: CarDesignStyle) => {
      playerCar.setStyle(style);
      playerCar.updateColor(
        style === 'bmw_m' ? '#1d4ed8' : '#090a0f',
        style === 'bmw_m' ? '#18181b' : '#cbd5e1'
      );
    },
    getCarStyle: () => playerCar.carStyle,
    setDriveMode: (mode: AutomotiveDriveMode) => {
      playerCar.setDriveMode(mode);
    },
    setAmbientLightColor: (colorHex: string) => {
      playerCar.setAmbientLightColor(colorHex);
    },
    getDriveMode: () => playerCar.driveMode,
    getAmbientLightColor: () => playerCar.ambientLightColor,
    getActiveAeroAngle: () => playerCar.getActiveAeroAngle(),
    getActiveAeroDownforceKg: () => playerCar.getActiveAeroDownforceKg(),
    isAirbrakeActive: () => playerCar.isAirbrakeActive(),
    triggerGearShift: (gear?: string, isDownshift?: boolean) => {
      if (gear) {
        currentTransmissionGear = gear;
        currentInputs.gear = gear;
      }
      playerCar.triggerGearShift?.(gear, isDownshift);
      cityAudio.playGearShiftClick(isDownshift);
      if (gear === 'R') {
        cityAudio.playReverseChime();
      }
    },
    getCurrentGear: () => {
      if (physics.state.isReversing) return 'R';
      return currentTransmissionGear || playerCar.getCurrentGear?.() || 'D1';
    },
    startReplay: (clip?: SavedReplayClip) => {
      if (clip) {
        globalReplayRecorder.loadClip(clip);
      }
      replayDuration = globalReplayRecorder.getDuration();
      if (replayDuration <= 0.1) return;
      isReplaying = true;
      replayTime = 0;
      isReplayPlaying = true;
      broadcastAnchorTime = 0;
    },
    stopReplay: () => {
      isReplaying = false;
      camera.fov = 65;
      camera.updateProjectionMatrix();
      cityAudio.updateEngine(physics.state.rpmRatio, currentInputs.throttle, physics.state.speed);
    },
    seekReplay: (targetTime: number) => {
      replayTime = Math.max(0, Math.min(replayDuration, targetTime));
    },
    setReplayPlaying: (playing: boolean) => {
      isReplayPlaying = playing;
    },
    setReplaySpeed: (speed: number) => {
      replaySpeed = speed;
    },
    setReplayLooping: (loop: boolean) => {
      replayIsLooping = loop;
    },
    setReplayCameraAngle: (angle: CinematicCameraAngle) => {
      replayCameraAngle = angle;
      broadcastAnchorTime = 0;
    },
    getReplayTime: () => replayTime,
    getReplayDuration: () => replayDuration,
    isReplayActive: () => isReplaying,
    getReplayTelemetry: () => {
      if (!lastReplayFrame) return null;
      return {
        speed: lastReplayFrame.speed,
        gear: lastReplayFrame.gear,
        rpmRatio: lastReplayFrame.rpmRatio,
        aeroAngle: lastReplayFrame.aeroAngle,
        downforceKg: lastReplayFrame.downforceKg,
        isAirbrake: lastReplayFrame.isAirbrake,
        carStyle: lastReplayFrame.carStyle,
        driveMode: lastReplayFrame.driveMode,
      };
    },
    toggleCompanionDrone: (enabled: boolean) => {
      kidDrone.setEnabled(enabled);
    },
    setDroneSkin: (skin: DroneSkinId) => {
      kidDrone.setSkin(skin);
    },
    getCollectiblesStatus: () => kidCollectibles.getItemsStatus(),
    setGraphicsQuality: (quality: 'low' | 'medium' | 'high' | 'ultra') => {
      try {
        if (quality === 'low') {
          renderer.shadowMap.enabled = false;
          renderer.setPixelRatio(1.0);
        } else if (quality === 'medium') {
          renderer.shadowMap.enabled = true;
          renderer.shadowMap.type = THREE.BasicShadowMap;
          renderer.setPixelRatio(1.0);
        } else if (quality === 'high') {
          renderer.shadowMap.enabled = true;
          renderer.shadowMap.type = THREE.PCFShadowMap;
          renderer.setPixelRatio(1.0);
        } else {
          renderer.shadowMap.enabled = true;
          renderer.shadowMap.type = THREE.PCFShadowMap;
          renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
        }
      } catch {}
    },
    dispose,
  };
}
