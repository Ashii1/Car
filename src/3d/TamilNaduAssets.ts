import * as THREE from 'three';

// ============================================================================
// TAMIL NADU AUTHENTIC ASSET BUILDER: BUSES, GOPURAMS, PALMS & TAMIL SIGNAGE
// ============================================================================

/**
 * Creates authentic bilingual Tamil/English destination board for State Buses
 * (e.g. TNSTC, MTC Chennai, SETC Deluxe).
 */
export function createTamilBusDestinationTexture(
  routeNo: string,
  tamilFrom: string,
  tamilTo: string,
  engFrom: string,
  engTo: string,
  busType: 'mofussil' | 'town' | 'city' | 'setc' = 'mofussil'
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Background
  if (busType === 'city') {
    // Modern amber LED matrix
    ctx.fillStyle = '#090a0f';
    ctx.fillRect(0, 0, 512, 128);

    // Route box on left
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(8, 8, 110, 112);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 42px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(routeNo, 63, 78);

    // Amber LED Destination
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${tamilFrom} - ${tamilTo}`, 135, 52);

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 24px monospace';
    ctx.fillText(`${engFrom} - ${engTo}`, 135, 96);
  } else {
    // Classic painted enamel sign (Yellow background with red/black text)
    const isMofussil = busType === 'mofussil';
    ctx.fillStyle = isMofussil ? '#fef08a' : '#ffffff';
    ctx.fillRect(0, 0, 512, 128);

    ctx.strokeStyle = isMofussil ? '#15803d' : '#b91c1c';
    ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, 500, 116);

    // Route pill
    ctx.fillStyle = isMofussil ? '#15803d' : '#b91c1c';
    ctx.fillRect(14, 14, 95, 100);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 38px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(routeNo, 61, 78);

    // Tamil Title in primary focus
    ctx.fillStyle = isMofussil ? '#14532d' : '#991b1b';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${tamilFrom} ⇄ ${tamilTo}`, 125, 56);

    // English Subtitle
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(`${engFrom} ⇄ ${engTo}`, 125, 98);
  }

  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

/**
 * Creates authentic bilingual Tamil Nadu National & State Highway milestones
 * (GST Road NH-45, ECR SH-49, NH-44).
 */
export function createTamilMilestoneTexture(
  routeCode: string,
  topTamil: string,
  topEng: string,
  topDist: number,
  btmTamil: string,
  btmEng: string,
  btmDist: number,
  isNational: boolean = true
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 384;
  const ctx = canvas.getContext('2d')!;

  // Weathered concrete body
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 256, 384);

  // Road dust and rain streak gradient
  const grime = ctx.createLinearGradient(0, 280, 0, 384);
  grime.addColorStop(0, 'rgba(120, 53, 15, 0)');
  grime.addColorStop(1, 'rgba(120, 53, 15, 0.45)');
  ctx.fillStyle = grime;
  ctx.fillRect(0, 280, 256, 104);

  // Colored Cap: Yellow for NH, Green for State Highway (SH)
  ctx.fillStyle = isNational ? '#facc15' : '#16a34a';
  ctx.beginPath();
  ctx.arc(128, 115, 105, Math.PI, 0, false);
  ctx.lineTo(233, 135);
  ctx.lineTo(23, 135);
  ctx.closePath();
  ctx.fill();

  // Route Code (e.g., "NH 45" or "SH 49")
  ctx.fillStyle = isNational ? '#0f172a' : '#ffffff';
  ctx.font = 'bold 30px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(routeCode, 128, 95);

  // Upper Destination in Tamil & English
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText(topTamil, 128, 175);
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText(topEng.toUpperCase(), 128, 202);
  ctx.font = 'bold 36px monospace';
  ctx.fillText(`${topDist} KM`, 128, 244);

  // Central Divider
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(32, 262);
  ctx.lineTo(224, 262);
  ctx.stroke();

  // Lower Destination in Tamil & English
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(btmTamil, 128, 298);
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText(btmEng.toUpperCase(), 128, 322);
  ctx.font = 'bold 30px monospace';
  ctx.fillText(`${btmDist} KM`, 128, 360);

  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

