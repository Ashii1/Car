import * as THREE from 'three';
import { TrackData, WeatherType } from '../types/game';

export interface TrackPoint {
  position: THREE.Vector3;
  tangent: THREE.Vector3;
  normal: THREE.Vector3;
  binormal: THREE.Vector3;
  curvature: number;
}

export interface TrackWorld {
  curve: THREE.CatmullRomCurve3;
  totalLength: number;
  roadMesh: THREE.Mesh;
  curbsMesh: THREE.Mesh;
  guardrailsMesh: THREE.Mesh;
  environmentGroup: THREE.Group;
  trackPoints2D: { x: number; y: number }[]; // 2D points for minimap
  rainParticles?: THREE.Points;
  updateEnvironment: (time: number, cameraPos: THREE.Vector3) => void;
  getTrackPointAtProgress: (distance: number) => TrackPoint;
  dispose: () => void;
}

// Generates high-res photorealistic asphalt texture with racing groove, lane lines, and rubber marks
function createRealisticRoadTexture(isRain: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // 1. Dark aged asphalt base
  ctx.fillStyle = isRain ? '#12141a' : '#1f232b';
  ctx.fillRect(0, 0, 1024, 1024);

  // 2. High-density asphalt aggregate gravel noise
  for (let i = 0; i < 15000; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const size = 1 + Math.random() * 2;
    const shade = isRain
      ? Math.random() > 0.5 ? '#1a1d24' : '#0d0f14'
      : Math.random() > 0.5 ? '#2b303b' : '#161920';
    ctx.fillStyle = shade;
    ctx.fillRect(x, y, size, size);
  }

  // 3. Dark rubbered-in racing groove down the center/driving line
  const grooveGrad = ctx.createLinearGradient(0, 0, 1024, 0);
  grooveGrad.addColorStop(0, 'rgba(0,0,0,0)');
  grooveGrad.addColorStop(0.25, 'rgba(10,12,16,0.3)');
  grooveGrad.addColorStop(0.5, 'rgba(5,6,8,0.5)');
  grooveGrad.addColorStop(0.75, 'rgba(10,12,16,0.3)');
  grooveGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grooveGrad;
  ctx.fillRect(0, 0, 1024, 1024);

  // 4. Heavy rubber tire skid marks (braking zones)
  for (let s = 0; s < 4; s++) {
    const yStart = 100 + s * 240;
    ctx.strokeStyle = 'rgba(10, 12, 16, 0.45)';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(320 + (s % 2) * 40, yStart);
    ctx.lineTo(320 + (s % 2) * 40, yStart + 90);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(680 - (s % 2) * 40, yStart + 20);
    ctx.lineTo(680 - (s % 2) * 40, yStart + 110);
    ctx.stroke();
  }

  // 5. White track edge boundary lines (continuous solid reflective paint)
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(40, 0, 14, 1024);
  ctx.fillRect(970, 0, 14, 1024);

  // 6. Dashed lane divider lines with reflective road glass beads
  ctx.fillStyle = '#f1c40f'; // Bright golden lane markings
  for (let y = 0; y < 1024; y += 128) {
    ctx.fillRect(350, y, 8, 70);
    ctx.fillRect(664, y, 8, 70);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 140);
  tex.anisotropy = 16;
  return tex;
}

