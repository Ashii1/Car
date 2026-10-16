import * as THREE from 'three';
import { PedestrianNPC, PedestrianAIState } from '../types/openCity';

interface PedestrianVisual {
  group: THREE.Group;
  headGroup: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  torso: THREE.Mesh;
  walkCycle: number;
}

const INTERSECTION_NODES = [
  { x: 32.5, z: -80, name: 'Service Road & City Avenue Junction' },
  { x: 320, z: -80, name: 'City Avenue & Market Street Crossing' },
  { x: 32.5, z: 520, name: 'Service Road & Industrial Bypass Crossing' },
];

export class PedestrianManager {
  public pedestrians: PedestrianNPC[] = [];
  private visuals: Map<string, PedestrianVisual> = new Map();
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public initPedestrians(count = 28) {
    this.clear();

    const indianColors = [
      0xd97706, // Saffron / Marigold
      0x0284c7, // Sky Blue
      0x16a34a, // Emerald Green
      0xdc2626, // Crimson Red
      0x8b5cf6, // Purple
      0xf8fafc, // Pure White Kurta
      0x1e293b, // Dark Navy
    ];

    // Sidewalk networks across the city:
    // Path 0: Highway Service Road (x = 32.5)
    // Path 1: City Avenue North Sidewalk (z = -68)
    // Path 2: City Avenue South Sidewalk (z = -92)
    // Path 3: Market Street (x = 312 or 328)
    // Path 4: Industrial Bypass (z = 532)
    for (let i = 0; i < count; i++) {
      const pathType = i % 5;
      const color = indianColors[i % indianColors.length];
      const direction: 1 | -1 = i % 2 === 0 ? 1 : -1;

      let x: number;
      let z: number;
      let heading: number;
      let sidewalkAxis: 'x' | 'z';
      let pathId = `path_${pathType}`;

      if (pathType === 0) {
        // Highway Service Road Sidewalk (x = 32.5)
        x = 32.5 + (Math.random() - 0.5) * 1.2;
        z = -480 + (i * 38);
        heading = direction === 1 ? 0 : Math.PI;
        sidewalkAxis = 'z';
      } else if (pathType === 1) {
        // City Avenue North Sidewalk (z = -68)
        x = 55 + Math.random() * 320;
        z = -68;
        heading = direction === 1 ? Math.PI / 2 : -Math.PI / 2;
        sidewalkAxis = 'x';
      } else if (pathType === 2) {
        // City Avenue South Sidewalk (z = -92)
        x = 60 + Math.random() * 310;
        z = -92;
        heading = direction === 1 ? Math.PI / 2 : -Math.PI / 2;
        sidewalkAxis = 'x';
      } else if (pathType === 3) {
        // Market Street Sidewalk (x = 312 or 328)
        x = direction === 1 ? 312 : 328;
        z = -260 + Math.random() * 330;
        heading = direction === 1 ? 0 : Math.PI;
        sidewalkAxis = 'z';
      } else {
        // Industrial Bypass Sidewalk (z = 532)
        x = 60 + Math.random() * 320;
        z = 532;
        heading = direction === 1 ? Math.PI / 2 : -Math.PI / 2;
        sidewalkAxis = 'x';
      }

      const visual = this.createRealisticHuman(color, i);
      visual.group.position.set(x, 0, z);
      visual.group.rotation.y = heading;
      this.scene.add(visual.group);

      const id = `ped_${i}`;
      this.visuals.set(id, visual);

      const baseSpeed = 3.2 + Math.random() * 1.5; // Walking speed (3.2 - 4.7 km/h)
      this.pedestrians.push({
        id,
        x,
        z,
        y: 0,
        heading,
        speed: baseSpeed,
        baseSpeed,
        sidewalkAxis,
        direction,
        clothColor: color.toString(),
        meshGroup: visual.group,
        aiState: 'walking',
        stateTimer: 0,
        lookAngle: 0,
        panicReaction: 0,
        pathId,
      });
    }
  }

