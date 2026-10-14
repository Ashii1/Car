import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  OpenCityBike,
  CityMission,
  PlayerOpenCityProfile,
  GameSettings,
  TimeOfDay,
  WeatherType,
  CameraView,
  DistrictType,
  WantedState,
  DEFAULT_BIKE_DAMAGE,
} from './types/openCity';
import {
  INITIAL_OPEN_CITY_BIKES,
  INITIAL_CITY_MISSIONS,
  INITIAL_PLAYER_PROFILE,
  DEFAULT_OPEN_CITY_SETTINGS,
  UPGRADE_PRICING,
} from './data/openCityCatalog';
import { createCityGameScene, CityGameSceneInstance } from './3d/CityGameScene';
import { CarDesignStyle, AutomotiveDriveMode, DRIVE_MODE_AMBIENT_COLORS } from './3d/ModernCarBuilder';
import { CityHUD } from './components/CityHUD';
import { CityMapModal } from './components/CityMapModal';
import { MissionsModal } from './components/MissionsModal';
import { BikeDealerModal } from './components/BikeDealerModal';
import { GarageModal } from './components/GarageModal';
import { SettingsModal } from './components/SettingsModal';
import { PhotoModeModal } from './components/PhotoModeModal';
import { VisualInspectionModal } from './components/VisualInspectionModal';
import { ReplayModal, CinematicCameraAngle } from './components/ReplayModal';
import { DailyChallengesModal } from './components/DailyChallengesModal';
import { globalReplayRecorder, SavedReplayClip } from './game/ReplayRecorder';
import { cityAudio } from './audio/CityAudioEngine';
import { soundEngine } from './audio/SoundEngine';
import { DressingStyle } from './3d/motorcycle/RiderRagdollSystem';
import { Play, Map, Trophy, Bike, Car, Wrench, Settings, Sun, Moon, CloudRain, Award, Star, Camera, Volume2, VolumeX } from 'lucide-react';

