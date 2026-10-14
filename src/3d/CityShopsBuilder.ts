import * as THREE from 'three';
import { WorldObstacle } from './CityWorldBuilder';
import {
  createTamilStoreSignTexture,
  createTamilTeaStall,
  createTamilTyreShop,
  createTamilTenderCoconutStall,
  createTamilBusStopShelter,
} from './TamilNaduAssets';

/**
 * Creates an illuminated neon storefront sign texture
 */
function createNeonSignTexture(
  titleTamil: string,
  titleEng: string,
  subText: string,
  bgHex: string,
  accentHex: string,
  textColor = '#ffffff'
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = bgHex;
  ctx.fillRect(0, 0, 512, 160);

  // Outer glowing border
  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, 496, 144);

  // Inner subtle neon line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 2;
  ctx.strokeRect(16, 16, 480, 128);

  // Tamil Main Heading
  ctx.fillStyle = textColor;
  ctx.font = 'bold 34px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(titleTamil, 256, 56);

  // English Brand Name
  ctx.fillStyle = accentHex;
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(titleEng.toUpperCase(), 256, 96);

  // Subtitle / Services
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText(subText, 256, 134);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 8;
  return tex;
}

/**
 * 1. Supercar Tuning Garage & Performance Dyno Centre
 * (M-Performance & AMG Performance Workshop with glass showroom & dyno bay)
 */
export function createSupercarTuningGarage(): THREE.Group {
  const group = new THREE.Group();

  const darkWallMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.7 });
  const carbonMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.4, metalness: 0.8 });
  const redTrimMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3 });
  const blueTrimMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.3 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0xa5f3fc, transparent: true, opacity: 0.55, roughness: 0.1, metalness: 0.85 });
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.3, metalness: 0.2 });

  // Main Showroom / Workshop Building (Width: 36m, Height: 9m, Depth: 22m)
  const bldg = new THREE.Mesh(new THREE.BoxGeometry(36, 9, 22), darkWallMat);
  bldg.position.set(0, 4.5, 0);
  bldg.castShadow = true;
  group.add(bldg);

  // Polished Concrete Workshop Floor in front
  const forecourt = new THREE.Mesh(new THREE.PlaneGeometry(42, 16), floorMat);
  forecourt.rotateX(-Math.PI / 2);
  forecourt.position.set(0, 0.02, 18);
  group.add(forecourt);

  // Roll-Up Industrial Workshop Bay Doors
  for (let bx = -10; bx <= 10; bx += 10) {
    const bayDoor = new THREE.Mesh(
      new THREE.BoxGeometry(7.5, 5.5, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x3f3f46, metalness: 0.85, roughness: 0.4 })
    );
    bayDoor.position.set(bx, 2.75, 11.1);
    group.add(bayDoor);

    // Roll-up slats detail
    for (let sy = 0.6; sy <= 5.0; sy += 0.8) {
      const slat = new THREE.Mesh(
        new THREE.BoxGeometry(7.3, 0.08, 0.5),
        new THREE.MeshStandardMaterial({ color: 0x18181b })
      );
      slat.position.set(bx, sy, 11.2);
      group.add(slat);
    }
  }

  // Giant Glass Showroom Window on the left
  const windowFrame = new THREE.Mesh(new THREE.BoxGeometry(11, 6.5, 0.3), glassMat);
  windowFrame.position.set(-10, 3.5, 11.1);
  group.add(windowFrame);

  // Front Fascia Overhang with LED Strip
  const overhang = new THREE.Mesh(new THREE.BoxGeometry(38, 1.2, 3), carbonMat);
  overhang.position.set(0, 8.8, 12);
  group.add(overhang);

  // Dual BMW M & AMG Racing Accent Stripes
  const mStripe1 = new THREE.Mesh(new THREE.BoxGeometry(38, 0.15, 0.1), blueTrimMat);
  mStripe1.position.set(0, 8.1, 13.55);
  group.add(mStripe1);

  const mStripe2 = new THREE.Mesh(new THREE.BoxGeometry(38, 0.15, 0.1), redTrimMat);
  mStripe2.position.set(0, 7.8, 13.55);
  group.add(mStripe2);

  // High-Resolution Bilingual Glowing Signboard: "M-POWER & AMG TUNING GARAGE"
  const signTex = createNeonSignTexture(
    'எம் பவர் & ஏஎம்ஜி டியூனிங் கேரேஜ்',
    'M-POWER & AMG MOTORSPORTS TUNING',
    'DYNO TUNING • ECU REMAP • CARBON AERO • RACE EXHAUSTS',
    '#09090b',
    '#ef4444'
  );
  const signMesh = new THREE.Mesh(
    new THREE.BoxGeometry(26, 2.8, 0.25),
    new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.3 })
  );
  signMesh.position.set(0, 7.2, 12.2);
  group.add(signMesh);

  // Stack of High Performance Radial Racing Tyres outside
  const tireGeo = new THREE.TorusGeometry(0.42, 0.2, 8, 16);
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.95 });
  for (let t = 0; t < 6; t++) {
    const tire = new THREE.Mesh(tireGeo, tireMat);
    tire.rotateX(Math.PI / 2);
    tire.position.set(16, 0.2 + t * 0.35, 14);
    group.add(tire);
  }

  return group;
}

