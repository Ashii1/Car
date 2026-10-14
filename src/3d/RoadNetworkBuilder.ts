import * as THREE from 'three';
import { WorldObstacle, StuntRamp } from './CityWorldBuilder';
import {
  createTamilBusStopShelter,
  createTamilCoconutTree,
  createTamilBananaTree,
} from './TamilNaduAssets';

export interface RoadNetworkInstance {
  group: THREE.Group;
  streetLamps: THREE.PointLight[];
  stuntRamps: StuntRamp[];
}

/**
 * Creates high-resolution procedural City Avenue asphalt textures
 * with crisp double-yellow dividers, white dashed lane markings, and reflective cat's eye road studs.
 * Supports both North-South and East-West lane striping orientations.
 */
export function createComprehensiveCityRoadTexture(orientation: 'NS' | 'EW' = 'NS'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // 1. Bitumen Base with micro-aggregate grain
  ctx.fillStyle = '#1e222a';
  ctx.fillRect(0, 0, 1024, 1024);

  // Aggregate Noise
  for (let i = 0; i < 24000; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    ctx.fillStyle = Math.random() > 0.5 ? '#2b3340' : '#14171e';
    ctx.fillRect(x, y, 1, 1);
  }

  if (orientation === 'NS') {
    // Center double solid yellow dividers
    ctx.fillStyle = '#facc15';
    ctx.fillRect(504, 0, 6, 1024);
    ctx.fillRect(514, 0, 6, 1024);

    // Amber reflective cat's eyes between yellow lines
    for (let y = 16; y < 1024; y += 64) {
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(509, y, 6, 6);
      ctx.fillStyle = 'rgba(254, 240, 138, 0.4)';
      ctx.fillRect(507, y - 2, 10, 10);
    }

    // White dashed lane dividers (inner and outer lanes)
    ctx.fillStyle = '#f1f5f9';
    const laneOffsets = [280, 744];
    for (const lx of laneOffsets) {
      for (let y = 0; y < 1024; y += 128) {
        ctx.fillRect(lx, y + 20, 6, 88);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(lx + 1, y + 112, 4, 4);
        ctx.fillStyle = '#f1f5f9';
      }
    }

    // Solid white shoulder lines
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(48, 0, 8, 1024);
    ctx.fillRect(968, 0, 8, 1024);
  } else {
    // East-West striping (lines run horizontally along X)
    ctx.fillStyle = '#facc15';
    ctx.fillRect(0, 504, 1024, 6);
    ctx.fillRect(0, 514, 1024, 6);

    // Amber reflective cat's eyes
    for (let x = 16; x < 1024; x += 64) {
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(x, 509, 6, 6);
      ctx.fillStyle = 'rgba(254, 240, 138, 0.4)';
      ctx.fillRect(x - 2, 507, 10, 10);
    }

    // White dashed lane dividers
    ctx.fillStyle = '#f1f5f9';
    const laneOffsets = [280, 744];
    for (const ly of laneOffsets) {
      for (let x = 0; x < 1024; x += 128) {
        ctx.fillRect(x + 20, ly, 88, 6);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 112, ly + 1, 4, 4);
        ctx.fillStyle = '#f1f5f9';
      }
    }

    // Solid white shoulder lines
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 48, 1024, 8);
    ctx.fillRect(0, 968, 1024, 8);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 16;
  return tex;
}

/**
 * Builds the complete interconnected, zero-dead-end road network covering the entire playable city
 * (-720 to +720 X, -850 to +2380 Z) with sidewalks, safety curbs, traffic signals, streetlights,
 * bus stops, speed breakers, guardrails, and street furniture.
 */
