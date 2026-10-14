import * as THREE from 'three';
import { cityAudio } from '../audio/CityAudioEngine';

export type DroneSkinId = 'cyber_neon' | 'bubblegum' | 'golden_hawk' | 'voltage_yellow' | 'stealth_glitch';

export interface DroneSkinConfig {
  name: string;
  bodyColor: number;
  trimColor: number;
  neonColor: number;
  rotorGlowColor: number;
}

export const DRONE_SKINS: Record<DroneSkinId, DroneSkinConfig> = {
  cyber_neon: {
    name: 'Cyber Neon (Apex)',
    bodyColor: 0x0f172a,
    trimColor: 0x06b6d4,
    neonColor: 0x00f0ff,
    rotorGlowColor: 0xec4899,
  },
  bubblegum: {
    name: 'Bubblegum Blast',
    bodyColor: 0xf43f5e,
    trimColor: 0x10b981,
    neonColor: 0xff007f,
    rotorGlowColor: 0x06b6d4,
  },
  golden_hawk: {
    name: 'Golden Champion',
    bodyColor: 0x18181b,
    trimColor: 0xeab308,
    neonColor: 0xfacc15,
    rotorGlowColor: 0xf59e0b,
  },
  voltage_yellow: {
    name: 'Voltage Street',
    bodyColor: 0x1e293b,
    trimColor: 0xeab308,
    neonColor: 0xfacc15,
    rotorGlowColor: 0x38bdf8,
  },
  stealth_glitch: {
    name: 'Toxic Stealth',
    bodyColor: 0x09090b,
    trimColor: 0x22c55e,
    neonColor: 0x4ade80,
    rotorGlowColor: 0xa855f7,
  },
};

export class ModernKidCompanionDrone {
  public group: THREE.Group;
  private rotors: THREE.Group[] = [];
  private bodyMesh: THREE.Mesh;
  private visorMesh: THREE.Mesh;
  private ringMeshes: THREE.Mesh[] = [];
  private rotorTipMeshes: THREE.Mesh[] = [];
  
  // Materials for skin customization
  private bodyMat: THREE.MeshStandardMaterial;
  private trimMat: THREE.MeshStandardMaterial;
  private neonMat: THREE.MeshStandardMaterial;
  private rotorGlowMat: THREE.MeshBasicMaterial;

  // Flight physics & dynamics
  private currentPos = new THREE.Vector3(0, 5, 0);
  private currentVel = new THREE.Vector3();
  private targetOffset = new THREE.Vector3(1.8, 2.2, -1.2);
  private currentPitch = 0;
  private currentRoll = 0;
  private currentYaw = 0;
  private trickSpinAngle = 0;
  private isDoingTrick = false;
  private chirpTimer = 8;
  private hoverWobbleTime = 0;
  public isEnabled = true;
  public currentSkin: DroneSkinId = 'cyber_neon';

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    this.group.name = 'ModernKidCompanionDrone';

    const skin = DRONE_SKINS[this.currentSkin];

    // Shared materials
    this.bodyMat = new THREE.MeshStandardMaterial({
      color: skin.bodyColor,
      roughness: 0.35,
      metalness: 0.8,
    });

    this.trimMat = new THREE.MeshStandardMaterial({
      color: skin.trimColor,
      roughness: 0.4,
      metalness: 0.6,
    });

    this.neonMat = new THREE.MeshStandardMaterial({
      color: 0x000000,
      emissive: skin.neonColor,
      emissiveIntensity: 2.2,
      roughness: 0.2,
    });

    this.rotorGlowMat = new THREE.MeshBasicMaterial({
      color: skin.rotorGlowColor,
      transparent: true,
      opacity: 0.85,
    });

    // 1. Central Aerodynamic Pod Body
    const bodyGeo = new THREE.CylinderGeometry(0.22, 0.28, 0.16, 16);
    this.bodyMesh = new THREE.Mesh(bodyGeo, this.bodyMat);
    this.group.add(this.bodyMesh);