/**
 * 2. Apollo Pharmacy (24x7 Medicals with Glowing Green Cross)
 */
export function createApolloPharmacy(): THREE.Group {
  const group = new THREE.Group();

  const wallMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 });
  const blueMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 });
  const greenGlowMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    emissive: 0x10b981,
    emissiveIntensity: 1.8,
  });

  // Pharmacy Building (Width: 16m, Height: 7m, Depth: 12m)
  const bldg = new THREE.Mesh(new THREE.BoxGeometry(16, 7, 12), wallMat);
  bldg.position.set(0, 3.5, 0);
  bldg.castShadow = true;
  group.add(bldg);

  // Blue Facade Header
  const header = new THREE.Mesh(new THREE.BoxGeometry(16.5, 1.8, 0.4), blueMat);
  header.position.set(0, 5.8, 6.1);
  group.add(header);

  // Glowing 3D Medical Cross Emblem (Vertical & Horizontal Bars)
  const crossGroup = new THREE.Group();
  crossGroup.position.set(-6.2, 5.8, 6.4);

  const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.2, 0.15), greenGlowMat);
  const crossH = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.35, 0.15), greenGlowMat);
  crossGroup.add(crossV);
  crossGroup.add(crossH);
  group.add(crossGroup);

  // Pharmacy Bilingual Signboard
  const signTex = createNeonSignTexture(
    'அப்போலோ பார்மசி • 24 மணி நேர மருந்தகம்',
    'APOLLO PHARMACY 24x7 HEALTHCARE',
    'GENUINE MEDICINES • BABY CARE • HEALTH SCREENING',
    '#0284c7',
    '#34d399'
  );
  const signMesh = new THREE.Mesh(
    new THREE.BoxGeometry(11, 1.5, 0.1),
    new THREE.MeshStandardMaterial({ map: signTex })
  );
  signMesh.position.set(1.2, 5.8, 6.35);
  group.add(signMesh);

  // Large Glass Entry Doors and Medicine Display Window
  const glassMat = new THREE.MeshStandardMaterial({ color: 0xdcfce7, transparent: true, opacity: 0.55, roughness: 0.15, metalness: 0.85 });
  const windowMesh = new THREE.Mesh(new THREE.BoxGeometry(13, 3.8, 0.2), glassMat);
  windowMesh.position.set(0, 2.0, 6.05);
  group.add(windowMesh);

  // Interior medicine shelving racks (visible through glass)
  const shelfMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0 });
  for (let s = -4.5; s <= 4.5; s += 3.0) {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.2, 0.6), shelfMat);
    shelf.position.set(s, 1.8, 4.8);
    group.add(shelf);
  }

  return group;
}

/**
 * 3. Reliance Fresh Supermarket (Groceries & Departmental Store)
 */
