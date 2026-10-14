import * as THREE from 'three';
import {
  getProjectorHeadlightTexture,
  getTaillightEmissiveTexture,
  attachVehicleLighting,
  VehicleLightingController,
} from './VehicleLightingSystem';
import { TimeOfDay, WeatherType } from '../types/openCity';

export type CarDesignStyle = 'bmw_m' | 'benz_amg';
export type AutomotiveDriveMode = 'SPORT+' | 'COMFORT' | 'CORSA' | 'ECO' | 'INDIVIDUAL';

export interface ModernCarInstance {
  group: THREE.Group;
  wheels: THREE.Group[];
  frontLeftWheel: THREE.Group;
  frontRightWheel: THREE.Group;
  steeringWheelMesh?: THREE.Mesh | THREE.Group;
  gearShifterLever?: THREE.Group;
  headLights: THREE.Mesh[];
  tailLights: THREE.Mesh[];
  brakeLights: THREE.Mesh[];
  exhaustPipes: THREE.Mesh[];
  interiorCluster?: THREE.Mesh;
  driverMesh?: THREE.Group;
  lighting?: VehicleLightingController;
  bodyColor: string;
  carStyle: CarDesignStyle;
  driveMode: AutomotiveDriveMode;
  ambientLightColor: string;
  setStyle: (style: CarDesignStyle) => void;
  setDriveMode: (mode: AutomotiveDriveMode) => void;
  setAmbientLightColor: (colorHex: string) => void;
  getActiveAeroAngle: () => number;
  getActiveAeroDownforceKg: () => number;
  isAirbrakeActive: () => boolean;
  setBraking: (braking: boolean) => void;
  setSteeringAngle: (steerRatio: number) => void;
  triggerGearShift?: (targetGear?: string, isDownshift?: boolean) => void;
  getCurrentGear?: () => string;
  setCockpitView?: (isCockpit: boolean) => void;
  updateAnimation: (
    speed: number,
    rpmRatio: number,
    steer: number,
    isBraking: boolean,
    isNitro: boolean,
    delta: number,
    timeOfDay?: TimeOfDay,
    weather?: WeatherType,
    throttle?: number,
    reverse?: boolean
  ) => void;
  updateColor: (bodyColor: string, rimColor?: string) => void;
  dispose: () => void;
}

// Drive Mode Ambient Light Preset Map
export const DRIVE_MODE_AMBIENT_COLORS: Record<AutomotiveDriveMode, string> = {
  'SPORT+': '#ef4444',     // Crimson M/AMG Red
  'COMFORT': '#0ea5e9',    // Electric Sky Blue
  'CORSA': '#f97316',      // Sunset Track Orange
  'ECO': '#10b981',        // Emerald Mint Green
  'INDIVIDUAL': '#a855f7', // Cyberpunk Purple / Amethyst
};

// Procedural Carbon Fiber Texture
function createCarbonFiberTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#0f1115';
  ctx.fillRect(0, 0, 64, 64);

  ctx.fillStyle = '#1c2028';
  for (let y = 0; y < 64; y += 8) {
    for (let x = 0; x < 64; x += 8) {
      if ((x + y) % 16 === 0) {
        ctx.fillRect(x, y, 7, 7);
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 8);
  return tex;
}

// Procedural BMW Roundel Emblem Texture (Blue & White Quadrant)
function createBmwRoundelTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Outer chrome ring
  ctx.beginPath();
  ctx.arc(64, 64, 62, 0, Math.PI * 2);
  ctx.fillStyle = '#e2e8f0';
  ctx.fill();

  // Black ring with BMW text
  ctx.beginPath();
  ctx.arc(64, 64, 58, 0, Math.PI * 2);
  ctx.fillStyle = '#090a0f';
  ctx.fill();

  // Silver typography "B M W"
  ctx.fillStyle = '#f1f5f9';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('B M W', 64, 22);

  // Inner ring border
  ctx.beginPath();
  ctx.arc(64, 64, 38, 0, Math.PI * 2);
  ctx.fillStyle = '#cbd5e1';
  ctx.fill();

  // Quadrants: Top-Left & Bottom-Right = BMW Blue, Top-Right & Bottom-Left = White
  const cx = 64;
  const cy = 64;
  const r = 36;

  // Blue Quadrant 1 (Top-Left)
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, r, Math.PI, Math.PI * 1.5);
  ctx.closePath();
  ctx.fillStyle = '#0066b1';
  ctx.fill();

  // White Quadrant 1 (Top-Right)
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, r, Math.PI * 1.5, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  // Blue Quadrant 2 (Bottom-Right)
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, r, 0, Math.PI * 0.5);
  ctx.closePath();
  ctx.fillStyle = '#0066b1';
  ctx.fill();

  // White Quadrant 2 (Bottom-Left)
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, r, Math.PI * 0.5, Math.PI);
  ctx.closePath();
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  // Silver divider cross
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - r, cy);
  ctx.lineTo(cx + r, cy);
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx, cy + r);
  ctx.stroke();

  return new THREE.CanvasTexture(canvas);
}

// Procedural Mercedes-Benz 3-Pointed Star Texture
function createMercedesStarTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Dark obsidian badge background
  ctx.beginPath();
  ctx.arc(64, 64, 62, 0, Math.PI * 2);
  ctx.fillStyle = '#090d14';
  ctx.fill();

  // Outer polished chrome ring
  ctx.beginPath();
  ctx.arc(64, 64, 58, 0, Math.PI * 2);
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 6;
  ctx.stroke();

  // Subtle inner ring
  ctx.beginPath();
  ctx.arc(64, 64, 53, 0, Math.PI * 2);
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw 3-Pointed Star (Points at -90°, 30°, 150°)
  const cx = 64;
  const cy = 64;
  const starRadius = 52;
  const angles = [-Math.PI / 2, Math.PI / 6, (5 * Math.PI) / 6];

  angles.forEach((angle) => {
    const tipX = cx + Math.cos(angle) * starRadius;
    const tipY = cy + Math.sin(angle) * starRadius;
    const leftBaseAngle = angle - Math.PI / 2.5;
    const rightBaseAngle = angle + Math.PI / 2.5;
    const baseR = 10;

    // Light facet
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(tipX, tipY);
    ctx.lineTo(cx + Math.cos(leftBaseAngle) * baseR, cy + Math.sin(leftBaseAngle) * baseR);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Shadow facet
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(tipX, tipY);
    ctx.lineTo(cx + Math.cos(rightBaseAngle) * baseR, cy + Math.sin(rightBaseAngle) * baseR);
    ctx.closePath();
    ctx.fillStyle = '#94a3b8';
    ctx.fill();
  });

  // Center star hub
  ctx.beginPath();
  ctx.arc(cx, cy, 7, 0, Math.PI * 2);
  ctx.fillStyle = '#f8fafc';
  ctx.fill();

  return new THREE.CanvasTexture(canvas);
}

// Procedural BMW i5 LWB / G60 Twin Vertical Arrow LED Headlight Texture
// Exactly matches the user's reference photos with two vertical angled LED light bars per headlight!
function createBmwI5HeadlightTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Smoked high-tech composite headlight housing
  ctx.fillStyle = '#06080d';
  ctx.fillRect(0, 0, 256, 128);

  // Carbon / dark reflector chamber gradient
  const grad = ctx.createLinearGradient(0, 0, 256, 128);
  grad.addColorStop(0, '#0a0d14');
  grad.addColorStop(1, '#020305');
  ctx.fillStyle = grad;
  ctx.fillRect(4, 4, 248, 120);

  // DUAL VERTICAL ARROW/SLASH DRL BARS (Signature G60 5 Series / i5 design!)
  const arrowBars = [
    { x1: 72, y1: 22, x2: 96, y2: 104 },
    { x1: 154, y1: 22, x2: 178, y2: 104 },
  ];

  arrowBars.forEach(({ x1, y1, x2, y2 }) => {
    // Outer cyan/electric blue halo glow
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Intense pure white core LED phosphor bar
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Subtle blue accent tick on top
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x1 - 10, y1 + 8);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  });

  // Dual high-output matrix LED projector crystal lenses behind the bars
  [50, 132].forEach((lx) => {
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(lx, 64, 24, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(lx, 64, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(lx, 64, 6, 0, Math.PI * 2);
    ctx.fill();
  });

  // Top slim eyebrow accent line
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(12, 14);
  ctx.lineTo(240, 18);
  ctx.stroke();

  return new THREE.CanvasTexture(canvas);
}

// Procedural BMW i5 Iconic Glow Kidney Grille Texture (Illuminated Rim Contour + Aero Slats + M badge)
function createBmwI5KidneyTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#05070a';
  ctx.fillRect(0, 0, 256, 256);

  // Closed-off high-gloss aerodynamic kidney surface (i5 Electric)
  const pad = 12;
  ctx.beginPath();
  ctx.roundRect(pad, pad, 256 - pad * 2, 256 - pad * 2, 36);
  ctx.fillStyle = '#080a0f';
  ctx.fill();

  // ICONIC GLOW illuminated perimeter ring
  ctx.strokeStyle = '#67e8f9';
  ctx.lineWidth = 10;
  ctx.stroke();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Dark vertical aerodynamic slats with satin silver highlights
  for (let x = 44; x < 220; x += 22) {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x - 3, 24, 6, 208);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(x - 1, 28, 2, 200);
  }

  // Right sensor plate & M badge
  ctx.fillStyle = '#020617';
  ctx.fillRect(60, 120, 48, 24);

  // M badge stripes
  ctx.fillStyle = '#00a3e0';
  ctx.fillRect(66, 124, 6, 16);
  ctx.fillStyle = '#002b49';
  ctx.fillRect(73, 124, 6, 16);
  ctx.fillStyle = '#e21c21';
  ctx.fillRect(80, 124, 6, 16);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('M', 88, 137);

  return new THREE.CanvasTexture(canvas);
}

// Front License Plate Texture matching Photo 1: "BMW i5 LWB" on EV Green Backing
function createBmwI5FrontPlateTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  // High-gloss dark teal-green electric car license plate
  ctx.fillStyle = '#064e3b';
  ctx.fillRect(0, 0, 256, 64);

  // White inner border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.strokeRect(4, 4, 248, 56);

  // Typography "BMW i5 LWB"
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('BMW i5 LWB', 128, 32);

  return new THREE.CanvasTexture(canvas);
}

// Rear License Plate Texture matching Photo 2: German Dingolfing electric plate "DGF I 541E"
function createBmwI5RearPlateTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  // White reflective license plate
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 256, 64);
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 3;
  ctx.strokeRect(3, 3, 250, 58);

  // Blue EU flag band on left
  ctx.fillStyle = '#003399';
  ctx.fillRect(4, 4, 38, 56);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('D', 23, 44);

  // European typography "DGF I 541E"
  ctx.fillStyle = '#0f172a';
  ctx.font = '900 24px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('DGF I 541E', 150, 32);

  return new THREE.CanvasTexture(canvas);
}

// Hofmeister Kink Trim with embossed numeral "5" as seen in Photo 2
function createBmwI5HofmeisterTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#07090e';
  ctx.fillRect(0, 0, 64, 64);

  // Embossed '5' numeral
  ctx.fillStyle = '#334155';
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('5', 32, 32);

  ctx.fillStyle = '#cbd5e1';
  ctx.fillText('5', 30, 30);

  return new THREE.CanvasTexture(canvas);
}

// Procedural Mercedes Multibeam LED Headlight Texture (Curved Eyebrow Torch)
function createMercedesMultibeamTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#05070a';
  ctx.fillRect(0, 0, 256, 128);

  ctx.beginPath();
  ctx.moveTo(15, 20);
  ctx.bezierCurveTo(90, 15, 180, 25, 240, 50);
  ctx.strokeStyle = '#67e8f9';
  ctx.lineWidth = 12;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(15, 20);
  ctx.bezierCurveTo(90, 15, 180, 25, 240, 50);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 6;
  ctx.stroke();

  const blocks = [70, 160];
  blocks.forEach((bx) => {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(bx - 26, 48, 52, 48);

    ctx.fillStyle = '#e0f2fe';
    ctx.beginPath();
    ctx.arc(bx, 72, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(bx, 72, 8, 0, Math.PI * 2);
    ctx.fill();
  });

  return new THREE.CanvasTexture(canvas);
}

