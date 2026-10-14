import * as THREE from 'three';
import { WeatherType } from '../types/openCity';
import { cityAudio } from '../audio/CityAudioEngine';

interface PuddleLocation {
  x: number;
  z: number;
  radiusX: number;
  radiusZ: number;
  rot: number;
  rotation?: number;
  mesh?: THREE.Mesh;
}

// Procedural animated water ripple texture
function createRippleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 128, 128);
  for (let r = 15; r < 60; r += 16) {
    ctx.beginPath();
    ctx.arc(64, 64, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export class DynamicWeatherEffects {
  private scene: THREE.Scene;
  private weatherGroup: THREE.Group;

  // Rain particle system
  private rainCount = 1600;
  private rainGeo: THREE.BufferGeometry;
  private rainMat: THREE.PointsMaterial;
  private rainParticles: THREE.Points;
  private rainPositions: Float32Array;
  private rainVelocities: Float32Array;

  // Ground splash particle system (raindrops hitting road)
  private splashCount = 160;
  private splashGeo: THREE.BufferGeometry;
  private splashMat: THREE.PointsMaterial;
  private splashParticles: THREE.Points;
  private splashPositions: Float32Array;
  private splashAlphas: Float32Array;
  private splashIndex = 0;

  // Motorcycle wet surface spray & rooster tail
  private tireSprayCount = 100;
  private tireSprayGeo: THREE.BufferGeometry;
  private tireSprayMat: THREE.PointsMaterial;
  private tireSprayParticles: THREE.Points;
  private tireSprayPositions: Float32Array;
  private tireSprayVelocities: Float32Array;
  private tireSprayLifetimes: Float32Array;

  // Bike windshield / fairing droplet impacts
  private bikeHitCount = 40;
  private bikeHitGeo: THREE.BufferGeometry;
  private bikeHitMat: THREE.PointsMaterial;
  private bikeHitParticles: THREE.Points;
  private bikeHitPositions: Float32Array;
  private bikeHitLifetimes: Float32Array;

  // Dynamic Asphalt Puddles
  public puddleWetness = 0; // 0 (dry asphalt) to 1.0 (flooded monsoon puddles)
  private puddles: PuddleLocation[] = [];
  private puddleGroup: THREE.Group;
  private puddleMaterial: THREE.MeshStandardMaterial;
  private rippleTex: THREE.CanvasTexture;
  private rippleOffset = 0;

  // Puddle drive-through cooldowns
  private lastPuddleSplashTime = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.weatherGroup = new THREE.Group();
    this.scene.add(this.weatherGroup);

    // 1. Heavy Realistic Rain Particle System
    this.rainPositions = new Float32Array(this.rainCount * 3);
    this.rainVelocities = new Float32Array(this.rainCount * 3);

    for (let i = 0; i < this.rainCount; i++) {
      this.rainPositions[i * 3] = (Math.random() - 0.5) * 110;
      this.rainPositions[i * 3 + 1] = Math.random() * 45;
      this.rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 110;

      // Terminal downward velocity (-48 to -62 m/s) with subtle wind slant
      this.rainVelocities[i * 3] = (Math.random() - 0.5) * 3.5;
      this.rainVelocities[i * 3 + 1] = -52 - Math.random() * 12;
      this.rainVelocities[i * 3 + 2] = -4.5 + (Math.random() - 0.5) * 2;
    }

    this.rainGeo = new THREE.BufferGeometry();
    this.rainGeo.setAttribute('position', new THREE.BufferAttribute(this.rainPositions, 3));
    this.rainMat = new THREE.PointsMaterial({
      color: 0xbae6fd,
      size: 0.32,
      transparent: true,
      opacity: 0,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });
    this.rainParticles = new THREE.Points(this.rainGeo, this.rainMat);
    this.weatherGroup.add(this.rainParticles);

    // 2. Ground Rain Splash System (Droplets hitting road asphalt)
    this.splashPositions = new Float32Array(this.splashCount * 3);
    this.splashAlphas = new Float32Array(this.splashCount);

    for (let i = 0; i < this.splashCount; i++) {
      this.splashPositions[i * 3] = 0;
      this.splashPositions[i * 3 + 1] = -100;
      this.splashPositions[i * 3 + 2] = 0;
      this.splashAlphas[i] = 0;
    }

    this.splashGeo = new THREE.BufferGeometry();
    this.splashGeo.setAttribute('position', new THREE.BufferAttribute(this.splashPositions, 3));
    this.splashMat = new THREE.PointsMaterial({
      color: 0xe0f2fe,
      size: 0.45,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.splashParticles = new THREE.Points(this.splashGeo, this.splashMat);
    this.weatherGroup.add(this.splashParticles);

    // 3. High-Speed Rear Tire Wet Rooster-Tail Spray System
    this.tireSprayPositions = new Float32Array(this.tireSprayCount * 3);
    this.tireSprayVelocities = new Float32Array(this.tireSprayCount * 3);
    this.tireSprayLifetimes = new Float32Array(this.tireSprayCount);

    for (let i = 0; i < this.tireSprayCount; i++) {
      this.tireSprayPositions[i * 3] = 0;
      this.tireSprayPositions[i * 3 + 1] = -100;
      this.tireSprayPositions[i * 3 + 2] = 0;
      this.tireSprayLifetimes[i] = 0;
    }

    this.tireSprayGeo = new THREE.BufferGeometry();
    this.tireSprayGeo.setAttribute('position', new THREE.BufferAttribute(this.tireSprayPositions, 3));
    this.tireSprayMat = new THREE.PointsMaterial({
      color: 0xe2e8f0,
      size: 0.52,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });
    this.tireSprayParticles = new THREE.Points(this.tireSprayGeo, this.tireSprayMat);
    this.weatherGroup.add(this.tireSprayParticles);

    // 4. Bike Fairing / Windscreen Droplet Impacts
    this.bikeHitPositions = new Float32Array(this.bikeHitCount * 3);
    this.bikeHitLifetimes = new Float32Array(this.bikeHitCount);
    for (let i = 0; i < this.bikeHitCount; i++) {
      this.bikeHitPositions[i * 3] = 0;
      this.bikeHitPositions[i * 3 + 1] = -100;
      this.bikeHitPositions[i * 3 + 2] = 0;
      this.bikeHitLifetimes[i] = 0;
    }
    this.bikeHitGeo = new THREE.BufferGeometry();
    this.bikeHitGeo.setAttribute('position', new THREE.BufferAttribute(this.bikeHitPositions, 3));
    this.bikeHitMat = new THREE.PointsMaterial({
      color: 0xf0fdf4,
      size: 0.18,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    });
    this.bikeHitParticles = new THREE.Points(this.bikeHitGeo, this.bikeHitMat);
    this.weatherGroup.add(this.bikeHitParticles);

    // 5. Dynamic Asphalt Puddles System
    this.rippleTex = createRippleTexture();
    this.puddleGroup = new THREE.Group();
    this.weatherGroup.add(this.puddleGroup);

    this.puddleMaterial = new THREE.MeshStandardMaterial({
      color: 0x090d16, // Wet soaked asphalt black with water depth
      roughness: 0.04, // Mirror-like wet puddle surface
      metalness: 0.92,
      map: this.rippleTex,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });

    this.initAsphaltPuddles();
  }

  // Pre-seed authentic puddle locations along Highway, Service Road, and City Arterials
  private initAsphaltPuddles() {
    const puddleSpots = [
      // NH-48 Highway Northbound & Southbound (x = ±3.8, ±7.6, ±11.2)
      { x: 7.6, z: -420, rx: 2.8, rz: 5.5, rot: 0.1 },
      { x: -7.6, z: -290, rx: 3.2, rz: 6.2, rot: -0.15 },
      { x: 3.8, z: -140, rx: 2.4, rz: 4.8, rot: 0.05 },
      { x: -3.8, z: 60, rx: 3.0, rz: 5.0, rot: -0.08 },
      { x: 7.6, z: 230, rx: 3.5, rz: 7.0, rot: 0.12 },
      { x: -7.6, z: 380, rx: 2.9, rz: 5.8, rot: -0.2 },
      { x: 3.8, z: 540, rx: 3.1, rz: 6.0, rot: 0.05 },
      { x: -3.8, z: 690, rx: 2.6, rz: 4.5, rot: -0.1 },

      // Highway Service Road (x = 22, 28)
      { x: 23.5, z: -350, rx: 2.2, rz: 3.8, rot: 0.18 },
      { x: 27.0, z: -180, rx: 2.6, rz: 4.2, rot: -0.1 },
      { x: 24.0, z: 40, rx: 2.5, rz: 4.0, rot: 0.05 },
      { x: 26.5, z: 280, rx: 2.8, rz: 4.5, rot: -0.12 },
      { x: 23.0, z: 460, rx: 2.4, rz: 3.6, rot: 0.2 },

      // City Avenue (z = -80, x from 50 to 380)
      { x: 65, z: -76, rx: 3.5, rz: 2.4, rot: 0.4 },
      { x: 140, z: -84, rx: 4.2, rz: 2.8, rot: -0.2 },
      { x: 220, z: -78, rx: 3.8, rz: 2.6, rot: 0.15 },
      { x: 330, z: -82, rx: 4.0, rz: 3.0, rot: -0.35 },

      // Market Street (x = 320, z = -200 to 80)
      { x: 318, z: -190, rx: 2.4, rz: 3.8, rot: 0.08 },
      { x: 322, z: -60, rx: 2.8, rz: 4.2, rot: -0.15 },
      { x: 317, z: 40, rx: 2.6, rz: 3.6, rot: 0.2 },

      // Industrial Bypass (z = 520, x from 50 to 350)
      { x: 90, z: 524, rx: 4.0, rz: 2.8, rot: 0.3 },
      { x: 210, z: 516, rx: 3.6, rz: 2.5, rot: -0.25 },
      { x: 310, z: 522, rx: 3.8, rz: 2.9, rot: 0.1 },
    ];

    puddleSpots.forEach((spot) => {
      // Realistic organic puddle geometry (oval with perturbed edge radius)
      const geo = new THREE.CircleGeometry(1.0, 24);
      geo.rotateX(-Math.PI / 2);

      const mesh = new THREE.Mesh(geo, this.puddleMaterial);
      mesh.position.set(spot.x, 0.035, spot.z); // Slightly above asphalt plane to prevent z-fighting
      mesh.scale.set(spot.rx, 1, spot.rz);
      mesh.rotation.y = spot.rot;
      mesh.renderOrder = 2; // Renders on top of road markings
      this.puddleGroup.add(mesh);

      this.puddles.push({
        ...spot,
        radiusX: spot.rx,
        radiusZ: spot.rz,
        mesh,
      });
    });
  }

  public update(
    delta: number,
    weather: WeatherType,
    cameraPos: THREE.Vector3,
    bikePos: THREE.Vector3,
    bikeHeading: number,
    bikeSpeed: number,
    groundY = 0
  ) {
    const isRain = weather === 'rain';

    // 1. Dynamic Puddle Formation & Evaporation
    if (isRain) {
      // Puddles form steadily during rain
      this.puddleWetness = Math.min(1.0, this.puddleWetness + delta * 0.16);
    } else {
      // Puddles slowly evaporate when dry
      this.puddleWetness = Math.max(0.0, this.puddleWetness - delta * 0.06);
    }

    // Update puddle visibility & ripples
    if (this.puddleWetness > 0.01) {
      this.puddleGroup.visible = true;
      this.puddleMaterial.opacity = this.puddleWetness * 0.88;

      // Animate gentle water ripples
      this.rippleOffset += delta * 0.25;
      this.rippleTex.offset.set(this.rippleOffset, this.rippleOffset * 0.5);

      // Scale puddles slightly with wetness
      const scaleMultiplier = 0.5 + this.puddleWetness * 0.5;
      this.puddles.forEach((p) => {
        if (p.mesh) {
          p.mesh.scale.set(p.radiusX * scaleMultiplier, 1, p.radiusZ * scaleMultiplier);
        }
      });
    } else {
      this.puddleGroup.visible = false;
      this.puddleMaterial.opacity = 0;
    }

    // 2. Realistic Rain Particle Physics & Ground Impacts
    if (isRain) {
      this.rainMat.opacity = THREE.MathUtils.lerp(this.rainMat.opacity, 0.78, delta * 2.5);
      this.splashMat.opacity = THREE.MathUtils.lerp(this.splashMat.opacity, 0.65, delta * 2.5);

      const rPos = this.rainPositions;
      const rVel = this.rainVelocities;
      const sPos = this.splashPositions;
      const sAlpha = this.splashAlphas;

      // Center rain box on camera position
      this.rainParticles.position.set(cameraPos.x, 0, cameraPos.z);
      this.splashParticles.position.set(cameraPos.x, 0, cameraPos.z);

      const halfBox = 55;

      for (let i = 0; i < this.rainCount; i++) {
        const idx = i * 3;
        rPos[idx] += rVel[idx] * delta;
        rPos[idx + 1] += rVel[idx + 1] * delta;
        rPos[idx + 2] += rVel[idx + 2] * delta;

        // When raindrop hits the ground
        if (rPos[idx + 1] <= groundY) {
          // Trigger ground splash at hit point (relative to camera)
          const spIdx = (this.splashIndex % this.splashCount) * 3;
          sPos[spIdx] = rPos[idx];
          sPos[spIdx + 1] = groundY + 0.04;
          sPos[spIdx + 2] = rPos[idx + 2];
          sAlpha[this.splashIndex % this.splashCount] = 1.0;
          this.splashIndex++;

          // Recycle raindrop at sky ceiling
          rPos[idx + 1] = 40 + Math.random() * 8;
          rPos[idx] = (Math.random() - 0.5) * (halfBox * 2);
          rPos[idx + 2] = (Math.random() - 0.5) * (halfBox * 2);
        }

        // Horizontal boundary wrap
        if (rPos[idx] < -halfBox) rPos[idx] += halfBox * 2;
        if (rPos[idx] > halfBox) rPos[idx] -= halfBox * 2;
        if (rPos[idx + 2] < -halfBox) rPos[idx + 2] += halfBox * 2;
        if (rPos[idx + 2] > halfBox) rPos[idx + 2] -= halfBox * 2;
      }

      this.rainGeo.attributes.position.needsUpdate = true;
      this.splashGeo.attributes.position.needsUpdate = true;
    } else {
      this.rainMat.opacity = THREE.MathUtils.lerp(this.rainMat.opacity, 0, delta * 3.5);
      this.splashMat.opacity = THREE.MathUtils.lerp(this.splashMat.opacity, 0, delta * 3.5);
    }

    // 3. Bike Windshield & Fairing Droplet Impacts (Misty droplets hitting front of bike)
    if (isRain && Math.abs(bikeSpeed) > 15) {
      this.bikeHitMat.opacity = 0.85;
      const bPos = this.bikeHitPositions;
      const bLife = this.bikeHitLifetimes;

      // Emit new droplets near windshield and nose cowl
      const spawnCount = Math.min(3, Math.floor(Math.abs(bikeSpeed) / 45) + 1);
      for (let s = 0; s < spawnCount; s++) {
        const slot = Math.floor(Math.random() * this.bikeHitCount);
        const noseDist = 0.55 + Math.random() * 0.25;
        const noseSide = (Math.random() - 0.5) * 0.45;
        const noseHeight = 0.75 + Math.random() * 0.35;

        bPos[slot * 3] = bikePos.x + Math.sin(bikeHeading) * noseDist - Math.cos(bikeHeading) * noseSide;
        bPos[slot * 3 + 1] = bikePos.y + noseHeight;
        bPos[slot * 3 + 2] = bikePos.z + Math.cos(bikeHeading) * noseDist + Math.sin(bikeHeading) * noseSide;
        bLife[slot] = 0.25 + Math.random() * 0.2;
      }

      for (let i = 0; i < this.bikeHitCount; i++) {
        if (bLife[i] > 0) {
          bLife[i] -= delta;
          bPos[i * 3 + 1] -= delta * 0.5; // Flow down windscreen
        } else {
          bPos[i * 3 + 1] = -100;
        }
      }
      this.bikeHitGeo.attributes.position.needsUpdate = true;
    } else {
      this.bikeHitMat.opacity = 0;
    }

    // 4. Rear Tire High-Speed Rooster-Tail Water Spray (Active in rain or wet puddles)
    const wetRoadActive = isRain || this.puddleWetness > 0.15;
    if (wetRoadActive && Math.abs(bikeSpeed) > 20) {
      const sprayIntensity = Math.min(1.0, (Math.abs(bikeSpeed) - 20) / 120);
      this.tireSprayMat.opacity = sprayIntensity * 0.72;

      const tPos = this.tireSprayPositions;
      const tVel = this.tireSprayVelocities;
      const tLife = this.tireSprayLifetimes;

      // Rear tire contact patch position
      const rearX = bikePos.x - Math.sin(bikeHeading) * 0.75;
      const rearY = bikePos.y + 0.12;
      const rearZ = bikePos.z - Math.cos(bikeHeading) * 0.75;

      const particlesToEmit = Math.floor(sprayIntensity * 6) + 1;
      for (let e = 0; e < particlesToEmit; e++) {
        const slot = Math.floor(Math.random() * this.tireSprayCount);
        tPos[slot * 3] = rearX + (Math.random() - 0.5) * 0.16;
        tPos[slot * 3 + 1] = rearY;
        tPos[slot * 3 + 2] = rearZ + (Math.random() - 0.5) * 0.16;

        // Spray shoots backwards and upwards with velocity proportional to bike speed
        const speedFactor = (bikeSpeed / 3.6) * 0.45;
        tVel[slot * 3] = -Math.sin(bikeHeading) * speedFactor + (Math.random() - 0.5) * 1.8;
        tVel[slot * 3 + 1] = 1.4 + Math.random() * 2.2 * sprayIntensity;
        tVel[slot * 3 + 2] = -Math.cos(bikeHeading) * speedFactor + (Math.random() - 0.5) * 1.8;
        tLife[slot] = 0.45 + Math.random() * 0.35;
      }

      for (let i = 0; i < this.tireSprayCount; i++) {
        if (tLife[i] > 0) {
          tLife[i] -= delta;
          tPos[i * 3] += tVel[i * 3] * delta;
          tPos[i * 3 + 1] += tVel[i * 3 + 1] * delta;
          tPos[i * 3 + 2] += tVel[i * 3 + 2] * delta;
          tVel[i * 3 + 1] -= 9.8 * delta; // Gravity pull on spray droplets
        } else {
          tPos[i * 3 + 1] = -100;
        }
      }
      this.tireSprayGeo.attributes.position.needsUpdate = true;
    } else {
      this.tireSprayMat.opacity = 0;
    }

    // 5. Puddle Collision & Driving Splash Reaction
    if (this.puddleWetness > 0.1 && Math.abs(bikeSpeed) > 18) {
      const now = performance.now();
      for (const puddle of this.puddles) {
        const dx = bikePos.x - puddle.x;
        const dz = bikePos.z - puddle.z;
        const dist = Math.hypot(dx, dz);
        const effectiveRadius = Math.max(puddle.radiusX, puddle.radiusZ) * 0.9;

        if (dist < effectiveRadius) {
          if (now - this.lastPuddleSplashTime > 450) {
            this.lastPuddleSplashTime = now;
            // Play authentic wet water splash sound
            const vol = Math.min(0.85, Math.abs(bikeSpeed) / 100);
            cityAudio.playWaterSplash(vol);

            // Emit burst of water splash droplets from tires into tireSpray system
            const tPos = this.tireSprayPositions;
            const tVel = this.tireSprayVelocities;
            const tLife = this.tireSprayLifetimes;

            for (let b = 0; b < 24; b++) {
              const slot = (this.splashIndex + b) % this.tireSprayCount;
              tPos[slot * 3] = bikePos.x + (Math.random() - 0.5) * 0.8;
              tPos[slot * 3 + 1] = bikePos.y + 0.15;
              tPos[slot * 3 + 2] = bikePos.z + (Math.random() - 0.5) * 0.8;

              const angle = Math.random() * Math.PI * 2;
              const spd = 2.5 + Math.random() * 4.5;
              tVel[slot * 3] = Math.cos(angle) * spd;
              tVel[slot * 3 + 1] = 2.0 + Math.random() * 2.8;
              tVel[slot * 3 + 2] = Math.sin(angle) * spd;
              tLife[slot] = 0.55;
            }
          }
          break;
        }
      }
    }
  }

  public dispose() {
    this.scene.remove(this.weatherGroup);
    this.rainGeo.dispose();
    this.rainMat.dispose();
    this.splashGeo.dispose();
    this.splashMat.dispose();
    this.tireSprayGeo.dispose();
    this.tireSprayMat.dispose();
    this.bikeHitGeo.dispose();
    this.bikeHitMat.dispose();
    this.rippleTex.dispose();
    this.puddleMaterial.dispose();
    this.puddles.forEach((p) => p.mesh?.geometry.dispose());
  }
}
