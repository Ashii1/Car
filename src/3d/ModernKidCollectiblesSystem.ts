import * as THREE from 'three';
import { cityAudio } from '../audio/CityAudioEngine';

export type KidItemType = 'boba_tea' | 'prime_hydration' | 'golden_skateboard' | 'cyber_headset' | 'streamer_rig';

export interface KidCollectibleItem {
  id: string;
  type: KidItemType;
  name: string;
  subtitle: string;
  x: number;
  y: number;
  z: number;
  cashReward: number;
  xpReward: number;
  meshGroup: THREE.Group;
  auraRingMesh: THREE.Mesh;
  isCollected: boolean;
  respawnTimer: number;
  bobPhase: number;
}

export interface CollectiblePickupResult {
  type: KidItemType;
  name: string;
  cashReward: number;
  xpReward: number;
  totalCollected: number;
}

export class ModernKidCollectiblesSystem {
  private group: THREE.Group;
  private items: KidCollectibleItem[] = [];
  public totalCollectedCount = 0;
  private onCollectCallback?: (result: CollectiblePickupResult) => void;

  // Particle burst effects upon collecting items
  private burstParticles: {
    mesh: THREE.Mesh;
    vel: THREE.Vector3;
    life: number;
    maxLife: number;
  }[] = [];

  constructor(scene: THREE.Scene, onCollect?: (result: CollectiblePickupResult) => void) {
    this.group = new THREE.Group();
    this.group.name = 'ModernKidCollectibles';
    this.onCollectCallback = onCollect;

    this.spawnInitialItems();
    scene.add(this.group);
  }

  private spawnInitialItems() {
    // 16 exciting locations across the open world map:
    // Plazas, highway flyovers, ramps, beach avenues, and urban alleys
    const spawnPoints: {
      type: KidItemType;
      name: string;
      subtitle: string;
      x: number;
      y: number;
      z: number;
      cash: number;
      xp: number;
    }[] = [
      {
        type: 'boba_tea',
        name: 'Galaxy Taro Boba Blast',
        subtitle: 'Refreshing tapioca pearl booster! +Instant Super Nitro!',
        x: 12,
        y: 1.2,
        z: 35,
        cash: 1200,
        xp: 400,
      },
      {
        type: 'prime_hydration',
        name: 'Prime Cyber Hydration',
        subtitle: 'Electrolyte max overdrive! +200% Hype Score!',
        x: -24,
        y: 1.2,
        z: 78,
        cash: 1500,
        xp: 500,
      },
      {
        type: 'golden_skateboard',
        name: 'Golden Stunt Hover-Deck',
        subtitle: 'Legendary 24K gold pop-deck! Modern kid grail item!',
        x: 0,
        y: 2.2,
        z: 140,
        cash: 2500,
        xp: 800,
      },
      {
        type: 'cyber_headset',
        name: 'Mecha Cat-Ear RGB Headset',
        subtitle: 'Ultra-bass soundstage with sync LED ears!',
        x: 45,
        y: 1.2,
        z: 110,
        cash: 1800,
        xp: 600,
      },
      {
        type: 'streamer_rig',
        name: 'Viral TikTok 8K Creator Phone',
        subtitle: 'Trending on For You page! +10,000 Live Viewers!',
        x: -55,
        y: 1.2,
        z: 25,
        cash: 2000,
        xp: 750,
      },
      {
        type: 'boba_tea',
        name: 'Brown Sugar Tiger Boba',
        subtitle: 'Caramelized swirl syrup & golden tapioca boba!',
        x: 30,
        y: 1.2,
        z: 220,
        cash: 1200,
        xp: 400,
      },
      {
        type: 'prime_hydration',
        name: 'Prime Ice Pop Nitro Fuel',
        subtitle: 'Cherry, blue raspberry & lemon lime freeze surge!',
        x: -80,
        y: 1.2,
        z: 190,
        cash: 1500,
        xp: 500,
      },
      {
        type: 'golden_skateboard',
        name: 'Neon Holo-Deck 360',
        subtitle: 'Iridescent maple kicktail with high-rebound wheels!',
        x: -12,
        y: 3.5,
        z: 320,
        cash: 2500,
        xp: 850,
      },
      {
        type: 'cyber_headset',
        name: 'Neon Cyberpunk Ear-Glow 7.1',
        subtitle: 'Haptic rumble feedback and RGB audio visualizer!',
        x: 75,
        y: 1.2,
        z: 280,
        cash: 1800,
        xp: 600,
      },
      {
        type: 'boba_tea',
        name: 'Matcha Cloud Bubble Tea',
        subtitle: 'Sweet matcha whip with chewy popping boba pearls!',
        x: -40,
        y: 1.2,
        z: -65,
        cash: 1200,
        xp: 400,
      },
      {
        type: 'prime_hydration',
        name: 'Prime Meta Moon Elixir',
        subtitle: 'Fruit candy burst with high-velocity nitro replenish!',
        x: 60,
        y: 1.2,
        z: -110,
        cash: 1500,
        xp: 500,
      },
      {
        type: 'streamer_rig',
        name: 'Hyper-Stabilized FPV Drone Gimbal',
        subtitle: 'Smooth 120 FPS cinematic stunt tracking rig!',
        x: -15,
        y: 1.2,
        z: -180,
        cash: 2200,
        xp: 700,
      },
    ];

    spawnPoints.forEach((sp, idx) => {
      const itemGroup = new THREE.Group();
      itemGroup.position.set(sp.x, sp.y, sp.z);

      // Create model based on type
      const mesh = this.createItemMesh(sp.type);
      itemGroup.add(mesh);

      // Glowing aura ring hovering under the item
      const ringGeo = new THREE.TorusGeometry(0.55, 0.028, 8, 24);
      ringGeo.rotateX(Math.PI / 2);
      const ringMat = new THREE.MeshStandardMaterial({
        color: 0x000000,
        emissive: this.getItemEmissiveColor(sp.type),
        emissiveIntensity: 2.5,
        roughness: 0.2,
      });
      const auraRing = new THREE.Mesh(ringGeo, ringMat);
      auraRing.position.y = -0.45;
      itemGroup.add(auraRing);

      this.group.add(itemGroup);

      this.items.push({
        id: `kid_item_${idx}`,
        type: sp.type,
        name: sp.name,
        subtitle: sp.subtitle,
        x: sp.x,
        y: sp.y,
        z: sp.z,
        cashReward: sp.cash,
        xpReward: sp.xp,
        meshGroup: itemGroup,
        auraRingMesh: auraRing,
        isCollected: false,
        respawnTimer: 0,
        bobPhase: Math.random() * Math.PI * 2,
      });
    });
  }