export function buildComprehensiveRoadNetwork(
  worldGroup: THREE.Group,
  obstacles: WorldObstacle[],
  _hwyMat: THREE.Material
): RoadNetworkInstance {
  const roadGroup = new THREE.Group();
  worldGroup.add(roadGroup);

  const streetLamps: THREE.PointLight[] = [];
  const stuntRamps: StuntRamp[] = [];

  // Dedicated Road Asphalt Materials
  const cityRoadTexNS = createComprehensiveCityRoadTexture('NS');
  cityRoadTexNS.repeat.set(1, 16);
  const cityRoadMatNS = new THREE.MeshStandardMaterial({
    map: cityRoadTexNS,
    roughness: 0.82,
    metalness: 0.12,
  });

  const cityRoadTexEW = createComprehensiveCityRoadTexture('EW');
  cityRoadTexEW.repeat.set(16, 1);
  const cityRoadMatEW = new THREE.MeshStandardMaterial({
    map: cityRoadTexEW,
    roughness: 0.82,
    metalness: 0.12,
  });

  // Sidewalk, Curb & Hardware Materials
  const sidewalkMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.9,
  });
  const curbYellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.6 });
  const curbBlackMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.6 });
  const concreteMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.8 });
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.3 });
  const guardMat = new THREE.MeshStandardMaterial({ color: 0xcfd4dc, metalness: 0.85, roughness: 0.25 });
  const zebraMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
  const naaliCoverMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 });
  const manholeMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.9, roughness: 0.35 });
  const hydrantMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.7, roughness: 0.3 });

  // Speed Breaker Material
  const sbCanvas = document.createElement('canvas');
  sbCanvas.width = 256;
  sbCanvas.height = 64;
  const sbCtx = sbCanvas.getContext('2d')!;
  sbCtx.fillStyle = '#1e222a';
  sbCtx.fillRect(0, 0, 256, 64);
  for (let x = 0; x < 256; x += 32) {
    sbCtx.fillStyle = '#facc15';
    sbCtx.beginPath();
    sbCtx.moveTo(x, 0);
    sbCtx.lineTo(x + 20, 0);
    sbCtx.lineTo(x + 10, 64);
    sbCtx.lineTo(x - 10, 64);
    sbCtx.closePath();
    sbCtx.fill();
  }
  const sbTex = new THREE.CanvasTexture(sbCanvas);
  sbTex.wrapS = THREE.RepeatWrapping;
  sbTex.wrapT = THREE.RepeatWrapping;
  sbTex.repeat.set(4, 1);
  const speedBreakerMat = new THREE.MeshStandardMaterial({ map: sbTex, roughness: 0.85 });

  // Helper to add an East-West Road
  const addEastWestRoad = (
    z: number,
    minX: number,
    maxX: number,
    width = 16.0,
    hasSidewalks = true
  ) => {
    const length = maxX - minX;
    const midX = (minX + maxX) / 2;

    const roadGeo = new THREE.PlaneGeometry(length, width);
    roadGeo.rotateX(-Math.PI / 2);
    const road = new THREE.Mesh(roadGeo, cityRoadMatEW);
    road.position.set(midX, 0.015, z);
    road.receiveShadow = true;
    roadGroup.add(road);

    if (hasSidewalks) {
      const swWidth = 2.8;
      const swHeight = 0.22;

      // North Sidewalk
      const swNorth = new THREE.Mesh(new THREE.BoxGeometry(length, swHeight, swWidth), sidewalkMat);
      swNorth.position.set(midX, swHeight / 2, z - width / 2 - swWidth / 2);
      swNorth.receiveShadow = true;
      roadGroup.add(swNorth);

      // South Sidewalk
      const swSouth = new THREE.Mesh(new THREE.BoxGeometry(length, swHeight, swWidth), sidewalkMat);
      swSouth.position.set(midX, swHeight / 2, z + width / 2 + swWidth / 2);
      swSouth.receiveShadow = true;
      roadGroup.add(swSouth);

      // Alternating Yellow/Black safety curbs along road edges
      for (let x = minX + 5; x <= maxX - 5; x += 4.0) {
        const isYellow = Math.floor(x / 4.0) % 2 === 0;
        const cMat = isYellow ? curbYellowMat : curbBlackMat;

        const curbN = new THREE.Mesh(new THREE.BoxGeometry(3.9, 0.24, 0.25), cMat);
        curbN.position.set(x, 0.12, z - width / 2 - 0.12);
        roadGroup.add(curbN);

        const curbS = new THREE.Mesh(new THREE.BoxGeometry(3.9, 0.24, 0.25), cMat);
        curbS.position.set(x, 0.12, z + width / 2 + 0.12);
        roadGroup.add(curbS);
      }

      // Manholes and Drainage naali grates along East-West curbs
      for (let x = minX + 25; x <= maxX - 25; x += 65) {
        const manhole = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.02, 16), manholeMat);
        manhole.position.set(x, 0.025, z + (x % 2 === 0 ? 3.5 : -3.5));
        roadGroup.add(manhole);

        const naaliL = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 0.4), naaliCoverMat);
        naaliL.position.set(x + 12, 0.03, z - width / 2 + 0.25);
        roadGroup.add(naaliL);

        // Fire Hydrant on sidewalk
        if (Math.abs(x) % 130 < 20) {
          const hydrant = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.75, 10), hydrantMat);
          hydrant.position.set(x, 0.48, z - width / 2 - 1.2);
          roadGroup.add(hydrant);
        }
      }
    }
  };

  // Helper to add a North-South Road
  const addNorthSouthRoad = (
    x: number,
    minZ: number,
    maxZ: number,
    width = 16.0,
    hasSidewalks = true
  ) => {
    const length = maxZ - minZ;
    const midZ = (minZ + maxZ) / 2;

    const roadGeo = new THREE.PlaneGeometry(width, length);
    roadGeo.rotateX(-Math.PI / 2);
    const road = new THREE.Mesh(roadGeo, cityRoadMatNS);
    road.position.set(x, 0.016, midZ);
    road.receiveShadow = true;
    roadGroup.add(road);

    if (hasSidewalks) {
      const swWidth = 2.8;
      const swHeight = 0.22;

      // West Sidewalk
      const swWest = new THREE.Mesh(new THREE.BoxGeometry(swWidth, swHeight, length), sidewalkMat);
      swWest.position.set(x - width / 2 - swWidth / 2, swHeight / 2, midZ);
      swWest.receiveShadow = true;
      roadGroup.add(swWest);

      // East Sidewalk
      const swEast = new THREE.Mesh(new THREE.BoxGeometry(swWidth, swHeight, length), sidewalkMat);
      swEast.position.set(x + width / 2 + swWidth / 2, swHeight / 2, midZ);
      swEast.receiveShadow = true;
      roadGroup.add(swEast);

      // Safety curbs along North-South edges
      for (let z = minZ + 5; z <= maxZ - 5; z += 4.0) {
        const isYellow = Math.floor(z / 4.0) % 2 === 0;
        const cMat = isYellow ? curbYellowMat : curbBlackMat;

        const curbW = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.24, 3.9), cMat);
        curbW.position.set(x - width / 2 - 0.12, 0.12, z);
        roadGroup.add(curbW);

        const curbE = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.24, 3.9), cMat);
        curbE.position.set(x + width / 2 + 0.12, 0.12, z);
        roadGroup.add(curbE);
      }

      // Manholes and Drainage naali grates along North-South curbs
      for (let z = minZ + 25; z <= maxZ - 25; z += 65) {
        const manhole = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.02, 16), manholeMat);
        manhole.position.set(x + (z % 2 === 0 ? 3.5 : -3.5), 0.025, z);
        roadGroup.add(manhole);

        const naaliW = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 1.2), naaliCoverMat);
        naaliW.position.set(x - width / 2 + 0.25, 0.03, z + 12);
        roadGroup.add(naaliW);

        // Fire Hydrant on sidewalk
        if (Math.abs(z) % 130 < 20) {
          const hydrant = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.75, 10), hydrantMat);
          hydrant.position.set(x + width / 2 + 1.2, 0.48, z);
          roadGroup.add(hydrant);
        }
      }
    }
  };

  // Helper to add a 4-Way Paved Intersection with Zebra Crossings & Traffic Signals
  const addIntersection = (ix: number, iz: number, roadW = 16.0) => {
    // Center paved square
    const centerPad = new THREE.Mesh(
      new THREE.PlaneGeometry(roadW, roadW),
      cityRoadMatNS
    );
    centerPad.rotateX(-Math.PI / 2);
    centerPad.position.set(ix, 0.018, iz);
    centerPad.receiveShadow = true;
    roadGroup.add(centerPad);

    // 4 Pedestrian Zebra Crossings
    const zebraLength = 3.6;
    const stripeW = 0.85;

    // North Crossing
    for (let xOff = -roadW / 2 + 1.2; xOff <= roadW / 2 - 1.2; xOff += 1.8) {
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(stripeW, zebraLength), zebraMat);
      stripe.rotateX(-Math.PI / 2);
      stripe.position.set(ix + xOff, 0.022, iz - roadW / 2 - zebraLength / 2);
      roadGroup.add(stripe);
    }

    // South Crossing
    for (let xOff = -roadW / 2 + 1.2; xOff <= roadW / 2 - 1.2; xOff += 1.8) {
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(stripeW, zebraLength), zebraMat);
      stripe.rotateX(-Math.PI / 2);
      stripe.position.set(ix + xOff, 0.022, iz + roadW / 2 + zebraLength / 2);
      roadGroup.add(stripe);
    }

    // West Crossing
    for (let zOff = -roadW / 2 + 1.2; zOff <= roadW / 2 - 1.2; zOff += 1.8) {
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(zebraLength, stripeW), zebraMat);
      stripe.rotateX(-Math.PI / 2);
      stripe.position.set(ix - roadW / 2 - zebraLength / 2, 0.022, iz + zOff);
      roadGroup.add(stripe);
    }

    // East Crossing
    for (let zOff = -roadW / 2 + 1.2; zOff <= roadW / 2 - 1.2; zOff += 1.8) {
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(zebraLength, stripeW), zebraMat);
      stripe.rotateX(-Math.PI / 2);
      stripe.position.set(ix + roadW / 2 + zebraLength / 2, 0.022, iz + zOff);
      roadGroup.add(stripe);
    }

    // 4-Way Traffic Signal Posts on diagonal corners with glowing LEDs
    const corners = [
      { x: ix - roadW / 2 - 2.5, z: iz - roadW / 2 - 2.5, armDx: 2.2, armDz: 0 },
      { x: ix + roadW / 2 + 2.5, z: iz + roadW / 2 + 2.5, armDx: -2.2, armDz: 0 },
    ];

    corners.forEach((c) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 6.5, 10), poleMat);
      pole.position.set(c.x, 3.25, c.z);
      roadGroup.add(pole);

      // Overhanging Signal Arm
      const arm = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.12, 0.12), poleMat);
      arm.position.set(c.x + c.armDx, 6.2, c.z);
      roadGroup.add(arm);

      // Signal Light Box (Red, Amber, Green LEDs)
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 1.2, 0.35),
        new THREE.MeshStandardMaterial({ color: 0x090a0f })
      );
      box.position.set(c.x + c.armDx * 1.6, 5.8, c.z);
      roadGroup.add(box);

      // Red LED
      const rLight = new THREE.Mesh(
        new THREE.SphereGeometry(0.11, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 1.5 })
      );
      rLight.position.set(c.x + c.armDx * 1.6, 6.18, c.z + 0.18);
      roadGroup.add(rLight);

      // Amber LED
      const aLight = new THREE.Mesh(
        new THREE.SphereGeometry(0.11, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.5 })
      );
      aLight.position.set(c.x + c.armDx * 1.6, 5.8, c.z + 0.18);
      roadGroup.add(aLight);

      // Green illuminated light lens
      const gLight = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 2.2 })
      );
      gLight.position.set(c.x + c.armDx * 1.6, 5.42, c.z + 0.18);
      roadGroup.add(gLight);
    });
  };

  // Helper to add a 3D Speed Breaker
  const addSpeedBreaker = (bx: number, bz: number, length: number, isAlongX = false) => {
    const humpGeo = new THREE.CylinderGeometry(0.8, 0.8, length, 16, 1, false, 0, Math.PI);
    if (isAlongX) {
      humpGeo.rotateZ(Math.PI / 2);
    } else {
      humpGeo.rotateZ(Math.PI / 2);
      humpGeo.rotateY(Math.PI / 2);
    }
    const hump = new THREE.Mesh(humpGeo, speedBreakerMat);
    hump.scale.set(1.0, 0.07, 1.0);
    hump.position.set(bx, 0.035, bz);
    hump.castShadow = true;
    hump.receiveShadow = true;
    roadGroup.add(hump);
  };

  // Helper to add a Paved City Roundabout with central garden & landmark
  const addRoundabout = (rx: number, rz: number, radius = 24.0, roadW = 14.0) => {
    const ringGeo = new THREE.RingGeometry(radius - roadW, radius, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMesh = new THREE.Mesh(ringGeo, cityRoadMatNS);
    ringMesh.position.set(rx, 0.017, rz);
    ringMesh.receiveShadow = true;
    roadGroup.add(ringMesh);

    // Raised Circular Central Curb
    const centerCurb = new THREE.Mesh(
      new THREE.CylinderGeometry(radius - roadW, radius - roadW, 0.35, 32),
      concreteMat
    );
    centerCurb.position.set(rx, 0.175, rz);
    roadGroup.add(centerCurb);

    // Central Landscaped Lawn
    const grass = new THREE.Mesh(
      new THREE.CylinderGeometry(radius - roadW - 0.4, radius - roadW - 0.4, 0.38, 32),
      new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.9 })
    );
    grass.position.set(rx, 0.19, rz);
    roadGroup.add(grass);

    // Central Decorative Monument Tower
    const monument = new THREE.Mesh(
      new THREE.BoxGeometry(3.5, 14, 3.5),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.5 })
    );
    monument.position.set(rx, 7.0, rz);
    monument.castShadow = true;
    roadGroup.add(monument);

    // Golden Kalasam / Pinnacle
    const pin = new THREE.Mesh(
      new THREE.ConeGeometry(1.6, 3.5, 8),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 })
    );
    pin.position.set(rx, 15.5, rz);
    roadGroup.add(pin);

    // Register obstacle
    obstacles.push({
      minX: rx - 2.5,
      maxX: rx + 2.5,
      minZ: rz - 2.5,
      maxZ: rz + 2.5,
      height: 14,
    });
  };

  // Helper to add Modern LED Dual-Arm Streetlights
  const addDualArmStreetlight = (x: number, z: number, isAlongX = false) => {
    const lamp = new THREE.Group();
    lamp.position.set(x, 0, z);
    roadGroup.add(lamp);

    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.2, 9.6, 10),
      poleMat
    );
    pole.position.y = 4.8;
    lamp.add(pole);

    const bulbMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xfef08a,
      emissiveIntensity: 2.2,
    });

    if (isAlongX) {
      const armL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 3.2), poleMat);
      armL.position.set(0, 9.4, -1.6);
      lamp.add(armL);

      const headL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, 0.65), bulbMat);
      headL.position.set(0, 9.4, -3.2);
      lamp.add(headL);

      const armR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 3.2), poleMat);
      armR.position.set(0, 9.4, 1.6);
      lamp.add(armR);

      const headR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, 0.65), bulbMat);
      headR.position.set(0, 9.4, 3.2);
      lamp.add(headR);
    } else {
      const armL = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.15, 0.2), poleMat);
      armL.position.set(-1.6, 9.4, 0);
      lamp.add(armL);

      const headL = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.18, 0.35), bulbMat);
      headL.position.set(-3.2, 9.4, 0);
      lamp.add(headL);

      const armR = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.15, 0.2), poleMat);
      armR.position.set(1.6, 9.4, 0);
      lamp.add(armR);

      const headR = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.18, 0.35), bulbMat);
      headR.position.set(3.2, 9.4, 0);
      lamp.add(headR);
    }

    // Visual glowing emissive bulbMat provides luminous appearance with zero shader uniform cost
  };

  // =================================================================
  // 1. EAST-WEST CONTINUOUS ARTERIAL BOULEVARDS (ZERO DEAD ENDS)
  // Spanning across all 7 North-South arteries (-720m to +720m)
  // =================================================================
  // A. North Scenic Parkway (z = -850)
  addEastWestRoad(-850, -720, 720, 16.0, true);

  // B. North Crossway Corridor (z = -650)
  addEastWestRoad(-650, -720, 720, 16.0, true);

  // C. Old City Village & Bazaar Boulevard (z = -380)
  addEastWestRoad(-380, -720, 720, 16.0, true);

  // D. Grand City Central Boulevard (z = -80)
  addEastWestRoad(-80, -720, 720, 18.0, true);

  // E. Commercial & Fashion Boulevard (z = +220)
  addEastWestRoad(220, -720, 720, 16.0, true);

  // F. Southern Industrial & Logistics Expressway (z = +520)
  addEastWestRoad(520, -720, 720, 18.0, true);

  // G. Toll Plaza & University Link (z = +880)
  addEastWestRoad(880, -720, 720, 16.0, true);

  // H. South Midway Coastal Highway & Lake Boulevard (z = +1400)
  addEastWestRoad(1400, -720, 720, 18.0, true);

  // I. Southern Scenic Palm Parkway (z = +1900)
  addEastWestRoad(1900, -720, 720, 16.0, true);

  // J. South Terminal Superhighway Loop (z = +2380)
  addEastWestRoad(2380, -720, 720, 22.0, true);

  // =================================================================
  // 2. NORTH-SOUTH CONNECTING AVENUES (COMPLETING THE CITY GRID)
  // Spanning from Northern Mountains (z = -850) to Southern Bay (z = 2380)
  // =================================================================
  // A. Far West Outer Mountain Ring Highway (x = -720, z = -850 to 2380)
  addNorthSouthRoad(-720, -850, 2380, 16.0, true);

  // B. West Village & Residential Avenue (x = -420, z = -850 to 2380)
  addNorthSouthRoad(-420, -850, 2380, 16.0, true);

  // C. West Inner City Parkway (x = -200, z = -850 to 2380)
  addNorthSouthRoad(-200, -850, 2380, 16.0, true);

  // D. East Downtown Financial Avenue (x = +220, z = -850 to 2380)
  addNorthSouthRoad(220, -850, 2380, 18.0, true);

  // E. East Commercial Shopping Boulevard (x = +450, z = -850 to 2380)
  addNorthSouthRoad(450, -850, 2380, 16.0, true);

  // F. Far East Marina Coastal Expressway (x = +720, z = -850 to 2380)
  addNorthSouthRoad(720, -850, 2380, 18.0, true);

  // =================================================================
  // 3. COMPLETE 4-WAY INTERSECTIONS ACROSS THE ENTIRE CITY GRID
  // Every crossing of East-West & North-South roads has paved junctions,
  // zebra stripes, and traffic signals (7 x 10 = complete connectivity!)
  // =================================================================
  const nsAvenues = [-720, -420, -200, 220, 450, 720];
  const ewBoulevards = [-850, -650, -380, -80, 220, 520, 880, 1400, 1900, 2380];

  nsAvenues.forEach((nx) => {
    ewBoulevards.forEach((ez) => {
      // Highway overpass at x = 0 is separate; only pave grid intersections
      addIntersection(nx, ez, 16.0);
    });
  });

  // Highway Overpass/Slip Intersections connecting NH-48/NH-45 to cross roads
  [-650, -80, 220, 520, 880, 1400, 1900, 2380].forEach((hz) => {
    // East-side slip intersection
    addIntersection(24, hz, 16.0);
    // West-side slip intersection
    addIntersection(-24, hz, 16.0);
  });

  // Grand City Roundabouts at focal civic plazas
  addRoundabout(320, -80, 24.0, 14.0);   // Downtown Clocktower Roundabout
  addRoundabout(-420, -380, 26.0, 14.0); // Village Banyan Roundabout
  addRoundabout(450, 520, 22.0, 14.0);   // Logistics Mall Roundabout
  addRoundabout(0, 1900, 28.0, 16.0);    // Southern Lake Highway Roundabout

  // =================================================================
  // 4. CONTINUOUS STREETLIGHTING NETWORK ALONG ALL AVENUES
  // =================================================================
  // Along East-West Boulevards
  [-850, -650, -380, -80, 220, 520, 880, 1400, 1900, 2380].forEach((bz) => {
    for (let x = -700; x <= 700; x += 60) {
      if (Math.abs(x) < 35) continue; // Keep central highway median clear
      addDualArmStreetlight(x, bz - 10, true);
    }
  });

  // Along North-South Avenues
  [-720, -420, -200, 220, 450, 720].forEach((ax) => {
    for (let z = -820; z <= 2350; z += 65) {
      if (Math.abs(z - -80) < 25 || Math.abs(z - 220) < 25 || Math.abs(z - 520) < 25) continue;
      addDualArmStreetlight(ax + 10, z, false);
    }
  });

  // =================================================================
  // 5. 3D SPEED BREAKERS (RUMBLE STRIPS) BEFORE INTERSECTIONS
  // =================================================================
  const speedBreakerPoints = [
    { x: -80, z: -80, l: 16, alongX: false },
    { x: 80, z: -80, l: 16, alongX: false },
    { x: 220, z: -55, l: 16, alongX: true },
    { x: 220, z: -105, l: 16, alongX: true },
    { x: 450, z: 195, l: 16, alongX: true },
    { x: -420, z: -355, l: 16, alongX: true },
    { x: -420, z: 545, l: 16, alongX: true },
    { x: 0, z: 840, l: 26, alongX: true }, // Before Toll Plaza
    { x: 0, z: 1360, l: 26, alongX: true }, // Before Midway Motel
  ];

  speedBreakerPoints.forEach((sb) => {
    addSpeedBreaker(sb.x, sb.z, sb.l, sb.alongX);
  });

  // =================================================================
  // 6. ROAD ACCESSORIES: BUS STOPS, PALMS, GUARDRAILS & STUNT RAMPS
  // =================================================================
  // Bus Stop Shelters along major avenues and districts
  const busStopData = [
    { x: -550, z: -92, rot: 0, nameT: 'மேற்கு மலைப்பாதை', nameE: 'WEST MOUNTAIN PARKWAY', routes: ['3B', '15A'] },
    { x: -280, z: -92, rot: 0, nameT: 'மேற்கு நகர்', nameE: 'WEST TOWN RESIDENTIAL', routes: ['5B', '19A', '47B'] },
    { x: 140, z: -92, rot: 0, nameT: 'சென்ட்ரல் அவென்யூ', nameE: 'CITY CENTRAL PLAZA', routes: ['12A', '21G', 'M70'] },
    { x: 380, z: -92, rot: 0, nameT: 'வணிக வளாகம்', nameE: 'EAST COMMERCIAL MALL', routes: ['29C', '570', '109'] },
    { x: 620, z: -92, rot: 0, nameT: 'மெரினா கடற்கரை', nameE: 'EAST MARINA BEACHWAY', routes: ['109', 'PP21', 'M1'] },
    { x: 231, z: 60, rot: Math.PI / 2, nameT: 'தியாகராய நகர்', nameE: 'T. NAGAR DOWNTOWN', routes: ['11G', '47', '5B'] },
    { x: 231, z: 380, rot: Math.PI / 2, nameT: 'தொழிற்பேட்டை', nameE: 'INDUSTRIAL METRO PARK', routes: ['70V', '570S'] },
    { x: 231, z: 1050, rot: Math.PI / 2, nameT: 'தெற்கு நெடுஞ்சாலை', nameE: 'SOUTH HIGHWAY CORRIDOR', routes: ['NH45', '71B'] },
    { x: 231, z: 1600, rot: Math.PI / 2, nameT: 'ஏரிப்புறக் கரை', nameE: 'SOUTHERN LAKE TERMINUS', routes: ['109X', '570E'] },
    { x: -409, z: 150, rot: -Math.PI / 2, nameT: 'கிராமப்புற அங்காடி', nameE: 'VILLAGE COMMERCE ROAD', routes: ['88B', '23C'] },
  ];

  busStopData.forEach((b) => {
    const shelter = createTamilBusStopShelter(b.nameT, b.nameE, b.routes);
    shelter.position.set(b.x, 0, b.z);
    shelter.rotation.y = b.rot;
    roadGroup.add(shelter);
    obstacles.push({
      minX: b.x - 3.5,
      maxX: b.x + 3.5,
      minZ: b.z - 1.8,
      maxZ: b.z + 1.8,
      height: 3.2,
    });
  });

  // Roadside Tropical Palms along East Marina (x = 720) & Central Avenues
  for (let z = -800; z <= 2350; z += 45) {
    const palmL = createTamilCoconutTree();
    palmL.position.set(742, 0, z);
    roadGroup.add(palmL);

    const palmR = createTamilCoconutTree();
    palmR.position.set(698, 0, z);
    roadGroup.add(palmR);
  }

  // Banana Plants along Residential & Village streets (x = -420)
  for (let z = -800; z <= 600; z += 50) {
    const banana = createTamilBananaTree();
    banana.position.set(-442, 0, z);
    roadGroup.add(banana);
  }

  // Roadside Guardrails along East Marina Ring Road outer curve
  const marinaRail = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 0.65, 3200),
    guardMat
  );
  marinaRail.position.set(732, 0.65, 765);
  roadGroup.add(marinaRail);

  // Roadside Guardrails along Far West Mountain Road
  const westRail = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 0.65, 3200),
    guardMat
  );
  westRail.position.set(-732, 0.65, 765);
  roadGroup.add(westRail);

  // Stunt Ramps placed on wide boulevards
  const addBoulevardRamp = (rx: number, rz: number, rotY: number) => {
    const rampW = 5.0;
    const rampL = 10.0;
    const rMesh = new THREE.Mesh(
      new THREE.BoxGeometry(rampW, 0.45, rampL),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.25 })
    );
    rMesh.position.set(rx, 1.0, rz);
    rMesh.rotation.y = rotY;
    rMesh.rotation.x = -0.2;
    rMesh.castShadow = true;
    roadGroup.add(rMesh);
    stuntRamps.push({ x: rx, y: 0, z: rz, rotation: rotY, width: rampW, length: rampL });
  };

  addBoulevardRamp(540, -80, Math.PI / 2);
  addBoulevardRamp(-480, 220, -Math.PI / 2);
  addBoulevardRamp(720, 350, 0);
  addBoulevardRamp(-720, 1100, 0);
  addBoulevardRamp(450, 1650, 0);
  addBoulevardRamp(-200, 2100, 0);

  return {
    group: roadGroup,
    streetLamps,
    stuntRamps,
  };
}
