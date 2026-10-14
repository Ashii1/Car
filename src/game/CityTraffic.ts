import * as THREE from 'three';
import { TrafficVehicle, WantedState, TimeOfDay, WeatherType, DriverPersonality, DriverAggroState } from '../types/openCity';
import { cityAudio } from '../audio/CityAudioEngine';
import { buildRealisticVehicle, VehicleCategory, BuiltVehicleInstance } from '../3d/TrafficCarBuilder';

export interface TrafficCallbacks {
  onInfraction: (type: string, description: string, stars: number) => void;
  onEvadeSuccess: (rewardCash: number) => void;
  onRadioChatter: (text: string) => void;
}

export class CityTrafficManager {
  public vehicles: TrafficVehicle[] = [];
  public wantedState: WantedState = {
    level: 0,
    isPursuitActive: false,
    isEvading: false,
    evadeTimer: 0,
    maxEvadeTimer: 15,
    activeCruisersCount: 0,
    lastInfraction: '',
    roadblocksActive: 0,
  };

  private scene: THREE.Scene;
  private callbacks?: TrafficCallbacks;
  private strobeTimer = 0;
  private radioCooldown = 0;
  private lastRoadblockSpawnTime = 0;
  private roadblockGroup: THREE.Group | null = null;
  private ambientHornTimer = 0;
  private nearHornCooldown = 0;
  public currentWeather: WeatherType = 'clear';
  public isRaining = false;

  constructor(scene: THREE.Scene, callbacks?: TrafficCallbacks) {
    this.scene = scene;
    this.callbacks = callbacks;
  }

  public setCallbacks(callbacks: TrafficCallbacks) {
    this.callbacks = callbacks;
  }

  public setWeather(weather: WeatherType) {
    const wasRaining = this.isRaining;
    this.currentWeather = weather;
    this.isRaining = weather === 'rain';

    if (wasRaining !== this.isRaining) {
      this.applyWeatherConditions();
    }
  }

  // Adjust NPC vehicle speeds and following behavior based on road grip and weather
  private applyWeatherConditions() {
    const rainSpeedMult = this.isRaining ? 0.68 : 1.0; // ~32% reduction in cruising speed during rain
    for (const v of this.vehicles) {
      v.targetSpeed = v.baseSpeed * rainSpeedMult;
      if (this.isRaining && v.speed > v.targetSpeed) {
        // Caution: decelerate smoothly to safe wet speed limit
        v.speed = THREE.MathUtils.lerp(v.speed, v.targetSpeed, 0.4);
      }
    }
  }