    // Top Dome Cowl
    const domeGeo = new THREE.SphereGeometry(0.22, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const domeMesh = new THREE.Mesh(domeGeo, this.trimMat);
    domeMesh.position.y = 0.08;
    this.group.add(domeMesh);

    // Front Cyclops Visor Eye
    const visorGeo = new THREE.BoxGeometry(0.28, 0.06, 0.12);
    this.visorMesh = new THREE.Mesh(visorGeo, this.neonMat);
    this.visorMesh.position.set(0, 0.02, 0.2);
    this.group.add(this.visorMesh);

    // 2. Four Diagonal Carbon Arms with Propeller Rings
    const armGeo = new THREE.CylinderGeometry(0.025, 0.03, 0.48, 8);
    armGeo.rotateZ(Math.PI / 2);
    const ringGeo = new THREE.TorusGeometry(0.18, 0.022, 8, 20);
    ringGeo.rotateX(Math.PI / 2);

    const bladeGeo = new THREE.BoxGeometry(0.32, 0.008, 0.035);
    const tipGeo = new THREE.SphereGeometry(0.02, 6, 6);

    const armAngles = [Math.PI * 0.25, Math.PI * 0.75, Math.PI * 1.25, Math.PI * 1.75];
    armAngles.forEach((angle) => {
      const armGroup = new THREE.Group();
      armGroup.rotation.y = angle;

      const arm = new THREE.Mesh(armGeo, this.trimMat);
      arm.position.x = 0.24;
      armGroup.add(arm);

      // Ring Guard
      const ring = new THREE.Mesh(ringGeo, this.neonMat);
      ring.position.x = 0.46;
      ring.position.y = 0.02;
      armGroup.add(ring);
      this.ringMeshes.push(ring);

      // Spinning Rotor Group
      const rotorGroup = new THREE.Group();
      rotorGroup.position.set(0.46, 0.05, 0);

      const blades = new THREE.Mesh(bladeGeo, this.bodyMat);
      rotorGroup.add(blades);

      // Glowing tip particles on rotor edges
      const tipL = new THREE.Mesh(tipGeo, this.rotorGlowMat);
      tipL.position.x = 0.15;
      const tipR = new THREE.Mesh(tipGeo, this.rotorGlowMat);
      tipR.position.x = -0.15;
      rotorGroup.add(tipL);
      rotorGroup.add(tipR);
      this.rotorTipMeshes.push(tipL, tipR);

      armGroup.add(rotorGroup);
      this.rotors.push(rotorGroup);

      this.group.add(armGroup);
    });

    // 3. Underside Searchlight & Gimbal Camera
    const cameraGimbalGeo = new THREE.SphereGeometry(0.08, 12, 10);
    const cameraGimbal = new THREE.Mesh(cameraGimbalGeo, this.trimMat);
    cameraGimbal.position.set(0, -0.09, 0.06);
    this.group.add(cameraGimbal);

    const lensGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.03, 12);
    lensGeo.rotateX(Math.PI / 2);
    const lensMesh = new THREE.Mesh(lensGeo, this.neonMat);
    lensMesh.position.set(0, -0.09, 0.14);
    this.group.add(lensMesh);