export default function App() {
  // Player state & inventory persistence
  const [profile, setProfile] = useState<PlayerOpenCityProfile>(() => {
    try {
      const saved = localStorage.getItem('street_riders_profile');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_PLAYER_PROFILE;
  });

  const [bikes, setBikes] = useState<OpenCityBike[]>(() => {
    try {
      const saved = localStorage.getItem('street_riders_bikes');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_OPEN_CITY_BIKES;
  });

  const [missions, setMissions] = useState<CityMission[]>(INITIAL_CITY_MISSIONS);
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_OPEN_CITY_SETTINGS);

  // App mode
  const [inGame, setInGame] = useState(false);

  // Modals
  const [showMap, setShowMap] = useState(false);
  const [showMissions, setShowMissions] = useState(false);
  const [showDealer, setShowDealer] = useState(false);
  const [showGarage, setShowGarage] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPhotoMode, setShowPhotoMode] = useState(false);
  const [showInspection, setShowInspection] = useState(false);
  const [showDailyChallenges, setShowDailyChallenges] = useState(false);
  const [currentGear, setCurrentGear] = useState('D1');
  const [showReplay, setShowReplay] = useState(false);
  const [replayTime, setReplayTime] = useState(0);
  const [replayDuration, setReplayDuration] = useState(0);
  const [replayPlaying, setReplayPlaying] = useState(true);
  const [replaySpeed, setReplaySpeed] = useState(1.0);
  const [replayCameraAngle, setReplayCameraAngle] = useState<CinematicCameraAngle>('tv_broadcast');
  const [replayLooping, setReplayLooping] = useState(true);
  const [savedClips, setSavedClips] = useState<SavedReplayClip[]>(() => globalReplayRecorder.getSavedClips());

  // Tactical Police Wanted System State
  const [wantedState, setWantedState] = useState<WantedState | null>(null);
  const [radioChatter, setRadioChatter] = useState<string | null>(null);

  // World settings
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('sunset');
  const [weather, setWeather] = useState<WeatherType>('clear');
  const [cameraView, setCameraView] = useState<CameraView>('chase');
  const [riderDressing, setRiderDressing] = useState<DressingStyle>('asphalt_racer');
  const [isHelmetOn, setIsHelmetOn] = useState<boolean>(true);
  const [currentDistrict, setCurrentDistrict] = useState<DistrictType>('downtown');

  // Notification Banner
  const [notification, setNotification] = useState<{ title: string; subtitle: string } | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(() => cityAudio.isMuted);
  const [mountTransition, setMountTransition] = useState<{ state: 'NONE' | 'MOUNTING' | 'DISMOUNTING'; progress: number }>({
    state: 'NONE',
    progress: 0,
  });

  const toggleAppMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    cityAudio.setMuted(next);
    soundEngine.setMuted(next);
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const gameSceneRef = useRef<CityGameSceneInstance | null>(null);
  const [webglError, setWebglError] = useState<string | null>(null);
  const [sceneKey, setSceneKey] = useState(0);

  const currentBike = bikes.find((b) => b.id === profile.currentBikeId) || bikes[0];

  const [carStyle, setCarStyle] = useState<CarDesignStyle>(() =>
    currentBike.id.includes('benz') || currentBike.brand?.toUpperCase().includes('BENZ') || currentBike.brand?.toUpperCase().includes('MERCEDES')
      ? 'benz_amg'
      : 'bmw_m'
  );

  const handleSwitchCarStyle = (newStyle: CarDesignStyle) => {
    setCarStyle(newStyle);
    gameSceneRef.current?.setCarStyle(newStyle);
    const targetBike = bikes.find((b) =>
      newStyle === 'benz_amg'
        ? b.id.includes('benz') || b.brand?.toUpperCase().includes('BENZ') || b.brand?.toUpperCase().includes('MERCEDES')
        : b.id.includes('bmw') || b.brand?.toUpperCase().includes('BMW')
    );
    if (targetBike) {
      setProfile((prev) => ({ ...prev, currentBikeId: targetBike.id }));
    }
    showToast(
      newStyle === 'benz_amg' ? '🚙 MERCEDES-BENZ AMG SUV' : '🚙 BMW X5 M COMPETITION SUV',
      newStyle === 'benz_amg'
        ? '603 HP Biturbo V8 Luxury SUV • Panamericana Waterfall Grille & Running Boards Active'
        : '617 HP Twin-Turbo M-Power SUV • Twin Kidney Grille with M-Colors & Panoramic Roof Active'
    );
  };

  const [driveMode, setDriveMode] = useState<AutomotiveDriveMode>('SPORT+');
  const [ambientColor, setAmbientColor] = useState<string>('#ef4444');

  const handleDriveModeChange = (newMode: AutomotiveDriveMode) => {
    setDriveMode(newMode);
    gameSceneRef.current?.setDriveMode(newMode);
    const preset = DRIVE_MODE_AMBIENT_COLORS[newMode];
    if (preset) {
      setAmbientColor(preset);
      gameSceneRef.current?.setAmbientLightColor(preset);
    }
    const modeDescriptions: Record<AutomotiveDriveMode, string> = {
      'SPORT+': 'Crimson Red Ambient Lighting • High Downforce & Aggressive Throttle',
      'COMFORT': 'Electric Blue Ambient Lighting • Smooth Luxury Suspension & Cruise Aero',
      'CORSA': 'Sunset Track Orange Ambient Lighting • Track Aerodynamics & Maximum Response',
      'ECO': 'Emerald Mint Ambient Lighting • Efficient Aerodynamics & Low Drag',
      'INDIVIDUAL': 'Cyberpunk Violet Ambient Lighting • Custom Performance Configuration',
    };
    showToast(`🚙 DRIVE MODE: ${newMode}`, modeDescriptions[newMode]);
  };

  const handleAmbientColorChange = (newColor: string) => {
    setAmbientColor(newColor);
    gameSceneRef.current?.setAmbientLightColor(newColor);
  };

  const handleOpenReplay = (clip?: SavedReplayClip) => {
    const duration = clip ? clip.duration : globalReplayRecorder.getDuration();
    if (duration < 0.2) {
      showToast('🏎️ REPLAY BUFFER EMPTY', 'Drive your sports car for a few seconds to record replay footage!');
      return;
    }
    gameSceneRef.current?.startReplay(clip);
    setReplayDuration(duration);
    setReplayTime(0);
    setReplayPlaying(true);
    setShowReplay(true);
    showToast('🎬 30s CINEMATIC REPLAY ACTIVE', 'Use numbers 1-6 for camera angles • SPACE to pause');
  };

  const handleCloseReplay = () => {
    gameSceneRef.current?.stopReplay();
    setShowReplay(false);
  };

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('street_riders_profile', JSON.stringify(profile));
      localStorage.setItem('street_riders_bikes', JSON.stringify(bikes));
    } catch {}
  }, [profile, bikes]);

  const showToast = (title: string, subtitle: string) => {
    setNotification({ title, subtitle });
    setTimeout(() => setNotification(null), 3500);
  };

  // Mount 3D City Game Scene
  useEffect(() => {
    if (!containerRef.current) return;

    try {
      setWebglError(null);
      const gameScene = createCityGameScene(containerRef.current, currentBike, {
        onMissionComplete: (m, cash, xp) => {
          setProfile((prev) => ({
            ...prev,
            cash: prev.cash + cash,
            xp: prev.xp + xp,
            completedMissionIds: [...prev.completedMissionIds, m.id],
          }));
          showToast(`MISSION COMPLETE: ${m.title}`, `+$${cash.toLocaleString()} Cash • +${xp} XP`);
        },
        onMissionFail: (reason) => {
          showToast('MISSION FAILED', reason);
        },
        onStuntReward: (score, label) => {
          setProfile((prev) => ({
            ...prev,
            cash: prev.cash + Math.round(score / 5),
            stuntsCompleted: prev.stuntsCompleted + 1,
          }));
        },
        onDistrictChange: (district) => {
          setCurrentDistrict(district);
          showToast(`ENTERING ${district.toUpperCase()}`, 'New streets and challenges available');
        },
        onInfraction: (type, desc, stars) => {
          showToast(type, desc);
        },
        onEvadeSuccess: (rewardCash) => {
          setProfile((prev) => ({ ...prev, cash: prev.cash + rewardCash }));
          showToast('PURSUIT EVADED!', `+$${rewardCash.toLocaleString()} Clean Getaway Bonus`);
        },
        onRadioChatter: (msg) => {
          setRadioChatter(msg);
          setTimeout(() => setRadioChatter(null), 5500);
        },
        onTollPaid: (fee) => {
          setProfile((prev) => ({ ...prev, cash: Math.max(0, prev.cash - fee) }));
          showToast('FASTAG TOLL PAID', `₹${fee} deducted from balance • Gate opened`);
        },
        onTollWarning: (msg) => {
          showToast('FASTAG APPROACH', msg);
        },
        onPotholeHit: (severity, speedLoss) => {
          showToast(
            severity === 'major' ? 'DEEP POTHOLE HIT!' : 'POTHOLE / ROUGH ROAD',
            `Speed reduced by ${Math.round(speedLoss)} km/h • Watch road surface`
          );
        },
        onBikeDamage: (damage) => {
          setBikes((prev) => {
            const current = prev.find((b) => b.id === currentBike.id);
            if (
              current?.damage &&
              current.damage.overallDamage === damage.overallDamage &&
              current.damage.fairingScratches === damage.fairingScratches &&
              current.damage.fairingCracks === damage.fairingCracks
            ) {
              return prev;
            }
            return prev.map((b) =>
              b.id === currentBike.id
                ? { ...b, damage: { ...damage } }
                : b
            );
          });
        },
        onMountTransition: (state, progress) => {
          setMountTransition((prev) => {
            if (prev.state === state && Math.round(prev.progress * 100) === Math.round(progress * 100)) {
              return prev;
            }
            return { state, progress };
          });
        },
      });

      gameSceneRef.current = gameScene;
      gameScene.start();

      return () => {
        gameScene.dispose();
        gameSceneRef.current = null;
      };
    } catch (err: any) {
      console.error('Failed to initialize 3D scene:', err);
      setWebglError(err?.message || 'WebGL context could not be created');
    }
  }, [sceneKey]);

  // Update bike in 3D scene when active bike changes
  useEffect(() => {
    if (gameSceneRef.current) {
      gameSceneRef.current.setBike(currentBike);
    }
  }, [currentBike]);

  // Update day/night & weather
  useEffect(() => {
    if (gameSceneRef.current) {
      gameSceneRef.current.setTimeAndWeather(timeOfDay, weather);
    }
  }, [timeOfDay, weather]);

  // Desktop Keyboard Controls
  const keysDown = useRef<{ [k: string]: boolean }>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      cityAudio.ensureContext();
      keysDown.current[e.code] = true;

      if (e.code === 'KeyM') setShowMap((prev) => !prev);
      if (e.code === 'KeyT') setShowMissions((prev) => !prev);
      if (e.code === 'KeyH') gameSceneRef.current?.honkHorn();
      if (e.code === 'KeyQ' || e.code === 'KeyE') gameSceneRef.current?.toggleMount();
      if (e.code === 'KeyP') {
        setShowPhotoMode((prev) => {
          const next = !prev;
          gameSceneRef.current?.setPhotoMode(next);
          return next;
        });
      }

      if (e.code === 'KeyR') {
        if (showReplay) {
          handleCloseReplay();
        } else if (hudPlayerState.isOnBike) {
          const cur = gameSceneRef.current?.getCurrentGear() || currentGear;
          if (cur === 'R') {
            gameSceneRef.current?.triggerGearShift('D1', false);
            setCurrentGear('D1');
            showToast('🚙 DRIVE [D] ENGAGED', 'Accelerate forward');
          } else {
            gameSceneRef.current?.triggerGearShift('R', true);
            setCurrentGear('R');
            showToast('🚙 REVERSE [R] ENGAGED', 'Step on Gas [W] or Reverse [S] to drive backward');
          }
        } else {
          handleOpenReplay();
        }
      }

      if (e.code === 'KeyY') {
        if (showReplay) handleCloseReplay();
        else handleOpenReplay();
      }

      if (e.code === 'KeyC') {
        const views: CameraView[] = ['chase', 'helmetCam', 'drone', 'firstPerson', 'close'];
        const next = views[(views.indexOf(cameraView) + 1) % views.length];
        setCameraView(next);
        gameSceneRef.current?.setCameraView(next);
      }

      // Manual Gear Shifting (Paddle / Shifter Stick input)
      if (e.code === 'KeyX') {
        const cur = gameSceneRef.current?.getCurrentGear() || currentGear;
        let nextG = 'D2';
        if (cur === 'P' || cur === 'R') nextG = 'D1';
        else if (cur === 'D1') nextG = 'D2';
        else if (cur === 'D2') nextG = 'D3';
        else if (cur === 'D3') nextG = 'D4';
        else if (cur === 'D4') nextG = 'D5';
        else if (cur === 'D5' || cur === 'D6') nextG = 'D6';
        gameSceneRef.current?.triggerGearShift(nextG, false);
        setCurrentGear(nextG);
      }

      if (e.code === 'KeyZ' && !(k => k['Space'])(keysDown.current)) {
        const cur = gameSceneRef.current?.getCurrentGear() || currentGear;
        let nextG = 'D1';
        if (cur === 'D6') nextG = 'D5';
        else if (cur === 'D5') nextG = 'D4';
        else if (cur === 'D4') nextG = 'D3';
        else if (cur === 'D3') nextG = 'D2';
        else if (cur === 'D2') nextG = 'D1';
        gameSceneRef.current?.triggerGearShift(nextG, true);
        setCurrentGear(nextG);
      }

      updateSceneInputs();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysDown.current[e.code] = false;
      updateSceneInputs();
    };

    const updateSceneInputs = () => {
      if (!gameSceneRef.current) return;
      const k = keysDown.current;

      const throttle = k['KeyW'] || k['ArrowUp'] ? 1 : 0;
      const brake = k['KeyS'] || k['ArrowDown'] || k['Space'] ? 1 : 0;
      const steer = (k['KeyD'] || k['ArrowRight'] ? 1 : 0) - (k['KeyA'] || k['ArrowLeft'] ? 1 : 0);
      const nitro = !!k['ShiftLeft'] || !!k['ShiftRight'];
      const wheelie = !!k['KeyZ'] || (!!k['Space'] && throttle > 0);
      const isReverseInput = (!!k['KeyS'] || !!k['ArrowDown']) && throttle === 0;

      gameSceneRef.current.updateInputs({
        throttle,
        brake,
        steer,
        nitro,
        wheelie,
        reverse: isReverseInput,
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [cameraView]);

  // Garage upgrade handler
  const handleUpgrade = (part: keyof typeof UPGRADE_PRICING) => {
    const cost = UPGRADE_PRICING[part].costs[currentBike.upgrades[part]];
    if (profile.cash < cost) return;

    setProfile((prev) => ({ ...prev, cash: prev.cash - cost }));
    setBikes((prev) =>
      prev.map((b) => {
        if (b.id === currentBike.id) {
          return {
            ...b,
            upgrades: { ...b.upgrades, [part]: b.upgrades[part] + 1 },
          };
        }
        return b;
      })
    );
  };

  // Bike purchase handler
  const handleBuyBike = (bikeId: string) => {
    const bike = bikes.find((b) => b.id === bikeId);
    if (!bike || profile.cash < bike.price) return;

    cityAudio.playCashSound();
    setProfile((prev) => ({
      ...prev,
      cash: prev.cash - bike.price,
      currentBikeId: bike.id,
      ownedBikeIds: [...prev.ownedBikeIds, bike.id],
    }));
    setBikes((prev) => prev.map((b) => (b.id === bike.id ? { ...b, unlocked: true } : b)));
    showToast(`PURCHASED: ${bike.name}`, 'Delivered to your garage');
  };

  // Workshop repair & detailing handler (restores cracked fairings, missing mirrors, and deep scratches)
  const handleRepairBike = (cost: number) => {
    cityAudio.playRepair();
    gameSceneRef.current?.repairBike();
    setProfile((prev) => ({
      ...prev,
      cash: Math.max(0, prev.cash - cost),
    }));
    setBikes((prev) =>
      prev.map((b) =>
        b.id === currentBike.id
          ? { ...b, damage: { ...DEFAULT_BIKE_DAMAGE } }
          : b
      )
    );
    showToast('MOTORCYCLE RESTORED', 'Body fairings, mirrors, and paint repaired to showroom condition');
  };

  // Poll player state for HUD
  const [hudPlayerState, setHudPlayerState] = useState(
    gameSceneRef.current?.getPlayerState() || {
      x: 0,
      y: 0,
      z: 0,
      heading: 0,
      speed: 0,
      rpm: 1500,
      gear: 1,
      rpmRatio: 0,
      leanAngle: 0,
      pitchAngle: 0,
      wheelieAngle: 0,
      nitroAmount: 100,
      isNitroActive: false,
      isBraking: false,
      isReversing: false,
      isGrounded: true,
      airTimeSeconds: 0,
      verticalVelocity: 0,
      isOnBike: true,
      isKickstandDeployed: false,
      wantedLevel: 0,
      wantedTimer: 0,
      stuntScore: 0,
      currentStuntLabel: '',
      surfaceType: 'asphalt' as const,
      surfaceFriction: 1.05,
      slipAngle: 0,
      slipRatio: 0,
      lateralVelocity: 0,
      isDrifting: false,
      driftScore: 0,
    }
  );

  const handleMobileInput = useCallback((inputs: {
    throttle: number;
    brake: number;
    steer: number;
    nitro: boolean;
    wheelie: boolean;
    reverse: boolean;
  }) => {
    gameSceneRef.current?.updateInputs(inputs);
  }, []);

  useEffect(() => {
    let anim: number;
    let lastWantedLevel = -1;
    let lastEvadeTimerSec = -1;

    const poll = () => {
      if (gameSceneRef.current) {
        const ps = gameSceneRef.current.getPlayerState();
        setHudPlayerState({ ...ps });

        const activeGear = gameSceneRef.current.getCurrentGear();
        if (activeGear) {
          setCurrentGear((prev) => (prev !== activeGear ? activeGear : prev));
        }

        const ws = gameSceneRef.current.getWantedState();
        if (ws) {
          const evadeSec = Math.round(ws.evadeTimer);
          if (ws.level !== lastWantedLevel || evadeSec !== lastEvadeTimerSec) {
            lastWantedLevel = ws.level;
            lastEvadeTimerSec = evadeSec;
            setWantedState({ ...ws });
          }
        } else if (lastWantedLevel !== -1) {
          lastWantedLevel = -1;
          lastEvadeTimerSec = -1;
          setWantedState(null);
        }
        if (showReplay) {
          setReplayTime(gameSceneRef.current.getReplayTime());
        }
      }
      anim = requestAnimationFrame(poll);
    };
    anim = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(anim);
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#06080d] select-none">
      {/* 1. 3D Open World Viewport */}
      <div ref={containerRef} className="absolute inset-0 z-0" />

      {/* WebGL Recovery Overlay */}
      {webglError && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-6">
          <div className="max-w-md w-full bg-slate-900/95 border border-amber-500/50 rounded-2xl p-6 text-center shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-2xl font-bold">
              ⚡
            </div>
            <h2 className="text-xl font-race font-bold text-white mb-2 tracking-wider">
              3D GRAPHICS RESET
            </h2>
            <p className="text-sm text-slate-300 font-sans mb-6 leading-relaxed">
              The browser WebGL graphics context was reset. Click below to reload the high-performance 3D open world.
            </p>
            <button
              onClick={() => {
                setWebglError(null);
                setSceneKey((k) => k + 1);
              }}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold font-race tracking-wider shadow-lg shadow-orange-500/30 transition-all active:scale-95"
            >
              RESTORE 3D GRAPHICS
            </button>
          </div>
        </div>
      )}

      {/* 2. Notification Toast */}
      {notification && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 glass-panel-accent px-6 py-3 rounded-2xl border border-orange-500/60 shadow-[0_0_30px_rgba(249,115,22,0.4)] flex items-center gap-3 animate-in fade-in slide-in-from-top duration-300">
          <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
          <div>
            <div className="font-race font-bold text-sm text-white">{notification.title}</div>
            <div className="text-xs font-mono text-orange-200">{notification.subtitle}</div>
          </div>
        </div>
      )}

      {/* 3. Main Menu Overlay (shown when not inGame) */}
      {!inGame && (
        <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex flex-col justify-between p-6 md:p-12">
          {/* Header Branding */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-10 bg-gradient-to-b from-orange-500 to-red-600 rounded-sm" />
              <div>
                <h1 className="font-race font-black italic text-4xl md:text-6xl text-white tracking-wider drop-shadow-[0_0_30px_rgba(249,115,22,0.4)]">
                  STREET RIDERS <span className="text-orange-500 text-3xl md:text-5xl font-mono">OPEN CITY</span>
                </h1>
                <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest -mt-1">
                  Seamless 3D Open-World Motorcycle Action
                </p>
              </div>
            </div>

            {/* Quick Time of Day & Weather Pickers */}
            <div className="glass-panel p-2 rounded-2xl border border-white/10 flex items-center gap-2">
              <button
                onClick={() => setTimeOfDay('afternoon')}
                className={`p-2 rounded-xl cursor-pointer ${timeOfDay === 'afternoon' ? 'bg-orange-500 text-white' : 'text-zinc-400'}`}
                title="Afternoon Sun"
              >
                <Sun className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTimeOfDay('sunset')}
                className={`p-2 rounded-xl cursor-pointer ${timeOfDay === 'sunset' ? 'bg-orange-500 text-white' : 'text-zinc-400'}`}
                title="Sunset"
              >
                <Sun className="w-4 h-4 text-amber-400" />
              </button>
              <button
                onClick={() => setTimeOfDay('night')}
                className={`p-2 rounded-xl cursor-pointer ${timeOfDay === 'night' ? 'bg-orange-500 text-white' : 'text-zinc-400'}`}
                title="Tokyo Midnight"
              >
                <Moon className="w-4 h-4" />
              </button>
              <div className="w-[1px] h-6 bg-white/10" />
              <button
                onClick={() => setWeather((w) => (w === 'clear' ? 'rain' : 'clear'))}
                className={`p-2 rounded-xl cursor-pointer ${weather === 'rain' ? 'bg-cyan-500 text-black' : 'text-zinc-400'}`}
                title="Rain / Wet Roads"
              >
                <CloudRain className="w-4 h-4" />
              </button>
              <div className="w-[1px] h-6 bg-white/10" />
              <button
                onClick={toggleAppMute}
                className={`p-2 rounded-xl cursor-pointer border transition-all ${
                  isMuted
                    ? 'bg-red-500/30 border-red-500/50 text-red-400'
                    : 'bg-white/5 border-white/10 text-zinc-300 hover:text-white'
                }`}
                title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Center Play Button & Options Drawer (Phase 2 Professional Main Menu) */}
          <div className="max-w-md w-full my-auto space-y-2.5">
            {/* 1. CONTINUE / RESUME */}
            <button
              onClick={() => {
                cityAudio.ensureContext();
                setInGame(true);
              }}
              className="w-full glass-panel-accent p-4 rounded-2xl border border-cyan-400 hover:border-cyan-300 text-left transition-all active:scale-98 shadow-[0_0_30px_rgba(6,182,212,0.35)] flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-cyan-400 text-black flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <Play className="w-5 h-5 fill-black ml-0.5" />
                </div>
                <div>
                  <div className="font-race font-black text-xl text-white">DRIVE MODERN CAR</div>
                  <div className="text-[11px] font-mono text-cyan-200">
                    Apex GT Twin-Turbo • Sport+ Cockpit
                  </div>
                </div>
              </div>
              <span className="font-race text-xl text-cyan-400 font-bold">▶</span>
            </button>

            {/* 2. RIDE (Free Roam) */}
            <button
              onClick={() => {
                cityAudio.ensureContext();
                setInGame(true);
              }}
              className="w-full glass-panel p-3.5 rounded-xl border border-white/10 hover:border-cyan-400 text-left flex items-center justify-between text-white font-race font-bold cursor-pointer transition-all active:scale-98"
            >
              <div className="flex items-center gap-3">
                <Car className="w-5 h-5 text-cyan-400" />
                <span>FREE DRIVE (OPEN CITY)</span>
              </div>
              <span className="text-xs font-mono text-zinc-400">Highways, Downtown & Tunnels</span>
            </button>

            {/* 3. GARAGE */}
            <button
              onClick={() => setShowGarage(true)}
              className="w-full glass-panel p-3.5 rounded-xl border border-white/10 hover:border-orange-400 text-left flex items-center justify-between text-white font-race font-bold cursor-pointer transition-all active:scale-98"
            >
              <div className="flex items-center gap-3">
                <Wrench className="w-5 h-5 text-orange-400" />
                <span>GARAGE & TUNING</span>
              </div>
              <span className="text-xs font-mono text-cyan-400">{currentBike.name}</span>
            </button>

            {/* 3b. 1-METER REALISM TEST INSPECTION */}
            <button
              onClick={() => setShowInspection(true)}
              className="w-full glass-panel-accent p-3.5 rounded-xl border border-cyan-400/80 hover:border-cyan-300 text-left flex items-center justify-between text-white font-race font-bold cursor-pointer transition-all active:scale-98 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
            >
              <div className="flex items-center gap-3">
                <Camera className="w-5 h-5 text-cyan-400" />
                <span>INSPECT VEHICLE (3D REALISM STUDIO)</span>
              </div>
              <span className="text-xs font-mono text-cyan-300">Exterior & Cockpit</span>
            </button>

            {/* 4. MAP */}
            <button
              onClick={() => setShowMap(true)}
              className="w-full glass-panel p-3.5 rounded-xl border border-white/10 hover:border-cyan-400 text-left flex items-center justify-between text-white font-race font-bold cursor-pointer transition-all active:scale-98"
            >
              <div className="flex items-center gap-3">
                <Map className="w-5 h-5 text-cyan-400" />
                <span>GPS ROAD NETWORK MAP</span>
              </div>
              <span className="text-xs font-mono text-zinc-400">NH-48, City, Village</span>
            </button>

            {/* 5. MISSIONS */}
            <button
              onClick={() => setShowMissions(true)}
              className="w-full glass-panel p-3.5 rounded-xl border border-white/10 hover:border-amber-400 text-left flex items-center justify-between text-white font-race font-bold cursor-pointer transition-all active:scale-98"
            >
              <div className="flex items-center gap-3">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span>CONTRACTS & MISSIONS</span>
              </div>
              <span className="text-xs font-mono text-zinc-400">5 Available</span>
            </button>

            {/* 6. BIKES */}
            <button
              onClick={() => setShowDealer(true)}
              className="w-full glass-panel p-3.5 rounded-xl border border-white/10 hover:border-emerald-400 text-left flex items-center justify-between text-white font-race font-bold cursor-pointer transition-all active:scale-98"
            >
              <div className="flex items-center gap-3">
                <Bike className="w-5 h-5 text-emerald-400" />
                <span>MOTORCYCLE COLLECTION</span>
              </div>
              <span className="text-xs font-mono text-emerald-400">5 Models</span>
            </button>

            {/* 7. SETTINGS */}
            <button
              onClick={() => setShowSettings(true)}
              className="w-full glass-panel p-3.5 rounded-xl border border-white/10 hover:border-white text-left flex items-center justify-between text-white font-race font-bold cursor-pointer transition-all active:scale-98"
            >
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-zinc-300" />
                <span>GAME SETTINGS</span>
              </div>
              <span className="text-xs font-mono text-zinc-400">Audio, Graphics, Controls</span>
            </button>
          </div>

          {/* Footer Controls Guide */}
          <div className="flex flex-col md:flex-row items-center justify-between text-xs font-mono text-zinc-500 gap-2">
            <div>
              Desktop: <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-300">W/A/S/D</kbd> Drive • <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-300">Shift</kbd> Nitro • <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-300">Space+W</kbd> Wheelie • <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-300">Q</kbd> Mount/Foot • <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-300">M</kbd> Map
            </div>
            <div>Full Touch Controls for Smartphones & Tablets</div>
          </div>
        </div>
      )}

      {/* 4. Active In-Game HUD (shown when inGame is true) */}
      {inGame && (
        <CityHUD
          playerState={hudPlayerState}
          wantedState={wantedState}
          radioChatter={radioChatter}
          activeMission={gameSceneRef.current?.getActiveMission() || null}
          missionTimeRemaining={gameSceneRef.current?.getMissionTimeRemaining() || 0}
          currentDistrict={currentDistrict}
          cash={profile.cash}
          cameraView={cameraView}
          bikeDamage={currentBike.damage}
          onCameraToggle={() => {
            const views: CameraView[] = ['chase', 'helmetCam', 'drone', 'firstPerson', 'close'];
            const next = views[(views.indexOf(cameraView) + 1) % views.length];
            setCameraView(next);
            gameSceneRef.current?.setCameraView(next);
          }}
          onSelectCameraView={(view) => {
            setCameraView(view);
            gameSceneRef.current?.setCameraView(view);
          }}
          onOpenPhotoMode={() => {
            gameSceneRef.current?.setPhotoMode(true);
            setShowPhotoMode(true);
          }}
          onOpenReplay={() => handleOpenReplay()}
          onOpenMap={() => setShowMap(true)}
          onOpenMissions={() => setShowMissions(true)}
          onOpenGarage={() => setShowGarage(true)}
          onOpenDealer={() => setShowDealer(true)}
          onMountToggle={() => gameSceneRef.current?.toggleMount()}
          mountTransition={mountTransition}
          onHorn={() => gameSceneRef.current?.honkHorn()}
          onPause={() => setShowSettings(true)}
          onMobileInput={handleMobileInput}
          speedUnit={settings.speedUnit}
          currentDressingStyle={riderDressing}
          onDressingChange={(style) => {
            setRiderDressing(style);
            gameSceneRef.current?.setDressingStyle(style);
            if (style === 'asphalt_racer') setIsHelmetOn(true);
            else if (style === 'biker_leather') setIsHelmetOn(false);
          }}
          isHelmetOn={isHelmetOn}
          onToggleHelmet={() => {
            if (gameSceneRef.current) {
              const active = gameSceneRef.current.toggleHelmet();
              setIsHelmetOn(active);
            }
          }}
          carStyle={carStyle}
          onSwitchCarStyle={handleSwitchCarStyle}
          driveMode={driveMode}
          onDriveModeChange={handleDriveModeChange}
          ambientColor={ambientColor}
          onAmbientColorChange={handleAmbientColorChange}
          onOpenDailyChallenges={() => setShowDailyChallenges(true)}
          onManualShift={(direction) => {
            const cur = gameSceneRef.current?.getCurrentGear() || currentGear;
            let nextG = cur;
            if (direction === 'UP') {
              if (cur === 'P' || cur === 'R') nextG = 'D1';
              else if (cur === 'D1') nextG = 'D2';
              else if (cur === 'D2') nextG = 'D3';
              else if (cur === 'D3') nextG = 'D4';
              else if (cur === 'D4') nextG = 'D5';
              else if (cur === 'D5' || cur === 'D6') nextG = 'D6';
              gameSceneRef.current?.triggerGearShift(nextG, false);
            } else {
              if (cur === 'D6') nextG = 'D5';
              else if (cur === 'D5') nextG = 'D4';
              else if (cur === 'D4') nextG = 'D3';
              else if (cur === 'D3') nextG = 'D2';
              else if (cur === 'D2') nextG = 'D1';
              else if (cur === 'D1') nextG = 'R';
              gameSceneRef.current?.triggerGearShift(nextG, true);
            }
            setCurrentGear(nextG);
          }}
          onShiftGear={(targetGear) => {
            const cur = gameSceneRef.current?.getCurrentGear() || currentGear;
            const isDown = targetGear === 'R' || targetGear === 'P' || targetGear < cur;
            setCurrentGear(targetGear);
            gameSceneRef.current?.triggerGearShift(targetGear, isDown);
          }}
          currentGear={currentGear}
        />
      )}

      {/* 5. Modals */}
      {showReplay && (
        <ReplayModal
          isOpen={showReplay}
          onClose={handleCloseReplay}
          currentTime={replayTime}
          duration={replayDuration}
          isPlaying={replayPlaying}
          playbackSpeed={replaySpeed}
          cameraAngle={replayCameraAngle}
          isLooping={replayLooping}
          onPlayPauseToggle={() => {
            const next = !replayPlaying;
            setReplayPlaying(next);
            gameSceneRef.current?.setReplayPlaying(next);
          }}
          onSeek={(t) => {
            setReplayTime(t);
            gameSceneRef.current?.seekReplay(t);
          }}
          onSpeedChange={(spd) => {
            setReplaySpeed(spd);
            gameSceneRef.current?.setReplaySpeed(spd);
          }}
          onCameraAngleChange={(angle) => {
            setReplayCameraAngle(angle);
            gameSceneRef.current?.setReplayCameraAngle(angle);
          }}
          onLoopToggle={() => {
            const next = !replayLooping;
            setReplayLooping(next);
            gameSceneRef.current?.setReplayLooping(next);
          }}
          onSaveClip={(title) => {
            const clip = globalReplayRecorder.saveClip(title);
            if (clip) {
              setSavedClips(globalReplayRecorder.getSavedClips());
            }
            return clip;
          }}
          savedClips={savedClips}
          onLoadSavedClip={(id) => {
            const clip = savedClips.find((c) => c.id === id);
            if (clip) {
              handleOpenReplay(clip);
            }
          }}
          onDeleteSavedClip={(id) => {
            globalReplayRecorder.deleteSavedClip(id);
            setSavedClips(globalReplayRecorder.getSavedClips());
          }}
          telemetry={gameSceneRef.current?.getReplayTelemetry() || undefined}
        />
      )}

      {showPhotoMode && (
        <PhotoModeModal
          onUpdateCamera={(params) => gameSceneRef.current?.updatePhotoCamera(params)}
          onCaptureScreenshot={() => gameSceneRef.current?.captureScreenshot() || ''}
          onClose={() => {
            gameSceneRef.current?.setPhotoMode(false);
            setShowPhotoMode(false);
          }}
        />
      )}

      {showMap && (
        <CityMapModal
          playerX={hudPlayerState.x}
          playerZ={hudPlayerState.z}
          playerHeading={hudPlayerState.heading}
          activeMission={gameSceneRef.current?.getActiveMission() || null}
          currentDistrict={currentDistrict}
          onFastTravel={(x, z) => gameSceneRef.current?.teleportTo(x, z)}
          onClose={() => setShowMap(false)}
        />
      )}

      {showMissions && (
        <MissionsModal
          missions={missions}
          playerProfile={profile}
          onAcceptMission={(m) => {
            gameSceneRef.current?.startMission(m);
            showToast(`CONTRACT ACCEPTED: ${m.title}`, 'Follow the GPS markers to complete objective');
            setInGame(true);
          }}
          onClose={() => setShowMissions(false)}
        />
      )}

      {showDealer && (
        <BikeDealerModal
          bikes={bikes}
          playerProfile={profile}
          onSelectBike={(id) => setProfile((p) => ({ ...p, currentBikeId: id }))}
          onBuyBike={handleBuyBike}
          onClose={() => setShowDealer(false)}
        />
      )}

      {showGarage && (
        <GarageModal
          currentBike={currentBike}
          playerProfile={profile}
          onUpgrade={handleUpgrade}
          onCustomize={(c) => {
            setBikes((prev) => prev.map((b) => (b.id === currentBike.id ? { ...b, customization: c } : b)));
          }}
          onRepair={handleRepairBike}
          onClose={() => setShowGarage(false)}
        />
      )}

      {showInspection && (
        <VisualInspectionModal
          currentBike={currentBike}
          onClose={() => setShowInspection(false)}
        />
      )}

      {showDailyChallenges && (
        <DailyChallengesModal
          isOpen={showDailyChallenges}
          onClose={() => setShowDailyChallenges(false)}
          onClaimReward={(cash, xp) => {
            setProfile((prev) => ({
              ...prev,
              cash: prev.cash + cash,
              xp: prev.xp + xp,
            }));
            showToast('DAILY CHALLENGE COMPLETE!', `+$${cash.toLocaleString()} Cash • +${xp} XP Reputation`);
          }}
        />
      )}
    </div>
  );
}