export function createRelianceSupermarket(): THREE.Group {
  const group = new THREE.Group();

  const wallMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.7 });
  const redMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.4 });
  const greenMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.4 });

  // Main Supermarket Structure (Width: 26m, Height: 8m, Depth: 16m)
  const bldg = new THREE.Mesh(new THREE.BoxGeometry(26, 8, 16), wallMat);
  bldg.position.set(0, 4.0, 0);
  bldg.castShadow = true;
  group.add(bldg);

  // Reliance Red/Green Canopy Fascia
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(27, 2.2, 1.2), redMat);
  canopy.position.set(0, 6.8, 8.4);
  group.add(canopy);

  const greenTrim = new THREE.Mesh(new THREE.BoxGeometry(27, 0.35, 1.3), greenMat);
  greenTrim.position.set(0, 5.6, 8.4);
  group.add(greenTrim);

  // Signboard: "ரிலையன்ஸ் ஃப்ரெஷ் • RELIANCE FRESH SUPERMARKET"
  const signTex = createNeonSignTexture(
    'ரிலையன்ஸ் ஃப்ரெஷ் • பல்பொருள் அங்காடி',
    'RELIANCE FRESH SUPERMARKET',
    'FRESH VEGETABLES • FRUITS • DAIRY • GROCERIES • ORGANIC',
    '#b91c1c',
    '#facc15'
  );
  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(20, 1.8, 0.15),
    new THREE.MeshStandardMaterial({ map: signTex })
  );
  sign.position.set(0, 6.8, 9.05);
  group.add(sign);

  // Glass front entrance
  const glassMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.55, roughness: 0.1, metalness: 0.85 });
  const glass = new THREE.Mesh(new THREE.BoxGeometry(20, 4.2, 0.2), glassMat);
  glass.position.set(0, 2.2, 8.05);
  group.add(glass);

  // Stacks of red & green fruit crates outside
  const crateGeo = new THREE.BoxGeometry(1.2, 0.7, 0.9);
  const crateMat1 = new THREE.MeshStandardMaterial({ color: 0xe11d48 });
  const crateMat2 = new THREE.MeshStandardMaterial({ color: 0x16a34a });
  for (let c = -8; c <= 8; c += 2.2) {
    if (Math.abs(c) < 3) continue; // Entrance clearance
    const crt1 = new THREE.Mesh(crateGeo, crateMat1);
    crt1.position.set(c, 0.35, 9.2);
    group.add(crt1);

    const crt2 = new THREE.Mesh(crateGeo, crateMat2);
    crt2.position.set(c, 0.95, 9.2);
    group.add(crt2);
  }

  return group;
}

/**
 * 4. Madras Filter Coffee Cafe & Outdoor Bakery
 */
export function createMadrasFilterCoffeeCafe(): THREE.Group {
  const group = new THREE.Group();

  const terracottaMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.75 });
  const creamMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.6 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });
  const awningMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.5 });

  // Main Cafe Building (Width: 14m, Height: 6.5m, Depth: 12m)
  const bldg = new THREE.Mesh(new THREE.BoxGeometry(14, 6.5, 12), creamMat);
  bldg.position.set(0, 3.25, 0);
  bldg.castShadow = true;
  group.add(bldg);

  // Traditional Terracotta Clay-Tiled Roof Overhang
  const roof = new THREE.Mesh(new THREE.BoxGeometry(15, 0.8, 13.5), terracottaMat);
  roof.position.set(0, 6.6, 0.5);
  group.add(roof);

  // Striped Cafe Awning
  const awning = new THREE.Mesh(new THREE.BoxGeometry(13.5, 0.1, 3.5), awningMat);
  awning.position.set(0, 4.5, 7.2);
  awning.rotation.x = 0.2;
  group.add(awning);

  // Signboard: "மெட்ராஸ் ஃபில்டர் காபி & பேக்கரி"
  const signTex = createNeonSignTexture(
    'மெட்ராஸ் ஃபில்டர் காபி & பேக்கரி',
    'MADRAS FILTER COFFEE & ARTISAN BAKERY',
    'PURE DEGREE COFFEE • FRESH PUFFS • SAMOSA • SWEETS',
    '#78350f',
    '#fde047'
  );
  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(11, 1.4, 0.15),
    new THREE.MeshStandardMaterial({ map: signTex })
  );
  sign.position.set(0, 5.4, 6.1);
  group.add(sign);

  // Outdoor Cafe Seating Area (Paved patio with umbrella and round tables)
  const patio = new THREE.Mesh(
    new THREE.PlaneGeometry(15, 7),
    new THREE.MeshStandardMaterial({ color: 0xd6d3d1, roughness: 0.7 })
  );
  patio.rotateX(-Math.PI / 2);
  patio.position.set(0, 0.02, 9.5);
  group.add(patio);

  // 2 Outdoor Table Sets with Red Parasol Umbrellas
  [-3.8, 3.8].forEach((tx) => {
    // Round table
    const table = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.75, 12), woodMat);
    table.position.set(tx, 0.38, 9.5);
    group.add(table);

    // Parasol pole
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.6, 8), woodMat);
    pole.position.set(tx, 1.3, 9.5);
    group.add(pole);

    // Parasol cone canopy
    const umbrella = new THREE.Mesh(new THREE.ConeGeometry(1.8, 0.6, 10), awningMat);
    umbrella.position.set(tx, 2.6, 9.5);
    group.add(umbrella);

    // Chairs
    for (let c = 0; c < 3; c++) {
      const ang = (c * Math.PI * 2) / 3;
      const chair = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.45, 8), woodMat);
      chair.position.set(tx + Math.cos(ang) * 1.2, 0.23, 9.5 + Math.sin(ang) * 1.2);
      group.add(chair);
    }
  });

  return group;
}

