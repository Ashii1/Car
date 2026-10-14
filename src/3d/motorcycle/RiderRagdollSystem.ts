import * as THREE from 'three';
import { CityWorldInstance } from '../CityWorldBuilder';

// ============================================================================
// AAA PRODUCTION-GRADE RIGGED 3D HUMAN MALE ATHLETE & MOTORCYCLE RIDER
// - Realistic 1.78m adult human anatomy: Skull, jaw, nose, 3D eyes, ears, neck,
//   clavicles, ribcage, abdomen, gluteals, quads, calves, ankles, feet, living hands.
// - Smooth organic joints with anatomical elbow caps (olecranon) & knee caps (patella)
//   eliminating gaps, polygonal breakage, and mechanical robot angles.
// - Physically Based Materials (PBR) with warm subsurface capillary sheen, micro-texture,
//   and realistic clothing fabrics (Leather, Denim, Cotton, Chinos).
// - Photorealistic 3D Eyeballs with hazel-amber iris, pupil, wet reflective cornea dome,
//   and articulated eyelids that blink biologically.
// - Real motorcycle riding behaviour blended with bike physics: Acceleration tuck,
//   braking brace, cornering hang-off with inside knee flare, vestibulo-ocular horizon level,
//   and kickstand foot-down at low speeds.
// - Biomechanical On-Foot Locomotion: Heel-to-toe stride with ankle flex, dual vertical bob,
//   Trendelenburg pelvic tilt, spine counter-rotation, and relaxed opposing arm swing.
// - Natural Human Idle: Contrapposto asymmetric weight-shift between legs, rhythmic breathing,
//   autonomous eye saccades, and environmental head glances.
// ============================================================================

export type RiderPhysicsState = 'SEATED' | 'ON_FOOT' | 'MOUNTING' | 'DISMOUNTING' | 'CRASHING' | 'SLIDING' | 'REST' | 'RECOVERING';
export type DressingStyle =
  | 'biker_leather'
  | 'asphalt_racer'
  | 'urban_streetwear'
  | 'pant_shirt_casual'
  | 'pant_shirt_white'
  | 'pant_shirt_navy'
  | 'pant_shirt_black'
  | 'traditional_tamil'
  | 'casual_streetwear';

export interface RiggedRiderInstance {
  group: THREE.Group;
  hipsGroup: THREE.Group;
  torsoGroup: THREE.Group;
  headGroup: THREE.Group;
  leftArmGroup: THREE.Group;
  leftElbowGroup: THREE.Group;
  rightArmGroup: THREE.Group;
  rightElbowGroup: THREE.Group;
  leftLegGroup: THREE.Group;
  leftKneeGroup: THREE.Group;
  rightLegGroup: THREE.Group;
  rightKneeGroup: THREE.Group;
  leftHandGroup: THREE.Group;
  rightHandGroup: THREE.Group;
  leftBootGroup: THREE.Group;
  rightBootGroup: THREE.Group;
  state: RiderPhysicsState;
  isRagdollActive: boolean;
  isOnFoot: boolean;
  dressingStyle: DressingStyle;
  isHelmetVisible: boolean;
  setHelmetVisible: (visible: boolean) => void;
  toggleHelmet: () => boolean;
  setDressingStyle: (style: DressingStyle) => void;
  setVisible: (visible: boolean) => void;
  setOnFoot: (active: boolean, worldPos?: THREE.Vector3, heading?: number) => void;
  triggerCrash: (initialVelocity: THREE.Vector3, worldPos: THREE.Vector3, heading: number) => void;
  resetToSeated: () => void;
  animateMountTransition: (type: 'MOUNTING' | 'DISMOUNTING', progress: number) => void;
  solveIK: (
    leftGripWorld: THREE.Vector3,
    rightGripWorld: THREE.Vector3,
    leftPegWorld: THREE.Vector3,
    rightPegWorld: THREE.Vector3
  ) => void;
  update: (
    delta: number,
    bikeSpeed: number,
    steerInput: number,
    leanAngle: number,
    isBraking: boolean,
    isKickstand: boolean,
    world?: CityWorldInstance,
    onFootParams?: {
      isMoving: boolean;
      moveSpeed: number;
      steer: number;
      isSprinting: boolean;
    }
  ) => void;
  dispose: () => void;
}

// ============================================================================
// CACHED HIGH-FIDELITY PROCEDURAL PBR TEXTURES
// ============================================================================
const textureCache = new Map<string, THREE.CanvasTexture>();

function getOrCreateTexture(key: string, generator: () => HTMLCanvasElement): THREE.CanvasTexture {
  if (textureCache.has(key)) return textureCache.get(key)!;
  if (typeof document === 'undefined') return new THREE.CanvasTexture({} as any);

  const canvas = generator();
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  textureCache.set(key, texture);
  return texture;
}

/**
 * 1. PHOTOREALISTIC HUMAN MALE FACE DIFFUSE TEXTURE (1024x1024)
 * Natural South Indian / warm Mediterranean healthy adult complexion
 */
function getRealisticManFaceTexture(): THREE.CanvasTexture {
  return getOrCreateTexture('male_face_pbr_v4', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // 1. Healthy, handsome warm athletic masculine skin tone base
    const baseGrad = ctx.createLinearGradient(0, 0, 0, 1024);
    baseGrad.addColorStop(0.0, '#ba8257'); // Forehead / cranial
    baseGrad.addColorStop(0.25, '#c78d62');
    baseGrad.addColorStop(0.55, '#be8358'); // Mid-face
    baseGrad.addColorStop(0.85, '#ae734a'); // Jawline
    baseGrad.addColorStop(1.0, '#985e37'); // Neck base
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, 1024, 1024);

    // 2. Micro-cellular biological skin noise (pores, fine melanin texture)
    const imgData = ctx.getImageData(0, 0, 1024, 1024);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 8.0;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise * 0.85));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise * 0.70));
    }
    ctx.putImageData(imgData, 0, 0);

    // 3. Subsurface vascular warmth (Cheeks, nose bridge, temple warmth)
    const drawWarmth = (cx: number, cy: number, rx: number, ry: number, color: string) => {
      const g = ctx.createRadialGradient(cx, cy, 10, cx, cy, Math.max(rx, ry));
      g.addColorStop(0.0, color);
      g.addColorStop(1.0, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    };

    drawWarmth(385, 490, 95, 75, 'rgba(215, 96, 76, 0.22)'); // Right cheek (in UV)
    drawWarmth(639, 490, 95, 75, 'rgba(215, 96, 76, 0.22)'); // Left cheek (in UV)
    drawWarmth(512, 495, 45, 50, 'rgba(220, 105, 82, 0.24)'); // Nose bridge & tip
    drawWarmth(512, 330, 140, 60, 'rgba(210, 115, 75, 0.14)'); // Forehead

    // 4. Natural Masculine Eyebrows (Thick, feathered, anatomically aligned above sockets)
    const drawEyebrow = (startX: number, endX: number, cy: number, isRightEye: boolean) => {
      ctx.save();
      ctx.strokeStyle = '#181517';
      const steps = 70;
      for (let i = 0; i < steps; i++) {
        const t = i / steps;
        const x = startX + (endX - startX) * t;
        const arch = Math.sin(t * Math.PI) * 14;
        const y = cy - arch;
        const hairLen = 14 + Math.sin(t * Math.PI) * 6;
        const angle = isRightEye ? -0.38 + t * 0.55 : 0.38 - t * 0.55;
        ctx.lineWidth = 1.6 + Math.sin(t * Math.PI) * 1.6;
        ctx.beginPath();
        ctx.moveTo(x, y + 1);
        ctx.lineTo(x + Math.sin(angle) * hairLen, y - hairLen);
        ctx.stroke();
      }
      ctx.restore();
    };
    drawEyebrow(350, 485, 410, true);  // Eyebrow over right socket (center ~418)
    drawEyebrow(539, 674, 410, false); // Eyebrow over left socket (center ~606, mirrored)

    // 5. Subtle Natural Lips (Soft rose-amber vermilion matching 3D coordinates)
    const lipGrad = ctx.createLinearGradient(512, 595, 512, 650);
    lipGrad.addColorStop(0.0, 'rgba(164, 82, 66, 0.65)');
    lipGrad.addColorStop(0.45, 'rgba(176, 93, 77, 0.75)');
    lipGrad.addColorStop(1.0, 'rgba(148, 68, 54, 0.70)');
    ctx.fillStyle = lipGrad;
    ctx.beginPath();
    ctx.ellipse(512, 620, 72, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    // 6. Natural Masculine 5-O'Clock Stubble & Chiseled Jawline Shadow
    ctx.fillStyle = 'rgba(24, 20, 23, 0.68)';
    for (let i = 0; i < 3600; i++) {
      const x = 310 + Math.random() * 404;
      const y = 570 + Math.random() * 260;
      const distToCenter = Math.abs(x - 512);

      const isMustache = y >= 580 && y <= 615 && distToCenter < 78;
      const isSoulPatch = y >= 645 && y <= 680 && distToCenter < 18;
      const isChin = y >= 680 && y <= 770 && distToCenter < 105;
      const isJawline = y >= 610 && y <= 780 && distToCenter >= 75 && distToCenter <= 185;
      const isSideburn = y >= 450 && y < 610 && distToCenter >= 160 && distToCenter <= 210;

      if (isMustache || isSoulPatch || isChin || isJawline || isSideburn) {
        ctx.beginPath();
        ctx.arc(x, y, 0.65 + Math.random() * 1.1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 7. Hairline Fade gradient at top of skull
    const hairFade = ctx.createLinearGradient(0, 160, 0, 320);
    hairFade.addColorStop(0.0, '#151316');
    hairFade.addColorStop(0.70, '#1c191d');
    hairFade.addColorStop(1.0, 'transparent');
    ctx.fillStyle = hairFade;
    ctx.fillRect(0, 0, 1024, 320);

    return canvas;
  });
}

/**
 * 2. PHOTOREALISTIC HUMAN SKIN BODY DIFFUSE TEXTURE
 */
function getBodySkinTexture(): THREE.CanvasTexture {
  return getOrCreateTexture('body_skin_diffuse_v3', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    const g = ctx.createLinearGradient(0, 0, 0, 1024);
    g.addColorStop(0.0, '#c2875a');
    g.addColorStop(0.5, '#b97b4e');
    g.addColorStop(1.0, '#ac6e42');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1024, 1024);

    // Subtle veins
    ctx.strokeStyle = 'rgba(68, 108, 138, 0.08)';
    ctx.lineWidth = 4.0;
    for (let i = 0; i < 12; i++) {
      const x = 90 + i * 80;
      ctx.beginPath();
      ctx.moveTo(x, 140);
      ctx.bezierCurveTo(x + 22, 380, x - 26, 680, x + 8, 920);
      ctx.stroke();
    }

    // Fingernails & knuckles
    ctx.fillStyle = 'rgba(240, 205, 195, 0.65)';
    for (let f = 0; f < 5; f++) {
      const fx = 120 + f * 170;
      ctx.beginPath();
      ctx.ellipse(fx, 940, 28, 42, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    return canvas;
  });
}

/**
 * 3. SKIN PORE & FINE WRINKLE NORMAL MAP (Tangent space RGB)
 */
function getSkinNormalMap(): THREE.CanvasTexture {
  return getOrCreateTexture('skin_pores_normal_v3', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Flat tangent normal is #8080ff
    ctx.fillStyle = '#8080ff';
    ctx.fillRect(0, 0, 512, 512);

    const imgData = ctx.getImageData(0, 0, 512, 512);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const nx = (Math.random() - 0.5) * 22;
      const ny = (Math.random() - 0.5) * 22;
      data[i] = Math.max(0, Math.min(255, 128 + nx));
      data[i + 1] = Math.max(0, Math.min(255, 128 + ny));
      data[i + 2] = 255;
    }
    ctx.putImageData(imgData, 0, 0);
    return canvas;
  });
}

/**
 * 4. PBR FABRIC DIFFUSE MAPS FOR CLOTHING STYLES
 */