// Procedural Digital Cockpit Glass Instrument Cluster Screen
function createDigitalCockpitTexture(speed = 0, gear = 'D', rpmRatio = 0.2, driveMode = 'SPORT+'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#05070a';
  ctx.fillRect(0, 0, 512, 160);

  const grad = ctx.createLinearGradient(0, 0, 512, 160);
  grad.addColorStop(0, '#090d14');
  grad.addColorStop(0.5, '#0d131d');
  grad.addColorStop(1, '#090d14');
  ctx.fillStyle = grad;
  ctx.fillRect(4, 4, 504, 152);

  const themeColor = driveMode === 'SPORT+' ? '#ef4444' : driveMode === 'CORSA' ? '#f97316' : driveMode === 'ECO' ? '#10b981' : driveMode === 'INDIVIDUAL' ? '#a855f7' : '#06b6d4';
  ctx.strokeStyle = themeColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(8, 8, 496, 144);

  // Digital Tachometer Arc (Left)
  ctx.beginPath();
  ctx.arc(110, 80, 56, Math.PI * 0.75, Math.PI * 2.25);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 10;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(110, 80, 56, Math.PI * 0.75, Math.PI * (0.75 + 1.5 * Math.min(1, rpmRatio)));
  ctx.strokeStyle = rpmRatio > 0.85 ? '#ef4444' : themeColor;
  ctx.lineWidth = 10;
  ctx.stroke();

  // Speedometer Numbers (Center)
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 54px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(Math.round(speed).toString(), 256, 92);

  ctx.fillStyle = themeColor;
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText(`KM/H  •  ${driveMode} DYNAMIC`, 256, 122);

  // Gear Indicator (Right)
  ctx.beginPath();
  ctx.arc(400, 80, 48, 0, Math.PI * 2);
  ctx.fillStyle = '#0b1324';
  ctx.fill();
  ctx.strokeStyle = themeColor;
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = themeColor;
  ctx.font = 'bold 36px monospace';
  ctx.fillText(gear, 400, 92);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px sans-serif';
  ctx.fillText('xDRIVE / 4MATIC', 400, 118);

  return new THREE.CanvasTexture(canvas);
}

// Procedural Tire Tread Texture (Heavy-Duty All-Terrain SUV Tread)
function createTireTreadTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#14161a';
  ctx.fillRect(0, 0, 128, 128);

  ctx.fillStyle = '#08090b';
  ctx.fillRect(16, 0, 8, 128);
  ctx.fillRect(48, 0, 10, 128);
  ctx.fillRect(72, 0, 10, 128);
  ctx.fillRect(104, 0, 8, 128);

  ctx.strokeStyle = '#08090b';
  ctx.lineWidth = 4;
  for (let y = 0; y < 128; y += 16) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(16, y + 8);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(24, y + 4);
    ctx.lineTo(48, y + 12);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(58, y + 4);
    ctx.lineTo(72, y + 12);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(82, y + 4);
    ctx.lineTo(104, y + 12);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(112, y + 4);
    ctx.lineTo(128, y + 8);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 4);
  return tex;
}