/**
 * Creates authentic Tamil storefront signboards (Tea stalls, filter coffee, tyre shops).
 */
export function createTamilStoreSignTexture(
  tamilTitle: string,
  engTitle: string,
  subtitle: string,
  bgColor: string,
  textColor = '#ffffff'
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, 512, 128);

  // Traditional border
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, 500, 116);

  // Tamil header
  ctx.fillStyle = textColor;
  ctx.font = 'bold 32px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(tamilTitle, 256, 45);

  // English header
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(engTitle, 256, 78);

  // Subtitle / Specialties
  ctx.fillStyle = '#ffffff';
  ctx.font = '16px monospace';
  ctx.fillText(subtitle, 256, 108);

  return new THREE.CanvasTexture(canvas);
}

/**
 * Creates authentic Tamil Nadu Lorry hand-painted ornate wooden cabin art texture
 * with "SOUND HORN", "தமிழ் வாழ்க", "கண் பட போகுது", and peacock motifs.
 */
export function createTamilLorryArtTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Vibrant yellow background with red & green borders
  ctx.fillStyle = '#facc15';
  ctx.fillRect(0, 0, 512, 256);

  // Ornate decorative floral scroll borders
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, 496, 240);

  ctx.strokeStyle = '#15803d';
  ctx.lineWidth = 4;
  ctx.strokeRect(18, 18, 476, 220);

  // Tamil Blessing / Motto
  ctx.fillStyle = '#b91c1c';
  ctx.font = 'bold 38px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('தமிழ் வாழ்க', 256, 65);

  // Ward off evil eye motto: கண் பட போகுது
  ctx.fillStyle = '#1e3a8a';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('★ கண் பட போகுது ★', 256, 105);

  // Classic Commercial Highway Notice: SOUND HORN / BLOW HORN
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 44px sans-serif';
  ctx.fillText('SOUND  HORN', 256, 165);

  // Bottom Notice
  ctx.fillStyle = '#15803d';
  ctx.font = 'bold 20px monospace';
  ctx.fillText('USE DIPPER AT NIGHT • STOP', 256, 210);

  return new THREE.CanvasTexture(canvas);
}

/**
 * Builds an authentic Tamil Nadu Dravidian Temple Gopuram roadside landmark
 * with tiered pyramidal towers, gold kalasam pinnacles, and red/white striped walls.
 */
