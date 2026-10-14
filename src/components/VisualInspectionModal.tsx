import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Camera,
  RotateCw,
  User,
  ZoomIn,
  ZoomOut,
  Maximize2,
  CheckCircle2,
  Sliders,
  Sparkles,
  Layers,
} from 'lucide-react';
import { OpenCityBike } from '../types/openCity';
import { createGarageScene, GarageSceneInstance, GarageCameraPreset } from '../3d/GarageScene';

interface VisualInspectionModalProps {
  currentBike: OpenCityBike;
  onClose: () => void;
}

interface CameraPresetButton {
  id: GarageCameraPreset;
  label: string;
  sublabel: string;
  distance: string;
}

const PRESETS: CameraPresetButton[] = [
  { id: 'front', label: 'FRONT VIEW', sublabel: 'Headlights, Forks & Calipers', distance: '1.8m' },
  { id: 'side', label: 'SIDE VIEW', sublabel: 'Wheelbase, Frame & Exhaust', distance: '2.4m' },
  { id: 'rear', label: 'REAR VIEW', sublabel: '190mm Tire, Muffler & Chain', distance: '2.0m' },
  { id: 'threeQuarter', label: '3/4 VIEW', sublabel: 'Dynamic Superbike Stance', distance: '2.6m' },
  { id: 'closeEngine', label: 'CLOSE-UP ENGINE', sublabel: 'Fins, Clutch, Sight Glass & Headers', distance: '0.8m' },
  { id: 'closeFrontWheel', label: 'CLOSE-UP FRONT WHEEL', sublabel: 'Brembo Calipers, Petal Disc & Tire', distance: '0.6m' },
  { id: 'closeRearWheel', label: 'CLOSE-UP REAR WHEEL', sublabel: 'Gull-Wing Swingarm & 520 Chain', distance: '0.6m' },
  { id: 'riderSeated', label: 'RIDER SEATED', sublabel: 'Anatomic Fit, Visor & Knee Pucks', distance: '1.2m' },
];

