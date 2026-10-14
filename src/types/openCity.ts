export type DistrictType =
  | 'downtown'
  | 'residential'
  | 'industrial'
  | 'highway'
  | 'beach'
  | 'mountain';

export type WeatherType = 'clear' | 'sunset' | 'night' | 'rain' | 'fog';

export type TimeOfDay = 'morning' | 'afternoon' | 'sunset' | 'night';

export type CameraView = 'chase' | 'close' | 'firstPerson' | 'drone' | 'helmetCam';

export type BikeCategory = 'Beginner' | 'Sport' | 'Superbike' | 'Cruiser' | 'Off-road' | 'Electric' | 'Classic' | 'German Supercar';

export type AccelerationCurveType =
  | 'Low-End Punch'
  | 'Linear Progressive'
  | 'High-Rev Screamer'
  | 'Instant Electric'
  | 'V-Twin Pulse'
  | 'Explosive Snap'
  | 'M xDrive Twin-Turbo Punch'
  | 'AMG Biturbo Surge';

export interface BikeHandlingCharacteristics {
  accelerationCurve: AccelerationCurveType;
  curveExponent: number; // e.g. 0.75 (low-end punch), 1.0 (linear), 1.35 (high-rev screamer)
  turningRadius: number; // In meters, e.g. 2.4m - 4.2m (lower = sharper turning)
  maxLeanAngle: number; // In degrees, e.g. 42° - 65° (higher = steeper knee-down cornering)
  chassisAgility: number; // 0 - 100 rating
  highSpeedStability: number; // 0 - 100 rating
  brakingBias: string; // e.g. "65% Front / 35% Rear"
  weightDistribution: string; // e.g. "52:48 Front/Rear"
  throttleResponsiveness: number; // 0 - 100
}

export interface OpenCityBikeStats {
  topSpeed: number; // km/h
  acceleration: number; // 0-100
  handling: number; // 0-100
  braking: number; // 0-100
  grip: number; // 0-100
  offRoad: number; // 0-100
  durability: number; // 0-100
  weight: number; // kg
  handlingCharacteristics?: BikeHandlingCharacteristics;
}

export interface BikeCustomization {
  bodyColor: string;
  rimColor: string;
  neonColor: string;
  hasNeon: boolean;
  visorTint?: string;
  exhaustType: 'stock' | 'gp_titanium' | 'carbon_twin';
}

export interface BikeDamageState {
  fairingScratches: number; // 0 (pristine) to 1.0 (heavy scrapes)
  fairingCracks: number;    // 0 (intact) to 1.0 (spiderweb shattered fairings)
  leftMirrorMissing: boolean;
  rightMirrorMissing: boolean;
  headlightCracked: boolean;
  overallDamage: number;    // 0 to 100%
}

export const DEFAULT_BIKE_DAMAGE: BikeDamageState = {
  fairingScratches: 0,
  fairingCracks: 0,
  leftMirrorMissing: false,
  rightMirrorMissing: false,
  headlightCracked: false,
  overallDamage: 0,
};

export interface BikeUpgradeLevels {
  engine: number; // 0-5
  brakes: number;
  suspension: number;
  tires: number;
  transmission: number;
  nitro: number;
}

export interface OpenCityBike {
  id: string;
  name: string;
  brand: string;
  category: BikeCategory;
  price: number;
  unlocked: boolean;
  description: string;
  soundType: 'twin' | 'inline4' | 'v4' | 'turbo' | 'cruiser';
  baseStats: OpenCityBikeStats;
  handlingCharacteristics: BikeHandlingCharacteristics;
  customization: BikeCustomization;
  upgrades: BikeUpgradeLevels;
  damage?: BikeDamageState;
}

export type MissionType =
  | 'delivery'
  | 'race'
  | 'timeTrial'
  | 'courier'
  | 'stunt'
  | 'mountain'
  | 'escape';