// Procedural Front Honeycomb Radiator Mesh Texture
function createHoneycombGrilleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#0a0d14';
  ctx.fillRect(0, 0, 64, 64);

  ctx.strokeStyle = '#1e2638';
  ctx.lineWidth = 2;
  const s = 10;
  for (let y = 0; y < 64; y += s) {
    for (let x = 0; x < 64; x += s) {
      ctx.beginPath();
      ctx.arc(x + (y % (s * 2) === 0 ? 0 : s / 2), y, s * 0.4, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  return tex;
}

// Procedural Illuminated PRND Console Shift Status Texture
function createShifterPrndTexture(activeGear = 'P'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 36;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#080a10';
  ctx.fillRect(0, 0, 128, 36);

  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.strokeRect(1, 1, 126, 34);

  const gears = ['P', 'R', 'N', 'D'];
  const highlightChar =
    activeGear === 'P'
      ? 'P'
      : activeGear === 'R'
      ? 'R'
      : activeGear === 'N'
      ? 'N'
      : 'D';

  ctx.font = 'bold 15px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  gears.forEach((g, idx) => {
    const x = 16 + idx * 32;
    const isAct = g === highlightChar;
    if (isAct) {
      ctx.fillStyle =
        g === 'P'
          ? 'rgba(239, 68, 68, 0.35)'
          : g === 'R'
          ? 'rgba(245, 158, 11, 0.35)'
          : 'rgba(14, 165, 233, 0.35)';
      ctx.beginPath();
      ctx.roundRect(x - 12, 5, 24, 26, 4);
      ctx.fill();

      ctx.fillStyle = g === 'P' ? '#ef4444' : g === 'R' ? '#f59e0b' : '#38bdf8';
    } else {
      ctx.fillStyle = '#475569';
    }
    ctx.fillText(g, x, 18);
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

/**
 * Builds a modern high-performance luxury SUV (BMW X5 M Competition & Mercedes-AMG GLE/G-Class):
 * - Internal Ambient Lighting System in Cockpit with color controls & drive mode syncing.
 * - Active Aerodynamic Rear Spoiler with dynamic speed downforce & airbrake mechanics.
 * - Flared widebody wheel arches with rugged protective cladding over beefy 22" SUV wheels.
 * - Upright, sculpted front fascia with deep air intakes, skid plate bash guard, and authentic grilles.
 * - Sculpted sides with heavy-duty running boards (side steps), recessed character waistline, and 4-door profile.
 * - Commanding SUV greenhouse with panoramic dual glass roof, roof luggage rails, and rear roof spoiler.
 */
export function createModernCarModel(options?: {
  bodyColor?: string;
  rimColor?: string;
  isPlayer?: boolean;
  carStyle?: CarDesignStyle;
  driveMode?: AutomotiveDriveMode;
  ambientLightColor?: string;
  onGearShift?: (gear: string, isDownshift: boolean) => void;
}): ModernCarInstance {
  const root = new THREE.Group();
  let currentCarStyle: CarDesignStyle = options?.carStyle || 'bmw_m';
  let currentDriveMode: AutomotiveDriveMode = options?.driveMode || 'SPORT+';
  let targetAmbientHex: string = options?.ambientLightColor || DRIVE_MODE_AMBIENT_COLORS[currentDriveMode];
  let currentAmbientColor = new THREE.Color(targetAmbientHex);
  let targetAmbientColor = new THREE.Color(targetAmbientHex);

  const bodyColorHex = options?.bodyColor || (currentCarStyle === 'bmw_m' ? '#a8b0b8' : '#090a0f');
  const rimColorHex = options?.rimColor || '#18181b';

  // Textures
  const carbonTex = createCarbonFiberTexture();
  const tireTreadTex = createTireTreadTexture();
  const honeycombTex = createHoneycombGrilleTexture();
  const bmwRoundelTex = createBmwRoundelTexture();
  const benzStarTex = createMercedesStarTexture();
  const bmwHeadlightTex = createBmwI5HeadlightTexture();
  const bmwKidneyTex = createBmwI5KidneyTexture();
  const bmwFrontPlateTex = createBmwI5FrontPlateTexture();
  const bmwRearPlateTex = createBmwI5RearPlateTexture();
  const bmwHofmeisterTex = createBmwI5HofmeisterTexture();
  const multibeamTex = createMercedesMultibeamTexture();

  // Multi-Coat German Metallic Automotive Paint
  const paintMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(bodyColorHex),
    metalness: 0.88,
    roughness: 0.16,
  });

  // Rugged Matte Black Protective SUV Cladding
  const claddingMat = new THREE.MeshStandardMaterial({
    color: 0x14161b,
    roughness: 0.75,
    metalness: 0.12,
  });

  // Brushed Satin Aluminum / Titanium Skid Plate & Roof Rails
  const skidPlateMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.92,
    roughness: 0.22,
  });

  const carbonMat = new THREE.MeshStandardMaterial({
    color: 0x181a1f,
    map: carbonTex,
    roughness: 0.35,
    metalness: 0.6,
  });

  const glossBlackMat = new THREE.MeshStandardMaterial({
    color: 0x07080a,
    roughness: 0.1,
    metalness: 0.5,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    metalness: 0.98,
    roughness: 0.05,
  });

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x0a101f,
    metalness: 0.9,
    roughness: 0.04,
    transparent: true,
    opacity: 0.65,
  });

  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x14171d,
    bumpMap: tireTreadTex,
    bumpScale: 0.06,
    roughness: 0.86,
    metalness: 0.08,
  });

  const rimMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(rimColorHex),
    metalness: 0.92,
    roughness: 0.18,
  });

  const caliperMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626, // M/AMG Performance Red
    roughness: 0.25,
    metalness: 0.5,
  });

  const brakeRotorMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.92,
    roughness: 0.22,
  });

  const honeycombMat = new THREE.MeshStandardMaterial({
    map: honeycombTex,
    color: 0x181e28,
    roughness: 0.5,
    metalness: 0.4,
  });

  // Light textures
  const tailLightRunningTex = getTaillightEmissiveTexture(false);
  const tailLightBrakeTex = getTaillightEmissiveTexture(true);

  const tailLightMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: tailLightRunningTex,
    emissiveMap: tailLightRunningTex,
    emissive: 0xaa1111,
    emissiveIntensity: 1.4,
    roughness: 0.1,
  });

  // Internal Cockpit Ambient Light Material (Dynamic Emissive Color)
  const ambientLightMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: currentAmbientColor.clone(),
    emissiveIntensity: 3.2,
    roughness: 0.12,
  });

  const headLights: THREE.Mesh[] = [];
  const tailLights: THREE.Mesh[] = [];
  const brakeLights: THREE.Mesh[] = [];
  const exhaustPipes: THREE.Mesh[] = [];

  // ==========================================================
  // ROOT BODYWORK GROUP (Planted Sports Sedan / Performance Coupe Stance)
  // ==========================================================
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  // 1. Lower Aerodynamic Ground-Effect Underbody Tray & Floorpan
  const bellyPan = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.12, 4.54), claddingMat);
  bellyPan.position.set(0, 0.24, 0);
  bellyPan.castShadow = true;
  bellyPan.receiveShadow = true;
  bodyGroup.add(bellyPan);

  // 2. Main Sculpted Sports Body Fuselage (Aerodynamic Coke-Bottle Waist)
  const mainTorsoCenter = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.44, 2.24), paintMat);
  mainTorsoCenter.position.set(0, 0.48, 0);
  mainTorsoCenter.castShadow = true;
  mainTorsoCenter.receiveShadow = true;
  bodyGroup.add(mainTorsoCenter);

  // Front sculpted torso (tapers gently forward for sleek aerodynamics)
  const mainTorsoFront = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.42, 1.48), paintMat);
  mainTorsoFront.position.set(0, 0.47, 1.54);
  mainTorsoFront.castShadow = true;
  bodyGroup.add(mainTorsoFront);

  // Rear athletic sports fuselage (widens into muscular shoulders)
  const mainTorsoRear = new THREE.Mesh(new THREE.BoxGeometry(1.98, 0.44, 1.56), paintMat);
  mainTorsoRear.position.set(0, 0.49, -1.46);
  mainTorsoRear.castShadow = true;
  bodyGroup.add(mainTorsoRear);

  // 3. Four Muscular Sculpted Wheel Arches & Wide-Body Sports Haunches
  // Front Fenders
  [-1.01, 1.01].forEach((fx) => {
    const frontFender = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.40, 1.04), paintMat);
    frontFender.position.set(fx, 0.54, 1.48);
    frontFender.castShadow = true;
    bodyGroup.add(frontFender);

    const frontArchLip = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.06, 1.08), carbonMat);
    frontArchLip.position.set(fx, 0.42, 1.48);
    bodyGroup.add(frontArchLip);
  });

  // Rear Muscular Sports Hips & Quarter Panels (COMPLETELY SOLID & CONTINUOUS - NO TRUCK BED!)
  [-1.04, 1.04].forEach((rx) => {
    // Wide muscular wheel arch
    const rearFender = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.42, 1.14), paintMat);
    rearFender.position.set(rx, 0.56, -1.48);
    rearFender.castShadow = true;
    bodyGroup.add(rearFender);

    const rearArchLip = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.06, 1.18), carbonMat);
    rearArchLip.position.set(rx, 0.44, -1.48);
    bodyGroup.add(rearArchLip);

    // Continuous upper quarter shoulder panel (runs from rear door all the way back to taillights)
    const upperQuarterPanel = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.28, 1.76), paintMat);
    upperQuarterPanel.position.set(rx * 0.94, 0.74, -1.46);
    upperQuarterPanel.castShadow = true;
    bodyGroup.add(upperQuarterPanel);

    // Sculpted rear haunch crest sloping inward towards the trunk decklid
    const haunchCrest = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 1.44), paintMat);
    haunchCrest.position.set(rx * 0.88, 0.86, -1.58);
    haunchCrest.castShadow = true;
    bodyGroup.add(haunchCrest);
  });

  // 4. Aerodynamic Carbon Fiber Rocker Skirts
  [-0.99, 0.99].forEach((sideX) => {
    const isL = sideX < 0;
    const skirtBlade = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.04, 2.04), carbonMat);
    skirtBlade.position.set(sideX, 0.24, 0);
    skirtBlade.castShadow = true;
    bodyGroup.add(skirtBlade);

    const skirtFin = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.14, 0.18), carbonMat);
    skirtFin.position.set(sideX + (isL ? -0.03 : 0.03), 0.32, -0.92);
    bodyGroup.add(skirtFin);

    const rockerTrim = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.08, 2.06), glossBlackMat);
    rockerTrim.position.set(sideX + (isL ? 0.02 : -0.02), 0.34, 0);
    bodyGroup.add(rockerTrim);
  });

  // 5. Sleek Flush Door Architecture & Front Fender Air Extraction Gills
  [-0.96, 0.96].forEach((dx) => {
    const isL = dx < 0;
    // Flush aerodynamic door handles
    const handleF = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.026, 0.14), glossBlackMat);
    handleF.position.set(dx + (isL ? -0.015 : 0.015), 0.74, 0.44);
    bodyGroup.add(handleF);

    const handleR = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.026, 0.14), glossBlackMat);
    handleR.position.set(dx + (isL ? -0.015 : 0.015), 0.74, -0.38);
    bodyGroup.add(handleR);

    // Fender air extractor gill
    const gill = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.14, 0.22), carbonMat);
    gill.position.set(dx + (isL ? -0.01 : 0.01), 0.62, 0.96);
    bodyGroup.add(gill);

    const gillFin = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.02, 0.16), chromeMat);
    gillFin.position.set(dx + (isL ? -0.015 : 0.015), 0.62, 0.96);
    bodyGroup.add(gillFin);
  });

  // 6. SCULPTED SLOPING SPORTS HOOD (BONNET) & FRONT END (NO BLOCKY TRUCK SNOUT!)
  // Low-slung, forward-raked clamshell hood
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.14, 1.56), paintMat);
  hood.position.set(0, 0.72, 1.42);
  hood.rotation.x = 0.12;
  hood.castShadow = true;
  bodyGroup.add(hood);

  // Twin dynamic power ridges along hood
  [-0.34, 0.34].forEach((bx) => {
    const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 1.34), paintMat);
    ridge.position.set(bx, 0.81, 1.42);
    ridge.rotation.x = 0.12;
    bodyGroup.add(ridge);

    const vent = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.24), carbonMat);
    vent.position.set(bx, 0.83, 1.28);
    vent.rotation.x = 0.12;
    bodyGroup.add(vent);
  });

  // Center hood valley channel
  const centerHoodChannel = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.03, 1.38), paintMat);
  centerHoodChannel.position.set(0, 0.79, 1.42);
  centerHoodChannel.rotation.x = 0.12;
  bodyGroup.add(centerHoodChannel);

  // Forward nose cone leading edge
  const noseCone = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.20, 0.22), paintMat);
  noseCone.position.set(0, 0.66, 2.22);
  noseCone.castShadow = true;
  bodyGroup.add(noseCone);

  // Front bumper apron with sculpted contours
  const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.36, 0.28), paintMat);
  frontBumper.position.set(0, 0.44, 2.24);
  frontBumper.castShadow = true;
  bodyGroup.add(frontBumper);

  // Central lower trapezoidal air intake
  const lowerAirDam = new THREE.Mesh(new THREE.BoxGeometry(1.30, 0.18, 0.12), honeycombMat);
  lowerAirDam.position.set(0, 0.32, 2.32);
  bodyGroup.add(lowerAirDam);

  // Outer aerodynamic air curtain scoops & canards
  [-0.78, 0.78].forEach((sx) => {
    const scoop = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.22, 0.12), glossBlackMat);
    scoop.position.set(sx, 0.40, 2.30);
    bodyGroup.add(scoop);

    const scoopMesh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.04), honeycombMat);
    scoopMesh.position.set(sx, 0.40, 2.34);
    bodyGroup.add(scoopMesh);

    const canard = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.025, 0.16), carbonMat);
    canard.position.set(sx, 0.32, 2.34);
    bodyGroup.add(canard);
  });

  // Full carbon fiber front racing splitter
  const frontSplitter = new THREE.Mesh(new THREE.BoxGeometry(1.90, 0.035, 0.34), carbonMat);
  frontSplitter.position.set(0, 0.20, 2.28);
  frontSplitter.castShadow = true;
  bodyGroup.add(frontSplitter);

  // Aerodynamic corner winglets
  [-0.94, 0.94].forEach((wx) => {
    const winglet = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.10, 0.22), carbonMat);
    winglet.position.set(wx, 0.25, 2.30);
    bodyGroup.add(winglet);
  });

  // 7. SLEEK EXECUTIVE SPORTS FASTBACK GREENHOUSE & CONTINUOUS ENCLOSED CABIN
  // (100% ELIMINATES THE TRUCK BED — CONTINUOUS FLOWING SPORTS SEDAN / FASTBACK COUPE ARCHITECTURE!)
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.60, 0.04, 0.94), glassMat);
  windshield.position.set(0, 1.06, 0.58);
  windshield.rotation.x = 0.54;
  windshield.castShadow = true;
  bodyGroup.add(windshield);

  // Slim sloping A-pillars
  [-0.76, 0.76].forEach((ax) => {
    const aPillar = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.68, 0.05), paintMat);
    aPillar.position.set(ax, 1.06, 0.58);
    aPillar.rotation.x = 0.54;
    bodyGroup.add(aPillar);
  });

  // Flush side glass (front and rear passenger windows)
  const sideWindowL = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.38, 1.48), glassMat);
  sideWindowL.position.set(-0.79, 1.12, -0.16);
  bodyGroup.add(sideWindowL);

  const sideWindowR = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.38, 1.48), glassMat);
  sideWindowR.position.set(0.79, 1.12, -0.16);
  bodyGroup.add(sideWindowR);

  // Gloss black B-pillars
  [-0.80, 0.80].forEach((bx) => {
    const bPillar = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.40, 0.07), glossBlackMat);
    bPillar.position.set(bx, 1.12, -0.06);
    bodyGroup.add(bPillar);
  });

  // Sleek low-slung roof structure
  const roofCap = new THREE.Mesh(new THREE.BoxGeometry(1.54, 0.05, 1.56), paintMat);
  roofCap.position.set(0, 1.30, -0.22);
  roofCap.castShadow = true;
  bodyGroup.add(roofCap);

  // Panoramic tinted sunroof glass
  const sunroofGlass = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.025, 1.42), glassMat);
  sunroofGlass.position.set(0, 1.32, -0.22);
  bodyGroup.add(sunroofGlass);

  // Aerodynamic shark fin GPS antenna
  const sharkFin = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.07, 4), paintMat);
  sharkFin.position.set(0, 1.36, -0.68);
  sharkFin.scale.set(0.5, 1.0, 2.0);
  sharkFin.rotation.y = Math.PI / 4;
  bodyGroup.add(sharkFin);

  // CONTINUOUS FASTBACK REAR GLASS (Back Window)
  // Seamlessly joins the roof trailing edge (z = -0.74, y = 1.30) down to the sports trunk deck (z = -1.82, y = 0.90)!
  const rearWindow = new THREE.Mesh(new THREE.BoxGeometry(1.44, 0.04, 1.32), glassMat);
  rearWindow.position.set(0, 1.10, -1.28);
  rearWindow.rotation.x = -0.34;
  rearWindow.castShadow = true;
  bodyGroup.add(rearWindow);

  // Heated rear windshield defroster grid frame (gloss black surround)
  const rearWindowTrim = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.02, 1.36), glossBlackMat);
  rearWindowTrim.position.set(0, 1.09, -1.28);
  rearWindowTrim.rotation.x = -0.34;
  bodyGroup.add(rearWindowTrim);

  // FULLY SOLID, MUSCULAR C-PILLARS COMPLETELY ENCLOSING CABIN (NO PICKUP GAP!)
  [-0.74, 0.74].forEach((cx) => {
    // Structural C-pillar arch sloping from roof down to rear shoulder
    const cPillarArch = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.10, 1.36), paintMat);
    cPillarArch.position.set(cx, 1.10, -1.28);
    cPillarArch.rotation.x = -0.34;
    cPillarArch.castShadow = true;
    bodyGroup.add(cPillarArch);

    // Inner cabin sail panel / quarter filler completely bridging glass to side body
    const sailPanel = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.22, 1.05), paintMat);
    sailPanel.position.set(cx * 1.02, 0.95, -1.20);
    sailPanel.castShadow = true;
    bodyGroup.add(sailPanel);

    // Rear quarter glass with gloss black surround
    const quarterGlass = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.20, 0.42), glassMat);
    quarterGlass.position.set(cx * 1.06, 1.05, -0.88);
    bodyGroup.add(quarterGlass);
  });

  // Rear roof lip aerodynamic flow channel
  const roofTrailingLip = new THREE.Mesh(new THREE.BoxGeometry(1.50, 0.03, 0.12), glossBlackMat);
  roofTrailingLip.position.set(0, 1.31, -0.74);
  bodyGroup.add(roofTrailingLip);

  // 8. SCULPTED SPORTS TRUNK DECK (DECKLID) & INTEGRATED DUCKTAIL
  // Solid sculpted sports deck extending from the bottom of the rear glass (z = -1.82) to the rear edge (z = -2.26)
  const sportsTrunkDeck = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.16, 0.48), paintMat);
  sportsTrunkDeck.position.set(0, 0.86, -2.04);
  sportsTrunkDeck.rotation.x = 0.04;
  sportsTrunkDeck.castShadow = true;
  bodyGroup.add(sportsTrunkDeck);

  // Integrated rear ducktail lip curve formed on trailing edge of trunk lid
  const ducktailLip = new THREE.Mesh(new THREE.BoxGeometry(1.74, 0.04, 0.10), carbonMat);
  ducktailLip.position.set(0, 0.90, -2.26);
  bodyGroup.add(ducktailLip);

  // ACTIVE AERODYNAMIC SPORTS SPOILER SYSTEM
  // Smoothly integrated into the sports deck lid (NOT sitting on top of a pickup tailgate!)
  const spoilerSystemGroup = new THREE.Group();
  spoilerSystemGroup.position.set(0, 0.90, -2.12);
  bodyGroup.add(spoilerSystemGroup);

  const spoilerBase = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.03, 0.20), glossBlackMat);
  spoilerBase.position.set(0, 0, 0);
  spoilerSystemGroup.add(spoilerBase);

  const actuatorHousingMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.2 });
  const actuatorPistonMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.98, roughness: 0.05 });

  const actuatorPistonL = new THREE.Mesh(new THREE.CylinderGeometry(0.010, 0.010, 0.14, 12), actuatorPistonMat);
  actuatorPistonL.position.set(-0.46, 0.04, -0.04);
  spoilerSystemGroup.add(actuatorPistonL);

  const actuatorHousingL = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.10, 12), actuatorHousingMat);
  actuatorHousingL.position.set(-0.46, -0.01, -0.04);
  spoilerSystemGroup.add(actuatorHousingL);

  const actuatorPistonR = new THREE.Mesh(new THREE.CylinderGeometry(0.010, 0.010, 0.14, 12), actuatorPistonMat);
  actuatorPistonR.position.set(0.46, 0.04, -0.04);
  spoilerSystemGroup.add(actuatorPistonR);

  const actuatorHousingR = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.10, 12), actuatorHousingMat);
  actuatorHousingR.position.set(0.46, -0.01, -0.04);
  spoilerSystemGroup.add(actuatorHousingR);

  const spoilerPivot = new THREE.Group();
  spoilerPivot.position.set(0, 0.02, -0.02);
  spoilerSystemGroup.add(spoilerPivot);

  const wingBlade = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.035, 0.32), carbonMat);
  wingBlade.position.set(0, 0, -0.12);
  wingBlade.castShadow = true;
  spoilerPivot.add(wingBlade);

  [-0.81, 0.81].forEach((ex) => {
    const endplate = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.08, 0.34), carbonMat);
    endplate.position.set(ex, 0.02, -0.12);
    spoilerPivot.add(endplate);
  });

  const thirdBrakeLight = new THREE.Mesh(
    new THREE.BoxGeometry(0.64, 0.020, 0.020),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xcc1111,
      emissiveIntensity: 1.8,
      roughness: 0.1,
    })
  );
  thirdBrakeLight.position.set(0, 0.01, -0.27);
  spoilerPivot.add(thirdBrakeLight);
  brakeLights.push(thirdBrakeLight);

  let currentSpoilerAngleDeg = 0;
  let currentDownforceKg = 0;
  let isAirbrake = false;

  // 9. SCULPTED PERFORMANCE SPORTS REAR END, BUMPER & DIFFUSER
  // Sculpted rear bumper apron wrapping smoothly around the haunches
  const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.38, 0.32), paintMat);
  rearBumper.position.set(0, 0.46, -2.28);
  rearBumper.castShadow = true;
  bodyGroup.add(rearBumper);

  // License plate sculpted trapezoidal recess
  const plateRecess = new THREE.Mesh(new THREE.BoxGeometry(0.70, 0.22, 0.06), glossBlackMat);
  plateRecess.position.set(0, 0.56, -2.38);
  bodyGroup.add(plateRecess);

  // Dual license plate white LED illumination lights
  [-0.20, 0.20].forEach((px) => {
    const plateLed = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.015, 0.02),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 2.0 })
    );
    plateLed.position.set(px, 0.68, -2.38);
    bodyGroup.add(plateLed);
  });

  // Vertical corner aero air extractors & reflectors
  [-0.84, 0.84].forEach((rx) => {
    const vent = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.04), honeycombMat);
    vent.position.set(rx, 0.48, -2.38);
    bodyGroup.add(vent);

    const refl = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.025, 0.02),
      new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xcc0000, emissiveIntensity: 1.0 })
    );
    refl.position.set(rx, 0.39, -2.40);
    bodyGroup.add(refl);
  });

  // Full Carbon Fiber Performance Rear Diffuser
  const rearDiffuser = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.16, 0.40), carbonMat);
  rearDiffuser.position.set(0, 0.26, -2.26);
  rearDiffuser.rotation.x = 0.20;
  rearDiffuser.castShadow = true;
  bodyGroup.add(rearDiffuser);

  [-0.36, -0.12, 0.12, 0.36].forEach((fx) => {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.16, 0.42), carbonMat);
    fin.position.set(fx, 0.26, -2.26);
    fin.rotation.x = 0.20;
    bodyGroup.add(fin);
  });

  // F1-Style Center Formula Rain / Fog Light
  const f1RainLight = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.06, 0.03),
    new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 1.8 })
  );
  f1RainLight.position.set(0, 0.26, -2.43);
  bodyGroup.add(f1RainLight);

  const nitroFlameMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.9,
  });

  // ==========================================================
  // 10. AUTHENTIC BMW i5 (G60 / i5 M60 LWB) SPECIFIC STYLING
  // Exactly matches the user's reference photos with:
  // - Iconic Glow Kidney Grilles with illuminated rim contour & M badge
  // - "BMW i5 LWB" electric green front plate
  // - "DGF I 541E" Dingolfing German electric rear plate
  // - Hofmeister Kink with embossed numeral "5" badge on C-pillars
  // - Iconic ultra-slim horizontal twin-bar OLED taillights
  // - Swept-back headlights with twin vertical arrow DRLs
  // ==========================================================
  const bmwGroup = new THREE.Group();
  bodyGroup.add(bmwGroup);

  // A. BMW i5 ICONIC GLOW KIDNEY GRILLES
  const bmwKidneyMat = new THREE.MeshStandardMaterial({
    map: bmwKidneyTex,
    roughness: 0.15,
    metalness: 0.65,
  });

  // Left & right kidneys angled symmetrically
  const leftKidney = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.28, 0.06), bmwKidneyMat);
  leftKidney.position.set(-0.21, 0.58, 2.30);
  leftKidney.rotation.y = 0.08;
  bmwGroup.add(leftKidney);

  const rightKidney = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.28, 0.06), bmwKidneyMat);
  rightKidney.position.set(0.21, 0.58, 2.30);
  rightKidney.rotation.y = -0.08;
  bmwGroup.add(rightKidney);

  // Illuminated Iconic Glow perimeter rim tubes
  [-0.21, 0.21].forEach((kx) => {
    const glowRim = new THREE.Mesh(
      new THREE.BoxGeometry(0.40, 0.30, 0.02),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0x67e8f9,
        emissiveIntensity: 2.4,
        roughness: 0.1,
      })
    );
    glowRim.position.set(kx, 0.58, 2.29);
    glowRim.rotation.y = kx < 0 ? 0.08 : -0.08;
    bmwGroup.add(glowRim);
  });

  // B. FRONT LICENSE PLATE: "BMW i5 LWB" ON EV GREEN BACKING (Photo 1)
  const bmwFrontPlateMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.58, 0.14, 0.02),
    new THREE.MeshStandardMaterial({ map: bmwFrontPlateTex, roughness: 0.25 })
  );
  bmwFrontPlateMesh.position.set(0, 0.44, 2.38);
  bmwGroup.add(bmwFrontPlateMesh);

  // C. BMW HOOD ROUNDEL EMBLEM (3D Inset Badge at leading edge of hood)
  const bmwHoodBadge = new THREE.Mesh(
    new THREE.CylinderGeometry(0.062, 0.062, 0.012, 24),
    new THREE.MeshStandardMaterial({ map: bmwRoundelTex, roughness: 0.1, metalness: 0.5 })
  );
  bmwHoodBadge.position.set(0, 0.74, 2.16);
  bmwHoodBadge.rotation.x = 0.22;
  bmwGroup.add(bmwHoodBadge);

  // D. BMW REAR ROUNDEL EMBLEM (Centered on sports trunk lid above license plate)
  const bmwRearBadge = new THREE.Mesh(
    new THREE.CylinderGeometry(0.062, 0.062, 0.012, 24),
    new THREE.MeshStandardMaterial({ map: bmwRoundelTex, roughness: 0.1, metalness: 0.5 })
  );
  bmwRearBadge.position.set(0, 0.86, -2.31);
  bmwRearBadge.rotation.x = -Math.PI / 2 + 0.12;
  bmwGroup.add(bmwRearBadge);

  // E. REAR LICENSE PLATE: "DGF I 541E" DINGOLFING GERMAN PLATE (Photo 2)
  const bmwRearPlateMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.58, 0.14, 0.02),
    new THREE.MeshStandardMaterial({ map: bmwRearPlateTex, roughness: 0.25 })
  );
  bmwRearPlateMesh.position.set(0, 0.56, -2.40);
  bmwGroup.add(bmwRearPlateMesh);

  // F. HOFMEISTER KINK WITH EMBOSSED "5" BADGE ON C-PILLARS (Photo 2)
  [-0.82, 0.82].forEach((hx) => {
    const isL = hx < 0;
    const hofmeisterBadge = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.10, 0.10),
      new THREE.MeshStandardMaterial({ map: bmwHofmeisterTex, roughness: 0.2, metalness: 0.3 })
    );
    hofmeisterBadge.position.set(hx, 0.96, -0.98);
    hofmeisterBadge.rotation.y = isL ? -0.15 : 0.15;
    bmwGroup.add(hofmeisterBadge);
  });

  // G. MODEL BADGES ON TRUNK LID ("i5" on left, "M60" on right)
  const badgeMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.95, roughness: 0.1 });
  const i5Badge = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.035, 0.015), badgeMat);
  i5Badge.position.set(-0.52, 0.84, -2.31);
  bmwGroup.add(i5Badge);

  const m60Badge = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.035, 0.015), badgeMat);
  m60Badge.position.set(0.52, 0.84, -2.31);
  bmwGroup.add(m60Badge);

  // H. BMW i5 ULTRA-SLIM HORIZONTAL TWIN-BAR TAILLIGHTS (Signature G60 Light Signature!)
  // Two razor-sharp parallel horizontal LED lightbars on each side wrapping outwards
  const bmwTaillightBars: THREE.Mesh[] = [];
  [-0.64, 0.64].forEach((tx) => {
    const isL = tx < 0;
    // Upper horizontal light bar
    const barTop = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.032, 0.08), tailLightMat);
    barTop.position.set(tx, 0.80, -2.32);
    barTop.rotation.y = isL ? 0.12 : -0.12;
    bmwGroup.add(barTop);
    bmwTaillightBars.push(barTop);
    tailLights.push(barTop);
    brakeLights.push(barTop);

    // Lower horizontal light bar
    const barBottom = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.032, 0.08), tailLightMat);
    barBottom.position.set(tx, 0.74, -2.32);
    barBottom.rotation.y = isL ? 0.12 : -0.12;
    bmwGroup.add(barBottom);
    bmwTaillightBars.push(barBottom);
    tailLights.push(barBottom);
    brakeLights.push(barBottom);

    // Outer corner light hook wrapping into rear quarter fender
    const cornerHook = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.09, 0.14), tailLightMat);
    cornerHook.position.set(tx + (isL ? -0.28 : 0.28), 0.77, -2.26);
    bmwGroup.add(cornerHook);
    tailLights.push(cornerHook);
    brakeLights.push(cornerHook);

    // Chrome/dark horizontal divider strip between the two bars
    const divider = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.016, 0.07), glossBlackMat);
    divider.position.set(tx, 0.77, -2.33);
    divider.rotation.y = isL ? 0.12 : -0.12;
    bmwGroup.add(divider);
  });

  // Center smoked horizontal connector bar across trunk lid
  const centerLightRibbon = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.025, 0.04), tailLightMat);
  centerLightRibbon.position.set(0, 0.77, -2.33);
  bmwGroup.add(centerLightRibbon);
  tailLights.push(centerLightRibbon);
  brakeLights.push(centerLightRibbon);

  // I. BMW i5 DUAL VERTICAL ARROW DRL HEADLIGHTS (Photo 1)
  const angelEyesMat = new THREE.MeshStandardMaterial({
    map: bmwHeadlightTex,
    emissive: 0x38bdf8,
    emissiveMap: bmwHeadlightTex,
    emissiveIntensity: 3.6,
    roughness: 0.1,
  });

  const bmwHlL = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.14, 0.16), angelEyesMat);
  bmwHlL.position.set(-0.70, 0.60, 2.24);
  bmwHlL.rotation.y = -0.20;
  bmwGroup.add(bmwHlL);
  headLights.push(bmwHlL);

  const bmwHlR = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.14, 0.16), angelEyesMat);
  bmwHlR.position.set(0.70, 0.60, 2.24);
  bmwHlR.rotation.y = 0.20;
  bmwGroup.add(bmwHlR);
  headLights.push(bmwHlR);

  // J. M AERODYNAMIC TWIN-STALK CARBON MIRRORS
  [-1.04, 1.04].forEach((mx) => {
    const isL = mx < 0;
    const mir = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.09, 0.14), carbonMat);
    mir.position.set(mx, 0.98, 0.72);
    mir.rotation.y = isL ? -0.14 : 0.14;
    bmwGroup.add(mir);

    const mFin = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.06, 0.14), carbonMat);
    mFin.position.set(mx + (isL ? -0.04 : 0.04), 1.04, 0.72);
    bmwGroup.add(mFin);
  });

  // K. BMW M QUAD EXHAUST / BOOST FLAME PORTS
  const bmwNitroFlames: THREE.Mesh[] = [];
  const bmwExhaustPositions = [-0.64, -0.48, 0.48, 0.64];
  bmwExhaustPositions.forEach((pos) => {
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.18, 16), chromeMat);
    pipe.rotation.x = Math.PI / 2;
    pipe.position.set(pos, 0.30, -2.40);
    bmwGroup.add(pipe);
    exhaustPipes.push(pipe);

    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.048, 0.40, 12), nitroFlameMat);
    flame.rotation.x = -Math.PI / 2;
    flame.position.set(pos, 0.30, -2.64);
    flame.visible = false;
    bmwGroup.add(flame);
    bmwNitroFlames.push(flame);
  });

  // ==========================================================
  // 11. MERCEDES-BENZ AMG SPECIFIC COUPE DETAILS (GT 4-Door / C63 S)
  // ==========================================================
  const benzGroup = new THREE.Group();
  bodyGroup.add(benzGroup);

  const panamericanaShield = new THREE.Mesh(
    new THREE.BoxGeometry(0.94, 0.32, 0.10),
    glossBlackMat
  );
  panamericanaShield.position.set(0, 0.58, 2.30);
  benzGroup.add(panamericanaShield);

  for (let i = -5; i <= 5; i++) {
    const xPos = i * 0.075;
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.30, 0.07), chromeMat);
    bar.position.set(xPos, 0.58, 2.32);
    benzGroup.add(bar);
  }

  const benzFrontStar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.11, 0.020, 24),
    new THREE.MeshStandardMaterial({ map: benzStarTex, roughness: 0.08, metalness: 0.95 })
  );
  benzFrontStar.position.set(0, 0.59, 2.36);
  benzFrontStar.rotation.x = Math.PI / 2;
  benzGroup.add(benzFrontStar);

  const benzRearStar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.062, 0.062, 0.012, 24),
    new THREE.MeshStandardMaterial({ map: benzStarTex, roughness: 0.08, metalness: 0.95 })
  );
  benzRearStar.position.set(0, 0.86, -2.31);
  benzRearStar.rotation.x = -Math.PI / 2 + 0.12;
  benzGroup.add(benzRearStar);

  const benzAmgBadge = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.038, 0.015),
    new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.95, roughness: 0.1 })
  );
  benzAmgBadge.position.set(0.52, 0.84, -2.31);
  benzGroup.add(benzAmgBadge);

  // Mercedes AMG OLED horizontal light ribbons
  [-0.64, 0.64].forEach((tx) => {
    const isL = tx < 0;
    const amgLight = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.07, 0.09), tailLightMat);
    amgLight.position.set(tx, 0.78, -2.32);
    amgLight.rotation.y = isL ? 0.14 : -0.14;
    benzGroup.add(amgLight);
    tailLights.push(amgLight);
    brakeLights.push(amgLight);
  });

  const multibeamMat = new THREE.MeshStandardMaterial({
    map: multibeamTex,
    emissive: 0x67e8f9,
    emissiveMap: multibeamTex,
    emissiveIntensity: 3.5,
    roughness: 0.1,
  });

  const benzHlL = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.14, 0.16), multibeamMat);
  benzHlL.position.set(-0.70, 0.60, 2.24);
  benzHlL.rotation.y = -0.20;
  benzGroup.add(benzHlL);
  headLights.push(benzHlL);

  const benzHlR = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.14, 0.16), multibeamMat);
  benzHlR.position.set(0.70, 0.60, 2.24);
  benzHlR.rotation.y = 0.20;
  benzGroup.add(benzHlR);
  headLights.push(benzHlR);

  const amgJetWing = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.045, 0.18), chromeMat);
  amgJetWing.position.set(0, 0.28, 2.32);
  benzGroup.add(amgJetWing);

  [-1.04, 1.04].forEach((mx) => {
    const isL = mx < 0;
    const mir = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.09, 0.14), paintMat);
    mir.position.set(mx, 0.98, 0.72);
    mir.rotation.y = isL ? -0.14 : 0.14;
    benzGroup.add(mir);
  });

  const benzNitroFlames: THREE.Mesh[] = [];
  const amgExhaustPos = [-0.70, -0.52, 0.52, 0.70];
  amgExhaustPos.forEach((pos) => {
    const tip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.065, 0.18), chromeMat);
    tip.position.set(pos, 0.30, -2.40);
    benzGroup.add(tip);
    exhaustPipes.push(tip);

    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.048, 0.40, 12), nitroFlameMat);
    flame.rotation.x = -Math.PI / 2;
    flame.position.set(pos, 0.30, -2.64);
    flame.visible = false;
    benzGroup.add(flame);
    benzNitroFlames.push(flame);
  });

  bmwGroup.visible = currentCarStyle === 'bmw_m';
  benzGroup.visible = currentCarStyle === 'benz_amg';

  // ==========================================================
  // 11. LUXURY DIGITAL COCKPIT INTERIOR & INTERNAL AMBIENT LIGHTING
  // - Dynamic multi-zone LED ambient light piping (dash, console, doors, moonroof)
  // - Color transitions according to selected drive mode (Red for Sport+, Blue for Comfort)
  // ==========================================================
  const dashMat = new THREE.MeshStandardMaterial({ color: 0x111318, roughness: 0.7 });
  const dash = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.28, 0.52), dashMat);
  dash.position.set(0, 1.12, 0.62);
  bodyGroup.add(dash);

  // A. Ambient Lighting Strip: Dashboard Full Contour Ribbon
  const dashAmbientStrip = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.022, 0.035), ambientLightMat);
  dashAmbientStrip.position.set(0, 1.08, 0.60);
  bodyGroup.add(dashAmbientStrip);

  // B. Ambient Lighting Strip: Center Console Dual Edge Ribbons
  [-0.19, 0.19].forEach((cx) => {
    const consoleStrip = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.018, 0.94), ambientLightMat);
    consoleStrip.position.set(cx, 0.98, -0.12);
    bodyGroup.add(consoleStrip);
  });

  // C. Ambient Lighting Strips: 4-Door Panels (Front & Rear Door Edge Inlays)
  [-0.86, 0.86].forEach((dx) => {
    // Front door ambient line
    const doorStripF = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.016, 0.68), ambientLightMat);
    doorStripF.position.set(dx, 1.06, 0.35);
    bodyGroup.add(doorStripF);

    // Rear door ambient line
    const doorStripR = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.016, 0.62), ambientLightMat);
    doorStripR.position.set(dx, 1.06, -0.42);
    bodyGroup.add(doorStripR);
  });

  // D. Ambient Lighting: Panoramic Moonroof Perimeter Halo
  const moonroofHalo = new THREE.Mesh(new THREE.BoxGeometry(1.34, 0.018, 1.94), ambientLightMat);
  moonroofHalo.position.set(0, 1.70, -0.32);
  bodyGroup.add(moonroofHalo);

  // Digital Curved Display Cluster
  const clusterTex = createDigitalCockpitTexture(0, 'P', 0.15, currentDriveMode);
  const clusterMat = new THREE.MeshBasicMaterial({ map: clusterTex, transparent: true });
  const clusterMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.16), clusterMat);
  clusterMesh.position.set(-0.38, 1.22, 0.48);
  clusterMesh.rotation.x = -0.22;
  bodyGroup.add(clusterMesh);

  // Center Touchscreen Infotainment Display
  const centerScreenMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
  const centerScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.2), centerScreenMat);
  centerScreen.position.set(0.08, 1.18, 0.52);
  centerScreen.rotation.x = -0.18;
  bodyGroup.add(centerScreen);

  // Center Console Armrest, Cup Holders & Electronic Gear Selector
  const centerConsole = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.32, 1.1), dashMat);
  centerConsole.position.set(0, 0.94, -0.12);
  bodyGroup.add(centerConsole);

  // Split Leather Armrest Cushion
  const armrestCushion = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.08, 0.46),
    new THREE.MeshStandardMaterial({ color: 0x181a20, roughness: 0.65 })
  );
  armrestCushion.position.set(0, 1.12, -0.32);
  bodyGroup.add(armrestCushion);

  // Dual Brushed Cup Holders
  [-0.08, 0.08].forEach((cx) => {
    const cupHolder = new THREE.Mesh(
      new THREE.CylinderGeometry(0.042, 0.038, 0.06, 16),
      new THREE.MeshStandardMaterial({ color: 0x0f1115, roughness: 0.8 })
    );
    cupHolder.position.set(cx, 1.07, -0.02);
    bodyGroup.add(cupHolder);
    const cupRim = new THREE.Mesh(new THREE.TorusGeometry(0.042, 0.005, 8, 16), chromeMat);
    cupRim.rotation.x = Math.PI / 2;
    cupRim.position.set(cx, 1.10, -0.02);
    bodyGroup.add(cupRim);
  });

  // Brushed Aluminum Electronic Shifter Console Gate
  const shifterGateBezel = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, 0.26), skidPlateMat);
  shifterGateBezel.position.set(-0.06, 1.06, 0.18);
  bodyGroup.add(shifterGateBezel);

  // Illuminated PRND Shift Position Indicator
  let currentGearLabel = 'P';
  let prndTex = createShifterPrndTexture('P');
  const prndMat = new THREE.MeshBasicMaterial({ map: prndTex, transparent: true });
  const prndIndicatorMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.034), prndMat);
  prndIndicatorMesh.position.set(-0.06, 1.072, 0.11);
  prndIndicatorMesh.rotation.x = -Math.PI / 2;
  bodyGroup.add(prndIndicatorMesh);

  // Articulated Gear Selector Pivot & Joystick Lever
  const gearLeverPivot = new THREE.Group();
  gearLeverPivot.position.set(-0.06, 1.07, 0.20);
  bodyGroup.add(gearLeverPivot);

  // Leather Gaiter Boot
  const gearBoot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.048, 0.04, 12),
    new THREE.MeshStandardMaterial({ color: 0x14161b, roughness: 0.85 })
  );
  gearBoot.position.set(0, 0.015, 0);
  gearLeverPivot.add(gearBoot);

  // Chrome Lever Shaft
  const gearShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.08, 12), chromeMat);
  gearShaft.position.set(0, 0.06, 0);
  gearLeverPivot.add(gearShaft);

  // Ergonomic Luxury Joystick Shift Knob
  const gearKnob = new THREE.Mesh(
    new THREE.BoxGeometry(0.042, 0.048, 0.055),
    new THREE.MeshStandardMaterial({ color: 0x090a0f, metalness: 0.6, roughness: 0.3 })
  );
  gearKnob.position.set(0, 0.10, 0);
  gearLeverPivot.add(gearKnob);

  const gearKnobMetalInsert = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.049, 0.038), chromeMat);
  gearKnobMetalInsert.position.set(0, 0.10, 0);
  gearLeverPivot.add(gearKnobMetalInsert);

  const gearParkButton = new THREE.Mesh(
    new THREE.BoxGeometry(0.018, 0.006, 0.018),
    new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 })
  );
  gearParkButton.position.set(0, 0.125, -0.01);
  gearLeverPivot.add(gearParkButton);

  // Articulated Luxury SUV Steering Wheel Assembly
  const wheelPivot = new THREE.Group();
  wheelPivot.position.set(-0.38, 1.14, 0.34);
  wheelPivot.rotation.x = -0.3;
  bodyGroup.add(wheelPivot);

  // Rotating Group containing rim, spokes, hub, badges, and paddle shifters
  const wheelRotGroup = new THREE.Group();
  wheelPivot.add(wheelRotGroup);

  const steeringWheel = new THREE.Mesh(
    new THREE.TorusGeometry(0.17, 0.024, 12, 28),
    carbonMat
  );
  wheelRotGroup.add(steeringWheel);

  // 12 O'Clock Center Alignment Racing Stripe (Red M/AMG marker)
  const centerStripe = new THREE.Mesh(
    new THREE.BoxGeometry(0.028, 0.026, 0.05),
    new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 })
  );
  centerStripe.position.set(0, 0.17, 0);
  wheelRotGroup.add(centerStripe);

  const wheelHub = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.046, 0.024, 16), chromeMat);
  wheelHub.rotation.x = Math.PI / 2;
  wheelRotGroup.add(wheelHub);

  // Multifunction Spokes (Left, Right, Bottom)
  const spokeLeft = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.024, 0.016), skidPlateMat);
  spokeLeft.position.set(-0.09, 0, 0.005);
  wheelRotGroup.add(spokeLeft);

  const spokeRight = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.024, 0.016), skidPlateMat);
  spokeRight.position.set(0.09, 0, 0.005);
  wheelRotGroup.add(spokeRight);

  const spokeBottom = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.08, 0.016), skidPlateMat);
  spokeBottom.position.set(0, -0.09, 0.005);
  wheelRotGroup.add(spokeBottom);

  // Dual Column-Mounted Performance Paddle Shifters
  const paddleLeft = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.07, 0.008), carbonMat);
  paddleLeft.position.set(-0.16, 0.03, -0.028);
  paddleLeft.rotation.z = -0.15;
  wheelRotGroup.add(paddleLeft);

  const paddleRight = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.07, 0.008), carbonMat);
  paddleRight.position.set(0.16, 0.03, -0.028);
  paddleRight.rotation.z = 0.15;
  wheelRotGroup.add(paddleRight);

  const bmwSteeringBadge = new THREE.Mesh(
    new THREE.CylinderGeometry(0.028, 0.028, 0.005, 16),
    new THREE.MeshStandardMaterial({ map: bmwRoundelTex, roughness: 0.15 })
  );
  bmwSteeringBadge.rotation.x = Math.PI / 2;
  bmwSteeringBadge.position.z = 0.014;
  wheelRotGroup.add(bmwSteeringBadge);

  const benzSteeringBadge = new THREE.Mesh(
    new THREE.CylinderGeometry(0.028, 0.028, 0.005, 16),
    new THREE.MeshStandardMaterial({ map: benzStarTex, roughness: 0.15 })
  );
  benzSteeringBadge.rotation.x = Math.PI / 2;
  benzSteeringBadge.position.z = 0.014;
  wheelRotGroup.add(benzSteeringBadge);

  bmwSteeringBadge.visible = currentCarStyle === 'bmw_m';
  benzSteeringBadge.visible = currentCarStyle === 'benz_amg';

  // Luxury SUV Contoured Sport Bucket Seats
  const seatLeatherMat = new THREE.MeshStandardMaterial({ color: 0x181a20, roughness: 0.65 });
  const seatInsertMat = new THREE.MeshStandardMaterial({ color: 0x222630, roughness: 0.75 });

  const seatL = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.72, 0.54), seatLeatherMat);
  seatL.position.set(-0.45, 1.02, 0.02);
  bodyGroup.add(seatL);

  const headrestL = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.22, 0.14), seatInsertMat);
  headrestL.position.set(-0.45, 1.48, 0.02);
  bodyGroup.add(headrestL);

  const seatR = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.72, 0.54), seatLeatherMat);
  seatR.position.set(0.45, 1.02, 0.02);
  bodyGroup.add(seatR);

  const headrestR = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.22, 0.14), seatInsertMat);
  headrestR.position.set(0.45, 1.48, 0.02);
  bodyGroup.add(headrestR);

  const rearBench = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.68, 0.56), seatLeatherMat);
  rearBench.position.set(0, 1.06, -0.92);
  bodyGroup.add(rearBench);

  [-0.45, 0, 0.45].forEach((hx) => {
    const rearHeadrest = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.2, 0.14), seatInsertMat);
    rearHeadrest.position.set(hx, 1.48, -0.92);
    bodyGroup.add(rearHeadrest);
  });

  // ==========================================================
  // RIGGED & ANIMATED 3D DRIVER CHARACTER INSIDE SUV COCKPIT
  // - Turns steering wheel with articulated arms/hands in sync with steer input
  // - Reaches down to center console gear selector to shift gears in sync with transmission/user input
  // - Features tailored driving polo, 3-point seatbelt, aviator sunglasses, and sports watch
  // ==========================================================
  const driverGroup = new THREE.Group();
  driverGroup.position.set(-0.42, 0.92, 0.08);
  bodyGroup.add(driverGroup);

  // Materials for Driver Character
  const driverPantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 });
  const driverShoeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6, metalness: 0.1 });
  const driverJacketMat = new THREE.MeshStandardMaterial({
    color: currentCarStyle === 'bmw_m' ? 0x172554 : 0x1e293b,
    roughness: 0.6,
  });
  const driverAccentMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5 });
  const driverSkinMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.55 });
  const driverGloveMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.5, metalness: 0.1 });
  const driverGlassesMat = new THREE.MeshStandardMaterial({
    color: 0x020617,
    metalness: 0.96,
    roughness: 0.04,
  });
  const driverHairMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.85 });
  const driverSeatbeltMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.9 });
  const watchDialMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    emissive: 0x0284c7,
    emissiveIntensity: 0.6,
    roughness: 0.2,
  });

  // A. Pelvis & Seated Lower Body
  const driverPelvis = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.18, 0.28), driverPantsMat);
  driverPelvis.position.set(0, 0.10, -0.02);
  driverGroup.add(driverPelvis);

  // B. Articulated Legs & Driving Shoes (pedal interaction)
  // Left Leg (Resting naturally on dead pedal footrest)
  const leftThigh = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.36), driverPantsMat);
  leftThigh.position.set(-0.11, 0.08, 0.18);
  leftThigh.rotation.x = -0.15;
  leftThigh.rotation.y = -0.06;
  driverGroup.add(leftThigh);

  const leftCalf = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.34, 0.12), driverPantsMat);
  leftCalf.position.set(-0.12, -0.12, 0.36);
  leftCalf.rotation.x = 0.28;
  driverGroup.add(leftCalf);

  const leftFoot = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.08, 0.22), driverShoeMat);
  leftFoot.position.set(-0.12, -0.26, 0.44);
  leftFoot.rotation.x = -0.15;
  driverGroup.add(leftFoot);

  // Right Leg (Depresses accelerator and pivots to brake pedal)
  const rightLegGroup = new THREE.Group();
  rightLegGroup.position.set(0.11, 0.08, 0);
  driverGroup.add(rightLegGroup);

  const rightThigh = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.36), driverPantsMat);
  rightThigh.position.set(0, 0, 0.18);
  rightThigh.rotation.x = -0.14;
  rightThigh.rotation.y = 0.05;
  rightLegGroup.add(rightThigh);

  const rightCalf = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.34, 0.12), driverPantsMat);
  rightCalf.position.set(0.01, -0.20, 0.36);
  rightCalf.rotation.x = 0.28;
  rightLegGroup.add(rightCalf);

  const rightFoot = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.08, 0.22), driverShoeMat);
  rightFoot.position.set(0.01, -0.34, 0.44);
  rightFoot.rotation.x = -0.15;
  rightLegGroup.add(rightFoot);

  // C. Articulated Spine & Upper Torso
  const driverTorsoGroup = new THREE.Group();
  driverTorsoGroup.position.set(0, 0.18, -0.02);
  driverGroup.add(driverTorsoGroup);

  const driverTorsoMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.46, 0.26),
    driverJacketMat
  );
  driverTorsoMesh.position.set(0, 0.22, 0);
  driverTorsoGroup.add(driverTorsoMesh);

  // Team Contrast Racing Stripes on Jacket
  const jacketStripeL = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.44, 0.264), driverAccentMat);
  jacketStripeL.position.set(-0.08, 0.22, 0);
  driverTorsoGroup.add(jacketStripeL);

  const jacketStripeR = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.44, 0.264), chromeMat);
  jacketStripeR.position.set(0.08, 0.22, 0);
  driverTorsoGroup.add(jacketStripeR);

  // 3-Point Diagonal Seatbelt Strap crossing over driver's chest
  const seatbeltStrap = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.54, 0.016),
    driverSeatbeltMat
  );
  seatbeltStrap.position.set(0.02, 0.24, 0.134);
  seatbeltStrap.rotation.z = -0.56;
  driverTorsoGroup.add(seatbeltStrap);

  // Center Buckle Latch
  const seatbeltLatch = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.065, 0.038), chromeMat);
  seatbeltLatch.position.set(0.17, 0.08, 0.02);
  driverGroup.add(seatbeltLatch);

  // D. Articulated Neck, Head & Sunglasses
  const driverHeadGroup = new THREE.Group();
  driverHeadGroup.position.set(0, 0.50, 0.02);
  driverTorsoGroup.add(driverHeadGroup);

  const driverNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.058, 0.10, 14), driverSkinMat);
  driverNeck.position.set(0, 0.04, 0);
  driverHeadGroup.add(driverNeck);

  const driverHead = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), driverSkinMat);
  driverHead.position.set(0, 0.16, 0.02);
  driverHeadGroup.add(driverHead);

  const driverNose = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.036, 0.032), driverSkinMat);
  driverNose.position.set(0, 0.16, 0.14);
  driverHeadGroup.add(driverNose);

  const driverEarsL = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.042, 0.024), driverSkinMat);
  driverEarsL.position.set(-0.12, 0.16, 0.02);
  driverHeadGroup.add(driverEarsL);

  const driverEarsR = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.042, 0.024), driverSkinMat);
  driverEarsR.position.set(0.12, 0.16, 0.02);
  driverHeadGroup.add(driverEarsR);

  // Styled Hair / Driver Cap
  const driverHair = new THREE.Mesh(new THREE.SphereGeometry(0.124, 14, 14), driverHairMat);
  driverHair.position.set(0, 0.19, -0.01);
  driverHair.scale.set(1.02, 0.72, 1.05);
  driverHeadGroup.add(driverHair);

  // Aviator Driving Sunglasses
  const sunglassesGroup = new THREE.Group();
  sunglassesGroup.position.set(0, 0.175, 0.115);
  driverHeadGroup.add(sunglassesGroup);

  const frameBridge = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.006, 0.008), chromeMat);
  frameBridge.position.set(0, 0.015, 0);
  sunglassesGroup.add(frameBridge);

  [-0.042, 0.042].forEach((gx) => {
    const lens = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.028, 0.014), driverGlassesMat);
    lens.position.set(gx, 0, 0);
    sunglassesGroup.add(lens);
  });

  // E. Articulated Left Arm & Steering Grip Hand
  const leftShoulderPos = new THREE.Vector3(-0.21, 0.40, 0.02);
  const leftUpperArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.044, 0.28, 12),
    driverJacketMat
  );
  driverTorsoGroup.add(leftUpperArm);

  const leftElbowSphere = new THREE.Mesh(new THREE.SphereGeometry(0.046, 12, 12), driverJacketMat);
  driverTorsoGroup.add(leftElbowSphere);

  const leftForearm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.044, 0.038, 0.26, 12),
    driverJacketMat
  );
  driverTorsoGroup.add(leftForearm);

  const leftWristSphere = new THREE.Mesh(new THREE.SphereGeometry(0.038, 12, 12), driverSkinMat);
  driverTorsoGroup.add(leftWristSphere);

  // Chronograph Watch on Left Wrist
  const leftWatch = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.018, 16), skidPlateMat);
  driverTorsoGroup.add(leftWatch);
  const leftWatchDial = new THREE.Mesh(new THREE.CircleGeometry(0.028, 16), watchDialMat);
  leftWatchDial.position.set(0, 0.01, 0);
  leftWatchDial.rotation.x = -Math.PI / 2;
  leftWatch.add(leftWatchDial);

  const leftHandGroup = new THREE.Group();
  driverTorsoGroup.add(leftHandGroup);

  const leftGlovePalm = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.042, 0.08), driverGloveMat);
  leftHandGroup.add(leftGlovePalm);

  const leftGloveThumb = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.022, 0.042), driverGloveMat);
  leftGloveThumb.position.set(0.035, -0.01, 0.02);
  leftHandGroup.add(leftGloveThumb);

  // F. Articulated Right Arm & Gear Shifting / Steering Hand
  const rightShoulderPos = new THREE.Vector3(0.21, 0.40, 0.02);
  const rightUpperArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.044, 0.28, 12),
    driverJacketMat
  );
  driverTorsoGroup.add(rightUpperArm);

  const rightElbowSphere = new THREE.Mesh(new THREE.SphereGeometry(0.046, 12, 12), driverJacketMat);
  driverTorsoGroup.add(rightElbowSphere);

  const rightForearm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.044, 0.038, 0.26, 12),
    driverJacketMat
  );
  driverTorsoGroup.add(rightForearm);

  const rightWristSphere = new THREE.Mesh(new THREE.SphereGeometry(0.038, 12, 12), driverSkinMat);
  driverTorsoGroup.add(rightWristSphere);

  const rightHandGroup = new THREE.Group();
  driverTorsoGroup.add(rightHandGroup);

  const rightGlovePalm = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.042, 0.08), driverGloveMat);
  rightHandGroup.add(rightGlovePalm);

  const rightGloveThumb = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.022, 0.042), driverGloveMat);
  rightGloveThumb.position.set(-0.035, -0.01, 0.02);
  rightHandGroup.add(rightGloveThumb);

  // 2-Bone Arm Placement Helper
  const _boneDir = new THREE.Vector3();
  const _upVec = new THREE.Vector3(0, 1, 0);
  function positionArmBone(
    mesh: THREE.Mesh,
    from: THREE.Vector3,
    to: THREE.Vector3,
    baseLen: number
  ) {
    mesh.position.set((from.x + to.x) * 0.5, (from.y + to.y) * 0.5, (from.z + to.z) * 0.5);
    _boneDir.subVectors(to, from);
    const len = _boneDir.length();
    if (len > 0.001) {
      _boneDir.normalize();
      mesh.quaternion.setFromUnitVectors(_upVec, _boneDir);
      mesh.scale.set(1, len / baseLen, 1);
    }
  }

  // Analytic Pole-Vector 2-Bone Inverse Kinematics Solver
  function computeTwoBoneIKElbow(
    S: THREE.Vector3,
    T: THREE.Vector3,
    L1: number,
    L2: number,
    pole: THREE.Vector3
  ): THREE.Vector3 {
    const V = new THREE.Vector3().subVectors(T, S);
    let d = V.length();
    d = Math.max(0.10, Math.min(d, L1 + L2 - 0.006));
    const u = V.clone().divideScalar(d);
    const cosAlpha = Math.max(-1, Math.min(1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d)));
    const sinAlpha = Math.sqrt(Math.max(0, 1 - cosAlpha * cosAlpha));

    const poleProj = pole.clone().sub(u.clone().multiplyScalar(pole.dot(u)));
    if (poleProj.lengthSq() < 0.0001) {
      poleProj.set(0, -1, 0).sub(u.clone().multiplyScalar(u.y));
    }
    poleProj.normalize();

    return S.clone()
      .add(u.clone().multiplyScalar(L1 * cosAlpha))
      .add(poleProj.clone().multiplyScalar(L1 * sinAlpha));
  }

  // Gear Shift Animation State Machine
  let isShiftingGears = false;
  let shiftProgress = 0.0;
  let shiftDuration = 0.72;
  let shiftThrowX = 0.0;
  let lastShiftDirection: 'UP' | 'DOWN' = 'UP';

  function triggerShiftingSequence(newGear: string, isDownshift = false) {
    if (isShiftingGears && newGear === currentGearLabel) return;
    currentGearLabel = newGear;
    isShiftingGears = true;
    shiftProgress = 0.0;
    lastShiftDirection = isDownshift ? 'DOWN' : 'UP';
    options?.onGearShift?.(newGear, isDownshift);

    // Update illuminated PRND display on center console
    prndTex.dispose();
    prndTex = createShifterPrndTexture(newGear);
    prndMat.map = prndTex;
    prndMat.needsUpdate = true;
  }


  // 12. LARGE 22-INCH PERFORMANCE SUV WHEELS, ROTORS & CALIPERS
  const wheels: THREE.Group[] = [];
  const bmwWheelCaps: THREE.Mesh[] = [];
  const benzWheelCaps: THREE.Mesh[] = [];

  function createCarWheel(radius: number, width: number, isFront: boolean, isLeftSide: boolean): THREE.Group {
    const wGroup = new THREE.Group();

    const tire = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, width, 28), tireMat);
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;
    wGroup.add(tire);

    const rim = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.76, radius * 0.76, width * 1.02, 24),
      rimMat
    );
    rim.rotation.z = Math.PI / 2;
    wGroup.add(rim);

    for (let i = 0; i < 8; i++) {
      const spoke = new THREE.Mesh(
        new THREE.BoxGeometry(0.034, radius * 0.72, width * 0.65),
        rimMat
      );
      spoke.rotation.x = (i * Math.PI * 2) / 8;
      wGroup.add(spoke);
    }

    const rotor = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.62, radius * 0.62, 0.024, 24),
      brakeRotorMat
    );
    rotor.rotation.z = Math.PI / 2;
    rotor.position.x = isFront ? 0.02 : -0.02;
    wGroup.add(rotor);

    const caliper = new THREE.Mesh(new THREE.BoxGeometry(0.07, radius * 0.32, 0.15), caliperMat);
    caliper.position.set(0, radius * 0.38, 0);
    wGroup.add(caliper);

    const capX = (isLeftSide ? -1 : 1) * (width * 0.52);
    const bmwCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.052, 0.052, 0.012, 16),
      new THREE.MeshStandardMaterial({ map: bmwRoundelTex, roughness: 0.18 })
    );
    bmwCap.rotation.z = Math.PI / 2;
    bmwCap.position.x = capX;
    bmwCap.visible = currentCarStyle === 'bmw_m';
    wGroup.add(bmwCap);
    bmwWheelCaps.push(bmwCap);

    const benzCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.052, 0.052, 0.012, 16),
      new THREE.MeshStandardMaterial({ map: benzStarTex, roughness: 0.18 })
    );
    benzCap.rotation.z = Math.PI / 2;
    benzCap.position.x = capX;
    benzCap.visible = currentCarStyle === 'benz_amg';
    wGroup.add(benzCap);
    benzWheelCaps.push(benzCap);

    return wGroup;
  }

  const wheelR = 0.38;
  const wheelW = 0.28;

  const frontLeftWheelPivot = new THREE.Group();
  frontLeftWheelPivot.position.set(-1.02, wheelR, 1.48);
  root.add(frontLeftWheelPivot);
  const frontLeftWheel = createCarWheel(wheelR, wheelW, true, true);
  frontLeftWheelPivot.add(frontLeftWheel);
  wheels.push(frontLeftWheel);

  const frontRightWheelPivot = new THREE.Group();
  frontRightWheelPivot.position.set(1.02, wheelR, 1.48);
  root.add(frontRightWheelPivot);
  const frontRightWheel = createCarWheel(wheelR, wheelW, false, false);
  frontRightWheelPivot.add(frontRightWheel);
  wheels.push(frontRightWheel);

  const rearLeftWheel = createCarWheel(wheelR, wheelW * 1.10, true, true);
  rearLeftWheel.position.set(-1.04, wheelR, -1.48);
  root.add(rearLeftWheel);
  wheels.push(rearLeftWheel);

  const rearRightWheel = createCarWheel(wheelR, wheelW * 1.10, false, false);
  rearRightWheel.position.set(1.04, wheelR, -1.48);
  root.add(rearRightWheel);
  wheels.push(rearRightWheel);

  const lighting = attachVehicleLighting(root, {
    vehicleType: 'car',
    bumperFrontZ: 2.38,
    bumperRearZ: -2.38,
    width: 2.04,
    taillightPositions: [
      { x: -0.72, y: 0.78, z: -2.34 },
      { x: 0.72, y: 0.78, z: -2.34 },
    ],
  });

  let clusterTimer = 0;

  return {
    group: root,
    wheels,
    frontLeftWheel: frontLeftWheelPivot,
    frontRightWheel: frontRightWheelPivot,
    steeringWheelMesh: wheelRotGroup,
    gearShifterLever: gearLeverPivot,
    headLights,
    tailLights,
    brakeLights,
    exhaustPipes,
    interiorCluster: clusterMesh,
    driverMesh: driverGroup,
    lighting,
    bodyColor: bodyColorHex,
    get carStyle() {
      return currentCarStyle;
    },
    get driveMode() {
      return currentDriveMode;
    },
    get ambientLightColor() {
      return targetAmbientHex;
    },

    setStyle: (newStyle: CarDesignStyle) => {
      currentCarStyle = newStyle;
      bmwGroup.visible = newStyle === 'bmw_m';
      benzGroup.visible = newStyle === 'benz_amg';
      bmwWheelCaps.forEach((cap) => (cap.visible = newStyle === 'bmw_m'));
      benzWheelCaps.forEach((cap) => (cap.visible = newStyle === 'benz_amg'));
      if (bmwSteeringBadge) bmwSteeringBadge.visible = newStyle === 'bmw_m';
      if (benzSteeringBadge) benzSteeringBadge.visible = newStyle === 'benz_amg';
      driverJacketMat.color.setHex(newStyle === 'bmw_m' ? 0x172554 : 0x1e293b);
      if (!options?.bodyColor) {
        paintMat.color.set(newStyle === 'bmw_m' ? '#1d4ed8' : '#090a0f');
        rimMat.color.set(newStyle === 'bmw_m' ? '#18181b' : '#cbd5e1');
      }
    },

    setDriveMode: (newMode: AutomotiveDriveMode) => {
      currentDriveMode = newMode;
      targetAmbientHex = DRIVE_MODE_AMBIENT_COLORS[newMode] || '#ef4444';
      targetAmbientColor.set(targetAmbientHex);
    },

    setAmbientLightColor: (colorHex: string) => {
      targetAmbientHex = colorHex;
      targetAmbientColor.set(colorHex);
    },

    getActiveAeroAngle: () => Math.round(currentSpoilerAngleDeg),
    getActiveAeroDownforceKg: () => currentDownforceKg,
    isAirbrakeActive: () => isAirbrake,

    triggerGearShift: (targetGear?: string, isDownshift = false) => {
      const g = targetGear || (currentGearLabel === 'P' ? 'D1' : 'D2');
      triggerShiftingSequence(g, isDownshift);
    },

    getCurrentGear: () => currentGearLabel,

    setCockpitView: (isCockpit: boolean) => {
      // In first-person cockpit view, hide head to eliminate camera clipping while keeping arms, hands, wheel & shifter 100% visible
      driverHeadGroup.visible = !isCockpit;
    },

    setBraking: (braking: boolean) => {
      tailLightMat.map = braking ? tailLightBrakeTex : tailLightRunningTex;
      tailLightMat.emissiveMap = braking ? tailLightBrakeTex : tailLightRunningTex;
      tailLightMat.emissive.setHex(braking ? 0xff0000 : 0xaa1111);
      tailLightMat.emissiveIntensity = braking ? 4.2 : 1.4;
      tailLightMat.needsUpdate = true;
      lighting?.setBraking(braking, 0.016);
    },

    setSteeringAngle: (steerRatio: number) => {
      const angle = -steerRatio * 0.46;
      frontLeftWheelPivot.rotation.y = angle;
      frontRightWheelPivot.rotation.y = angle;
      wheelRotGroup.rotation.z = steerRatio * 2.4;
    },

    updateAnimation: (
      speed: number,
      rpmRatio: number,
      steer: number,
      isBraking: boolean,
      isNitro: boolean,
      delta: number,
      timeOfDay = 'afternoon',
      weather = 'clear',
      throttle = 0,
      reverse = false
    ) => {
      const rollDist = (speed / 3.6) * delta;
      const rollAngle = rollDist / wheelR;
      wheels.forEach((w) => {
        w.rotation.x += rollAngle;
      });

      const steerAngle = -steer * 0.46;
      frontLeftWheelPivot.rotation.y = steerAngle;
      frontRightWheelPivot.rotation.y = steerAngle;

      // ==========================================================
      // 1. SYNCHRONIZED STEERING WHEEL TURNING
      // ==========================================================
      const wheelAngle = steer * 2.4;
      wheelRotGroup.rotation.z = wheelAngle;

      // ==========================================================
      // 2. AUTOMATIC & SYNCHRONIZED GEAR SHIFTING MECHANICS
      // ==========================================================
      const speedAbs = Math.abs(speed);
      let autoGear = currentGearLabel;

      if (currentGearLabel === 'P') {
        if (throttle > 0.1) autoGear = 'D1';
        else if (reverse || speed < -0.2) autoGear = 'R';
      } else if (currentGearLabel === 'N') {
        if (speed < -0.8) autoGear = 'R';
      } else if (currentGearLabel === 'R') {
        // If driver drives forward above 2 km/h, shift to D1
        if (speed > 1.8 && throttle > 0.2) autoGear = 'D1';
        else autoGear = 'R';
      } else {
        // In Drive (D1-D6):
        if (speed < -0.6 || (reverse && speed < 0)) {
          autoGear = 'R';
        } else if (speedAbs < 1.0 && throttle <= 0 && isBraking) {
          // Stationary in D - keep in D1 ready to launch
          autoGear = 'D1';
        } else if (speedAbs < 42) {
          autoGear = 'D1';
        } else if (speedAbs < 88) {
          autoGear = 'D2';
        } else if (speedAbs < 138) {
          autoGear = 'D3';
        } else if (speedAbs < 188) {
          autoGear = 'D4';
        } else if (speedAbs < 238) {
          autoGear = 'D5';
        } else {
          autoGear = 'D6';
        }
      }

      if (autoGear !== currentGearLabel) {
        const isDown =
          autoGear === 'R' ||
          autoGear === 'P' ||
          (currentGearLabel.startsWith('D') &&
            autoGear.startsWith('D') &&
            parseInt(autoGear.slice(1)) < parseInt(currentGearLabel.slice(1)));
        triggerShiftingSequence(autoGear, isDown);
      }

      if (isShiftingGears) {
        shiftProgress += delta / shiftDuration;
        if (shiftProgress >= 1.0) {
          isShiftingGears = false;
          shiftProgress = 0.0;
        }
      }

      // Animate center console gear selector lever throw
      let targetLeverTilt = 0;
      if (isShiftingGears) {
        if (shiftProgress >= 0.28 && shiftProgress <= 0.62) {
          targetLeverTilt = lastShiftDirection === 'UP' ? 0.24 : -0.22;
        } else {
          targetLeverTilt = 0.04;
        }
      } else {
        targetLeverTilt = currentGearLabel === 'P' ? -0.22 : currentGearLabel === 'R' ? -0.16 : currentGearLabel === 'N' ? 0 : 0.12;
      }
      gearLeverPivot.rotation.x = THREE.MathUtils.lerp(
        gearLeverPivot.rotation.x,
        targetLeverTilt,
        delta * 14
      );

      // Tail & Reverse Backup Lighting
      const isReverseLight = currentGearLabel === 'R' || speed < -0.3;
      if (isReverseLight) {
        tailLightMat.emissive.setHex(0xffffff);
        tailLightMat.emissiveIntensity = 4.2;
      } else if (isBraking) {
        tailLightMat.emissive.setHex(0xff0000);
        tailLightMat.emissiveIntensity = 4.2;
      } else {
        tailLightMat.emissive.setHex(0xaa1111);
        tailLightMat.emissiveIntensity = 1.4;
      }
      tailLightMat.needsUpdate = true;

      // ==========================================================
      // 3. SYNCHRONIZED 3D DRIVER KINEMATICS & 2-BONE ARM IK
      // ==========================================================
      // A. Dynamic Steering Wheel Grip Targets in driverTorsoGroup space
      const rimRadius = 0.17;
      const cosTilt = Math.cos(-0.3);
      const sinTilt = Math.sin(-0.3);

      // Left Hand Target on Steering Wheel Rim (9:30 position)
      const thetaL = Math.PI + 0.24 + wheelAngle;
      const localXL = rimRadius * Math.cos(thetaL);
      const localYL = rimRadius * Math.sin(thetaL);
      const localZL = 0.015;
      const yLRot = localYL * cosTilt - localZL * sinTilt;
      const zLRot = localYL * sinTilt + localZL * cosTilt;
      const targetLeftHand = new THREE.Vector3(0.04 + localXL, 0.04 + yLRot, 0.28 + zLRot);

      // Right Hand Target on Steering Wheel Rim (2:30 position)
      const thetaR = -0.24 + wheelAngle;
      const localXR = rimRadius * Math.cos(thetaR);
      const localYR = rimRadius * Math.sin(thetaR);
      const localZR = 0.015;
      const yRRot = localYR * cosTilt - localZR * sinTilt;
      const zRRot = localYR * sinTilt + localZR * cosTilt;
      const targetRightWheel = new THREE.Vector3(0.04 + localXR, 0.04 + yRRot, 0.28 + zRRot);

      // Shifter Knob Target on Center Console
      const targetShifterKnob = new THREE.Vector3(0.36, 0.06, 0.14);

      // Interpolate Right Hand position based on gear shift progress
      const targetRightHand = targetRightWheel.clone();
      if (isShiftingGears) {
        if (shiftProgress < 0.35) {
          // Phase 1: Reaching down to shifter knob with smooth arc lift
          const p = shiftProgress / 0.35;
          const ease = p * p * (3 - 2 * p);
          targetRightHand.lerpVectors(targetRightWheel, targetShifterKnob, ease);
          targetRightHand.y += Math.sin(ease * Math.PI) * 0.08;
        } else if (shiftProgress <= 0.62) {
          // Phase 2: Grasping shift knob and pushing/pulling throw
          targetRightHand.copy(targetShifterKnob);
          targetRightHand.z += lastShiftDirection === 'UP' ? -0.015 : 0.015;
        } else {
          // Phase 3: Returning back up to steering wheel rim
          const p = (shiftProgress - 0.62) / 0.38;
          const ease = p * p * (3 - 2 * p);
          targetRightHand.lerpVectors(targetShifterKnob, targetRightWheel, ease);
          targetRightHand.y += Math.sin(ease * Math.PI) * 0.07;
        }
      }

      // B. Solve Left Arm 2-Bone IK
      const poleLeft = new THREE.Vector3(-0.6, -0.4, -0.2);
      const leftElbowPos = computeTwoBoneIKElbow(
        leftShoulderPos,
        targetLeftHand,
        0.28,
        0.26,
        poleLeft
      );
      positionArmBone(leftUpperArm, leftShoulderPos, leftElbowPos, 0.28);
      leftElbowSphere.position.copy(leftElbowPos);
      positionArmBone(leftForearm, leftElbowPos, targetLeftHand, 0.26);
      leftWristSphere.position.copy(targetLeftHand);
      leftWatch.position.copy(targetLeftHand);
      leftHandGroup.position.copy(targetLeftHand);

      // Orient Left Glove along tangent of steering wheel
      const tangentL = new THREE.Vector3(
        -Math.sin(thetaL),
        Math.cos(thetaL) * cosTilt,
        Math.cos(thetaL) * sinTilt
      ).normalize();
      leftHandGroup.quaternion.setFromUnitVectors(_boneDir.set(0, 0, 1), tangentL);

      // C. Solve Right Arm 2-Bone IK
      const poleRight = new THREE.Vector3(0.6, -0.4, -0.2);
      const rightElbowPos = computeTwoBoneIKElbow(
        rightShoulderPos,
        targetRightHand,
        0.28,
        0.26,
        poleRight
      );
      positionArmBone(rightUpperArm, rightShoulderPos, rightElbowPos, 0.28);
      rightElbowSphere.position.copy(rightElbowPos);
      positionArmBone(rightForearm, rightElbowPos, targetRightHand, 0.26);
      rightWristSphere.position.copy(targetRightHand);
      rightHandGroup.position.copy(targetRightHand);

      if (isShiftingGears && shiftProgress >= 0.25 && shiftProgress <= 0.70) {
        // Resting on gear knob grip
        rightHandGroup.quaternion.setFromEuler(new THREE.Euler(-0.35, 0.15, -0.25));
      } else {
        // Gripping steering wheel rim
        const tangentR = new THREE.Vector3(
          -Math.sin(thetaR),
          Math.cos(thetaR) * cosTilt,
          Math.cos(thetaR) * sinTilt
        ).normalize();
        rightHandGroup.quaternion.setFromUnitVectors(_boneDir.set(0, 0, 1), tangentR);
      }

      // D. Driver Head & Torso Gaze Dynamics
      let targetHeadY = -steer * 0.38;
      let targetHeadX = isBraking ? 0.08 : -(speed / 320) * 0.025;
      if (isShiftingGears && shiftProgress >= 0.15 && shiftProgress <= 0.65) {
        // Driver glances down-right toward shifter knob during gear shifts
        targetHeadY = -0.24;
        targetHeadX = 0.11;
      }
      driverHeadGroup.rotation.y = THREE.MathUtils.lerp(
        driverHeadGroup.rotation.y,
        targetHeadY,
        delta * 8
      );
      driverHeadGroup.rotation.x = THREE.MathUtils.lerp(
        driverHeadGroup.rotation.x,
        targetHeadX,
        delta * 8
      );

      // Subtle torso lean with cornering G-forces
      driverTorsoGroup.rotation.z = THREE.MathUtils.lerp(
        driverTorsoGroup.rotation.z,
        -steer * 0.06,
        delta * 8
      );
      driverTorsoGroup.rotation.x = THREE.MathUtils.lerp(
        driverTorsoGroup.rotation.x,
        isBraking ? 0.04 : -(speed / 300) * 0.015,
        delta * 8
      );

      // Foot pedal actuation (throttle / brake)
      rightLegGroup.rotation.x = THREE.MathUtils.lerp(
        rightLegGroup.rotation.x,
        isBraking ? -0.08 : throttle > 0 ? 0.06 : 0,
        delta * 12
      );

      // ==========================================================
      // ACTIVE AERODYNAMIC SPOILER KINEMATICS
      // ==========================================================
      let targetSpoilerAngleDeg = 0;
      if (isBraking && speed > 42) {
        // High-Speed Airbrake Mode: Rapidly deploys to 52° to generate massive air resistance
        targetSpoilerAngleDeg = 52;
        isAirbrake = true;
      } else if (speed > 95) {
        // High-Speed Downforce Mode: Variable angle (16° - 32°) to glue the SUV to the road
        const progress = Math.min(1.0, (speed - 95) / 160);
        targetSpoilerAngleDeg = 16 + progress * 16;
        isAirbrake = false;
      } else if (speed > 45) {
        // Cruise Stabilization Mode: Subtle 7° angle to clean turbulent roof airflow
        targetSpoilerAngleDeg = 7;
        isAirbrake = false;
      } else {
        // Flush Retracted Mode
        targetSpoilerAngleDeg = 0;
        isAirbrake = false;
      }

      // Responsive pneumatic actuator interpolation
      const aeroDeploySpeed = isBraking ? 14.0 : 8.0;
      currentSpoilerAngleDeg = THREE.MathUtils.lerp(
        currentSpoilerAngleDeg,
        targetSpoilerAngleDeg,
        delta * aeroDeploySpeed
      );

      // Pitch angle and elevation of the active wing blade
      const radAngle = THREE.MathUtils.degToRad(currentSpoilerAngleDeg);
      spoilerPivot.rotation.x = -radAngle;
      spoilerPivot.position.y = 0.02 + (currentSpoilerAngleDeg / 52) * 0.12;

      // Extend telescopic actuator piston shafts matching angle
      const pistonExtension = (currentSpoilerAngleDeg / 52) * 0.07;
      actuatorPistonL.position.y = 0.04 + pistonExtension;
      actuatorPistonR.position.y = 0.04 + pistonExtension;

      // Calculate dynamic physical downforce in kilograms
      currentDownforceKg = Math.round(
        Math.sin(radAngle) * Math.pow(Math.max(0, speed) / 28, 2) * 2.4
      );

      // ==========================================================
      // INTERNAL AMBIENT LIGHTING COLOR TRANSITION
      // ==========================================================
      currentAmbientColor.lerp(targetAmbientColor, delta * 6.0);
      ambientLightMat.emissive.copy(currentAmbientColor);

      // Nitro exhaust flame animation
      if (isNitro) {
        const pulse = 0.85 + Math.sin(Date.now() * 0.035) * 0.35;
        bmwNitroFlames.forEach((f) => {
          f.visible = currentCarStyle === 'bmw_m';
          f.scale.set(pulse, pulse, 1.35 * pulse);
        });
        benzNitroFlames.forEach((f) => {
          f.visible = currentCarStyle === 'benz_amg';
          f.scale.set(pulse, pulse, 1.35 * pulse);
        });
      } else {
        bmwNitroFlames.forEach((f) => (f.visible = false));
        benzNitroFlames.forEach((f) => (f.visible = false));
      }

      const accelPitch = isBraking ? 0.03 : -(speed / 250) * 0.015;
      const cornerRoll = steer * Math.min(1.0, speedAbs / 70) * 0.04;
      bodyGroup.rotation.x = THREE.MathUtils.lerp(bodyGroup.rotation.x, accelPitch, delta * 8);
      bodyGroup.rotation.z = THREE.MathUtils.lerp(bodyGroup.rotation.z, cornerRoll, delta * 8);

      lighting?.updateDayNightAndWeather(timeOfDay, weather);

      clusterTimer += delta;
      if (clusterTimer > 0.15 && clusterMesh) {
        clusterTimer = 0;
        clusterMesh.material = new THREE.MeshBasicMaterial({
          map: createDigitalCockpitTexture(speedAbs, currentGearLabel, rpmRatio, currentDriveMode),
          transparent: true,
        });
      }
    },

    updateColor: (newColor: string, newRimColor?: string) => {
      paintMat.color.set(newColor);
      if (newRimColor) {
        rimMat.color.set(newRimColor);
      }
    },

    dispose: () => {
      lighting?.dispose();
    },
  };
}
