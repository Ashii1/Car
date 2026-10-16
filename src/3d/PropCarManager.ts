import * as THREE from 'three';
import { buildRealisticVehicle, VehicleCategory, BuiltVehicleInstance } from './TrafficCarBuilder';
import { WorldObstacle } from './CityWorldBuilder';
import { TimeOfDay, WeatherType } from '../types/openCity';
import { cityAudio } from '../audio/CityAudioEngine';

export interface PropCarData {
  id: string;
  name: string;
  category: VehicleCategory;
  color: number;
  x: number;
  z: number;
  heading: number;
  styleName: 'bmw_m' | 'benz_amg' | 'sportscar' | 'suv';
}

export interface SpawnedPropCar {
  data: PropCarData;
  vehicle: BuiltVehicleInstance;
  obstacle: WorldObstacle;
  alarmActive: boolean;
  alarmTimer: number;
  shadowPlane: THREE.Mesh;
  interactionMarker?: THREE.Group;
}

export class PropCarManager {
  private scene: THREE.Scene;
  public propCars: SpawnedPropCar[] = [];
  private group: THREE.Group;
  private obstaclesRef?: WorldObstacle[];
  private lastAlarmSoundTime = 0;

  constructor(scene: THREE.Scene, obstacles?: WorldObstacle[]) {
    this.scene = scene;
    this.obstaclesRef = obstacles;
    this.group = new THREE.Group();
    this.group.name = 'propCarsGroup';
    this.scene.add(this.group);
  }

  // Pre-configured realistic parking spots around the open-world city
  private static readonly PROP_CAR_SPOTS: PropCarData[] = [
    // 1. Highway Gas Station / Petrol Pump Forecourt
    {
      id: 'prop_petrol_1',
      name: 'BMW i5 M60 (Sports Sedan)',
      category: 'sportscar',
      color: 0x1e3a8a, // Tanzanite M Blue
      x: 15.5,
      z: 26.0,
      heading: 0,
      styleName: 'bmw_m',
    },
    {
      id: 'prop_petrol_2',
      name: 'Mercedes-AMG GT (Obsidian Black)',
      category: 'sportscar',
      color: 0x090a0f, // Obsidian Black
      x: 21.5,
      z: 32.0,
      heading: 0,
      styleName: 'benz_amg',
    },

    // 2. City Arterial Boulevard Street-Side Parking Bays (East side, facing curb)
    {
      id: 'prop_street_1',
      name: 'Porsche 911 GT3 (Guards Red)',
      category: 'sportscar',
      color: 0xdc2626, // Crimson Red
      x: 26.5,
      z: -96.0,
      heading: Math.PI / 2,
      styleName: 'sportscar',
    },
    {
      id: 'prop_street_2',
      name: 'Audi RS6 Avant (Nardo Grey)',
      category: 'sedan',
      color: 0x64748b, // Nardo Grey
      x: 26.5,
      z: -145.0,
      heading: Math.PI / 2,
      styleName: 'sportscar',
    },
    {
      id: 'prop_street_3',
      name: 'BMW X5 M Competition (Alpine White)',
      category: 'suv',
      color: 0xf8fafc, // Alpine White
      x: 26.5,
      z: -210.0,
      heading: Math.PI / 2,
      styleName: 'suv',
    },
    {
      id: 'prop_street_4',
      name: 'Mercedes-Benz C63 S AMG (Iridium Silver)',
      category: 'sedan',
      color: 0xc0c8d0, // Silver
      x: 26.5,
      z: -285.0,
      heading: Math.PI / 2,
      styleName: 'benz_amg',
    },
    {
      id: 'prop_street_5',
      name: 'M4 Competition (Isle of Man Green)',
      category: 'sportscar',
      color: 0x065f46, // British Racing Green
      x: 26.5,
      z: -340.0,
      heading: Math.PI / 2,
      styleName: 'bmw_m',
    },

    // 3. West Boulevard Street-Side Parking Bays
    {
      id: 'prop_west_1',
      name: 'Ferrari F8 Tributo (Giallo Modena Yellow)',
      category: 'sportscar',
      color: 0xeab308, // Cyber Gold
      x: -26.5,
      z: -125.0,
      heading: -Math.PI / 2,
      styleName: 'sportscar',
    },
    {
      id: 'prop_west_2',
      name: 'Range Rover Sport SVR (Santorini Black)',
      category: 'suv',
      color: 0x111317,
      x: -26.5,
      z: -195.0,
      heading: -Math.PI / 2,
      styleName: 'suv',
    },
    {
      id: 'prop_west_3',
      name: 'BMW M8 Gran Coupe (Frozen Marina Bay Blue)',
      category: 'sportscar',
      color: 0x0284c7, // Marina Blue
      x: -26.5,
      z: -265.0,
      heading: -Math.PI / 2,
      styleName: 'bmw_m',
    },

    // 4. Grand Luxury Hotel & Plaza Valet Forecourt
    {
      id: 'prop_hotel_1',
      name: 'Mercedes-Maybach S680 (Two-Tone Obsidian)',
      category: 'sedan',
      color: 0x1e293b,
      x: 82.0,
      z: -176.0,
      heading: -0.35,
      styleName: 'benz_amg',
    },
    {
      id: 'prop_hotel_2',
      name: 'Lamborghini Urus Performante (Verde Mantis)',
      category: 'suv',
      color: 0x15803d, // Lime Green
      x: 91.0,
      z: -188.0,
      heading: -0.35,
      styleName: 'suv',
    },

    // 5. Coastal Highway Ocean Viewpoints & Rest Areas
    {
      id: 'prop_coastal_1',
      name: 'BMW M2 Coupe (Zandvoort Blue)',
      category: 'sportscar',
      color: 0x38bdf8, // Sky Blue
      x: -42.0,
      z: 88.0,
      heading: 1.82,
      styleName: 'bmw_m',
    },
    {
      id: 'prop_coastal_2',
      name: 'Porsche Macan GTS (Carmine Red)',
      category: 'suv',
      color: 0xb91c1c, // Crimson
      x: -48.0,
      z: 215.0,
      heading: 1.82,
      styleName: 'suv',
    },

    // 6. Street Tuning Shop / Race Garage Pit Lane
    {
      id: 'prop_garage_1',
      name: 'AMG GT Black Series (Solarbeam Yellow)',
      category: 'sportscar',
      color: 0xf59e0b, // Amber Gold
      x: -12.5,
      z: -18.0,
      heading: 0.12,
      styleName: 'benz_amg',
    },
    {
      id: 'prop_garage_2',
      name: 'BMW i5 M60 LWB (Brooklyn Grey)',
      category: 'sportscar',
      color: 0x94a3b8, // Brooklyn Grey
      x: -18.5,
      z: -25.0,
      heading: 0.12,
      styleName: 'bmw_m',
    },
  ];