export interface CheckpointTarget {
  x: number;
  z: number;
  radius: number;
  label?: string;
}

export interface CityMission {
  id: string;
  title: string;
  type: MissionType;
  district: DistrictType;
  description: string;
  rewardCash: number;
  rewardXp: number;
  timeLimit?: number; // seconds
  targetScore?: number;
  checkpoints: CheckpointTarget[];
  completed: boolean;
  unlocked: boolean;
  requiredLevel: number;
}

export interface PlayerOpenCityProfile {
  name: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  cash: number;
  currentBikeId: string;
  ownedBikeIds: string[];
  completedMissionIds: string[];
  discoveredDistricts: DistrictType[];
  totalDistanceRiddenKm: number;
  highestSpeedKmh: number;
  stuntsCompleted: number;
}

export type DriverPersonality = 'aggressive_racer' | 'panicked_civilian' | 'enforcer_truck' | 'cautious_commuter';
export type DriverAggroState = 'idle' | 'chasing_player' | 'panicking' | 'blocking_player' | 'brake_checking' | 'overtaking_aggressively';

export interface TrafficVehicle {
  id: string;
  type:
    | 'sedan'
    | 'suv'
    | 'sportscar'
    | 'hatchback'
    | 'van'
    | 'bus'
    | 'truck'
    | 'police'
    | 'autorickshaw'
    | 'indian_truck'
    | 'commuter_bike'
    | 'police_suv'
    | 'roadblock_car';
  x: number;
  z: number;
  y: number;
  heading: number;
  speed: number;
  baseSpeed: number;
  targetSpeed: number;
  isActive?: boolean;
  shelteredInRain?: boolean;
  driverPersonality?: DriverPersonality;
  aggroState?: DriverAggroState;
  aggroTimer?: number;
  aggroTargetSpeed?: number;
  hornReactionCooldown?: number;
  nearMissCooldown?: number;
  lane: number;
  roadAxis: 'x' | 'z';
  roadCoord: number;
  direction: 1 | -1;
  isPolice: boolean;
  policeRole?: 'lead' | 'flankLeft' | 'flankRight' | 'interceptor' | 'roadblock';
  targetLane?: number;
  laneChangeTimer?: number;
  isOvertaking?: boolean;
  turningAtJunction?: boolean;
  turnProgress?: number;
  turnStartHeading?: number;
  turnTargetHeading?: number;
  strobeL?: any;
  strobeR?: any;
  isBraking?: boolean;
  wasBraking?: boolean;
  flashingHighBeams?: boolean;
  highBeamTimer?: number;
  busStopTimer?: number;
  builtVehicle?: any;
  meshGroup: any;
}

export interface WantedState {
  level: number; // 0 to 4 stars
  isPursuitActive: boolean;
  isEvading: boolean;
  evadeTimer: number;
  maxEvadeTimer: number;
  activeCruisersCount: number;
  lastInfraction: string;
  roadblocksActive: number;
}

export type PedestrianAIState = 'walking' | 'stopping_at_intersection' | 'reacting_to_player' | 'turning';

export interface PedestrianNPC {
  id: string;
  x: number;
  z: number;
  y: number;
  heading: number;
  targetHeading?: number;
  speed: number;
  baseSpeed: number;
  sidewalkAxis: 'x' | 'z';
  direction: 1 | -1;
  clothColor: string;
  meshGroup: any;
  aiState: PedestrianAIState;
  stateTimer: number;
  lookAngle: number;
  panicReaction: number; // 0 to 1
  pathId: string;
}

export interface GameSettings {
  graphicsQuality: 'low' | 'medium' | 'high' | 'ultra';
  fpsTarget: 30 | 60;
  steeringSensitivity: number;
  speedUnit: 'kmh' | 'mph';
  sfxVolume: number;
  musicVolume: number;
  engineVolume: number;
  motionBlur: boolean;
  cameraShake: boolean;
  controlsLayout: 'buttons' | 'joystick';
}