  private getItemEmissiveColor(type: KidItemType): number {
    switch (type) {
      case 'boba_tea':
        return 0xec4899; // Sweet pink
      case 'prime_hydration':
        return 0x00f0ff; // Cyan electric
      case 'golden_skateboard':
        return 0xfacc15; // Golden yellow
      case 'cyber_headset':
        return 0xa855f7; // Cyber violet
      case 'streamer_rig':
        return 0xff0055; // TikTok red/magenta
    }
  }

  private createItemMesh(type: KidItemType): THREE.Group {
    const group = new THREE.Group();

    if (type === 'boba_tea') {
      // 1. Transparent plastic Boba cup
      const cupGeo = new THREE.CylinderGeometry(0.24, 0.18, 0.52, 16);
      const cupMat = new THREE.MeshStandardMaterial({
        color: 0xfce7f3,
        roughness: 0.15,
        metalness: 0.1,
        transparent: true,
        opacity: 0.88,
      });
      const cup = new THREE.Mesh(cupGeo, cupMat);
      group.add(cup);

      // Tea Liquid inside
      const teaGeo = new THREE.CylinderGeometry(0.22, 0.17, 0.44, 16);
      const teaMat = new THREE.MeshStandardMaterial({
        color: 0xdb2777,
        emissive: 0x9d174d,
        emissiveIntensity: 0.8,
        roughness: 0.3,
      });
      const tea = new THREE.Mesh(teaGeo, teaMat);
      tea.position.y = -0.02;
      group.add(tea);

      // Dome Lid
      const domeGeo = new THREE.SphereGeometry(0.24, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.5);
      const domeMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.2,
      });
      const dome = new THREE.Mesh(domeGeo, domeMat);
      dome.position.y = 0.26;
      group.add(dome);

