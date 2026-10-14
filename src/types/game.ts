export type WeatherType = 'sunny' | 'cloudy' | 'sunset' | 'night' | 'rain' | 'fog' | 'nightRain';

export type CameraView = 'chase' | 'rider' | 'firstPerson' | 'cinematic' | 'helmetCam';

export type Difficulty = 'easy' | 'normal' | 'hard' | 'expert';

export type GameMode = 'quickRace' | 'career' | 'championship' | 'timeTrial';

export interface BikeStats {
  topSpeed: number; // in km/h (e.g. 260)
  acceleration: number; // 0-100 scale (e.g. 78)
  handling: number; // 0-100 scale
  braking: number; // 0-100 scale
  grip: number; // 0-100 scale
  weight: number; // in kg
}

export interface BikeUpgradeLevels {
  engine: number; // 0 to 5
  brakes: number;
  tires: number;
  suspension: number;
  transmission: number;
  aerodynamics: number;
}

export interface BikeCustomization {
  bodyColor: string;
  rimColor: string;
  neonColor: string;
  hasNeon: boolean;
  visorTint: string;
}

export interface BikeData {
  id: string;
  name: string;
  brand: string;
  category: 'Street Bike' | 'Sport Bike' | 'Superbike' | 'Hyper Racing';
  price: number;
  unlocked: boolean;
  baseStats: BikeStats;
  description: string;
  soundType: 'inline4' | 'v4' | 'twin' | 'turbo';
  customization: BikeCustomization;
  upgrades: BikeUpgradeLevels;
}

export interface TrackData {
  id: string;
  name: string;
  subtitle: string;
  environment: 'coastal' | 'mountain' | 'city' | 'desert' | 'nightRain';
  lengthKm: number;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Extreme';
  turns: number;
  unlocked: boolean;
  previewImage: string;
  defaultWeather: WeatherType;
  defaultTimeOfDay: 'day' | 'sunset' | 'night';
  trafficEnabled: boolean;
  recordTime?: number;
}

export interface AIRider {
  id: string;
  name: string;
  country: string;
  bikeName: string;
  bikeColor: string;
  suitColor: string;
  skillLevel: number; // 0.8 to 1.2
  currentLap: number;
  distanceCovered: number;
  speed: number;
  rpm: number;
  gear: number;
  trackPosition: number; // offset from center (-4 to 4)
  rank: number;
  lastLapTime: number;
  bestLapTime: number;
  finished: boolean;
}

export interface PlayerProfile {
  name: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  coins: number;
  currentBikeId: string;
  careerProgress: number; // 0 to 100
  careerTier: 'Rookie' | 'Street Racer' | 'Pro Rider' | 'Elite Racer' | 'Champion';
  racesWon: number;
  totalRaces: number;
  unlockedTrackIds: string[];
  unlockedBikeIds: string[];
}

export interface GameSettings {
  graphicsQuality: 'low' | 'medium' | 'high' | 'ultra';
  targetFps: number;
  sfxVolume: number;
  engineVolume: number;
  musicVolume: number;
  motionBlur: boolean;
  cameraShake: boolean;
  cameraView: CameraView;
  steeringSensitivity: number;
  speedUnit: 'kmh' | 'mph';
  autoGear: boolean;
  mobileTouchScheme: 'buttons' | 'slider';
}

export interface RaceConfig {
  mode: GameMode;
  trackId: string;
  laps: number;
  opponentsCount: number;
  difficulty: Difficulty;
  weather: WeatherType;
  hasTraffic: boolean;
  championshipRound?: number;
}

export interface RaceResultData {
  position: number;
  totalRacers: number;
  totalTime: number;
  bestLapTime: number;
  coinsEarned: number;
  xpEarned: number;
  newPersonalBest: boolean;
  unlockedItem?: string;
}

export interface ChampionshipRound {
  trackId: string;
  laps: number;
  weather: WeatherType;
  completed: boolean;
  playerRank?: number;
}