  public initTraffic(count = 42) {
    this.clear();

    // Authentic Tamil Nadu traffic mix: TNSTC State buses, auto-rickshaws, delivery tempos, scooters, commuter bikes, and decorated lorries
    const categories: VehicleCategory[] = [
      'bus', // TNSTC Green/White Highway Bus
      'autorickshaw',
      'delivery_tempo', // Tata Ace Chhota Hathi
      'bus', // SETC Red/Gold Deluxe Highway Bus
      'scooter', // Family Scooter
      'commuter_bike',
      'indian_truck',
      'bus', // MTC Chennai City Bus
      'delivery_tempo',
      'scooter',
      'hatchback',
      'commuter_bike',
      'bus',
      'autorickshaw',
      'indian_truck',
      'suv',
      'bus',
      'sedan',
      'scooter',
      'commuter_bike',
      'delivery_tempo',
      'indian_truck',
      'police',
    ];

    // Main Highway lanes
    const forwardLanes = [3.8, 7.6, 11.4];
    const oncomingLanes = [-3.8, -7.6, -11.4];

    for (let i = 0; i < count; i++) {
      const isPolice = i % 15 === 0 && i > 0;
      const category: VehicleCategory = isPolice ? 'police' : categories[i % categories.length];

      // Distribute across Highway, Service Road, and City Avenue
      const roadType = i % 4; // 0, 1 = Highway, 2 = Service Road, 3 = City Road

      let x: number;
      let z: number;
      let heading: number;
      const direction: 1 | -1 = i % 2 === 0 ? 1 : -1;
      let laneOffset: number;
      let roadAxis: 'x' | 'z' = 'z';

      if (roadType <= 1) {
        // Highway: Slower local vehicles (bikes, scooters, autos) take outer lane (11.4m)
        if (category === 'commuter_bike' || category === 'scooter' || category === 'autorickshaw') {
          laneOffset = direction === 1 ? 11.4 : -11.4;
        } else if (category === 'bus' || category === 'indian_truck' || category === 'truck' || category === 'delivery_tempo') {
          laneOffset = direction === 1 ? 7.6 : -7.6;
        } else {
          laneOffset = direction === 1 ? 3.8 : -3.8;
        }
        x = laneOffset;
        // Extended highway span from -800 to +2300 with safe distance from player start
        z = i < 10
          ? (direction === 1 ? 120 + i * 80 : -140 - i * 80)
          : -700 + Math.random() * 2900;
        // Never spawn right on top of player's initial position (z=0)
        if (Math.abs(z) < 85) {
          z = z >= 0 ? z + 95 : z - 95;
        }
        heading = direction === 1 ? 0 : Math.PI;
      } else if (roadType === 2) {
        // Parallel Service Road (x = 24)
        laneOffset = direction === 1 ? 22.0 : 26.0;
        x = laneOffset;
        z = (Math.random() - 0.5) * 1200;
        heading = direction === 1 ? 0 : Math.PI;
      } else {
        // City Arterial Road (z = -80)
        roadAxis = 'x';
        laneOffset = direction === 1 ? -76.0 : -84.0;
        x = 50 + Math.random() * 340;
        z = laneOffset;
        heading = direction === 1 ? Math.PI / 2 : -Math.PI / 2;
      }

      // Authentic Indian Cruising Speeds
      let baseSpeed = 75;
      if (category === 'autorickshaw') baseSpeed = 48 + Math.random() * 10;
      else if (category === 'scooter') baseSpeed = 52 + Math.random() * 12;
      else if (category === 'delivery_tempo') baseSpeed = 55 + Math.random() * 12;
      else if (category === 'indian_truck') baseSpeed = 56 + Math.random() * 12;
      else if (category === 'commuter_bike') baseSpeed = 62 + Math.random() * 16;
      else if (category === 'bus') baseSpeed = 68 + Math.random() * 14;
      else if (category === 'hatchback' || category === 'sedan') baseSpeed = 78 + Math.random() * 20;
      else if (category === 'police') baseSpeed = 95;

      // In rain conditions, roughly ~35% of civilian/open vehicles (especially scooters, commuter bikes, and select cars)
      // seek roadside shelter or stay off roads, reducing traffic density automatically.
      // Police cruisers and public transport buses always stay on duty.
      const isShelteredCandidate =
        !isPolice &&
        category !== 'bus' &&
        (category === 'scooter' || category === 'commuter_bike' ? i % 2 === 0 : i % 3 === 0);

      const initialSpeed = this.isRaining ? baseSpeed * 0.68 : baseSpeed;

      // Assign dynamic AI driver personality profiles:
      // - aggressive_racer: sportscars & tuned sedans that react aggressively to high-speed passes and drag race
      // - enforcer_truck: heavy Indian lorries & tempos that hold lanes and blast air horns
      // - panicked_civilian: commuter scooters, autorickshaws & family cars that panic-swerve and screech tires
      // - cautious_commuter: steady highway traffic
      let driverPersonality: DriverPersonality = 'cautious_commuter';
      if (isPolice) {
        driverPersonality = 'aggressive_racer';
      } else if (category === 'sportscar' || category === 'sedan' || (category === 'hatchback' && i % 2 === 0)) {
        driverPersonality = 'aggressive_racer';
      } else if (category === 'indian_truck' || category === 'delivery_tempo') {
        driverPersonality = 'enforcer_truck';
      } else if (category === 'autorickshaw' || category === 'scooter' || category === 'commuter_bike') {
        driverPersonality = 'panicked_civilian';
      }

      // Build realistic 3D vehicle model with PBR materials, alloy wheels, and interior
      const built = buildRealisticVehicle(category);
      built.group.position.set(x, 0, z);
      this.scene.add(built.group);

      this.vehicles.push({
        id: `traffic_${i}`,
        type: category as any,
        x,
        z,
        y: 0,
        heading,
        speed: initialSpeed,
        baseSpeed,
        targetSpeed: initialSpeed,
        isActive: true,
        shelteredInRain: isShelteredCandidate,
        driverPersonality,
        aggroState: 'idle',
        aggroTimer: 0,
        aggroTargetSpeed: initialSpeed,
        nearMissCooldown: 0,
        hornReactionCooldown: 0,
        lane: laneOffset,
        roadAxis,
        roadCoord: 0,
        direction,
        isPolice,
        strobeL: built.strobeL,
        strobeR: built.strobeR,
        builtVehicle: built,
        meshGroup: built.group,
      });
    }
  }

  public triggerInfraction(type: string, description: string, starsToAdd: number) {
    const oldLevel = this.wantedState.level;
    this.wantedState.level = Math.min(4, Math.max(1, this.wantedState.level + starsToAdd));
    this.wantedState.isPursuitActive = true;
    this.wantedState.isEvading = false;
    this.wantedState.maxEvadeTimer = 12 + this.wantedState.level * 6;
    this.wantedState.evadeTimer = this.wantedState.maxEvadeTimer;
    this.wantedState.lastInfraction = description;

    cityAudio.playPoliceRadioChatter();
    this.callbacks?.onInfraction(type, description, this.wantedState.level);

    if (oldLevel !== this.wantedState.level) {
      const radioMessages = [
        'DISPATCH: "Unit 4, suspect clocked reckless driving. Code 2 inquiry."',
        'DISPATCH: "All units, Code 3 pursuit authorized on sportbike. Proceed with caution."',
        'DISPATCH: "Pursuit escalation: Tactical units authorized, deploy road obstacles!"',
        'DISPATCH: "Code Red! Heavy tactical response authorized. Box suspect in!"',
      ];
      this.callbacks?.onRadioChatter(radioMessages[this.wantedState.level - 1]);
    }
  }

  public clearWanted() {
    this.wantedState.level = 0;
    this.wantedState.isPursuitActive = false;
    this.wantedState.isEvading = false;
    this.wantedState.evadeTimer = 0;
    cityAudio.setPoliceSiren(false);
    this.clearRoadblocks();
  }