  public initPropCars() {
    // Contact shadow texture (soft ambient occlusion under parked car body)
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sCtx = shadowCanvas.getContext('2d')!;
    const grad = sCtx.createRadialGradient(64, 64, 18, 64, 64, 62);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
    grad.addColorStop(0.65, 'rgba(0, 0, 0, 0.45)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 128, 128);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
    });

    PropCarManager.PROP_CAR_SPOTS.forEach((spot) => {
      const vehicle = buildRealisticVehicle(spot.category, spot.color);
      vehicle.group.position.set(spot.x, 0, spot.z);
      vehicle.group.rotation.set(0, spot.heading, 0);

      // Contact shadow beneath car body
      const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 5.0), shadowMat);
      shadowPlane.rotateX(-Math.PI / 2);
      shadowPlane.position.set(0, 0.02, 0);
      vehicle.group.add(shadowPlane);

      // Parked brake lights initially off
      vehicle.setBrakeLights(false);

      this.group.add(vehicle.group);

      // Physical bounding box obstacle
      const obstacle: WorldObstacle = {
        minX: spot.x - 1.25,
        maxX: spot.x + 1.25,
        minZ: spot.z - 2.5,
        maxZ: spot.z + 2.5,
        height: 1.5,
      };

      if (this.obstaclesRef) {
        this.obstaclesRef.push(obstacle);
      }

      this.propCars.push({
        data: spot,
        vehicle,
        obstacle,
        alarmActive: false,
        alarmTimer: 0,
        shadowPlane,
      });
    });
  }

  // Find nearest prop car to given coordinates (returns car & distance)
  public getNearestPropCar(x: number, z: number): { car: SpawnedPropCar; distance: number } | null {
    if (this.propCars.length === 0) return null;
    let nearest: SpawnedPropCar | null = null;
    let minDist = Infinity;

    for (const pc of this.propCars) {
      const d = Math.hypot(x - pc.data.x, z - pc.data.z);
      if (d < minDist) {
        minDist = d;
        nearest = pc;
      }
    }

    return nearest ? { car: nearest, distance: minDist } : null;
  }

  // Trigger collision response when player rams a parked prop car
  public handleCollisionWithPlayer(playerX: number, playerZ: number, playerSpeed: number): SpawnedPropCar | null {
    for (const pc of this.propCars) {
      const dist = Math.hypot(playerX - pc.data.x, playerZ - pc.data.z);
      if (dist < 2.4) {
        // High-speed collision triggers alarm
        if (Math.abs(playerSpeed) > 18 && !pc.alarmActive) {
          pc.alarmActive = true;
          pc.alarmTimer = 5.0; // 5 seconds of alarm chirping & hazard flash

          const now = performance.now();
          if (now - this.lastAlarmSoundTime > 3000) {
            this.lastAlarmSoundTime = now;
            cityAudio.playAggressiveHorn();
          }
        }
        return pc;
      }
    }
    return null;
  }

  private lastTimeOfDay?: TimeOfDay;
  private lastWeather?: WeatherType;

  // Update prop car animations (hazard flashers during alarm)
  public update(delta: number, timeOfDay?: TimeOfDay, weather?: WeatherType) {
    const hasLightingChanged = timeOfDay !== this.lastTimeOfDay || weather !== this.lastWeather;
    if (hasLightingChanged) {
      this.lastTimeOfDay = timeOfDay;
      this.lastWeather = weather;
    }

    for (const pc of this.propCars) {
      if (pc.alarmActive) {
        pc.alarmTimer -= delta;
        if (pc.alarmTimer <= 0) {
          pc.alarmActive = false;
          pc.vehicle.setBrakeLights(false);
          pc.vehicle.tailLights.forEach((tl) => (tl.visible = true));
        } else {
          // Rapid hazard light blinking (4 Hz)
          const blink = Math.sin(Date.now() * 0.02) > 0;
          pc.vehicle.setBrakeLights(blink);
          pc.vehicle.headLights.forEach((hl) => (hl.visible = blink));
        }
      }

      // Update ambient day/night lighting only when environment changes
      if (hasLightingChanged && timeOfDay && weather) {
        pc.vehicle.updateLighting?.(timeOfDay, weather);
      }
    }
  }

  public dispose() {
    for (const pc of this.propCars) {
      pc.vehicle.dispose();
    }
    this.propCars = [];
    if (this.group.parent) {
      this.group.parent.remove(this.group);
    }
  }
}
