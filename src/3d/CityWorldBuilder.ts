import * as THREE from 'three';
import { TimeOfDay, WeatherType, DistrictType } from '../types/openCity';
import { generateIndianRoadsideAssets } from './IndianRoadsideAssetGenerator';
import { buildComprehensiveRoadNetwork } from './RoadNetworkBuilder';
import { populateCityShops } from './CityShopsBuilder';

export interface WorldObstacle {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  height: number;
}

export interface StuntRamp {
  x: number;
  y: number;
  z: number;
  rotation: number;
  width: number;
  length: number;
}

export interface CityWorldInstance {
  group: THREE.Group;
  obstacles: WorldObstacle[];
  stuntRamps: StuntRamp[];
  streetLamps: THREE.PointLight[];
  sunLight: THREE.DirectionalLight;
  ambientLight: THREE.AmbientLight;
  hemiLight?: THREE.HemisphereLight;
  skyDome: THREE.Mesh;
  cloudsGroup: THREE.Group;
  rainParticles?: THREE.Points;
  updateDayNightAndWeather: (timeOfDay: TimeOfDay, weather: WeatherType, cameraPos: THREE.Vector3) => void;
  updateNearbyStreetLamps?: (cameraPos: THREE.Vector3, maxIntensity?: number) => void;
  getDistrictAtPosition: (x: number, z: number) => DistrictType;
  getGroundHeightAt: (x: number, z: number) => number;
  dispose: () => void;
}

// Procedural high-resolution bicycle stencil & chevron arrow drawer
function drawBicycleStencil(ctx: CanvasRenderingContext2D, cx: number, cy: number, scale = 1.0) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.strokeStyle = '#ffffff';
  ctx.fillStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Rear Wheel
  ctx.beginPath();
  ctx.arc(-26, 12, 16, 0, Math.PI * 2);
  ctx.stroke();

  // Front Wheel
  ctx.beginPath();
  ctx.arc(26, 12, 16, 0, Math.PI * 2);
  ctx.stroke();

  // Hub dots
  ctx.beginPath();
  ctx.arc(-26, 12, 3, 0, Math.PI * 2);
  ctx.arc(26, 12, 3, 0, Math.PI * 2);
  ctx.fill();

  // Frame: Bottom bracket at (-4, 12)
  const bbX = -4, bbY = 12;
  const rearHubX = -26, rearHubY = 12;
  const frontHubX = 26, frontHubY = 12;
  const seatJointX = -12, seatJointY = -10;
  const headTubeX = 14, headTubeY = -12;

  // Chainstay
  ctx.beginPath();
  ctx.moveTo(rearHubX, rearHubY);
  ctx.lineTo(bbX, bbY);
  // Seatstay
  ctx.lineTo(seatJointX, seatJointY);
  // Seat tube
  ctx.lineTo(bbX, bbY);
  // Down tube
  ctx.lineTo(headTubeX, headTubeY);
  // Top tube
  ctx.lineTo(seatJointX, seatJointY);
  ctx.stroke();

  // Front fork & handlebars
  ctx.beginPath();
  ctx.moveTo(headTubeX, headTubeY);
  ctx.lineTo(frontHubX, frontHubY);
  ctx.moveTo(headTubeX, headTubeY);
  ctx.lineTo(headTubeX + 2, headTubeY - 10);
  ctx.lineTo(headTubeX + 9, headTubeY - 7);
  ctx.stroke();

  // Seat post & saddle
  ctx.beginPath();
  ctx.moveTo(seatJointX, seatJointY);
  ctx.lineTo(seatJointX - 2, seatJointY - 6);
  ctx.moveTo(seatJointX - 10, seatJointY - 6);
  ctx.lineTo(seatJointX + 6, seatJointY - 6);
  ctx.stroke();

  ctx.restore();
}

function drawChevronArrow(ctx: CanvasRenderingContext2D, cx: number, cy: number, scale = 1.0) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#ffffff';

  // Front Arrowhead
  ctx.beginPath();
  ctx.moveTo(0, -22);
  ctx.lineTo(18, 0);
  ctx.lineTo(9, 0);
  ctx.lineTo(0, -11);
  ctx.lineTo(-9, 0);
  ctx.lineTo(-18, 0);
  ctx.closePath();
  ctx.fill();

  // Rear Arrowhead
  ctx.beginPath();
  ctx.moveTo(0, -2);
  ctx.lineTo(18, 20);
  ctx.lineTo(9, 20);
  ctx.lineTo(0, 9);
  ctx.lineTo(-9, 20);
  ctx.lineTo(-18, 20);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

// Procedural Red Terracotta Herringbone Brick Paver Texture
function createHerringboneBrickTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Warm terracotta mortar background
  ctx.fillStyle = '#3f170c';
  ctx.fillRect(0, 0, 512, 512);

  // Herringbone interlocking rectangular brick tiles
  const brickW = 44;
  const brickH = 20;
  const brickColors = ['#991b1b', '#b91c1c', '#a1221b', '#7f1d1d', '#c2410c', '#881337', '#9a3412', '#b45309'];

  for (let y = -40; y < 550; y += brickW) {
    for (let x = -40; x < 550; x += brickW) {
      // Horizontal brick
      ctx.fillStyle = brickColors[Math.floor(Math.random() * brickColors.length)];
      ctx.fillRect(x, y, brickW - 2.5, brickH - 2.5);
      // Vertical interlocking brick
      ctx.fillStyle = brickColors[Math.floor(Math.random() * brickColors.length)];
      ctx.fillRect(x + brickW - brickH, y + brickH, brickH - 2.5, brickW - 2.5);
    }
  }

  // Micro stone grain
  for (let i = 0; i < 15000; i++) {
    const rx = Math.random() * 512;
    const ry = Math.random() * 512;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.1)';
    ctx.fillRect(rx, ry, 1, 1);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 40);
  return tex;
}

// Procedural high-resolution Indian National Highway asphalt texture
function createIndianHighwayTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // 1. Smooth Dark City Road Bitumen Base
  ctx.fillStyle = '#181b22';
  ctx.fillRect(0, 0, 1024, 1024);

  // 2. Aggregate noise
  for (let i = 0; i < 32000; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    ctx.fillStyle = Math.random() > 0.5 ? '#262d38' : '#0f1217';
    ctx.fillRect(x, y, 1, 1);
  }

  // 3. DEDICATED VIBRANT GREEN BIKE LANE (Exact match to screenshot!)
  // Right side bike lane (x: 740 to 950)
  ctx.fillStyle = '#16a34a'; // Vibrant Emerald / Kelly Green
  ctx.fillRect(740, 0, 210, 1024);

  // Subtle aggregate grain on green lane
  for (let i = 0; i < 9000; i++) {
    const gx = 740 + Math.random() * 210;
    const gy = Math.random() * 1024;
    ctx.fillStyle = Math.random() > 0.5 ? '#15803d' : '#22c55e';
    ctx.fillRect(gx, gy, 1, 1);
  }

  // Left side bike lane (x: 74 to 284)
  ctx.fillStyle = '#16a34a';
  ctx.fillRect(74, 0, 210, 1024);
  for (let i = 0; i < 9000; i++) {
    const gx = 74 + Math.random() * 210;
    const gy = Math.random() * 1024;
    ctx.fillStyle = Math.random() > 0.5 ? '#15803d' : '#22c55e';
    ctx.fillRect(gx, gy, 1, 1);
  }

  // 4. White Stencil Bicycle Icons & Directional Chevron Arrows in Green Lane
  for (let y = 160; y < 1024; y += 512) {
    // Right bike lane (where player rides)
    drawBicycleStencil(ctx, 845, y, 1.35);
    drawChevronArrow(ctx, 845, y + 210, 1.15);

    // Left bike lane
    drawBicycleStencil(ctx, 179, y, 1.35);
    drawChevronArrow(ctx, 179, y + 210, 1.15);
  }

  // 5. Solid White Dividing Stripes separating Green Bike Lane from Car Lanes
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(734, 0, 8, 1024); // Right inner border
  ctx.fillRect(948, 0, 8, 1024); // Right curb border
  ctx.fillRect(68, 0, 8, 1024);  // Left curb border
  ctx.fillRect(282, 0, 8, 1024); // Left inner border

  // 6. Main Car Traffic Lanes Markings
  // Double Yellow Center Lines (Median / Opposite Traffic Divider)
  ctx.fillStyle = '#facc15';
  for (let y = 0; y < 1024; y += 96) {
    ctx.fillRect(506, y + 15, 6, 68);
    ctx.fillRect(518, y + 15, 6, 68);
  }

  // Reflective Cat's Eye Road Studs between center yellow lines
  for (let y = 0; y < 1024; y += 48) {
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(512, y + 6, 6, 6);
    ctx.fillStyle = 'rgba(254, 240, 138, 0.4)';
    ctx.fillRect(510, y + 4, 10, 10);
  }

  // White Dashed Lane Dividers for Car Lanes
  ctx.fillStyle = '#f1f5f9';
  const dashLanes = [410, 625];
  for (const lx of dashLanes) {
    for (let y = 0; y < 1024; y += 128) {
      ctx.fillRect(lx, y + 20, 7, 88);
      // White reflective road studs at end of dashes
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(lx + 1, y + 112, 5, 5);
      ctx.fillStyle = '#f1f5f9';
    }
  }

  // 7. Occasional Tire Skid & Braking Marks
  ctx.fillStyle = 'rgba(6, 8, 12, 0.40)';
  [320, 780].forEach((sy) => {
    ctx.fillRect(580, sy, 16, 75);
    ctx.fillRect(640, sy, 16, 75);
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 24);
  tex.anisotropy = 16;
  return tex;
}

