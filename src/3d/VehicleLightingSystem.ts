import * as THREE from 'three';
import { TimeOfDay, WeatherType } from '../types/openCity';

// ============================================================================
// CACHED PROCEDURAL TEXTURES FOR REALISTIC DYNAMIC VEHICLE LIGHTING
// ============================================================================

let cachedProjectorHeadlightTex: THREE.CanvasTexture | null = null;
let cachedClassicHeadlightTex: THREE.CanvasTexture | null = null;
let cachedTaillightIdleTex: THREE.CanvasTexture | null = null;
let cachedTaillightBrakeTex: THREE.CanvasTexture | null = null;
let cachedOpticalFlareTex: THREE.CanvasTexture | null = null;
let cachedCarRoadConeTex: THREE.CanvasTexture | null = null;
let cachedBikeRoadConeTex: THREE.CanvasTexture | null = null;
let cachedTruckRoadConeTex: THREE.CanvasTexture | null = null;
let cachedBrakeWashTex: THREE.CanvasTexture | null = null;

/**
 * Modern Twin Projector LED Headlight Texture with Halo DRL, Fresnel rings,
 * micro-prisms and high-intensity optical beam hotspot.
 */
export function getProjectorHeadlightTexture(): THREE.CanvasTexture {
  if (cachedProjectorHeadlightTex) return cachedProjectorHeadlightTex;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // 1. Dark optical housing bezel
  ctx.fillStyle = '#06080b';
  ctx.fillRect(0, 0, 256, 256);

  // 2. Chrome faceted background reflector grid
  ctx.fillStyle = '#1e2430';
  for (let y = 0; y < 256; y += 16) {
    for (let x = 0; x < 256; x += 16) {
      if ((x + y) % 32 === 0) {
        ctx.fillRect(x, y, 15, 15);
      }
    }
  }

  // 3. Crisp LED Halo DRL (Daytime Running Light) Ring
  ctx.strokeStyle = '#e0f2fe';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.arc(128, 128, 98, 0, Math.PI * 2);
  ctx.stroke();

  // Outer subtle cyan/ice-blue bloom
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(128, 128, 108, 0, Math.PI * 2);
  ctx.stroke();

  // 4. Concentric Fresnel projector lens rings
  for (let r = 78; r >= 20; r -= 10) {
    const alpha = 0.25 + (1 - r / 78) * 0.4;
    ctx.strokeStyle = `rgba(240, 249, 255, ${alpha})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(128, 128, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 5. High-intensity Xenon/LED core projector hotspot
  const coreGrad = ctx.createRadialGradient(128, 128, 0, 128, 128, 48);
  coreGrad.addColorStop(0, '#ffffff');
  coreGrad.addColorStop(0.3, '#f0f9ff');
  coreGrad.addColorStop(0.7, '#38bdf8');
  coreGrad.addColorStop(1, 'rgba(14, 165, 233, 0)');
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(128, 128, 48, 0, Math.PI * 2);
  ctx.fill();

  // Horizontal optical cut-off baffle line (standard automotive low-beam characteristic)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
  ctx.fillRect(40, 138, 176, 5);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  cachedProjectorHeadlightTex = tex;
  return tex;
}

/**
 * Classic Fluted Glass Headlamp Texture with warm halogen filament glow
 * (Used for Auto-rickshaws, classic Indian trucks, commuter bikes).
 */
export function getClassicHeadlightTexture(): THREE.CanvasTexture {
  if (cachedClassicHeadlightTex) return cachedClassicHeadlightTex;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // 1. Chrome reflector dish
  const chromeGrad = ctx.createRadialGradient(128, 128, 10, 128, 128, 126);
  chromeGrad.addColorStop(0, '#fef08a');
  chromeGrad.addColorStop(0.4, '#e2e8f0');
  chromeGrad.addColorStop(0.85, '#64748b');
  chromeGrad.addColorStop(1, '#1e293b');
  ctx.fillStyle = chromeGrad;
  ctx.beginPath();
  ctx.arc(128, 128, 126, 0, Math.PI * 2);
  ctx.fill();

  // 2. Fluted glass vertical diffuser prisms
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 3;
  for (let x = 32; x <= 224; x += 12) {
    ctx.beginPath();
    ctx.moveTo(x, 28);
    ctx.lineTo(x, 228);
    ctx.stroke();
  }

  // 3. Central warm halogen filament bulb
  const bulbGrad = ctx.createRadialGradient(128, 128, 0, 128, 128, 52);
  bulbGrad.addColorStop(0, '#ffffff');
  bulbGrad.addColorStop(0.25, '#fef08a');
  bulbGrad.addColorStop(0.7, '#f59e0b');
  bulbGrad.addColorStop(1, 'rgba(217, 119, 6, 0)');
  ctx.fillStyle = bulbGrad;
  ctx.beginPath();
  ctx.arc(128, 128, 52, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  cachedClassicHeadlightTex = tex;
  return tex;
}

/**
 * Taillight Emissive Texture:
 * - Idle / running: sleek neon light tube ribbon & micro-honeycomb reflectors
 * - Brake: intense blinding LED cluster matrix & radiant red flare
 */
export function getTaillightEmissiveTexture(braking: boolean): THREE.CanvasTexture {
  if (braking && cachedTaillightBrakeTex) return cachedTaillightBrakeTex;
  if (!braking && cachedTaillightIdleTex) return cachedTaillightIdleTex;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Dark background housing
  ctx.fillStyle = braking ? '#580808' : '#2b0606';
  ctx.fillRect(0, 0, 256, 128);

  // Micro-honeycomb retro-reflectors
  ctx.fillStyle = braking ? '#991b1b' : '#450a0a';
  for (let y = 8; y < 120; y += 12) {
    for (let x = 8; x < 248; x += 12) {
      ctx.beginPath();
      ctx.arc(x + (y % 24 === 0 ? 0 : 6), y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (!braking) {
    // RUNNING STATE: Stylized continuous neon light guide ribbon
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Top and bottom sleek LED tube border
    ctx.strokeRect(16, 18, 224, 92);

    // Inner subtle glow ribbon
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 22, 216, 84);
  } else {
    // BRAKING STATE: Intense LED matrix clusters + radiant bloom
    // Outer saturated crimson halo
    ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
    ctx.fillRect(10, 10, 236, 108);

    // Dense grid of high-intensity LED brake emitters
    for (let y = 24; y <= 104; y += 16) {
      for (let x = 24; x <= 232; x += 16) {
        const dotGrad = ctx.createRadialGradient(x, y, 0, x, y, 9);
        dotGrad.addColorStop(0, '#ffffff'); // Pure white-hot core
        dotGrad.addColorStop(0.3, '#fecdd3');
        dotGrad.addColorStop(0.65, '#ef4444');
        dotGrad.addColorStop(1, 'rgba(185, 28, 28, 0)');
        ctx.fillStyle = dotGrad;
        ctx.beginPath();
        ctx.arc(x, y, 9, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // High-power central brake light bar
    ctx.fillStyle = '#fff1f2';
    ctx.fillRect(36, 58, 184, 12);
  }

  const tex = new THREE.CanvasTexture(canvas);
  if (braking) cachedTaillightBrakeTex = tex;
  else cachedTaillightIdleTex = tex;
  return tex;
}

/**
 * Optical Lens Flare Texture for dynamic taillight flaring:
 * Features a blinding white core, intense saturated red corona,
 * horizontal anamorphic streaks, and smooth radial bloom falloff.
 */
export function getOpticalFlareTexture(): THREE.CanvasTexture {
  if (cachedOpticalFlareTex) return cachedOpticalFlareTex;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const cx = 128;
  const cy = 128;

  // Clear background
  ctx.clearRect(0, 0, 256, 256);

  // 1. Soft radial red bloom corona
  const bloomGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 126);
  bloomGrad.addColorStop(0, 'rgba(255, 30, 30, 0.95)');
  bloomGrad.addColorStop(0.18, 'rgba(239, 68, 68, 0.7)');
  bloomGrad.addColorStop(0.45, 'rgba(185, 28, 28, 0.35)');
  bloomGrad.addColorStop(0.75, 'rgba(127, 29, 29, 0.12)');
  bloomGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = bloomGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, 126, 0, Math.PI * 2);
  ctx.fill();

  // 2. Horizontal anamorphic lens flare streak
  const streakGrad = ctx.createLinearGradient(0, cy, 256, cy);
  streakGrad.addColorStop(0, 'rgba(255, 50, 50, 0)');
  streakGrad.addColorStop(0.35, 'rgba(255, 60, 60, 0.4)');
  streakGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.95)');
  streakGrad.addColorStop(0.65, 'rgba(255, 60, 60, 0.4)');
  streakGrad.addColorStop(1, 'rgba(255, 50, 50, 0)');

  ctx.fillStyle = streakGrad;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 124, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // 3. Subtle vertical cross-star ray
  ctx.fillStyle = 'rgba(255, 180, 180, 0.35)';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 4, 48, 0, 0, Math.PI * 2);
  ctx.fill();

  // 4. Ultra-bright white-hot core
  const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 24);
  coreGrad.addColorStop(0, '#ffffff');
  coreGrad.addColorStop(0.4, '#ffe4e6');
  coreGrad.addColorStop(0.8, '#ef4444');
  coreGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, 24, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  cachedOpticalFlareTex = tex;
  return tex;
}

/**
 * Realistic Headlight Asphalt Light Cone Texture:
 * Models the photometric IES road projection of low/high beams:
 * - Overlapping dual projector lobes
 * - Central high-illumination hotspot where beams strike asphalt (6-14m ahead)
 * - Asymmetrical beam cut-off line (wider toward curb side)
 * - Smooth exponential longitudinal & lateral falloff
 */
export function getRoadHeadlightConeTexture(
  vehicleType: 'car' | 'bike' | 'truck' | 'rickshaw' = 'car'
): THREE.CanvasTexture {
  if (vehicleType === 'bike' && cachedBikeRoadConeTex) return cachedBikeRoadConeTex;
  if (vehicleType === 'truck' && cachedTruckRoadConeTex) return cachedTruckRoadConeTex;
  if (vehicleType === 'car' && cachedCarRoadConeTex) return cachedCarRoadConeTex;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 256, 512);

  // In our ground plane: y=0 on canvas is closest to vehicle bumper, y=512 is 35m ahead
  const w = 256;
  const h = 512;

  // Background gradient: fades from bumper out to tip
  if (vehicleType === 'bike') {
    // Single / twin tight high-intensity beam cone
    const beamGrad = ctx.createRadialGradient(128, 140, 10, 128, 220, 260);
    beamGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    beamGrad.addColorStop(0.25, 'rgba(224, 242, 254, 0.75)');
    beamGrad.addColorStop(0.6, 'rgba(56, 189, 248, 0.35)');
    beamGrad.addColorStop(0.85, 'rgba(14, 165, 233, 0.12)');
    beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(100, 20);
    ctx.lineTo(156, 20);
    ctx.lineTo(240, 500);
    ctx.lineTo(16, 500);
    ctx.closePath();
    ctx.fill();

    // Intense central sportbike focal punch
    const spotGrad = ctx.createRadialGradient(128, 160, 0, 128, 160, 90);
    spotGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
    spotGrad.addColorStop(0.4, 'rgba(240, 249, 255, 0.5)');
    spotGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = spotGrad;
    ctx.beginPath();
    ctx.arc(128, 160, 90, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Dual automotive projector lobes (Left and Right headlights)
    const lobePositions = vehicleType === 'truck' ? [76, 180] : [92, 164];

    lobePositions.forEach((lx) => {
      const lobeGrad = ctx.createRadialGradient(lx, 150, 8, lx, 220, 240);
      lobeGrad.addColorStop(0, 'rgba(255, 255, 255, 0.88)');
      lobeGrad.addColorStop(0.3, 'rgba(240, 249, 255, 0.65)');
      lobeGrad.addColorStop(0.65, 'rgba(186, 230, 253, 0.28)');
      lobeGrad.addColorStop(0.9, 'rgba(14, 165, 233, 0.08)');
      lobeGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = lobeGrad;
      ctx.beginPath();
      ctx.ellipse(lx, 220, 75, 180, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // Unified forward illumination envelope
    const mainBeam = ctx.createLinearGradient(0, 30, 0, 500);
    mainBeam.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
    mainBeam.addColorStop(0.25, 'rgba(255, 255, 255, 0.85)');
    mainBeam.addColorStop(0.55, 'rgba(224, 242, 254, 0.45)');
    mainBeam.addColorStop(0.85, 'rgba(56, 189, 248, 0.15)');
    mainBeam.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = mainBeam;
    ctx.beginPath();
    ctx.moveTo(vehicleType === 'truck' ? 50 : 70, 30);
    ctx.lineTo(vehicleType === 'truck' ? 206 : 186, 30);
    ctx.lineTo(250, 500);
    ctx.lineTo(6, 500);
    ctx.closePath();
    ctx.fill();
  }

  // Asphalt light diffusion grain
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  for (let i = 0; i < 600; i++) {
    const rx = Math.random() * w;
    const ry = Math.random() * h;
    ctx.fillRect(rx, ry, 2, 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;

  if (vehicleType === 'bike') cachedBikeRoadConeTex = tex;
  else if (vehicleType === 'truck') cachedTruckRoadConeTex = tex;
  else cachedCarRoadConeTex = tex;

  return tex;
}

/**
 * Asphalt Ground Brake Wash Texture:
 * Cast directly onto the road surface behind the vehicle when braking.
 */
export function getGroundBrakeWashTexture(): THREE.CanvasTexture {
  if (cachedBrakeWashTex) return cachedBrakeWashTex;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const cx = 128;
  const cy = 128;

  const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 120);
  grad.addColorStop(0, 'rgba(255, 20, 20, 0.85)');
  grad.addColorStop(0.35, 'rgba(220, 38, 38, 0.55)');
  grad.addColorStop(0.7, 'rgba(153, 27, 27, 0.22)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 120, 85, 0, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  cachedBrakeWashTex = tex;
  return tex;
}

// ============================================================================
// VEHICLE LIGHTING ATTACHMENTS & RENDER CONTROLLERS
// ============================================================================

export interface VehicleLightingController {
  headlightRoadCone: THREE.Mesh;
  brakeWashMesh: THREE.Mesh;
  flareSprites: THREE.Mesh[];
  setBraking: (isBraking: boolean, delta: number) => void;
  updateDayNightAndWeather: (timeOfDay: TimeOfDay, weather: WeatherType) => void;
  dispose: () => void;
}

export interface AttachLightingOptions {
  vehicleType: 'car' | 'bike' | 'truck' | 'rickshaw' | 'bus';
  bumperFrontZ: number;
  bumperRearZ: number;
  width: number;
  taillightPositions: { x: number; y: number; z: number }[];
}

/**
 * Attaches dynamic road surface headlight cone projection, taillight optical flare
 * sprites, and ground brake wash to any vehicle root group.
 */
export function attachVehicleLighting(
  vehicleRoot: THREE.Group,
  options: AttachLightingOptions
): VehicleLightingController {
  const { vehicleType, bumperFrontZ, bumperRearZ, width, taillightPositions } = options;

  // 1. ROAD SURFACE HEADLIGHT CONE PROJECTION
  // Dimensions calibrated to vehicle classification
  let coneLength = 32;
  let coneFrontWidth = width * 1.05;
  let coneEndWidth = width * 3.4;

  if (vehicleType === 'bike') {
    coneLength = 34;
    coneFrontWidth = 1.4;
    coneEndWidth = 5.6;
  } else if (vehicleType === 'truck' || vehicleType === 'bus') {
    coneLength = 40;
    coneFrontWidth = width * 1.1;
    coneEndWidth = width * 3.8;
  } else if (vehicleType === 'rickshaw') {
    coneLength = 22;
    coneFrontWidth = 1.6;
    coneEndWidth = 4.8;
  }

  // Create ground projection plane lying flat on asphalt
  // y = 0.04m keeps it cleanly above asphalt road geometry and potholes without z-fighting
  const coneGeo = new THREE.PlaneGeometry(coneEndWidth, coneLength, 1, 1);
  coneGeo.rotateX(-Math.PI / 2); // Lay flat on X-Z plane

  const coneTexType =
    vehicleType === 'bike'
      ? 'bike'
      : vehicleType === 'truck' || vehicleType === 'bus'
      ? 'truck'
      : 'car';
  const coneTex = getRoadHeadlightConeTexture(coneTexType);

  const coneMat = new THREE.MeshBasicMaterial({
    map: coneTex,
    transparent: true,
    opacity: 0.78, // Initial night/evening baseline
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const headlightRoadCone = new THREE.Mesh(coneGeo, coneMat);
  // Center plane so its near edge starts right at the front bumper
  const coneCenterZ = bumperFrontZ + coneLength / 2;
  headlightRoadCone.position.set(0, 0.038, coneCenterZ);
  vehicleRoot.add(headlightRoadCone);

  // 2. ASPHALT GROUND BRAKE WASH (behind rear bumper)
  const washLength = 4.2;
  const washWidth = width * 1.5;
  const washGeo = new THREE.PlaneGeometry(washWidth, washLength);
  washGeo.rotateX(-Math.PI / 2);

  const washMat = new THREE.MeshBasicMaterial({
    map: getGroundBrakeWashTexture(),
    transparent: true,
    opacity: 0.0, // Hidden when cruising, flares when braking!
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const brakeWashMesh = new THREE.Mesh(washGeo, washMat);
  brakeWashMesh.position.set(0, 0.035, bumperRearZ - washLength / 2.2);
  vehicleRoot.add(brakeWashMesh);

  // 3. OPTICAL LENS FLARE SPRITES / BILLBOARDS AT EACH TAILLIGHT
  const flareGeo = new THREE.PlaneGeometry(0.65, 0.65);
  const flareTex = getOpticalFlareTexture();
  const flareSprites: THREE.Mesh[] = [];

  taillightPositions.forEach((pos) => {
    const fMat = new THREE.MeshBasicMaterial({
      map: flareTex,
      transparent: true,
      opacity: 0.22, // Running glow
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    const flareMesh = new THREE.Mesh(flareGeo, fMat);
    // Positioned slightly in front of taillight lens along -Z
    flareMesh.position.set(pos.x, pos.y, pos.z - 0.03);
    flareMesh.scale.set(0.24, 0.24, 0.24);
    vehicleRoot.add(flareMesh);
    flareSprites.push(flareMesh);
  });

  // State variables for smooth animation & dynamic environmental reactivity
  let currentBraking = false;
  let flareScale = 0.24;
  let targetFlareScale = 0.24;
  let flareOpacity = 0.22;
  let targetFlareOpacity = 0.22;
  let washOpacity = 0.0;
  let targetWashOpacity = 0.0;

  // Environmental lighting modifier (0 = bright sunny midday, 1 = midnight)
  let nightFactor = 0.85;

  const setBraking = (isBraking: boolean, delta: number) => {
    currentBraking = isBraking;

    if (isBraking) {
      // Dynamic flare expansion: 2.5x - 3.5x size
      targetFlareScale = vehicleType === 'truck' || vehicleType === 'bus' ? 1.05 : 0.72;
      targetFlareOpacity = 0.95;
      targetWashOpacity = 0.65;
    } else {
      targetFlareScale = 0.22;
      targetFlareOpacity = nightFactor > 0.4 ? 0.26 : 0.08;
      targetWashOpacity = 0.0;
    }

    // Smooth physics-based interpolation
    const lerpRate = isBraking ? 18.0 : 8.0;
    flareScale = THREE.MathUtils.lerp(flareScale, targetFlareScale, Math.min(1.0, delta * lerpRate));
    flareOpacity = THREE.MathUtils.lerp(flareOpacity, targetFlareOpacity, Math.min(1.0, delta * lerpRate));
    washOpacity = THREE.MathUtils.lerp(washOpacity, targetWashOpacity, Math.min(1.0, delta * lerpRate));

    // Optional subtle pulsing bloom while braking
    const pulse = isBraking ? 1.0 + Math.sin(performance.now() * 0.02) * 0.06 : 1.0;
    const finalScale = flareScale * pulse;

    flareSprites.forEach((fs) => {
      fs.scale.set(finalScale, finalScale, finalScale);
      (fs.material as THREE.MeshBasicMaterial).opacity = flareOpacity;
    });

    washMat.opacity = washOpacity;
  };

  const updateDayNightAndWeather = (timeOfDay: TimeOfDay, weather: WeatherType) => {
    if (timeOfDay === 'night') {
      nightFactor = 0.9;
      coneMat.opacity = weather === 'rain' ? 0.92 : 0.82;
    } else if (timeOfDay === 'sunset') {
      nightFactor = 0.55;
      coneMat.opacity = 0.48;
    } else if (weather === 'rain' || weather === 'fog') {
      nightFactor = 0.65;
      coneMat.opacity = 0.72;
    } else {
      // Daylight / Afternoon
      nightFactor = 0.08;
      coneMat.opacity = 0.06; // Faint road surface specular highlight
    }
  };

  const dispose = () => {
    coneGeo.dispose();
    coneMat.dispose();
    washGeo.dispose();
    washMat.dispose();
    flareGeo.dispose();
    flareSprites.forEach((fs) => {
      (fs.material as THREE.Material).dispose();
      vehicleRoot.remove(fs);
    });
    vehicleRoot.remove(headlightRoadCone);
    vehicleRoot.remove(brakeWashMesh);
  };

  return {
    headlightRoadCone,
    brakeWashMesh,
    flareSprites,
    setBraking,
    updateDayNightAndWeather,
    dispose,
  };
}