export function buildTrack(trackData: TrackData, weather: WeatherType): TrackWorld {
  const environmentGroup = new THREE.Group();
  const isRain = weather === 'rain' || weather === 'nightRain';

  // 1. Generate 3D track control points with natural elevation and corner flow
  const controlPoints: THREE.Vector3[] = [];

  if (trackData.environment === 'coastal') {
    // Seaside highway with dramatic cliffs and ocean sweeps
    controlPoints.push(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(140, 2, 290),
      new THREE.Vector3(340, 9, 490),
      new THREE.Vector3(560, 16, 370),
      new THREE.Vector3(700, 18, 140),
      new THREE.Vector3(630, 11, -190),
      new THREE.Vector3(440, 4, -430),
      new THREE.Vector3(160, 0, -570),
      new THREE.Vector3(-140, 4, -490),
      new THREE.Vector3(-380, 11, -290),
      new THREE.Vector3(-430, 6, 20),
      new THREE.Vector3(-240, 2, 230)
    );
  } else if (trackData.environment === 'mountain') {
    // Mountain Pass: dramatic elevation, hairpin switchbacks
    controlPoints.push(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(90, 18, 240),
      new THREE.Vector3(180, 42, 190), // Hairpin 1
      new THREE.Vector3(130, 60, 390),
      new THREE.Vector3(290, 80, 490),
      new THREE.Vector3(440, 96, 350), // Hairpin 2
      new THREE.Vector3(370, 72, 130),
      new THREE.Vector3(490, 52, -150),
      new THREE.Vector3(330, 35, -390),
      new THREE.Vector3(150, 20, -490),
      new THREE.Vector3(-170, 9, -430),
      new THREE.Vector3(-290, 3, -190)
    );
  } else if (trackData.environment === 'city') {
    // City Circuit: 90-degree corners, highway overpasses, downtown tunnels
    controlPoints.push(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 340),
      new THREE.Vector3(190, 0, 470),
      new THREE.Vector3(400, 2, 470),
      new THREE.Vector3(540, 0, 310),
      new THREE.Vector3(540, 0, -90),
      new THREE.Vector3(350, -3, -290),
      new THREE.Vector3(130, 0, -450),
      new THREE.Vector3(-190, 0, -450),
      new THREE.Vector3(-370, 4, -230),
      new THREE.Vector3(-370, 0, 80),
      new THREE.Vector3(-190, 0, 210)
    );
  } else if (trackData.environment === 'desert') {
    // Desert Highway: long drafting straights, canyon sweeps
    controlPoints.push(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(90, 3, 390),
      new THREE.Vector3(280, 9, 720),
      new THREE.Vector3(540, 6, 640),
      new THREE.Vector3(700, 3, 290),
      new THREE.Vector3(780, 4, -190),
      new THREE.Vector3(570, 9, -590),
      new THREE.Vector3(230, 4, -730),
      new THREE.Vector3(-190, 2, -550),
      new THREE.Vector3(-390, 7, -250),
      new THREE.Vector3(-330, 2, 150)
    );
  } else {
    // Night Rain Circuit: Tokyo expressway style
    controlPoints.push(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(70, 0, 260),
      new THREE.Vector3(240, 0, 400),
      new THREE.Vector3(400, 0, 330),
      new THREE.Vector3(460, 0, 150),
      new THREE.Vector3(370, 0, -130),
      new THREE.Vector3(470, 0, -330),
      new THREE.Vector3(290, 0, -490),
      new THREE.Vector3(70, 0, -470),
      new THREE.Vector3(-190, 0, -330),
      new THREE.Vector3(-290, 0, -90),
      new THREE.Vector3(-190, 0, 170)
    );
  }

  const curve = new THREE.CatmullRomCurve3(controlPoints, true, 'centripetal', 0.5);
  const totalLength = curve.getLength();

  // Extract 2D points for HUD Minimap
  const minimapSamples = 100;
  const trackPoints2D: { x: number; y: number }[] = [];
  for (let m = 0; m < minimapSamples; m++) {
    const pt = curve.getPointAt(m / minimapSamples);
    trackPoints2D.push({ x: pt.x, y: pt.z });
  }

  // 2. Generate Road Mesh Geometry with Corner Banking (Camber)
  const segments = 500;
  const roadWidth = 14.5;
  const roadVerts: number[] = [];
  const roadNormals: number[] = [];
  const roadUvs: number[] = [];
  const roadIndices: number[] = [];

  const curbVerts: number[] = [];
  const curbIndices: number[] = [];
  const curbColors: number[] = [];

  const guardVerts: number[] = [];
  const guardIndices: number[] = [];

  const points = curve.getSpacedPoints(segments);

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const pt = points[i % segments];
    const tangent = curve.getTangentAt(t).normalize();
    const up = new THREE.Vector3(0, 1, 0);

    // Compute curvature for banking (turns tilt inwards by up to 0.12 radians)
    const nextT = (t + 0.01) % 1.0;
    const nextTangent = curve.getTangentAt(nextT).normalize();
    const cross = new THREE.Vector3().crossVectors(tangent, nextTangent);
    const turnBanking = Math.max(-0.12, Math.min(0.12, cross.y * 14));

    // Banked normal & binormal vectors
    const baseBinormal = new THREE.Vector3().crossVectors(tangent, up).normalize();
    const bankedUp = up.clone().applyAxisAngle(tangent, turnBanking);
    const bankedBinormal = new THREE.Vector3().crossVectors(tangent, bankedUp).normalize();

    // Road left & right vertices
    const leftPt = pt.clone().addScaledVector(bankedBinormal, -roadWidth / 2);
    const rightPt = pt.clone().addScaledVector(bankedBinormal, roadWidth / 2);

    roadVerts.push(leftPt.x, leftPt.y, leftPt.z);
    roadVerts.push(rightPt.x, rightPt.y, rightPt.z);

    roadNormals.push(bankedUp.x, bankedUp.y, bankedUp.z);
    roadNormals.push(bankedUp.x, bankedUp.y, bankedUp.z);

    roadUvs.push(0, t * 140, 1, t * 140);

    if (i < segments) {
      const idx = i * 2;
      roadIndices.push(idx, idx + 1, idx + 2);
      roadIndices.push(idx + 1, idx + 3, idx + 2);
    }

    // 3D Raised Beveled Kerbs (Red & White alternating rumble strips)
    const curbW = 0.95;
    const curbH = 0.12;
    const isRed = Math.floor(t * 220) % 2 === 0;
    const rC = isRed ? 0.95 : 0.95;
    const gC = isRed ? 0.05 : 0.95;
    const bC = isRed ? 0.05 : 0.95;

    // Left Kerb
    const curbLOuter = leftPt.clone().addScaledVector(bankedBinormal, -curbW);
    curbVerts.push(leftPt.x, leftPt.y + curbH, leftPt.z);
    curbVerts.push(curbLOuter.x, curbLOuter.y + 0.02, curbLOuter.z);
    curbColors.push(rC, gC, bC, rC, gC, bC);

    // Right Kerb
    const curbROuter = rightPt.clone().addScaledVector(bankedBinormal, curbW);
    curbVerts.push(rightPt.x, rightPt.y + curbH, rightPt.z);
    curbVerts.push(curbROuter.x, curbROuter.y + 0.02, curbROuter.z);
    curbColors.push(rC, gC, bC, rC, gC, bC);

    if (i < segments) {
      const cIdx = i * 4;
      curbIndices.push(cIdx, cIdx + 1, cIdx + 4);
      curbIndices.push(cIdx + 1, cIdx + 5, cIdx + 4);

      curbIndices.push(cIdx + 2, cIdx + 3, cIdx + 6);
      curbIndices.push(cIdx + 3, cIdx + 7, cIdx + 6);
    }

    // Real Steel 3-Wave Guardrail Crash Barriers
    const gOffset = 1.35;
    const gH = 0.9;
    const gLeft = leftPt.clone().addScaledVector(bankedBinormal, -gOffset);
    const gRight = rightPt.clone().addScaledVector(bankedBinormal, gOffset);

    guardVerts.push(gLeft.x, gLeft.y, gLeft.z);
    guardVerts.push(gLeft.x, gLeft.y + gH, gLeft.z);
    guardVerts.push(gRight.x, gRight.y, gRight.z);
    guardVerts.push(gRight.x, gRight.y + gH, gRight.z);

    if (i < segments) {
      const gIdx = i * 4;
      guardIndices.push(gIdx, gIdx + 1, gIdx + 4);
      guardIndices.push(gIdx + 1, gIdx + 5, gIdx + 4);

      guardIndices.push(gIdx + 2, gIdx + 3, gIdx + 6);
      guardIndices.push(gIdx + 3, gIdx + 7, gIdx + 6);
    }
  }

  // Road Mesh
  const roadTex = createRealisticRoadTexture(isRain);
  const roadGeo = new THREE.BufferGeometry();
  roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadVerts, 3));
  roadGeo.setAttribute('normal', new THREE.Float32BufferAttribute(roadNormals, 3));
  roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(roadUvs, 2));
  roadGeo.setIndex(roadIndices);

  const roadMat = new THREE.MeshStandardMaterial({
    map: roadTex,
    roughness: isRain ? 0.08 : 0.65,
    metalness: isRain ? 0.45 : 0.05,
    envMapIntensity: isRain ? 2.0 : 0.8,
  });
  const roadMesh = new THREE.Mesh(roadGeo, roadMat);
  roadMesh.receiveShadow = true;
  environmentGroup.add(roadMesh);

  // Curbs Mesh
  const curbGeo = new THREE.BufferGeometry();
  curbGeo.setAttribute('position', new THREE.Float32BufferAttribute(curbVerts, 3));
  curbGeo.setAttribute('color', new THREE.Float32BufferAttribute(curbColors, 3));
  curbGeo.setIndex(curbIndices);
  curbGeo.computeVertexNormals();

  const curbMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.4,
    metalness: 0.1,
  });
  const curbsMesh = new THREE.Mesh(curbGeo, curbMat);
  environmentGroup.add(curbsMesh);

  // Guardrails Mesh
  const guardGeo = new THREE.BufferGeometry();
  guardGeo.setAttribute('position', new THREE.Float32BufferAttribute(guardVerts, 3));
  guardGeo.setIndex(guardIndices);
  guardGeo.computeVertexNormals();

  const guardMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.88,
    roughness: 0.25,
  });
  const guardrailsMesh = new THREE.Mesh(guardGeo, guardMat);
  guardrailsMesh.castShadow = true;
  environmentGroup.add(guardrailsMesh);

  // Support posts for guardrails every 6 segments
  const postGeo = new THREE.BoxGeometry(0.12, 1.1, 0.12);
  const postMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.4 });
  for (let p = 0; p < segments; p += 6) {
    const t = p / segments;
    const pt = points[p % segments];
    const tangent = curve.getTangentAt(t).normalize();
    const binormal = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();

    const postL = new THREE.Mesh(postGeo, postMat);
    postL.position.copy(pt).addScaledVector(binormal, -roadWidth / 2 - 1.35);
    postL.position.y += 0.55;
    environmentGroup.add(postL);

    const postR = new THREE.Mesh(postGeo, postMat);
    postR.position.copy(pt).addScaledVector(binormal, roadWidth / 2 + 1.35);
    postR.position.y += 0.55;
    environmentGroup.add(postR);
  }

  // Start / Finish Gantry Arch with Race Lights & Checkered Pattern
  const startPt = curve.getPointAt(0);
  const startTangent = curve.getTangentAt(0).normalize();
  const gantryGroup = new THREE.Group();
  gantryGroup.position.copy(startPt);
  gantryGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), startTangent);

  const gantryMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.8, roughness: 0.25 });
  const pL = new THREE.Mesh(new THREE.BoxGeometry(0.9, 9, 0.9), gantryMat);
  pL.position.set(-roadWidth / 2 - 1.4, 4.5, 0);
  gantryGroup.add(pL);

  const pR = new THREE.Mesh(new THREE.BoxGeometry(0.9, 9, 0.9), gantryMat);
  pR.position.set(roadWidth / 2 + 1.4, 4.5, 0);
  gantryGroup.add(pR);

  const beam = new THREE.Mesh(new THREE.BoxGeometry(roadWidth + 3.8, 1.5, 1.4), gantryMat);
  beam.position.set(0, 8.2, 0);
  gantryGroup.add(beam);

  // Digital Start Lights Display
  for (let l = 0; l < 5; l++) {
    const lightMesh = new THREE.Mesh(
      new THREE.CircleGeometry(0.24, 16),
      new THREE.MeshBasicMaterial({ color: 0xff1e1e })
    );
    lightMesh.position.set(-2.2 + l * 1.1, 7.8, 0.72);
    gantryGroup.add(lightMesh);
  }

  // Checkered finish line on tarmac
  const finishLineMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(roadWidth, 2.0),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  finishLineMesh.rotateX(-Math.PI / 2);
  finishLineMesh.position.set(0, 0.04, 0);
  gantryGroup.add(finishLineMesh);

  environmentGroup.add(gantryGroup);

  // Rain Particle System
  let rainParticles: THREE.Points | undefined;
  if (isRain) {
    const rainCount = 4500;
    const rainGeo = new THREE.BufferGeometry();
    const rainPos = new Float32Array(rainCount * 3);
    for (let r = 0; r < rainCount * 3; r += 3) {
      rainPos[r] = (Math.random() - 0.5) * 140;
      rainPos[r + 1] = Math.random() * 60;
      rainPos[r + 2] = (Math.random() - 0.5) * 140;
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.35,
      transparent: true,
      opacity: 0.65,
    });
    rainParticles = new THREE.Points(rainGeo, rainMat);
    environmentGroup.add(rainParticles);
  }

  // Distance Marker Brake Boards (150m, 100m, 50m) before corners
  const boardMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.3 });
  const textMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
  for (let b = 0; b < segments; b += 80) {
    const t = b / segments;
    const pt = points[b % segments];
    const tangent = curve.getTangentAt(t).normalize();
    const binormal = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();

    const board = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.2, 0.8), boardMat);
    board.position.copy(pt).addScaledVector(binormal, -roadWidth / 2 - 2.2);
    board.position.y += 1.4;
    board.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
    environmentGroup.add(board);
  }

  const getTrackPointAtProgress = (distance: number): TrackPoint => {
    let u = (distance % totalLength) / totalLength;
    if (u < 0) u += 1.0;

    const position = curve.getPointAt(u);
    const tangent = curve.getTangentAt(u).normalize();
    const normal = new THREE.Vector3(0, 1, 0);
    const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();

    const aheadU = (u + 0.01) % 1.0;
    const aheadTangent = curve.getTangentAt(aheadU).normalize();
    const curvature = tangent.angleTo(aheadTangent) * 100;

    return {
      position,
      tangent,
      normal,
      binormal,
      curvature,
    };
  };

  const updateEnvironment = (_time: number, cameraPos: THREE.Vector3) => {
    if (rainParticles) {
      rainParticles.position.set(cameraPos.x, 0, cameraPos.z);
      const pos = rainParticles.geometry.attributes.position.array as Float32Array;
      for (let i = 1; i < pos.length; i += 3) {
        pos[i] -= 2.0;
        if (pos[i] < 0) pos[i] = 55;
      }
      rainParticles.geometry.attributes.position.needsUpdate = true;
    }
  };

  const dispose = () => {
    roadTex.dispose();
    environmentGroup.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const m = obj as THREE.Mesh;
        m.geometry?.dispose();
        if (Array.isArray(m.material)) m.material.forEach((mat) => mat.dispose());
        else m.material?.dispose();
      }
    });
  };

  return {
    curve,
    totalLength,
    roadMesh,
    curbsMesh,
    guardrailsMesh,
    environmentGroup,
    trackPoints2D,
    rainParticles,
    updateEnvironment,
    getTrackPointAtProgress,
    dispose,
  };
}