// Procedural Indian City & Market Street Asphalt Texture with Concrete Drainage Naali, Paan stains & Manholes
function createCityStreetTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1c2028';
  ctx.fillRect(0, 0, 1024, 1024);

  // Bitumen grain & aggregate
  for (let i = 0; i < 28000; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    ctx.fillStyle = Math.random() > 0.5 ? '#2a3240' : '#12151c';
    ctx.fillRect(x, y, 1, 1);
  }

  // Tar repair patches
  ctx.fillStyle = '#0a0c10';
  ctx.fillRect(160, 220, 180, 130);
  ctx.fillRect(620, 640, 210, 150);

  // Alternating Yellow & Black Municipal Kerbstones on outer edges
  const kerbH = 64;
  for (let ky = 0; ky < 1024; ky += kerbH) {
    const isY = Math.floor(ky / kerbH) % 2 === 0;
    ctx.fillStyle = isY ? '#facc15' : '#090a0f';
    // Left curb
    ctx.fillRect(0, ky, 32, kerbH);
    // Right curb
    ctx.fillRect(992, ky, 32, kerbH);
  }

  // Center dashed white lane divider (worn)
  ctx.fillStyle = '#f1f5f9';
  for (let y = 0; y < 1024; y += 128) {
    ctx.fillRect(508, y + 20, 8, 88);
  }

  // Pedestrian Zebra Crossing Band across street
  ctx.fillStyle = '#f8fafc';
  for (let zx = 80; zx < 940; zx += 70) {
    ctx.fillRect(zx, 40, 44, 130);
  }

  // Yellow Vehicle Stop Line before Zebra Crossing
  ctx.fillStyle = '#eab308';
  ctx.fillRect(70, 190, 884, 14);

  // White curb margin lines
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(64, 0, 8, 1024);
  ctx.fillRect(952, 0, 8, 1024);

  // Cast Iron Circular Manhole Covers (Iconic Indian City road detail)
  const drawManhole = (mx: number, my: number) => {
    ctx.fillStyle = '#27272a';
    ctx.beginPath();
    ctx.arc(mx, my, 38, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(mx, my, 36, 0, Math.PI * 2);
    ctx.stroke();

    // Cross-hatch ribbed grid
    ctx.lineWidth = 2;
    for (let r = -28; r <= 28; r += 10) {
      ctx.beginPath();
      ctx.moveTo(mx + r, my - 24);
      ctx.lineTo(mx + r, my + 24);
      ctx.stroke();
    }
  };
  drawManhole(320, 520);
  drawManhole(710, 840);

  // Red Betel Leaf (Paan / Gutkha) Stains near corners & gutters (quintessential Indian urban detail)
  const paanStains = [
    { x: 92, y: 195, r: 14 },
    { x: 935, y: 480, r: 18 },
    { x: 105, y: 680, r: 12 },
    { x: 925, y: 880, r: 16 },
  ];
  paanStains.forEach((ps) => {
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath();
    ctx.arc(ps.x, ps.y, ps.r, 0, Math.PI * 2);
    ctx.fill();
    // Splatter droplets
    for (let d = 0; d < 6; d++) {
      ctx.beginPath();
      ctx.arc(
        ps.x + (Math.random() - 0.5) * ps.r * 2.2,
        ps.y + (Math.random() - 0.5) * ps.r * 2.2,
        Math.random() * 3 + 1,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  });

  // Concrete Storm Drainage Channel ("Naali") along roadside edge (x: 955 to 1024)
  ctx.fillStyle = '#475569';
  ctx.fillRect(960, 0, 32, 1024);
  // Precast slab separation lines
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 3;
  for (let dy = 0; dy < 1024; dy += 64) {
    ctx.strokeRect(960, dy, 32, 64);
  }

  // Red Indian mud edge on left shoulder
  const dustL = ctx.createLinearGradient(32, 0, 75, 0);
  dustL.addColorStop(0, '#78431e');
  dustL.addColorStop(1, 'rgba(120,67,30,0)');
  ctx.fillStyle = dustL;
  ctx.fillRect(32, 0, 43, 1024);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 16);
  tex.anisotropy = 16;
  return tex;
}

// Procedural Indian Rural / Village Road Texture with Weathered Crumbling Earthy Edges & Kankar Gravel
function createVillageRoadTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Weathered rural asphalt center
  ctx.fillStyle = '#262a33';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 14000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    ctx.fillStyle = Math.random() > 0.5 ? '#333a46' : '#181b22';
    ctx.fillRect(x, y, 1, 1);
  }

  // Crumbling patched tar sections
  ctx.fillStyle = '#101318';
  ctx.fillRect(150, 70, 90, 60);
  ctx.fillRect(270, 340, 105, 75);

  // Kankar gravel & small stones on road
  ctx.fillStyle = '#94a3b8';
  for (let g = 0; g < 180; g++) {
    const gx = 80 + Math.random() * 352;
    const gy = Math.random() * 512;
    ctx.fillRect(gx, gy, 2, 2);
  }

  // Dry organic cow-dung / mud patches along sides
  const mudPatches = [
    { x: 135, y: 140, r: 12 },
    { x: 375, y: 280, r: 15 },
    { x: 145, y: 440, r: 10 },
  ];
  mudPatches.forEach((mp) => {
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.arc(mp.x, mp.y, mp.r, 0, Math.PI * 2);
    ctx.fill();
  });

  // Deep red/brown Indian soil dust along the edges with natural jagged fringe
  const dustGradL = ctx.createLinearGradient(0, 0, 115, 0);
  dustGradL.addColorStop(0, '#78431e');
  dustGradL.addColorStop(0.7, '#673516');
  dustGradL.addColorStop(1, 'rgba(120, 67, 30, 0)');
  ctx.fillStyle = dustGradL;
  ctx.fillRect(0, 0, 115, 512);

  const dustGradR = ctx.createLinearGradient(512, 0, 397, 0);
  dustGradR.addColorStop(0, '#78431e');
  dustGradR.addColorStop(0.7, '#673516');
  dustGradR.addColorStop(1, 'rgba(120, 67, 30, 0)');
  ctx.fillStyle = dustGradR;
  ctx.fillRect(397, 0, 115, 512);

  // Faded weathered yellow centerline
  ctx.fillStyle = 'rgba(234, 179, 8, 0.45)';
  for (let y = 0; y < 512; y += 80) {
    ctx.fillRect(253, y + 15, 6, 42);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 10);
  return tex;
}