      // Big Rainbow Straw
      const strawGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.65, 8);
      strawGeo.rotateZ(0.2);
      const strawMat = new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: 0x00f0ff,
        emissiveIntensity: 1.5,
      });
      const straw = new THREE.Mesh(strawGeo, strawMat);
      straw.position.set(0.04, 0.35, 0);
      group.add(straw);

      // Boba Tapioca Pearls at bottom
      const bobaMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.8 });
      const pearlGeo = new THREE.SphereGeometry(0.038, 6, 6);
      for (let i = 0; i < 7; i++) {
        const pearl = new THREE.Mesh(pearlGeo, bobaMat);
        const ang = (i / 7) * Math.PI * 2;
        pearl.position.set(Math.cos(ang) * 0.1, -0.18, Math.sin(ang) * 0.1);
        group.add(pearl);
      }
    } else if (type === 'prime_hydration') {
      // 2. Prime Hydration Energy Bottle
      const bottleGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.62, 16);
      const bottleMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        emissive: 0x00f0ff,
        emissiveIntensity: 1.8,
        roughness: 0.2,
      });
      const bottle = new THREE.Mesh(bottleGeo, bottleMat);
      group.add(bottle);

      // Neck and Cap
      const neckGeo = new THREE.CylinderGeometry(0.1, 0.18, 0.14, 16);
      const neckMat = new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.3 });
      const neck = new THREE.Mesh(neckGeo, neckMat);
      neck.position.y = 0.36;
      group.add(neck);

      const capGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.1, 16);
      const capMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xffffff,
        emissiveIntensity: 1.2,
      });
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.y = 0.46;
      group.add(cap);

      // Center decorative brand ring
      const brandGeo = new THREE.CylinderGeometry(0.185, 0.185, 0.28, 16);
      const brandMat = new THREE.MeshStandardMaterial({
        color: 0xff0055,
        emissive: 0xff0055,
        emissiveIntensity: 1.4,
      });
      const brand = new THREE.Mesh(brandGeo, brandMat);
      group.add(brand);
    } else if (type === 'golden_skateboard') {
      // 3. Golden Skateboard Deck
      const deckGeo = new THREE.BoxGeometry(0.85, 0.035, 0.26);
      const deckMat = new THREE.MeshStandardMaterial({
        color: 0xeab308,
        emissive: 0xfacc15,
        emissiveIntensity: 2.0,
        metalness: 0.95,
        roughness: 0.2,
      });
      const deck = new THREE.Mesh(deckGeo, deckMat);
      group.add(deck);

      // Grip Tape Pattern
      const gripGeo = new THREE.BoxGeometry(0.75, 0.01, 0.24);
      const gripMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
      const grip = new THREE.Mesh(gripGeo, gripMat);
      grip.position.y = 0.022;
      group.add(grip);

      // Trucks & Wheels
      const truckMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.9 });
      const wheelMat = new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        emissive: 0x06b6d4,
        emissiveIntensity: 1.5,
      });
      const wheelGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.045, 12);
      wheelGeo.rotateZ(Math.PI / 2);

      [-0.28, 0.28].forEach((xPos) => {
        const truckGeo = new THREE.BoxGeometry(0.04, 0.05, 0.24);
        const truck = new THREE.Mesh(truckGeo, truckMat);
        truck.position.set(xPos, -0.04, 0);
        group.add(truck);

        const wL = new THREE.Mesh(wheelGeo, wheelMat);
        wL.position.set(xPos, -0.06, 0.13);
        const wR = new THREE.Mesh(wheelGeo, wheelMat);
        wR.position.set(xPos, -0.06, -0.13);
        group.add(wL, wR);
      });
    } else if (type === 'cyber_headset') {
      // 4. Mecha Cat-Ear RGB Headset
      const bandGeo = new THREE.TorusGeometry(0.24, 0.03, 8, 20, Math.PI);
      bandGeo.rotateZ(Math.PI);
      const bandMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.4 });
      const band = new THREE.Mesh(bandGeo, bandMat);
      group.add(band);

      // Ear Cups
      const cupGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.08, 16);
      cupGeo.rotateZ(Math.PI / 2);
      const cupMat = new THREE.MeshStandardMaterial({
        color: 0xa855f7,
        emissive: 0xa855f7,
        emissiveIntensity: 1.8,
      });
      const cupL = new THREE.Mesh(cupGeo, cupMat);
      cupL.position.set(-0.24, 0, 0);
      const cupR = new THREE.Mesh(cupGeo, cupMat);
      cupR.position.set(0.24, 0, 0);
      group.add(cupL, cupR);

      // Glowing Cat Ears on top
      const earGeo = new THREE.ConeGeometry(0.07, 0.14, 4);
      const earMat = new THREE.MeshStandardMaterial({
        color: 0xec4899,
        emissive: 0xec4899,
        emissiveIntensity: 2.2,
      });
      const earL = new THREE.Mesh(earGeo, earMat);
      earL.position.set(-0.13, 0.28, 0);
      earL.rotation.z = 0.25;
      const earR = new THREE.Mesh(earGeo, earMat);
      earR.position.set(0.13, 0.28, 0);
      earR.rotation.z = -0.25;
      group.add(earL, earR);
    } else {
      // 5. Streamer Smartphone Rig
      const phoneGeo = new THREE.BoxGeometry(0.28, 0.54, 0.025);
      const phoneMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.2 });
      const phone = new THREE.Mesh(phoneGeo, phoneMat);
      group.add(phone);

      // Screen with Live Glow
      const screenGeo = new THREE.PlaneGeometry(0.25, 0.5);
      const screenMat = new THREE.MeshStandardMaterial({
        color: 0xff0055,
        emissive: 0xff0055,
        emissiveIntensity: 2.5,
      });
      const screen = new THREE.Mesh(screenGeo, screenMat);
      screen.position.z = 0.015;
      group.add(screen);

      // Ring Light Halo around phone
      const ringLightGeo = new THREE.TorusGeometry(0.38, 0.02, 8, 24);
      const ringLightMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xffffff,
        emissiveIntensity: 3.0,
      });
      const ringLight = new THREE.Mesh(ringLightGeo, ringLightMat);
      group.add(ringLight);
    }

    return group;
  }

  public update(delta: number, playerX: number, playerY: number, playerZ: number) {
    const pickupDistSq = 3.6 * 3.6;

    this.items.forEach((item) => {
      if (item.isCollected) {
        item.respawnTimer -= delta;
        if (item.respawnTimer <= 0) {
          item.isCollected = false;
          item.meshGroup.visible = true;
          item.meshGroup.scale.set(0.1, 0.1, 0.1);
        }
        return;
      }

      // Smooth respawn pop-in scale
      if (item.meshGroup.scale.x < 1.0) {
        const newScale = Math.min(1.0, item.meshGroup.scale.x + delta * 2.5);
        item.meshGroup.scale.setScalar(newScale);
      }

      // Hover bobbing & spinning animation
      item.bobPhase += delta * 2.2;
      item.meshGroup.rotation.y += delta * 1.6;
      item.meshGroup.position.y = item.y + Math.sin(item.bobPhase) * 0.22;

      // Pulse aura ring
      const ringScale = 1.0 + Math.sin(item.bobPhase * 2) * 0.15;
      item.auraRingMesh.scale.set(ringScale, ringScale, ringScale);

      // Proximity collision detection with player
      const dx = playerX - item.x;
      const dy = playerY - item.y;
      const dz = playerZ - item.z;
      const distSq = dx * dx + dy * dy + dz * dz;

      if (distSq < pickupDistSq) {
        this.collectItem(item);
      }
    });

    // Update burst particles
    for (let i = this.burstParticles.length - 1; i >= 0; i--) {
      const p = this.burstParticles[i];
      p.life += delta;
      p.mesh.position.addScaledVector(p.vel, delta);
      p.vel.y -= 9.8 * delta * 0.4; // Light gravity
      const scale = Math.max(0, 1 - p.life / p.maxLife);
      p.mesh.scale.setScalar(scale);

      if (p.life >= p.maxLife) {
        this.group.remove(p.mesh);
        this.burstParticles.splice(i, 1);
      }
    }
  }

  private collectItem(item: KidCollectibleItem) {
    item.isCollected = true;
    item.respawnTimer = 45; // Respawns after 45 seconds
    item.meshGroup.visible = false;
    this.totalCollectedCount++;

    // Audio effects
    cityAudio.playCollectibleChime();
    cityAudio.playHypeNitro();

    // Spawn 12 glowing burst particles
    const pGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const pMat = new THREE.MeshBasicMaterial({
      color: this.getItemEmissiveColor(item.type),
    });

    for (let i = 0; i < 14; i++) {
      const pMesh = new THREE.Mesh(pGeo, pMat);
      pMesh.position.set(item.x, item.y + 0.3, item.z);
      this.group.add(pMesh);

      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 4.5;
      this.burstParticles.push({
        mesh: pMesh,
        vel: new THREE.Vector3(
          Math.cos(angle) * speed,
          2.0 + Math.random() * 3.5,
          Math.sin(angle) * speed
        ),
        life: 0,
        maxLife: 0.65 + Math.random() * 0.35,
      });
    }

    if (this.onCollectCallback) {
      this.onCollectCallback({
        type: item.type,
        name: item.name,
        cashReward: item.cashReward,
        xpReward: item.xpReward,
        totalCollected: this.totalCollectedCount,
      });
    }
  }

  public getItemsStatus() {
    return {
      total: this.items.length,
      active: this.items.filter((i) => !i.isCollected).length,
      totalCollected: this.totalCollectedCount,
    };
  }

  public dispose() {
    this.burstParticles.forEach((p) => this.group.remove(p.mesh));
    this.burstParticles = [];
    if (this.group.parent) {
      this.group.parent.remove(this.group);
    }
  }
}