export function createDravidianTempleGopuram(): THREE.Group {
  const gopuramGroup = new THREE.Group();

  const terracottaMat = new THREE.MeshStandardMaterial({ color: 0xc2410c, roughness: 0.8 });
  const goldKalasamMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.9, roughness: 0.2 });
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 });

  // 1. Base Gateway Entrance (Gateway Doorway)
  const basePillars = new THREE.Mesh(new THREE.BoxGeometry(6.5, 4.2, 3.8), terracottaMat);
  basePillars.position.y = 2.1;
  basePillars.castShadow = true;
  gopuramGroup.add(basePillars);

  // Central Archway Passage
  const archHole = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 3.2, 4.0),
    new THREE.MeshBasicMaterial({ color: 0x18181b })
  );
  archHole.position.set(0, 1.6, 0);
  gopuramGroup.add(archHole);

  // 2. Multi-Tiered Pyramidal Gopuram Tiers (5 Progressive Tiers)
  const tiers = [
    { w: 5.8, d: 3.4, h: 1.6, y: 4.8 },
    { w: 5.0, d: 2.9, h: 1.5, y: 6.2 },
    { w: 4.2, d: 2.4, h: 1.4, y: 7.5 },
    { w: 3.4, d: 1.9, h: 1.3, y: 8.7 },
    { w: 2.6, d: 1.4, h: 1.2, y: 9.8 },
  ];

  tiers.forEach((t) => {
    const tierMesh = new THREE.Mesh(new THREE.BoxGeometry(t.w, t.h, t.d), terracottaMat);
    tierMesh.position.y = t.y;
    tierMesh.castShadow = true;
    gopuramGroup.add(tierMesh);

    // Decorative molding ledge
    const ledge = new THREE.Mesh(new THREE.BoxGeometry(t.w + 0.35, 0.18, t.d + 0.35), stoneMat);
    ledge.position.y = t.y - t.h / 2;
    gopuramGroup.add(ledge);
  });

  // Barrel-Vault Barrel Roof Cap (Koodu)
  const roofCap = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.7, 1.2), terracottaMat);
  roofCap.position.y = 10.7;
  gopuramGroup.add(roofCap);

  // 5 Golden Kalasams (Temple Spire Pinnacles)
  [-0.8, -0.4, 0, 0.4, 0.8].forEach((kx) => {
    const kalasam = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.65, 10), goldKalasamMat);
    kalasam.position.set(kx, 11.3, 0);
    gopuramGroup.add(kalasam);
  });

  // 3. Sacred Red and White Striped Perimeter Wall ("பட்டை அடித்த சுவர்")
  const wallGroup = new THREE.Group();
  gopuramGroup.add(wallGroup);

  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.85 });
  const redMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.85 });

  for (let s = -6; s <= 6; s += 0.8) {
    if (Math.abs(s) < 2.0) continue; // Doorway clearance
    const isRed = Math.abs(Math.round(s / 0.8)) % 2 === 0;
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.78, 1.6, 0.35), isRed ? redMat : whiteMat);
    stripe.position.set(s, 0.8, 1.8);
    wallGroup.add(stripe);
  }

  return gopuramGroup;
}

/**
 * Builds an authentic Roadside Pillayar (Ganesha) shrine under a sacred Peepal/Neem tree
 * with brass bell, stone idol, oil lamp, and red/white striped platform.
 */
export function createTamilRoadsideShrine(): THREE.Group {
  const shrineGroup = new THREE.Group();

  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 });
  const brassMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 });
  const tileMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.8 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.85 });
  const redMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.85 });

  // Plinth platform with red & white stripes
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 2.2), stoneMat);
  plinth.position.y = 0.25;
  shrineGroup.add(plinth);

  // Red and white striped front border
  for (let s = -0.9; s <= 0.9; s += 0.3) {
    const isRed = Math.abs(Math.round(s / 0.3)) % 2 === 0;
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.48, 0.05), isRed ? redMat : whiteMat);
    stripe.position.set(s, 0.25, 1.08);
    shrineGroup.add(stripe);
  }

  // Small Sanctum with terracotta arched canopy
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.6, 1.4), stoneMat);
  canopy.position.set(0, 1.3, 0);
  shrineGroup.add(canopy);

  // Arched opening
  const hollow = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.1, 1.2), new THREE.MeshBasicMaterial({ color: 0x09090b }));
  hollow.position.set(0, 1.15, 0.15);
  shrineGroup.add(hollow);

  // Small stone deity silhouette inside
  const idol = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.55, 10), stoneMat);
  idol.position.set(0, 0.85, 0.1);
  shrineGroup.add(idol);

  // Golden Kalasam atop canopy
  const kalasam = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.32, 8), brassMat);
  kalasam.position.set(0, 2.25, 0);
  shrineGroup.add(kalasam);

  // Hanging Brass Temple Bell (கோவில் மணி)
  const bell = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.12, 10), brassMat);
  bell.position.set(0, 1.6, 0.65);
  shrineGroup.add(bell);

  // Hanging chain
  const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.3, 6), brassMat);
  chain.position.set(0, 1.8, 0.65);
  shrineGroup.add(chain);

  return shrineGroup;
}

/**
 * Builds an authentic Tamil Nadu Coconut Palm Tree (தென்னை மரம்)
 * with curved ringed fibrous trunk, coconut fruit clusters, and sweeping arched fronds.
 */
