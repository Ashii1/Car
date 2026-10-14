import * as THREE from 'three';
import { CityMission, CheckpointTarget } from '../types/openCity';

export class MissionManager {
  public activeMission: CityMission | null = null;
  public currentCheckpointIndex: number = 0;
  public timeRemaining: number = 0;
  public currentScore: number = 0;
  private scene: THREE.Scene;
  private checkpointMesh: THREE.Mesh | null = null;
  private beaconLight: THREE.PointLight | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public startMission(mission: CityMission) {
    this.cancelMission();
    this.activeMission = { ...mission };
    this.currentCheckpointIndex = 0;
    this.timeRemaining = mission.timeLimit || 0;
    this.currentScore = 0;

    this.spawnCheckpointVisual(this.activeMission.checkpoints[0]);
  }

  public cancelMission() {
    this.removeCheckpointVisual();
    this.activeMission = null;
    this.currentCheckpointIndex = 0;
    this.timeRemaining = 0;
    this.currentScore = 0;
  }

  private spawnCheckpointVisual(cp: CheckpointTarget) {
    this.removeCheckpointVisual();

    // 3D Translucent Glowing Checkpoint Cylinder
    const geo = new THREE.CylinderGeometry(cp.radius, cp.radius, 12, 24, 1, true);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
    });
    this.checkpointMesh = new THREE.Mesh(geo, mat);
    this.checkpointMesh.position.set(cp.x, 6, cp.z);
    this.scene.add(this.checkpointMesh);

    this.beaconLight = new THREE.PointLight(0xf59e0b, 3.0, 35, 1.2);
    this.beaconLight.position.set(cp.x, 4, cp.z);
    this.scene.add(this.beaconLight);
  }

  private removeCheckpointVisual() {
    if (this.checkpointMesh) {
      this.scene.remove(this.checkpointMesh);
      this.checkpointMesh.geometry.dispose();
      (this.checkpointMesh.material as THREE.Material).dispose();
      this.checkpointMesh = null;
    }
    if (this.beaconLight) {
      this.scene.remove(this.beaconLight);
      this.beaconLight = null;
    }
  }

  public update(
    delta: number,
    playerX: number,
    playerZ: number,
    playerStuntScore: number,
    onComplete: (mission: CityMission, cash: number, xp: number) => void,
    onFail: (reason: string) => void
  ) {
    if (!this.activeMission) return;

    // Pulse checkpoint mesh
    if (this.checkpointMesh) {
      this.checkpointMesh.rotation.y += delta * 1.5;
    }

    // Time limit handling
    if (this.activeMission.timeLimit) {
      this.timeRemaining -= delta;
      if (this.timeRemaining <= 0) {
        const title = this.activeMission.title;
        this.cancelMission();
        onFail(`Time expired on "${title}"!`);
        return;
      }
    }

    // Stunt mission handling
    if (this.activeMission.type === 'stunt' && this.activeMission.targetScore) {
      if (playerStuntScore >= this.activeMission.targetScore) {
        const completed = { ...this.activeMission };
        const cash = completed.rewardCash;
        const xp = completed.rewardXp;
        this.cancelMission();
        onComplete(completed, cash, xp);
        return;
      }
    }

    // Checkpoint proximity check
    const currentCp = this.activeMission.checkpoints[this.currentCheckpointIndex];
    if (currentCp) {
      const dist = Math.hypot(playerX - currentCp.x, playerZ - currentCp.z);
      if (dist <= currentCp.radius) {
        this.currentCheckpointIndex++;

        if (this.currentCheckpointIndex >= this.activeMission.checkpoints.length) {
          // Mission completed!
          const completed = { ...this.activeMission };
          const cash = completed.rewardCash;
          const xp = completed.rewardXp;
          this.cancelMission();
          onComplete(completed, cash, xp);
        } else {
          // Advance to next checkpoint
          this.spawnCheckpointVisual(this.activeMission.checkpoints[this.currentCheckpointIndex]);
        }
      }
    }
  }

  public getActiveCheckpoint(): CheckpointTarget | null {
    if (!this.activeMission) return null;
    return this.activeMission.checkpoints[this.currentCheckpointIndex] || null;
  }
}
