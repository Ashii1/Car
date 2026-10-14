import * as THREE from 'three';
import { WorldObstacle } from './CityWorldBuilder';
import {
  createTamilMilestoneTexture,
  createTamilStoreSignTexture,
  createDravidianTempleGopuram,
  createTamilRoadsideShrine,
  createTamilCoconutTree,
  createTamilBananaTree,
  createTamilBusStopShelter,
  createTamilTeaStall,
  createTamilTyreShop,
  createTamilTenderCoconutStall,
  createTamilHighwayGantrySign,
} from './TamilNaduAssets';

// Procedural texture for Tamil/English Caution & Warning Signs
function createTamilCautionSignTexture(tamilText: string, engText: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Bright warning yellow diamond
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.moveTo(128, 12);
  ctx.lineTo(244, 128);
  ctx.lineTo(128, 244);
  ctx.lineTo(12, 128);
  ctx.closePath();
  ctx.fill();

  // Black inner border
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(128, 24);
  ctx.lineTo(232, 128);
  ctx.lineTo(128, 232);
  ctx.lineTo(24, 128);
  ctx.closePath();
  ctx.stroke();

  // Tamil Warning Text
  ctx.fillStyle = '#09090b';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(tamilText, 128, 110);

  // English Warning Text
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText(engText, 128, 145);

  return new THREE.CanvasTexture(canvas);
}