export function createTamilCoconutTree(): THREE.Group {
  const treeGroup = new THREE.Group();

  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78553d, roughness: 0.95 });
  const frondMat = new THREE.MeshStandardMaterial({ color: 0x225d1e, roughness: 0.85, side: THREE.DoubleSide });
  const nutMat = new THREE.MeshStandardMaterial({ color: 0x556b2f, roughness: 0.75 });

  // Curved Natural Trunk using CatmullRomCurve3
  const leanX = (Math.random() - 0.5) * 1.8;
  const leanZ = (Math.random() - 0.5) * 1.8;
  const height = 9.5 + Math.random() * 2.5;

  const trunkCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(leanX * 0.25, height * 0.3, leanZ * 0.25),
    new THREE.Vector3(leanX * 0.75, height * 0.65, leanZ * 0.75),
    new THREE.Vector3(leanX, height, leanZ),
  ]);

  const trunkGeo = new THREE.TubeGeometry(trunkCurve, 20, 0.24, 8, false);
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.castShadow = true;
  treeGroup.add(trunk);

  // Crown head at top of trunk
  const crownPos = new THREE.Vector3(leanX, height, leanZ);

  // Cluster of Tender Coconuts (இளநீர் குலை)
  for (let c = 0; c < 8; c++) {
    const nut = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), nutMat);
    nut.scale.set(0.9, 1.3, 0.9);
    nut.position.set(
      crownPos.x + (Math.random() - 0.5) * 0.5,
      crownPos.y - 0.2 + (Math.random() - 0.5) * 0.3,
      crownPos.z + (Math.random() - 0.5) * 0.5
    );
    treeGroup.add(nut);
  }

  // 12 Sweeping Arched Coconut Fronds (தென்னை ஓலை)
  const frondCount = 12;
  for (let f = 0; f < frondCount; f++) {
    const angle = (f / frondCount) * Math.PI * 2;
    const frondCurve = new THREE.CatmullRomCurve3([
      crownPos,
      new THREE.Vector3(
        crownPos.x + Math.cos(angle) * 2.2,
        crownPos.y + 0.8,
        crownPos.z + Math.sin(angle) * 2.2
      ),
      new THREE.Vector3(
        crownPos.x + Math.cos(angle) * 4.2,
        crownPos.y - 1.2,
        crownPos.z + Math.sin(angle) * 4.2
      ),
    ]);

    const leafMesh = new THREE.Mesh(new THREE.TubeGeometry(frondCurve, 12, 0.22, 4, false), frondMat);
    treeGroup.add(leafMesh);
  }

  return treeGroup;
}

/**
 * Builds an authentic Tamil Nadu Banana Tree / Plant (வாழை மரம்)
 * with green pseudostem and broad arching paddle leaves.
 */
export function createTamilBananaTree(): THREE.Group {
  const bananaGroup = new THREE.Group();

  const stemMat = new THREE.MeshStandardMaterial({ color: 0x4d7c0f, roughness: 0.8 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.65, side: THREE.DoubleSide });

  // Central green fleshy pseudostem
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 2.6, 10), stemMat);
  stem.position.y = 1.3;
  stem.castShadow = true;
  bananaGroup.add(stem);

  // 6 Broad Arching Paddle Leaves (வாழை இலை)
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2;
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.02, 1.8), leafMat);
    leaf.position.set(Math.cos(ang) * 0.7, 2.4, Math.sin(ang) * 0.7);
    leaf.rotation.y = -ang;
    leaf.rotation.x = 0.55;
    leaf.castShadow = true;
    bananaGroup.add(leaf);
  }

  return bananaGroup;
}

/**
 * Builds an authentic Tamil Nadu Roadside Bus Stop Shelter (பேருந்து நிறுத்தம்)
 * with metal roof, bench, timetable sign, and Tamil route numbers.
 */
