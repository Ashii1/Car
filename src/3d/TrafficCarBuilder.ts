import * as THREE from 'three';
import {
  getProjectorHeadlightTexture,
  getClassicHeadlightTexture,
  getTaillightEmissiveTexture,
  attachVehicleLighting,
  VehicleLightingController,
} from './VehicleLightingSystem';
import { createTamilBusDestinationTexture, createTamilLorryArtTexture } from './TamilNaduAssets';
import { TimeOfDay, WeatherType } from '../types/openCity';

export type VehicleCategory =
  | 'sedan'
  | 'suv'
  | 'sportscar'
  | 'hatchback'
  | 'van'
  | 'bus'
  | 'truck'
  | 'police'
  | 'autorickshaw'
  | 'indian_truck'
  | 'commuter_bike'
  | 'delivery_tempo'
  | 'scooter';

export interface BuiltVehicleInstance {
  group: THREE.Group;
  category: VehicleCategory;
  wheels: THREE.Group[];
  tailLights: THREE.Mesh[];
  headLights: THREE.Mesh[];
  strobeL?: THREE.Mesh;
  strobeR?: THREE.Mesh;
  lighting?: VehicleLightingController;
  setBrakeLights: (active: boolean) => void;
  updateAnimation: (speed: number, delta: number, isRaining?: boolean) => void;
  updateLighting?: (timeOfDay: TimeOfDay, weather: WeatherType) => void;
  dispose: () => void;
}

// Procedural realistic tire tread texture for vehicles
function createTireTreadTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#111317';
  ctx.fillRect(0, 0, 128, 128);

  // Circumferential water drainage channels
  ctx.fillStyle = '#07080a';
  ctx.fillRect(24, 0, 12, 128);
  ctx.fillRect(58, 0, 12, 128);
  ctx.fillRect(92, 0, 12, 128);

  // Lateral angled sipes
  ctx.strokeStyle = '#07080a';
  ctx.lineWidth = 3;
  for (let y = 0; y < 128; y += 16) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(24, y + 8);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(36, y + 4);
    ctx.lineTo(58, y + 12);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(70, y + 4);
    ctx.lineTo(92, y + 12);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(104, y);
    ctx.lineTo(128, y + 8);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 4);
  return tex;
}

// Procedural front grille honeycomb texture
function createGrilleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#090a0d';
  ctx.fillRect(0, 0, 64, 64);

  ctx.strokeStyle = '#272b36';
  ctx.lineWidth = 2;
  const size = 8;
  for (let y = 0; y < 64; y += size) {
    for (let x = 0; x < 64; x += size) {
      ctx.strokeRect(x + (y % (size * 2) === 0 ? 0 : size / 2), y, size, size);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 2);
  return tex;
}