// Procedural Yellow/Black Speed Breaker Diagonal Stripe Texture
function createSpeedBreakerTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  // Alternating high-contrast diagonal yellow & black hazard stripes
  ctx.fillStyle = '#facc15';
  ctx.fillRect(0, 0, 256, 64);

  ctx.fillStyle = '#09090b';
  for (let x = -64; x < 320; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 16, 0);
    ctx.lineTo(x + 32, 64);
    ctx.lineTo(x + 16, 64);
    ctx.closePath();
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

// Procedural Atmospheric Sky Dome Texture
function createAtmosphericSkyTexture(timeOfDay: TimeOfDay): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  if (timeOfDay === 'morning') {
    grad.addColorStop(0, '#1e3a8a');
    grad.addColorStop(0.5, '#60a5fa');
    grad.addColorStop(0.82, '#fed7aa');
    grad.addColorStop(1, '#ffedd5');
  } else if (timeOfDay === 'sunset') {
    grad.addColorStop(0, '#311042');
    grad.addColorStop(0.4, '#831843');
    grad.addColorStop(0.7, '#ea580c');
    grad.addColorStop(1, '#fbbf24');
  } else if (timeOfDay === 'night') {
    grad.addColorStop(0, '#020408');
    grad.addColorStop(0.7, '#070b14');
    grad.addColorStop(1, '#0e1726');
  } else {
    // Warm clear Indian afternoon sky
    grad.addColorStop(0, '#0284c7');
    grad.addColorStop(0.45, '#38bdf8');
    grad.addColorStop(0.85, '#bae6fd');
    grad.addColorStop(1, '#fde68a'); // Soft warm horizon dust haze
  }

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  return new THREE.CanvasTexture(canvas);
}

