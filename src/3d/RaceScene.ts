import * as THREE from 'three';
import { BikeData, TrackData, WeatherType, CameraView, Difficulty } from '../types/game';
import { BikeModelInstance, createBikeModel } from './BikeModelBuilder';
import { TrackWorld, buildTrack } from './TrackBuilder';
import { BikePhysicsEngine, PlayerPhysicsState } from '../game/PhysicsEngine';
import { AIManager } from '../game/AIOpponents';
import { TrafficManager } from '../game/TrafficManager';
import { soundEngine } from '../audio/SoundEngine';

export interface RaceSceneCallbacks {
  onCountdownUpdate: (count: number) => void;
  onLapComplete: (lap: number, lapTime: number) => void;
  onRaceFinish: (results: {
    playerRank: number;
    totalRacers: number;
    totalTime: number;
    bestLapTime: number;
  }) => void;
  onCollision: () => void;
}

export interface RaceSceneInstance {
  container: HTMLElement;
  startRace: () => void;
  setPaused: (paused: boolean) => void;
  setCameraView: (view: CameraView) => void;
  updateInputs: (inputs: {
    throttle: number;
    brake: number;
    steer: number;
    nitro: boolean;
  }) => void;
  getPhysicsState: () => PlayerPhysicsState;
  getRankings: () => { playerRank: number; totalRacers: number };
  getMinimapData: () => {
    trackPoints: { x: number; y: number }[];
    playerDistance: number;
    opponentsDistances: number[];
    totalLength: number;
  };
  dispose: () => void;
}