/**
 * 5. Pothys & Nalli Silk Sarees & Gold Textiles Emporium
 */
export function createTextileEmporium(): THREE.Group {
  const group = new THREE.Group();

  const grandWallMat = new THREE.MeshStandardMaterial({ color: 0xffedd5, roughness: 0.6 });
  const goldTrimMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.85, roughness: 0.2 });
  const maroonMat = new THREE.MeshStandardMaterial({ color: 0x831843, roughness: 0.4 });

  // 3-Story Luxury Textile Palace (Width: 28m, Height: 14m, Depth: 18m)
  const bldg = new THREE.Mesh(new THREE.BoxGeometry(28, 14, 18), grandWallMat);
  bldg.position.set(0, 7.0, 0);
  bldg.castShadow = true;
  group.add(bldg);

  // Grand Decorative Arched Facade Pillars
  [-12, -4, 4, 12].forEach((px) => {
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 14, 12), goldTrimMat);
    pillar.position.set(px, 7.0, 9.2);
    group.add(pillar);
  });

  // Top Maroon Header with Golden Cornice
  const cornice = new THREE.Mesh(new THREE.BoxGeometry(30, 2.4, 1.5), maroonMat);
  cornice.position.set(0, 13.5, 9.2);
  group.add(cornice);

  // Signboard: "பொத்திஸ் பட்டு & தங்க ஜரிகை புடவைகள்"
  const signTex = createNeonSignTexture(
    'பொத்திஸ் பரம்பரை பட்டு மையம்',
    'POTHYS SILKS & KANCHIPURAM TEXTILE PALACE',
    'PURE SILK SAREES • WEDDING SILKS • DHOTIES • GOLD EMBROIDERY',
    '#831843',
    '#fbbf24'
  );
  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(22, 2.0, 0.2),
    new THREE.MeshStandardMaterial({ map: signTex })
  );
  sign.position.set(0, 13.5, 10.0);
  group.add(sign);

  // Ground Floor Large Glass Showcase Window
  const glassMat = new THREE.MeshStandardMaterial({ color: 0xfdf4ff, transparent: true, opacity: 0.55, roughness: 0.1, metalness: 0.85 });
  const windowMesh = new THREE.Mesh(new THREE.BoxGeometry(24, 4.5, 0.2), glassMat);
  windowMesh.position.set(0, 2.8, 9.1);
  group.add(windowMesh);

  // Silk Saree Mannequins inside showcase
  const silkColors = [0xd97706, 0xdc2626, 0x0284c7, 0x10b981];
  for (let m = -8; m <= 8; m += 4) {
    const mannequin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.45, 2.2, 8),
      new THREE.MeshStandardMaterial({ color: silkColors[Math.floor(Math.random() * silkColors.length)] })
    );
    mannequin.position.set(m, 1.5, 8.2);
    group.add(mannequin);
  }

  return group;
}

/**
 * 6. High-Tech Electronics & Mobile Showroom (Croma / Reliance Digital)
 */
export function createElectronicsShowroom(): THREE.Group {
  const group = new THREE.Group();

  const darkMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
  const blueCyanMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.3 });

  // 2-Story Modern Glass & Steel Building (Width: 20m, Height: 9.5m, Depth: 14m)
  const bldg = new THREE.Mesh(new THREE.BoxGeometry(20, 9.5, 14), darkMat);
  bldg.position.set(0, 4.75, 0);
  bldg.castShadow = true;
  group.add(bldg);

  // Cyan Neon Canopy
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(21, 1.6, 1.2), blueCyanMat);
  canopy.position.set(0, 8.4, 7.3);
  group.add(canopy);

  // Signboard: "க்ரோமா டிஜிட்டல் • எலக்ட்ரானிக்ஸ்"
  const signTex = createNeonSignTexture(
    'க்ரோமா டிஜிட்டல் • ஸ்மார்ட்போன் & லேப்டாப்',
    'CROMA DIGITAL ELECTRONICS & GADGETS',
    'SMARTPHONES • 4K OLED TVS • GAMING LAPTOPS • SOUNDBARS',
    '#0f172a',
    '#22d3ee'
  );
  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(17, 1.8, 0.15),
    new THREE.MeshStandardMaterial({ map: signTex })
  );
  sign.position.set(0, 8.4, 7.95);
  group.add(sign);

  // Full-Height Glass Facade
  const glassMat = new THREE.MeshStandardMaterial({ color: 0xcffafe, transparent: true, opacity: 0.55, roughness: 0.1, metalness: 0.85 });
  const glass = new THREE.Mesh(new THREE.BoxGeometry(18, 6.8, 0.2), glassMat);
  glass.position.set(0, 3.8, 7.05);
  group.add(glass);

  // Glowing Gadget Display Screens inside window
  for (let s = -6; s <= 6; s += 4) {
    const screen = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 1.0, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 1.5 })
    );
    screen.position.set(s, 2.5, 6.0);
    group.add(screen);
  }

  return group;
}