export function createTamilBusStopShelter(
  stopNameTamil: string,
  stopNameEng: string,
  routes: string[]
): THREE.Group {
  const busStopGroup = new THREE.Group();

  const metalMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.8, roughness: 0.3 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.4 });
  const concreteMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.85 });

  // Concrete Waiting Platform
  const platform = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.25, 2.8), concreteMat);
  platform.position.y = 0.125;
  busStopGroup.add(platform);

  // Metal Support Pillars
  [-2.8, 2.8].forEach((px) => {
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.8, 8), metalMat);
    pillar.position.set(px, 1.4, -1.0);
    busStopGroup.add(pillar);
  });

  // Curved Corrugated Blue Canopy Roof
  const roof = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.08, 3.2), roofMat);
  roof.position.set(0, 2.8, 0.1);
  roof.rotation.x = -0.08;
  busStopGroup.add(roof);

  // Passenger Seating Bench
  const bench = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.45, 0.5), new THREE.MeshStandardMaterial({ color: 0x64748b }));
  bench.position.set(0, 0.35, -0.6);
  busStopGroup.add(bench);

  // Prominent Header Signboard with Tamil Typography
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(0, 0, 512, 128);

  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, 500, 116);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(stopNameTamil, 256, 46);

  ctx.fillStyle = '#fde047';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(`${stopNameEng.toUpperCase()} BUS STOP`, 256, 78);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px monospace';
  ctx.fillText(`பேருந்து வழித்தடங்கள்: ${routes.join(' • ')}`, 256, 108);

  const signTex = new THREE.CanvasTexture(canvas);
  const sign = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.85, 0.06), new THREE.MeshStandardMaterial({ map: signTex }));
  sign.position.set(0, 2.65, 1.4);
  busStopGroup.add(sign);

  return busStopGroup;
}

/**
 * Builds an authentic Tamil Tea Stall (மலர் டீ ஸ்டால் & பேக்கரி)
 * with brass filter coffee samovar, bun butter jam, banana leaf bunch, glass tumblers, bench.
 */
export function createTamilTeaStall(
  tamilName: string,
  engName: string,
  specialty: string
): THREE.Group {
  const stallGroup = new THREE.Group();

  const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
  const brassMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.92, roughness: 0.16 });
  const steelMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 });
  const tarpMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.85 });

  // Main wooden kiosk cabin
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(4.8, 2.9, 3.2), woodMat);
  cabin.position.set(0, 1.45, 0);
  cabin.castShadow = true;
  stallGroup.add(cabin);

  // Front wooden serving counter
  const counter = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.95, 0.7), new THREE.MeshStandardMaterial({ color: 0x9a3412 }));
  counter.position.set(0, 0.48, 1.45);
  stallGroup.add(counter);

  // Slanted blue tarp sunshade canopy
  const tarp = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.08, 3.8), tarpMat);
  tarp.position.set(0, 3.1, 0.6);
  tarp.rotation.x = 0.18;
  stallGroup.add(tarp);

  // Bamboo support poles
  [-2.3, 2.3].forEach((bx) => {
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 3.2, 8),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8 })
    );
    pole.position.set(bx, 1.6, 2.2);
    stallGroup.add(pole);
  });

  // Authentic Tamil Nadu Brass Filter Coffee Decoction Samovar
  const samovar = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.52, 16), brassMat);
  samovar.position.set(-1.1, 1.22, 1.45);
  samovar.castShadow = true;
  stallGroup.add(samovar);

  // Stainless steel milk boiling vessel
  const milkPot = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.32, 14), steelMat);
  milkPot.position.set(-0.6, 1.12, 1.45);
  stallGroup.add(milkPot);

  // Hanging bunch of yellow cooking bananas (வாழைத்தார்)
  const bananaBunch = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.2, 0.55, 8),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.7 })
  );
  bananaBunch.position.set(1.4, 2.4, 1.6);
  stallGroup.add(bananaBunch);

  // Glass showcase jar for Bun Butter Jam & Medu Vada
  const glassJar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 0.28, 12),
    new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, roughness: 0.1, metalness: 0.8 })
  );
  glassJar.position.set(0.4, 1.1, 1.45);
  stallGroup.add(glassJar);

  // Customer wooden bench
  const bench = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.45, 0.55), woodMat);
  bench.position.set(0, 0.22, 2.9);
  stallGroup.add(bench);

  // Storefront Banner with Tamil Typography
  const signTex = createTamilStoreSignTexture(tamilName, engName, specialty, '#1d4ed8');
  const sign = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.85, 0.08), new THREE.MeshStandardMaterial({ map: signTex }));
  sign.position.set(0, 2.9, 2.15);
  stallGroup.add(sign);

  return stallGroup;
}