export function createRaceScene(
  container: HTMLElement,
  bikeData: BikeData,
  trackData: TrackData,
  weather: WeatherType,
  difficulty: Difficulty,
  totalLaps: number,
  callbacks: RaceSceneCallbacks
): RaceSceneInstance {
  const scene = new THREE.Scene();

  // 1. Sky & Environmental Fog setup based on weather
  let skyColor = 0x38bdf8;
  let fogColor = 0x7dd3fc;
  let fogDensity = 0.0018;

  if (weather === 'sunset') {
    skyColor = 0x9a3412;
    fogColor = 0xc2410c;
    fogDensity = 0.0022;
  } else if (weather === 'night' || weather === 'nightRain') {
    skyColor = 0x05070a;
    fogColor = 0x090d16;
    fogDensity = 0.0035;
  } else if (weather === 'fog') {
    skyColor = 0x64748b;
    fogColor = 0x94a3b8;
    fogDensity = 0.0065;
  }

  scene.background = new THREE.Color(skyColor);
  scene.fog = new THREE.FogExp2(fogColor, fogDensity);

  // 2. Camera & Renderer
  const camera = new THREE.PerspectiveCamera(
    65,
    container.clientWidth / container.clientHeight,
    0.1,
    1500
  );

  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  container.appendChild(canvas);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'default',
    failIfMajorPerformanceCaveat: false,
  });
  renderer.debug.checkShaderErrors = false;
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = weather === 'night' || weather === 'nightRain' ? 1.4 : 1.1;

  // 3. Environmental Lighting
  const ambientLight = new THREE.AmbientLight(
    weather === 'night' || weather === 'nightRain' ? 0x1e293b : 0xffffff,
    weather === 'night' || weather === 'nightRain' ? 0.7 : 0.85
  );
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(
    weather === 'sunset' ? 0xf97316 : 0xffffff,
    weather === 'night' || weather === 'nightRain' ? 0.4 : 1.8
  );
  sunLight.position.set(120, 200, 80);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 10;
  sunLight.shadow.camera.far = 400;
  sunLight.shadow.bias = -0.0004;
  scene.add(sunLight);

  // 4. Build 3D Track
  const track = buildTrack(trackData, weather);
  scene.add(track.environmentGroup);

  // 5. Build Player Bike & Rider
  const playerModel = createBikeModel(bikeData, { isPlayer: true });
  scene.add(playerModel.group);

  // 6. Physics Engine
  const effectiveStats = { ...bikeData.baseStats };
  const physics = new BikePhysicsEngine(effectiveStats, track);

  // Weather grip factor
  const weatherGrip = weather === 'rain' || weather === 'nightRain' ? 0.75 : (weather === 'fog' ? 0.88 : 1.0);

  // 7. AI Opponents
  const aiManager = new AIManager(scene, track);
  aiManager.initOpponents(5, difficulty);

  // 8. Highway Traffic (if enabled)
  let trafficManager: TrafficManager | null = null;
  if (trackData.trafficEnabled) {
    trafficManager = new TrafficManager(scene, track);
    trafficManager.initTraffic(14);
  }

  // 8b. Configure Dynamic Lighting for Night & Rain (Headlight projection cones, optical flares, taillights)
  const mappedTimeOfDay: import('../types/openCity').TimeOfDay =
    weather === 'night' || weather === 'nightRain'
      ? 'night'
      : weather === 'sunset'
      ? 'sunset'
      : 'afternoon';
  const mappedWeatherType: import('../types/openCity').WeatherType =
    weather === 'rain' || weather === 'nightRain'
      ? 'rain'
      : weather === 'fog'
      ? 'fog'
      : 'clear';

  playerModel.updateDayNightAndWeather?.(mappedTimeOfDay, mappedWeatherType);
  aiManager.updateLighting(mappedTimeOfDay, mappedWeatherType);
  if (trafficManager) {
    trafficManager.updateLighting(mappedTimeOfDay, mappedWeatherType);
  }

  // 9. Sparks / Particle system for knee scrapes and collisions
  const sparkCount = 60;
  const sparkGeo = new THREE.BufferGeometry();
  const sparkPositions = new Float32Array(sparkCount * 3);
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
  const sparkMat = new THREE.PointsMaterial({
    color: 0xffaa00,
    size: 0.15,
    blending: THREE.AdditiveBlending,
    transparent: true,
  });
  const sparkPoints = new THREE.Points(sparkGeo, sparkMat);
  scene.add(sparkPoints);

  // Controls state
  const currentInputs = {
    throttle: 0,
    brake: 0,
    steer: 0,
    nitro: false,
  };

  let currentCameraView: CameraView = 'chase';
  let isPaused = false;
  let isFinished = false;
  let countdown = 3;
  let countdownInterval: number | null = null;
  let raceStarted = false;
  let animId: number | null = null;
  let raceStartTime = 0;
  let totalRaceTime = 0;

  // Countdown routine (3... 2... 1... GO!)
  const startCountdown = () => {
    countdown = 3;
    callbacks.onCountdownUpdate(countdown);
    soundEngine.playCountdown(3);

    countdownInterval = window.setInterval(() => {
      countdown--;
      callbacks.onCountdownUpdate(countdown);

      if (countdown > 0) {
        soundEngine.playCountdown(countdown);
      } else if (countdown === 0) {
        soundEngine.playCountdown(0);
        raceStarted = true;
        raceStartTime = performance.now();
      } else {
        if (countdownInterval !== null) {
          clearInterval(countdownInterval);
          countdownInterval = null;
        }
      }
    }, 1000);
  };

  // Lap completion
  const handleLapComplete = (lap: number, lapTime: number) => {
    callbacks.onLapComplete(lap, lapTime);

    if (lap > totalLaps && !isFinished) {
      isFinished = true;
      totalRaceTime = (performance.now() - raceStartTime) / 1000;
      soundEngine.playVictory();

      const ranks = aiManager.calculateRanks(physics.state.distance, totalLaps);

      callbacks.onRaceFinish({
        playerRank: ranks.playerRank,
        totalRacers: ranks.totalRacers,
        totalTime: totalRaceTime,
        bestLapTime: physics.state.bestLapTime || totalRaceTime / totalLaps,
      });
    }
  };

  const handleCrash = () => {
    soundEngine.playCrash();
    callbacks.onCollision();
  };

  const clock = new THREE.Clock();

  // Main Race Game Loop
  const animate = () => {
    animId = requestAnimationFrame(animate);
    if (isPaused) return;

    const delta = Math.min(0.05, clock.getDelta());
    const time = clock.getElapsedTime();

    // Only allow driving inputs once countdown is GO
    const effectiveInputs = raceStarted && !isFinished ? currentInputs : {
      throttle: !raceStarted && currentInputs.throttle > 0 ? 0.3 : (isFinished ? 0.2 : 0),
      brake: 0,
      steer: 0,
      nitro: false,
    };

    // Update Physics
    physics.update(
      delta,
      effectiveInputs,
      weatherGrip,
      handleLapComplete,
      handleCrash
    );

    const s = physics.state;

    // Check collision with civilian traffic
    if (trafficManager && !s.isCrashing) {
      const col = trafficManager.checkPlayerCollision(s.distance, s.trackOffset);
      if (col.collided) {
        s.isCrashing = true;
        s.crashTimer = 1.6;
        s.speed = Math.max(15, s.speed * 0.2);
        handleCrash();
      }
    }

    // Update Player Bike 3D Model position & orientation
    playerModel.group.position.copy(s.positionVector);
    playerModel.group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), s.directionVector);

    // Apply lean / bank angle along tangent axis
    playerModel.group.rotateOnAxis(new THREE.Vector3(0, 0, 1), -s.leanAngle);
    // Apply pitch (suspension squat or stoppie)
    playerModel.group.rotateOnAxis(new THREE.Vector3(1, 0, 0), s.pitchAngle);

    // Update bike and rider animations
    playerModel.updateAnimation(
      s.speed,
      s.rpmRatio,
      currentInputs.steer,
      s.leanAngle,
      s.isBraking,
      s.isNitroActive,
      delta,
      s.isCrashing,
      isFinished && aiManager.calculateRanks(s.distance, s.lap).playerRank === 1
    );

    // Update Audio Engine with real-time RPM, throttle, speed, nitro
    soundEngine.updateEngine(s.rpmRatio, effectiveInputs.throttle, s.speed);
    soundEngine.setNitro(s.isNitroActive);

    // Knee slider sparks when leaning at extreme angle (> 0.55 rad / ~32 deg)
    if (Math.abs(s.leanAngle) > 0.55 && s.speed > 80 && !s.isCrashing) {
      const sparkPosArray = sparkPoints.geometry.attributes.position.array as Float32Array;
      const kneeSide = s.leanAngle > 0 ? -0.4 : 0.4;
      const kneePoint = s.positionVector.clone().addScaledVector(track.getTrackPointAtProgress(s.distance).binormal, kneeSide);

      for (let i = 0; i < sparkCount * 3; i += 3) {
        sparkPosArray[i] = kneePoint.x + (Math.random() - 0.5) * 0.4;
        sparkPosArray[i + 1] = 0.05 + Math.random() * 0.2;
        sparkPosArray[i + 2] = kneePoint.z + (Math.random() - 0.5) * 0.4;
      }
      sparkPoints.geometry.attributes.position.needsUpdate = true;
      sparkMat.opacity = 0.9;
    } else {
      sparkMat.opacity = 0;
    }

    // Update AI Opponents
    if (raceStarted) {
      aiManager.update(delta, s.distance, s.trackOffset, totalLaps);
    }

    // Update Highway Traffic
    if (trafficManager) {
      trafficManager.update(delta, s.distance, s.trackOffset);
    }

    // Update Track World (Rain particles, etc.)
    track.updateEnvironment(time, camera.position);

    // Update Camera
    physics.updateCamera(camera, currentCameraView, true);

    // Keep sunlight tracking close to camera for shadows
    sunLight.position.set(camera.position.x + 80, camera.position.y + 140, camera.position.z + 50);
    sunLight.target.position.copy(camera.position);

    renderer.render(scene, camera);
  };

  const startRace = () => {
    soundEngine.startEngine(bikeData.soundType);
    soundEngine.startMusic();
    clock.start();
    animate();
    startCountdown();
  };

  const setPaused = (paused: boolean) => {
    isPaused = paused;
    if (paused) {
      soundEngine.stopEngine();
      soundEngine.stopMusic();
    } else {
      soundEngine.startEngine(bikeData.soundType);
      soundEngine.startMusic();
    }
  };

  const setCameraView = (view: CameraView) => {
    currentCameraView = view;
  };

  const updateInputs = (inputs: {
    throttle: number;
    brake: number;
    steer: number;
    nitro: boolean;
  }) => {
    currentInputs.throttle = inputs.throttle;
    currentInputs.brake = inputs.brake;
    currentInputs.steer = inputs.steer;
    currentInputs.nitro = inputs.nitro;
  };

  const getPhysicsState = () => physics.state;

  const getRankings = () => aiManager.calculateRanks(physics.state.distance, physics.state.lap);

  const getMinimapData = () => ({
    trackPoints: track.trackPoints2D,
    playerDistance: physics.state.distance,
    opponentsDistances: aiManager.opponents.map((ai) => ai.distance),
    totalLength: track.totalLength,
  });

  const handleResize = () => {
    if (!container) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  };

  window.addEventListener('resize', handleResize);

  const dispose = () => {
    if (animId) cancelAnimationFrame(animId);
    if (countdownInterval !== null) clearInterval(countdownInterval);
    window.removeEventListener('resize', handleResize);

    soundEngine.stopEngine();
    soundEngine.stopMusic();

    playerModel.dispose();
    aiManager.clear();
    trafficManager?.clear();
    track.dispose();

    sparkGeo.dispose();
    sparkMat.dispose();

    try {
      const gl = renderer.getContext();
      const loseContextExt = gl?.getExtension('WEBGL_lose_context');
      if (loseContextExt) {
        loseContextExt.loseContext();
      }
    } catch {}
    renderer.dispose();
    if (canvas.parentElement) {
      canvas.parentElement.removeChild(canvas);
    }
  };

  return {
    container,
    startRace,
    setPaused,
    setCameraView,
    updateInputs,
    getPhysicsState,
    getRankings,
    getMinimapData,
    dispose,
  };
}