/**
 * 7. Modern Fuel Plaza & EV Supercharger Station
 * (BPCL / Indian Oil Speed Petrol Pump with convenience store & EV chargers)
 */
export function createModernFuelPlaza(): THREE.Group {
  const group = new THREE.Group();

  const canopyMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
  const blueMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.4 });
  const evCyanMat = new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    emissive: 0x06b6d4,
    emissiveIntensity: 1.6,
  });

  // Concrete Paved Forecourt (Width: 38m, Depth: 24m)
  const court = new THREE.Mesh(
    new THREE.PlaneGeometry(38, 24),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 })
  );
  court.rotateX(-Math.PI / 2);
  court.position.set(0, 0.02, 0);
  group.add(court);

  // Overhead Gas Station Canopy (Width: 28m, Depth: 14m, Height: 6.8m)
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(28, 1.2, 14), canopyMat);
  canopy.position.set(0, 6.2, 0);
  group.add(canopy);

  // Illuminated Canopy Edging
  const edgeYellow = new THREE.Mesh(
    new THREE.BoxGeometry(28.4, 0.25, 14.4),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xfacc15, emissiveIntensity: 1.2 })
  );
  edgeYellow.position.set(0, 5.6, 0);
  group.add(edgeYellow);

  // 4 Robust Canopy Steel Support Columns
  const colGeo = new THREE.CylinderGeometry(0.4, 0.45, 6.2, 12);
  [-9, 9].forEach((cx) => {
    [-4, 4].forEach((cz) => {
      const col = new THREE.Mesh(colGeo, whiteMat);
      col.position.set(cx, 3.1, cz);
      group.add(col);
    });
  });

  // 4 Fuel Pump Dispenser Islands
  for (let px = -7; px <= 7; px += 4.5) {
    // Concrete raised island
    const island = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.25, 4.2), whiteMat);
    island.position.set(px, 0.125, 0);
    group.add(island);

    // Fuel dispenser unit with LED screen
    const pump = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.2, 1.2), blueMat);
    pump.position.set(px, 1.22, 0);
    group.add(pump);

    // Digital rate LED display
    const led = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.35, 1.25),
      new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x16a34a, emissiveIntensity: 1.4 })
    );
    led.position.set(px, 1.7, 0);
    group.add(led);
  }

  // 2 High-Speed EV Supercharger Stalls on the right side
  for (let ex = 14; ex <= 17; ex += 3) {
    const evCharger = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.4, 0.6), whiteMat);
    evCharger.position.set(ex, 1.2, -6);
    group.add(evCharger);

    const evGlow = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.8, 0.65), evCyanMat);
    evGlow.position.set(ex, 1.6, -6);
    group.add(evGlow);
  }

  // 24x7 Convenience Store behind the fuel pumps
  const store = new THREE.Mesh(new THREE.BoxGeometry(22, 4.5, 8), whiteMat);
  store.position.set(0, 2.25, -9);
  group.add(store);

  // Store Sign: "SPEED MART 24x7"
  const signTex = createNeonSignTexture(
    'ஸ்பீட் மார்ட் • 24 மணி நேர சிற்றுண்டி',
    'SPEED MART 24x7 CONVENIENCE STORE',
    'COLD DRINKS • SNACKS • TYRE AIR • ATM • COFFEE',
    '#1d4ed8',
    '#facc15'
  );
  const sign = new THREE.Mesh(new THREE.BoxGeometry(16, 1.4, 0.15), new THREE.MeshStandardMaterial({ map: signTex }));
  sign.position.set(0, 3.8, -4.9);
  group.add(sign);

  return group;
}

/**
 * 8. Punjabi Highway Royal Dhaba (Open-Air Restaurant with cots and tandoor)
 */
