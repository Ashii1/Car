import { BikeData, TrackData, PlayerProfile, GameSettings, BikeStats } from '../types/game';

export const INITIAL_BIKES: BikeData[] = [
  {
    id: 'apex_400',
    name: 'Apex Street 400',
    brand: 'APEX',
    category: 'Street Bike',
    price: 0,
    unlocked: true,
    description: 'Agile lightweight street fighter with responsive low-end torque. Perfect for mastering apexes.',
    soundType: 'twin',
    baseStats: {
      topSpeed: 195,
      acceleration: 65,
      handling: 85,
      braking: 70,
      grip: 75,
      weight: 168,
    },
    customization: {
      bodyColor: '#e11d48', // Crimson Red
      rimColor: '#1e293b',
      neonColor: '#ef4444',
      hasNeon: false,
      visorTint: '#0f172a',
    },
    upgrades: {
      engine: 0,
      brakes: 0,
      tires: 0,
      suspension: 0,
      transmission: 0,
      aerodynamics: 0,
    },
  },
  {
    id: 'phantom_700',
    name: 'Phantom R-7',
    brand: 'KAIZEN',
    category: 'Sport Bike',
    price: 15000,
    unlocked: false,
    description: 'Precision-tuned middleweight supersport with razor-sharp chassis geometry and punchy crossplane engine.',
    soundType: 'twin',
    baseStats: {
      topSpeed: 235,
      acceleration: 75,
      handling: 88,
      braking: 78,
      grip: 82,
      weight: 182,
    },
    customization: {
      bodyColor: '#2563eb', // Deep Racing Blue
      rimColor: '#0f172a',
      neonColor: '#3b82f6',
      hasNeon: false,
      visorTint: '#1e293b',
    },
    upgrades: {
      engine: 0,
      brakes: 0,
      tires: 0,
      suspension: 0,
      transmission: 0,
      aerodynamics: 0,
    },
  },
  {
    id: 'k600_screamer',
    name: 'Ninja ZX-600',
    brand: 'KROMA',
    category: 'Sport Bike',
    price: 28000,
    unlocked: false,
    description: 'Screaming 16,000 RPM inline-four supersport built purely for high-speed track domination and hard lean angles.',
    soundType: 'inline4',
    baseStats: {
      topSpeed: 268,
      acceleration: 84,
      handling: 85,
      braking: 82,
      grip: 84,
      weight: 190,
    },
    customization: {
      bodyColor: '#10b981', // Lime Acid Green
      rimColor: '#09090b',
      neonColor: '#10b981',
      hasNeon: false,
      visorTint: '#09090b',
    },
    upgrades: {
      engine: 0,
      brakes: 0,
      tires: 0,
      suspension: 0,
      transmission: 0,
      aerodynamics: 0,
    },
  },
  {
    id: 'pantera_v4',
    name: 'Pantera Corse V4',
    brand: 'VELOCE',
    category: 'Superbike',
    price: 48000,
    unlocked: false,
    description: 'Italian thoroughbred packing a 1,103cc Desmo V4 engine, carbon biplane aerodynamic winglets, and Brembo Stylema calipers.',
    soundType: 'v4',
    baseStats: {
      topSpeed: 305,
      acceleration: 92,
      handling: 90,
      braking: 92,
      grip: 90,
      weight: 175,
    },
    customization: {
      bodyColor: '#dc2626', // Italian Racing Red
      rimColor: '#eab308', // Gold forged wheels
      neonColor: '#f97316',
      hasNeon: true,
      visorTint: '#030712',
    },
    upgrades: {
      engine: 0,
      brakes: 0,
      tires: 0,
      suspension: 0,
      transmission: 0,
      aerodynamics: 0,
    },
  },
  {
    id: 'thunder_rr',
    name: 'Thunder RR Carbon',
    brand: 'BAYERN',
    category: 'Superbike',
    price: 65000,
    unlocked: false,
    description: 'Asymmetric carbon-clad superbike featuring dynamic electronic damping, launch control, and blistering straightline speed.',
    soundType: 'inline4',
    baseStats: {
      topSpeed: 318,
      acceleration: 95,
      handling: 93,
      braking: 95,
      grip: 92,
      weight: 170,
    },
    customization: {
      bodyColor: '#f8fafc', // Alpine Pure White / M Stripes
      rimColor: '#0284c7',
      neonColor: '#00f2fe',
      hasNeon: true,
      visorTint: '#0284c7',
    },
    upgrades: {
      engine: 0,
      brakes: 0,
      tires: 0,
      suspension: 0,
      transmission: 0,
      aerodynamics: 0,
    },
  },
  {
    id: 'vortex_hyper_x',
    name: 'Vortex Hyper-X Supercharged',
    brand: 'BLACKLINE',
    category: 'Hyper Racing',
    price: 95000,
    unlocked: false,
    description: 'Supercharged 310 HP drag and circuit anomaly. Extreme aerospace carbon wings with phenomenal 340+ km/h terminal velocity.',
    soundType: 'turbo',
    baseStats: {
      topSpeed: 345,
      acceleration: 99,
      handling: 89,
      braking: 97,
      grip: 96,
      weight: 185,
    },
    customization: {
      bodyColor: '#18181b', // Obsidian Matte Black
      rimColor: '#10b981', // Emerald Accents
      neonColor: '#06b6d4',
      hasNeon: true,
      visorTint: '#09090b',
    },
    upgrades: {
      engine: 0,
      brakes: 0,
      tires: 0,
      suspension: 0,
      transmission: 0,
      aerodynamics: 0,
    },
  },
];