export const VisualInspectionModal: React.FC<VisualInspectionModalProps> = ({
  currentBike,
  onClose,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const garageRef = useRef<GarageSceneInstance | null>(null);

  const [activePreset, setActivePreset] = useState<GarageCameraPreset>('threeQuarter');
  const [isTurntable, setIsTurntable] = useState(false);
  const [showRider, setShowRider] = useState(true);
  const [inspectedPartsCount, setInspectedPartsCount] = useState<number>(0);

  // Initialize Garage ThreeJS Scene
  useEffect(() => {
    if (!containerRef.current) return;

    const garage = createGarageScene(containerRef.current);
    garageRef.current = garage;
    garage.setBike(currentBike as any, showRider);
    garage.setCameraTarget(activePreset);
    garage.start();

    // Mouse / Touch Drag Orbit Listeners
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !garageRef.current) return;
      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;
      garageRef.current.rotateBike(dx);
      if (Math.abs(dy) > 2) {
        garageRef.current.zoomCamera(dy * 0.4);
      }
      prevX = e.clientX;
      prevY = e.clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      garageRef.current?.zoomCamera(e.deltaY * 0.5);
    };

    const dom = containerRef.current;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('wheel', onWheel);
      garage.dispose();
      garageRef.current = null;
    };
  }, [currentBike]);

  const selectPreset = (preset: GarageCameraPreset) => {
    setActivePreset(preset);
    garageRef.current?.setCameraTarget(preset);
    setInspectedPartsCount((prev) => Math.min(8, prev + 1));
  };

  const toggleRider = () => {
    const next = !showRider;
    setShowRider(next);
    garageRef.current?.toggleRider(next);
  };

  const toggleTurntable = () => {
    const next = !isTurntable;
    setIsTurntable(next);
    garageRef.current?.toggleTurntable(next);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#05070a] select-none text-white animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/60 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-7 bg-emerald-500 rounded-sm" />
          <div>
            <h1 className="font-race font-black text-xl md:text-2xl tracking-wider text-white flex items-center gap-2">
              CLOSE-UP REALISM INSPECTION STUDIO
              <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                1-METER QUALITY VALIDATION
              </span>
            </h1>
            <p className="text-xs font-mono text-zinc-400">
              {currentBike.name} • 1000cc Modern Street Sport • Production-Grade 3D Mechanical Mesh
            </p>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-3">
          {/* Turntable Auto-Rotate Toggle */}
          <button
            onClick={toggleTurntable}
            className={`px-3.5 py-2 rounded-xl border text-xs font-mono flex items-center gap-2 transition-all cursor-pointer ${
              isTurntable
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
            }`}
          >
            <RotateCw className={`w-4 h-4 ${isTurntable ? 'animate-spin' : ''}`} />
            <span>TURNTABLE {isTurntable ? 'ON' : 'OFF'}</span>
          </button>

          {/* Rider Visibility Toggle */}
          <button
            onClick={toggleRider}
            className={`px-3.5 py-2 rounded-xl border text-xs font-mono flex items-center gap-2 transition-all cursor-pointer ${
              showRider
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>RIDER {showRider ? 'SEATED' : 'HIDDEN'}</span>
          </button>

          {/* Close Modal */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
            title="Close Inspection Studio"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Studio Viewport (Interactive Three.js Canvas) */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        <div ref={containerRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />

        {/* Floating Mechanical Verification Badges */}
        <div className="absolute top-4 left-6 pointer-events-none hidden md:flex flex-col gap-2 max-w-sm">
          <div className="glass-panel p-3.5 rounded-2xl border border-white/15 bg-black/60 backdrop-blur-md shadow-2xl">
            <div className="flex items-center gap-2 text-xs font-race font-bold text-emerald-400 mb-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>MECHANICAL FIDELITY CHECKLIST</span>
            </div>
            <ul className="text-[11px] font-mono text-zinc-300 space-y-1">
              <li>• Toroidal 120/70 & 190/55 crowned tires (deep tread sipes)</li>
              <li>• Brembo Stylema 4-piston radial monobloc calipers & banjo lines</li>
              <li>• 320mm floating laser-drilled petal discs with carrier bobbins</li>
              <li>• Öhlins 43mm inverted USD forks & CNC billet triple trees</li>
              <li>• 1000cc Inline-4 with cooling fins, sight glass & oil cap</li>
              <li>• 4-into-1 titanium exhaust headers & megaphone muffler</li>
              <li>• Gull-wing aluminum swingarm, 520 chain & rear sprocket</li>
              <li>• Continuous-curvature fuel tank with anatomical knee recesses</li>
              <li>• Dual spherical projector lenses with halo DRL eyebrows</li>
              <li>• Proportioned human rider in racing leathers with speed hump</li>
            </ul>
          </div>
        </div>

        {/* Orbit Drag & Zoom Instructions Overlay */}
        <div className="absolute top-4 right-6 pointer-events-none hidden md:flex items-center gap-2 text-xs font-mono text-zinc-400 glass-panel px-3.5 py-2 rounded-xl border border-white/10 bg-black/50 backdrop-blur-sm">
          <span>Click & Drag to Orbit 360° • Scroll Wheel to Zoom (0.35m - 6.5m)</span>
        </div>
      </div>

      {/* Bottom Presets Switcher Bar (The 8 Mandatory Views) */}
      <div className="p-4 md:p-5 border-t border-white/10 bg-black/80 backdrop-blur-md z-10">
        <div className="max-w-7xl mx-auto flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400 px-1">
            <span className="font-race font-bold text-white flex items-center gap-2">
              <Camera className="w-4 h-4 text-orange-400" />
              MANDATORY CLOSE-UP REALISM PRESETS:
            </span>
            <span>Click any preset to inspect components at close distance</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {PRESETS.map((p) => {
              const isActive = activePreset === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => selectPreset(p.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isActive
                      ? 'bg-orange-500/20 border-orange-400 text-white shadow-[0_0_20px_rgba(249,115,22,0.35)] scale-[1.02]'
                      : 'bg-white/5 border-white/10 text-zinc-300 hover:border-white/30 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-race font-bold ${isActive ? 'text-orange-400' : 'text-white'}`}>
                      {p.label}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">{p.distance}</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400 truncate mt-1">
                    {p.sublabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