  private createRealisticHuman(clothingColor: number, seed: number): PedestrianVisual {
    const root = new THREE.Group();

    // Anatomical Materials with subtle realistic tone variations
    const skinTones = [0xc4895c, 0xb87a4c, 0xa66a3e, 0x8f532a, 0xba8155];
    const skinMat = new THREE.MeshStandardMaterial({
      color: skinTones[seed % skinTones.length],
      roughness: 0.58,
      metalness: 0.02,
    });

    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x141416,
      roughness: 0.85,
    });

    const clothMat = new THREE.MeshStandardMaterial({
      color: clothingColor,
      roughness: 0.72,
      metalness: 0.04,
    });

    const pantsMat = new THREE.MeshStandardMaterial({
      color: seed % 2 === 0 ? 0x1e293b : 0xf1f5f9, // Dark denim chinos or traditional white veshti
      roughness: 0.78,
    });

    const shoesMat = new THREE.MeshStandardMaterial({
      color: seed % 3 === 0 ? 0x18181b : 0x451a03, // Leather shoes or sandals
      roughness: 0.65,
    });

    // 1. Pelvis / Hips (y = 0.88m)
    const pelvis = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 14), pantsMat);
    pelvis.scale.set(1.15, 0.85, 1.05);
    pelvis.position.y = 0.88;
    pelvis.castShadow = true;
    root.add(pelvis);

    // 2. Sculpted Anatomical Torso with chest & waist taper
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.165, 0.135, 0.52, 16), clothMat);
    torso.position.y = 1.22;
    torso.scale.set(1.15, 1.0, 0.9);
    torso.castShadow = true;
    root.add(torso);

    // Collar detail
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.02, 8, 16), clothMat);
    collar.rotateX(Math.PI / 2);
    collar.position.y = 1.48;
    root.add(collar);

    // 3. Realistic Head, Face & Hair
    const headGroup = new THREE.Group();
    headGroup.position.y = 1.62;
    root.add(headGroup);

    // Cranium with anatomical jaw
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.10, 18, 16), skinMat);
    head.scale.set(0.9, 1.08, 1.0);
    head.castShadow = true;
    headGroup.add(head);

    // Sculpted Nose
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.042, 6), skinMat);
    nose.rotation.x = -Math.PI / 2;
    nose.position.set(0, 0, 0.095);
    headGroup.add(nose);

    // Sculpted Eyes
    [-0.032, 0.032].forEach((ex) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.009, 8, 8), new THREE.MeshBasicMaterial({ color: 0x1c1917 }));
      eye.position.set(ex, 0.018, 0.082);
      headGroup.add(eye);
    });

    // Hair or Traditional Turban / Cap
    if (seed % 4 === 0) {
      // Saffron Turban / Pagri
      const turban = new THREE.Mesh(
        new THREE.TorusGeometry(0.11, 0.048, 10, 18),
        new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.8 })
      );
      turban.rotateX(Math.PI / 2.3);
      turban.position.y = 0.05;
      headGroup.add(turban);
    } else {
      // Natural hair fade
      const hair = new THREE.Mesh(new THREE.SphereGeometry(0.104, 16, 14), hairMat);
      hair.position.set(0, 0.032, -0.01);
      hair.scale.set(0.95, 0.98, 1.04);
      headGroup.add(hair);
    }

    // 4. Articulated Legs with Kicked Ankles & Foot Soles
    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.095, 0.84, 0);
    root.add(leftLeg);

    const lThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.048, 0.44, 12), pantsMat);
    lThigh.position.y = -0.22;
    lThigh.castShadow = true;
    leftLeg.add(lThigh);

    const lShin = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.038, 0.42, 12), pantsMat);
    lShin.position.y = -0.58;
    leftLeg.add(lShin);

    const lFoot = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.048, 0.17), shoesMat);
    lFoot.position.set(0, -0.78, 0.035);
    leftLeg.add(lFoot);

    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.095, 0.84, 0);
    root.add(rightLeg);

    const rThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.048, 0.44, 12), pantsMat);
    rThigh.position.y = -0.22;
    rThigh.castShadow = true;
    rightLeg.add(rThigh);

    const rShin = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.038, 0.42, 12), pantsMat);
    rShin.position.y = -0.58;
    rightLeg.add(rShin);

    const rFoot = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.048, 0.17), shoesMat);
    rFoot.position.set(0, -0.78, 0.035);
    rightLeg.add(rFoot);

    // 5. Articulated Arms with Hands & Thumbs
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.21, 1.42, 0);
    root.add(leftArm);

    const lBicep = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.038, 0.28, 12), clothMat);
    lBicep.position.y = -0.14;
    leftArm.add(lBicep);

    const lForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.032, 0.26, 12), skinMat);
    lForearm.position.y = -0.38;
    leftArm.add(lForearm);

    const lHand = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.054, 0.048), skinMat);
    lHand.position.set(0, -0.52, 0.01);
    leftArm.add(lHand);

    const rightArm = new THREE.Group();
    rightArm.position.set(0.21, 1.42, 0);
    root.add(rightArm);

    const rBicep = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.038, 0.28, 12), clothMat);
    rBicep.position.y = -0.14;
    rightArm.add(rBicep);

    const rForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.032, 0.26, 12), skinMat);
    rForearm.position.y = -0.38;
    rightArm.add(rForearm);

    const rHand = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.054, 0.048), skinMat);
    rHand.position.set(0, -0.52, 0.01);
    rightArm.add(rHand);

    return {
      group: root,
      headGroup,
      leftLeg,
      rightLeg,
      leftArm,
      rightArm,
      torso,
      walkCycle: Math.random() * Math.PI * 2,
    };
  }

  // Update AI Behavior State Machine & Kinematics
  public update(
    delta: number,
    playerX: number,
    playerZ: number,
    playerSpeed = 0,
    isHonking = false
  ) {
    this.pedestrians.forEach((p) => {
      const vis = this.visuals.get(p.id);
      if (!vis) return;

      const distToPlayer = Math.hypot(playerX - p.x, playerZ - p.z);

      // Distance Culling: hide pedestrian meshes beyond 80m to eliminate draw calls and bone math
      const isNearby = distToPlayer < 80;
      if (vis.group.visible !== isNearby) {
        vis.group.visible = isNearby;
      }
      if (!isNearby) {
        // Keep simple linear coordinate progress along sidewalk
        const move = p.speed * delta;
        p.x += Math.sin(p.heading) * move;
        p.z += Math.cos(p.heading) * move;
        vis.group.position.set(p.x, 0, p.z);
        return;
      }

      // ==========================================================
      // 1. AI BEHAVIOR STATE TRANSITIONS
      // ==========================================================
      // Reaction to player's presence (high speed approach, very close, or honking horn)
      const triggerProximity = 5.5;
      const triggerPanicSpeed = 8.5;
      const shouldReactToPlayer =
        distToPlayer < triggerProximity ||
        (distToPlayer < triggerPanicSpeed && (playerSpeed > 40 || isHonking));

      if (shouldReactToPlayer && p.aiState !== 'reacting_to_player') {
        p.aiState = 'reacting_to_player';
        p.speed = 0;
        p.panicReaction = 1.0;
        p.stateTimer = 2.4;
      }

      // State machine logic
      switch (p.aiState) {
        case 'reacting_to_player': {
          p.speed = 0;
          p.stateTimer -= delta;

          // Turn head to track oncoming player motorcycle
          const angleToPlayer = Math.atan2(playerX - p.x, playerZ - p.z);
          vis.headGroup.rotation.y = THREE.MathUtils.lerp(
            vis.headGroup.rotation.y,
            Math.sin(angleToPlayer - p.heading) * 0.75,
            delta * 8
          );

          // Startled / Defensive reaction animation:
          // Arms raise up in shock, hands out, torso leans back defensively
          vis.leftArm.rotation.x = THREE.MathUtils.lerp(vis.leftArm.rotation.x, -1.85, delta * 8);
          vis.leftArm.rotation.z = THREE.MathUtils.lerp(vis.leftArm.rotation.z, 0.42, delta * 8);
          vis.rightArm.rotation.x = THREE.MathUtils.lerp(vis.rightArm.rotation.x, -1.85, delta * 8);
          vis.rightArm.rotation.z = THREE.MathUtils.lerp(vis.rightArm.rotation.z, -0.42, delta * 8);

          vis.torso.rotation.x = THREE.MathUtils.lerp(vis.torso.rotation.x, -0.26, delta * 8);

          // Slight defensive step-back away from the bike
          if (distToPlayer < 3.5) {
            const stepBack = delta * 0.45;
            p.x -= Math.sin(angleToPlayer) * stepBack;
            p.z -= Math.cos(angleToPlayer) * stepBack;
          }

          // Return to walking when player passes safely and timer finishes
          if (p.stateTimer <= 0 && distToPlayer > 6.0) {
            p.aiState = 'walking';
            p.speed = p.baseSpeed;
            p.panicReaction = 0;
          }
          break;
        }

        case 'stopping_at_intersection': {
          p.speed = 0;
          p.stateTimer -= delta;

          // Realistic Pedestrian Crossing AI: Looks left, looks right for oncoming traffic
          p.lookAngle = Math.sin((3.0 - p.stateTimer) * 3.5) * 0.65;
          vis.headGroup.rotation.y = THREE.MathUtils.lerp(vis.headGroup.rotation.y, p.lookAngle, delta * 6);

          // Arms resting naturally
          vis.leftArm.rotation.x = THREE.MathUtils.lerp(vis.leftArm.rotation.x, 0, delta * 6);
          vis.leftArm.rotation.z = THREE.MathUtils.lerp(vis.leftArm.rotation.z, 0, delta * 6);
          vis.rightArm.rotation.x = THREE.MathUtils.lerp(vis.rightArm.rotation.x, 0, delta * 6);
          vis.rightArm.rotation.z = THREE.MathUtils.lerp(vis.rightArm.rotation.z, 0, delta * 6);
          vis.torso.rotation.x = THREE.MathUtils.lerp(vis.torso.rotation.x, 0, delta * 6);

          // Finished looking both ways: pick random new path direction
          if (p.stateTimer <= 0) {
            const decision = Math.random();
            if (decision < 0.45) {
              // Turn 90 degrees onto cross sidewalk
              if (p.sidewalkAxis === 'z') {
                p.sidewalkAxis = 'x';
                p.direction = (Math.random() < 0.5 ? 1 : -1) as 1 | -1;
                p.heading = p.direction === 1 ? Math.PI / 2 : -Math.PI / 2;
              } else {
                p.sidewalkAxis = 'z';
                p.direction = (Math.random() < 0.5 ? 1 : -1) as 1 | -1;
                p.heading = p.direction === 1 ? 0 : Math.PI;
              }
            } else if (decision < 0.8) {
              // Continue straight across intersection
              // Keep current sidewalkAxis and direction
            } else {
              // Turn around
              p.direction = (p.direction * -1) as 1 | -1;
              p.heading += Math.PI;
            }

            p.aiState = 'walking';
            p.speed = p.baseSpeed;
            vis.group.rotation.y = p.heading;
            vis.headGroup.rotation.y = 0;
          }
          break;
        }

        case 'walking':
        default: {
          p.speed = p.baseSpeed;

          // Check if pedestrian is approaching an intersection
          for (const node of INTERSECTION_NODES) {
            const distToNode = Math.hypot(p.x - node.x, p.z - node.z);
            if (distToNode < 3.2 && p.stateTimer <= 0) {
              // Stop at intersection and look both ways before crossing
              p.aiState = 'stopping_at_intersection';
              p.stateTimer = 2.0 + Math.random() * 1.5;
              break;
            }
          }

          // Decrement cooldown timer so pedestrian doesn't repeatedly stop at same node
          if (p.stateTimer > 0) {
            p.stateTimer -= delta;
          }

          // Move along current sidewalk
          const moveDist = (p.speed / 3.6) * delta;
          if (p.sidewalkAxis === 'z') {
            p.z += p.direction * moveDist;
            if (p.z > 620 || p.z < -620) {
              p.direction = (p.direction * -1) as 1 | -1;
              p.heading = p.direction === 1 ? 0 : Math.PI;
              vis.group.rotation.y = p.heading;
            }
          } else {
            p.x += p.direction * moveDist;
            if (p.x > 430 || p.x < 35) {
              p.direction = (p.direction * -1) as 1 | -1;
              p.heading = p.direction === 1 ? Math.PI / 2 : -Math.PI / 2;
              vis.group.rotation.y = p.heading;
            }
          }

          // Head looks forward along heading
          vis.headGroup.rotation.y = THREE.MathUtils.lerp(vis.headGroup.rotation.y, 0, delta * 4);
          vis.leftArm.rotation.z = THREE.MathUtils.lerp(vis.leftArm.rotation.z, 0, delta * 4);
          vis.rightArm.rotation.z = THREE.MathUtils.lerp(vis.rightArm.rotation.z, 0, delta * 4);
          vis.torso.rotation.x = THREE.MathUtils.lerp(vis.torso.rotation.x, 0, delta * 4);

          // Realistic Walking Kinematics Gait
          vis.walkCycle += delta * (p.speed * 1.4);
          const legSwing = Math.sin(vis.walkCycle) * 0.48;
          const armSwing = Math.sin(vis.walkCycle) * 0.42;

          vis.leftLeg.rotation.x = legSwing;
          vis.rightLeg.rotation.x = -legSwing;

          vis.leftArm.rotation.x = -armSwing;
          vis.rightArm.rotation.x = armSwing;

          // Subtle hip bounce while walking
          vis.group.position.y = Math.abs(Math.sin(vis.walkCycle * 2)) * 0.024;
          break;
        }
      }

      vis.group.position.set(p.x, vis.group.position.y, p.z);
    });
  }

  public clear() {
    this.visuals.forEach((vis) => {
      this.scene.remove(vis.group);
      vis.group.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const m = obj as THREE.Mesh;
          m.geometry?.dispose();
        }
      });
    });
    this.visuals.clear();
    this.pedestrians = [];
  }
}