export const INITIAL_TRACKS: TrackData[] = [
  {
    id: 'coastal_highway',
    name: 'Coastal Highway',
    subtitle: 'Pacific Cliffside Sprint',
    environment: 'coastal',
    lengthKm: 4.8,
    difficulty: 'Easy',
    turns: 12,
    unlocked: true,
    previewImage: 'coastal',
    defaultWeather: 'sunny',
    defaultTimeOfDay: 'day',
    trafficEnabled: true,
    recordTime: 142.5,
  },
  {
    id: 'mountain_pass',
    name: 'Mountain Pass',
    subtitle: 'Alpine Touge & Hairpins',
    environment: 'mountain',
    lengthKm: 5.6,
    difficulty: 'Hard',
    turns: 22,
    unlocked: true,
    previewImage: 'mountain',
    defaultWeather: 'fog',
    defaultTimeOfDay: 'day',
    trafficEnabled: false,
    recordTime: 168.2,
  },
  {
    id: 'city_circuit',
    name: 'City Circuit',
    subtitle: 'Downtown Neon GP',
    environment: 'city',
    lengthKm: 4.2,
    difficulty: 'Medium',
    turns: 16,
    unlocked: false,
    previewImage: 'city',
    defaultWeather: 'night',
    defaultTimeOfDay: 'night',
    trafficEnabled: false,
    recordTime: 130.8,
  },
  {
    id: 'desert_highway',
    name: 'Desert Highway',
    subtitle: 'Mojave Speed Straight',
    environment: 'desert',
    lengthKm: 6.2,
    difficulty: 'Medium',
    turns: 10,
    unlocked: false,
    previewImage: 'desert',
    defaultWeather: 'sunset',
    defaultTimeOfDay: 'sunset',
    trafficEnabled: true,
    recordTime: 154.0,
  },
  {
    id: 'night_rain_circuit',
    name: 'Night Rain Circuit',
    subtitle: 'Tokyo Storm Overpass',
    environment: 'nightRain',
    lengthKm: 5.0,
    difficulty: 'Extreme',
    turns: 18,
    unlocked: false,
    previewImage: 'nightRain',
    defaultWeather: 'rain',
    defaultTimeOfDay: 'night',
    trafficEnabled: false,
    recordTime: 162.4,
  },
];

export const INITIAL_PLAYER_PROFILE: PlayerProfile = {
  name: 'Rider #99',
  level: 1,
  xp: 350,
  xpToNextLevel: 1000,
  coins: 18500,
  currentBikeId: 'apex_400',
  careerProgress: 15,
  careerTier: 'Rookie',
  racesWon: 1,
  totalRaces: 3,
  unlockedTrackIds: ['coastal_highway', 'mountain_pass'],
  unlockedBikeIds: ['apex_400'],
};

