import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  X,
  Aperture,
  Sliders,
  RotateCcw,
  Download,
  Eye,
  EyeOff,
  Sun,
  Palette,
  Sparkles,
  Maximize2,
  Film,
  ZoomIn,
} from 'lucide-react';
import { cityAudio } from '../audio/CityAudioEngine';

interface PhotoModeModalProps {
  onUpdateCamera: (params: {
    orbitAngle: number;
    pitchAngle: number;
    distance: number;
    height: number;
    fov: number;
    roll: number;
  }) => void;
  onCaptureScreenshot: () => string;
  onClose: () => void;
}

type PhotoFilter = 'none' | 'cinematic' | 'cyberpunk' | 'noir' | 'vintage' | 'dramatic';

export const PhotoModeModal: React.FC<PhotoModeModalProps> = ({
  onUpdateCamera,
  onCaptureScreenshot,
  onClose,
}) => {
  // Camera adjustment states
  const [orbitAngle, setOrbitAngle] = useState(0); // Horizontal rotation in radians
  const [pitchAngle, setPitchAngle] = useState(0.2); // Vertical angle in radians
  const [distance, setDistance] = useState(4.2); // Zoom distance in meters (1.5 to 12.0)
  const [height, setHeight] = useState(0.85); // Camera target height offset (0.2 to 2.5)
  const [fov, setFov] = useState(55); // Field of View (28 to 85)
  const [roll, setRoll] = useState(0); // Dutch angle / roll in radians (-0.6 to 0.6)

  // Depth of field & filters
  const [dofBlur, setDofBlur] = useState<number>(6); // 0 (off) to 16px blur
  const [dofFocusRadius, setDofFocusRadius] = useState<number>(35); // Percentage of sharp center (15% to 65%)
  const [activeFilter, setActiveFilter] = useState<PhotoFilter>('cinematic');

  // UI state
  const [hideUI, setHideUI] = useState(false);
  const [activeTab, setActiveTab] = useState<'camera' | 'dof' | 'filters'>('camera');
  const [isShutterFlashing, setIsShutterFlashing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // Drag interaction to orbit camera
  const isDragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });

  const onUpdateCameraRef = useRef(onUpdateCamera);
  onUpdateCameraRef.current = onUpdateCamera;

  useEffect(() => {
    onUpdateCameraRef.current({
      orbitAngle,
      pitchAngle,
      distance,
      height,
      fov,
      roll,
    });
  }, [orbitAngle, pitchAngle, distance, height, fov, roll]);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    lastPointer.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastPointer.current.x;
    const dy = e.clientY - lastPointer.current.y;
    lastPointer.current = { x: e.clientX, y: e.clientY };

    setOrbitAngle((prev) => prev - dx * 0.008);
    setPitchAngle((prev) => Math.max(-0.25, Math.min(0.85, prev - dy * 0.006)));
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    setDistance((prev) => Math.max(1.6, Math.min(12.0, prev + e.deltaY * 0.004)));
  };

  const handleCapture = () => {
    // Camera shutter sound & flash
    cityAudio.playStuntChime();
    setIsShutterFlashing(true);
    setTimeout(() => setIsShutterFlashing(false), 200);

    const dataUrl = onCaptureScreenshot();
    setCapturedImage(dataUrl);

    // Auto trigger file download
    const link = document.createElement('a');
    link.download = `Street_Riders_Photo_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  const resetCamera = () => {
    setOrbitAngle(0);
    setPitchAngle(0.2);
    setDistance(4.2);
    setHeight(0.85);
    setFov(55);
    setRoll(0);
    setDofBlur(6);
    setActiveFilter('cinematic');
  };

  // Filter style mapping
  const filterStyles: Record<PhotoFilter, string> = {
    none: 'none',
    cinematic: 'contrast(1.15) saturate(1.25) sepia(0.12)',
    cyberpunk: 'contrast(1.2) saturate(1.4) hue-rotate(180deg) brightness(1.05)',
    noir: 'grayscale(1) contrast(1.4) brightness(0.95)',
    vintage: 'sepia(0.35) contrast(1.1) brightness(0.95) saturate(0.85)',
    dramatic: 'contrast(1.4) saturate(1.3) brightness(0.9)',
  };

  return (
    <div
      className="absolute inset-0 z-50 select-none overflow-hidden touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
    >
      {/* 1. Camera Shutter Flash Animation */}
      {isShutterFlashing && (
        <div className="absolute inset-0 bg-white z-[60] pointer-events-none animate-out fade-out duration-300" />
      )}

      {/* 2. Realistic Depth of Field Overlay (Aperture Focus Mask & Background Blur) */}
      {dofBlur > 0 && (
        <div
          className="absolute inset-0 pointer-events-none transition-all duration-150"
          style={{
            backdropFilter: `blur(${dofBlur}px)`,
            WebkitBackdropFilter: `blur(${dofBlur}px)`,
            maskImage: `radial-gradient(circle at center, transparent ${dofFocusRadius}%, black 85%)`,
            WebkitMaskImage: `radial-gradient(circle at center, transparent ${dofFocusRadius}%, black 85%)`,
          }}
        />
      )}

      {/* 3. Photographic Color Filter Overlay */}
      {activeFilter !== 'none' && (
        <div
          className="absolute inset-0 pointer-events-none transition-all duration-200"
          style={{
            backdropFilter: filterStyles[activeFilter],
            WebkitBackdropFilter: filterStyles[activeFilter],
          }}
        />
      )}

      {/* 4. Film Grain / Cinematic Aspect Ratio Letterbox (Optional aesthetic) */}
      <div className="absolute inset-x-0 top-0 h-4 md:h-6 bg-black/60 pointer-events-none z-30" />
      <div className="absolute inset-x-0 bottom-0 h-4 md:h-6 bg-black/60 pointer-events-none z-30" />

      {/* 5. Minimal Viewfinder Corner Marks */}
      <div className="absolute inset-6 md:inset-10 border border-white/20 pointer-events-none z-20">
        <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-white/80" />
        <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-white/80" />
        <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-white/80" />
        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-white/80" />

        {/* Center crosshair */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 border border-white/20 rounded-full flex items-center justify-center">
          <div className="w-1 h-1 bg-white/60 rounded-full" />
        </div>
      </div>

      {/* 6. Tap Anywhere to Reveal UI if hidden */}
      {hideUI && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setHideUI(false);
          }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 glass-panel px-5 py-2.5 rounded-2xl border border-white/20 text-white font-race font-bold text-xs uppercase flex items-center gap-2 active:scale-95 shadow-2xl cursor-pointer"
        >
          <Eye className="w-4 h-4 text-cyan-400" /> TAP TO SHOW CONTROLS
        </button>
      )}

      {/* 7. Photo Mode Controls UI Overlay */}
      {!hideUI && (
        <div className="absolute inset-0 p-4 md:p-8 flex flex-col justify-between pointer-events-none z-40">
          {/* Top Bar: Title, Viewfinder Mode, Shutter Button, and Close */}
          <div className="flex items-center justify-between w-full pointer-events-auto">
            <div className="flex items-center gap-3">
              <div className="glass-panel px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-2.5 shadow-2xl">
                <Camera className="w-5 h-5 text-orange-400" />
                <div>
                  <h2 className="font-race font-black text-sm md:text-base text-white">PRO PHOTO STUDIO</h2>
                  <div className="text-[9px] font-mono text-zinc-400">DEPTH OF FIELD • 360° ORBIT CAMERA</div>
                </div>
              </div>
            </div>

            {/* Top Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setHideUI(true)}
                className="glass-panel px-3.5 py-2.5 rounded-2xl border border-white/10 hover:border-cyan-400 text-zinc-300 hover:text-white flex items-center gap-1.5 text-xs font-race font-bold transition-all shadow-xl cursor-pointer"
                title="Hide All UI for clean view"
              >
                <EyeOff className="w-4 h-4 text-cyan-400" />
                <span className="hidden sm:inline">VIEWFINDER</span>
              </button>

              <button
                onClick={resetCamera}
                className="glass-panel p-2.5 rounded-2xl border border-white/10 text-zinc-400 hover:text-white transition-all shadow-xl cursor-pointer"
                title="Reset Camera Angle"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              <button
                onClick={onClose}
                className="glass-panel p-2.5 rounded-2xl border border-white/10 hover:border-red-500 text-zinc-400 hover:text-white transition-all shadow-xl cursor-pointer"
                title="Exit Photo Mode"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Bottom Control Drawer: Camera Sliders, DoF & Shutter Button */}
          <div className="flex flex-col md:flex-row items-end justify-between w-full gap-4 pointer-events-auto">
            {/* Left Drawer: Adjustments Card */}
            <div className="glass-panel p-4 md:p-5 rounded-3xl border border-white/15 shadow-2xl max-w-md w-full flex flex-col gap-3">
              {/* Category Tabs */}
              <div className="flex gap-1.5 border-b border-white/10 pb-2.5">
                <button
                  onClick={() => setActiveTab('camera')}
                  className={`flex-1 py-1.5 rounded-xl font-race font-bold text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    activeTab === 'camera' ? 'bg-orange-500 text-white shadow-md' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" /> LENS & ZOOM
                </button>

                <button
                  onClick={() => setActiveTab('dof')}
                  className={`flex-1 py-1.5 rounded-xl font-race font-bold text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    activeTab === 'dof' ? 'bg-orange-500 text-white shadow-md' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Aperture className="w-3.5 h-3.5" /> DEPTH OF FIELD
                </button>

                <button
                  onClick={() => setActiveTab('filters')}
                  className={`flex-1 py-1.5 rounded-xl font-race font-bold text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    activeTab === 'filters' ? 'bg-orange-500 text-white shadow-md' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" /> COLOR GRADING
                </button>
              </div>

              {/* Tab 1: Lens, Distance, Pitch, Roll */}
              {activeTab === 'camera' && (
                <div className="space-y-2.5 text-xs font-mono">
                  {/* Distance / Zoom */}
                  <div>
                    <div className="flex justify-between text-zinc-300 mb-1">
                      <span>Camera Distance (Zoom)</span>
                      <span className="text-white font-bold">{distance.toFixed(1)}m</span>
                    </div>
                    <input
                      type="range"
                      min="1.6"
                      max="12.0"
                      step="0.1"
                      value={distance}
                      onChange={(e) => setDistance(parseFloat(e.target.value))}
                      className="w-full accent-orange-500 cursor-pointer"
                    />
                  </div>

                  {/* Focal Length (FOV) */}
                  <div>
                    <div className="flex justify-between text-zinc-300 mb-1">
                      <span>Focal Length (FOV)</span>
                      <span className="text-white font-bold">{fov}°</span>
                    </div>
                    <input
                      type="range"
                      min="28"
                      max="85"
                      step="1"
                      value={fov}
                      onChange={(e) => setFov(parseInt(e.target.value))}
                      className="w-full accent-orange-500 cursor-pointer"
                    />
                  </div>

                  {/* Camera Height */}
                  <div>
                    <div className="flex justify-between text-zinc-300 mb-1">
                      <span>Elevation Angle / Height</span>
                      <span className="text-white font-bold">{height.toFixed(1)}m</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="2.5"
                      step="0.05"
                      value={height}
                      onChange={(e) => setHeight(parseFloat(e.target.value))}
                      className="w-full accent-orange-500 cursor-pointer"
                    />
                  </div>

                  {/* Roll / Dutch Tilt */}
                  <div>
                    <div className="flex justify-between text-zinc-300 mb-1">
                      <span>Dutch Angle Tilt (Roll)</span>
                      <span className="text-white font-bold">{Math.round((roll * 180) / Math.PI)}°</span>
                    </div>
                    <input
                      type="range"
                      min="-0.55"
                      max="0.55"
                      step="0.02"
                      value={roll}
                      onChange={(e) => setRoll(parseFloat(e.target.value))}
                      className="w-full accent-orange-500 cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* Tab 2: Depth of Field (Aperture blur & focus distance) */}
              {activeTab === 'dof' && (
                <div className="space-y-3 text-xs font-mono">
                  {/* Aperture Blur Radius */}
                  <div>
                    <div className="flex justify-between text-zinc-300 mb-1">
                      <span>Aperture Bokeh / Background Blur</span>
                      <span className="text-cyan-400 font-bold">{dofBlur === 0 ? 'OFF' : `${dofBlur}px Blur`}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="16"
                      step="1"
                      value={dofBlur}
                      onChange={(e) => setDofBlur(parseInt(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>

                  {/* Sharp Focus Zone */}
                  <div>
                    <div className="flex justify-between text-zinc-300 mb-1">
                      <span>Subject Focus Radius</span>
                      <span className="text-cyan-400 font-bold">{dofFocusRadius}%</span>
                    </div>
                    <input
                      type="range"
                      min="15"
                      max="65"
                      step="5"
                      value={dofFocusRadius}
                      onChange={(e) => setDofFocusRadius(parseInt(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>

                  {/* Quick Aperture Presets */}
                  <div>
                    <span className="text-[10px] text-zinc-400 block mb-1.5">APERTURE PRESETS</span>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: 'f/1.4 Soft', blur: 12 },
                        { label: 'f/2.8 Pro', blur: 6 },
                        { label: 'f/5.6 Mid', blur: 3 },
                        { label: 'f/16 Sharp', blur: 0 },
                      ].map((p) => (
                        <button
                          key={p.label}
                          onClick={() => setDofBlur(p.blur)}
                          className={`py-1.5 rounded-lg border text-[10px] font-bold cursor-pointer transition-all ${
                            dofBlur === p.blur ? 'border-cyan-400 bg-cyan-950/40 text-cyan-400' : 'border-white/10 text-zinc-400'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Color Grading Filters */}
              {activeTab === 'filters' && (
                <div className="space-y-2 text-xs font-mono">
                  <span className="text-[10px] text-zinc-400 block mb-1">COLOR GRADING PRESETS</span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'none' as const, label: 'Natural Raw' },
                      { id: 'cinematic' as const, label: 'Golden Hour' },
                      { id: 'cyberpunk' as const, label: 'Cyberpunk' },
                      { id: 'noir' as const, label: 'B&W Noir' },
                      { id: 'vintage' as const, label: 'Vintage 35mm' },
                      { id: 'dramatic' as const, label: 'Action Drama' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setActiveFilter(f.id)}
                        className={`py-2 px-2.5 rounded-xl border text-[10px] font-race font-bold uppercase transition-all cursor-pointer ${
                          activeFilter === f.id
                            ? 'border-orange-500 bg-orange-500/20 text-white shadow-md'
                            : 'border-white/10 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-[10px] text-zinc-500 text-center pt-1 border-t border-white/10">
                Drag on screen to orbit 360° around bike • Scroll to zoom
              </div>
            </div>

            {/* Right Side: Big Shutter Capture Button */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={handleCapture}
                className="w-20 h-20 rounded-full bg-gradient-to-tr from-orange-500 via-amber-400 to-white text-black font-race font-black text-xs uppercase flex flex-col items-center justify-center shadow-[0_0_40px_rgba(249,115,22,0.6)] active:scale-95 hover:scale-105 transition-all cursor-pointer border-4 border-white/80"
                title="Capture & Save Screenshot"
              >
                <Camera className="w-7 h-7 mb-0.5 fill-black" />
                SNAP
              </button>
              <span className="text-[10px] font-mono text-zinc-300 uppercase tracking-widest">
                TAKE PHOTO
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