export function buildRealisticVehicle(
  category: VehicleCategory,
  customColor?: number
): BuiltVehicleInstance {
  const root = new THREE.Group();
  const wheels: THREE.Group[] = [];
  const tailLights: THREE.Mesh[] = [];
  const headLights: THREE.Mesh[] = [];

  const tireTex = createTireTreadTexture();
  const grilleTex = createGrilleTexture();

  // Automotive Paint Colors
  const defaultColors: { [key in VehicleCategory]: number[] } = {
    sedan: [0x1e293b, 0x0f172a, 0x2563eb, 0xe2e8f0, 0x71717a],
    suv: [0xb91c1c, 0x0f172a, 0x334155, 0xffffff, 0x065f46],
    sportscar: [0xdc2626, 0xf59e0b, 0x0284c7, 0x10b981, 0x18181b],
    hatchback: [0x2563eb, 0xd97706, 0xe2e8f0, 0x059669, 0x475569],
    van: [0xf8fafc, 0x334155, 0x1e293b],
    bus: [0x1d4ed8, 0x047857, 0xb45309],
    truck: [0x0f172a, 0xb91c1c, 0x1e40af, 0xffffff],
    police: [0x09090b],
    autorickshaw: [0x15803d],
    indian_truck: [0xd97706, 0x0284c7, 0xdc2626],
    commuter_bike: [0x1e293b, 0xdc2626, 0x1d4ed8],
    delivery_tempo: [0xf8fafc, 0x0284c7, 0xf59e0b],
    scooter: [0xdc2626, 0x0284c7, 0x1e293b, 0xf59e0b],
  };

  const palette = defaultColors[category];
  const paintColor = customColor ?? palette[Math.floor(Math.random() * palette.length)];

  // =============================================================
  // AUTOMOTIVE PBR MATERIALS
  // =============================================================
  const paintMat = new THREE.MeshStandardMaterial({
    color: paintColor,
    metalness: 0.8,
    roughness: 0.18,
    envMapIntensity: 1.8,
  });

  const secondaryTrimMat = new THREE.MeshStandardMaterial({
    color: 0x090b0e,
    metalness: 0.7,
    roughness: 0.4,
  });

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.92,
    roughness: 0.08,
    transparent: true,
    opacity: 0.72,
  });

  const tireMat = new THREE.MeshStandardMaterial({
    map: tireTex,
    color: 0x18191d,
    roughness: 0.88,
    metalness: 0.08,
  });

  const rimAlloyMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d8,
    metalness: 0.9,
    roughness: 0.2,
  });

  const brakeRotorMat = new THREE.MeshStandardMaterial({
    color: 0xa1a1aa,
    metalness: 0.92,
    roughness: 0.22,
  });

  const caliperMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    roughness: 0.3,
    metalness: 0.6,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    metalness: 0.96,
    roughness: 0.1,
  });

  const grilleMat = new THREE.MeshStandardMaterial({
    map: grilleTex,
    color: 0x18181b,
    roughness: 0.6,
    metalness: 0.4,
  });

  const isClassicLighting =
    category === 'autorickshaw' ||
    category === 'indian_truck' ||
    category === 'commuter_bike';
  const hlTex = isClassicLighting
    ? getClassicHeadlightTexture()
    : getProjectorHeadlightTexture();

  const headLightLensMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: hlTex,
    emissiveMap: hlTex,
    emissive: isClassicLighting ? 0xfef08a : 0xf8fafc,
    emissiveIntensity: 3.2,
    roughness: 0.1,
    metalness: 0.15,
  });

  const taillightRunningTex = getTaillightEmissiveTexture(false);
  const taillightBrakeTex = getTaillightEmissiveTexture(true);

  const tailLightOffMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: taillightRunningTex,
    emissiveMap: taillightRunningTex,
    emissive: 0x991111,
    emissiveIntensity: 0.6,
    roughness: 0.15,
    metalness: 0.1,
  });

  const interiorMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.85,
  });

  // Human Skin & Clothing Materials
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xc68642, // Warm Indian skin tone
    roughness: 0.65,
    metalness: 0.05,
  });

  const hairBlackMat = new THREE.MeshStandardMaterial({
    color: 0x141416,
    roughness: 0.8,
  });

  // Helper to build an articulated 3D human driver for cars, trucks and buses
  const createCabinDriver = (posX: number, posY: number, posZ: number, shirtColor = 0x2563eb) => {
    const driverGroup = new THREE.Group();
    driverGroup.position.set(posX, posY, posZ);

    const shirtMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.7 });

    // Torso / Shirt
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.15, 0.44, 10), shirtMat);
    torso.position.y = 0.22;
    torso.castShadow = true;
    driverGroup.add(torso);

    // Head & Hair
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), skinMat);
    head.position.set(0, 0.52, 0.02);
    driverGroup.add(head);

    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.115, 10, 8), hairBlackMat);
    hair.position.set(0, 0.55, -0.02);
    hair.scale.set(0.96, 0.9, 1.05);
    driverGroup.add(hair);

    // Arms reaching for steering wheel
    const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.32, 8), shirtMat);
    armL.position.set(-0.16, 0.24, 0.14);
    armL.rotation.x = Math.PI / 3;
    driverGroup.add(armL);

    const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.32, 8), shirtMat);
    armR.position.set(0.16, 0.24, 0.14);
    armR.rotation.x = Math.PI / 3;
    driverGroup.add(armR);

    // Hands
    const handL = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), skinMat);
    handL.position.set(-0.12, 0.12, 0.28);
    driverGroup.add(handL);

    const handR = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), skinMat);
    handR.position.set(0.12, 0.12, 0.28);
    driverGroup.add(handR);

    return driverGroup;
  };

  // Helper to build a realistic automotive wheel (Rim, Spokes, Rotor, Caliper, Tire)
  const createWheel = (radius: number, width: number): THREE.Group => {
    const wGroup = new THREE.Group();

    // Tire with tread
    const tireGeo = new THREE.CylinderGeometry(radius, radius, width, 24);
    tireGeo.rotateZ(Math.PI / 2);
    const tireMesh = new THREE.Mesh(tireGeo, tireMat);
    tireMesh.castShadow = true;
    wGroup.add(tireMesh);

    // Turned alloy rim lip
    const rimGeo = new THREE.CylinderGeometry(radius * 0.72, radius * 0.72, width * 0.92, 24);
    rimGeo.rotateZ(Math.PI / 2);
    const rimMesh = new THREE.Mesh(rimGeo, rimAlloyMat);
    wGroup.add(rimMesh);

    // 5-Spoke Star Center Hub
    for (let s = 0; s < 5; s++) {
      const angle = (s / 5) * Math.PI * 2;
      const spoke = new THREE.Mesh(
        new THREE.BoxGeometry(width * 0.8, radius * 0.62, radius * 0.12),
        rimAlloyMat
      );
      spoke.position.set(0, Math.cos(angle) * radius * 0.32, Math.sin(angle) * radius * 0.32);
      spoke.rotation.x = angle;
      wGroup.add(spoke);
    }

    // Ventilated Brake Rotor & Caliper
    const rotor = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.58, radius * 0.58, 0.015, 20),
      brakeRotorMat
    );
    rotor.rotateZ(Math.PI / 2);
    wGroup.add(rotor);

    const caliper = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, radius * 0.26, radius * 0.2),
      caliperMat
    );
    caliper.position.set(0, radius * 0.32, 0);
    wGroup.add(caliper);

    return wGroup;
  };

  let strobeL: THREE.Mesh | undefined;
  let strobeR: THREE.Mesh | undefined;

  interface WiperInstance {
    pivot: THREE.Group;
    restAngle: number;
    sweepAngle: number;
    speed: number;
    phaseOffset: number;
  }
  const wipers: WiperInstance[] = [];

  const addWiper = (
    parent: THREE.Object3D,
    x: number,
    y: number,
    z: number,
    tiltX: number,
    bladeLength: number,
    restAngle = -0.65,
    sweepAngle = 1.25,
    speed = 1.0,
    phaseOffset = 0
  ) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, z);
    pivot.rotation.x = tiltX;
    pivot.rotation.z = restAngle;
    parent.add(pivot);

    // Wiper articulated arm
    const arm = new THREE.Mesh(
      new THREE.BoxGeometry(0.016, bladeLength * 0.45, 0.014),
      secondaryTrimMat
    );
    arm.position.set(0, bladeLength * 0.22, 0.01);
    pivot.add(arm);

    // Wiper rubber squeegee blade with aerodynamic spine
    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(0.022, bladeLength, 0.016),
      secondaryTrimMat
    );
    blade.position.set(0, bladeLength * 0.52, 0.014);
    pivot.add(blade);

    wipers.push({
      pivot,
      restAngle,
      sweepAngle,
      speed,
      phaseOffset,
    });
  };

  // =============================================================
  // 1. VEHICLE CATEGORIES WITH ACCURATE PROPORTIONS & GEOMETRY
  // =============================================================
  if (category === 'sedan' || category === 'police') {
    // Executive Sports Sedan / Police Cruiser
    // Length: 4.88m, Width: 1.96m, Height: 1.46m, Wheelbase: 2.85m
    const bodyGroup = new THREE.Group();
    root.add(bodyGroup);

    // Lower Sculpted Chassis
    const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.48, 4.85), paintMat);
    lowerBody.position.set(0, 0.44, 0);
    lowerBody.castShadow = true;
    bodyGroup.add(lowerBody);

    // Front Sloped Hood & Fenders
    const hood = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.24, 1.45), paintMat);
    hood.position.set(0, 0.68, 1.35);
    hood.rotation.x = 0.08;
    hood.castShadow = true;
    bodyGroup.add(hood);

    // Rear Trunk Deck
    const trunk = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.28, 0.95), paintMat);
    trunk.position.set(0, 0.68, -1.65);
    trunk.rotation.x = -0.06;
    trunk.castShadow = true;
    bodyGroup.add(trunk);

    // Aerodynamic Greenhouse Cabin (Curved roof, A/B/C-pillars, Glass)
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.62, 2.2), glassMat);
    cabin.position.set(0, 1.05, -0.2);
    cabin.castShadow = true;
    bodyGroup.add(cabin);

    // Thin Roof Cap
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.64, 0.06, 1.65), paintMat);
    roof.position.set(0, 1.38, -0.25);
    bodyGroup.add(roof);

    // Dual Aerodynamic Front Windshield Wipers
    addWiper(bodyGroup, -0.38, 0.82, 0.84, 0.52, 0.42, -0.65, 1.25, 1.0, 0.0);
    addWiper(bodyGroup, 0.22, 0.82, 0.84, 0.52, 0.42, -0.65, 1.25, 1.0, 0.0);

    // Detailed Interior: Dashboard, Steering Wheel, Front Seats & Driver
    const dash = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.28, 0.35), interiorMat);
    dash.position.set(0, 0.88, 0.65);
    bodyGroup.add(dash);

    const seatL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.45), interiorMat);
    seatL.position.set(-0.45, 0.88, 0);
    bodyGroup.add(seatL);

    const seatR = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.45), interiorMat);
    seatR.position.set(0.45, 0.88, 0);
    bodyGroup.add(seatR);

    // 3D Driver visible inside cabin
    bodyGroup.add(createCabinDriver(-0.45, 0.72, 0.05, category === 'police' ? 0x1e3a8a : 0x3b82f6));

    // Front Bumper, Hex Honeycomb Grille & Chrome Splitter
    const frontGrille = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.26, 0.08), grilleMat);
    frontGrille.position.set(0, 0.46, 2.45);
    bodyGroup.add(frontGrille);

    const frontSplitter = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.08, 0.25), secondaryTrimMat);
    frontSplitter.position.set(0, 0.22, 2.38);
    bodyGroup.add(frontSplitter);

    // Side Mirrors with LED turn indicators
    const mirrorL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.09, 0.12), paintMat);
    mirrorL.position.set(-1.06, 1.02, 0.72);
    bodyGroup.add(mirrorL);

    const mirrorR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.09, 0.12), paintMat);
    mirrorR.position.set(1.06, 1.02, 0.72);
    bodyGroup.add(mirrorR);

    // Dual Projector LED Headlights
    const hlGeo = new THREE.BoxGeometry(0.34, 0.12, 0.08);
    const hlL = new THREE.Mesh(hlGeo, headLightLensMat);
    hlL.position.set(-0.72, 0.58, 2.42);
    bodyGroup.add(hlL);
    headLights.push(hlL);

    const hlR = new THREE.Mesh(hlGeo, headLightLensMat);
    hlR.position.set(0.72, 0.58, 2.42);
    bodyGroup.add(hlR);
    headLights.push(hlR);

    // Dual Sculpted LED Taillights
    const tlGeo = new THREE.BoxGeometry(0.42, 0.14, 0.06);
    const tlL = new THREE.Mesh(tlGeo, tailLightOffMat);
    tlL.position.set(-0.72, 0.65, -2.43);
    bodyGroup.add(tlL);
    tailLights.push(tlL);

    const tlR = new THREE.Mesh(tlGeo, tailLightOffMat);
    tlR.position.set(0.72, 0.65, -2.43);
    bodyGroup.add(tlR);
    tailLights.push(tlR);

    // Chrome Dual Exhaust Tips
    const exhL = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.12, 12), chromeMat);
    exhL.rotateX(Math.PI / 2);
    exhL.position.set(-0.65, 0.26, -2.44);
    bodyGroup.add(exhL);

    const exhR = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.12, 12), chromeMat);
    exhR.rotateX(Math.PI / 2);
    exhR.position.set(0.65, 0.26, -2.44);
    bodyGroup.add(exhR);

    // Police Cruiser Special Equipment
    if (category === 'police') {
      // Contrast white pursuit doors
      const doorMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25 });
      const doorL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.54, 2.2), doorMat);
      doorL.position.set(-0.99, 0.48, 0);
      bodyGroup.add(doorL);

      const doorR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.54, 2.2), doorMat);
      doorR.position.set(0.99, 0.48, 0);
      bodyGroup.add(doorR);

      // Heavy Ram / Push Bumper
      const pushBumper = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.55, 0.2), chromeMat);
      pushBumper.position.set(0, 0.45, 2.54);
      bodyGroup.add(pushBumper);

      // A-Pillar Spotlight
      const spotL = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 10), chromeMat);
      spotL.position.set(-0.98, 1.15, 0.7);
      bodyGroup.add(spotL);

      // Aerodynamic Low-Profile Strobe Lightbar
      const barBase = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.06, 0.24), chromeMat);
      barBase.position.set(0, 1.42, -0.2);
      bodyGroup.add(barBase);

      const sGeo = new THREE.BoxGeometry(0.55, 0.12, 0.2);
      strobeL = new THREE.Mesh(
        sGeo,
        new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 2.0 })
      );
      strobeL.position.set(-0.32, 1.48, -0.2);
      bodyGroup.add(strobeL);

      strobeR = new THREE.Mesh(
        sGeo,
        new THREE.MeshStandardMaterial({ color: 0x3b82f6, emissive: 0x3b82f6, emissiveIntensity: 2.0 })
      );
      strobeR.position.set(0.32, 1.48, -0.2);
      bodyGroup.add(strobeR);
    }

    // 4 Wheels (Radius: 0.34m, Track width: 1.82m, Wheelbase: 2.85m)
    const wheelR = 0.34;
    const wheelW = 0.24;
    [-0.92, 0.92].forEach((wx) => {
      [1.42, -1.42].forEach((wz) => {
        const w = createWheel(wheelR, wheelW);
        w.position.set(wx, wheelR, wz);
        root.add(w);
        wheels.push(w);
      });
    });
  } else if (category === 'suv') {
    // Luxury Full-Size Performance SUV
    // Length: 5.05m, Width: 2.08m, Height: 1.76m, Ground clearance: 0.22m
    const bodyGroup = new THREE.Group();
    root.add(bodyGroup);

    // High ground clearance lower body
    const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.58, 4.95), paintMat);
    lowerBody.position.set(0, 0.58, 0);
    lowerBody.castShadow = true;
    bodyGroup.add(lowerBody);

    // Upright aggressive hood
    const hood = new THREE.Mesh(new THREE.BoxGeometry(1.98, 0.32, 1.55), paintMat);
    hood.position.set(0, 0.94, 1.35);
    hood.rotation.x = 0.05;
    hood.castShadow = true;
    bodyGroup.add(hood);

    // Tall SUV Cabin with panoramic glass
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.74, 2.9), glassMat);
    cabin.position.set(0, 1.36, -0.45);
    cabin.castShadow = true;
    bodyGroup.add(cabin);

    // Roof & Silver Roof Rack Rails
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 2.65), paintMat);
    roof.position.set(0, 1.75, -0.5);
    bodyGroup.add(roof);

    const railL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 2.2), chromeMat);
    railL.position.set(-0.84, 1.81, -0.5);
    bodyGroup.add(railL);

    const railR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 2.2), chromeMat);
    railR.position.set(0.84, 1.81, -0.5);
    bodyGroup.add(railR);

    // Dual Front Windshield Wipers
    addWiper(bodyGroup, -0.42, 1.08, 0.98, 0.48, 0.46, -0.65, 1.25, 1.0, 0.0);
    addWiper(bodyGroup, 0.24, 1.08, 0.98, 0.48, 0.46, -0.65, 1.25, 1.0, 0.0);

    // Front Bumper & Protective Skid Plate
    const frontGrille = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.36, 0.1), grilleMat);
    frontGrille.position.set(0, 0.62, 2.48);
    bodyGroup.add(frontGrille);

    const skidPlate = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.14, 0.25), chromeMat);
    skidPlate.position.set(0, 0.32, 2.44);
    bodyGroup.add(skidPlate);

    // Headlights & Taillights
    const hlGeo = new THREE.BoxGeometry(0.38, 0.16, 0.08);
    const hlL = new THREE.Mesh(hlGeo, headLightLensMat);
    hlL.position.set(-0.76, 0.76, 2.46);
    bodyGroup.add(hlL);
    headLights.push(hlL);

    const hlR = new THREE.Mesh(hlGeo, headLightLensMat);
    hlR.position.set(0.76, 0.76, 2.46);
    bodyGroup.add(hlR);
    headLights.push(hlR);

    const tlGeo = new THREE.BoxGeometry(0.44, 0.18, 0.06);
    const tlL = new THREE.Mesh(tlGeo, tailLightOffMat);
    tlL.position.set(-0.76, 0.88, -2.48);
    bodyGroup.add(tlL);
    tailLights.push(tlL);

    const tlR = new THREE.Mesh(tlGeo, tailLightOffMat);
    tlR.position.set(0.76, 0.88, -2.48);
    bodyGroup.add(tlR);
    tailLights.push(tlR);

    // 4 Large 21-inch Wheels (Radius: 0.40m, Width: 0.28m)
    const wheelR = 0.4;
    const wheelW = 0.28;
    [-0.98, 0.98].forEach((wx) => {
      [1.48, -1.48].forEach((wz) => {
        const w = createWheel(wheelR, wheelW);
        w.position.set(wx, wheelR, wz);
        root.add(w);
        wheels.push(w);
      });
    });
  } else if (category === 'sportscar') {
    // Exotic Mid-Engine Supercar
    // Length: 4.58m, Width: 2.12m, Height: 1.22m
    const bodyGroup = new THREE.Group();
    root.add(bodyGroup);

    // Ultra-low slung wedge body
    const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(2.08, 0.38, 4.55), paintMat);
    lowerBody.position.set(0, 0.32, 0);
    lowerBody.castShadow = true;
    bodyGroup.add(lowerBody);

    // Sloped aerodynamic nose with front hood intake vents
    const nose = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.22, 1.45), paintMat);
    nose.position.set(0, 0.48, 1.35);
    nose.rotation.x = 0.14;
    nose.castShadow = true;
    bodyGroup.add(nose);

    // Sleek cockpit dome
    const cockpit = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.52, 1.8), glassMat);
    cockpit.position.set(0, 0.84, 0.05);
    bodyGroup.add(cockpit);

    // Dual Aerodynamic Front Windshield Wipers
    addWiper(bodyGroup, -0.32, 0.65, 0.76, 0.52, 0.38, -0.65, 1.25, 1.15, 0.0);
    addWiper(bodyGroup, 0.20, 0.65, 0.76, 0.52, 0.38, -0.65, 1.25, 1.15, 0.0);

    // Carbon Fiber Rear Wing Spoiler
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x111317, roughness: 0.3 });
    const wing = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.04, 0.32), wingMat);
    wing.position.set(0, 0.92, -2.05);
    wing.castShadow = true;
    bodyGroup.add(wing);

    const wingPostL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.28, 0.06), wingMat);
    wingPostL.position.set(-0.55, 0.78, -2.05);
    bodyGroup.add(wingPostL);

    const wingPostR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.28, 0.06), wingMat);
    wingPostR.position.set(0.55, 0.78, -2.05);
    bodyGroup.add(wingPostR);

    // Angular aggressive headlights
    const hlL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, 0.1), headLightLensMat);
    hlL.position.set(-0.75, 0.42, 2.22);
    hlL.rotation.y = -0.2;
    bodyGroup.add(hlL);
    headLights.push(hlL);

    const hlR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, 0.1), headLightLensMat);
    hlR.position.set(0.75, 0.42, 2.22);
    hlR.rotation.y = 0.2;
    bodyGroup.add(hlR);
    headLights.push(hlR);

    // Full-width continuous LED rear lightbar
    const tl = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.05), tailLightOffMat);
    tl.position.set(0, 0.55, -2.28);
    bodyGroup.add(tl);
    tailLights.push(tl);

    // 4 Wide Track Low-Profile Racing Wheels (Radius: 0.33m, Width: 0.3m rear, 0.25m front)
    const wheelR = 0.33;
    [-0.98, 0.98].forEach((wx) => {
      const wf = createWheel(wheelR, 0.25);
      wf.position.set(wx, wheelR, 1.35);
      root.add(wf);
      wheels.push(wf);

      const wr = createWheel(wheelR, 0.32);
      wr.position.set(wx, wheelR, -1.35);
      root.add(wr);
      wheels.push(wr);
    });
  } else if (category === 'bus') {
    // Authentic Tamil Nadu State Transport Corporation (TNSTC) & MTC Bus
    // Length: 11.6m, Width: 2.55m, Height: 3.45m
    const bodyGroup = new THREE.Group();
    root.add(bodyGroup);

    // Tamil Nadu State Transport Bus Varieties (TNSTC & SETC Divisions):
    const busStyles = [
      { lowerColor: 0x15803d, upperColor: 0xf8fafc, stripeColor: 0x166534, type: 'mofussil' as const, route: '123', tFrom: 'சென்னை', tTo: 'மதுரை', eFrom: 'CHENNAI', eTo: 'MADURAI' },
      { lowerColor: 0x059669, upperColor: 0xfef08a, stripeColor: 0x047857, type: 'town' as const, route: '7A', tFrom: 'மதுரை பெரியார்', tTo: 'திருப்பரங்குன்றம்', eFrom: 'MADURAI PERIYAR', eTo: 'THIRUPPARANKUNDRAM' },
      { lowerColor: 0x0284c7, upperColor: 0xf1f5f9, stripeColor: 0x0369a1, type: 'city' as const, route: '29C', tFrom: 'பெரம்பூர்', tTo: 'பெசன்ட் நகர்', eFrom: 'PERAMBUR', eTo: 'BESANT NAGAR' },
      { lowerColor: 0x881337, upperColor: 0xfef08a, stripeColor: 0xf59e0b, type: 'setc' as const, route: '777', tFrom: 'சென்னை', tTo: 'திருநெல்வேலி', eFrom: 'CHENNAI', eTo: 'TIRUNELVELI' },
      { lowerColor: 0x1d4ed8, upperColor: 0xfef9c3, stripeColor: 0x1e40af, type: 'mofussil' as const, route: '3C', tFrom: 'கோயம்புத்தூர்', tTo: 'ஈரோடு', eFrom: 'COIMBATORE', eTo: 'ERODE' },
      { lowerColor: 0x991b1b, upperColor: 0xf8fafc, stripeColor: 0x7f1d1d, type: 'town' as const, route: '45A', tFrom: 'திருச்சி', tTo: 'தஞ்சாவூர்', eFrom: 'TRICHY', eTo: 'THANJAVUR' },
      { lowerColor: 0x0f766e, upperColor: 0xfef08a, stripeColor: 0x115e59, type: 'mofussil' as const, route: '55', tFrom: 'சேலம்', tTo: 'வேலூர்', eFrom: 'SALEM', eTo: 'VELLORE' },
    ];
    const busTypeIndex = Math.floor(Math.random() * busStyles.length);
    const busConfig = busStyles[busTypeIndex];

    const busLowerMat = new THREE.MeshStandardMaterial({ color: busConfig.lowerColor, roughness: 0.4 });
    const busUpperMat = new THREE.MeshStandardMaterial({ color: busConfig.upperColor, roughness: 0.35 });
    const busStripeMat = new THREE.MeshStandardMaterial({ color: busConfig.stripeColor, roughness: 0.3 });

    // Lower Bus Chassis & Skirt
    const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(2.55, 1.4, 11.5), busLowerMat);
    lowerBody.position.set(0, 1.15, 0);
    lowerBody.castShadow = true;
    bodyGroup.add(lowerBody);

    // Decorative TNSTC Waistline Livery Stripe
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.57, 0.22, 11.52), busStripeMat);
    stripe.position.set(0, 1.82, 0);
    bodyGroup.add(stripe);

    // Upper Passenger Cabin Window Frame
    const upperBody = new THREE.Mesh(new THREE.BoxGeometry(2.54, 1.4, 11.5), busUpperMat);
    upperBody.position.set(0, 2.55, 0);
    upperBody.castShadow = true;
    bodyGroup.add(upperBody);

    // Visible Passenger Interior: Seating & Handrail Poles
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.8 });
    const handrailMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9, roughness: 0.15 });

    // Driver Seat & Dashboard
    const driverSeat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.5), seatMat);
    driverSeat.position.set(0.75, 1.9, 4.6);
    bodyGroup.add(driverSeat);

    const steerWheel = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.024, 8, 16), interiorMat);
    steerWheel.position.set(0.75, 2.2, 5.1);
    steerWheel.rotation.x = -0.65;
    bodyGroup.add(steerWheel);

    // Rows of Passenger Double Seats
    for (let row = -4; row <= 3.5; row += 1.1) {
      if (Math.abs(row - 4.2) < 0.5 || Math.abs(row - -4.2) < 0.5) continue; // Door clearance
      // Left double seat
      const seatL = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.65, 0.45), seatMat);
      seatL.position.set(-0.75, 1.95, row);
      bodyGroup.add(seatL);

      // Right double seat
      const seatR = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.65, 0.45), seatMat);
      seatR.position.set(0.75, 1.95, row);
      bodyGroup.add(seatR);
    }

    // Overhead Stainless Steel Passenger Handrails (Ceiling grab poles)
    [-0.32, 0.32].forEach((hx) => {
      const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 9.6, 8), handrailMat);
      rail.rotateX(Math.PI / 2);
      rail.position.set(hx, 2.95, -0.4);
      bodyGroup.add(rail);
    });

    // Large Sliding Passenger Windows with Aluminum Frames
    const winStripL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.05, 9.4), glassMat);
    winStripL.position.set(-1.28, 2.55, -0.4);
    bodyGroup.add(winStripL);

    const winStripR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.05, 7.8), glassMat);
    winStripR.position.set(1.28, 2.55, -1.2);
    bodyGroup.add(winStripR);

    // Left-Side Passenger Entry & Exit Doors (Tamil Nadu buses have left-side entrance and exit steps)
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.4 });
    [4.2, -4.2].forEach((dz) => {
      const door = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.1, 0.95), doorMat);
      door.position.set(1.28, 1.55, dz);
      bodyGroup.add(door);
    });

    // Split Front Windshield with Rubber Divider
    const frontWindshield = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.45, 0.08), glassMat);
    frontWindshield.position.set(0, 2.45, 5.75);
    frontWindshield.rotation.x = 0.10;
    bodyGroup.add(frontWindshield);

    const windshieldDivider = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.48, 0.1), secondaryTrimMat);
    windshieldDivider.position.set(0, 2.45, 5.76);
    windshieldDivider.rotation.x = 0.10;
    bodyGroup.add(windshieldDivider);

    // Dual Heavy-Duty Commercial Bus Windshield Wipers
    addWiper(bodyGroup, -0.65, 1.82, 5.76, 0.10, 0.68, -0.68, 1.35, 0.92, 0.0);
    addWiper(bodyGroup, 0.65, 1.82, 5.76, 0.10, 0.68, -0.68, 1.35, 0.92, 0.0);

    // Authentic Bilingual Tamil/English Destination Board
    const destTex = createTamilBusDestinationTexture(
      busConfig.route,
      busConfig.tFrom,
      busConfig.tTo,
      busConfig.eFrom,
      busConfig.eTo,
      busConfig.type
    );
    const destSign = new THREE.Mesh(
      new THREE.BoxGeometry(1.9, 0.45, 0.08),
      new THREE.MeshBasicMaterial({ map: destTex })
    );
    destSign.position.set(0, 3.32, 5.78);
    bodyGroup.add(destSign);

    // Rear Destination Board
    const rearDestSign = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.35, 0.08),
      new THREE.MeshBasicMaterial({ map: destTex })
    );
    rearDestSign.position.set(0, 2.8, -5.78);
    bodyGroup.add(rearDestSign);

    // Roof Luggage Carrier & Rear Metal Access Ladder (Classic TNSTC highway bus feature)
    const carrierMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.85 });
    const luggageRack = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.28, 5.6), carrierMat);
    luggageRack.position.set(0, 3.42, -1.2);
    bodyGroup.add(luggageRack);

    const ladder = new THREE.Mesh(new THREE.BoxGeometry(0.38, 2.6, 0.05), carrierMat);
    ladder.position.set(0.95, 2.0, -5.78);
    bodyGroup.add(ladder);

    // Dual Roof Air Horn Trumpets
    const hornTrumpet1 = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.02, 0.48, 10), chromeMat);
    hornTrumpet1.rotateX(Math.PI / 2);
    hornTrumpet1.position.set(-0.35, 3.42, 5.2);
    bodyGroup.add(hornTrumpet1);

    const hornTrumpet2 = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.02, 0.48, 10), chromeMat);
    hornTrumpet2.rotateX(Math.PI / 2);
    hornTrumpet2.position.set(-0.52, 3.42, 5.2);
    bodyGroup.add(hornTrumpet2);

    // Commercial Headlights & Taillights
    const hlL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.08), headLightLensMat);
    hlL.position.set(-0.95, 0.85, 5.8);
    bodyGroup.add(hlL);
    headLights.push(hlL);

    const hlR = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.08), headLightLensMat);
    hlR.position.set(0.95, 0.85, 5.8);
    bodyGroup.add(hlR);
    headLights.push(hlR);

    const tlL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.45, 0.08), tailLightOffMat);
    tlL.position.set(-1.0, 1.2, -5.81);
    bodyGroup.add(tlL);
    tailLights.push(tlL);

    const tlR = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.45, 0.08), tailLightOffMat);
    tlR.position.set(1.0, 1.2, -5.81);
    bodyGroup.add(tlR);
    tailLights.push(tlR);

    // 6 Heavy Commercial Wheels (Front axle + Dual rear tandem axles)
    const wheelR = 0.5;
    const wheelW = 0.32;
    [-1.15, 1.15].forEach((wx) => {
      // Front steer axle
      const wf = createWheel(wheelR, wheelW);
      wf.position.set(wx, wheelR, 4.2);
      root.add(wf);
      wheels.push(wf);

      // Rear drive axle 1
      const wr1 = createWheel(wheelR, wheelW);
      wr1.position.set(wx, wheelR, -3.4);
      root.add(wr1);
      wheels.push(wr1);

      // Rear tag axle 2
      const wr2 = createWheel(wheelR, wheelW);
      wr2.position.set(wx, wheelR, -4.7);
      root.add(wr2);
      wheels.push(wr2);
    });
  } else if (category === 'truck') {
    // Heavy Freight Semi-Truck & Trailer
    // Length: 14.8m, Width: 2.6m, Height: 3.85m
    const bodyGroup = new THREE.Group();
    root.add(bodyGroup);

    // Semi Tractor Cab
    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.55, 2.8, 2.6), paintMat);
    cab.position.set(0, 1.85, 4.8);
    cab.castShadow = true;
    bodyGroup.add(cab);

    // Front Sloped Windshield & Dual Heavy-Duty Wipers
    const frontWindshield = new THREE.Mesh(new THREE.BoxGeometry(2.35, 1.05, 0.08), glassMat);
    frontWindshield.position.set(0, 2.4, 6.08);
    frontWindshield.rotation.x = 0.08;
    bodyGroup.add(frontWindshield);

    addWiper(bodyGroup, -0.58, 1.95, 6.1, 0.08, 0.58, -0.65, 1.3, 0.9, 0.0);
    addWiper(bodyGroup, 0.58, 1.95, 6.1, 0.08, 0.58, -0.65, 1.3, 0.9, 0.0);

    // Aerodynamic Hood & Massive Chrome Grille
    const hood = new THREE.Mesh(new THREE.BoxGeometry(2.45, 1.4, 2.2), paintMat);
    hood.position.set(0, 1.25, 6.8);
    hood.castShadow = true;
    bodyGroup.add(hood);

    const bigGrille = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.15, 0.12), chromeMat);
    bigGrille.position.set(0, 1.2, 7.92);
    bodyGroup.add(bigGrille);

    // Vertical Dual Chrome Exhaust Stacks
    const stackL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.6, 14), chromeMat);
    stackL.position.set(-1.25, 2.8, 3.5);
    bodyGroup.add(stackL);

    const stackR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.6, 14), chromeMat);
    stackR.position.set(1.25, 2.8, 3.5);
    bodyGroup.add(stackR);

    // Large Refrigerated Freight Cargo Trailer
    const trailerMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.55 });
    const trailer = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.2, 10.2), trailerMat);
    trailer.position.set(0, 2.25, -2.4);
    trailer.castShadow = true;
    bodyGroup.add(trailer);

    // Heavy Front Bumper & Square Headlights
    const hlL = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.18, 0.08), headLightLensMat);
    hlL.position.set(-0.95, 0.72, 7.92);
    bodyGroup.add(hlL);
    headLights.push(hlL);

    const hlR = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.18, 0.08), headLightLensMat);
    hlR.position.set(0.95, 0.72, 7.92);
    bodyGroup.add(hlR);
    headLights.push(hlR);

    const tlL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.06), tailLightOffMat);
    tlL.position.set(-1.0, 0.85, -7.52);
    bodyGroup.add(tlL);
    tailLights.push(tlL);

    const tlR = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.06), tailLightOffMat);
    tlR.position.set(1.0, 0.85, -7.52);
    bodyGroup.add(tlR);
    tailLights.push(tlR);

    // 10 Heavy Commercial Wheels (Tractor front, tandem rear, trailer tandem)
    const wheelR = 0.52;
    const wheelW = 0.35;
    [-1.2, 1.2].forEach((wx) => {
      // Tractor steer
      const w1 = createWheel(wheelR, wheelW);
      w1.position.set(wx, wheelR, 6.6);
      root.add(w1);
      wheels.push(w1);

      // Tractor tandem drive
      const w2 = createWheel(wheelR, wheelW);
      w2.position.set(wx, wheelR, 2.8);
      root.add(w2);
      wheels.push(w2);

      // Trailer tandem axle 1
      const w3 = createWheel(wheelR, wheelW);
      w3.position.set(wx, wheelR, -5.2);
      root.add(w3);
      wheels.push(w3);

      // Trailer tandem axle 2
      const w4 = createWheel(wheelR, wheelW);
      w4.position.set(wx, wheelR, -6.6);
      root.add(w4);
      wheels.push(w4);
    });
  } else if (category === 'autorickshaw') {
    // Classic Indian Auto-Rickshaw (3-Wheeler Tuk-Tuk)
    // Length: 2.65m, Width: 1.32m, Height: 1.72m
    const bodyGroup = new THREE.Group();
    root.add(bodyGroup);

    // Green Lower Metal Cabin
    const rickshawGreen = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.4 });
    const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.55, 2.5), rickshawGreen);
    lowerBody.position.set(0, 0.42, 0);
    lowerBody.castShadow = true;
    bodyGroup.add(lowerBody);

    // Yellow Front Nose Cowling
    const rickshawYellow = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.35 });
    const nose = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.5, 0.95), rickshawYellow);
    nose.position.set(0, 0.65, 0.85);
    nose.rotation.x = 0.22;
    bodyGroup.add(nose);

    // Black Canvas Roof Canopy
    const canvasMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.9 });
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.08, 2.1), canvasMat);
    roof.position.set(0, 1.7, -0.2);
    bodyGroup.add(roof);

    // Thin Metal Canopy Support Struts
    const strutMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });
    const strutGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.0, 8);
    [-0.6, 0.6].forEach((sx) => {
      [-1.1, 0.7].forEach((sz) => {
        const s = new THREE.Mesh(strutGeo, strutMat);
        s.position.set(sx, 1.2, sz);
        bodyGroup.add(s);
      });
    });

    // Glass Windshield
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.55, 0.04), glassMat);
    windshield.position.set(0, 1.25, 0.72);
    windshield.rotation.x = 0.18;
    bodyGroup.add(windshield);

    // Passenger Vinyl Bench Seat
    const bench = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.25, 0.5), interiorMat);
    bench.position.set(0, 0.75, -0.6);
    bodyGroup.add(bench);

    // Front Driver Bucket Seat & Auto Driver
    const driverSeat = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.22, 0.42), interiorMat);
    driverSeat.position.set(0, 0.68, 0.18);
    bodyGroup.add(driverSeat);

    // 3D Auto Rickshaw Driver (Khaki driver shirt + black hair)
    const autoDriver = createCabinDriver(0, 0.68, 0.16, 0xa16207);
    bodyGroup.add(autoDriver);

    // Handlebar & Meter Box in cabin
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
    const autoBar = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.03, 0.03), handleMat);
    autoBar.position.set(0, 1.05, 0.55);
    bodyGroup.add(autoBar);

    const meterBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.12, 0.12),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 })
    );
    meterBox.position.set(0.24, 0.98, 0.56);
    bodyGroup.add(meterBox);

    // Authentic Single Electric Auto-Rickshaw Windshield Wiper
    addWiper(bodyGroup, -0.08, 1.05, 0.74, 0.18, 0.44, -0.55, 1.15, 1.25, 0.0);

    // Rear Mounted Spare Tire
    const spareTire = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.06, 12, 24), tireMat);
    spareTire.position.set(0, 0.75, -1.3);
    bodyGroup.add(spareTire);

    // Circular Chrome Headlamp
    const hl = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 16), headLightLensMat);
    hl.rotateX(Math.PI / 2);
    hl.position.set(0, 0.75, 1.34);
    bodyGroup.add(hl);
    headLights.push(hl);

    // Tail Lights
    const tlL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.04), tailLightOffMat);
    tlL.position.set(-0.45, 0.58, -1.26);
    bodyGroup.add(tlL);
    tailLights.push(tlL);

    const tlR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.04), tailLightOffMat);
    tlR.position.set(0.45, 0.58, -1.26);
    bodyGroup.add(tlR);
    tailLights.push(tlR);

    // 3 Wheels: 1 front center wheel, 2 rear wheels
    const frontW = createWheel(0.24, 0.14);
    frontW.position.set(0, 0.24, 1.05);
    root.add(frontW);
    wheels.push(frontW);

    [-0.58, 0.58].forEach((wx) => {
      const rw = createWheel(0.24, 0.14);
      rw.position.set(wx, 0.24, -0.68);
      root.add(rw);
      wheels.push(rw);
    });
  } else if (category === 'indian_truck') {
    // Iconic Decorated Indian Highway Truck (Tata / Ashok Leyland)
    // Length: 8.8m, Width: 2.5m, Height: 3.4m
    const bodyGroup = new THREE.Group();
    root.add(bodyGroup);

    // Handcrafted Ornate Cabin (Bright Blue / Orange / Yellow)
    const cabMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.5 });
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.3, 2.2), cabMat);
    cabin.position.set(0, 1.65, 2.5);
    cabin.castShadow = true;
    bodyGroup.add(cabin);

    // Split Front Glass Windshield & Dual Heavy-Duty Wipers
    const lorryWindshield = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.95, 0.06), glassMat);
    lorryWindshield.position.set(0, 2.12, 3.61);
    lorryWindshield.rotation.x = 0.06;
    bodyGroup.add(lorryWindshield);

    const windshieldDivider = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.98, 0.08), secondaryTrimMat);
    windshieldDivider.position.set(0, 2.12, 3.62);
    windshieldDivider.rotation.x = 0.06;
    bodyGroup.add(windshieldDivider);

    addWiper(bodyGroup, -0.55, 1.68, 3.63, 0.06, 0.58, -0.65, 1.3, 0.95, 0.0);
    addWiper(bodyGroup, 0.55, 1.68, 3.63, 0.06, 0.58, -0.65, 1.3, 0.95, 0.0);

    // Colorful Tasseled Sun Visor Canopy
    const visorMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.6 });
    const topVisor = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.35, 0.6), visorMat);
    topVisor.position.set(0, 2.85, 3.4);
    bodyGroup.add(topVisor);

    // Wooden High-Sided Cargo Bed
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });
    const cargoBed = new THREE.Mesh(new THREE.BoxGeometry(2.45, 1.8, 5.8), woodMat);
    cargoBed.position.set(0, 1.6, -1.5);
    cargoBed.castShadow = true;
    bodyGroup.add(cargoBed);

    // High Blue Tarpaulin Wrapped Freight
    const tarpMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.7 });
    const tarpLoad = new THREE.Mesh(new THREE.BoxGeometry(2.35, 1.5, 5.6), tarpMat);
    tarpLoad.position.set(0, 2.65, -1.5);
    bodyGroup.add(tarpLoad);

    // Hand-Painted Tamil Nadu Lorry Rear Plaque ("SOUND HORN", "தமிழ் வாழ்க", "கண் பட போகுது")
    const lorryArtTex = createTamilLorryArtTexture();
    const hornSign = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.75, 0.08),
      new THREE.MeshStandardMaterial({ map: lorryArtTex, roughness: 0.5 })
    );
    hornSign.position.set(0, 1.45, -4.42);
    bodyGroup.add(hornSign);

    // Striped Yellow/Black Safety Crash Bumper
    const stripBumper = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.35, 0.18),
      new THREE.MeshStandardMaterial({ color: 0xca8a04 })
    );
    stripBumper.position.set(0, 0.5, -4.42);
    bodyGroup.add(stripBumper);

    // Headlights & Taillights
    const hlL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, 0.08), headLightLensMat);
    hlL.position.set(-0.85, 0.75, 3.62);
    bodyGroup.add(hlL);
    headLights.push(hlL);

    const hlR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, 0.08), headLightLensMat);
    hlR.position.set(0.85, 0.75, 3.62);
    bodyGroup.add(hlR);
    headLights.push(hlR);

    const tlL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 0.06), tailLightOffMat);
    tlL.position.set(-0.85, 0.75, -4.44);
    bodyGroup.add(tlL);
    tailLights.push(tlL);

    const tlR = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 0.06), tailLightOffMat);
    tlR.position.set(0.85, 0.75, -4.44);
    bodyGroup.add(tlR);
    tailLights.push(tlR);

    // 6 Heavy Commercial Wheels
    const wR = 0.5;
    const wW = 0.32;
    [-1.08, 1.08].forEach((wx) => {
      const wf = createWheel(wR, wW);
      wf.position.set(wx, wR, 2.5);
      root.add(wf);
      wheels.push(wf);

      const wr1 = createWheel(wR, wW);
      wr1.position.set(wx, wR, -2.4);
      root.add(wr1);
      wheels.push(wr1);

      const wr2 = createWheel(wR, wW);
      wr2.position.set(wx, wR, -3.6);
      root.add(wr2);
      wheels.push(wr2);
    });
  } else if (category === 'commuter_bike') {
    // 125cc Commuter Motorcycle (Hero Splendor / Bajaj Pulsar style)
    const bikeG = new THREE.Group();
    root.add(bikeG);

    const bMat = new THREE.MeshStandardMaterial({ color: paintColor, roughness: 0.3, metalness: 0.7 });
    // Teardrop fuel tank with knee indents
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.46, 12), bMat);
    tank.rotation.x = Math.PI / 2.2;
    tank.position.set(0, 0.68, 0.18);
    tank.castShadow = true;
    bikeG.add(tank);

    // Chrome Tank Filler Cap
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.02, 10), chromeMat);
    cap.position.set(0, 0.81, 0.22);
    bikeG.add(cap);

    // Long Two-Up Vinyl Seat
    const seat = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.09, 0.68),
      new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 })
    );
    seat.position.set(0, 0.68, -0.26);
    seat.castShadow = true;
    bikeG.add(seat);

    // Cast Engine with Cooling Fin ridges
    const eng = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.25, 0.32),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.35 })
    );
    eng.position.set(0, 0.38, 0.1);
    bikeG.add(eng);

    // Chrome Long Exhaust Muffler with Heat Guard
    const exhaust = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.045, 0.85, 12),
      chromeMat
    );
    exhaust.rotation.x = -Math.PI / 2.1;
    exhaust.position.set(0.16, 0.28, -0.22);
    bikeG.add(exhaust);

    // Chrome Front Crash Guard / Leg Guard Bars
    const guardMat = chromeMat;
    const crashBarL = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.38, 8), guardMat);
    crashBarL.position.set(-0.24, 0.45, 0.32);
    crashBarL.rotation.z = -0.3;
    bikeG.add(crashBarL);

    const crashBarR = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.38, 8), guardMat);
    crashBarR.position.set(0.24, 0.45, 0.32);
    crashBarR.rotation.z = 0.3;
    bikeG.add(crashBarR);

    // High Commuter Handlebars with Rubber Grips & Twin Mirrors
    const handleBar = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.025, 0.025), chromeMat);
    handleBar.position.set(0, 0.88, 0.42);
    bikeG.add(handleBar);

    [-0.28, 0.28].forEach((mx) => {
      // Rearview mirror stalk & circular mirror
      const mirror = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.015, 12), chromeMat);
      mirror.position.set(mx, 1.02, 0.4);
      mirror.rotation.x = 0.2;
      bikeG.add(mirror);
    });

    // Rectangular Headlight & Taillight
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.08), headLightLensMat);
    hl.position.set(0, 0.82, 0.62);
    bikeG.add(hl);
    headLights.push(hl);

    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.04), tailLightOffMat);
    tl.position.set(0, 0.72, -0.66);
    bikeG.add(tl);
    tailLights.push(tl);

    // =========================================================
    // 3D HUMAN COMMUTER RIDER SITTING NATURALLY ON MOTORCYCLE
    // =========================================================
    const riderGroup = new THREE.Group();
    riderGroup.position.set(0, 0.7, -0.12);
    bikeG.add(riderGroup);

    const riderShirtColors = [0x2563eb, 0xd97706, 0xdc2626, 0x16a34a, 0x475569, 0x7c3aed];
    const riderShirtColor = riderShirtColors[Math.floor(Math.random() * riderShirtColors.length)];
    const shirtMat = new THREE.MeshStandardMaterial({ color: riderShirtColor, roughness: 0.7 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 }); // Dark blue jeans
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.9 });
    const helmetMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.3, metalness: 0.6 });

    // Rider Hips & Pelvis on Seat
    const pelvis = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.11, 0.16, 10), pantsMat);
    pelvis.position.y = 0.12;
    pelvis.castShadow = true;
    riderGroup.add(pelvis);

    // Upright Commuter Torso
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.13, 0.46, 12), shirtMat);
    torso.position.set(0, 0.42, 0.04);
    torso.rotation.x = 0.14; // Slight relaxed forward lean
    torso.castShadow = true;
    riderGroup.add(torso);

    // Helmeted Head & Visor
    const riderHead = new THREE.Group();
    riderHead.position.set(0, 0.74, 0.1);
    riderGroup.add(riderHead);

    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 12), helmetMat);
    helmet.scale.set(0.94, 1.05, 1.1);
    helmet.castShadow = true;
    riderHead.add(helmet);

    const visor = new THREE.Mesh(
      new THREE.SphereGeometry(0.122, 12, 10, 0, Math.PI, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.1, metalness: 0.9 })
    );
    visor.rotation.x = -Math.PI / 2.2;
    visor.position.set(0, 0.01, 0.02);
    riderHead.add(visor);

    // Articulated Arms reaching forward to handlebars
    const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.38, 8), shirtMat);
    armL.position.set(-0.19, 0.45, 0.22);
    armL.rotation.x = Math.PI / 3.4;
    armL.rotation.z = -0.15;
    riderGroup.add(armL);

    const handL = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), skinMat);
    handL.position.set(-0.26, 0.26, 0.48);
    riderGroup.add(handL);

    const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.38, 8), shirtMat);
    armR.position.set(0.19, 0.45, 0.22);
    armR.rotation.x = Math.PI / 3.4;
    armR.rotation.z = 0.15;
    riderGroup.add(armR);

    const handR = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), skinMat);
    handR.position.set(0.26, 0.26, 0.48);
    riderGroup.add(handR);

    // Legs bent onto footrests
    const thighL = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.045, 0.34, 8), pantsMat);
    thighL.position.set(-0.14, 0.08, 0.15);
    thighL.rotation.x = -Math.PI / 3.2;
    riderGroup.add(thighL);

    const calfL = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.038, 0.32, 8), pantsMat);
    calfL.position.set(-0.14, -0.18, 0.12);
    riderGroup.add(calfL);

    const footL = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.06, 0.14), shoeMat);
    footL.position.set(-0.14, -0.34, 0.12);
    riderGroup.add(footL);

    const thighR = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.045, 0.34, 8), pantsMat);
    thighR.position.set(0.14, 0.08, 0.15);
    thighR.rotation.x = -Math.PI / 3.2;
    riderGroup.add(thighR);

    const calfR = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.038, 0.32, 8), pantsMat);
    calfR.position.set(0.14, -0.18, 0.12);
    riderGroup.add(calfR);

    const footR = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.06, 0.14), shoeMat);
    footR.position.set(0.14, -0.34, 0.12);
    riderGroup.add(footR);

    // 2 Spoked Commuter Wheels (R = 0.3m, W = 0.08m)
    const wf = createWheel(0.3, 0.08);
    wf.position.set(0, 0.3, 0.68);
    root.add(wf);
    wheels.push(wf);

    const wr = createWheel(0.3, 0.09);
    wr.position.set(0, 0.3, -0.62);
    root.add(wr);
    wheels.push(wr);
  } else if (category === 'hatchback') {
    // Modern Urban Compact Hatchback
    // Length: 4.12m, Width: 1.82m, Height: 1.48m
    const bodyGroup = new THREE.Group();
    root.add(bodyGroup);

    // Lower Sculpted Chassis
    const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.46, 4.1), paintMat);
    lowerBody.position.set(0, 0.44, 0);
    lowerBody.castShadow = true;
    bodyGroup.add(lowerBody);

    // Compact Sloped Hood
    const hood = new THREE.Mesh(new THREE.BoxGeometry(1.74, 0.22, 1.25), paintMat);
    hood.position.set(0, 0.65, 1.15);
    hood.rotation.x = 0.1;
    hood.castShadow = true;
    bodyGroup.add(hood);

    // Sloped Hatchback Greenhouse Cabin
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.64, 0.64, 2.15), glassMat);
    cabin.position.set(0, 1.05, -0.3);
    cabin.castShadow = true;
    bodyGroup.add(cabin);

    // Dual Front Windshield Wipers
    addWiper(bodyGroup, -0.36, 0.82, 0.76, 0.44, 0.40, -0.65, 1.25, 1.1, 0.0);
    addWiper(bodyGroup, 0.20, 0.82, 0.76, 0.44, 0.40, -0.65, 1.25, 1.1, 0.0);

    // Roof & Sporty Rear Lip Spoiler
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.05, 1.7), paintMat);
    roof.position.set(0, 1.38, -0.35);
    bodyGroup.add(roof);

    const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.04, 0.22), secondaryTrimMat);
    spoiler.position.set(0, 1.38, -1.25);
    bodyGroup.add(spoiler);

    // Dashboard, Front Seats & Driver
    const dash = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.26, 0.32), interiorMat);
    dash.position.set(0, 0.86, 0.55);
    bodyGroup.add(dash);

    const seatL = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.58, 0.42), interiorMat);
    seatL.position.set(-0.42, 0.86, 0);
    bodyGroup.add(seatL);

    const seatR = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.58, 0.42), interiorMat);
    seatR.position.set(0.42, 0.86, 0);
    bodyGroup.add(seatR);

    bodyGroup.add(createCabinDriver(-0.42, 0.72, 0.05, 0x16a34a));

    // Front Honeycomb Grille
    const frontGrille = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.22, 0.08), grilleMat);
    frontGrille.position.set(0, 0.46, 2.06);
    bodyGroup.add(frontGrille);

    // Projector Headlights
    const hlGeo = new THREE.BoxGeometry(0.32, 0.12, 0.08);
    const hlL = new THREE.Mesh(hlGeo, headLightLensMat);
    hlL.position.set(-0.66, 0.56, 2.06);
    bodyGroup.add(hlL);
    headLights.push(hlL);

    const hlR = new THREE.Mesh(hlGeo, headLightLensMat);
    hlR.position.set(0.66, 0.56, 2.06);
    bodyGroup.add(hlR);
    headLights.push(hlR);

    // Vertical Modern Hatchback LED Taillights
    const tlGeo = new THREE.BoxGeometry(0.2, 0.36, 0.06);
    const tlL = new THREE.Mesh(tlGeo, tailLightOffMat);
    tlL.position.set(-0.72, 0.78, -2.06);
    bodyGroup.add(tlL);
    tailLights.push(tlL);

    const tlR = new THREE.Mesh(tlGeo, tailLightOffMat);
    tlR.position.set(0.72, 0.78, -2.06);
    bodyGroup.add(tlR);
    tailLights.push(tlR);

    // 4 Wheels (Radius: 0.32m, Width: 0.22m)
    const wheelR = 0.32;
    const wheelW = 0.22;
    [-0.86, 0.86].forEach((wx) => {
      [1.25, -1.25].forEach((wz) => {
        const w = createWheel(wheelR, wheelW);
        w.position.set(wx, wheelR, wz);
        root.add(w);
        wheels.push(w);
      });
    });
  } else if (category === 'van') {
    // Commercial Utility & Passenger Delivery Van
    // Length: 5.15m, Width: 2.04m, Height: 2.15m
    const bodyGroup = new THREE.Group();
    root.add(bodyGroup);

    // High Lower Chassis
    const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.56, 5.1), paintMat);
    lowerBody.position.set(0, 0.55, 0);
    lowerBody.castShadow = true;
    bodyGroup.add(lowerBody);

    // Boxy Tall Van Upper Body Shell
    const upperBody = new THREE.Mesh(new THREE.BoxGeometry(1.98, 1.15, 4.6), paintMat);
    upperBody.position.set(0, 1.38, -0.2);
    upperBody.castShadow = true;
    bodyGroup.add(upperBody);

    // Front Sloped Windshield
    const frontWindshield = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.78, 0.08), glassMat);
    frontWindshield.position.set(0, 1.35, 1.85);
    frontWindshield.rotation.x = 0.24;
    bodyGroup.add(frontWindshield);

    // Dual Front Windshield Wipers
    addWiper(bodyGroup, -0.42, 1.02, 1.92, 0.24, 0.48, -0.65, 1.25, 1.05, 0.0);
    addWiper(bodyGroup, 0.24, 1.02, 1.92, 0.24, 0.48, -0.65, 1.25, 1.05, 0.0);

    // Front Driver & Passenger Side Windows
    const winL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.52, 1.1), glassMat);
    winL.position.set(-0.99, 1.38, 1.1);
    bodyGroup.add(winL);

    const winR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.52, 1.1), glassMat);
    winR.position.set(0.99, 1.38, 1.1);
    bodyGroup.add(winR);

    // Interior Dashboard & Driver
    const dash = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.28, 0.35), interiorMat);
    dash.position.set(0, 0.95, 1.4);
    bodyGroup.add(dash);

    bodyGroup.add(createCabinDriver(-0.5, 0.82, 0.85, 0xd97706));

    // Commercial Front Bumper & Wide Grille
    const frontGrille = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.32, 0.1), grilleMat);
    frontGrille.position.set(0, 0.55, 2.56);
    bodyGroup.add(frontGrille);

    // Commercial Projector Headlights
    const hlGeo = new THREE.BoxGeometry(0.36, 0.18, 0.08);
    const hlL = new THREE.Mesh(hlGeo, headLightLensMat);
    hlL.position.set(-0.78, 0.7, 2.56);
    bodyGroup.add(hlL);
    headLights.push(hlL);

    const hlR = new THREE.Mesh(hlGeo, headLightLensMat);
    hlR.position.set(0.78, 0.7, 2.56);
    bodyGroup.add(hlR);
    headLights.push(hlR);

    // Tall Vertical Commercial Taillights
    const tlGeo = new THREE.BoxGeometry(0.18, 0.55, 0.06);
    const tlL = new THREE.Mesh(tlGeo, tailLightOffMat);
    tlL.position.set(-0.88, 1.05, -2.56);
    bodyGroup.add(tlL);
    tailLights.push(tlL);

    const tlR = new THREE.Mesh(tlGeo, tailLightOffMat);
    tlR.position.set(0.88, 1.05, -2.56);
    bodyGroup.add(tlR);
    tailLights.push(tlR);

    // 4 Commercial Wheels
    const wheelR = 0.38;
    const wheelW = 0.26;
    [-0.94, 0.94].forEach((wx) => {
      [1.48, -1.48].forEach((wz) => {
        const w = createWheel(wheelR, wheelW);
        w.position.set(wx, wheelR, wz);
        root.add(w);
        wheels.push(w);
      });
    });
  } else if (category === 'delivery_tempo') {
    // Authentic Tata Ace / Chhota Hathi Small Commercial Goods Delivery Tempo
    // Length: 3.8m, Width: 1.55m, Height: 1.9m
    const bodyGroup = new THREE.Group();
    root.add(bodyGroup);

    const cabMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 }); // Classic white commercial cab
    const bedMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.6 }); // Royal blue metal cargo bed
    const crateMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 }); // Wooden produce crates
    const yellowBumperMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.5 });

    // Front Forward-Control Cab
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.4, 1.3), cabMat);
    cabin.position.set(0, 1.1, 1.15);
    cabin.castShadow = true;
    bodyGroup.add(cabin);

    // Front Windshield
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.65, 0.05), glassMat);
    windshield.position.set(0, 1.35, 1.81);
    windshield.rotation.x = 0.12;
    bodyGroup.add(windshield);

    // Dual Commercial Front Windshield Wipers
    addWiper(bodyGroup, -0.32, 1.06, 1.84, 0.12, 0.42, -0.65, 1.25, 1.15, 0.0);
    addWiper(bodyGroup, 0.22, 1.06, 1.84, 0.12, 0.42, -0.65, 1.25, 1.15, 0.0);

    // Cab Driver
    bodyGroup.add(createCabinDriver(-0.35, 0.82, 1.05, 0x16a34a));

    // Commercial Front Bumper
    const fvBumper = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.22, 0.12), yellowBumperMat);
    fvBumper.position.set(0, 0.45, 1.82);
    bodyGroup.add(fvBumper);

    // Rear Open Cargo Bed
    const cargoBed = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.75, 2.3), bedMat);
    cargoBed.position.set(0, 0.82, -0.65);
    cargoBed.castShadow = true;
    bodyGroup.add(cargoBed);

    // Cargo Load: Stacked Wooden Crates & Gunny Sacks of Coconuts
    const load1 = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.65, 1.0), crateMat);
    load1.position.set(0, 1.35, -0.4);
    bodyGroup.add(load1);

    const tarpMat = new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.7 });
    const load2 = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.75, 0.95), tarpMat);
    load2.position.set(0, 1.4, -1.25);
    bodyGroup.add(load2);

    // Headlights (Dual round headlights)
    const hlL = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.06, 12), headLightLensMat);
    hlL.rotateX(Math.PI / 2);
    hlL.position.set(-0.52, 0.65, 1.82);
    bodyGroup.add(hlL);
    headLights.push(hlL);

    const hlR = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.06, 12), headLightLensMat);
    hlR.rotateX(Math.PI / 2);
    hlR.position.set(0.52, 0.65, 1.82);
    bodyGroup.add(hlR);
    headLights.push(hlR);

    // Taillights
    const tlL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.04), tailLightOffMat);
    tlL.position.set(-0.6, 0.52, -1.82);
    bodyGroup.add(tlL);
    tailLights.push(tlL);

    const tlR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.04), tailLightOffMat);
    tlR.position.set(0.6, 0.52, -1.82);
    bodyGroup.add(tlR);
    tailLights.push(tlR);

    // 4 Small Commercial Wheels
    const wR = 0.28;
    const wW = 0.16;
    [-0.72, 0.72].forEach((wx) => {
      [1.15, -0.95].forEach((wz) => {
        const w = createWheel(wR, wW);
        w.position.set(wx, wR, wz);
        root.add(w);
        wheels.push(w);
      });
    });
  } else if (category === 'scooter') {
    // Iconic Tamil Nadu Family Scooter (Honda Activa / TVS Jupiter style)
    // Length: 1.85m, Width: 0.70m, Height: 1.15m
    const scGroup = new THREE.Group();
    root.add(scGroup);

    const scMat = new THREE.MeshStandardMaterial({ color: paintColor, roughness: 0.35, metalness: 0.4 });
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.85 });

    // Curved Front Legshield Apron
    const apron = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.65, 0.22), scMat);
    apron.position.set(0, 0.55, 0.45);
    apron.rotation.x = -0.15;
    apron.castShadow = true;
    scGroup.add(apron);

    // Flat Footboard
    const floorboard = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.08, 0.45), secondaryTrimMat);
    floorboard.position.set(0, 0.24, 0.1);
    scGroup.add(floorboard);

    // Rear Body & Contoured Dual Seat
    const rearBody = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.42, 0.75), scMat);
    rearBody.position.set(0, 0.46, -0.35);
    rearBody.castShadow = true;
    scGroup.add(rearBody);

    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.68), seatMat);
    seat.position.set(0, 0.72, -0.32);
    scGroup.add(seat);

    // Chrome Rear Grab Handle
    const grab = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.016, 8, 12, Math.PI), chromeMat);
    grab.position.set(0, 0.76, -0.68);
    grab.rotation.x = -Math.PI / 2;
    scGroup.add(grab);

    // Handlebar & Headlamp Cowl
    const barCowl = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.14, 0.16), scMat);
    barCowl.position.set(0, 0.95, 0.38);
    scGroup.add(barCowl);

    // Single Bright Diamond Cut Headlight
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.06), headLightLensMat);
    hl.position.set(0, 0.95, 0.47);
    scGroup.add(hl);
    headLights.push(hl);

    // Rear Integrated Taillight
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.05), tailLightOffMat);
    tl.position.set(0, 0.52, -0.74);
    scGroup.add(tl);
    tailLights.push(tl);

    // Seated Commuter Rider
    const riderG = new THREE.Group();
    riderG.position.set(0, 0.72, -0.15);
    scGroup.add(riderG);

    const riderShirtMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.7 });
    const riderPantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });

    const rTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 0.45, 10), riderShirtMat);
    rTorso.position.set(0, 0.38, 0);
    riderG.add(rTorso);

    const rHead = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), new THREE.MeshStandardMaterial({ color: 0x09090b }));
    rHead.position.set(0, 0.68, 0.02);
    riderG.add(rHead);

    // 2 Small Scooter Wheels (R = 0.22m)
    const wf = createWheel(0.22, 0.09);
    wf.position.set(0, 0.22, 0.62);
    root.add(wf);
    wheels.push(wf);

    const wr = createWheel(0.22, 0.09);
    wr.position.set(0, 0.22, -0.58);
    root.add(wr);
    wheels.push(wr);
  }

  // =============================================================
  // DYNAMIC VEHICLE LIGHTING: ROAD LIGHT CONES & TAILLIGHT FLARES
  // =============================================================
  let bumperFrontZ = 2.45;
  let bumperRearZ = -2.44;
  let vehicleWidth = 1.95;
  let lightingCategory: 'car' | 'bike' | 'truck' | 'rickshaw' | 'bus' = 'car';

  if (category === 'sedan' || category === 'police') {
    bumperFrontZ = 2.45;
    bumperRearZ = -2.43;
    vehicleWidth = 1.94;
  } else if (category === 'suv') {
    bumperFrontZ = 2.5;
    bumperRearZ = -2.5;
    vehicleWidth = 2.05;
  } else if (category === 'sportscar') {
    bumperFrontZ = 2.24;
    bumperRearZ = -2.28;
    vehicleWidth = 2.08;
  } else if (category === 'hatchback') {
    bumperFrontZ = 2.08;
    bumperRearZ = -2.08;
    vehicleWidth = 1.82;
  } else if (category === 'van') {
    bumperFrontZ = 2.58;
    bumperRearZ = -2.58;
    vehicleWidth = 2.05;
  } else if (category === 'delivery_tempo') {
    bumperFrontZ = 1.84;
    bumperRearZ = -1.84;
    vehicleWidth = 1.55;
    lightingCategory = 'car';
  } else if (category === 'bus') {
    bumperFrontZ = 5.82;
    bumperRearZ = -5.82;
    vehicleWidth = 2.55;
    lightingCategory = 'bus';
  } else if (category === 'truck') {
    bumperFrontZ = 7.94;
    bumperRearZ = -7.54;
    vehicleWidth = 2.6;
    lightingCategory = 'truck';
  } else if (category === 'autorickshaw') {
    bumperFrontZ = 1.36;
    bumperRearZ = -1.28;
    vehicleWidth = 1.32;
    lightingCategory = 'rickshaw';
  } else if (category === 'indian_truck') {
    bumperFrontZ = 3.66;
    bumperRearZ = -4.45;
    vehicleWidth = 2.45;
    lightingCategory = 'truck';
  } else if (category === 'commuter_bike' || category === 'scooter') {
    bumperFrontZ = 0.7;
    bumperRearZ = -0.68;
    vehicleWidth = 0.65;
    lightingCategory = 'bike';
  }

  const taillightPositions = tailLights.map((tl) => {
    return {
      x: tl.position.x,
      y: tl.position.y,
      z: tl.position.z,
    };
  });

  const lighting = attachVehicleLighting(root, {
    vehicleType: lightingCategory,
    bumperFrontZ,
    bumperRearZ,
    width: vehicleWidth,
    taillightPositions:
      taillightPositions.length > 0 ? taillightPositions : [{ x: 0, y: 0.65, z: bumperRearZ }],
  });

  let isBrakingActive = false;

  // Active brake light toggle with dynamic emissive texture flaring
  const setBrakeLights = (active: boolean) => {
    isBrakingActive = active;
    tailLights.forEach((tl) => {
      const mat = tl.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.map = active ? taillightBrakeTex : taillightRunningTex;
        mat.emissiveMap = active ? taillightBrakeTex : taillightRunningTex;
        mat.emissive.setHex(active ? 0xff2222 : 0x991111);
        mat.emissiveIntensity = active ? 4.8 : 0.6;
        mat.needsUpdate = true;
      }
    });
  };

  let wiperTime = 0;

  // Real-time Wheel Rotation, Suspension, Windshield Wipers & Dynamic Lighting Animation
  const updateAnimation = (speed: number, delta: number, isRaining = false) => {
    const rotSpeed = (speed / 3.6 / 0.35) * delta;
    wheels.forEach((w) => {
      w.rotation.x += rotSpeed;
    });
    lighting.setBraking(isBrakingActive, delta);

    // Dynamic Windshield Wiper Simulation for NPC Vehicles
    if (wipers.length > 0) {
      if (isRaining) {
        wiperTime += delta * 4.4; // Realistic ~1.4 Hz rain sweep cadence
        wipers.forEach((w) => {
          const phase = wiperTime * w.speed + w.phaseOffset;
          // Harmonic wiper sweep: 0 is resting baseline, 1 is peak of arc
          const wipeFactor = (Math.sin(phase - Math.PI / 2) + 1) * 0.5;
          w.pivot.rotation.z = w.restAngle + wipeFactor * w.sweepAngle;
        });
      } else {
        // When dry, smoothly park wipers back at the windshield resting position
        wipers.forEach((w) => {
          w.pivot.rotation.z = THREE.MathUtils.lerp(w.pivot.rotation.z, w.restAngle, delta * 3.5);
        });
      }
    }
  };

  const dispose = () => {
    lighting.dispose();
    tireTex.dispose();
    grilleTex.dispose();
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
    category,
    wheels,
    tailLights,
    headLights,
    strobeL,
    strobeR,
    lighting,
    setBrakeLights,
    updateAnimation,
    updateLighting: (timeOfDay: TimeOfDay, weather: WeatherType) => {
      lighting.updateDayNightAndWeather(timeOfDay, weather);
    },
    dispose,
  };
}

export interface TrafficCarInstance {
  group: THREE.Group;
  tailLightMesh: THREE.Mesh;
  type: 'sedan' | 'suv' | 'truck';
  lane: number;
  trackProgress: number;
  speed: number;
  brakeLight: (on: boolean) => void;
  updateWheels: (delta: number, isRaining?: boolean) => void;
  updateLighting?: (timeOfDay: TimeOfDay, weather: WeatherType) => void;
  dispose: () => void;
}

export function createTrafficCar(type: 'sedan' | 'suv' | 'truck' = 'sedan'): TrafficCarInstance {
  const built = buildRealisticVehicle(type);
  const tailLightMesh = built.tailLights[0] || new THREE.Mesh();
  return {
    group: built.group,
    tailLightMesh,
    type,
    lane: 0,
    trackProgress: 0,
    speed: 75 + Math.random() * 20,
    brakeLight: (on: boolean) => built.setBrakeLights(on),
    updateWheels: (delta: number, isRaining?: boolean) => built.updateAnimation(75, delta, isRaining),
    updateLighting: (timeOfDay: TimeOfDay, weather: WeatherType) =>
      built.updateLighting?.(timeOfDay, weather),
    dispose: () => built.dispose(),
  };
}