function getFabricDiffuseMap(style: DressingStyle, part: 'torso' | 'legs'): THREE.CanvasTexture {
  const key = `fabric_diff_${style}_${part}_v3`;
  return getOrCreateTexture(key, () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    let colorA = '#1c1b1e';
    let colorB = '#121114';
    let weavePattern = 'leather';

    if (style === 'biker_leather') {
      colorA = part === 'torso' ? '#181719' : '#1b222c'; // Black leather jacket, dark raw denim jeans
      colorB = part === 'torso' ? '#0f0e10' : '#131820';
      weavePattern = part === 'torso' ? 'leather' : 'denim';
    } else if (style === 'asphalt_racer') {
      colorA = part === 'torso' ? '#dc2626' : '#18181b'; // Red racing suit with black panels
      colorB = part === 'torso' ? '#991b1b' : '#09090b';
      weavePattern = 'racing_tech';
    } else if (style === 'pant_shirt_white' || style === 'pant_shirt_casual') {
      colorA = part === 'torso' ? '#f8fafc' : '#334155'; // Crisp white oxford shirt + slate chinos
      colorB = part === 'torso' ? '#e2e8f0' : '#1e293b';
      weavePattern = part === 'torso' ? 'cotton' : 'chinos';
    } else if (style === 'pant_shirt_navy') {
      colorA = part === 'torso' ? '#1e3a8a' : '#cbd5e1'; // Navy shirt + light stone trousers
      colorB = part === 'torso' ? '#172554' : '#94a3b8';
      weavePattern = part === 'torso' ? 'cotton' : 'chinos';
    } else if (style === 'pant_shirt_black') {
      colorA = part === 'torso' ? '#18181b' : '#3f3f46'; // Black shirt + charcoal trousers
      colorB = part === 'torso' ? '#09090b' : '#27272a';
      weavePattern = part === 'torso' ? 'cotton' : 'chinos';
    } else if (style === 'traditional_tamil') {
      colorA = part === 'torso' ? '#fef08a' : '#ffffff'; // Festive silk shirt + white veshti
      colorB = part === 'torso' ? '#eab308' : '#f1f5f9';
      weavePattern = 'silk';
    } else {
      colorA = part === 'torso' ? '#0284c7' : '#1e293b'; // Casual blue polo + denim
      colorB = part === 'torso' ? '#0369a1' : '#0f172a';
      weavePattern = 'cotton';
    }

    const g = ctx.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0.0, colorA);
    g.addColorStop(1.0, colorB);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 512);

    // Weave texture simulation
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    for (let y = 0; y < 512; y += 4) {
      ctx.fillRect(0, y, 512, 1);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    for (let x = 0; x < 512; x += 4) {
      ctx.fillRect(x, 0, 1, 512);
    }

    // Racing graphics or accents if applicable
    if (weavePattern === 'racing_tech' && part === 'torso') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(140, 0, 36, 512);
      ctx.fillRect(336, 0, 36, 512);
    }

    return canvas;
  });
}

function getFabricWrinkleNormalMap(part: 'torso' | 'legs'): THREE.CanvasTexture {
  const key = `fabric_wrinkle_norm_${part}_v3`;
  return getOrCreateTexture(key, () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#8080ff';
    ctx.fillRect(0, 0, 512, 512);

    // Diagonal anatomical compression folds
    ctx.strokeStyle = 'rgba(110, 110, 255, 0.45)';
    ctx.lineWidth = 6;
    for (let i = 0; i < 9; i++) {
      const y = 50 + i * 50;
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.bezierCurveTo(180, y + 25, 340, y - 20, 480, y + 10);
      ctx.stroke();
    }
    return canvas;
  });
}

function getFabricRoughnessMap(style: DressingStyle): THREE.CanvasTexture {
  const key = `fabric_rough_${style}_v3`;
  return getOrCreateTexture(key, () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const gray = style === 'biker_leather' ? '#666666' : style === 'asphalt_racer' ? '#444444' : '#b0b0b0';
    ctx.fillStyle = gray;
    ctx.fillRect(0, 0, 256, 256);
    return canvas;
  });
}

// ============================================================================
// TWO-BONE ANALYTICAL INVERSE KINEMATICS ENGINE
// ============================================================================
const _ikToTarget = new THREE.Vector3();
const _ikTargetDir = new THREE.Vector3();
const _ikBone1Dir = new THREE.Vector3();
const _ikBone2Dir = new THREE.Vector3();
const _ikPlaneNormal = new THREE.Vector3();
const _ikMidPos = new THREE.Vector3();
const _ikX1 = new THREE.Vector3();
const _ikY1 = new THREE.Vector3();
const _ikZ1 = new THREE.Vector3();
const _ikX2 = new THREE.Vector3();
const _ikY2 = new THREE.Vector3();
const _ikZ2 = new THREE.Vector3();
const _ikInvRootQ = new THREE.Quaternion();
const _ikLocalBone2 = new THREE.Vector3();
const _ikLocalPlaneNormal = new THREE.Vector3();
const _ikM1 = new THREE.Matrix4();
const _ikM2 = new THREE.Matrix4();

function solveAnalyticalTwoBoneIK(
  rootJoint: THREE.Group,
  midJoint: THREE.Group,
  endJoint: THREE.Group,
  targetPos: THREE.Vector3,
  length1: number,
  length2: number,
  poleHint: THREE.Vector3,
  isArm = true
) {
  const rootPos = rootJoint.position;
  _ikToTarget.subVectors(targetPos, rootPos);
  const maxReach = length1 + length2 - 0.0001;
  const minReach = Math.abs(length1 - length2) + 0.005;
  const targetDist = Math.max(minReach, Math.min(maxReach, _ikToTarget.length()));
  _ikTargetDir.copy(_ikToTarget).normalize();

  const cosRoot = Math.max(-1, Math.min(1, (length1 * length1 + targetDist * targetDist - length2 * length2) / (2 * length1 * targetDist)));
  const angleRoot = Math.acos(cosRoot);

  _ikPlaneNormal.crossVectors(_ikTargetDir, poleHint).normalize();
  if (_ikPlaneNormal.lengthSq() < 0.0001) {
    _ikPlaneNormal.set(0, 1, 0);
  }

  _ikBone1Dir.copy(_ikTargetDir).applyAxisAngle(_ikPlaneNormal, isArm ? angleRoot : -angleRoot).normalize();
  _ikMidPos.copy(rootPos).addScaledVector(_ikBone1Dir, length1);
  _ikBone2Dir.subVectors(targetPos, _ikMidPos).normalize();

  _ikZ1.copy(_ikBone1Dir);
  _ikY1.copy(_ikPlaneNormal);
  _ikX1.crossVectors(_ikY1, _ikZ1).normalize();
  _ikY1.crossVectors(_ikZ1, _ikX1).normalize();
  _ikM1.makeBasis(_ikX1, _ikY1, _ikZ1);
  rootJoint.quaternion.setFromRotationMatrix(_ikM1);

  midJoint.position.set(0, 0, length1);
  _ikInvRootQ.copy(rootJoint.quaternion).invert();
  _ikLocalBone2.copy(_ikBone2Dir).applyQuaternion(_ikInvRootQ).normalize();
  _ikLocalPlaneNormal.copy(_ikPlaneNormal).applyQuaternion(_ikInvRootQ).normalize();
  _ikZ2.copy(_ikLocalBone2);
  _ikY2.copy(_ikLocalPlaneNormal);
  _ikX2.crossVectors(_ikY2, _ikZ2).normalize();
  _ikY2.crossVectors(_ikZ2, _ikX2).normalize();
  _ikM2.makeBasis(_ikX2, _ikY2, _ikZ2);
  midJoint.quaternion.setFromRotationMatrix(_ikM2);

  endJoint.position.set(0, 0, length2);
}

// ============================================================================
// CONTINUOUS ORGANIC GEOMETRY GENERATORS
// ============================================================================
interface LimbSlice {
  z: number;
  rx: number;
  ry: number;
  offsetX?: number;
  offsetY?: number;
  creaseFactor?: number;
}