export function createPunjabiRoyalDhaba(): THREE.Group {
  const group = new THREE.Group();

  const mudMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.85 });
  const tinRoofMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.65, metalness: 0.2 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });

  // Main Dhaba Hall (Width: 22m, Height: 4.8m, Depth: 14m)
  const hall = new THREE.Mesh(new THREE.BoxGeometry(22, 4.8, 14), mudMat);
  hall.position.set(0, 2.4, 0);
  hall.castShadow = true;
  group.add(hall);

  // Slanted corrugated red tin roof
  const roof = new THREE.Mesh(new THREE.BoxGeometry(24, 0.35, 16), tinRoofMat);
  roof.position.set(0, 4.9, 0.8);
  roof.rotation.x = 0.08;
  group.add(roof);

  // Dhaba Bilingual Signboard
  const signTex = createNeonSignTexture(
    'ராயல் பஞ்சாபி தாபா • ஹைவே கிங்',
    'ROYAL PUNJABI HIGHWAY KING DHABA',
    'TANDOORI ROTI • DAL MAKHANI • CHICKEN TIKKA • MASALA CHAI',
    '#991b1b',
    '#facc15'
  );
  const sign = new THREE.Mesh(new THREE.BoxGeometry(18, 1.8, 0.2), new THREE.MeshStandardMaterial({ map: signTex }));
  sign.position.set(0, 5.6, 7.8);
  group.add(sign);

  // Traditional Charpais (Rope cots) in open-air courtyard
  const cotMat = new THREE.MeshStandardMaterial({ color: 0xca8a04, roughness: 0.8 });
  for (let row = 0; row < 2; row++) {
    for (let c = -8; c <= 8; c += 4) {
      const cot = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.45, 1.4), cotMat);
      cot.position.set(c, 0.23, 10.5 + row * 2.8);
      group.add(cot);
    }
  }

  // Tandoor Clay Oven cylinder with glowing embers
  const tandoor = new THREE.Mesh(
    new THREE.CylinderGeometry(0.65, 0.85, 1.2, 12),
    new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 })
  );
  tandoor.position.set(8.5, 0.6, 9.5);
  group.add(tandoor);

  const coals = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.5, 0.1, 10),
    new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xf97316, emissiveIntensity: 2.2 })
  );
  coals.position.set(8.5, 1.15, 9.5);
  group.add(coals);

  return group;
}

/**
 * Populates all commercial shops, markets, and showrooms across the city grid
 */
