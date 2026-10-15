import * as THREE from 'three';
import { BikeData } from '../types/game';
import { BikeModelInstance, createBikeModel } from './BikeModelBuilder';

export type GarageCameraPreset =
  | 'menu'
  | 'garage'
  | 'front'
  | 'side'
  | 'rear'
  | 'threeQuarter'
  | 'closeEngine'
  | 'closeFrontWheel'
  | 'closeRearWheel'
  | 'riderSeated';

export interface GarageSceneInstance {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  setBike: (bikeData: BikeData, showRider?: boolean) => void;
  start: () => void;
  stop: () => void;
  setCameraTarget: (preset: GarageCameraPreset) => void;
  toggleRider: (visible: boolean) => void;
  toggleTurntable: (active: boolean) => void;
  rotateBike: (deltaX: number) => void;
  zoomCamera: (deltaY: number) => void;
  dispose: () => void;
}

export function createGarageScene(container: HTMLElement): GarageSceneInstance {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x06080c);
  scene.fog = new THREE.FogExp2(0x06080c, 0.035);

  const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    100
  );
  camera.position.set(-2.8, 1.35, 3.4);

  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  container.appendChild(canvas);

  let renderer: THREE.WebGLRenderer;
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
      renderer = new THREE.WebGLRenderer({
        canvas,
        context: gl as any,
        antialias: false,
        powerPreference: 'high-performance',
      });
    } catch {
      renderer = {
        domElement: canvas,
        debug: { checkShaderErrors: false },
        shadowMap: { enabled: false, type: 0 },
        toneMapping: 0,
        toneMappingExposure: 1.0,
        setSize: () => {},
        setPixelRatio: () => {},
        render: () => {},
        dispose: () => {},
        getContext: () => null,
      } as unknown as THREE.WebGLRenderer;
    }
  } else {
    renderer = {
      domElement: canvas,
      debug: { checkShaderErrors: false },
      shadowMap: { enabled: false, type: 0 },
      toneMapping: 0,
      toneMappingExposure: 1.0,
      setSize: () => {},
      setPixelRatio: () => {},
      render: () => {},
      dispose: () => {},
      getContext: () => null,
    } as unknown as THREE.WebGLRenderer;
  }

  renderer.debug.checkShaderErrors = false;
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(1.0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.BasicShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  // 1. Studio Lighting System (Optimized for 1-meter close-up inspection)
  const ambientLight = new THREE.AmbientLight(0x334155, 1.2);
  scene.add(ambientLight);

  // Overhead Key Studio Softbox
  const studioLight = new THREE.SpotLight(0xffffff, 4.5, 20, Math.PI / 3, 0.45, 1.2);
  studioLight.position.set(0, 5.8, 0.5);
  studioLight.castShadow = true;
  studioLight.shadow.mapSize.width = 1024;
  studioLight.shadow.mapSize.height = 1024;
  studioLight.shadow.bias = -0.0005;
  scene.add(studioLight);

  // Rim Lights (Cyan / Amber automotive specular highlights)
  const rimLightLeft = new THREE.PointLight(0x06b6d4, 4.0, 10, 1.4);
  rimLightLeft.position.set(-3.5, 0.8, -1.8);
  scene.add(rimLightLeft);

  const rimLightRight = new THREE.PointLight(0xf59e0b, 4.0, 10, 1.4);
  rimLightRight.position.set(3.5, 0.8, 1.8);
  scene.add(rimLightRight);

  // Close-up detail illumination fill light
  const detailFillLight = new THREE.DirectionalLight(0xf8fafc, 1.6);
  detailFillLight.position.set(2, 3, 4);
  scene.add(detailFillLight);

  // 2. High-Tech Turntable Platform
  const platformGroup = new THREE.Group();
  scene.add(platformGroup);

  const discGeo = new THREE.CylinderGeometry(2.2, 2.3, 0.12, 48);
  const discMat = new THREE.MeshStandardMaterial({
    color: 0x111317,
    metalness: 0.85,
    roughness: 0.22,
  });
  const platformDisc = new THREE.Mesh(discGeo, discMat);
  platformDisc.position.y = 0.06;
  platformDisc.receiveShadow = true;
  platformGroup.add(platformDisc);

  const ringGeo = new THREE.TorusGeometry(2.15, 0.025, 16, 48);
  ringGeo.rotateX(Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
  const glowRing = new THREE.Mesh(ringGeo, ringMat);
  glowRing.position.y = 0.125;
  platformGroup.add(glowRing);

  // 3. Polished Concrete Garage Floor
  const floorGeo = new THREE.PlaneGeometry(50, 50);
  floorGeo.rotateX(-Math.PI / 2);

  const floorCanvas = document.createElement('canvas');
  floorCanvas.width = 512;
  floorCanvas.height = 512;
  const ctx = floorCanvas.getContext('2d')!;
  ctx.fillStyle = '#0a0d14';
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = '#151d2a';
  ctx.lineWidth = 2;
  for (let g = 0; g <= 512; g += 64) {
    ctx.beginPath();
    ctx.moveTo(g, 0);
    ctx.lineTo(g, 512);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, g);
    ctx.lineTo(512, g);
    ctx.stroke();
  }

  const floorTex = new THREE.CanvasTexture(floorCanvas);
  floorTex.wrapS = THREE.RepeatWrapping;
  floorTex.wrapT = THREE.RepeatWrapping;
  floorTex.repeat.set(12, 12);

  const floorMat = new THREE.MeshStandardMaterial({
    map: floorTex,
    roughness: 0.18,
    metalness: 0.7,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.receiveShadow = true;
  scene.add(floor);

  // 4. Bike Model Holder
  let currentBikeModel: BikeModelInstance | null = null;
  const bikeGroup = new THREE.Group();
  scene.add(bikeGroup);

  let isRiderVisible = true;
  let isTurntableActive = false;

  const setBike = (bikeData: BikeData, showRider = isRiderVisible) => {
    if (currentBikeModel) {
      bikeGroup.remove(currentBikeModel.group);
      currentBikeModel.dispose();
      currentBikeModel = null;
    }
    isRiderVisible = showRider;
    currentBikeModel = createBikeModel(bikeData, {
      isPlayer: true,
      showRider: showRider,
    });
    // Sits flush on turntable platform at y = 0.12m
    currentBikeModel.group.position.set(0, 0.12, 0);
    bikeGroup.add(currentBikeModel.group);
  };

  const toggleRider = (visible: boolean) => {
    isRiderVisible = visible;
    if (currentBikeModel) {
      currentBikeModel.rider.setVisible(visible);
    }
  };

  const toggleTurntable = (active: boolean) => {
    isTurntableActive = active;
  };

  // 5. Camera Presets (Covers all 8 user-mandated Close-Up Realism Test views)
  let targetCamPos = new THREE.Vector3(-2.8, 1.35, 3.4);
  let targetCamLook = new THREE.Vector3(0, 0.75, 0);
  let bikeRotationAngle = 0;
  let animId: number | null = null;

  const setCameraTarget = (preset: GarageCameraPreset) => {
    if (preset === 'front') {
      // FRONT VIEW: Looking into headlights, windscreen, forks, calipers
      targetCamPos.set(0, 0.92, 2.2);
      targetCamLook.set(0, 0.75, 0.45);
    } else if (preset === 'side') {
      // SIDE VIEW: Full side profile of frame, engine, exhaust, fuel tank, swingarm
      targetCamPos.set(2.4, 0.82, 0);
      targetCamLook.set(0, 0.72, 0);
    } else if (preset === 'rear') {
      // REAR VIEW: Looking into taillight, 190mm wide tire, megaphone muffler, drive chain
      targetCamPos.set(0, 0.95, -2.4);
      targetCamLook.set(0, 0.75, -0.4);
    } else if (preset === 'threeQuarter' || preset === 'menu') {
      // 3/4 VIEW: Dynamic beauty shot
      targetCamPos.set(-2.4, 1.25, 2.4);
      targetCamLook.set(0, 0.72, 0);
    } else if (preset === 'closeEngine') {
      // CLOSE-UP ENGINE: 0.8m distance inspecting fins, clutch cover, sight glass, exhaust headers, frame spar
      targetCamPos.set(0.85, 0.58, 0.05);
      targetCamLook.set(0.05, 0.50, 0.05);
    } else if (preset === 'closeFrontWheel') {
      // CLOSE-UP FRONT WHEEL: 0.65m distance inspecting radial calipers, petal rotor, rim, tire sipes
      targetCamPos.set(0.68, 0.42, 0.73);
      targetCamLook.set(0.0, 0.38, 0.73);
    } else if (preset === 'closeRearWheel') {
      // CLOSE-UP REAR WHEEL: 0.68m distance inspecting swingarm, 520 chain, sprocket, rear caliper
      targetCamPos.set(-0.72, 0.42, -0.72);
      targetCamLook.set(0.0, 0.38, -0.72);
    } else if (preset === 'riderSeated') {
      // RIDER SEATED: Inspecting rider in racing leathers, helmet visor, hands on clip-ons, knees on tank
      toggleRider(true);
      targetCamPos.set(-1.6, 1.35, 0.1);
      targetCamLook.set(0.0, 1.02, -0.15);
    } else if (preset === 'garage') {
      targetCamPos.set(-2.0, 1.2, 2.4);
      targetCamLook.set(0, 0.72, 0);
    }
  };

  const rotateBike = (deltaX: number) => {
    bikeRotationAngle += deltaX * 0.008;
    bikeGroup.rotation.y = bikeRotationAngle;
  };

  const zoomCamera = (deltaY: number) => {
    const dir = new THREE.Vector3().subVectors(camera.position, targetCamLook).normalize();
    const currentDist = camera.position.distanceTo(targetCamLook);
    // Allows zoom down to 0.35m for extreme close-up inspection
    const newDist = Math.max(0.35, Math.min(6.5, currentDist + deltaY * 0.004));
    targetCamPos.copy(targetCamLook).addScaledVector(dir, newDist);
  };

  const clock = new THREE.Clock();

  const animate = () => {
    animId = requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const time = clock.getElapsedTime();

    // Smooth camera transition
    camera.position.lerp(targetCamPos, 0.08);
    camera.lookAt(targetCamLook);

    // Turntable slow rotation
    if (isTurntableActive) {
      bikeRotationAngle += delta * 0.35;
      bikeGroup.rotation.y = bikeRotationAngle;
    }

    // Subtle idle motorcycle rumble
    if (currentBikeModel) {
      const idleVibe = Math.sin(time * 35) * 0.0006;
      currentBikeModel.group.position.y = 0.12 + idleVibe;
      currentBikeModel.updateAnimation(0, 0.12, 0, 0, false, false, delta);
    }

    renderer.render(scene, camera);
  };

  const start = () => {
    if (!animId) {
      clock.start();
      animate();
    }
  };

  const stop = () => {
    if (animId) {
      cancelAnimationFrame(animId);
      animId = null;
    }
  };

  const dispose = () => {
    stop();
    if (currentBikeModel) currentBikeModel.dispose();
    discGeo.dispose();
    discMat.dispose();
    ringGeo.dispose();
    ringMat.dispose();
    floorGeo.dispose();
    floorTex.dispose();
    // Cleanly dispose renderer without artificially triggering context loss
    renderer.dispose();
    if (canvas.parentElement) {
      canvas.parentElement.removeChild(canvas);
    }
  };

  return {
    renderer,
    scene,
    camera,
    setBike,
    start,
    stop,
    setCameraTarget,
    toggleRider,
    toggleTurntable,
    rotateBike,
    zoomCamera,
    dispose,
  };
}