export function generateIndianRoadsideAssets(
  worldGroup: THREE.Group,
  obstacles: WorldObstacle[]
) {
  const roadsideGroup = new THREE.Group();
  worldGroup.add(roadsideGroup);

  // Common Shared Materials
  const concreteMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.85 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
  const metalSheetMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.45 });
  const tireRubberMat = new THREE.MeshStandardMaterial({ color: 0x14161a, roughness: 0.95 });
  const wireMat = new THREE.LineBasicMaterial({ color: 0x0a0c10, linewidth: 2 });
  const bambooMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.75 });
  const brassKettleMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.15 });

  // =============================================================
  // 1. TAMIL NADU BILINGUAL HIGHWAY KILOMETER MARKERS (MILESTONES)
  // GST Road NH-45 (Grand Southern Trunk) & ECR SH-49 (East Coast Road)
  // =============================================================
  const stoneWidth = 0.55;
  const stoneHeight = 0.82;
  const stoneDepth = 0.32;

  const milestoneGeo = new THREE.BoxGeometry(stoneWidth, stoneHeight, stoneDepth);
  const capGeo = new THREE.CylinderGeometry(stoneWidth / 2, stoneWidth / 2, stoneDepth, 16);
  capGeo.rotateZ(Math.PI / 2);

  // GST Road (NH-45) Milestones placed every 75m
  const nhDestinations = [
    { topTamil: 'சென்னை', topEng: 'Chennai', topDist: 86, btmTamil: 'விழுப்புரம்', btmEng: 'Villupuram', btmDist: 42 },
    { topTamil: 'சென்னை', topEng: 'Chennai', topDist: 85, btmTamil: 'விழுப்புரம்', btmEng: 'Villupuram', btmDist: 43 },
    { topTamil: 'சென்னை', topEng: 'Chennai', topDist: 84, btmTamil: 'திண்டிவனம்', btmEng: 'Tindivanam', btmDist: 28 },
    { topTamil: 'திருச்சி', topEng: 'Trichy', topDist: 198, btmTamil: 'மதுரை', btmEng: 'Madurai', btmDist: 325 },
    { topTamil: 'திருச்சி', topEng: 'Trichy', topDist: 197, btmTamil: 'மதுரை', btmEng: 'Madurai', btmDist: 326 },
    { topTamil: 'செங்கல்பட்டு', topEng: 'Chengalpattu', topDist: 32, btmTamil: 'சென்னை', btmEng: 'Chennai', btmDist: 74 },
    { topTamil: 'கோயம்புத்தூர்', topEng: 'Coimbatore', topDist: 280, btmTamil: 'சேலம்', btmEng: 'Salem', btmDist: 165 },
    { topTamil: 'தஞ்சாவூர்', topEng: 'Thanjavur', topDist: 140, btmTamil: 'திருச்சி', btmEng: 'Trichy', btmDist: 88 },
  ];

  let nhIdx = 0;
  for (let z = -750; z <= 750; z += 75) {
    if (Math.abs(z - -80) < 30 || Math.abs(z - 520) < 30) continue; // Clear junctions
    const d = nhDestinations[nhIdx % nhDestinations.length];
    nhIdx++;

    [-1, 1].forEach((side) => {
      const stoneTex = createTamilMilestoneTexture('NH 45', d.topTamil, d.topEng, d.topDist, d.btmTamil, d.btmEng, d.btmDist, true);
      const stoneMat = new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.65 });

      const mGroup = new THREE.Group();
      mGroup.position.set(side * 14.8, 0, z);
      mGroup.rotation.y = side === 1 ? -Math.PI / 2 : Math.PI / 2;
      roadsideGroup.add(mGroup);

      const baseMesh = new THREE.Mesh(milestoneGeo, stoneMat);
      baseMesh.position.y = stoneHeight / 2;
      baseMesh.castShadow = true;
      mGroup.add(baseMesh);

      const capMesh = new THREE.Mesh(capGeo, stoneMat);
      capMesh.position.y = stoneHeight;
      mGroup.add(capMesh);
    });
  }

  // East Coast Road (SH-49) Green Milestones along the coastal/village road
  const villageDests = [
    { topTamil: 'மகாபலிபுரம்', topEng: 'Mahabalipuram', topDist: 12, btmTamil: 'NH-45', btmEng: 'GST Road', btmDist: 6 },
    { topTamil: 'புதுச்சேரி', topEng: 'Puducherry', topDist: 64, btmTamil: 'கல்பாக்கம்', btmEng: 'Kalpakkam', btmDist: 18 },
    { topTamil: 'திருப்போரூர்', topEng: 'Tiruporur', topDist: 8, btmTamil: 'கேளம்பாக்கம்', btmEng: 'Kelambakkam', btmDist: 4 },
    { topTamil: 'ஊராட்சி', topEng: 'Panchayat', topDist: 2, btmTamil: 'மதுராந்தகம்', btmEng: 'Madurantakam', btmDist: 15 },
  ];

  villageDests.forEach((vd, idx) => {
    const vx = -80 - idx * 75;
    const stoneTex = createTamilMilestoneTexture('SH 49', vd.topTamil, vd.topEng, vd.topDist, vd.btmTamil, vd.btmEng, vd.btmDist, false);
    const stoneMat = new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.65 });

    const mGroup = new THREE.Group();
    mGroup.position.set(vx, 0, -374.5);
    roadsideGroup.add(mGroup);

    const baseMesh = new THREE.Mesh(milestoneGeo, stoneMat);
    baseMesh.position.y = stoneHeight / 2;
    mGroup.add(baseMesh);

    const capMesh = new THREE.Mesh(capGeo, stoneMat);
    capMesh.position.y = stoneHeight;
    mGroup.add(capMesh);
  });

  // =============================================================
  // 2. OVERHEAD HIGHWAY GANTRY SIGNS (GST ROAD NH-45 & ECR SH-49)
  // Spanning across divided carriageways with bilingual Tamil + English
  // =============================================================
  const gantry1 = createTamilHighwayGantrySign(
    'சென்னை', 'CHENNAI', 118,
    'செங்கல்பட்டு', 'CHENGALPATTU', 28,
    'NH 45'
  );
  gantry1.position.set(0, 0, -280);
  roadsideGroup.add(gantry1);

  const gantry2 = createTamilHighwayGantrySign(
    'திருச்சி', 'TRICHY', 240,
    'விழுப்புரம்', 'VILLUPURAM', 85,
    'NH 45'
  );
  gantry2.position.set(0, 0, 320);
  roadsideGroup.add(gantry2);

  // =============================================================
  // 3. MONUMENTAL DRAVIDIAN TEMPLE GOPURAM LANDMARK (திருக்கோவில் கோபுரம்)
  // 5-Tiered pyramidal tower with 5 golden Kalasams & sacred striped walls
  // =============================================================
  const templeGopuram = createDravidianTempleGopuram();
  templeGopuram.position.set(42, 0, 260);
  templeGopuram.rotation.y = -Math.PI / 2;
  roadsideGroup.add(templeGopuram);

  obstacles.push({
    minX: 38,
    maxX: 46,
    minZ: 252,
    maxZ: 268,
    height: 12.0,
  });

  // Roadside Pillayar Shrine under sacred Peepal/Neem tree
  const roadsideShrine = createTamilRoadsideShrine();
  roadsideShrine.position.set(33.5, 0, -80);
  roadsideShrine.rotation.y = -Math.PI / 2;
  roadsideGroup.add(roadsideShrine);

  // Sacred Neem / Peepal tree arching over the shrine
  const sacredTree = createTamilCoconutTree();
  sacredTree.position.set(35.5, 0, -82);
  roadsideGroup.add(sacredTree);

  // =============================================================
  // 4. AUTHENTIC TAMIL BUS STOP SHELTERS (பேருந்து நிறுத்தம்)
  // With Tamil route boards, passenger seating benches, and timetables
  // =============================================================
  const busStop1 = createTamilBusStopShelter(
    'மாநகரப் பேருந்து நிறுத்தம்',
    'GST ROAD EXPRESS',
    ['123', '29C', '45A', 'M1']
  );
  busStop1.position.set(28.5, 0, -200);
  busStop1.rotation.y = -Math.PI / 2;
  roadsideGroup.add(busStop1);

  obstacles.push({
    minX: 26.5,
    maxX: 30.5,
    minZ: -204,
    maxZ: -196,
    height: 3.2,
  });

  const busStop2 = createTamilBusStopShelter(
    'கோயம்புத்தூர் சந்திப்பு பேருந்து நிறுத்தம்',
    'COIMBATORE BYPASS',
    ['102', '333', 'SETC-EXP']
  );
  busStop2.position.set(-28.5, 0, 180);
  busStop2.rotation.y = Math.PI / 2;
  roadsideGroup.add(busStop2);

  obstacles.push({
    minX: -30.5,
    maxX: -26.5,
    minZ: 176,
    maxZ: 184,
    height: 3.2,
  });

  // =============================================================
  // 5. TAMIL NADU TEA STALLS, FILTER COFFEE & BAKERIES
  // With brass samovars, bun butter jam, medu vada showcase, hanging bananas
  // =============================================================
  const teaStall1 = createTamilTeaStall(
    'மலர் டீ ஸ்டால் & பேக்கரி',
    'MALAR TEA & COFFEE STALL',
    'நாட்டு சர்க்கரை டீ • சுக்கு மல்லி காபி • பன் பட்டர் ஜாம் • மெது வடை'
  );
  teaStall1.position.set(34, 0, -270);
  teaStall1.rotation.y = Math.PI / 2;
  roadsideGroup.add(teaStall1);

  obstacles.push({
    minX: 31.5,
    maxX: 36.5,
    minZ: -272,
    maxZ: -268,
    height: 3.2,
  });

  const teaStall2 = createTamilTeaStall(
    'குமரன் ஃபில்டர் காபி & டிபன்',
    'KUMARAN FILTER COFFEE',
    '24X7 கும்பகோணம் டிகிரி காபி • மசால் வடை • சூடான பஜ்ஜி'
  );
  teaStall2.position.set(34, 0, 80);
  teaStall2.rotation.y = Math.PI / 2;
  roadsideGroup.add(teaStall2);

  obstacles.push({
    minX: 31.5,
    maxX: 36.5,
    minZ: 78,
    maxZ: 82,
    height: 3.2,
  });

  const teaStall3 = createTamilTeaStall(
    'மதுரை முனியாண்டி விலாஸ்',
    'MADURAI MUNIS BAVAN MESS',
    'பாரம்பரிய வாழை இலை சாப்பாடு • வீச்சு பரோட்டா • சுடச்சுட காபி'
  );
  teaStall3.position.set(190, 0, -68);
  roadsideGroup.add(teaStall3);

  obstacles.push({
    minX: 187.5,
    maxX: 192.5,
    minZ: -70,
    maxZ: -66,
    height: 3.2,
  });

  // =============================================================
  // 6. TAMIL NADU TYRE PUNCTURE & VULCANIZING WORKSHOPS
  // With bubble leak testing water tubs, air compressor & tyre stacks
  // =============================================================
  const tyreShop1 = createTamilTyreShop();
  tyreShop1.position.set(35, 0, 20);
  tyreShop1.rotation.y = Math.PI / 2;
  roadsideGroup.add(tyreShop1);

  obstacles.push({
    minX: 31,
    maxX: 39,
    minZ: 16,
    maxZ: 24,
    height: 3.8,
  });

  const tyreShop2 = createTamilTyreShop();
  tyreShop2.position.set(-140, 0, 532);
  roadsideGroup.add(tyreShop2);

  obstacles.push({
    minX: -144,
    maxX: -136,
    minZ: 528,
    maxZ: 536,
    height: 3.8,
  });

  // =============================================================
  // 7. ROADSIDE TENDER COCONUT STALLS (இளநீர் கடை)
  // With palm thatch canopy, green coconut pyramids, and cutting stump
  // =============================================================
  const coconutStall1 = createTamilTenderCoconutStall();
  coconutStall1.position.set(31.5, 0, -250);
  coconutStall1.rotation.y = 0.2;
  roadsideGroup.add(coconutStall1);

  const coconutStall2 = createTamilTenderCoconutStall();
  coconutStall2.position.set(31.5, 0, 110);
  coconutStall2.rotation.y = -0.3;
  roadsideGroup.add(coconutStall2);

  // =============================================================
  // 8. TAMIL NADU VEGETATION: COCONUT PALM GROVES & BANANA PLANTS
  // =============================================================
  // Coconut palm line along Highway drainage canal (x: 28 to 36m)
  for (let cz = -500; cz <= 500; cz += 45) {
    if (Math.abs(cz - -80) < 30 || Math.abs(cz - 260) < 35) continue;
    const palm = createTamilCoconutTree();
    palm.position.set(32 + (Math.random() - 0.5) * 4, 0, cz);
    roadsideGroup.add(palm);
  }

  // Banana plant groves near village road & farmlands
  for (let bz = -380; bz <= -340; bz += 8) {
    [-110, -130, -150].forEach((bx) => {
      const banana = createTamilBananaTree();
      banana.position.set(bx + (Math.random() - 0.5) * 3, 0, bz + (Math.random() - 0.5) * 3);
      roadsideGroup.add(banana);
    });
  }

  // =============================================================
  // 9. UTILITY POLES & OVERHEAD WIRES
  // =============================================================
  const poleGeo = new THREE.BoxGeometry(0.28, 8.8, 0.28);
  const armGeo = new THREE.BoxGeometry(2.6, 0.15, 0.15);
  const insulatorGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.18, 8);
  const insulatorMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.3 });
  const transformerMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.75, roughness: 0.35 });

  const servicePoleZCoords: number[] = [];

  for (let pz = -600; pz <= 600; pz += 50) {
    if (Math.abs(pz - -80) < 25) continue;
    servicePoleZCoords.push(pz);

    const poleGroup = new THREE.Group();
    poleGroup.position.set(30.2, 0, pz);
    roadsideGroup.add(poleGroup);

    const pole = new THREE.Mesh(poleGeo, concreteMat);
    pole.position.y = 4.4;
    pole.castShadow = true;
    poleGroup.add(pole);

    const crossArm1 = new THREE.Mesh(armGeo, concreteMat);
    crossArm1.position.set(0, 8.4, 0);
    poleGroup.add(crossArm1);

    const crossArm2 = new THREE.Mesh(armGeo, concreteMat);
    crossArm2.position.set(0, 7.0, 0);
    poleGroup.add(crossArm2);

    [-1.1, 0, 1.1].forEach((ix) => {
      const ins1 = new THREE.Mesh(insulatorGeo, insulatorMat);
      ins1.position.set(ix, 8.55, 0);
      poleGroup.add(ins1);

      const ins2 = new THREE.Mesh(insulatorGeo, insulatorMat);
      ins2.position.set(ix, 7.15, 0);
      poleGroup.add(ins2);
    });

    if (pz === -200 || pz === 150) {
      const trans = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.4, 0.9), transformerMat);
      trans.position.set(0, 5.6, 0.55);
      trans.castShadow = true;
      poleGroup.add(trans);
    }
  }

  // Continuous catenary power line cables
  for (let i = 0; i < servicePoleZCoords.length - 1; i++) {
    const z1 = servicePoleZCoords[i];
    const z2 = servicePoleZCoords[i + 1];
    if (z2 - z1 > 60) continue;

    const wireOffsets = [
      { x: -1.1, y: 8.52 },
      { x: 0.0, y: 8.52 },
      { x: 1.1, y: 8.52 },
      { x: -0.7, y: 7.15 },
      { x: 0.7, y: 7.15 },
    ];

    wireOffsets.forEach((off) => {
      const wirePoints: THREE.Vector3[] = [];
      const steps = 12;
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const wz = z1 + (z2 - z1) * t;
        const sag = Math.sin(t * Math.PI) * 0.6;
        wirePoints.push(new THREE.Vector3(30.2 + off.x, off.y - sag, wz));
      }
      const wireGeo = new THREE.BufferGeometry().setFromPoints(wirePoints);
      const wire = new THREE.Line(wireGeo, wireMat);
      roadsideGroup.add(wire);
    });
  }

  // =============================================================
  // 10. TAMIL NADU BILINGUAL HIGHWAY CAUTION & SAFETY SIGNS
  // =============================================================
  const cautionSigns = [
    { x: 15.2, z: -160, t1: 'வேகத்தடை', t2: 'SPEED BREAKER' },
    { x: -15.2, z: 120, t1: 'விபத்துப் பகுதி', t2: 'ACCIDENT ZONE' },
    { x: 15.2, z: 360, t1: 'சுங்கச்சாவடி', t2: 'TOLL PLAZA 1 KM' },
    { x: -50, z: -374, t1: 'வளைவு / ஒலி எழுப்புக', t2: 'SHARP CURVE' },
  ];

  cautionSigns.forEach((cs) => {
    const sGroup = new THREE.Group();
    sGroup.position.set(cs.x, 0, cs.z);
    roadsideGroup.add(sGroup);

    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.6, 8), metalSheetMat);
    post.position.y = 1.3;
    sGroup.add(post);

    const signBoard = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 0.85, 0.04),
      new THREE.MeshStandardMaterial({ map: createTamilCautionSignTexture(cs.t1, cs.t2) })
    );
    signBoard.position.y = 2.2;
    sGroup.add(signBoard);
  });

  // =============================================================
  // 11. TAMIL NADU HIGHWAY STEEL TRUSS ADVERTISING BILLBOARDS
  // =============================================================
  const billboardsData = [
    {
      x: -32,
      z: -320,
      rotY: 0.25,
      tTitle: 'மதுரை முனியாண்டி விலாஸ்',
      eTitle: 'MADURAI MUNIS BAVAN',
      sub: 'பாரம்பரிய வாழை இலை சாப்பாடு • பரோட்டா • 24 மணி நேரமும் திறந்திருக்கும்',
    },
    {
      x: 38,
      z: 200,
      rotY: -0.2,
      tTitle: 'ஸ்ரீ குமரன் சில்க்ஸ் & டெக்ஸ்டைல்ஸ்',
      eTitle: 'SRI KUMARAN SILKS & TEXTILES',
      sub: 'காஞ்சிபுரம் பட்டு • திருமண ஆடைகள் • சென்னை • கோவை • மதுரை',
    },
    {
      x: -32,
      z: 460,
      rotY: 0.15,
      tTitle: 'தமிழ்நாடு காவல் துறை',
      eTitle: 'TAMIL NADU POLICE: WEAR HELMET',
      sub: 'விபத்தில்லா தமிழ்நாடு • தலைக்கவசம் அணிவோம் • உயிரைக் காப்போம்',
    },
  ];

  billboardsData.forEach((bb) => {
    const bGroup = new THREE.Group();
    bGroup.position.set(bb.x, 0, bb.z);
    bGroup.rotation.y = bb.rotY;
    roadsideGroup.add(bGroup);

    [-5.5, 5.5].forEach((colX) => {
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 12, 12), metalSheetMat);
      c.position.set(colX, 6.0, 0);
      bGroup.add(c);
    });

    const boardTex = createTamilStoreSignTexture(bb.tTitle, bb.eTitle, bb.sub, '#1e3a8a', '#ffffff');
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(13.8, 4.4, 0.35),
      new THREE.MeshStandardMaterial({ map: boardTex, roughness: 0.4 })
    );
    board.position.set(0, 11.5, 0.2);
    bGroup.add(board);
  });

  // =============================================================
  // 12. TAMIL NADU PROVISION STORE & AYYANGAR BAKERY
  // =============================================================
  // "ஸ்ரீ அம்மன் மளிகைக் கடை" (at x: 36m, z: -350m)
  const kiranaGroup = new THREE.Group();
  kiranaGroup.position.set(36, 0, -350);
  kiranaGroup.rotation.y = Math.PI / 2;
  roadsideGroup.add(kiranaGroup);

  const kiranaBuilding = new THREE.Mesh(
    new THREE.BoxGeometry(7.5, 3.8, 5.5),
    new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.8 })
  );
  kiranaBuilding.position.set(0, 1.9, 0);
  kiranaBuilding.castShadow = true;
  kiranaGroup.add(kiranaBuilding);

  const shutter = new THREE.Mesh(new THREE.BoxGeometry(5.2, 2.4, 0.1), new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.7 }));
  shutter.position.set(0, 1.9, 2.76);
  kiranaGroup.add(shutter);

  const kiranaSignTex = createTamilStoreSignTexture(
    'ஸ்ரீ அம்மன் மளிகைக் கடை',
    'SRI AMMAN PROVISIONS',
    'பொன்னி அரிசி • பருப்பு வகைகள் • நல்லெண்ணெய் • வீட்டு மளிகை',
    '#dc2626'
  );
  const kiranaSign = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.9, 0.1), new THREE.MeshStandardMaterial({ map: kiranaSignTex }));
  kiranaSign.position.set(0, 3.4, 2.85);
  kiranaGroup.add(kiranaSign);

  // "அய்யங்கார் பேக்கரி & ஸ்வீட்ஸ்" (at x: 36m, z: -210m)
  const sweetGroup = new THREE.Group();
  sweetGroup.position.set(36, 0, -210);
  sweetGroup.rotation.y = Math.PI / 2;
  roadsideGroup.add(sweetGroup);

  const sweetBuilding = new THREE.Mesh(
    new THREE.BoxGeometry(6.5, 3.6, 5.0),
    new THREE.MeshStandardMaterial({ color: 0xfbcfe8, roughness: 0.75 })
  );
  sweetBuilding.position.set(0, 1.8, 0);
  sweetGroup.add(sweetBuilding);

  const sweetSignTex = createTamilStoreSignTexture(
    'அய்யங்கார் பேக்கரி & ஸ்வீட்ஸ்',
    'IYENGAR BAKERY & SWEETS',
    'ஸ்பெஷல் வெஜ் பஃப் • மஸ்கோத் அல்வா • ஜாங்கிரி • சுடச்சுட சமோசா',
    '#b91c1c'
  );
  const sweetSign = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.85, 0.1), new THREE.MeshStandardMaterial({ map: sweetSignTex }));
  sweetSign.position.set(0, 3.3, 2.58);
  sweetGroup.add(sweetSign);

  // =============================================================
  // 13. PARKED TAMIL NADU AUTO-RICKSHAW & COMMUTER BIKES
  // =============================================================
  const parkedRickshaws = [
    { x: 31.5, z: -70, rotY: 0.15 },
    { x: 31.8, z: -64, rotY: 0.22 },
    { x: 312, z: -45, rotY: Math.PI / 2 },
    { x: 36, z: -128, rotY: -0.3 },
  ];

  const rickshawYellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 });
  const rickshawRoofMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.9 });

  parkedRickshaws.forEach((pr) => {
    const rick = new THREE.Group();
    rick.position.set(pr.x, 0, pr.z);
    rick.rotation.y = pr.rotY;
    roadsideGroup.add(rick);

    const body = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.5, 2.4), rickshawYellowMat);
    body.position.set(0, 0.4, 0);
    body.castShadow = true;
    rick.add(body);

    const nose = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.48, 0.85), rickshawYellowMat);
    nose.position.set(0, 0.62, 0.8);
    nose.rotation.x = 0.22;
    rick.add(nose);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.07, 2.0), rickshawRoofMat);
    roof.position.set(0, 1.65, -0.2);
    rick.add(roof);

    const spare = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.06, 8, 16), tireRubberMat);
    spare.position.set(0, 0.72, -1.22);
    rick.add(spare);
  });

  // =============================================================
  // 14. PARKED TATA ACE ("குட்டி யானை") DELIVERY MINI TRUCK
  // =============================================================
  const parkedTempo = new THREE.Group();
  parkedTempo.position.set(32, 0, -342);
  parkedTempo.rotation.y = 0.18;
  roadsideGroup.add(parkedTempo);

  const tempoMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 });
  const tempoCab = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.5, 1.4), tempoMat);
  tempoCab.position.set(0, 1.05, 1.2);
  tempoCab.castShadow = true;
  parkedTempo.add(tempoCab);

  const tempoBed = new THREE.Mesh(
    new THREE.BoxGeometry(1.65, 0.6, 2.4),
    new THREE.MeshStandardMaterial({ color: 0x1d4ed8 })
  );
  tempoBed.position.set(0, 0.75, -0.6);
  tempoBed.castShadow = true;
  parkedTempo.add(tempoBed);

  // =============================================================
  // 15. ROOFTOP SINTEX WATER TANKS & DISH ANTENNAS ON BUILDINGS
  // =============================================================
  const sintexMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.8 });
  const dishMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });

  for (let bx = 80; bx <= 420; bx += 55) {
    [-1, 1].forEach((side) => {
      const roofY = 32;
      const rz = -80 + side * 30;

      const stand = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.4, 1.6), concreteMat);
      stand.position.set(bx - 3, roofY + 0.2, rz - 2);
      roadsideGroup.add(stand);

      const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 1.5, 14), sintexMat);
      tank.position.set(bx - 3, roofY + 1.15, rz - 2);
      roadsideGroup.add(tank);

      const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.45, 0.08, 12), dishMat);
      dish.position.set(bx + 4, roofY + 0.9, rz + 4);
      dish.rotation.x = 0.55;
      dish.rotation.y = 0.3;
      roadsideGroup.add(dish);
    });
  }
}
