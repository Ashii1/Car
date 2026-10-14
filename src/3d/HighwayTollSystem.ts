import * as THREE from 'three';

export interface TollPlazaCallbacks {
  onTollPaid: (fee: number) => void;
  onTollWarning: (msg: string) => void;
  onTollViolation: () => void;
}

export class HighwayTollSystem {
  private scene: THREE.Scene;
  private callbacks: TollPlazaCallbacks;
  private rootGroup = new THREE.Group();
  private boomBarriers: THREE.Group[] = [];
  private ledDisplays: THREE.Mesh[] = [];
  private staffHumans: THREE.Group[] = [];

  // State
  private isPaid = false;
  private isGateOpen = true; // Open express lanes for smooth passage
  private gateAngle = (Math.PI / 2) * 0.92; // default open
  private lastTollTime = 0;

  // Toll booth position along Z axis on NH-48
  public static readonly TOLL_Z = 868;
  public static readonly TOLL_FEE = 60; // ₹60 FASTag toll

  constructor(scene: THREE.Scene, callbacks: TollPlazaCallbacks) {
    this.scene = scene;
    this.callbacks = callbacks;
    this.initPlaza();
  }

  private initPlaza() {
    this.rootGroup.position.set(0, 0, HighwayTollSystem.TOLL_Z);
    this.scene.add(this.rootGroup);

    const metalMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.25 });
    const barrierMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 }); // Yellow/black striped arm
    const screenGreenMat = new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, emissiveIntensity: 2.2 });
    const uniformMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.6 }); // Navy blue toll operator uniform
    const hiVisMat = new THREE.MeshStandardMaterial({ color: 0x84cc16, emissive: 0x4d7c0f, emissiveIntensity: 0.4 }); // Fluorescent yellow-green safety vest
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xc68b59, roughness: 0.7 }); // Indian skin tone
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 }); // Dark trousers
    const capMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 });

    // 4 Toll Lanes across the highway carriageway: x = -11.4, -3.8, 3.8, 11.4
    const laneXs = [-11.4, -3.8, 3.8, 11.4];

    // Helper to create a stylized 3D human staff member
    const createStaffHuman = (isSecurity = false) => {
      const hGroup = new THREE.Group();

      // Legs / Pants
      const legs = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.85, 0.22), pantsMat);
      legs.position.set(0, 0.425, 0);
      legs.castShadow = true;
      hGroup.add(legs);

      // Torso / Shirt
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.55, 0.24), uniformMat);
      torso.position.set(0, 1.12, 0);
      torso.castShadow = true;
      hGroup.add(torso);

      // Hi-Vis Reflective Vest (for security guards / marshals)
      if (isSecurity) {
        const vest = new THREE.Mesh(new THREE.BoxGeometry(0.39, 0.45, 0.25), hiVisMat);
        vest.position.set(0, 1.15, 0);
        hGroup.add(vest);
      }

      // Head
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), skinMat);
      head.position.set(0, 1.54, 0);
      head.castShadow = true;
      hGroup.add(head);

      // Official Peak Cap
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.06, 12), capMat);
      cap.position.set(0, 1.62, 0);
      hGroup.add(cap);

      const capVisor = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, 0.1), capMat);
      capVisor.position.set(0, 1.61, 0.08);
      hGroup.add(capVisor);

      // Arms
      const armL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.52, 0.1), uniformMat);
      armL.position.set(-0.25, 1.12, 0);
      hGroup.add(armL);

      const armR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.52, 0.1), uniformMat);
      armR.position.set(0.25, 1.12, 0);
      hGroup.add(armR);

      // Security Marshal Traffic Baton
      if (isSecurity) {
        armR.rotation.x = -0.6; // Raising arm holding glowing baton
        const baton = new THREE.Mesh(
          new THREE.CylinderGeometry(0.02, 0.02, 0.38, 8),
          new THREE.MeshBasicMaterial({ color: 0xef4444 })
        );
        baton.position.set(0.28, 1.25, 0.2);
        baton.rotation.x = Math.PI / 2;
        hGroup.add(baton);
      }

      return hGroup;
    };

    laneXs.forEach((lx, idx) => {
      // 1. Pivot Gate Post on island
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 1.4, 12), metalMat);
      post.position.set(lx + 2.2, 0.7, 0);
      this.rootGroup.add(post);

      // 2. Pivoting Boom Barrier Arm (Open by default for highway flow)
      const pivotGroup = new THREE.Group();
      pivotGroup.position.set(lx + 2.2, 1.25, 0);
      pivotGroup.rotation.z = (Math.PI / 2) * 0.92; // 83 degrees open
      this.rootGroup.add(pivotGroup);

      // Striped Gate Arm (spans 4.2m across lane)
      const arm = new THREE.Mesh(
        new THREE.BoxGeometry(4.2, 0.12, 0.08),
        barrierMat
      );
      arm.position.set(-2.1, 0, 0);
      pivotGroup.add(arm);

      // Green tip flasher light (express lane indicator)
      const tipLight = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0x10b981 })
      );
      tipLight.position.set(-4.1, 0, 0);
      pivotGroup.add(tipLight);

      this.boomBarriers.push(pivotGroup);

      // 3. Overhead Electronic FASTag Status Screen (Glowing Green: OPEN)
      const ledScreen = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 0.75, 0.14),
        screenGreenMat
      );
      ledScreen.position.set(lx, 4.2, -0.2);
      this.rootGroup.add(ledScreen);
      this.ledDisplays.push(ledScreen);

      // 4. Add Humans: Toll Booth Operators inside booth
      const operator = createStaffHuman(false);
      operator.position.set(lx + 2.2, 0.6, 0); // Standing on island by booth window
      this.rootGroup.add(operator);
      this.staffHumans.push(operator);

      // 5. Add Security Guard / Traffic Marshal on islands
      if (idx === 1 || idx === 2) {
        const guard = createStaffHuman(true);
        guard.position.set(lx + 2.2, 0.6, 4.2); // Greeting oncoming traffic
        guard.rotation.y = Math.PI; // Facing approaching vehicles
        this.rootGroup.add(guard);
        this.staffHumans.push(guard);
      }
    });

    // 6. Toll Plaza Administration Office Staff & Pedestrian Crosswalk
    const supervisor = createStaffHuman(true);
    supervisor.position.set(-18, 0, 2);
    supervisor.rotation.y = Math.PI / 2;
    this.rootGroup.add(supervisor);
    this.staffHumans.push(supervisor);

    const patrolOfficer = createStaffHuman(false);
    patrolOfficer.position.set(18, 0, 5);
    patrolOfficer.rotation.y = -Math.PI / 3;
    this.rootGroup.add(patrolOfficer);
    this.staffHumans.push(patrolOfficer);

    // 7. Bilingual Tamil/English FASTag Toll Plaza Overhead Gantry
    const gantryCanvas = document.createElement('canvas');
    gantryCanvas.width = 1024;
    gantryCanvas.height = 128;
    const gCtx = gantryCanvas.getContext('2d')!;
    gCtx.fillStyle = '#1e3a8a';
    gCtx.fillRect(0, 0, 1024, 128);
    gCtx.fillStyle = '#fbbf24';
    gCtx.font = 'bold 44px sans-serif';
    gCtx.textAlign = 'center';
    gCtx.fillText('சுங்கச்சாவடி - NHAI FASTag TOLL PLAZA', 512, 60);
    gCtx.fillStyle = '#ffffff';
    gCtx.font = 'bold 28px sans-serif';
    gCtx.fillText('அனைத்து பாதைகளும் திறக்கப்பட்டுள்ளன • ALL LANES OPEN • NO STOPPING', 512, 104);

    const gantryTex = new THREE.CanvasTexture(gantryCanvas);
    const gantrySign = new THREE.Mesh(
      new THREE.BoxGeometry(32, 2.8, 0.3),
      new THREE.MeshStandardMaterial({ map: gantryTex, roughness: 0.4 })
    );
    gantrySign.position.set(0, 7.8, -4);
    this.rootGroup.add(gantrySign);
  }

  // Update check every frame
  public update(playerX: number, playerZ: number, playerSpeedKmh: number, delta: number) {
    const isInsideApproach = Math.abs(playerX) < 18 && playerZ > 830 && playerZ < 910;

    if (isInsideApproach) {
      const distToGate = HighwayTollSystem.TOLL_Z - playerZ;

      // Passing through toll plaza
      if (Math.abs(distToGate) <= 12 && !this.isPaid) {
        const now = Date.now();
        if (now - this.lastTollTime > 6000) {
          this.lastTollTime = now;
          this.isPaid = true;
          this.callbacks.onTollPaid(HighwayTollSystem.TOLL_FEE);
        }
      }
    }

    // Reset toll trigger after driving well clear
    if (playerZ > HighwayTollSystem.TOLL_Z + 80 || playerZ < HighwayTollSystem.TOLL_Z - 80) {
      this.isPaid = false;
    }

    // Keep gates open for high-speed cruising
    this.isGateOpen = true;
    const targetAngle = (Math.PI / 2) * 0.92;
    this.gateAngle = THREE.MathUtils.lerp(this.gateAngle, targetAngle, delta * 4.5);

    this.boomBarriers.forEach((barrier) => {
      barrier.rotation.z = this.gateAngle;
    });

    // Subtle breathing/idle animation for toll personnel
    const time = performance.now() * 0.002;
    this.staffHumans.forEach((human, i) => {
      human.position.y = (human.position.y || 0) + Math.sin(time + i) * 0.0004;
    });
  }

  public getIsOpen(): boolean {
    return true;
  }

  public dispose() {
    this.scene.remove(this.rootGroup);
    this.rootGroup.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const m = obj as THREE.Mesh;
        m.geometry?.dispose();
      }
    });
  }
}