const createContouredLimbGeometry = (
  slices: LimbSlice[],
  radialSegments = 24,
  capStart = true,
  capEnd = true
): THREE.BufferGeometry => {
  const geom = new THREE.BufferGeometry();
  const numSlices = slices.length;
  const bodyVertices = numSlices * radialSegments;
  const totalVertices = bodyVertices + (capStart ? 1 : 0) + (capEnd ? 1 : 0);
  const positions = new Float32Array(totalVertices * 3);
  const uvs = new Float32Array(totalVertices * 2);
  const indices: number[] = [];

  let vIdx = 0;
  let uvIdx = 0;
  const totalLength = Math.max(0.001, slices[numSlices - 1].z - slices[0].z);

  for (let s = 0; s < numSlices; s++) {
    const slice = slices[s];
    const ox = slice.offsetX || 0;
    const oy = slice.offsetY || 0;
    const vCoord = (slice.z - slices[0].z) / totalLength;
    const crease = slice.creaseFactor || 0;

    for (let r = 0; r < radialSegments; r++) {
      const theta = (r / radialSegments) * Math.PI * 2;
      const creaseMod = 1.0 + (crease > 0 ? Math.sin(theta * 6.0 + s * 2.0) * crease : 0);
      const x = ox + Math.cos(theta) * slice.rx * creaseMod;
      const y = oy + Math.sin(theta) * slice.ry * creaseMod;
      const z = slice.z;

      positions[vIdx++] = x;
      positions[vIdx++] = y;
      positions[vIdx++] = z;

      uvs[uvIdx++] = r / radialSegments;
      uvs[uvIdx++] = vCoord;
    }
  }

  for (let s = 0; s < numSlices - 1; s++) {
    const ring1 = s * radialSegments;
    const ring2 = (s + 1) * radialSegments;
    for (let r = 0; r < radialSegments; r++) {
      const nextR = (r + 1) % radialSegments;
      const a = ring1 + r;
      const b = ring2 + r;
      const c = ring2 + nextR;
      const d = ring1 + nextR;

      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  let extraV = bodyVertices;
  if (capStart) {
    const startSlice = slices[0];
    const capIdx = extraV++;
    positions[capIdx * 3] = startSlice.offsetX || 0;
    positions[capIdx * 3 + 1] = startSlice.offsetY || 0;
    positions[capIdx * 3 + 2] = startSlice.z;
    uvs[capIdx * 2] = 0.5;
    uvs[capIdx * 2 + 1] = 0.0;
    for (let r = 0; r < radialSegments; r++) {
      indices.push(capIdx, (r + 1) % radialSegments, r);
    }
  }

  if (capEnd) {
    const endSlice = slices[numSlices - 1];
    const capIdx = extraV++;
    positions[capIdx * 3] = endSlice.offsetX || 0;
    positions[capIdx * 3 + 1] = endSlice.offsetY || 0;
    positions[capIdx * 3 + 2] = endSlice.z;
    uvs[capIdx * 2] = 0.5;
    uvs[capIdx * 2 + 1] = 1.0;
    const lastRing = (numSlices - 1) * radialSegments;
    for (let r = 0; r < radialSegments; r++) {
      indices.push(capIdx, lastRing + r, lastRing + ((r + 1) % radialSegments));
    }
  }

  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
};

const createContouredTorsoGeometry = (
  slices: Array<{ y: number; rx: number; rz: number; offsetX?: number; offsetZ?: number }>,
  radialSegments = 28
): THREE.BufferGeometry => {
  const geom = new THREE.BufferGeometry();
  const numSlices = slices.length;
  const bodyVertices = numSlices * radialSegments;
  const totalVertices = bodyVertices + 2;
  const positions = new Float32Array(totalVertices * 3);
  const uvs = new Float32Array(totalVertices * 2);
  const indices: number[] = [];

  let vIdx = 0;
  let uvIdx = 0;
  const totalHeight = Math.max(0.001, slices[numSlices - 1].y - slices[0].y);

  for (let s = 0; s < numSlices; s++) {
    const slice = slices[s];
    const ox = slice.offsetX || 0;
    const oz = slice.offsetZ || 0;
    const vCoord = (slice.y - slices[0].y) / totalHeight;

    for (let r = 0; r < radialSegments; r++) {
      const theta = (r / radialSegments) * Math.PI * 2;
      const x = ox + Math.cos(theta) * slice.rx;
      const z = oz + Math.sin(theta) * slice.rz;
      const y = slice.y;

      positions[vIdx++] = x;
      positions[vIdx++] = y;
      positions[vIdx++] = z;

      uvs[uvIdx++] = r / radialSegments;
      uvs[uvIdx++] = vCoord;
    }
  }

  for (let s = 0; s < numSlices - 1; s++) {
    const ring1 = s * radialSegments;
    const ring2 = (s + 1) * radialSegments;
    for (let r = 0; r < radialSegments; r++) {
      const nextR = (r + 1) % radialSegments;
      const a = ring1 + r;
      const b = ring2 + r;
      const c = ring2 + nextR;
      const d = ring1 + nextR;

      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const bottomCapIdx = bodyVertices;
  positions[bottomCapIdx * 3] = slices[0].offsetX || 0;
  positions[bottomCapIdx * 3 + 1] = slices[0].y;
  positions[bottomCapIdx * 3 + 2] = slices[0].offsetZ || 0;
  uvs[bottomCapIdx * 2] = 0.5;
  uvs[bottomCapIdx * 2 + 1] = 0.0;
  for (let r = 0; r < radialSegments; r++) {
    indices.push(bottomCapIdx, (r + 1) % radialSegments, r);
  }

  const topCapIdx = bodyVertices + 1;
  positions[topCapIdx * 3] = slices[numSlices - 1].offsetX || 0;
  positions[topCapIdx * 3 + 1] = slices[numSlices - 1].y;
  positions[topCapIdx * 3 + 2] = slices[numSlices - 1].offsetZ || 0;
  uvs[topCapIdx * 2] = 0.5;
  uvs[topCapIdx * 2 + 1] = 1.0;
  const lastRing = (numSlices - 1) * radialSegments;
  for (let r = 0; r < radialSegments; r++) {
    indices.push(topCapIdx, lastRing + r, lastRing + ((r + 1) % radialSegments));
  }

  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
};

/**
 * Procedurally sculpts an anatomical 3D adult male head mesh with proper cranial volume,
 * eye sockets, cheekbones, nose, lips, jawline, and chin.
 */
function createAnatomicalHeadGeometry(): THREE.BufferGeometry {
  const widthSegs = 64;
  const heightSegs = 52;
  const geom = new THREE.SphereGeometry(0.106, widthSegs, heightSegs);
  const pos = geom.attributes.position;
  const uv = geom.attributes.uv;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const theta = Math.atan2(v.x, v.z);
    const isFront = Math.abs(theta) < Math.PI * 0.50;
    const frontFactor = Math.max(0, Math.cos(theta));

    // Adult male cranial proportions (1.78m human: width 14.8cm, height 21.2cm, depth 18.6cm)
    v.x *= 0.88;
    v.y *= 1.05;
    v.z *= 1.00;

    // Posterior cranium & occiput rounding
    if (!isFront) {
      v.z -= 0.005;
    }

    // Forehead and temples (smooth curvature)
    if (v.y > 0.02 && isFront) {
      const templeFade = Math.exp(-Math.pow((Math.abs(v.x) - 0.052) / 0.026, 2));
      if (v.y > 0.03 && v.y < 0.08) {
        v.x *= 1 - 0.045 * templeFade;
      }
      v.z += 0.006 * frontFactor;
    }

    // Brow ridge (Superciliary arches) - smooth continuous gaussian arch
    if (isFront && v.y > 0.028 && v.y < 0.062) {
      const browDist = Math.hypot((v.y - 0.045) / 0.015, (Math.abs(v.x) - 0.034) / 0.032);
      if (browDist < 1.0) {
        v.z += 0.011 * Math.cos(browDist * Math.PI * 0.5);
      }
    }

    // Orbital sockets for 3D eyeballs - smooth natural depression
    if (isFront && v.y > 0.016 && v.y < 0.050) {
      const eyeMin = Math.min(
        Math.hypot((v.y - 0.034) / 0.016, (v.x + 0.034) / 0.022),
        Math.hypot((v.y - 0.034) / 0.016, (v.x - 0.034) / 0.022)
      );
      if (eyeMin < 1.0) {
        v.z -= 0.011 * Math.cos(eyeMin * Math.PI * 0.5);
      }
    }

    // High defined masculine cheekbones (Zygomatic arches)
    if (isFront && v.y > 0.004 && v.y < 0.042) {
      const cheekMin = Math.min(
        Math.hypot((v.y - 0.020) / 0.016, (v.x + 0.046) / 0.024),
        Math.hypot((v.y - 0.020) / 0.016, (v.x - 0.046) / 0.024)
      );
      if (cheekMin < 1.0) {
        const b = Math.cos(cheekMin * Math.PI * 0.5);
        v.z += 0.008 * b;
        v.x += (v.x > 0 ? 1 : -1) * 0.004 * b;
      }
    }

    // Anatomical straight masculine nose
    if (isFront && v.y > -0.012 && v.y < 0.048 && Math.abs(v.x) < 0.026) {
      const noseYFactor = (v.y - -0.010) / 0.056;
      const noseWidth = 0.008 + (1 - noseYFactor) * 0.012;
      const noseDistX = Math.abs(v.x) / noseWidth;
      if (noseDistX < 1.0) {
        let proj = 0.020 * (1 - Math.abs(v.y - 0.015) / 0.034);
        const tipDist = Math.hypot((v.y - 0.010) / 0.013, v.x / 0.013);
        if (tipDist < 1.0) proj += 0.008 * Math.cos(tipDist * Math.PI * 0.5);
        v.z += Math.max(0, proj) * Math.cos(noseDistX * Math.PI * 0.5);
      }
    }

    // Natural lips with subtle Cupid's bow
    if (isFront && v.y > -0.028 && v.y < 0.002 && Math.abs(v.x) < 0.030) {
      const mx = Math.abs(v.x) / 0.028;
      if (mx < 1.0) {
        const curve = Math.cos(mx * Math.PI * 0.5);
        if (Math.abs(v.y - -0.003) / 0.009 < 1.0) v.z += 0.008 * curve;
        if (Math.abs(v.y - -0.014) / 0.009 < 1.0) v.z += 0.010 * curve;
      }
    }

    // Chiseled masculine chin with subtle cleft
    if (isFront && v.y > -0.058 && v.y < -0.018 && Math.abs(v.x) < 0.034) {
      const cDist = Math.hypot((v.y - -0.036) / 0.018, v.x / 0.024);
      if (cDist < 1.0) {
        let cb = 0.017 * Math.cos(cDist * Math.PI * 0.5);
        if (Math.abs(v.x) < 0.004) cb -= 0.0018; // Soft chin cleft
        v.z += cb;
      }
    }

    // Defined smooth jawline taper
    if (v.y < -0.008 && v.y > -0.068 && isFront) {
      const jawY = (v.y - -0.068) / 0.060;
      const targetJawX = 0.030 + (1 - jawY) * 0.036;
      if (Math.abs(v.x) > targetJawX) {
        const excess = Math.abs(v.x) - targetJawX;
        v.x = Math.sign(v.x) * (targetJawX + excess * 0.75);
      }
    }

    pos.setXYZ(i, v.x, v.y, v.z);

    // Cylindrical UV coordinates
    const u = 0.5 + (theta / (Math.PI * 2));
    const normalizedY = (v.y - -0.09) / 0.20;
    const vCoord = Math.max(0.01, Math.min(0.99, normalizedY));
    uv.setXY(i, (u + 1.0) % 1.0, vCoord);
  }

  geom.computeVertexNormals();
  return geom;
}

/**
 * Creates 3D Anatomical Human Ear Group
 */
function createAnatomicalEarGroup(isLeft: boolean, skinMat: THREE.Material): THREE.Group {
  const earGroup = new THREE.Group();
  const sideSign = isLeft ? 1 : -1;

  // 1. Concha bowl
  const concha = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.009, 0.022, 14), skinMat);
  concha.rotation.z = Math.PI / 2;
  concha.scale.set(0.6, 1.2, 0.8);
  earGroup.add(concha);

  // 2. Helix cartilage rim
  const helixRim = new THREE.Mesh(new THREE.TorusGeometry(0.014, 0.0032, 10, 18, Math.PI * 1.35), skinMat);
  helixRim.rotation.y = isLeft ? Math.PI / 2 : -Math.PI / 2;
  helixRim.rotation.z = isLeft ? -0.20 : 0.20;
  helixRim.position.set(sideSign * -0.004, 0.005, -0.002);
  earGroup.add(helixRim);

  // 3. Tragus
  const tragus = new THREE.Mesh(new THREE.SphereGeometry(0.0042, 10, 8), skinMat);
  tragus.scale.set(0.8, 1.3, 0.9);
  tragus.position.set(sideSign * 0.003, 0.001, 0.009);
  earGroup.add(tragus);

  // 4. Soft lobule (Earlobe)
  const lobule = new THREE.Mesh(new THREE.SphereGeometry(0.0068, 10, 10), skinMat);
  lobule.scale.set(0.85, 1.35, 0.95);
  lobule.position.set(sideSign * -0.002, -0.015, 0.001);
  earGroup.add(lobule);

  return earGroup;
}

// ============================================================================
// MAIN PRODUCTION RIGGED HUMAN RIDER GENERATOR
// ============================================================================
export function createRiggedRider(options: {
  suitColor?: string;
  helmetColor?: string;
} = {}): RiggedRiderInstance {
  const rootGroup = new THREE.Group();

  let dressingStyle: DressingStyle = 'asphalt_racer'; // Professional Sportbike Track Leathers
  let isHelmetActive = true; // Authentic Real Rider Look: Pro Aerodynamic Racing Helmet & Visor

  // 1. Textures & PBR Maps
  const faceTexture = getRealisticManFaceTexture();
  const skinNormal = getSkinNormalMap();
  const bodySkinTexture = getBodySkinTexture();

  const torsoDiffuse = getFabricDiffuseMap(dressingStyle, 'torso');
  const torsoWrinkles = getFabricWrinkleNormalMap('torso');
  const legsDiffuse = getFabricDiffuseMap(dressingStyle, 'legs');
  const legsWrinkles = getFabricWrinkleNormalMap('legs');
  const fabricRoughness = getFabricRoughnessMap(dressingStyle);

  // 2. High-Fidelity PBR Materials
  // Photorealistic Living Human Skin (Warm natural tone, micro-pores, ZERO plastic look)
  const faceSkinMat = new THREE.MeshStandardMaterial({
    map: faceTexture,
    normalMap: skinNormal,
    normalScale: new THREE.Vector2(0.40, 0.40),
    roughness: 0.68,
    metalness: 0.0,
  });

  const bodySkinMat = new THREE.MeshStandardMaterial({
    map: bodySkinTexture,
    normalMap: skinNormal,
    normalScale: new THREE.Vector2(0.45, 0.45),
    roughness: 0.70,
    metalness: 0.0,
  });

  // Clothing Materials - Authentic Matte Leather & Raw Denim
  const jacketMat = new THREE.MeshStandardMaterial({
    map: torsoDiffuse,
    normalMap: torsoWrinkles,
    normalScale: new THREE.Vector2(1.2, 1.2),
    roughnessMap: fabricRoughness,
    roughness: 0.78,
    metalness: 0.03,
  });

  const pantsMat = new THREE.MeshStandardMaterial({
    map: legsDiffuse,
    normalMap: legsWrinkles,
    normalScale: new THREE.Vector2(1.3, 1.3),
    roughnessMap: fabricRoughness,
    roughness: 0.86,
    metalness: 0.0,
  });

  const bootMat = new THREE.MeshStandardMaterial({
    color: 0x141416,
    roughness: 0.68,
    metalness: 0.15,
  });

  const hairMat = new THREE.MeshStandardMaterial({
    color: 0x121013,
    roughness: 0.95,
    metalness: 0.0,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    metalness: 0.98,
    roughness: 0.08,
  });

  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.85,
    roughness: 0.35,
  });

  const darkLeatherMat = new THREE.MeshStandardMaterial({
    color: 0x141416,
    roughness: 0.72,
    metalness: 0.05,
  });

  const gloveMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.65,
    metalness: 0.1,
  });

  const beltMat = new THREE.MeshStandardMaterial({
    color: 0x1e1e24,
    roughness: 0.65,
    metalness: 0.2,
  });

  // Dedicated Anatomical Ocular Materials
  const eyeScleraMat = new THREE.MeshStandardMaterial({
    color: 0xfbf8f5,
    roughness: 0.22,
    metalness: 0.0,
  });

  const eyeIrisMat = new THREE.MeshStandardMaterial({
    color: 0x3d2010, // Warm deep hazel-amber
    roughness: 0.26,
    metalness: 0.08,
  });

  const eyePupilMat = new THREE.MeshBasicMaterial({
    color: 0x040404,
  });

  const eyeCorneaMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.6,
  });

  // High-Performance Helmet Materials (AGV Pista / Shoei Iridium Spec)
  const helmetShellMat = new THREE.MeshStandardMaterial({
    color: options.helmetColor ? parseInt(options.helmetColor.replace('#', '0x')) : 0x111317,
    metalness: 0.90,
    roughness: 0.12,
    envMapIntensity: 2.8,
  });

  const helmetDecalMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626, // Crimson racing graphics
    metalness: 0.85,
    roughness: 0.14,
  });

  const helmetTrimMat = new THREE.MeshStandardMaterial({
    color: 0x09090b,
    roughness: 0.65,
    metalness: 0.35,
  });

  const visorMat = new THREE.MeshStandardMaterial({
    color: 0x181a20, // Dark smoked mirror racing visor
    metalness: 0.94,
    roughness: 0.04,
    transparent: true,
    opacity: 0.92,
  });

  // Limb Slices for Anatomical Muscular Contours
  const upperArmSlices: LimbSlice[] = [
    { z: 0.00, rx: 0.068, ry: 0.074, offsetY: 0.006 },
    { z: 0.06, rx: 0.065, ry: 0.072, offsetY: 0.010 },
    { z: 0.14, rx: 0.064, ry: 0.076, offsetY: 0.018 },
    { z: 0.22, rx: 0.058, ry: 0.068, offsetY: 0.012 },
    { z: 0.30, rx: 0.052, ry: 0.059, offsetY: 0.006, creaseFactor: 0.04 },
    { z: 0.36, rx: 0.048, ry: 0.052, offsetY: 0.002, creaseFactor: 0.06 },
    { z: 0.40, rx: 0.045, ry: 0.047, offsetY: 0.000 },
  ];

  const forearmSlices: LimbSlice[] = [
    { z: 0.00, rx: 0.045, ry: 0.047, offsetY: 0.000, creaseFactor: 0.06 },
    { z: 0.06, rx: 0.056, ry: 0.050, offsetY: 0.004 },
    { z: 0.14, rx: 0.050, ry: 0.046, offsetY: 0.002 },
    { z: 0.22, rx: 0.044, ry: 0.040, offsetY: 0.000 },
    { z: 0.30, rx: 0.038, ry: 0.036, offsetY: 0.000 },
    { z: 0.36, rx: 0.035, ry: 0.033, offsetY: 0.000 },
  ];

  const thighSlices: LimbSlice[] = [
    { z: 0.00, rx: 0.098, ry: 0.095, offsetY: 0.006, creaseFactor: 0.04 },
    { z: 0.09, rx: 0.095, ry: 0.100, offsetY: 0.018, creaseFactor: 0.05 },
    { z: 0.18, rx: 0.088, ry: 0.094, offsetY: 0.022, creaseFactor: 0.03 },
    { z: 0.28, rx: 0.078, ry: 0.082, offsetY: 0.013, creaseFactor: 0.04 },
    { z: 0.38, rx: 0.068, ry: 0.070, offsetY: 0.006, creaseFactor: 0.07 },
    { z: 0.46, rx: 0.060, ry: 0.060, offsetY: 0.000, creaseFactor: 0.05 },
  ];

  const shinSlices: LimbSlice[] = [
    { z: 0.00, rx: 0.060, ry: 0.060, offsetY: 0.000, creaseFactor: 0.05 },
    { z: 0.09, rx: 0.070, ry: 0.078, offsetY: -0.018 },
    { z: 0.18, rx: 0.066, ry: 0.072, offsetY: -0.013 },
    { z: 0.28, rx: 0.056, ry: 0.058, offsetY: -0.007 },
    { z: 0.36, rx: 0.048, ry: 0.048, offsetY: -0.002, creaseFactor: 0.06 },
    { z: 0.43, rx: 0.056, ry: 0.056, offsetY: 0.000, creaseFactor: 0.08 },
  ];

  // 1. Pelvis / Hips Group
  const hipsGroup = new THREE.Group();
  hipsGroup.position.set(0, 0.820, -0.288);
  rootGroup.add(hipsGroup);

  // Contoured jeans pelvis bridging waist to leg roots
  const pelvisSlices = [
    { y: -0.10, rx: 0.122, rz: 0.098, offsetX: 0, offsetZ: -0.005 },
    { y: -0.02, rx: 0.134, rz: 0.106, offsetX: 0, offsetZ: 0.002 },
    { y: 0.06, rx: 0.138, rz: 0.110, offsetX: 0, offsetZ: 0.008 },
    { y: 0.10, rx: 0.134, rz: 0.106, offsetX: 0, offsetZ: 0.010 },
  ];
  const pelvisGeo = createContouredTorsoGeometry(pelvisSlices, 24);
  const pelvisMesh = new THREE.Mesh(pelvisGeo, pantsMat);
  pelvisMesh.castShadow = true;
  hipsGroup.add(pelvisMesh);

  // 2. Torso / Jacket Group
  const torsoGroup = new THREE.Group();
  torsoGroup.position.set(0, 0.10, 0.02);
  hipsGroup.add(torsoGroup);

  // Full-coverage biker jacket extending from collar down past waist
  const torsoSlices = [
    { y: -0.05, rx: 0.140, rz: 0.112, offsetX: 0, offsetZ: 0.006 }, // Jacket bottom hem overlapping jeans
    { y: 0.04, rx: 0.136, rz: 0.108, offsetX: 0, offsetZ: 0.008 },  // Waist
    { y: 0.12, rx: 0.148, rz: 0.118, offsetX: 0, offsetZ: 0.016 },  // Mid torso
    { y: 0.20, rx: 0.168, rz: 0.130, offsetX: 0, offsetZ: 0.028 },  // Broad athletic chest
    { y: 0.28, rx: 0.184, rz: 0.140, offsetX: 0, offsetZ: 0.038 },  // Deltoid shoulder base
    { y: 0.33, rx: 0.150, rz: 0.120, offsetX: 0, offsetZ: 0.028 },  // Clavicle collar line
    { y: 0.38, rx: 0.075, rz: 0.075, offsetX: 0, offsetZ: 0.014 },  // Mandarin collar / neck base
  ];
  const torsoGeo = createContouredTorsoGeometry(torsoSlices, 28);
  const chest = new THREE.Mesh(torsoGeo, jacketMat);
  chest.castShadow = true;
  torsoGroup.add(chest);

  // Mandarin leather motorcycle collar
  const jacketCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.084, 0.038, 24), jacketMat);
  jacketCollar.position.set(0, 0.360, 0.024);
  jacketCollar.rotation.x = 0.08;
  torsoGroup.add(jacketCollar);

  // Metal zipper down the center of jacket
  const zipTrack = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.38, 0.012), darkMetalMat);
  zipTrack.position.set(0, 0.16, 0.145);
  torsoGroup.add(zipTrack);

  const zipPuller = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.032, 0.016), chromeMat);
  zipPuller.position.set(0, 0.22, 0.152);
  torsoGroup.add(zipPuller);

  // Contoured Alpinestars TPU/Titanium shoulder armor sliders
  [-0.175, 0.175].forEach((sx) => {
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.052, 0.040, 16), darkLeatherMat);
    pad.position.set(sx, 0.28, 0.04);
    pad.rotation.z = sx < 0 ? -0.42 : 0.42;
    pad.rotation.x = 0.12;
    pad.scale.set(1.0, 0.6, 1.3);
    torsoGroup.add(pad);

    const metalSlider = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.008, 14), darkMetalMat);
    metalSlider.position.set(sx < 0 ? sx - 0.015 : sx + 0.015, 0.29, 0.04);
    metalSlider.rotation.z = sx < 0 ? -0.42 : 0.42;
    metalSlider.scale.set(1.0, 0.6, 1.2);
    torsoGroup.add(metalSlider);
  });

  // Aerodynamic speed hump on upper spine
  const speedHump = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.055, 0.18, 16), darkLeatherMat);
  speedHump.position.set(0, 0.24, -0.14);
  speedHump.rotation.x = -0.18;
  speedHump.scale.set(1.0, 1.0, 0.6);
  torsoGroup.add(speedHump);

  // 3. Head & Face Assembly (Real Man Anatomical Face, Eyes & 3D Ears)
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.365, 0.022);
  torsoGroup.add(headGroup);

  // Muscular neck with sternocleidomastoid definition
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.050, 0.060, 0.096, 24), bodySkinMat);
  neck.position.set(0, -0.02, 0.0);
  headGroup.add(neck);

  const civilianHeadGroup = new THREE.Group();
  headGroup.add(civilianHeadGroup);

  const headGeo = createAnatomicalHeadGeometry();
  const humanHeadMesh = new THREE.Mesh(headGeo, faceSkinMat);
  humanHeadMesh.position.set(0, 0.046, 0.0);
  humanHeadMesh.castShadow = true;
  civilianHeadGroup.add(humanHeadMesh);

  // 3D Anatomical Human Eyeballs & Eyelids (Left and Right)
  const leftEyeGroup = new THREE.Group();
  const rightEyeGroup = new THREE.Group();
  let leftUpperLid: THREE.Mesh | null = null;
  let rightUpperLid: THREE.Mesh | null = null;

  const buildEyeball = (eyeNode: THREE.Group, isLeft: boolean): THREE.Mesh => {
    // Sclera sphere
    const eyeBall = new THREE.Mesh(new THREE.SphereGeometry(0.0118, 20, 16), eyeScleraMat);
    eyeNode.add(eyeBall);

    // Iris disc (Hazel-amber with dark limbal ring)
    const iris = new THREE.Mesh(new THREE.CircleGeometry(0.0062, 24), eyeIrisMat);
    iris.position.set(0, 0, 0.0115);
    eyeNode.add(iris);

    // Deep crystalline pupil
    const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.0028, 18), eyePupilMat);
    pupil.position.set(0, 0, 0.0117);
    eyeNode.add(pupil);

    // Wet reflective cornea dome
    const cornea = new THREE.Mesh(new THREE.SphereGeometry(0.0072, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), eyeCorneaMat);
    cornea.rotation.x = -Math.PI / 2;
    cornea.position.set(0, 0, 0.0075);
    eyeNode.add(cornea);

    // Spherical anatomical upper eyelid hooding top 20% of iris at rest
    const upperLid = new THREE.Mesh(
      new THREE.SphereGeometry(0.0124, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.52),
      faceSkinMat
    );
    upperLid.rotation.x = -Math.PI * 0.45;
    upperLid.position.set(0, 0, 0);
    eyeNode.add(upperLid);

    const lashLine = new THREE.Mesh(
      new THREE.TorusGeometry(0.0124, 0.0014, 6, 18, Math.PI * 0.95),
      hairMat
    );
    lashLine.rotation.x = Math.PI / 2;
    lashLine.rotation.z = Math.PI * 0.025;
    upperLid.add(lashLine);

    return upperLid;
  };

  leftEyeGroup.position.set(-0.034, 0.080, 0.076);
  leftEyeGroup.rotation.y = -0.05;
  leftUpperLid = buildEyeball(leftEyeGroup, true);
  civilianHeadGroup.add(leftEyeGroup);

  rightEyeGroup.position.set(0.034, 0.080, 0.076);
  rightEyeGroup.rotation.y = 0.05;
  rightUpperLid = buildEyeball(rightEyeGroup, false);
  civilianHeadGroup.add(rightEyeGroup);

  // 3D Anatomical Human Ears
  [-0.082, 0.082].forEach((ex) => {
    const isLeft = ex < 0;
    const earGroup = createAnatomicalEarGroup(isLeft, faceSkinMat);
    earGroup.position.set(ex, 0.084, -0.006);
    earGroup.rotation.set(0.08, isLeft ? -0.18 : 0.18, isLeft ? -0.06 : 0.06);
    civilianHeadGroup.add(earGroup);
  });

  // Modern Stylish Haircut (Textured Taper Fade hugging skull naturally - ZERO BOXES!)
  const civilianHairGroup = new THREE.Group();
  civilianHeadGroup.add(civilianHairGroup);

  // Smooth cranial scalp cap adhering to skull
  const hairCrown = new THREE.Mesh(
    new THREE.SphereGeometry(0.096, 24, 20, 0, Math.PI * 2, 0, Math.PI * 0.56),
    hairMat
  );
  hairCrown.position.set(0, 0.068, -0.008);
  hairCrown.scale.set(0.92, 1.02, 1.02);
  civilianHairGroup.add(hairCrown);

  // Layered swept quiff crest (smooth curved sweeps flowing forward from crown)
  for (let s = 0; s < 5; s++) {
    const sweepFrac = s / 4;
    const sweepZ = -0.02 + sweepFrac * 0.08;
    const sweepY = 0.128 + Math.sin(sweepFrac * Math.PI) * 0.016;
    const sweepScaleX = 0.088 - sweepFrac * 0.018;
    const sweep = new THREE.Mesh(
      new THREE.CylinderGeometry(sweepScaleX * 0.85, sweepScaleX, 0.032, 16),
      hairMat
    );
    sweep.position.set(0, sweepY, sweepZ);
    sweep.rotation.x = 0.12 + sweepFrac * 0.28;
    sweep.scale.set(1.0, 0.65, 1.2);
    civilianHairGroup.add(sweep);
  }

  // Feathered quiff fringe over brow
  const quiffFringe = new THREE.Mesh(
    new THREE.SphereGeometry(0.046, 16, 12),
    hairMat
  );
  quiffFringe.position.set(0.006, 0.134, 0.064);
  quiffFringe.scale.set(1.4, 0.55, 0.85);
  quiffFringe.rotation.x = 0.28;
  quiffFringe.rotation.y = 0.08;
  civilianHairGroup.add(quiffFringe);

  // Soft tapered sideburns
  [-0.076, 0.076].forEach((sx) => {
    const sideburn = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.004, 0.034, 10), hairMat);
    sideburn.position.set(sx, 0.072, 0.020);
    sideburn.rotation.z = sx < 0 ? -0.12 : 0.12;
    civilianHairGroup.add(sideburn);
  });

  // Sleek Aerodynamic Dark Motorcycle Sunglasses (Thin wire frame, curved polarized lenses)
  const sunglassesGroup = new THREE.Group();
  sunglassesGroup.position.set(0, 0.080, 0.076);
  sunglassesGroup.visible = false; // Default: show handsome real face and eyes!
  civilianHeadGroup.add(sunglassesGroup);

  const sunglassFrameMat = new THREE.MeshStandardMaterial({
    color: 0x09090b,
    metalness: 0.90,
    roughness: 0.20,
  });
  const sunglassLensMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.85,
    roughness: 0.08,
    transparent: true,
    opacity: 0.88,
  });

  [-0.034, 0.034].forEach((lx) => {
    const lens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.015, 0.004, 18),
      sunglassLensMat
    );
    lens.rotation.x = Math.PI / 2;
    lens.position.set(lx, 0, 0.014);
    lens.scale.set(1.0, 0.72, 1.0);
    lens.rotation.y = lx < 0 ? 0.08 : -0.08;
    sunglassesGroup.add(lens);

    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(0.016, 0.0016, 8, 20),
      sunglassFrameMat
    );
    rim.position.set(lx, 0, 0.013);
    rim.scale.set(1.0, 0.72, 1.0);
    rim.rotation.y = lx < 0 ? 0.08 : -0.08;
    sunglassesGroup.add(rim);
  });

  const sunglassBridge = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0018, 0.0018, 0.018, 10),
    sunglassFrameMat
  );
  sunglassBridge.rotation.z = Math.PI / 2;
  sunglassBridge.position.set(0, 0.006, 0.015);
  sunglassesGroup.add(sunglassBridge);

  [-0.062, 0.062].forEach((tx) => {
    const temple = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0015, 0.0015, 0.076, 8),
      sunglassFrameMat
    );
    temple.rotation.x = Math.PI / 2;
    temple.position.set(tx, 0.003, -0.024);
    sunglassesGroup.add(temple);
  });

  // High-Tech Aerodynamic Racing Helmet (AGV Pista GP RR style with biplano spoiler & optical iridium visor)
  const helmetMeshGroup = new THREE.Group();
  helmetMeshGroup.visible = true; // Real Rider is equipped with full helmet by default!
  civilianHairGroup.visible = false; // Hair tucked inside helmet lining
  headGroup.add(helmetMeshGroup);

  // Aerodynamic composite shell (Carbon fiber gloss teardrop geometry)
  const helmetShell = new THREE.Mesh(new THREE.SphereGeometry(0.124, 36, 30), helmetShellMat);
  helmetShell.scale.set(0.94, 1.08, 1.15);
  helmetShell.position.set(0, 0.052, 0.008);
  helmetShell.castShadow = true;
  helmetMeshGroup.add(helmetShell);

  // Dual crimson racing stripes running over crown
  [-0.024, 0.024].forEach((sx) => {
    const stripe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.22, 16),
      helmetDecalMat
    );
    stripe.rotation.x = Math.PI / 2 + 0.15;
    stripe.position.set(sx, 0.135, -0.01);
    stripe.scale.set(1.0, 0.15, 1.0);
    helmetMeshGroup.add(stripe);
  });

  // Dual top ram-air intake scoops on crown
  [-0.042, 0.042].forEach((rx) => {
    const scoop = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.014, 0.048), darkMetalMat);
    scoop.position.set(rx, 0.138, 0.022);
    scoop.rotation.x = -0.18;
    scoop.rotation.y = rx < 0 ? 0.08 : -0.08;
    helmetMeshGroup.add(scoop);
  });

  // Rear aerodynamic biplano track spoiler with dual air diffusers
  const trackSpoiler = new THREE.Mesh(
    new THREE.BoxGeometry(0.145, 0.022, 0.075),
    helmetTrimMat
  );
  trackSpoiler.position.set(0, 0.116, -0.092);
  trackSpoiler.rotation.x = -0.32;
  helmetMeshGroup.add(trackSpoiler);

  const lowerSpoilerWing = new THREE.Mesh(
    new THREE.BoxGeometry(0.120, 0.012, 0.040),
    helmetDecalMat
  );
  lowerSpoilerWing.position.set(0, 0.092, -0.110);
  lowerSpoilerWing.rotation.x = -0.25;
  helmetMeshGroup.add(lowerSpoilerWing);

  // Aggressive angular chin bar with molded center air intake vent
  const chinBar = new THREE.Mesh(new THREE.CylinderGeometry(0.060, 0.066, 0.058, 24), helmetTrimMat);
  chinBar.position.set(0, 0.012, 0.076);
  chinBar.scale.set(1.0, 1.0, 0.86);
  helmetMeshGroup.add(chinBar);

  const chinVent = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.018, 0.012), darkMetalMat);
  chinVent.position.set(0, 0.014, 0.115);
  helmetMeshGroup.add(chinVent);

  // Breath deflector guard inside chin bar
  const breathGuard = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.016, 0.018), helmetTrimMat);
  breathGuard.position.set(0, 0.038, 0.088);
  breathGuard.rotation.x = 0.45;
  helmetMeshGroup.add(breathGuard);

  // Curved optical dark smoked / iridium mirror racing visor
  const helmetVisor = new THREE.Mesh(
    new THREE.CylinderGeometry(0.112, 0.115, 0.066, 32, 1, false, -Math.PI * 0.44, Math.PI * 0.88),
    visorMat
  );
  helmetVisor.rotation.y = Math.PI;
  helmetVisor.position.set(0, 0.062, 0.012);
  helmetMeshGroup.add(helmetVisor);

  // Visor ratchet pivot plates & alloy screws on sides
  [-0.108, 0.108].forEach((px) => {
    const ratchet = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.006, 16), helmetTrimMat);
    ratchet.rotation.z = Math.PI / 2;
    ratchet.position.set(px, 0.065, 0.015);
    helmetMeshGroup.add(ratchet);

    const pivot = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.009, 12), darkMetalMat);
    pivot.rotation.z = Math.PI / 2;
    pivot.position.set(px < 0 ? px - 0.002 : px + 0.002, 0.065, 0.015);
    helmetMeshGroup.add(pivot);

    // Tear-off post for track visor
    const tearOff = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.006, 8), chromeMat);
    tearOff.rotation.x = Math.PI / 2;
    tearOff.position.set(px < 0 ? -0.092 : 0.092, 0.062, 0.068);
    helmetMeshGroup.add(tearOff);
  });

  // Soft padded neoprene neck roll seal
  const neckRoll = new THREE.Mesh(
    new THREE.TorusGeometry(0.068, 0.014, 12, 24),
    darkLeatherMat
  );
  neckRoll.rotation.x = Math.PI / 2;
  neckRoll.position.set(0, -0.018, 0.005);
  helmetMeshGroup.add(neckRoll);

  // 4. Arms & Living Hands with Smooth Anatomical Elbow Caps
  const ARM_L1 = 0.40;
  const ARM_L2 = 0.36;
  const upperArmGeo = createContouredLimbGeometry(upperArmSlices, 24);
  const forearmGeo = createContouredLimbGeometry(forearmSlices, 24);

  const buildLivingHand = (isLeft: boolean, handNode: THREE.Group) => {
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.040, 0.044, 0.036, 20), jacketMat);
    cuff.rotation.x = Math.PI / 2;
    cuff.position.set(0, 0, -0.015);
    handNode.add(cuff);

    const wrist = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.034, 0.024, 18), bodySkinMat);
    wrist.rotation.x = Math.PI / 2;
    wrist.position.set(0, 0, 0.006);
    handNode.add(wrist);

    if (isLeft) {
      const watchCase = new THREE.Mesh(new THREE.CylinderGeometry(0.020, 0.020, 0.010, 18), chromeMat);
      watchCase.rotation.x = Math.PI / 2;
      watchCase.position.set(0, 0.018, 0.006);
      handNode.add(watchCase);
    }

    // Contoured ergonomic motorcycle racing glove palm
    const palm = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.028, 0.046, 16), gloveMat);
    palm.rotation.x = Math.PI / 2;
    palm.position.set(0, 0, 0.024);
    palm.scale.set(1.0, 0.52, 1.0);
    palm.castShadow = true;
    handNode.add(palm);

    // Carbon-fiber knuckle armor shell across MCP joints
    const knuckleGuard = new THREE.Mesh(new THREE.CylinderGeometry(0.030, 0.032, 0.016, 14), darkMetalMat);
    knuckleGuard.position.set(0, 0.012, 0.028);
    knuckleGuard.scale.set(1.0, 0.45, 1.0);
    handNode.add(knuckleGuard);

    // Thenar pad (base of thumb)
    const thumbSideX = isLeft ? 0.024 : -0.024;
    const thenarPad = new THREE.Mesh(new THREE.SphereGeometry(0.014, 14, 12), gloveMat);
    thenarPad.scale.set(1.2, 0.85, 1.25);
    thenarPad.position.set(thumbSideX, -0.005, 0.020);
    handNode.add(thenarPad);

    // Articulated Opposable Thumb
    const thumbGroup = new THREE.Group();
    thumbGroup.position.set(thumbSideX * 1.1, -0.004, 0.022);
    thumbGroup.rotation.y = isLeft ? -0.45 : 0.45;
    thumbGroup.rotation.x = 0.55;

    const t1 = new THREE.Mesh(new THREE.CylinderGeometry(0.0076, 0.0082, 0.024, 10), bodySkinMat);
    t1.position.set(0, 0, 0.012);
    t1.rotation.x = Math.PI / 2;
    thumbGroup.add(t1);

    const t2 = new THREE.Mesh(new THREE.CylinderGeometry(0.0068, 0.0075, 0.020, 10), bodySkinMat);
    t2.position.set(0, -0.004, 0.028);
    t2.rotation.x = Math.PI / 2 + 0.45;
    thumbGroup.add(t2);

    handNode.add(thumbGroup);

    // 4 Articulated Fingers (3 phalanges each: proximal, middle, distal)
    const fingerDefs = [
      { x: isLeft ? -0.018 : 0.018, len: 0.044, radius: 0.0072 },
      { x: isLeft ? -0.006 : 0.006, len: 0.046, radius: 0.0072 },
      { x: isLeft ? 0.006 : -0.006, len: 0.042, radius: 0.0068 },
      { x: isLeft ? 0.018 : -0.018, len: 0.035, radius: 0.0062 },
    ];

    fingerDefs.forEach((f) => {
      const fingerGroup = new THREE.Group();
      fingerGroup.position.set(f.x, 0.002, 0.048);
      fingerGroup.rotation.x = 0.85;

      // Proximal phalanx
      const p1 = new THREE.Mesh(new THREE.CylinderGeometry(f.radius, f.radius * 1.05, f.len * 0.40, 10), bodySkinMat);
      p1.position.set(0, 0, f.len * 0.20);
      p1.rotation.x = Math.PI / 2;
      fingerGroup.add(p1);

      // Middle phalanx
      const p2 = new THREE.Mesh(new THREE.CylinderGeometry(f.radius * 0.92, f.radius, f.len * 0.35, 10), bodySkinMat);
      p2.position.set(0, -0.006, f.len * 0.50);
      p2.rotation.x = Math.PI / 2 + 0.50;
      fingerGroup.add(p2);

      // Distal phalanx with fingernail
      const p3 = new THREE.Mesh(new THREE.CylinderGeometry(f.radius * 0.82, f.radius * 0.90, f.len * 0.28, 10), bodySkinMat);
      p3.position.set(0, -0.014, f.len * 0.74);
      p3.rotation.x = Math.PI / 2 + 0.90;
      fingerGroup.add(p3);

      handNode.add(fingerGroup);
    });
  };

  // Left Arm
  const leftArmGroup = new THREE.Group();
  leftArmGroup.position.set(-0.18, 0.26, 0.10);
  torsoGroup.add(leftArmGroup);

  const lUpperArmMesh = new THREE.Mesh(upperArmGeo, jacketMat);
  lUpperArmMesh.castShadow = true;
  leftArmGroup.add(lUpperArmMesh);

  const lDeltoidCap = new THREE.Mesh(new THREE.SphereGeometry(0.082, 18, 16), jacketMat);
  lDeltoidCap.scale.set(1.18, 1.25, 1.15);
  lDeltoidCap.position.set(0.015, 0.015, 0.02);
  leftArmGroup.add(lDeltoidCap);

  const leftElbowGroup = new THREE.Group();
  leftElbowGroup.position.set(0, 0, ARM_L1);
  leftArmGroup.add(leftElbowGroup);

  // Smooth Anatomical Elbow Cap (Olecranon elbow bone & condyles - eliminates robotic hinge gaps!)
  const lElbowCap = new THREE.Mesh(new THREE.SphereGeometry(0.046, 16, 14), jacketMat);
  lElbowCap.scale.set(1.1, 1.2, 1.35);
  lElbowCap.position.set(0, 0, 0);
  leftElbowGroup.add(lElbowCap);

  const lForearmMesh = new THREE.Mesh(forearmGeo, jacketMat);
  lForearmMesh.castShadow = true;
  leftElbowGroup.add(lForearmMesh);

  const leftHandGroup = new THREE.Group();
  leftHandGroup.position.set(0, 0, ARM_L2);
  leftElbowGroup.add(leftHandGroup);
  buildLivingHand(true, leftHandGroup);

  // Right Arm
  const rightArmGroup = new THREE.Group();
  rightArmGroup.position.set(0.18, 0.26, 0.10);
  torsoGroup.add(rightArmGroup);

  const rUpperArmMesh = new THREE.Mesh(upperArmGeo, jacketMat);
  rUpperArmMesh.castShadow = true;
  rightArmGroup.add(rUpperArmMesh);

  const rDeltoidCap = new THREE.Mesh(new THREE.SphereGeometry(0.082, 18, 16), jacketMat);
  rDeltoidCap.scale.set(1.18, 1.25, 1.15);
  rDeltoidCap.position.set(-0.015, 0.015, 0.02);
  rightArmGroup.add(rDeltoidCap);

  const rightElbowGroup = new THREE.Group();
  rightElbowGroup.position.set(0, 0, ARM_L1);
  rightArmGroup.add(rightElbowGroup);

  // Smooth Anatomical Elbow Cap
  const rElbowCap = new THREE.Mesh(new THREE.SphereGeometry(0.046, 16, 14), jacketMat);
  rElbowCap.scale.set(1.1, 1.2, 1.35);
  rElbowCap.position.set(0, 0, 0);
  rightElbowGroup.add(rElbowCap);

  const rForearmMesh = new THREE.Mesh(forearmGeo, jacketMat);
  rForearmMesh.castShadow = true;
  rightElbowGroup.add(rForearmMesh);

  const rightHandGroup = new THREE.Group();
  rightHandGroup.position.set(0, 0, ARM_L2);
  rightElbowGroup.add(rightHandGroup);
  buildLivingHand(false, rightHandGroup);

  // 5. Legs, Knees & Boots with Smooth Anatomical Knee Caps
  const LEG_L1 = 0.46;
  const LEG_L2 = 0.43;
  const thighGeo = createContouredLimbGeometry(thighSlices, 24);
  const shinGeo = createContouredLimbGeometry(shinSlices, 24);

  const buildFoot = (isLeft: boolean, bootNode: THREE.Group) => {
    // Molded racing boot sole
    const sole = new THREE.Mesh(new THREE.BoxGeometry(0.084, 0.024, 0.22), bootMat);
    sole.position.set(0, -0.040, 0.04);
    sole.castShadow = true;
    bootNode.add(sole);

    // Sculpted boot vamp
    const vamp = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.042, 0.14, 16), bootMat);
    vamp.rotation.x = Math.PI / 2;
    vamp.position.set(0, -0.010, 0.03);
    vamp.scale.set(0.95, 0.70, 1.15);
    bootNode.add(vamp);

    // Molded toe cap
    const toeCap = new THREE.Mesh(new THREE.SphereGeometry(0.036, 16, 12), bootMat);
    toeCap.scale.set(1.05, 0.65, 1.25);
    toeCap.position.set(0, -0.018, 0.098);
    bootNode.add(toeCap);

    // Magnesium outer toe slider
    const toeSlider = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.036, 10), chromeMat);
    toeSlider.rotation.z = Math.PI / 2;
    toeSlider.position.set(isLeft ? -0.044 : 0.044, -0.024, 0.090);
    bootNode.add(toeSlider);

    if (isLeft) {
      const shiftPad = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.008, 0.050), darkMetalMat);
      shiftPad.position.set(0.012, 0.015, 0.080);
      bootNode.add(shiftPad);
    }

    // Ankle bone slider
    const slider = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.026, 0.056), chromeMat);
    slider.position.set(isLeft ? -0.045 : 0.045, -0.014, 0.085);
    bootNode.add(slider);
  };

  // Left Leg
  const leftLegGroup = new THREE.Group();
  leftLegGroup.position.set(-0.13, 0.0, 0.0);
  hipsGroup.add(leftLegGroup);

  const lThighMesh = new THREE.Mesh(thighGeo, pantsMat);
  lThighMesh.castShadow = true;
  leftLegGroup.add(lThighMesh);

  const leftKneeGroup = new THREE.Group();
  leftKneeGroup.position.set(0, 0, LEG_L1);
  leftLegGroup.add(leftKneeGroup);

  // Smooth Anatomical Knee Cap (Patella kneecap & patellar tendon)
  const lPatellaCap = new THREE.Mesh(new THREE.SphereGeometry(0.058, 16, 14), pantsMat);
  lPatellaCap.scale.set(1.05, 1.15, 1.35);
  lPatellaCap.position.set(0, 0.015, 0.0);
  leftKneeGroup.add(lPatellaCap);

  // Polyurethane racing knee puck slider
  const lKneePuck = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.018, 16), darkMetalMat);
  lKneePuck.position.set(-0.025, 0.015, 0.02);
  lKneePuck.rotation.z = Math.PI / 2;
  leftKneeGroup.add(lKneePuck);

  const lShinMesh = new THREE.Mesh(shinGeo, pantsMat);
  lShinMesh.castShadow = true;
  leftKneeGroup.add(lShinMesh);

  const leftBootGroup = new THREE.Group();
  leftBootGroup.position.set(0, 0, LEG_L2);
  leftKneeGroup.add(leftBootGroup);
  buildFoot(true, leftBootGroup);

  // Right Leg
  const rightLegGroup = new THREE.Group();
  rightLegGroup.position.set(0.13, 0.0, 0.0);
  hipsGroup.add(rightLegGroup);

  const rThighMesh = new THREE.Mesh(thighGeo, pantsMat);
  rThighMesh.castShadow = true;
  rightLegGroup.add(rThighMesh);

  const rightKneeGroup = new THREE.Group();
  rightKneeGroup.position.set(0, 0, LEG_L1);
  rightLegGroup.add(rightKneeGroup);

  // Smooth Anatomical Knee Cap
  const rPatellaCap = new THREE.Mesh(new THREE.SphereGeometry(0.058, 16, 14), pantsMat);
  rPatellaCap.scale.set(1.05, 1.15, 1.35);
  rPatellaCap.position.set(0, 0.015, 0.0);
  rightKneeGroup.add(rPatellaCap);

  // Polyurethane racing knee puck slider
  const rKneePuck = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.018, 16), darkMetalMat);
  rKneePuck.position.set(0.025, 0.015, 0.02);
  rKneePuck.rotation.z = -Math.PI / 2;
  rightKneeGroup.add(rKneePuck);

  const rShinMesh = new THREE.Mesh(shinGeo, pantsMat);
  rShinMesh.castShadow = true;
  rightKneeGroup.add(rShinMesh);

  const rightBootGroup = new THREE.Group();
  rightBootGroup.position.set(0, 0, LEG_L2);
  rightKneeGroup.add(rightBootGroup);
  buildFoot(false, rightBootGroup);

  // =============================================================
  // PHYSICS & BEHAVIOR CONTROLLER
  // =============================================================
  let state: RiderPhysicsState = 'SEATED';
  let isOnFoot = false;
  let runCycle = 0;
  let clothFlutterPhase = 0;

  // Realistic Human Autonomous Behaviors
  let blinkTimer = 2.4;
  let isBlinking = false;
  let blinkProgress = 0;
  let saccadeTimer = 1.2;
  let saccadeTargetX = 0;
  let saccadeTargetY = 0;
  let idleWeightShiftTimer = 0;
  let shoulderBreathe = 0;
  let footDownProgress = 0;

  const setHelmetVisible = (visible: boolean) => {
    isHelmetActive = visible;
    if (visible) {
      helmetMeshGroup.visible = true;
      civilianHeadGroup.visible = true; // Face and living eyes remain visible inside transparent visor!
      civilianHairGroup.visible = false; // Hair tucked inside helmet lining
      sunglassesGroup.visible = false;
    } else {
      helmetMeshGroup.visible = false;
      civilianHeadGroup.visible = true;
      civilianHairGroup.visible = true;
      sunglassesGroup.visible = false; // Show handsome real face and eyes!
    }
  };

  const toggleHelmet = (): boolean => {
    setHelmetVisible(!isHelmetActive);
    return isHelmetActive;
  };

  const setDressingStyle = (style: DressingStyle) => {
    dressingStyle = style;

    jacketMat.map = getFabricDiffuseMap(style, 'torso');
    jacketMat.normalMap = getFabricWrinkleNormalMap('torso');
    jacketMat.roughnessMap = getFabricRoughnessMap(style);

    pantsMat.map = getFabricDiffuseMap(style, 'legs');
    pantsMat.normalMap = getFabricWrinkleNormalMap('legs');
    pantsMat.roughnessMap = getFabricRoughnessMap(style);

    if (style === 'biker_leather') {
      jacketMat.roughness = 0.52;
      jacketMat.metalness = 0.12;
      pantsMat.roughness = 0.72;
      setHelmetVisible(isHelmetActive);
    } else if (style === 'asphalt_racer') {
      jacketMat.roughness = 0.32;
      jacketMat.metalness = 0.25;
      pantsMat.roughness = 0.35;
      setHelmetVisible(true);
    } else {
      jacketMat.roughness = 0.78;
      jacketMat.metalness = 0.02;
      pantsMat.roughness = 0.80;
      setHelmetVisible(isHelmetActive);
    }

    jacketMat.needsUpdate = true;
    pantsMat.needsUpdate = true;
  };

  const setVisible = (visible: boolean) => {
    rootGroup.visible = visible;
  };

  const resetToSeated = () => {
    state = 'SEATED';
    isOnFoot = false;
    rootGroup.position.set(0, 0, 0);
    rootGroup.rotation.set(0, 0, 0);
    hipsGroup.position.set(0, 0.815, -0.288);
    hipsGroup.rotation.set(0, 0, 0);
    torsoGroup.position.set(0, 0.10, 0.02);
    torsoGroup.rotation.set(0.30, 0, 0);
    headGroup.rotation.set(-0.24, 0, 0);
    setHelmetVisible(isHelmetActive);
  };

  const setOnFoot = (active: boolean, worldPos?: THREE.Vector3, heading = 0) => {
    isOnFoot = active;
    if (active) {
      state = 'ON_FOOT';
      if (worldPos) {
        rootGroup.position.copy(worldPos);
      }
      rootGroup.rotation.set(0, heading, 0);

      hipsGroup.position.set(0, 0.95, 0);
      hipsGroup.rotation.set(0, 0, 0);
      torsoGroup.rotation.set(0, 0, 0);
      headGroup.rotation.set(0, 0, 0);

      leftLegGroup.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
      leftKneeGroup.quaternion.identity();
      rightLegGroup.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
      rightKneeGroup.quaternion.identity();

      leftBootGroup.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
      rightBootGroup.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);

      leftArmGroup.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2 + 0.05);
      leftElbowGroup.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.22);
      rightArmGroup.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2 + 0.05);
      rightElbowGroup.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.22);
    } else {
      resetToSeated();
    }
  };

  // Ballistic ragdoll variables
  const ragdollVel = new THREE.Vector3();
  const ragdollPos = new THREE.Vector3();
  const ragdollRot = new THREE.Euler();
  const ragdollAngVel = new THREE.Vector3();
  let ragdollTimer = 0;

  let currentHangOff = 0;
  let currentSpineLean = 0;
  let currentHeadLook = 0;
  let currentChestTuck = 0;
  let currentChassisPitch = 0;

  const _tempTarget = new THREE.Vector3();
  const _tempPole = new THREE.Vector3();

  const animateMountTransition = (type: 'MOUNTING' | 'DISMOUNTING', progress: number) => {
    state = type === 'DISMOUNTING' ? 'DISMOUNTING' : 'MOUNTING';
    const t = Math.max(0, Math.min(1, progress));
    const isDismount = type === 'DISMOUNTING';
    const easeT = t * t * (3 - 2 * t); // Smooth cubic ease-in-out

    if (isDismount) {
      // 1. Pelvis height and depth (rises smoothly from saddle pocket to standing posture)
      hipsGroup.position.y = THREE.MathUtils.lerp(0.820, 0.950, easeT);
      hipsGroup.position.z = THREE.MathUtils.lerp(-0.288, 0.0, easeT);

      // Natural hip shift: weight bears on left hip during right leg clearance
      const swingPhase = Math.sin(t * Math.PI);
      hipsGroup.position.x = -swingPhase * 0.055;
      hipsGroup.rotation.z = -swingPhase * 0.09;
      hipsGroup.rotation.y = swingPhase * 0.16;

      // 2. Torso sits upright from riding lean and counter-balances leg arc
      torsoGroup.rotation.x = THREE.MathUtils.lerp(0.24, 0.02, easeT);
      torsoGroup.rotation.y = -swingPhase * 0.15;
      torsoGroup.rotation.z = swingPhase * 0.07;

      // 3. Head glances down toward left pavement landing zone, then level
      headGroup.rotation.x = swingPhase * 0.20 - 0.04 * (1 - easeT);
      headGroup.rotation.y = swingPhase * 0.22;
      headGroup.rotation.z = 0;

      // 4. Left Supporting Leg (extends and stabilizes rider on left side of bike)
      const leftThighAngle = THREE.MathUtils.lerp(1.15, Math.PI / 2, easeT);
      leftLegGroup.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), leftThighAngle);
      const leftKneeAngle = THREE.MathUtils.lerp(0.85, 0.04, easeT);
      leftKneeGroup.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), leftKneeAngle);
      leftBootGroup.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);

      // 5. Right Leg (releases from right peg, flexes knee, clears saddle in wide arc, steps down)
      if (t < 0.20) {
        // Phase A: Release foot from peg, flex knee and lift heel
        const liftT = t / 0.20;
        rightLegGroup.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), THREE.MathUtils.lerp(1.15, 0.90, liftT));
        rightKneeGroup.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), THREE.MathUtils.lerp(0.85, 1.25, liftT));
        rightBootGroup.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2 + 0.2 * liftT);
      } else if (t < 0.75) {
        // Phase B: Clear rear motorcycle seat in smooth athletic arc over to the left side
        const arcT = (t - 0.20) / 0.55;
        const arcSin = Math.sin(arcT * Math.PI);
        const pitch = THREE.MathUtils.lerp(0.90, 1.45, arcT);
        const yaw = -arcSin * 0.85; // swing outward and forward to left
        const roll = arcSin * 0.38;
        rightLegGroup.quaternion.setFromEuler(new THREE.Euler(pitch, yaw, roll, 'YXZ'));
        rightKneeGroup.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), 1.25 - arcT * 0.95 + arcSin * 0.3);
        rightBootGroup.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2 + (1 - arcT) * 0.2);
      } else {
        // Phase C: Touch down alongside left foot and stand upright
        const touchT = (t - 0.75) / 0.25;
        const touchEase = touchT * touchT * (3 - 2 * touchT);
        rightLegGroup.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), THREE.MathUtils.lerp(1.45, Math.PI / 2, touchEase));
        rightKneeGroup.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), THREE.MathUtils.lerp(0.30, 0.04, touchEase));
        rightBootGroup.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
      }

      // 6. Arms and Hands: Release grips and lower naturally to relaxed standing hang
      const armPitch = THREE.MathUtils.lerp(0.92, Math.PI / 2 + 0.06, easeT);
      const elbowBend = THREE.MathUtils.lerp(0.65, 0.22, easeT);
      leftArmGroup.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), armPitch);
      leftElbowGroup.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), elbowBend);
      rightArmGroup.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), armPitch);
      rightElbowGroup.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), elbowBend);
      leftHandGroup.rotation.set(0, 0, 0);
      rightHandGroup.rotation.set(0, 0, 0);
    } else {
      // MOUNTING: Smooth athletic reversal
      hipsGroup.position.y = THREE.MathUtils.lerp(0.950, 0.820, easeT);
      hipsGroup.position.z = THREE.MathUtils.lerp(0.0, -0.288, easeT);

      const swingPhase = Math.sin(t * Math.PI);
      hipsGroup.position.x = -swingPhase * 0.055;
      hipsGroup.rotation.z = -swingPhase * 0.08;
      hipsGroup.rotation.y = swingPhase * 0.16;

      torsoGroup.rotation.x = THREE.MathUtils.lerp(0.02, 0.24, easeT);
      torsoGroup.rotation.y = -swingPhase * 0.14;
      torsoGroup.rotation.z = swingPhase * 0.06;

      headGroup.rotation.x = swingPhase * 0.15 - 0.06;
      headGroup.rotation.y = -swingPhase * 0.18;

      // Left supporting leg bends into seat
      leftLegGroup.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), THREE.MathUtils.lerp(Math.PI / 2, 1.15, easeT));
      leftKneeGroup.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), THREE.MathUtils.lerp(0.04, 0.85, easeT));
      leftBootGroup.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);

      // Right leg lifts high and sweeps over seat to right peg
      if (t < 0.25) {
        const liftT = t / 0.25;
        rightLegGroup.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), THREE.MathUtils.lerp(Math.PI / 2, 0.85, liftT));
        rightKneeGroup.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), THREE.MathUtils.lerp(0.04, 1.35, liftT));
        rightBootGroup.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
      } else if (t < 0.75) {
        const arcT = (t - 0.25) / 0.50;
        const arcSin = Math.sin(arcT * Math.PI);
        const pitch = THREE.MathUtils.lerp(0.85, 1.10, arcT);
        const yaw = arcSin * 0.85;
        const roll = -arcSin * 0.32;
        rightLegGroup.quaternion.setFromEuler(new THREE.Euler(pitch, yaw, roll, 'YXZ'));
        rightKneeGroup.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), 1.35 - arcT * 0.5);
        rightBootGroup.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
      } else {
        const touchT = (t - 0.75) / 0.25;
        rightLegGroup.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), THREE.MathUtils.lerp(1.10, 1.15, touchT));
        rightKneeGroup.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), THREE.MathUtils.lerp(0.85, 0.85, touchT));
        rightBootGroup.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
      }

      // Arms reach forward to handlebars
      const armPitch = THREE.MathUtils.lerp(Math.PI / 2 + 0.06, 0.92, easeT);
      const elbowBend = THREE.MathUtils.lerp(0.22, 0.65, easeT);
      leftArmGroup.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), armPitch);
      leftElbowGroup.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), elbowBend);
      rightArmGroup.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), armPitch);
      rightElbowGroup.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), elbowBend);
    }
  };

  const solveIK = (
    leftGripWorld: THREE.Vector3,
    rightGripWorld: THREE.Vector3,
    leftPegWorld: THREE.Vector3,
    rightPegWorld: THREE.Vector3
  ) => {
    if (state !== 'SEATED') return;

    // Left Arm IK
    torsoGroup.updateMatrixWorld(true);
    _tempTarget.copy(leftGripWorld);
    torsoGroup.worldToLocal(_tempTarget);
    const lArmPoleX = -1.0 + (currentHangOff > 0 ? 0.35 : -0.20);
    const lArmPoleY = -0.38 - (currentHangOff < 0 ? 0.22 : 0);
    _tempPole.set(lArmPoleX, lArmPoleY, 0.15).normalize();
    solveAnalyticalTwoBoneIK(
      leftArmGroup,
      leftElbowGroup,
      leftHandGroup,
      _tempTarget,
      ARM_L1,
      ARM_L2,
      _tempPole,
      true
    );
    leftHandGroup.rotation.set(-0.32, 0.04, -0.16);

    // Right Arm IK
    _tempTarget.copy(rightGripWorld);
    torsoGroup.worldToLocal(_tempTarget);
    const rArmPoleX = 1.0 + (currentHangOff < 0 ? -0.35 : 0.20);
    const rArmPoleY = -0.38 - (currentHangOff > 0 ? 0.22 : 0);
    _tempPole.set(rArmPoleX, rArmPoleY, 0.15).normalize();
    solveAnalyticalTwoBoneIK(
      rightArmGroup,
      rightElbowGroup,
      rightHandGroup,
      _tempTarget,
      ARM_L1,
      ARM_L2,
      _tempPole,
      true
    );
    rightHandGroup.rotation.set(-0.32, -0.04, 0.16);

    // Left Leg IK (Handles foot down when stopped or on kickstand)
    hipsGroup.updateMatrixWorld(true);
    _tempTarget.copy(leftPegWorld);
    if (footDownProgress > 0) {
      _tempTarget.y -= footDownProgress * 0.22;
      _tempTarget.x -= footDownProgress * 0.18;
    }
    hipsGroup.worldToLocal(_tempTarget);
    const lLegPoleX = -0.35 + (currentHangOff < -0.06 ? -0.42 : 0.14);
    const lLegPoleY = 0.20 - (currentHangOff < -0.06 ? 0.12 : 0);
    _tempPole.set(lLegPoleX, lLegPoleY, 0.95).normalize();
    solveAnalyticalTwoBoneIK(
      leftLegGroup,
      leftKneeGroup,
      leftBootGroup,
      _tempTarget,
      LEG_L1,
      LEG_L2,
      _tempPole,
      false
    );
    leftBootGroup.rotation.set(-0.35 + footDownProgress * 0.35, 0.02, -0.08);

    // Right Leg IK
    _tempTarget.copy(rightPegWorld);
    hipsGroup.worldToLocal(_tempTarget);
    const rLegPoleX = 0.35 + (currentHangOff > 0.06 ? 0.42 : -0.14);
    const rLegPoleY = 0.20 - (currentHangOff > 0.06 ? 0.12 : 0);
    _tempPole.set(rLegPoleX, rLegPoleY, 0.95).normalize();
    solveAnalyticalTwoBoneIK(
      rightLegGroup,
      rightKneeGroup,
      rightBootGroup,
      _tempTarget,
      LEG_L1,
      LEG_L2,
      _tempPole,
      false
    );
    rightBootGroup.rotation.set(-0.35, -0.02, 0.08);
  };

  const triggerCrash = (initialVelocity: THREE.Vector3, _worldPos: THREE.Vector3, heading: number) => {
    state = 'CRASHING';
    ragdollTimer = 0;
    ragdollPos.set(0, 0.82, -0.28);

    const fwdX = Math.sin(heading);
    const fwdZ = Math.cos(heading);
    const speed = initialVelocity.length();

    ragdollVel.set(
      fwdX * speed * 0.92 + (Math.random() - 0.5) * 5,
      Math.max(4.2, speed * 0.26) + Math.random() * 2.2,
      fwdZ * speed * 0.92 + (Math.random() - 0.5) * 5
    );

    ragdollAngVel.set(
      (Math.random() - 0.5) * 14,
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 16
    );
  };

  const update = (
    delta: number,
    bikeSpeed: number,
    steerInput: number,
    leanAngle: number,
    isBraking: boolean,
    isKickstand: boolean,
    world?: CityWorldInstance,
    onFootParams?: {
      isMoving: boolean;
      moveSpeed: number;
      steer: number;
      isSprinting: boolean;
    }
  ) => {
    // Dynamic Wind Flutter Simulation
    const speedKmh = Math.abs(bikeSpeed);
    const speedRatio = Math.min(1.0, speedKmh / 220);
    clothFlutterPhase += delta * (14.0 + speedRatio * 20.0);

    // Biological Blinking
    blinkTimer -= delta;
    if (blinkTimer <= 0) {
      isBlinking = true;
      blinkProgress = 0;
      blinkTimer = 3.0 + Math.random() * 3.2; // Natural interval: 3.0 - 6.2s
    }

    if (isBlinking) {
      blinkProgress += delta * 12.0; // Fast realistic 120ms blink
      const blinkT = Math.sin(blinkProgress * Math.PI);
      const lidRot = THREE.MathUtils.lerp(-Math.PI * 0.44, 0.14, blinkT);
      if (leftUpperLid) leftUpperLid.rotation.x = lidRot;
      if (rightUpperLid) rightUpperLid.rotation.x = lidRot;

      if (blinkProgress >= 1.0) {
        isBlinking = false;
        if (leftUpperLid) leftUpperLid.rotation.x = -Math.PI * 0.44;
        if (rightUpperLid) rightUpperLid.rotation.x = -Math.PI * 0.44;
      }
    }

    // Natural Ocular Saccades (Road scan, mirrors, instrument cluster)
    saccadeTimer -= delta;
    if (saccadeTimer <= 0) {
      saccadeTimer = 0.9 + Math.random() * 2.0;
      saccadeTargetX = (Math.random() - 0.5) * 0.12;
      saccadeTargetY = (Math.random() - 0.5) * 0.07;
    }
    leftEyeGroup.rotation.y = THREE.MathUtils.lerp(leftEyeGroup.rotation.y, -0.06 + saccadeTargetX, delta * 8.0);
    leftEyeGroup.rotation.x = THREE.MathUtils.lerp(leftEyeGroup.rotation.x, saccadeTargetY, delta * 8.0);
    rightEyeGroup.rotation.y = THREE.MathUtils.lerp(rightEyeGroup.rotation.y, 0.06 + saccadeTargetX, delta * 8.0);
    rightEyeGroup.rotation.x = THREE.MathUtils.lerp(rightEyeGroup.rotation.x, saccadeTargetY, delta * 8.0);

    // Human Biological Breathing (Torso & Shoulders expand rhythmically)
    shoulderBreathe += delta * 1.8;
    const lungExpansion = Math.sin(shoulderBreathe) * 0.016;
    torsoGroup.scale.set(1.0 + lungExpansion * 0.45, 1.0 + lungExpansion * 0.3, 1.0 + lungExpansion * 0.7);

    if (state === 'SEATED') {
      // Cloth buffeting at speed
      const flutterIntensity = speedRatio * 0.035;
      jacketCollar.rotation.x = 0.22 + Math.sin(clothFlutterPhase) * flutterIntensity;
      zipPuller.rotation.z = Math.sin(clothFlutterPhase * 1.4) * (speedRatio * 0.24);

      const isStopped = speedKmh < 1.5;
      if (isStopped || isKickstand) {
        // Foot down to ground when stopped or on kickstand
        footDownProgress = THREE.MathUtils.lerp(footDownProgress, 1.0, delta * 5.0);

        const idleSway = Math.sin(idleWeightShiftTimer * 0.7) * 0.04;
        currentHangOff = THREE.MathUtils.lerp(currentHangOff, -0.05 + idleSway * 0.2, delta * 4.0);
        currentSpineLean = THREE.MathUtils.lerp(currentSpineLean, -0.08 + idleSway * 0.4, delta * 4.0);
        currentChestTuck = THREE.MathUtils.lerp(currentChestTuck, 0.10, delta * 4.0);
        currentHeadLook = THREE.MathUtils.lerp(currentHeadLook, 0.12 + Math.sin(idleWeightShiftTimer * 0.4) * 0.14, delta * 3.0);
      } else {
        footDownProgress = THREE.MathUtils.lerp(footDownProgress, 0.0, delta * 8.0);

        // Dynamic human riding posture: Corner banking, aerodynamic tuck, braking brace
        const speedShake = Math.sin(clothFlutterPhase * 0.8) * (speedRatio * 0.007);
        const targetHangOff = Math.sin(leanAngle) * 0.15; // Hang-off into corner
        const targetSpineLean = leanAngle * 0.38;
        const targetHeadLook = -steerInput * 0.26 + leanAngle * 0.24 + saccadeTargetX * 0.20;
        const targetChestTuck = 0.22 + speedRatio * 0.30 + speedShake; // Tuck lower at high speed
        const targetChassisPitch = isBraking ? 0.09 : (speedKmh > 90 ? -0.04 : 0);

        currentHangOff = THREE.MathUtils.lerp(currentHangOff, targetHangOff, delta * 9.0);
        currentSpineLean = THREE.MathUtils.lerp(currentSpineLean, targetSpineLean, delta * 10.0);
        currentHeadLook = THREE.MathUtils.lerp(currentHeadLook, targetHeadLook, delta * 8.0);
        currentChestTuck = THREE.MathUtils.lerp(currentChestTuck, targetChestTuck, delta * 7.0);
        currentChassisPitch = THREE.MathUtils.lerp(currentChassisPitch, targetChassisPitch, delta * 8.0);

        hipsGroup.position.x = currentHangOff;
        hipsGroup.rotation.z = currentSpineLean * 0.35;

        torsoGroup.rotation.x = currentChestTuck + currentChassisPitch;
        torsoGroup.rotation.z = currentSpineLean;
        torsoGroup.rotation.y = -currentHangOff * 1.4;

        // Vestibulo-ocular reflex: head stays level with road horizon
        headGroup.rotation.y = currentHeadLook;
        headGroup.rotation.z = -currentSpineLean * 0.55;
        headGroup.rotation.x = -currentChestTuck * 0.70 + saccadeTargetY * 0.3;
      }
    } else if (state === 'ON_FOOT') {
      // Biomechanical Human Walking, Backpedaling & Sprinting Locomotion
      const isMoving = onFootParams?.isMoving ?? (Math.abs(bikeSpeed) > 0.3);
      const moveSpeed = onFootParams?.moveSpeed ?? bikeSpeed;
      const absSpeed = Math.abs(moveSpeed);
      const isSprinting = onFootParams?.isSprinting ?? (absSpeed > 9.0);
      const isBackward = moveSpeed < -0.2;
      const steer = onFootParams?.steer ?? steerInput;

      if (isMoving && absSpeed > 0.2) {
        const cadence = isSprinting ? 8.8 : 5.4;
        runCycle += delta * cadence * (isBackward ? -1.0 : 1.0);

        const strideSwing = Math.sin(runCycle);
        const strideAngle = isSprinting ? 0.65 : isBackward ? 0.34 : 0.42;

        // Alternating foot placement with natural heel-to-toe roll & ankle flexion
        leftLegGroup.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2 - strideSwing * strideAngle);
        const leftKneeBend = strideSwing < 0 ? Math.abs(strideSwing) * (isSprinting ? 1.30 : 0.72) : 0.08;
        leftKneeGroup.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), leftKneeBend);
        const leftAnkleFlex = -Math.PI / 2 + (strideSwing < 0 ? -0.20 : 0.26) * Math.abs(strideSwing);
        leftBootGroup.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), leftAnkleFlex);

        rightLegGroup.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2 + strideSwing * strideAngle);
        const rightKneeBend = strideSwing > 0 ? Math.abs(strideSwing) * (isSprinting ? 1.30 : 0.72) : 0.08;
        rightKneeGroup.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), rightKneeBend);
        const rightAnkleFlex = -Math.PI / 2 + (strideSwing > 0 ? -0.20 : 0.26) * Math.abs(strideSwing);
        rightBootGroup.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), rightAnkleFlex);

        // Natural opposing arm swing with relaxed wrists
        const armSwingAngle = isSprinting ? 0.74 : 0.42;
        const elbowBend = isSprinting ? 0.95 : 0.35;
        leftArmGroup.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2 + strideSwing * armSwingAngle);
        leftElbowGroup.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), elbowBend);

        rightArmGroup.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2 - strideSwing * armSwingAngle);
        rightElbowGroup.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), elbowBend);

        // Pelvic sway, Trendelenburg list, dual vertical bounce, spine counter-rotation
        const verticalBob = Math.abs(Math.sin(runCycle)) * (isSprinting ? 0.045 : 0.024);
        const hipSway = Math.sin(runCycle) * (isSprinting ? 0.042 : 0.026);
        const shoulderCounterTwist = -hipSway * 1.25;

        hipsGroup.position.y = 0.95 - verticalBob;
        hipsGroup.rotation.y = hipSway;
        hipsGroup.rotation.z = Math.sin(runCycle) * 0.032;

        torsoGroup.rotation.x = isSprinting ? 0.20 : isBackward ? -0.06 : 0.08;
        torsoGroup.rotation.y = shoulderCounterTwist;
        torsoGroup.rotation.z = -steer * 0.12;

        headGroup.rotation.y = steer * 0.28 - shoulderCounterTwist * 0.70;
        headGroup.rotation.x = isSprinting ? -0.08 : 0.02;
      } else {
        // Natural Human Idle (Contrapposto Asymmetric Weight-Shifting)
        idleWeightShiftTimer += delta * 0.45;
        const weightShift = Math.sin(idleWeightShiftTimer);
        shoulderBreathe += delta * 1.5;
        const breath = Math.sin(shoulderBreathe) * 0.016;

        // Weight rests predominantly on one leg (supporting leg straight, opposite knee relaxed)
        hipsGroup.position.y = 0.95 + breath * 0.3;
        hipsGroup.position.x = weightShift * 0.022;
        hipsGroup.rotation.z = weightShift * 0.034;
        hipsGroup.rotation.y = Math.sin(idleWeightShiftTimer * 0.5) * 0.04;

        torsoGroup.rotation.x = 0.02 + breath * 0.4;
        torsoGroup.rotation.y = -weightShift * 0.026;
        torsoGroup.rotation.z = -weightShift * 0.026;

        headGroup.rotation.y = Math.sin(idleWeightShiftTimer * 0.8) * 0.14 + saccadeTargetX;
        headGroup.rotation.x = Math.cos(idleWeightShiftTimer * 0.6) * 0.04 + saccadeTargetY * 0.5;

        // Relaxed standing leg poses (Contrapposto)
        leftLegGroup.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2 + (weightShift > 0 ? 0.04 : -0.02));
        leftKneeGroup.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), weightShift > 0 ? 0.08 : 0.02);
        leftBootGroup.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);

        rightLegGroup.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2 + (weightShift < 0 ? 0.04 : -0.02));
        rightKneeGroup.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), weightShift < 0 ? 0.08 : 0.02);
        rightBootGroup.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);

        // Relaxed natural arm hang
        leftArmGroup.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2 + 0.06 + breath);
        leftElbowGroup.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.22);
        rightArmGroup.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2 + 0.06 + breath);
        rightElbowGroup.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.22);
      }
    } else if (state === 'CRASHING' || state === 'SLIDING') {
      ragdollTimer += delta;
      ragdollVel.y -= 14.5 * delta;

      const drag = state === 'SLIDING' ? 4.8 : 0.45;
      ragdollVel.x *= Math.max(0, 1 - drag * delta);
      ragdollVel.z *= Math.max(0, 1 - drag * delta);

      ragdollPos.x += ragdollVel.x * delta;
      ragdollPos.y += ragdollVel.y * delta;
      ragdollPos.z += ragdollVel.z * delta;

      const groundY = world ? world.getGroundHeightAt(ragdollPos.x, ragdollPos.z) : 0;
      const minPelvisHeight = groundY + 0.16;

      if (ragdollPos.y <= minPelvisHeight) {
        ragdollPos.y = minPelvisHeight;
        if (ragdollVel.y < -1.5) {
          ragdollVel.y = -ragdollVel.y * 0.28;
          state = 'SLIDING';
        } else {
          ragdollVel.y = 0;
          state = 'SLIDING';
        }
        ragdollAngVel.multiplyScalar(Math.max(0, 1 - 6.5 * delta));
      }

      ragdollRot.x += ragdollAngVel.x * delta;
      ragdollRot.y += ragdollAngVel.y * delta;
      ragdollRot.z += ragdollAngVel.z * delta;

      rootGroup.position.copy(ragdollPos);
      rootGroup.rotation.copy(ragdollRot);

      const flail = Math.sin(ragdollTimer * 14);
      leftArmGroup.rotation.x = flail * 0.85;
      rightArmGroup.rotation.x = -flail * 0.85;
      leftLegGroup.rotation.x = -flail * 0.65;
      rightLegGroup.rotation.x = flail * 0.65;

      const horizSpeed = Math.hypot(ragdollVel.x, ragdollVel.z);
      if (horizSpeed < 0.25 && ragdollPos.y <= minPelvisHeight + 0.05 && ragdollTimer > 1.2) {
        state = 'REST';
      }
    }
  };

  const dispose = () => {
    rootGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.geometry.dispose();
      }
    });
  };

  resetToSeated();

  return {
    group: rootGroup,
    hipsGroup,
    torsoGroup,
    headGroup,
    leftArmGroup,
    leftElbowGroup,
    rightArmGroup,
    rightElbowGroup,
    leftLegGroup,
    leftKneeGroup,
    rightLegGroup,
    rightKneeGroup,
    leftHandGroup,
    rightHandGroup,
    leftBootGroup,
    rightBootGroup,
    get state() {
      return state;
    },
    get isRagdollActive() {
      return state === 'CRASHING' || state === 'SLIDING' || state === 'REST';
    },
    get isOnFoot() {
      return isOnFoot;
    },
    get dressingStyle() {
      return dressingStyle;
    },
    get isHelmetVisible() {
      return isHelmetActive;
    },
    setHelmetVisible,
    toggleHelmet,
    setDressingStyle,
    setVisible,
    setOnFoot,
    triggerCrash,
    resetToSeated,
    animateMountTransition,
    solveIK,
    update,
    dispose,
  };
}