/**
 * Builds an authentic Tamil Nadu Tyre Puncture & Vulcanizing Workshop (ஸ்ரீ முருகன் டயர் ஒர்க்ஸ்)
 * with water testing tub, compressed air cylinder, and tyre stacks.
 */
export function createTamilTyreShop(): THREE.Group {
  const shopGroup = new THREE.Group();

  const metalSheetMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.45 });
  const tyreMat = new THREE.MeshStandardMaterial({ color: 0x14161a, roughness: 0.95 });

  // Workshop corrugated metal shed
  const shed = new THREE.Mesh(new THREE.BoxGeometry(8.2, 3.6, 5.8), metalSheetMat);
  shed.position.set(0, 1.8, 0);
  shed.castShadow = true;
  shopGroup.add(shed);

  // Slanted front awning
  const awning = new THREE.Mesh(
    new THREE.BoxGeometry(8.8, 0.1, 4.2),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 })
  );
  awning.position.set(0, 3.7, 1.8);
  awning.rotation.x = 0.2;
  shopGroup.add(awning);

  // Prominent Yellow Signboard
  const signTex = createTamilStoreSignTexture(
    'ஸ்ரீ முருகன் டயர் ஒர்க்ஸ்',
    'SRI MURUGAN TYRE PUNCTURE WORKS',
    '24X7 • ட்யூப்லெஸ் பஞ்சர் • நைட்ரஜன் ஏர் • வீல் அலைன்மென்ட்',
    '#eab308',
    '#09090b'
  );
  const sign = new THREE.Mesh(new THREE.BoxGeometry(7.8, 1.0, 0.12), new THREE.MeshStandardMaterial({ map: signTex }));
  sign.position.set(0, 3.8, 3.5);
  shopGroup.add(sign);

  // Water testing tub for bubble leak checks (டயர் தண்ணீர் தொட்டி)
  const tub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.65, 0.65, 0.45, 16),
    new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 })
  );
  tub.position.set(-2.8, 0.22, 2.4);
  shopGroup.add(tub);

  // Red Air Compressor Tank
  const compressor = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.35, 1.1, 16),
    new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 })
  );
  compressor.rotateZ(Math.PI / 2);
  compressor.position.set(2.8, 0.45, 2.2);
  shopGroup.add(compressor);

  // Motorcycle & Truck Tyre Stacks
  [-1.6, 1.6].forEach((tx) => {
    for (let h = 0; h < 4; h++) {
      const tyre = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.12, 10, 20), tyreMat);
      tyre.rotateX(Math.PI / 2);
      tyre.position.set(tx, 0.12 + h * 0.24, 2.6);
      shopGroup.add(tyre);
    }
  });

  return shopGroup;
}

/**
 * Builds an authentic Tamil Nadu Tender Coconut Stall (இளநீர் கடை)
 * with palm thatch canopy and green coconut stacks.
 */