  // Tactical Pathfinding & Pursuit Update Loop
  public update(
    delta: number,
    playerX: number,
    playerZ: number,
    playerHeading: number,
    playerSpeed: number,
    playerIsStunt: boolean,
    currentDistrict: string
  ) {
    const bound = 650;
    this.strobeTimer += delta * 12;

    // 1. LAW INFRACTION DETECTOR
    // Speeding check: > 95 km/h in urban downtown/residential
    if (
      playerSpeed > 95 &&
      (currentDistrict === 'downtown' || currentDistrict === 'residential') &&
      this.wantedState.level === 0
    ) {
      this.triggerInfraction(
        'SPEEDING',
        `EXCESSIVE SPEED: ${Math.round(playerSpeed)} KM/H IN RESIDENTIAL ZONE`,
        1
      );
    }

    // Illegal stunt in public traffic check
    if (playerIsStunt && this.wantedState.level < 2) {
      for (const v of this.vehicles) {
        const dist = Math.hypot(playerX - v.x, playerZ - v.z);
        if (dist < 28) {
          this.triggerInfraction(
            'STUNT VIOLATION',
            'RECKLESS DRIVING: ILLEGAL STUNT PERFORMED IN TRAFFIC',
            1
          );
          break;
        }
      }
    }

    // 2. TACTICAL POLICE PURSUIT AI
    const isPursuit = this.wantedState.level > 0;
    let closestPoliceDist = Infinity;
    let activeCruisers = 0;

    // Update siren sound
    if (isPursuit) {
      const sirenMode = this.wantedState.level >= 2 ? 'yelp' : 'wail';
      cityAudio.setPoliceSiren(true, sirenMode);
    } else {
      cityAudio.setPoliceSiren(false);
    }

    // Assign roles to police cruisers
    let policeIndex = 0;
    this.vehicles.forEach((v) => {
      if (v.isPolice) {
        if (policeIndex === 0) v.policeRole = 'lead';
        else if (policeIndex === 1) v.policeRole = 'flankLeft';
        else if (policeIndex === 2) v.policeRole = 'flankRight';
        else v.policeRole = 'interceptor';
        policeIndex++;
      }
    });

    // DYNAMIC RAIN WEATHER TRAFFIC DENSITY:
    // When rain starts, open two-wheelers and fair-weather vehicles seek shelter when beyond player proximity (> 45m).
    // This reduces traffic density naturally and prevents sudden popping.
    // When rain clears, vehicles safely re-enter traffic flow.
    this.vehicles.forEach((v) => {
      const dist = Math.hypot(playerX - v.x, playerZ - v.z);
      if (this.isRaining) {
        if (v.shelteredInRain && v.isActive && dist > 45) {
          v.isActive = false;
          v.meshGroup.visible = false;
        }
      } else {
        if (!v.isActive) {
          v.isActive = true;
          v.meshGroup.visible = true;
        }
      }
    });

    this.vehicles.forEach((v) => {
      // Inactive sheltered vehicles do not participate in traffic flow
      if (v.isActive === false) return;

      // Decrement AI reaction & near-miss cooldown timers
      if (v.aggroTimer && v.aggroTimer > 0) {
        v.aggroTimer -= delta;
        if (v.aggroTimer <= 0) {
          v.aggroState = 'idle';
          v.flashingHighBeams = false;
          if (v.builtVehicle?.headLights) {
            for (const hl of v.builtVehicle.headLights) {
              if (hl.material) (hl.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.8;
            }
          }
          v.targetSpeed = this.isRaining ? v.baseSpeed * 0.68 : v.baseSpeed;
        }
      }
      if (v.nearMissCooldown && v.nearMissCooldown > 0) v.nearMissCooldown -= delta;
      if (v.hornReactionCooldown && v.hornReactionCooldown > 0) v.hornReactionCooldown -= delta;

      // Police Strobe Flasher Animation
      if (v.isPolice && v.strobeL && v.strobeR) {
        if (isPursuit) {
          const flash = Math.sin(this.strobeTimer) > 0;
          (v.strobeL.material as THREE.MeshStandardMaterial).emissiveIntensity = flash ? 3.5 : 0.2;
          (v.strobeR.material as THREE.MeshStandardMaterial).emissiveIntensity = !flash ? 3.5 : 0.2;
        } else {
          (v.strobeL.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.2;
          (v.strobeR.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.2;
        }
      }

      // High-Beam Headlight Flasher for Aggressive Drivers
      if (v.flashingHighBeams && v.builtVehicle?.headLights) {
        v.highBeamTimer = (v.highBeamTimer || 0) + delta * 18;
        const beamFlash = Math.sin(v.highBeamTimer) > 0;
        for (const hl of v.builtVehicle.headLights) {
          if (hl.material) {
            (hl.material as THREE.MeshStandardMaterial).emissiveIntensity = beamFlash ? 3.6 : 0.6;
          }
        }
      }

      if (v.isPolice && isPursuit) {
        const dx = playerX - v.x;
        const dz = playerZ - v.z;
        const dist = Math.hypot(dx, dz);

        if (dist < closestPoliceDist) {
          closestPoliceDist = dist;
        }

        if (dist < 260) {
          activeCruisers++;

          // TACTICAL PATHFINDING PREDICTION
          // Lead vector: predict where the player will be in (leadTime) seconds
          const leadTime = Math.min(2.4, Math.max(0.3, dist / 42));
          const forwardMoveX = Math.sin(playerHeading) * (playerSpeed / 3.6) * leadTime;
          const forwardMoveZ = Math.cos(playerHeading) * (playerSpeed / 3.6) * leadTime;

          let targetX = playerX + forwardMoveX;
          let targetZ = playerZ + forwardMoveZ;

          // Role-specific tactical maneuvers & aggressive boxing:
          if (v.policeRole === 'flankLeft') {
            // Offset 5.5m to the left to pinch player
            targetX -= Math.cos(playerHeading) * 5.8;
            targetZ += Math.sin(playerHeading) * 5.8;
          } else if (v.policeRole === 'flankRight') {
            // Offset 5.5m to the right to pinch player
            targetX += Math.cos(playerHeading) * 5.8;
            targetZ -= Math.sin(playerHeading) * 5.8;
          } else if (v.policeRole === 'lead') {
            // Direct aggressive pursuit + PIT maneuver when alongside/behind player
            targetX = playerX;
            targetZ = playerZ;
            // Aggressive PIT maneuver: steer into player rear quarter if within 14m
            if (dist < 14 && Math.abs(dx) < 3.2 && dist > 1.2) {
              const pitOffset = dx > 0 ? 1.6 : -1.6;
              targetX += pitOffset;
              if (Math.random() < 0.04) {
                cityAudio.playTireScreech(0.75);
              }
            }
          } else if (v.policeRole === 'interceptor') {
            // High-speed interceptor aims directly for lead interception
            targetX = playerX + forwardMoveX * 1.2;
            targetZ = playerZ + forwardMoveZ * 1.2;
          }

          const targetHeading = Math.atan2(targetX - v.x, targetZ - v.z);
          // High-speed pursuit turning agility
          const turnRate = 2.6 + this.wantedState.level * 0.55;
          v.heading = THREE.MathUtils.lerp(v.heading, targetHeading, delta * turnRate);

          // Pursuit speed based on wanted level (up to 215 km/h at 4 stars)
          const maxPursuitSpeed = 110 + this.wantedState.level * 26;
          // Tactical speed surge when executing PIT maneuver or closing distance
          const surgeMult = dist < 22 && dist > 3 ? 1.18 : 1.0;
          v.speed = THREE.MathUtils.lerp(v.speed, maxPursuitSpeed * surgeMult, delta * 4.2);
        }
      }

      if (!v.isPolice || !isPursuit) {
        // =========================================================================
        // AGGRESSIVE AI DRIVERS, NEAR-MISS REACTIONS & HIGHWAY PURSUIT EVACUATION
        // =========================================================================
        const distToPlayer = Math.hypot(playerX - v.x, playerZ - v.z);
        const pDz = (playerZ - v.z) * v.direction;
        const pDx = Math.abs(playerX - v.x);

        // A. NEAR-MISS, HIGH-SPEED MANEUVER & STUNT DETECTION
        // Window: < 12.0m distance passing window at > 75 km/h or stunt within 18m
        const isHighSpeedFlyby = playerSpeed > 75 && distToPlayer < 12.0 && pDx < 3.4 && Math.abs(pDz) < 6.5;
        const isStuntNearTraffic = playerIsStunt && distToPlayer < 18.0;

        if ((isHighSpeedFlyby || isStuntNearTraffic) && (v.nearMissCooldown || 0) <= 0) {
          v.nearMissCooldown = 3.2;
          cityAudio.playNearMissWhoosh();

          if (v.driverPersonality === 'aggressive_racer') {
            // Aggressive tuner gets provoked into an impromptu street drag race / road challenge!
            v.aggroState = 'chasing_player';
            v.aggroTimer = 14.0;
            v.aggroTargetSpeed = Math.min(215, Math.max(v.baseSpeed + 60, playerSpeed + 22));
            v.flashingHighBeams = true;
            v.isOvertaking = true;
            v.targetLane = v.direction === 1 ? 3.8 : -3.8; // Shift to passing lane
            cityAudio.playAggressiveHorn();
            cityAudio.playTireScreech(0.65);

            const racerQuotes = [
              'STREET RACER: "Think you can outrun twin-turbos on this highway? Let\'s go!"',
              'TUNER GT: "Downshifting to 3rd! Keep up or get left behind!"',
              'MODIFIED CIVIC: "You cut me off, biker! Let\'s see that top speed!"',
              'MIDNIGHT RACER: "High-speed highway duel initiated! Floor it!"',
              'ROAD WARRIOR: "Eat my slipstream! Try holding this pace!"',
            ];
            this.callbacks?.onRadioChatter(racerQuotes[Math.floor(Math.random() * racerQuotes.length)]);
          } else if (v.driverPersonality === 'enforcer_truck') {
            // Heavy truck air horn blast & stubborn aggressive lane guard
            v.aggroState = 'blocking_player';
            v.aggroTimer = 6.5;
            cityAudio.playTruckAirHorn();

            // Aggressively nudge into path to guard the right of way
            const lateralShift = playerX > v.x ? 1.4 : -1.4;
            v.targetLane = v.x + lateralShift;

            const truckQuotes = [
              'HEAVY LORRY: "Watch out, two-wheeler! 25 tonnes coming through, give way!"',
              'HIGHWAY TRUCKER: "Keep weaving like that and you\'ll end up on my bumper!"',
              'CONTAINER HAULER: "Air horns for a reason! Stay out of my blind spot!"',
            ];
            this.callbacks?.onRadioChatter(truckQuotes[Math.floor(Math.random() * truckQuotes.length)]);
          } else if (v.driverPersonality === 'panicked_civilian') {
            // Panicked commuter gets frightened by close high-speed flyby!
            v.aggroState = 'panicking';
            v.aggroTimer = 5.0;
            v.speed = Math.max(18, v.speed * 0.55); // Hard panic brake
            v.targetLane = v.direction === 1 ? 11.4 : -11.4; // Swerve to outer shoulder
            cityAudio.playTireScreech(0.75);
            cityAudio.playIndianTrafficHorn();
          }
        }

        // B. POLICE PURSUIT TRAFFIC PANIC & EVACUATION (Sirens in vicinity < 140m)
        if (isPursuit && distToPlayer < 140) {
          if (v.driverPersonality === 'panicked_civilian' && v.aggroState !== 'panicking') {
            // Flee to highway shoulder to yield to police pursuit!
            v.targetLane = v.direction === 1 ? 11.4 : -11.4;
            // Panic brake when pursuit sweeps from behind
            if (pDz < -1.0 && pDz > -45 && playerSpeed > v.speed + 15) {
              v.speed = THREE.MathUtils.lerp(v.speed, v.speed * 0.65, delta * 4.2);
              if (Math.random() < 0.04) {
                cityAudio.playTireScreech(0.6);
              }
            }
          } else if (v.driverPersonality === 'aggressive_racer') {
            // Street racers try to flee from the police dragnet ahead of the pack!
            v.targetSpeed = Math.min(195, v.baseSpeed + 55);
            v.speed = THREE.MathUtils.lerp(v.speed, v.targetSpeed, delta * 3.5);
            v.flashingHighBeams = true;
          } else if (v.driverPersonality === 'enforcer_truck') {
            // Lorries blast horns in confusion during high-speed police chase
            if (Math.random() < 0.008 && (v.hornReactionCooldown || 0) <= 0) {
              v.hornReactionCooldown = 8.0;
              cityAudio.playTruckAirHorn();
            }
          }
        }

        // C. AGGRESSIVE DRIVER CHASE & SPEED CONTROL
        if (v.aggroState === 'chasing_player') {
          // Aggressive racer chases player down highway with slipstream drafting
          const chaseSpeed = v.aggroTargetSpeed || 175;
          v.speed = THREE.MathUtils.lerp(v.speed, chaseSpeed, delta * 3.8);

          // Lateral maneuver: aggressively match player lane or attempt side-by-side overtake
          if (Math.abs(pDz) < 18) {
            // Alongside player: challenge in adjacent lane
            const offset = (playerX > v.x ? -2.8 : 2.8);
            v.targetLane = playerX + offset;
          } else if (pDz > 18) {
            // Behind player: draft directly in slipstream
            v.targetLane = playerX;
          }
        } else if (v.aggroState === 'blocking_player') {
          // Heavy truck stubborn lane guard
          v.speed = THREE.MathUtils.lerp(v.speed, v.baseSpeed * 0.9, delta * 2.2);
        } else if (v.aggroState === 'panicking') {
          // Panicked civilian yields to shoulder and slows down with hazard reaction
          v.speed = THREE.MathUtils.lerp(v.speed, Math.max(18, v.targetSpeed * 0.55), delta * 4.0);
          v.targetLane = v.direction === 1 ? 11.4 : -11.4;
        }

        // 1. Scan ahead in current lane for lead vehicle
        let minDistanceAhead = Infinity;
        let leadVehicle: TrafficVehicle | null = null;

        for (const other of this.vehicles) {
          if (other.id === v.id) continue;
          if (other.roadAxis === v.roadAxis && other.direction === v.direction) {
            if (v.roadAxis === 'z') {
              const dz = (other.z - v.z) * v.direction;
              const dx = Math.abs(other.x - v.x);
              // Lead vehicle in same lane / close lateral path
              if (dz > 0.5 && dz < 42 && dx < 2.4) {
                if (dz < minDistanceAhead) {
                  minDistanceAhead = dz;
                  leadVehicle = other;
                }
              }
            } else {
              const dx = (other.x - v.x) * v.direction;
              const dz = Math.abs(other.z - v.z);
              if (dx > 0.5 && dx < 42 && dz < 2.4) {
                if (dx < minDistanceAhead) {
                  minDistanceAhead = dx;
                  leadVehicle = other;
                }
              }
            }
          }
        }

        // Check distance to player bike in front or behind
        if (v.roadAxis === 'z') {
          const pDz = (playerZ - v.z) * v.direction;
          const pDx = Math.abs(playerX - v.x);
          // Player is ahead of vehicle: vehicle slows to avoid ramming player
          if (pDz > 0.5 && pDz < 35 && pDx < 2.2) {
            if (pDz < minDistanceAhead) {
              minDistanceAhead = pDz;
              leadVehicle = { speed: playerSpeed } as any;
            }
          }
          // Player is approaching vehicle rapidly from behind: lead vehicle maintains pace and yields outward
          if (pDz < -0.5 && pDz > -36 && pDx < 2.4 && playerSpeed > v.speed + 15) {
            if (!v.isOvertaking && Math.abs(v.x) < 9.5) {
              v.targetLane = v.direction === 1 ? 11.4 : -11.4; // shift to slower outer lane
            }
          }
        }

        // 2. Safe Following Distance & Smooth Braking (Tighter margins for aggressive racers)
        const safeFollowDist = v.aggroState === 'chasing_player' ? 9.0 : (this.isRaining ? 36 : 24);
        const closeBrakeDist = v.aggroState === 'chasing_player' ? 4.5 : (this.isRaining ? 12 : 8);

        if (leadVehicle && minDistanceAhead < safeFollowDist) {
          if (minDistanceAhead < closeBrakeDist) {
            // Close proximity: firm braking with brake lights (wet-road safe deceleration)
            const decelSpeed = Math.max(0, leadVehicle.speed - (this.isRaining ? 18 : 14));
            v.speed = THREE.MathUtils.lerp(v.speed, decelSpeed, delta * (this.isRaining ? 4.5 : 5.5));
          } else {
            // Smooth speed matching with safe gap
            const gapBuffer = v.aggroState === 'chasing_player' ? 1.02 : (this.isRaining ? 0.90 : 0.96);
            v.speed = THREE.MathUtils.lerp(v.speed, Math.min(v.targetSpeed, leadVehicle.speed * gapBuffer), delta * (v.aggroState === 'chasing_player' ? 4.2 : 2.8));
          }

          // 3. Indian Highway Overtaking (Aggressive racers & commuters pass slower traffic)
          const overtakeThreshold = v.aggroState === 'chasing_player' ? 2 : 8;
          if (
            !v.isOvertaking &&
            v.targetSpeed > leadVehicle.speed + overtakeThreshold &&
            minDistanceAhead < 25 &&
            v.roadAxis === 'z' &&
            Math.abs(v.x) < 14
          ) {
            // Passing lanes on Indian highways move towards median (smaller |x|)
            const passingStep = v.direction === 1 ? -3.6 : 3.6;
            const targetLaneX = (v.targetLane ?? v.lane) + passingStep;

            const isNorthboundValid = v.direction === 1 && targetLaneX >= 3.0 && targetLaneX <= 12.0;
            const isSouthboundValid = v.direction === -1 && targetLaneX <= -3.0 && targetLaneX >= -12.0;

            if (isNorthboundValid || isSouthboundValid) {
              let isPassingLaneClear = true;
              for (const chk of this.vehicles) {
                if (chk.id === v.id) continue;
                if (chk.roadAxis === 'z' && Math.abs(chk.x - targetLaneX) < 2.2) {
                  if (Math.abs(chk.z - v.z) < 22) {
                    isPassingLaneClear = false;
                    break;
                  }
                }
              }

              if (isPassingLaneClear) {
                v.isOvertaking = true;
                v.targetLane = targetLaneX;
                v.laneChangeTimer = 0;
              }
            }
          }
        } else {
          // Clear road ahead: smoothly accelerate back to natural cruising speed
          v.speed = THREE.MathUtils.lerp(v.speed, v.targetSpeed, delta * 1.8);

          // Return to normal cruising lane after overtaking
          if (v.isOvertaking && v.targetLane !== undefined) {
            v.laneChangeTimer = (v.laneChangeTimer || 0) + delta;
            if (v.laneChangeTimer > 4.0) {
              v.targetLane = v.lane;
              v.isOvertaking = false;
            }
          }
        }

        // 4. Smooth Lateral Lane Changing
        if (v.targetLane !== undefined && v.roadAxis === 'z' && !v.turningAtJunction) {
          v.x = THREE.MathUtils.lerp(v.x, v.targetLane, delta * 2.5);
        }

        // 5. Intersection Turning Logic at Major Arterials (Z = -80 and Z = 520)
        if (!v.turningAtJunction && v.roadAxis === 'z' && Math.abs(v.x - 24) < 4.0) {
          const seed = v.id.charCodeAt(v.id.length - 1);
          if (Math.abs(v.z - -80) < 5.0 && seed % 4 === 0) {
            v.turningAtJunction = true;
            v.turnProgress = 0;
            v.turnStartHeading = v.heading;
            v.turnTargetHeading = Math.PI / 2; // Turn East onto City Avenue
          } else if (Math.abs(v.z - 520) < 5.0 && seed % 3 === 0) {
            v.turningAtJunction = true;
            v.turnProgress = 0;
            v.turnStartHeading = v.heading;
            v.turnTargetHeading = Math.PI / 2; // Turn East onto Bypass Road
          }
        }

        if (v.turningAtJunction) {
          v.turnProgress = (v.turnProgress || 0) + delta * 1.2;
          v.speed = THREE.MathUtils.lerp(v.speed, 32, delta * 3.5);
          v.heading = THREE.MathUtils.lerp(v.turnStartHeading || 0, v.turnTargetHeading || 0, v.turnProgress);
          if (v.turnProgress >= 1.0) {
            v.turningAtJunction = false;
            v.roadAxis = 'x';
            v.direction = 1;
            v.heading = Math.PI / 2;
            v.targetSpeed = 55;
            v.targetLane = v.z;
          }
        }
      }

      // Physics Move forward naturally along heading
      const move = (v.speed / 3.6) * delta;
      v.x += Math.sin(v.heading) * move;
      v.z += Math.cos(v.heading) * move;

      // Seamless Road Continuity & Wrapping (Vehicles always stay on roads!)
      if (v.roadAxis === 'z') {
        if (Math.abs(v.x) < 14) {
          // NH-45 Highway Corridor: spans from northern ghat tunnel (-840) to southern terminus (2360)
          if (v.z > 2360 && v.direction === 1) v.z = -840;
          else if (v.z < -840 && v.direction === -1) v.z = 2360;
        } else {
          // Service Road
          if (v.z > 720 && v.direction === 1) v.z = -720;
          else if (v.z < -720 && v.direction === -1) v.z = 720;
        }
      } else {
        // East-West City Arterials
        if (v.x > 450 && v.direction === 1) {
          v.direction = -1;
          v.heading = -Math.PI / 2;
          v.z -= 8.0; // Shift to westbound lane
        } else if (v.x < 35 && v.direction === -1) {
          v.direction = 1;
          v.heading = Math.PI / 2;
          v.z += 8.0; // Shift to eastbound lane
        }
      }

      // Realistic Tamil Nadu State Bus Stop Behavior & Heavy Vehicle Inertia
      if (v.type === 'bus') {
        const nearBusStop = Math.abs(v.z - -200) < 18 || Math.abs(v.z - 180) < 18;
        if (nearBusStop && (v.busStopTimer === undefined || v.busStopTimer > 0)) {
          if (v.busStopTimer === undefined) {
            v.busStopTimer = 3.5; // Dwell at bus stop for 3.5 seconds
          }
          v.busStopTimer -= delta;
          v.speed = THREE.MathUtils.lerp(v.speed, 0, delta * 3.0);
        } else {
          // Heavy diesel bus accelerates slowly
          v.speed = THREE.MathUtils.lerp(v.speed, v.targetSpeed, delta * 0.45);
          if (v.busStopTimer !== undefined && v.busStopTimer <= 0) {
            v.busStopTimer = -35; // Cooldown before stopping at another shelter
          } else if (v.busStopTimer && v.busStopTimer < 0) {
            v.busStopTimer += delta;
          }
        }
      }

      const distToP = Math.hypot(playerX - v.x, playerZ - v.z);

      // Distance Culling: hide vehicle meshes beyond 280m to eliminate draw calls and GPU work
      const isNearby = distToP < 280;
      if (v.meshGroup.visible !== isNearby) {
        v.meshGroup.visible = isNearby;
      }
      if (!isNearby) return;

      // Update 3D mesh position & rotation
      v.meshGroup.position.set(v.x, v.y, v.z);
      v.meshGroup.rotation.y = v.heading;

      // Update Wheel Rotation & Active Windshield Wipers only if within 140m
      if (v.builtVehicle) {
        if (distToP < 140) {
          v.builtVehicle.updateAnimation(v.speed, delta, this.isRaining);
        }
        // Vehicle brakes if speed is below target speed, turning at junction, or decelerating
        const isBraking =
          v.speed < v.targetSpeed - 3.2 ||
          v.turningAtJunction === true ||
          (v.speed < 12 && v.targetSpeed > 20) ||
          (v.type === 'bus' && (v.busStopTimer || 0) > 0);
        v.isBraking = isBraking;
        v.builtVehicle.setBrakeLights(isBraking);

        // When a heavy State bus brakes near player, trigger pneumatic air brake hiss
        if (v.type === 'bus' && isBraking && !v.wasBraking && distToP < 40) {
          cityAudio.playBusAirBrake();
        }
        v.wasBraking = isBraking;
      }

      // Proximity horn honking reaction
      if (this.nearHornCooldown <= 0) {
        const pDist = Math.hypot(playerX - v.x, playerZ - v.z);
        if (pDist < 9.0 && playerSpeed > 25) {
          if (v.type === 'autorickshaw') {
            cityAudio.playAutoRickshawHorn();
          } else {
            cityAudio.playIndianTrafficHorn();
          }
          this.nearHornCooldown = 3.5;
        }
      }
    });

    if (this.nearHornCooldown > 0) {
      this.nearHornCooldown -= delta;
    }

    // Periodic ambient Indian road horn audio (adds real highway/city atmosphere)
    this.ambientHornTimer += delta;
    if (this.ambientHornTimer > 5.5 + Math.random() * 4.0) {
      this.ambientHornTimer = 0;
      if (Math.abs(playerSpeed) > 10) {
        cityAudio.playIndianTrafficHorn();
      }
    }

    this.wantedState.activeCruisersCount = activeCruisers;

    // 3. EVADE & LINE-OF-SIGHT SYSTEM
    if (isPursuit) {
      const searchRadius = 75;

      if (closestPoliceDist > searchRadius) {
        // Player has broken line of sight!
        this.wantedState.isEvading = true;
        this.wantedState.evadeTimer -= delta;

        if (this.wantedState.evadeTimer <= 0) {
          // Successfully evaded!
          const bonus = 400 * this.wantedState.level;
          this.callbacks?.onEvadeSuccess(bonus);
          this.callbacks?.onRadioChatter('DISPATCH: "Suspect lost in side streets. Resume regular patrol."');
          this.clearWanted();
        }
      } else {
        // Police still tracking
        this.wantedState.isEvading = false;
        this.wantedState.evadeTimer = this.wantedState.maxEvadeTimer;
      }
    }

    // 4. TACTICAL ROADBLOCK SPAWNING (Wanted Level >= 2)
    if (this.wantedState.level >= 2 && Math.abs(playerSpeed) > 40) {
      const now = performance.now();
      const roadblockInterval = this.wantedState.level >= 3 ? 14000 : 20000;
      if (now - this.lastRoadblockSpawnTime > roadblockInterval) {
        this.spawnTacticalRoadblock(playerX, playerZ, playerHeading);
        this.lastRoadblockSpawnTime = now;
      }
    }
  }

  // Spawn police roadblock ahead of player
  private spawnTacticalRoadblock(px: number, pz: number, pHeading: number) {
    this.clearRoadblocks();

    const spawnDist = 130;
    const blockX = px + Math.sin(pHeading) * spawnDist;
    const blockZ = pz + Math.cos(pHeading) * spawnDist;

    this.roadblockGroup = new THREE.Group();
    this.roadblockGroup.position.set(blockX, 0, blockZ);

    // Two angled realistic police cruisers forming a V-barricade
    const car1 = buildRealisticVehicle('police');
    car1.group.position.set(-3.5, 0, 0);
    car1.group.rotation.y = pHeading + 0.45;
    this.roadblockGroup.add(car1.group);

    const car2 = buildRealisticVehicle('police');
    car2.group.position.set(3.5, 0, 0);
    car2.group.rotation.y = pHeading - 0.45;
    this.roadblockGroup.add(car2.group);

    // Hazard orange warning cones and striped barrier
    const barGeo = new THREE.BoxGeometry(4.2, 0.8, 0.15);
    const barMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 });
    const barrier = new THREE.Mesh(barGeo, barMat);
    barrier.position.set(0, 0.4, 0);
    this.roadblockGroup.add(barrier);

    // Flashing red flare light
    const flareLight = new THREE.PointLight(0xef4444, 3.5, 25, 1.2);
    flareLight.position.set(0, 1.2, 0);
    this.roadblockGroup.add(flareLight);

    this.scene.add(this.roadblockGroup);
    this.wantedState.roadblocksActive = 1;

    cityAudio.playPoliceRadioChatter();
    this.callbacks?.onRadioChatter('DISPATCH: "Roadblock established 150m ahead! Hold the perimeter!"');
  }

  private clearRoadblocks() {
    if (this.roadblockGroup) {
      this.scene.remove(this.roadblockGroup);
      this.roadblockGroup = null;
      this.wantedState.roadblocksActive = 0;
    }
  }

  public updateLighting(timeOfDay: TimeOfDay, weather: WeatherType) {
    this.setWeather(weather);
    for (const v of this.vehicles) {
      if (v.builtVehicle?.updateLighting) {
        v.builtVehicle.updateLighting(timeOfDay, weather);
      }
    }
  }

  public checkPlayerCollision(playerX: number, playerZ: number): { collided: boolean; hitVehicle?: TrafficVehicle } {
    for (const v of this.vehicles) {
      // Inactive sheltered vehicles do not have physical collisions
      if (v.isActive === false) continue;

      // Oriented vehicle bounding box collision test
      // Transforms player position into vehicle local coordinate space
      const dx = playerX - v.x;
      const dz = playerZ - v.z;
      const cosH = Math.cos(v.heading);
      const sinH = Math.sin(v.heading);
      const localX = Math.abs(dx * cosH - dz * sinH);
      const localZ = Math.abs(dx * sinH + dz * cosH);

      // Realistic vehicle half-dimensions
      let halfW = 0.95;
      let halfL = 2.15;
      if (v.type === 'commuter_bike' || (v.type as any) === 'scooter') {
        halfW = 0.45;
        halfL = 1.05;
      } else if (v.type === 'autorickshaw') {
        halfW = 0.72;
        halfL = 1.35;
      } else if ((v.type as any) === 'delivery_tempo') {
        halfW = 0.85;
        halfL = 1.95;
      } else if (v.type === 'bus' || v.type === 'truck' || v.type === 'indian_truck') {
        halfW = 1.32;
        halfL = 5.75;
      }

      // Motorcycle player clearance (~0.22m lateral for lane splitting, ~0.25m front/back)
      if (localX < halfW + 0.22 && localZ < halfL + 0.25) {
        if (v.isPolice) {
          this.triggerInfraction('RAMMING OFFICER', 'CRIME: ASSAULT ON LAW ENFORCEMENT VEHICLE', 2);
        } else {
          this.triggerInfraction('HIT AND RUN', 'CRIME: VEHICULAR COLLISION & PROPERTY DAMAGE', 1);
        }
        return { collided: true, hitVehicle: v };
      }
    }
    return { collided: false };
  }

  public clear() {
    this.clearRoadblocks();
    this.vehicles.forEach((v) => {
      this.scene.remove(v.meshGroup);
      v.builtVehicle?.dispose();
    });
    this.vehicles = [];
  }
}