export const DEFAULT_SETTINGS: GameSettings = {
  graphicsQuality: 'high',
  targetFps: 60,
  sfxVolume: 0.85,
  engineVolume: 0.9,
  musicVolume: 0.65,
  motionBlur: true,
  cameraShake: true,
  cameraView: 'chase',
  steeringSensitivity: 1.0,
  speedUnit: 'kmh',
  autoGear: true,
  mobileTouchScheme: 'buttons',
};

// Upgrade multipliers & costs
export const UPGRADE_CONFIG = {
  engine: {
    name: 'Engine Tuning & ECU',
    description: 'Increases horsepower, peak RPM, and top speed.',
    costs: [2000, 4500, 8000, 14000, 22000],
    boostPerLevel: { topSpeed: 6, acceleration: 4 },
  },
  brakes: {
    name: 'Racing Calipers & Rotors',
    description: 'Shortens stopping distance and improves brake trail stability.',
    costs: [1500, 3200, 6000, 10500, 16000],
    boostPerLevel: { braking: 5, handling: 2 },
  },
  tires: {
    name: 'Slick Compound Tires',
    description: 'Maximizes lean angle adhesion and wet asphalt grip.',
    costs: [1800, 3800, 7200, 12000, 18500],
    boostPerLevel: { grip: 5, handling: 3 },
  },
  suspension: {
    name: 'Inverted Race Fork & Shock',
    description: 'Controls pitch under braking and stabilizes high-speed bumps.',
    costs: [1600, 3500, 6800, 11000, 17000],
    boostPerLevel: { handling: 4, grip: 2 },
  },
  transmission: {
    name: 'Quickshifter & Close-Ratio Box',
    description: 'Eliminates shift lag and delivers explosive gear drive.',
    costs: [2200, 5000, 9000, 15000, 24000],
    boostPerLevel: { acceleration: 5, topSpeed: 2 },
  },
  aerodynamics: {
    name: 'Carbon Winglets & Windscreen',
    description: 'Generates high-speed downforce and aerodynamic slipstream.',
    costs: [2500, 5500, 10000, 17000, 26000],
    boostPerLevel: { topSpeed: 4, handling: 3, grip: 2 },
  },
};

export function calculateEffectiveStats(bike: BikeData): BikeStats {
  const stats: BikeStats = { ...bike.baseStats };
  const u = bike.upgrades;

  stats.topSpeed += u.engine * UPGRADE_CONFIG.engine.boostPerLevel.topSpeed;
  stats.topSpeed += u.transmission * UPGRADE_CONFIG.transmission.boostPerLevel.topSpeed;
  stats.topSpeed += u.aerodynamics * UPGRADE_CONFIG.aerodynamics.boostPerLevel.topSpeed;

  stats.acceleration += u.engine * UPGRADE_CONFIG.engine.boostPerLevel.acceleration;
  stats.acceleration += u.transmission * UPGRADE_CONFIG.transmission.boostPerLevel.acceleration;

  stats.handling += u.suspension * UPGRADE_CONFIG.suspension.boostPerLevel.handling;
  stats.handling += u.brakes * UPGRADE_CONFIG.brakes.boostPerLevel.handling;
  stats.handling += u.tires * UPGRADE_CONFIG.tires.boostPerLevel.handling;
  stats.handling += u.aerodynamics * UPGRADE_CONFIG.aerodynamics.boostPerLevel.handling;

  stats.braking += u.brakes * UPGRADE_CONFIG.brakes.boostPerLevel.braking;

  stats.grip += u.tires * UPGRADE_CONFIG.tires.boostPerLevel.grip;
  stats.grip += u.suspension * UPGRADE_CONFIG.suspension.boostPerLevel.grip;
  stats.grip += u.aerodynamics * UPGRADE_CONFIG.aerodynamics.boostPerLevel.grip;

  // Cap stats at 100 except topSpeed
  stats.acceleration = Math.min(100, stats.acceleration);
  stats.handling = Math.min(100, stats.handling);
  stats.braking = Math.min(100, stats.braking);
  stats.grip = Math.min(100, stats.grip);

  return stats;
}