export function populateComprehensiveCityShops(
  worldGroup: THREE.Group,
  obstacles: WorldObstacle[]
) {
  const shopsGroup = new THREE.Group();
  worldGroup.add(shopsGroup);

  // Helper to register an obstacle with bounding box
  const registerObstacle = (x: number, z: number, width: number, depth: number, height: number) => {
    obstacles.push({
      minX: x - width / 2,
      maxX: x + width / 2,
      minZ: z - depth / 2,
      maxZ: z + depth / 2,
      height,
    });
  };

  // =================================================================
  // DISTRICT 1: DOWNTOWN COMMERCIAL BOULEVARD (z = -80, x = 60 to 650)
  // =================================================================
  // 1. Supercar & Tuning Motorsports Garage at x = 75, z = -115
  const garage = createSupercarTuningGarage();
  garage.position.set(75, 0, -115);
  shopsGroup.add(garage);
  registerObstacle(75, -115, 36, 22, 9);

  // 2. Apollo Pharmacy at x = 160, z = -115
  const pharmacy1 = createApolloPharmacy();
  pharmacy1.position.set(160, 0, -115);
  shopsGroup.add(pharmacy1);
  registerObstacle(160, -115, 16, 12, 7);

  // 3. Madras Filter Coffee Cafe & Bakery at x = 210, z = -115
  const cafe1 = createMadrasFilterCoffeeCafe();
  cafe1.position.set(210, 0, -115);
  shopsGroup.add(cafe1);
  registerObstacle(210, -115, 14, 12, 6.5);

  // 4. Reliance Fresh Supermarket at x = 270, z = -115
  const supermarket = createRelianceSupermarket();
  supermarket.position.set(270, 0, -115);
  shopsGroup.add(supermarket);
  registerObstacle(270, -115, 26, 16, 8);

  // 5. Croma Electronics Showroom at x = 360, z = -115
  const croma = createElectronicsShowroom();
  croma.position.set(360, 0, -115);
  shopsGroup.add(croma);
  registerObstacle(360, -115, 20, 14, 9.5);

  // 6. Pothys Silk Sarees Palace at x = 440, z = -115
  const pothys = createTextileEmporium();
  pothys.position.set(440, 0, -115);
  shopsGroup.add(pothys);
  registerObstacle(440, -115, 28, 18, 14);

  // South side of City Boulevard (z = -45)
  // 7. Modern Fuel Plaza at x = 120, z = -45
  const fuelPlaza = createModernFuelPlaza();
  fuelPlaza.position.set(120, 0, -45);
  fuelPlaza.rotation.y = Math.PI;
  shopsGroup.add(fuelPlaza);
  registerObstacle(120, -45, 38, 24, 7);

  // 8. Apollo Pharmacy 2 at x = 320, z = -45
  const pharmacy2 = createApolloPharmacy();
  pharmacy2.position.set(320, 0, -45);
  pharmacy2.rotation.y = Math.PI;
  shopsGroup.add(pharmacy2);
  registerObstacle(320, -45, 16, 12, 7);

  // =================================================================
  // DISTRICT 2: MARKET COMMERCIAL BOULEVARD (z = +220, x = 60 to 650)
  // =================================================================
  // 9. Tamil Tyre & Wheel Alignment Center at x = 85, z = 250
  const tyreShop = createTamilTyreShop();
  tyreShop.position.set(85, 0, 250);
  shopsGroup.add(tyreShop);
  registerObstacle(85, 250, 14, 10, 4.5);

  // 10. Tamil Tea Stall at x = 140, z = 250
  const teaStall1 = createTamilTeaStall('மலர் டீ ஸ்டால் & பேக்கரி', 'MALAR TEA STALL & FILTER COFFEE', 'HOT SAMOSA • VADA • TEA');
  teaStall1.position.set(140, 0, 250);
  shopsGroup.add(teaStall1);
  registerObstacle(140, 250, 6, 5, 3.5);

  // 11. Fresh Tender Coconut Stall at x = 175, z = 250
  const coconutStall1 = createTamilTenderCoconutStall();
  coconutStall1.position.set(175, 0, 250);
  shopsGroup.add(coconutStall1);
  registerObstacle(175, 250, 5, 4, 3.2);

  // 12. Madras Filter Coffee Cafe 2 at x = 230, z = 250
  const cafe2 = createMadrasFilterCoffeeCafe();
  cafe2.position.set(230, 0, 250);
  shopsGroup.add(cafe2);
  registerObstacle(230, 250, 14, 12, 6.5);

  // 13. Reliance Supermarket 2 at x = 330, z = 250
  const supermarket2 = createRelianceSupermarket();
  supermarket2.position.set(330, 0, 250);
  shopsGroup.add(supermarket2);
  registerObstacle(330, 250, 26, 16, 8);

  // 14. Electronics Showroom 2 at x = 440, z = 250
  const croma2 = createElectronicsShowroom();
  croma2.position.set(440, 0, 250);
  shopsGroup.add(croma2);
  registerObstacle(440, 250, 20, 14, 9.5);

  // North side of Market Boulevard (z = 190)
  // 15. Bus Stop Shelter at x = 110, z = 190
  const busStop = createTamilBusStopShelter('தியாகராய நகர்', 'T. NAGAR COMMERCIAL HUB', ['12B', '21G', '47A', '570']);
  busStop.position.set(110, 0, 190);
  busStop.rotation.y = Math.PI;
  shopsGroup.add(busStop);

  // 16. Textile Palace 2 at x = 280, z = 190
  const pothys2 = createTextileEmporium();
  pothys2.position.set(280, 0, 190);
  pothys2.rotation.y = Math.PI;
  shopsGroup.add(pothys2);
  registerObstacle(280, 190, 28, 18, 14);

  // =================================================================
  // DISTRICT 3: HIGHWAY CORRIDOR DHABA & FOOD PLAZAS (x = 38 to 65, z = -300 to +1600)
  // =================================================================
  // 17. Punjabi Royal Dhaba at x = 48, z = -140
  const dhaba = createPunjabiRoyalDhaba();
  dhaba.position.set(48, 0, -140);
  shopsGroup.add(dhaba);
  registerObstacle(48, -140, 22, 14, 5);

  // 18. Tea Stall on highway service road at x = 32, z = 80
  const teaStall2 = createTamilTeaStall('காவிரி டீ ஸ்டால்', 'KAVERI HIGHWAY TEA & SNACKS', 'GINGER TEA • MEDU VADA');
  teaStall2.position.set(32, 0, 80);
  shopsGroup.add(teaStall2);
  registerObstacle(32, 80, 6, 5, 3.5);

  // 19. Tender Coconut Stall at x = 32, z = 450
  const coconutStall2 = createTamilTenderCoconutStall();
  coconutStall2.position.set(32, 0, 450);
  shopsGroup.add(coconutStall2);
  registerObstacle(32, 450, 5, 4, 3.2);

  // =================================================================
  // DISTRICT 4: WESTERN RESIDENTIAL & VILLAGE BAZAAR (x = -450 to -80, z = -650 to +200)
  // =================================================================
  // 20. Village Tea Stall at x = -200, z = -80
  const villageTea = createTamilTeaStall('கிராமத்து டீ ஸ்டால்', 'VILLAGE CORNER TEA & TIFFIN', 'IDLI • DOSA • VADA');
  villageTea.position.set(-200, 0, -60);
  shopsGroup.add(villageTea);
  registerObstacle(-200, -60, 6, 5, 3.5);

  // 21. Village Tyre Workshop at x = -320, z = -80
  const villageTyre = createTamilTyreShop();
  villageTyre.position.set(-320, 0, -60);
  shopsGroup.add(villageTyre);
  registerObstacle(-320, -60, 14, 10, 4.5);

  // 22. Village Coconut Vendor at x = -420, z = -350
  const villageCoco = createTamilTenderCoconutStall();
  villageCoco.position.set(-420, 0, -350);
  shopsGroup.add(villageCoco);
  registerObstacle(-420, -350, 5, 4, 3.2);

  // =================================================================
  // DISTRICT 5: SOUTHERN HIGHWAY & LAKE PLAZA (z = 880 to 2380)
  // =================================================================
  // 23. Southern Highway Fuel & EV Supercharger Plaza at x = -48, z = 1100
  const southFuel = createModernFuelPlaza();
  southFuel.position.set(-48, 0, 1100);
  shopsGroup.add(southFuel);
  registerObstacle(-48, 1100, 38, 24, 7);

  // 24. Saravana Bhavan Highway Food Court & Filter Coffee at x = 48, z = 1350
  const highwayCafe = createMadrasFilterCoffeeCafe();
  highwayCafe.position.set(48, 0, 1350);
  shopsGroup.add(highwayCafe);
  registerObstacle(48, 1350, 16, 14, 7);

  // 25. Highway Royal Punjabi Dhaba 2 at x = 48, z = 1650
  const southDhaba = createPunjabiRoyalDhaba();
  southDhaba.position.set(48, 0, 1650);
  shopsGroup.add(southDhaba);
  registerObstacle(48, 1650, 22, 14, 5);

  // 26. Highway 24x7 Apollo Emergency Pharmacy at x = -42, z = 1400
  const southPharmacy = createApolloPharmacy();
  southPharmacy.position.set(-42, 0, 1400);
  shopsGroup.add(southPharmacy);
  registerObstacle(-42, 1400, 16, 12, 7);

  // 27. Southern Lake Rest Stop Tea Kadai at x = 35, z = 1900
  const lakeTea = createTamilTeaStall('ஏரிக்கரை டீ & டிபன்', 'LAKE VIEW CHAI & TIFFIN CENTER', 'HOT SAMOSA • VADA • TEA');
  lakeTea.position.set(35, 0, 1900);
  shopsGroup.add(lakeTea);
  registerObstacle(35, 1900, 6, 5, 3.5);

  // 28. Southern Highway Tyre & Puncture Workshop at x = -36, z = 1900
  const southTyre = createTamilTyreShop();
  southTyre.position.set(-36, 0, 1900);
  shopsGroup.add(southTyre);
  registerObstacle(-36, 1900, 14, 10, 4.5);

  // 29. Terminus Supercar Garage 2 at x = 240, z = 880
  const southGarage = createSupercarTuningGarage();
  southGarage.position.set(240, 0, 880);
  shopsGroup.add(southGarage);
  registerObstacle(240, 880, 36, 22, 9);

  // 30. East Marina Beachfront Cafe at x = 700, z = 220
  const beachCafe = createMadrasFilterCoffeeCafe();
  beachCafe.position.set(700, 0, 220);
  shopsGroup.add(beachCafe);
  registerObstacle(700, 220, 14, 12, 6.5);

  // 31. East Marina Coconut Oasis at x = 700, z = 520
  const beachCoco = createTamilTenderCoconutStall();
  beachCoco.position.set(700, 0, 520);
  shopsGroup.add(beachCoco);
  registerObstacle(700, 520, 5, 4, 3.2);

  // 32. Far West Mountain Dhaba at x = -700, z = -650
  const mountainDhaba = createPunjabiRoyalDhaba();
  mountainDhaba.position.set(-700, 0, -650);
  shopsGroup.add(mountainDhaba);
  registerObstacle(-700, -650, 22, 14, 5);
}

export const populateCityShops = populateComprehensiveCityShops;