export function createTamilTenderCoconutStall(): THREE.Group {
  const stallGroup = new THREE.Group();

  const thatchMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.95 });
  const bambooMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8 });
  const coconutGreenMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.6 });
  const woodStumpMat = new THREE.MeshStandardMaterial({ color: 0x573a21, roughness: 0.95 });

  // Palm thatch canopy
  const thatch = new THREE.Mesh(new THREE.ConeGeometry(2.4, 1.2, 8), thatchMat);
  thatch.position.y = 2.6;
  stallGroup.add(thatch);

  // 4 Bamboo corner poles
  [-1.1, 1.1].forEach((bx) => {
    [-1.1, 1.1].forEach((bz) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.6, 8), bambooMat);
      pole.position.set(bx, 1.3, bz);
      stallGroup.add(pole);
    });
  });

  // Tree stump cutting block with machete (வெட்டுக்கட்டை)
  const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.65, 12), woodStumpMat);
  stump.position.set(0, 0.32, 0.4);
  stallGroup.add(stump);

  // Pyramid stack of Green Tender Coconuts (இளநீர் குவியல்)
  for (let row = 0; row < 3; row++) {
    for (let c = 0; c < 4 - row; c++) {
      const nut = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), coconutGreenMat);
      nut.scale.set(0.9, 1.25, 0.9);
      nut.position.set(-0.6 + c * 0.38 + row * 0.18, 0.2 + row * 0.26, -0.4);
      stallGroup.add(nut);
    }
  }

  // Tamil Signboard: "சுவையான இயற்கையான இளநீர்"
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#15803d';
  ctx.fillRect(0, 0, 256, 128);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('இயற்கை இளநீர்', 128, 52);
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('TENDER COCONUT', 128, 86);

  const signTex = new THREE.CanvasTexture(canvas);
  const sign = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 0.05), new THREE.MeshStandardMaterial({ map: signTex }));
  sign.position.set(0, 2.1, 1.15);
  stallGroup.add(sign);

  return stallGroup;
}

/**
 * Builds an authentic Tamil Nadu Highway Overhead Gantry Sign (GST Road NH-45 / ECR)
 * spanning across carriageway with bilingual Tamil and English green reflective boards.
 */
export function createTamilHighwayGantrySign(
  leftTamil: string,
  leftEng: string,
  leftDist: number,
  rightTamil: string,
  rightEng: string,
  rightDist: number,
  highwayCode: string = 'NH 45'
): THREE.Group {
  const gantryGroup = new THREE.Group();

  const steelMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9, roughness: 0.3 });

  // Left and Right Vertical Truss Columns
  [-13.5, 13.5].forEach((gx) => {
    const col = new THREE.Mesh(new THREE.BoxGeometry(0.45, 8.8, 0.45), steelMat);
    col.position.set(gx, 4.4, 0);
    gantryGroup.add(col);
  });

  // Cross Overhead Truss Beam (27m span)
  const beam = new THREE.Mesh(new THREE.BoxGeometry(27.8, 0.55, 0.45), steelMat);
  beam.position.set(0, 8.2, 0);
  gantryGroup.add(beam);

  // Large Green Reflective Highway Direction Boards (Bilingual Tamil & English)
  [-6.2, 6.2].forEach((bx, idx) => {
    const isLeft = idx === 0;
    const tamilTitle = isLeft ? leftTamil : rightTamil;
    const engTitle = isLeft ? leftEng : rightEng;
    const dist = isLeft ? leftDist : rightDist;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // NHAI Green Highway Board
    ctx.fillStyle = '#15803d';
    ctx.fillRect(0, 0, 512, 256);

    // Reflective white border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 10;
    ctx.strokeRect(10, 10, 492, 236);

    // Route Badge
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(highwayCode, 32, 50);

    // Tamil Destination
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(tamilTitle, 256, 115);

    // English Destination
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText(engTitle.toUpperCase(), 256, 165);

    // Distance & Direction Arrow
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px monospace';
    ctx.fillText(`↑  ${dist} KM  ↑`, 256, 218);

    const boardTex = new THREE.CanvasTexture(canvas);
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(8.4, 3.2, 0.1),
      new THREE.MeshStandardMaterial({ map: boardTex, roughness: 0.4 })
    );
    board.position.set(bx, 7.8, 0.15);
    gantryGroup.add(board);
  });

  return gantryGroup;
}
