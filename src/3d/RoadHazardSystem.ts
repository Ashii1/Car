import * as THREE from 'three';

export interface PotholeHazard {
  id: string;
  x: number;
  z: number;
  radius: number;
  severity: 'minor' | 'major';
  lastHitTime: number;
  meshGroup: THREE.Group;
}

export class RoadHazardSystem {
  public potholes: PotholeHazard[] = [];
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public initHazards() {
    this.clear();

    // Procedural pothole locations along village roads, service roads, and outer highway lanes
    const hazardLocations: { x: number; z: number; severity: 'minor' | 'major' }[] = [
      // Outer highway lanes (wear and tear near shoulders)
      { x: 10.8, z: -350, severity: 'major' },
      { x: -10.8, z: -180, severity: 'minor' },
      { x: 10.8, z: 120, severity: 'minor' },
      { x: -10.8, z: 380, severity: 'major' },
      { x: 11.2, z: 620, severity: 'minor' },
      // Service road (higher density of potholes)
      { x: 23.2, z: -480, severity: 'minor' },
      { x: 24.8, z: -310, severity: 'major' },
      { x: 22.8, z: -90, severity: 'minor' },
      { x: 25.2, z: 70, severity: 'major' },
      { x: 23.5, z: 240, severity: 'minor' },
      { x: 24.6, z: 490, severity: 'major' },
      // Village road (earthy road transitions)
      { x: -70, z: -381.5, severity: 'major' },
      { x: -140, z: -378.5, severity: 'minor' },
      { x: -210, z: -382.0, severity: 'major' },
      { x: -290, z: -379.0, severity: 'major' },
      { x: -360, z: -381.0, severity: 'minor' },
      // City Arterial Road
      { x: 95, z: -82.0, severity: 'minor' },
      { x: 180, z: -78.0, severity: 'major' },
      { x: 270, z: -83.5, severity: 'minor' },
      // Industrial Road
      { x: -90, z: 522.0, severity: 'major' },
      { x: -170, z: 518.5, severity: 'minor' },
      { x: -260, z: 523.0, severity: 'major' },
    ];

    const craterMat = new THREE.MeshStandardMaterial({
      color: 0x090b10,
      roughness: 0.98,
      metalness: 0.05,
    });

    const waterPuddleMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.08,
      metalness: 0.85,
    });

    const rimDecalMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.95,
    });

    hazardLocations.forEach((loc, idx) => {
      const radius = loc.severity === 'major' ? 1.15 : 0.85;
      const group = new THREE.Group();
      group.position.set(loc.x, 0.012, loc.z);

      // 1. Broken Outer Asphalt Rim Decal
      const rimGeo = new THREE.RingGeometry(radius * 0.7, radius * 1.35, 16);
      rimGeo.rotateX(-Math.PI / 2);
      const rimMesh = new THREE.Mesh(rimGeo, rimDecalMat);
      rimMesh.receiveShadow = true;
      group.add(rimMesh);

      // 2. Dark Asphalt Depression Crater
      const craterGeo = new THREE.CircleGeometry(radius, 16);
      craterGeo.rotateX(-Math.PI / 2);
      const craterMesh = new THREE.Mesh(craterGeo, craterMat);
      craterMesh.position.y = 0.002;
      group.add(craterMesh);

      // 3. Murky Monsoon Water Reflection Puddle in center
      const puddleGeo = new THREE.CircleGeometry(radius * 0.65, 12);
      puddleGeo.rotateX(-Math.PI / 2);
      const puddleMesh = new THREE.Mesh(puddleGeo, waterPuddleMat);
      puddleMesh.position.y = 0.004;
      group.add(puddleMesh);

      // 4. Loose Gravel Chunks scattered around perimeter
      const gravelMat = new THREE.MeshStandardMaterial({ color: 0x52525b, roughness: 0.9 });
      for (let g = 0; g < 6; g++) {
        const ang = Math.random() * Math.PI * 2;
        const dist = radius * (1.0 + Math.random() * 0.35);
        const chunk = new THREE.Mesh(
          new THREE.BoxGeometry(0.08, 0.03, 0.08),
          gravelMat
        );
        chunk.position.set(Math.cos(ang) * dist, 0.015, Math.sin(ang) * dist);
        chunk.rotation.y = Math.random() * Math.PI;
        group.add(chunk);
      }

      this.scene.add(group);

      this.potholes.push({
        id: `pothole_${idx}`,
        x: loc.x,
        z: loc.z,
        radius,
        severity: loc.severity,
        lastHitTime: 0,
        meshGroup: group,
      });
    });
  }

  // Check motorcycle collision with potholes
  public checkHazardImpact(
    playerX: number,
    playerZ: number,
    speedKmh: number,
    currentTime: number
  ): { hit: boolean; severity?: 'minor' | 'major'; speedLoss: number; shakeIntensity: number } {
    for (const ph of this.potholes) {
      const dx = playerX - ph.x;
      const dz = playerZ - ph.z;
      const distSq = dx * dx + dz * dz;

      if (distSq < ph.radius * ph.radius) {
        // Prevent repeated hits within 1.0 second on same pothole
        if (currentTime - ph.lastHitTime > 1.0) {
          ph.lastHitTime = currentTime;
          const isMajor = ph.severity === 'major';
          const speedLoss = isMajor ? Math.min(speedKmh * 0.25, 24) : Math.min(speedKmh * 0.15, 12);
          const shakeIntensity = isMajor ? 0.45 : 0.25;

          return {
            hit: true,
            severity: ph.severity,
            speedLoss,
            shakeIntensity,
          };
        }
      }
    }

    return { hit: false, speedLoss: 0, shakeIntensity: 0 };
  }

  public clear() {
    this.potholes.forEach((p) => {
      this.scene.remove(p.meshGroup);
      p.meshGroup.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const m = obj as THREE.Mesh;
          m.geometry?.dispose();
        }
      });
    });
    this.potholes = [];
  }
}