    // Initial position & scale
    this.group.scale.setScalar(1.2);
    scene.add(this.group);
  }

  public setSkin(skinId: DroneSkinId) {
    if (!DRONE_SKINS[skinId]) return;
    this.currentSkin = skinId;
    const skin = DRONE_SKINS[skinId];

    this.bodyMat.color.setHex(skin.bodyColor);
    this.trimMat.color.setHex(skin.trimColor);
    this.neonMat.emissive.setHex(skin.neonColor);
    this.rotorGlowMat.color.setHex(skin.rotorGlowColor);
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    this.group.visible = enabled;
  }

  public triggerStuntCheer() {
    if (!this.isEnabled) return;
    this.isDoingTrick = true;
    this.trickSpinAngle = 0;
    cityAudio.playDroneChirp();
  }

  public update(
    delta: number,
    vehiclePos: { x: number; y: number; z: number },
    vehicleHeading: number,
    vehicleSpeed: number,
    isAirborne: boolean
  ) {
    if (!this.isEnabled) {
      this.group.visible = false;
      return;
    }
    this.group.visible = true;

    // 1. Spin Rotors (faster during high speed or airborne stunts)
    const rotorSpeed = (18 + Math.min(32, Math.abs(vehicleSpeed) * 0.3)) * delta * 25;
    this.rotors.forEach((rotor, idx) => {
      const dir = idx % 2 === 0 ? 1 : -1;
      rotor.rotation.y += rotorSpeed * dir;
    });

    // 2. Idle hover oscillation
    this.hoverWobbleTime += delta * 4;
    const wobbleY = Math.sin(this.hoverWobbleTime) * 0.14;
    const wobbleX = Math.cos(this.hoverWobbleTime * 0.7) * 0.08;

    // 3. Compute target floating position relative to player vehicle
    // Drone stays elevated over the vehicle's right/rear shoulder
    const lateralAngle = vehicleHeading - 0.65;
    const followDist = 2.4 + Math.min(2.5, Math.abs(vehicleSpeed) * 0.02);
    const targetX = vehiclePos.x + Math.sin(lateralAngle) * followDist + wobbleX;
    const targetY = vehiclePos.y + 2.3 + (isAirborne ? 1.2 : 0) + wobbleY;
    const targetZ = vehiclePos.z + Math.cos(lateralAngle) * followDist;

    // 4. Smooth spring glide movement towards target
    const spring = 8.5;
    this.currentVel.x += (targetX - this.currentPos.x) * spring * delta;
    this.currentVel.y += (targetY - this.currentPos.y) * spring * delta;
    this.currentVel.z += (targetZ - this.currentPos.z) * spring * delta;

    // Dampen velocity to prevent oscillations
    const damping = Math.exp(-6.5 * delta);
    this.currentVel.multiplyScalar(damping);

    this.currentPos.addScaledVector(this.currentVel, delta);
    this.group.position.copy(this.currentPos);

    // 5. Dynamic Banking and Tilting
    // Bank when moving laterally, pitch forward when accelerating forward
    const speedRatio = Math.min(1.2, Math.abs(vehicleSpeed) / 140);
    const targetPitch = speedRatio * 0.38;
    const lateralSpeed = (this.currentVel.x * Math.cos(vehicleHeading) - this.currentVel.z * Math.sin(vehicleHeading));
    const targetRoll = THREE.MathUtils.clamp(-lateralSpeed * 0.08, -0.45, 0.45);

    this.currentPitch = THREE.MathUtils.lerp(this.currentPitch, targetPitch, delta * 8);
    this.currentRoll = THREE.MathUtils.lerp(this.currentRoll, targetRoll, delta * 8);
    this.currentYaw = THREE.MathUtils.lerp(this.currentYaw, vehicleHeading, delta * 10);

    // 6. Handle Stunt Acrobatics (360 Barrel Roll on stunt jumps)
    if (isAirborne && !this.isDoingTrick && Math.random() < 0.05) {
      this.triggerStuntCheer();
    }

    if (this.isDoingTrick) {
      this.trickSpinAngle += delta * 14;
      if (this.trickSpinAngle >= Math.PI * 2) {
        this.trickSpinAngle = 0;
        this.isDoingTrick = false;
      }
    }

    // Apply orientation
    this.group.rotation.set(0, 0, 0);
    this.group.rotateY(this.currentYaw);
    this.group.rotateX(this.currentPitch);
    this.group.rotateZ(this.currentRoll + this.trickSpinAngle);

    // 7. Random Cute Drone Chirps
    this.chirpTimer -= delta;
    if (this.chirpTimer <= 0) {
      if (Math.abs(vehicleSpeed) > 10) {
        cityAudio.playDroneChirp();
      }
      this.chirpTimer = 16 + Math.random() * 20;
    }
  }

  public dispose() {
    if (this.group.parent) {
      this.group.parent.remove(this.group);
    }
  }
}