export function buildCityWorld(scene: THREE.Scene): CityWorldInstance {
  const worldGroup = new THREE.Group();
  scene.add(worldGroup);

  const obstacles: WorldObstacle[] = [];
  const stuntRamps: StuntRamp[] = [];
  const streetLamps: THREE.PointLight[] = [];

  // =============================================================
  // 1. SKY DOME, SUNLIGHT & ATMOSPHERE
  // =============================================================
  const skyGeo = new THREE.SphereGeometry(950, 32, 24);
  const skyMat = new THREE.MeshBasicMaterial({
    map: createAtmosphericSkyTexture('afternoon'),
    side: THREE.BackSide,
    depthWrite: false,
  });
  const skyDome = new THREE.Mesh(skyGeo, skyMat);
  worldGroup.add(skyDome);

  // Layered 3D cumulus cloud billboards
  const cloudsGroup = new THREE.Group();
  const cloudMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
  });
  const cloudGeo = new THREE.SphereGeometry(20, 8, 8);
  for (let c = 0; c < 40; c++) {
    const cloud = new THREE.Mesh(cloudGeo, cloudMat);
    const cx = (Math.random() - 0.5) * 1400;
    const cz = (Math.random() - 0.5) * 1400;
    const cy = 180 + Math.random() * 60;
    cloud.scale.set(2.8 + Math.random() * 2, 0.65, 2.0 + Math.random() * 1.5);
    cloud.position.set(cx, cy, cz);
    cloudsGroup.add(cloud);
  }
  worldGroup.add(cloudsGroup);

  // Directional Sun Light with warm natural Indian sunlight
  const sunLight = new THREE.DirectionalLight(0xfff7ed, 2.3);
  sunLight.position.set(220, 320, 160);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 1024;
  sunLight.shadow.mapSize.height = 1024;
  sunLight.shadow.camera.near = 5;
  sunLight.shadow.camera.far = 600;
  const shadowDist = 140;
  sunLight.shadow.camera.left = -shadowDist;
  sunLight.shadow.camera.right = shadowDist;
  sunLight.shadow.camera.top = shadowDist;
  sunLight.shadow.camera.bottom = -shadowDist;
  sunLight.shadow.bias = -0.0003;
  sunLight.shadow.normalBias = 0.035;
  scene.add(sunLight);
  scene.add(sunLight.target);

  const ambientLight = new THREE.AmbientLight(0xfff7ed, 1.15);
  scene.add(ambientLight);

  // Soft sky/ground ambient fill prevents dark silhouettes
  const hemiLight = new THREE.HemisphereLight(0xfffaed, 0x52433d, 1.25);
  scene.add(hemiLight);

  const worldFog = new THREE.FogExp2(0xb0d5f8, 0.0009);
  scene.fog = worldFog;

  // =============================================================
  // 2. CONTINUOUS NATURAL TERRAIN (NO EMPTY EDGE VOIDS)
  // =============================================================
  // 2800m x 4000m continuous landscape plane covering the entire world (-1400 to +1400 X, -1250 to +2750 Z)
  const terrainGeo = new THREE.PlaneGeometry(2800, 4000, 8, 8);
  terrainGeo.rotateX(-Math.PI / 2);
  const terrainMat = new THREE.MeshStandardMaterial({
    color: 0x2e3d2b, // Deep natural grass & shrubland
    roughness: 0.95,
  });
  const mainTerrain = new THREE.Mesh(terrainGeo, terrainMat);
  mainTerrain.position.set(0, -0.05, 750);
  mainTerrain.receiveShadow = true;
  worldGroup.add(mainTerrain);

  // Distant Mountain Ranges on Northern & Western Horizons
  const hillMat = new THREE.MeshStandardMaterial({ color: 0x1f2e24, roughness: 0.95 });
  for (let h = -900; h <= 900; h += 220) {
    const hill1 = new THREE.Mesh(new THREE.ConeGeometry(240, 160, 8), hillMat);
    hill1.position.set(h, 70, -1000);
    worldGroup.add(hill1);

    const hill2 = new THREE.Mesh(new THREE.ConeGeometry(220, 140, 8), hillMat);
    hill2.position.set(-1000, 60, h);
    worldGroup.add(hill2);
  }

  // =============================================================
  // 3. MAIN INDIAN NATIONAL HIGHWAY (NH-48 CORRIDOR)
  // =============================================================
  // 6 lanes total: width 28m, length 1800m (from z = -900 to +900)
  const highwayWidth = 28.0;
  const highwayLength = 1800.0;

  const hwyTex = createIndianHighwayTexture();
  const hwyMat = new THREE.MeshStandardMaterial({
    map: hwyTex,
    roughness: 0.78,
    metalness: 0.12,
  });

  const highwayGeo = new THREE.PlaneGeometry(highwayWidth, highwayLength, 2, 40);
  highwayGeo.rotateX(-Math.PI / 2);
  const highwayMesh = new THREE.Mesh(highwayGeo, hwyMat);
  highwayMesh.position.set(0, 0, 0);
  highwayMesh.receiveShadow = true;
  worldGroup.add(highwayMesh);

  // 3D Natural Earth Soft Shoulders along NH-48 (Indian Red Laterite Soil & Gravel)
  const shoulderMat = new THREE.MeshStandardMaterial({
    color: 0x78350f, // Indian laterite reddish-brown soil
    roughness: 0.96,
  });
  const shoulderGeo = new THREE.PlaneGeometry(5.5, highwayLength, 2, 20);
  shoulderGeo.rotateX(-Math.PI / 2);

  const shoulderMeshL = new THREE.Mesh(shoulderGeo, shoulderMat);
  shoulderMeshL.position.set(-highwayWidth / 2 - 2.75, -0.01, 0);
  shoulderMeshL.receiveShadow = true;
  worldGroup.add(shoulderMeshL);

  const shoulderMeshR = new THREE.Mesh(shoulderGeo, shoulderMat);
  shoulderMeshR.position.set(highwayWidth / 2 + 2.75, -0.01, 0);
  shoulderMeshR.receiveShadow = true;
  worldGroup.add(shoulderMeshR);

  // Concrete Median Barrier with Yellow/Black Kerb Base
  const medianShape = new THREE.Shape();
  medianShape.moveTo(-0.35, 0);
  medianShape.lineTo(0.35, 0);
  medianShape.lineTo(0.25, 0.28);
  medianShape.lineTo(0.12, 0.92);
  medianShape.lineTo(-0.12, 0.92);
  medianShape.lineTo(-0.25, 0.28);
  medianShape.lineTo(-0.35, 0);

  const medianGeo = new THREE.ExtrudeGeometry(medianShape, {
    depth: highwayLength - 160, // Openings at junctions
    bevelEnabled: false,
    steps: 1,
  });
  medianGeo.translate(0, 0, -(highwayLength - 160) / 2);

  const medianMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.85,
  });

  const medianMesh = new THREE.Mesh(medianGeo, medianMat);
  medianMesh.position.set(0, 0, 0);
  medianMesh.castShadow = true;
  medianMesh.receiveShadow = true;
  worldGroup.add(medianMesh);

  // Median Oleander Shrubbery (Flowering plants typical on Indian NHAI highways)
  const bushGeo = new THREE.SphereGeometry(0.55, 8, 6);
  const bushMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.9 });
  for (let z = -750; z <= 750; z += 12) {
    if (Math.abs(z - -80) < 30 || Math.abs(z - 520) < 30) continue; // Clear at junctions
    const bush = new THREE.Mesh(bushGeo, bushMat);
    bush.position.set(0, 1.15, z);
    bush.scale.set(0.65, 0.8, 1.4);
    worldGroup.add(bush);
  }

  // Obstacle for median
  obstacles.push({
    minX: -0.4,
    maxX: 0.4,
    minZ: -800,
    maxZ: 800,
    height: 1.0,
  });

  // Highway Guardrails along outer edges
  const railGeo = new THREE.BoxGeometry(0.18, 0.45, highwayLength);
  const guardMat = new THREE.MeshStandardMaterial({ color: 0xcfd4dc, metalness: 0.88, roughness: 0.25 });

  const railLeft = new THREE.Mesh(railGeo, guardMat);
  railLeft.position.set(-highwayWidth / 2 - 0.2, 0.65, 0);
  worldGroup.add(railLeft);

  const railRight = new THREE.Mesh(railGeo, guardMat);
  railRight.position.set(highwayWidth / 2 + 0.2, 0.65, 0);
  worldGroup.add(railRight);

  // =============================================================
  // 4. NORTHERN TERMINUS: MOUNTAIN HIGHWAY TUNNEL (z = -900)
  // =============================================================
  const tunnelGroup = new THREE.Group();
  tunnelGroup.position.set(0, 0, -900);
  worldGroup.add(tunnelGroup);

  // Massive Concrete Tunnel Portal Facade
  const portalMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 });
  const portalWall = new THREE.Mesh(new THREE.BoxGeometry(75, 18, 8), portalMat);
  portalWall.position.set(0, 9, -4);
  tunnelGroup.add(portalWall);

  // Dual Arched Tunnel Entrances
  const tunnelCeilingMat = new THREE.MeshStandardMaterial({ color: 0x090a0f, roughness: 0.95 });
  const archL = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 30, 16, 1, false, 0, Math.PI), tunnelCeilingMat);
  archL.rotateZ(Math.PI / 2);
  archL.position.set(-8, 5, -15);
  tunnelGroup.add(archL);

  const archR = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 30, 16, 1, false, 0, Math.PI), tunnelCeilingMat);
  archR.rotateZ(Math.PI / 2);
  archR.position.set(8, 5, -15);
  tunnelGroup.add(archR);

  // Overhead Tunnel Gantry Sign: "NH-48 GHAT TUNNEL - SPEED LIMIT 60"
  const tunSign = new THREE.Mesh(
    new THREE.BoxGeometry(18, 2.4, 0.2),
    new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.4 })
  );
  tunSign.position.set(0, 12.5, 0.2);
  tunnelGroup.add(tunSign);

  // Amber Tunnel Light Indicator (Emissive visual without fragment uniform overhead)
  const tunLightGeo = new THREE.BoxGeometry(0.8, 0.3, 0.3);
  const tunLightMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xf59e0b,
    emissiveIntensity: 2.8,
  });
  const tunLightMesh = new THREE.Mesh(tunLightGeo, tunLightMat);
  tunLightMesh.position.set(0, 11, 2);
  tunnelGroup.add(tunLightMesh);

  // Extended Tunnel Interior Roadway & Sodium Tube Lights (Seamless tunnel continuation)
  const tunRoadGeo = new THREE.PlaneGeometry(highwayWidth, 80);
  tunRoadGeo.rotateX(-Math.PI / 2);
  const tunRoad = new THREE.Mesh(tunRoadGeo, hwyMat);
  tunRoad.position.set(0, 0.01, -35);
  tunRoad.receiveShadow = true;
  tunnelGroup.add(tunRoad);

  const tunCeilingMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xf59e0b,
    emissiveIntensity: 3.0,
  });
  for (let tz = -10; tz >= -60; tz -= 15) {
    const tubeGeo = new THREE.CylinderGeometry(0.12, 0.12, 5, 8);
    tubeGeo.rotateZ(Math.PI / 2);
    const tubeMesh = new THREE.Mesh(tubeGeo, tunCeilingMat);
    tubeMesh.position.set(0, 7.8, tz);
    tunnelGroup.add(tubeMesh);
  }

  // =============================================================
  // 5. SOUTHERN HIGHWAY & CONTINUATION: NH-45 / NH-44 TAMIL NADU CORRIDOR
  // Toll Plaza at z = 868-880, continuing seamlessly past the tollgate to z = 2400!
  // =============================================================
  const tollGroup = new THREE.Group();
  tollGroup.position.set(0, 0, 880);
  worldGroup.add(tollGroup);

  // Extended Landscape Ground Plane for Southern Corridor (z = 800 to 2600)
  const southTerrainGeo = new THREE.PlaneGeometry(1600, 1800, 4, 4);
  southTerrainGeo.rotateX(-Math.PI / 2);
  const southTerrain = new THREE.Mesh(southTerrainGeo, terrainMat);
  southTerrain.position.set(0, -0.05, 1700);
  southTerrain.receiveShadow = true;
  worldGroup.add(southTerrain);

  // Overhead FASTag Canopy at Toll Plaza
  const canopy = new THREE.Mesh(
    new THREE.BoxGeometry(45, 1.2, 14),
    new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.5 })
  );
  canopy.position.set(0, 8.5, 0);
  tollGroup.add(canopy);

  // Toll Booth Cabins & Yellow/Black Crash Islands
  const boothMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4 });
  const islandMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.6 });

  for (let bx = -16; bx <= 16; bx += 8) {
    const island = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 10), islandMat);
    island.position.set(bx, 0.3, 0);
    tollGroup.add(island);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.8, 2.4), boothMat);
    cabin.position.set(bx, 2.0, 0);
    tollGroup.add(cabin);
  }

  // CONTINUOUS 6-LANE NATIONAL HIGHWAY CORRIDOR (z = 880 to 2400: length 1520m)
  const extHwyLength = 1520.0;
  const extHwyGeo = new THREE.PlaneGeometry(highwayWidth, extHwyLength, 2, 30);
  extHwyGeo.rotateX(-Math.PI / 2);
  const extHighway = new THREE.Mesh(extHwyGeo, hwyMat);
  extHighway.position.set(0, 0.01, 880 + extHwyLength / 2);
  extHighway.receiveShadow = true;
  worldGroup.add(extHighway);

  // Extended Red Laterite Earth Shoulders
  const extShoulderGeo = new THREE.PlaneGeometry(5.5, extHwyLength, 2, 20);
  extShoulderGeo.rotateX(-Math.PI / 2);
  const extShoulderL = new THREE.Mesh(extShoulderGeo, shoulderMat);
  extShoulderL.position.set(-highwayWidth / 2 - 2.75, 0.0, 880 + extHwyLength / 2);
  worldGroup.add(extShoulderL);

  const extShoulderR = new THREE.Mesh(extShoulderGeo, shoulderMat);
  extShoulderR.position.set(highwayWidth / 2 + 2.75, 0.0, 880 + extHwyLength / 2);
  worldGroup.add(extShoulderR);

  // Extended Concrete Median Barrier along NH-45
  const extMedianGeo = new THREE.ExtrudeGeometry(medianShape, {
    depth: extHwyLength - 40,
    bevelEnabled: false,
    steps: 1,
  });
  extMedianGeo.translate(0, 0, -(extHwyLength - 40) / 2);
  const extMedianMesh = new THREE.Mesh(extMedianGeo, medianMat);
  extMedianMesh.position.set(0, 0, 880 + extHwyLength / 2);
  extMedianMesh.castShadow = true;
  worldGroup.add(extMedianMesh);

  // Median Flowering Bushes along extended highway
  for (let z = 920; z <= 2350; z += 15) {
    const bush = new THREE.Mesh(bushGeo, bushMat);
    bush.position.set(0, 1.15, z);
    bush.scale.set(0.65, 0.8, 1.4);
    worldGroup.add(bush);
  }

  // Overhead Bilingual Tamil Nadu NHAI Direction Gantries
  const southernGantryMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.35 });
  const southernGantryLocations = [
    { z: 980, tText: 'திருச்சி 180 KM • மதுரை 320 KM', eText: 'NH-45 GST ROAD • TRICHY 180 KM • MADURAI 320 KM' },
    { z: 1450, tText: 'சேலம் 120 KM • கோவை 280 KM', eText: 'SALEM 120 KM • COIMBATORE 280 KM' },
    { z: 1950, tText: 'திண்டுக்கல் 160 KM • கன்னியாகுமரி 540 KM', eText: 'DINDIGUL 160 KM • KANYAKUMARI 540 KM' },
  ];

  southernGantryLocations.forEach((g) => {
    const gCanvas = document.createElement('canvas');
    gCanvas.width = 1024;
    gCanvas.height = 128;
    const gCtx = gCanvas.getContext('2d')!;
    gCtx.fillStyle = '#15803d';
    gCtx.fillRect(0, 0, 1024, 128);
    gCtx.strokeStyle = '#ffffff';
    gCtx.lineWidth = 6;
    gCtx.strokeRect(6, 6, 1012, 116);
    gCtx.fillStyle = '#fef08a';
    gCtx.font = 'bold 38px sans-serif';
    gCtx.textAlign = 'center';
    gCtx.fillText(g.tText, 512, 54);
    gCtx.fillStyle = '#ffffff';
    gCtx.font = 'bold 26px sans-serif';
    gCtx.fillText(g.eText, 512, 98);

    const gSign = new THREE.Mesh(
      new THREE.BoxGeometry(24, 2.6, 0.25),
      new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(gCanvas), roughness: 0.4 })
    );
    gSign.position.set(0, 8.8, g.z);
    worldGroup.add(gSign);

    // Gantry support steel pillars
    [-14.5, 14.5].forEach((px) => {
      const gPillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.24, 9.2, 12),
        new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 })
      );
      gPillar.position.set(px, 4.6, g.z);
      worldGroup.add(gPillar);
    });
  });

  // Roadside Tamil Nadu Highway A2B & Saravana Bhavan Restaurant Plaza (at x = 36m, z = 1350m)
  const motelGroup = new THREE.Group();
  motelGroup.position.set(38, 0, 1350);
  worldGroup.add(motelGroup);

  const motelMain = new THREE.Mesh(
    new THREE.BoxGeometry(32, 7.5, 18),
    new THREE.MeshStandardMaterial({ color: 0xffedd5, roughness: 0.6 })
  );
  motelMain.position.set(0, 3.75, 0);
  motelMain.castShadow = true;
  motelGroup.add(motelMain);

  // Restaurant Neon Billboard: "ஹோட்டல் சரவணா பவன் • A2B HIGHWAY MOTEL"
  const motelCanvas = document.createElement('canvas');
  motelCanvas.width = 512;
  motelCanvas.height = 128;
  const mCtx = motelCanvas.getContext('2d')!;
  mCtx.fillStyle = '#991b1b';
  mCtx.fillRect(0, 0, 512, 128);
  mCtx.fillStyle = '#fef08a';
  mCtx.font = 'bold 36px sans-serif';
  mCtx.textAlign = 'center';
  mCtx.fillText('ஹோட்டல் சரவணா பவன்', 256, 52);
  mCtx.fillStyle = '#ffffff';
  mCtx.font = 'bold 24px sans-serif';
  mCtx.fillText('HOTEL SARAVANA BHAVAN & TEA', 256, 96);

  const motelSign = new THREE.Mesh(
    new THREE.BoxGeometry(16, 2.8, 0.2),
    new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(motelCanvas) })
  );
  motelSign.position.set(0, 9.2, 9.1);
  motelGroup.add(motelSign);

  // Parking Lot for buses & cars
  const parkGeo = new THREE.PlaneGeometry(42, 28);
  parkGeo.rotateX(-Math.PI / 2);
  const parkMesh = new THREE.Mesh(parkGeo, hwyMat);
  parkMesh.position.set(-6, 0.02, 12);
  motelGroup.add(parkMesh);

  // Roadside Coconut Palm Groves along the Southern Highway Corridor
  const palmMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
  const palmFrondMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 });
  for (let pz = 940; pz <= 2350; pz += 40) {
    [-22, 22].forEach((px) => {
      const palm = new THREE.Group();
      palm.position.set(px + (Math.random() - 0.5) * 4, 0, pz + (Math.random() - 0.5) * 8);

      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 9.5, 8), palmMat);
      trunk.position.set(0, 4.75, 0);
      trunk.rotation.z = (Math.random() - 0.5) * 0.15;
      palm.add(trunk);

      // Crown of Fronds
      for (let f = 0; f < 8; f++) {
        const frond = new THREE.Mesh(new THREE.ConeGeometry(1.6, 3.8, 5), palmFrondMat);
        frond.rotation.z = Math.PI / 2 + 0.3;
        frond.rotation.y = (f * Math.PI) / 4;
        frond.position.set(0, 9.5, 0);
        palm.add(frond);
      }
      worldGroup.add(palm);
    });
  }

  // Southern Terminus Return Loop & Flyover Interchange (z = 2360 to 2420)
  // Connects southbound lanes back into northbound lanes so player seamlessly cruises without barrier
  const loopGeo = new THREE.RingGeometry(12, 28, 24, 1, -Math.PI / 2, Math.PI);
  loopGeo.rotateX(-Math.PI / 2);
  const loopMesh = new THREE.Mesh(loopGeo, hwyMat);
  loopMesh.position.set(0, 0.02, 2380);
  worldGroup.add(loopMesh);

  // =============================================================
  // 6. CONNECTED SERVICE ROAD (Running Parallel on the East Side)
  // =============================================================
  // Paved two-lane service road at x = 24m, spanning z = -650 to +650
  const cityTex = createCityStreetTexture();
  const cityRoadMat = new THREE.MeshStandardMaterial({ map: cityTex, roughness: 0.8 });

  const serviceRoadGeo = new THREE.PlaneGeometry(9.0, 1300);
  serviceRoadGeo.rotateX(-Math.PI / 2);
  const serviceRoad = new THREE.Mesh(serviceRoadGeo, cityRoadMat);
  serviceRoad.position.set(24.0, 0.01, 0);
  serviceRoad.receiveShadow = true;
  worldGroup.add(serviceRoad);

  // Connecting Slip Roads (Highway Entry & Exit Ramps)
  const slip1Geo = new THREE.PlaneGeometry(7.0, 70);
  slip1Geo.rotateX(-Math.PI / 2);
  const slip1 = new THREE.Mesh(slip1Geo, cityRoadMat);
  slip1.position.set(19.0, 0.012, -220);
  slip1.rotation.y = -0.15;
  worldGroup.add(slip1);

  const slip2 = new THREE.Mesh(slip1Geo, cityRoadMat);
  slip2.position.set(19.0, 0.012, 280);
  slip2.rotation.y = 0.15;
  worldGroup.add(slip2);

  // =============================================================
  // 7. ROADSIDE INDIAN COMMERCE: DHABA, TEA STALL & PETROL PUMP
  // =============================================================
  // A. "PUNJABI HIGHWAY KING DHABA" (at x = 36m, z = -140m)
  const dhabaGroup = new THREE.Group();
  dhabaGroup.position.set(38, 0, -140);
  worldGroup.add(dhabaGroup);

  // Main Dhaba Hall with Corrugated Tin Roof
  const dhabaBuilding = new THREE.Mesh(
    new THREE.BoxGeometry(18, 4.2, 12),
    new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 })
  );
  dhabaBuilding.position.set(0, 2.1, 0);
  dhabaGroup.add(dhabaBuilding);

  const dhabaRoof = new THREE.Mesh(
    new THREE.BoxGeometry(20, 0.4, 14),
    new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.6 })
  );
  dhabaRoof.position.set(0, 4.3, 0);
  dhabaGroup.add(dhabaRoof);

  // Hindi/English Dhaba Signboard
  const dhabaSign = new THREE.Mesh(
    new THREE.BoxGeometry(14, 1.8, 0.2),
    new THREE.MeshStandardMaterial({ color: 0xfacc15 })
  );
  dhabaSign.position.set(0, 4.8, 6.2);
  dhabaGroup.add(dhabaSign);

  // Open-Air Dining Charpais (Rope Cots)
  const cotMat = new THREE.MeshStandardMaterial({ color: 0x92400e });
  for (let i = -6; i <= 6; i += 4) {
    const cot = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 1.2), cotMat);
    cot.position.set(i, 0.25, 9);
    dhabaGroup.add(cot);
  }

  // B. "SHAKTI PETROL PUMP" (at x = 38m, z = 160m)
  const petrolGroup = new THREE.Group();
  petrolGroup.position.set(38, 0, 160);
  worldGroup.add(petrolGroup);

  const pumpCanopy = new THREE.Mesh(
    new THREE.BoxGeometry(22, 0.8, 14),
    new THREE.MeshStandardMaterial({ color: 0xdc2626 }) // Red canopy
  );
  pumpCanopy.position.set(0, 6.2, 0);
  petrolGroup.add(pumpCanopy);

  // Canopy Pillars
  const pillarGeo = new THREE.CylinderGeometry(0.35, 0.35, 6, 12);
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc });
  [-8, 8].forEach((px) => {
    [-4, 4].forEach((pz) => {
      const p = new THREE.Mesh(pillarGeo, pillarMat);
      p.position.set(px, 3.0, pz);
      petrolGroup.add(p);
    });
  });

  // Fuel Dispenser Units with Digital LED
  const pumpMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8 });
  for (let px = -5; px <= 5; px += 5) {
    const pump = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 0.9), pumpMat);
    pump.position.set(px, 1.1, 0);
    petrolGroup.add(pump);
  }

  // C. PROCEDURAL AUTHENTIC INDIAN ROADSIDE ASSETS (Milestones, Electrical Wires, Chai Tapris, Tyre Garages, Bus Stops)
  generateIndianRoadsideAssets(worldGroup, obstacles);

  // =============================================================
  // 8. COMPREHENSIVE INTERCONNECTED CITY ROAD NETWORK (ZERO DEAD ENDS)
  // Complete 7x10 arterial grid covering -720m to +720m X and -850m to +2380m Z
  // with sidewalks, curbs, 4-way zebra intersections, traffic lights, speed breakers, guardrails
  // =============================================================
  const roadNetwork = buildComprehensiveRoadNetwork(worldGroup, obstacles, hwyMat);
  roadNetwork.streetLamps.forEach((lamp) => streetLamps.push(lamp));
  roadNetwork.stuntRamps.forEach((ramp) => stuntRamps.push(ramp));

  // =============================================================
  // 8.5. EXTENSIVE CITY SHOPS & COMMERCIAL DISTRICTS
  // Supercar Tuning Garage, Fuel & EV Plazas, Reliance Supermarket,
  // Croma Electronics, Apollo Pharmacy, Madras Filter Coffee, Pothys Silks,
  // Saravana Bhavan Highway Food Court, Royal Punjabi Dhabas, and Coconut Stalls.
  // =============================================================
  populateCityShops(worldGroup, obstacles);

  // Multi-Story Indian City Buildings along the City Road (x = 70m to 420m)
  const bldgColors = [0xe2e8f0, 0xd97706, 0x0284c7, 0x475569, 0xf1f5f9];
  for (let bx = 80; bx <= 420; bx += 55) {
    [-1, 1].forEach((side) => {
      const bHeight = 28 + Math.random() * 45;
      const bWidth = 32 + Math.random() * 14;
      const bColor = bldgColors[Math.floor(Math.random() * bldgColors.length)];

      const bldg = new THREE.Mesh(
        new THREE.BoxGeometry(bWidth, bHeight, 28),
        new THREE.MeshStandardMaterial({ color: bColor, roughness: 0.6 })
      );
      bldg.position.set(bx, bHeight / 2, -80 + side * 30);
      bldg.castShadow = true;
      worldGroup.add(bldg);

      // Register building obstacle
      obstacles.push({
        minX: bx - bWidth / 2,
        maxX: bx + bWidth / 2,
        minZ: -80 + side * 30 - 14,
        maxZ: -80 + side * 30 + 14,
        height: bHeight,
      });
    });
  }

  // =============================================================
  // 9. DISTRICT 2: CONNECTED OLD CITY MARKET STREET (x = 320m, z = -350 to +180m)
  // =============================================================
  // Market Street Corridor (Integrated into unified RoadNetworkBuilder)

  // Market Street Roundabout at Junction (x = 320, z = -80)
  const rRoundGeo = new THREE.CylinderGeometry(8, 8, 0.45, 24);
  const rRound = new THREE.Mesh(rRoundGeo, new THREE.MeshStandardMaterial({ color: 0x15803d }));
  rRound.position.set(320, 0.22, -80);
  worldGroup.add(rRound);

  // Central Roundabout Memorial / Clock Tower
  const tower = new THREE.Mesh(
    new THREE.BoxGeometry(3, 14, 3),
    new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.5 })
  );
  tower.position.set(320, 7.2, -80);
  worldGroup.add(tower);

  // Dense Indian Market Shops & Fabric Canopies along Market Street
  const canopyPalette = [0xd97706, 0xef4444, 0x0284c7, 0x10b981];
  for (let mz = -330; mz <= 160; mz += 28) {
    if (Math.abs(mz - -80) < 25) continue;
    [-1, 1].forEach((side) => {
      const shop = new THREE.Mesh(
        new THREE.BoxGeometry(10, 6, 8),
        new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.7 })
      );
      shop.position.set(320 + side * 14, 3, mz);
      shop.castShadow = true;
      worldGroup.add(shop);

      const aw = new THREE.Mesh(
        new THREE.BoxGeometry(10.5, 0.1, 4),
        new THREE.MeshStandardMaterial({ color: canopyPalette[Math.floor(Math.random() * canopyPalette.length)] })
      );
      aw.position.set(320 + side * 9.5, 4.2, mz);
      aw.rotation.z = side * 0.25;
      worldGroup.add(aw);
    });
  }

  // =============================================================
  // 10. DISTRICT 5: CONNECTED RURAL VILLAGE ROAD (z = -380m, x = 0 to -420m)
  // =============================================================
  // Village Road Corridor (Integrated into unified RoadNetworkBuilder)

  // Traditional Indian Banyan & Peepal Trees along the Village Road
  const banyanMat = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.9 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.95 });

  for (let vx = -60; vx >= -390; vx -= 50) {
    [-1, 1].forEach((side) => {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.9, 5, 8), woodMat);
      trunk.position.set(vx, 2.5, -380 + side * 11);
      worldGroup.add(trunk);

      const foliage = new THREE.Mesh(new THREE.SphereGeometry(4.5, 8, 8), banyanMat);
      foliage.scale.set(1.4, 0.8, 1.4);
      foliage.position.set(vx, 6.2, -380 + side * 11);
      worldGroup.add(foliage);
    });
  }

  // Village Square Roundabout with Ancient Banyan Shrine (at x = -420, z = -380)
  const vRound = new THREE.Mesh(new THREE.CylinderGeometry(12, 12, 0.4, 24), terrainMat);
  vRound.position.set(-420, 0.2, -380);
  worldGroup.add(vRound);

  // Central Village Banyan Tree
  const bigBanyan = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 2.2, 8, 10), woodMat);
  bigBanyan.position.set(-420, 4, -380);
  worldGroup.add(bigBanyan);

  const bigCrown = new THREE.Mesh(new THREE.SphereGeometry(9, 10, 8), banyanMat);
  bigCrown.scale.set(1.6, 0.8, 1.6);
  bigCrown.position.set(-420, 9.5, -380);
  worldGroup.add(bigCrown);

  // Rural Mud / Clay-Tiled Village Houses
  const hutMat = new THREE.MeshStandardMaterial({ color: 0xca8a04, roughness: 0.9 });
  const tileMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.8 });

  for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
    const hx = -420 + Math.cos(a) * 24;
    const hz = -380 + Math.sin(a) * 24;

    const hut = new THREE.Mesh(new THREE.BoxGeometry(7, 3.2, 6), hutMat);
    hut.position.set(hx, 1.6, hz);
    worldGroup.add(hut);

    const roof = new THREE.Mesh(new THREE.ConeGeometry(5.5, 2.2, 4), tileMat);
    roof.position.set(hx, 4.3, hz);
    roof.rotation.y = Math.PI / 4;
    worldGroup.add(roof);
  }

  // =============================================================
  // 11. DISTRICT 4: CONNECTED INDUSTRIAL LOGISTICS PARK (z = 520m, x = 0 to -380m)
  // =============================================================
  // Industrial Logistics Road Corridor (Integrated into unified RoadNetworkBuilder)

  // Large Logistics Warehouses with Loading Docks
  const warehouseMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6, roughness: 0.5 });
  for (let ix = -80; ix >= -340; ix -= 90) {
    [-1, 1].forEach((side) => {
      const wh = new THREE.Mesh(new THREE.BoxGeometry(45, 12, 28), warehouseMat);
      wh.position.set(ix, 6, 520 + side * 28);
      wh.castShadow = true;
      worldGroup.add(wh);

      // Register obstacle
      obstacles.push({
        minX: ix - 23,
        maxX: ix + 23,
        minZ: 520 + side * 28 - 14,
        maxZ: 520 + side * 28 + 14,
        height: 12,
      });
    });
  }

  // =============================================================
  // 12. HIGHWAY ELEVATED FLYOVER (z = 120m to 480m)
  // =============================================================
  const flyoverGroup = new THREE.Group();
  flyoverGroup.position.set(-7, 8.5, 300);
  worldGroup.add(flyoverGroup);

  const flyDeck = new THREE.Mesh(
    new THREE.BoxGeometry(14, 1.4, 360),
    new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.7 })
  );
  flyDeck.castShadow = true;
  flyoverGroup.add(flyDeck);

  // Concrete Support Pillars
  const pilGeo = new THREE.CylinderGeometry(1.4, 1.6, 8.5, 12);
  const pilMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 });
  for (let pz = -140; pz <= 140; pz += 60) {
    const pil = new THREE.Mesh(pilGeo, pilMat);
    pil.position.set(0, -4.25, pz);
    flyoverGroup.add(pil);
  }

  // Flyover Entry Ramp
  const rampGeo = new THREE.BoxGeometry(14, 0.8, 120);
  const ramp = new THREE.Mesh(rampGeo, cityRoadMat);
  ramp.position.set(-7, 4.2, 90);
  ramp.rotation.x = -0.07;
  worldGroup.add(ramp);

  // Inter-district grid connectors are comprehensively built into RoadNetworkBuilder

  // =============================================================
  // 12.8. 3D INDIAN SPEED BREAKERS (RUMBLE STRIPS) & DRAINAGE NAALI
  // =============================================================
  const speedBreakerTex = createSpeedBreakerTexture();
  const speedBreakerMat = new THREE.MeshStandardMaterial({
    map: speedBreakerTex,
    roughness: 0.85,
  });

  const addSpeedBreaker = (bx: number, bz: number, length: number, isAlongX = false) => {
    // 3D curved asphalt speed breaker hump (0.07m height, 1.8m width)
    const humpGeo = new THREE.CylinderGeometry(0.85, 0.85, length, 16, 1, false, 0, Math.PI);
    if (isAlongX) {
      humpGeo.rotateZ(Math.PI / 2);
    } else {
      humpGeo.rotateZ(Math.PI / 2);
      humpGeo.rotateY(Math.PI / 2);
    }
    const hump = new THREE.Mesh(humpGeo, speedBreakerMat);
    hump.scale.set(1.0, 0.08, 1.0);
    hump.position.set(bx, 0.04, bz);
    hump.castShadow = true;
    hump.receiveShadow = true;
    worldGroup.add(hump);
  };

  // Place Indian speed breakers at key approaches
  addSpeedBreaker(16, -115, 16, true);   // Highway entry into City Arterial
  addSpeedBreaker(-40, -380, 10, false); // Main road into Village corridor
  addSpeedBreaker(-395, -380, 10, false);// Approaching Village Roundabout
  addSpeedBreaker(0, 825, 26, true);     // Approaching FASTag Toll Plaza
  addSpeedBreaker(320, -55, 12, false);  // Market Street crossing
  addSpeedBreaker(24, -165, 9, false);   // Service Road outside Punjabi Dhaba

  // Concrete Roadside Storm Drainage Channels ("Naali")
  const naaliMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 });
  const naaliCoverMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 });

  // Open concrete drain alongside Service Road (x: 29.5m, z: -550 to 550)
  const drainGeo = new THREE.BoxGeometry(0.8, 0.35, 1100);
  const serviceDrain = new THREE.Mesh(drainGeo, naaliMat);
  serviceDrain.position.set(29.2, 0.12, 0);
  worldGroup.add(serviceDrain);

  // Periodic precast concrete stone slab coverings over drain
  for (let dz = -520; dz <= 520; dz += 18) {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.08, 1.4), naaliCoverMat);
    slab.position.set(29.2, 0.28, dz);
    worldGroup.add(slab);
  }

  // =============================================================
  // 13. INDIAN HIGHWAY DETAILS: GANTRY SIGNS & OVERHEAD INFRASTRUCTURE
  // =============================================================
  // Overhead Tamil Nadu Green Highway Cantilever Gantries (NH-45 GST Road & ECR SH-49)
  const gantryMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.25 });

  const createBilingualGantryTexture = (
    route: string,
    tamilTitle: string,
    engTitle: string,
    subTamil: string,
    subEng: string
  ): THREE.CanvasTexture => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // NHAI Green reflective board
    ctx.fillStyle = '#15803d';
    ctx.fillRect(0, 0, 512, 256);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 10;
    ctx.strokeRect(10, 10, 492, 236);

    // Route code badge
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(route, 32, 48);

    // Tamil title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 40px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(tamilTitle, 256, 110);

    // English title
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(engTitle.toUpperCase(), 256, 160);

    // Subtext & arrow
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(`${subTamil} • ${subEng.toUpperCase()}`, 256, 215);

    return new THREE.CanvasTexture(canvas);
  };

  const gantryLocations = [
    {
      z: -480,
      t1: createBilingualGantryTexture('NH-45 GST ROAD', 'சென்னை / செங்கல்பட்டு', 'Chennai / Chengalpattu', 'நேராக செல்லவும்', 'Straight 85 KM'),
      t2: createBilingualGantryTexture('SH-49 ECR', 'மாமல்லபுரம் / புதுச்சேரி', 'Mahabalipuram / Puducherry', 'வேக வரம்பு', 'Speed Limit 100 KM/H'),
    },
    {
      z: -100,
      t1: createBilingualGantryTexture('NH-44 HIGHWAY', 'சேலம் / கோயம்புத்தூர் / மதுரை', 'Salem / Coimbatore / Madurai', 'தென் மாவட்டங்கள்', 'South TN Corridor'),
      t2: createBilingualGantryTexture('TN HIGHWAY', 'டீ கடை & உணவகம்', 'Tea Stall & Restaurant', 'வாகன நிறுத்துமிடம்', 'Parking 500 Meters'),
    },
    {
      z: 420,
      t1: createBilingualGantryTexture('NHAI TOLL', 'சுங்கச்சாவடி 1 கி.மீ', 'Toll Plaza 1 KM', 'பாஸ்டேக் மட்டும்', 'FASTag Lane Only'),
      t2: createBilingualGantryTexture('TN FLYOVER', 'திருச்சி / தஞ்சாவூர் மேம்பாலம்', 'Trichy / Thanjavur Flyover', 'அடுத்த இடதுபுறம்', 'Next Left Exit'),
    },
  ];

  gantryLocations.forEach((g) => {
    const gant = new THREE.Group();
    gant.position.set(0, 0, g.z);
    worldGroup.add(gant);

    const colL = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 8.2, 12), gantryMat);
    colL.position.set(-highwayWidth / 2 - 0.6, 4.1, 0);
    gant.add(colL);

    const colR = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 8.2, 12), gantryMat);
    colR.position.set(highwayWidth / 2 + 0.6, 4.1, 0);
    gant.add(colR);

    const beam = new THREE.Mesh(new THREE.BoxGeometry(highwayWidth + 2.5, 0.9, 0.9), gantryMat);
    beam.position.set(0, 7.8, 0);
    gant.add(beam);

    // Bilingual Green Signboards
    const sign1 = new THREE.Mesh(
      new THREE.BoxGeometry(10, 2.6, 0.15),
      new THREE.MeshStandardMaterial({ map: g.t1, roughness: 0.35 })
    );
    sign1.position.set(-6, 8.0, 0.45);
    gant.add(sign1);

    const sign2 = new THREE.Mesh(
      new THREE.BoxGeometry(8, 2.6, 0.15),
      new THREE.MeshStandardMaterial({ map: g.t2, roughness: 0.35 })
    );
    sign2.position.set(6, 8.0, 0.45);
    gant.add(sign2);
  });

  // Highway Median Streetlights every 55m
  const lampPoleGeo = new THREE.CylinderGeometry(0.16, 0.24, 9.8, 12);
  const lampMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 });
  const bulbMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfef08a, emissiveIntensity: 2.4 });

  for (let z = -750; z <= 750; z += 65) {
    if (Math.abs(z - -80) < 25 || Math.abs(z - 520) < 25) continue;
    const lamp = new THREE.Group();
    lamp.position.set(0, 0, z);
    worldGroup.add(lamp);

    const pole = new THREE.Mesh(lampPoleGeo, lampMat);
    pole.position.y = 4.9;
    lamp.add(pole);

    const headL = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.2, 0.35), bulbMat);
    headL.position.set(-2.5, 9.6, 0);
    lamp.add(headL);

    const headR = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.2, 0.35), bulbMat);
    headR.position.set(2.5, 9.6, 0);
    lamp.add(headR);

    // Emissive bulbMat handles the realistic glowing visual without fragment uniform overhead
  }

  // Street lamp heads use emissive bulbMat to illuminate realistically without fragment uniform vector overhead

  // High-Speed Stunt Launch Ramps on Service and Highway Shoulders
  const addRamp = (x: number, y: number, z: number, rotY: number) => {
    const rampW = 5.5;
    const rampL = 12.0;
    const rGeo = new THREE.BoxGeometry(rampW, 0.45, rampL);
    const rMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.25 });
    const rMesh = new THREE.Mesh(rGeo, rMat);
    rMesh.position.set(x, y + 1.1, z);
    rMesh.rotation.y = rotY;
    rMesh.rotation.x = -0.2;
    rMesh.castShadow = true;
    worldGroup.add(rMesh);
    stuntRamps.push({ x, y, z, rotation: rotY, width: rampW, length: rampL });
  };

  addRamp(8.5, 0, -180, 0);
  addRamp(-8.5, 0, 180, Math.PI);
  addRamp(24, 0, 360, 0);

  // Rain Particle System for Monsoon weather
  const rainCount = 1800;
  const rainGeo = new THREE.BufferGeometry();
  const rainPositions = new Float32Array(rainCount * 3);
  for (let i = 0; i < rainCount; i++) {
    rainPositions[i * 3] = (Math.random() - 0.5) * 140;
    rainPositions[i * 3 + 1] = Math.random() * 55;
    rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 140;
  }
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
  const rainMat = new THREE.PointsMaterial({ color: 0x93c5fd, size: 0.25, transparent: true, opacity: 0 });
  const rainParticles = new THREE.Points(rainGeo, rainMat);
  worldGroup.add(rainParticles);

  // Dynamic Streetlight Distance Culling & Repositioning
  // Uses emissive bulb materials to illuminate the road without shader uniform pressure
  const updateNearbyStreetLamps = (_pos: THREE.Vector3, maxIntensity = 3.2) => {
    bulbMat.emissiveIntensity = maxIntensity > 0.1 ? 2.6 : 0.0;
  };

  // Day/Night & Weather Controller
  const updateDayNightAndWeather = (
    timeOfDay: TimeOfDay,
    weather: WeatherType,
    cameraPos: THREE.Vector3
  ) => {
    skyDome.position.copy(cameraPos);

    if (timeOfDay === 'morning') {
      worldFog.color.setHex(0xfed7aa);
      worldFog.density = 0.001;
      sunLight.color.setHex(0xffedd5);
      sunLight.intensity = 2.4;
      sunLight.position.set(-160, 240, 140);
      ambientLight.color.setHex(0xffedd5);
      ambientLight.intensity = 1.15;
      streetLamps.forEach((l) => (l.intensity = 0));
    } else if (timeOfDay === 'sunset') {
      worldFog.color.setHex(0xea580c);
      worldFog.density = 0.0011;
      sunLight.color.setHex(0xf97316);
      sunLight.intensity = 2.2;
      sunLight.position.set(180, 160, -80);
      ambientLight.color.setHex(0xfb923c);
      ambientLight.intensity = 1.25;
      updateNearbyStreetLamps(cameraPos, 1.6);
    } else if (timeOfDay === 'night') {
      worldFog.color.setHex(0x070b14);
      worldFog.density = 0.002;
      sunLight.color.setHex(0x38bdf8);
      sunLight.intensity = 0.65;
      sunLight.position.set(100, 200, 100);
      ambientLight.color.setHex(0x334155);
      ambientLight.intensity = 0.65;
      updateNearbyStreetLamps(cameraPos, 3.2);
    } else {
      worldFog.color.setHex(0xb0d5f8);
      worldFog.density = 0.0009;
      sunLight.color.setHex(0xfff7ed);
      sunLight.intensity = 2.6;
      sunLight.position.set(220, 320, 160);
      ambientLight.color.setHex(0xfffaed);
      ambientLight.intensity = 1.2;
      streetLamps.forEach((l) => (l.intensity = 0));
    }

    // Rain particles handled with physical splashes and puddles in DynamicWeatherEffects
    rainMat.opacity = 0;
  };

  const getDistrictAtPosition = (x: number, z: number): DistrictType => {
    if (x < -180 && z < -200) return 'mountain';
    if (x < -80 && z < -250) return 'residential'; // Village
    if (x < -60 && z > 350) return 'industrial'; // Logistics
    if (x > 200 && z < 50) return 'downtown'; // Market & Cyber City
    if (z > 200 && x < 50 && x > -20) return 'highway';
    return 'highway';
  };

  const getGroundHeightAt = (x: number, z: number): number => {
    // Flyover deck elevation
    if (x > -14 && x < 0 && z > 150 && z < 450) {
      return 8.5;
    }
    // Flyover ramp slope
    if (x > -14 && x < 0 && z >= 30 && z <= 150) {
      return ((z - 30) / 120) * 8.5;
    }
    return 0.0;
  };

  const dispose = () => {
    hwyTex.dispose();
    cityTex.dispose();
    worldGroup.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const m = obj as THREE.Mesh;
        m.geometry?.dispose();
        if (Array.isArray(m.material)) m.material.forEach((mat) => mat.dispose());
        else m.material?.dispose();
      }
    });
  };

  return {
    group: worldGroup,
    obstacles,
    stuntRamps,
    streetLamps,
    sunLight,
    ambientLight,
    hemiLight,
    skyDome,
    cloudsGroup,
    rainParticles,
    updateDayNightAndWeather,
    updateNearbyStreetLamps,
    getDistrictAtPosition,
    getGroundHeightAt,
    dispose,
  };
}
