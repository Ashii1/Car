import React, { useRef, useEffect, useState } from 'react';
import { X, Navigation, Compass, MapPin, ZoomIn, ZoomOut, RotateCcw, Wrench, Shield, Flag, FastForward } from 'lucide-react';
import { CityMission, DistrictType } from '../types/openCity';

interface CityMapModalProps {
  playerX: number;
  playerZ: number;
  playerHeading: number;
  activeMission: CityMission | null;
  currentDistrict: DistrictType;
  onFastTravel: (x: number, z: number) => void;
  onClose: () => void;
}

export const CityMapModal: React.FC<CityMapModalProps> = ({
  playerX,
  playerZ,
  playerHeading,
  activeMission,
  currentDistrict,
  onFastTravel,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(0.8);
  const [waypoint, setWaypoint] = useState<{ x: number; z: number } | null>(null);

  const indianKeyLocations = [
    { name: 'Apna Tyre Works Garage', x: 33, z: -40, type: 'garage', color: '#10b981' },
    { name: 'Punjabi Highway King Dhaba', x: 38, z: -140, type: 'dhaba', color: '#f59e0b' },
    { name: 'Shakti Petrol Pump', x: 38, z: 160, type: 'fuel', color: '#ef4444' },
    { name: 'Old City Clock Tower Market', x: 320, z: -80, type: 'market', color: '#8b5cf6' },
    { name: 'Shivpur Village Square', x: -420, z: -380, type: 'village', color: '#84cc16' },
    { name: 'Industrial Logistics Hub', x: -190, z: 520, type: 'industrial', color: '#06b6d4' },
    { name: 'NH-48 Mountain Ghat Tunnel', x: 0, z: -880, type: 'tunnel', color: '#38bdf8' },
    { name: 'FASTag Highway Toll Plaza', x: 0, z: 860, type: 'toll', color: '#eab308' },
  ];

  // Map world scale: -950 to 950
  const worldRange = 950;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const toCanvasX = (worldX: number) => w / 2 + (worldX / worldRange) * (w / 2) * zoom;
    const toCanvasY = (worldZ: number) => h / 2 + (worldZ / worldRange) * (h / 2) * zoom;

    // 1. Natural Land Terrain Base
    ctx.fillStyle = '#141e17';
    ctx.fillRect(0, 0, w, h);

    // Distant Hills (North and West)
    ctx.fillStyle = '#1c2d22';
    ctx.beginPath();
    ctx.arc(toCanvasX(-500), toCanvasY(-500), 220 * zoom, 0, Math.PI * 2);
    ctx.fill();

    // 2. Rural Green Agricultural Zone
    ctx.fillStyle = 'rgba(74, 222, 128, 0.08)';
    ctx.beginPath();
    ctx.arc(toCanvasX(-380), toCanvasY(-380), 160 * zoom, 0, Math.PI * 2);
    ctx.fill();

    // 3. Cyber City / Market Zone
    ctx.fillStyle = 'rgba(6, 182, 212, 0.08)';
    ctx.fillRect(toCanvasX(80), toCanvasY(-200), 280 * zoom, 240 * zoom);

    // 4. Industrial Logistics Zone
    ctx.fillStyle = 'rgba(234, 179, 8, 0.08)';
    ctx.fillRect(toCanvasX(-360), toCanvasY(420), 280 * zoom, 180 * zoom);

    // =============================================================
    // DRAW CONNECTED INDIAN ROAD NETWORK
    // =============================================================
    // A. Main National Highway (NH-48) (Dual Carriageway - Yellow Center)
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 14 * zoom;
    ctx.beginPath();
    ctx.moveTo(toCanvasX(0), toCanvasY(-900));
    ctx.lineTo(toCanvasX(0), toCanvasY(900));
    ctx.stroke();

    ctx.strokeStyle = '#eab308'; // Center Highway line
    ctx.lineWidth = 2 * zoom;
    ctx.beginPath();
    ctx.moveTo(toCanvasX(0), toCanvasY(-880));
    ctx.lineTo(toCanvasX(0), toCanvasY(880));
    ctx.stroke();

    // B. Parallel Service Road (x = 24)
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 6 * zoom;
    ctx.beginPath();
    ctx.moveTo(toCanvasX(24), toCanvasY(-650));
    ctx.lineTo(toCanvasX(24), toCanvasY(650));
    ctx.stroke();

    // C. Slip Road Ramps connecting Highway to Service Road
    ctx.lineWidth = 4 * zoom;
    ctx.beginPath();
    ctx.moveTo(toCanvasX(0), toCanvasY(-220));
    ctx.lineTo(toCanvasX(24), toCanvasY(-200));
    ctx.moveTo(toCanvasX(0), toCanvasY(260));
    ctx.lineTo(toCanvasX(24), toCanvasY(280));
    ctx.stroke();

    // D. City Arterial Avenue (z = -80, x = 0 to 450)
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 9 * zoom;
    ctx.beginPath();
    ctx.moveTo(toCanvasX(0), toCanvasY(-80));
    ctx.lineTo(toCanvasX(450), toCanvasY(-80));
    ctx.stroke();

    // E. Old City Market Bazaar Street (x = 320, z = -350 to 180)
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 6 * zoom;
    ctx.beginPath();
    ctx.moveTo(toCanvasX(320), toCanvasY(-350));
    ctx.lineTo(toCanvasX(320), toCanvasY(180));
    ctx.stroke();

    // Clock Tower Roundabout at (320, -80)
    ctx.fillStyle = '#8b5cf6';
    ctx.beginPath();
    ctx.arc(toCanvasX(320), toCanvasY(-80), 8 * zoom, 0, Math.PI * 2);
    ctx.fill();

    // F. Rural Village Road (z = -380, x = 0 to -420)
    ctx.strokeStyle = '#78350f'; // Earthy rural road
    ctx.lineWidth = 5 * zoom;
    ctx.beginPath();
    ctx.moveTo(toCanvasX(0), toCanvasY(-380));
    ctx.lineTo(toCanvasX(-420), toCanvasY(-380));
    ctx.stroke();

    // Village Square Roundabout at (-420, -380)
    ctx.fillStyle = '#84cc16';
    ctx.beginPath();
    ctx.arc(toCanvasX(-420), toCanvasY(-380), 10 * zoom, 0, Math.PI * 2);
    ctx.fill();

    // G. Industrial Logistics Road (z = 520, x = 0 to -380)
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 8 * zoom;
    ctx.beginPath();
    ctx.moveTo(toCanvasX(0), toCanvasY(520));
    ctx.lineTo(toCanvasX(-380), toCanvasY(520));
    ctx.stroke();

    // H. Highway Flyover Overpass (Gold Line z = 120 to 480)
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 7 * zoom;
    ctx.beginPath();
    ctx.moveTo(toCanvasX(-7), toCanvasY(120));
    ctx.lineTo(toCanvasX(-7), toCanvasY(480));
    ctx.stroke();

    // =============================================================
    // 5. DISTRICT LABELS & ROAD NAMES
    // =============================================================
    ctx.font = `bold ${Math.round(11 * zoom)}px "Chakra Petch", sans-serif`;
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('NH-48 EXPRESS CORRIDOR', toCanvasX(6), toCanvasY(-400));
    ctx.fillText('CYBER CITY & MARKET', toCanvasX(120), toCanvasY(-95));
    ctx.fillText('SHIVPUR VILLAGE', toCanvasX(-390), toCanvasY(-395));
    ctx.fillText('LOGISTICS TERMINAL', toCanvasX(-320), toCanvasY(505));
    ctx.fillText('AIRPORT FLYOVER', toCanvasX(-22), toCanvasY(240));

    // =============================================================
    // 6. KEY POINTS OF INTEREST
    // =============================================================
    indianKeyLocations.forEach((loc) => {
      const lx = toCanvasX(loc.x);
      const ly = toCanvasY(loc.z);

      ctx.beginPath();
      ctx.arc(lx, ly, 6 * zoom, 0, Math.PI * 2);
      ctx.fillStyle = loc.color;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.font = `${Math.round(9 * zoom)}px "Chakra Petch", sans-serif`;
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(loc.name, lx + 8, ly + 3);
    });

    // =============================================================
    // 7. ACTIVE NAVIGATION ROUTE & WAYPOINT
    // =============================================================
    const navTarget = waypoint || (activeMission && activeMission.checkpoints.length > 0 ? activeMission.checkpoints[0] : null);

    if (navTarget) {
      const tx = toCanvasX(navTarget.x);
      const ty = toCanvasY(navTarget.z);
      const px = toCanvasX(playerX);
      const py = toCanvasY(playerZ);

      // Cyan Dashed Navigation Route Line
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.setLineDash([]); // Reset dash

      // Pulsing Waypoint Beacon
      ctx.beginPath();
      ctx.arc(tx, ty, 12 * zoom, 0, Math.PI * 2);
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(tx, ty, 5 * zoom, 0, Math.PI * 2);
      ctx.fillStyle = '#00f2fe';
      ctx.fill();
    }

    // =============================================================
    // 8. PLAYER LOCATION & HEADING ARROW
    // =============================================================
    const px = toCanvasX(playerX);
    const py = toCanvasY(playerZ);

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(playerHeading);

    ctx.beginPath();
    ctx.moveTo(0, -12 * zoom);
    ctx.lineTo(8 * zoom, 9 * zoom);
    ctx.lineTo(0, 5 * zoom);
    ctx.lineTo(-8 * zoom, 9 * zoom);
    ctx.closePath();
    ctx.fillStyle = '#ef4444'; // Red Hero Rider
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }, [playerX, playerZ, playerHeading, activeMission, waypoint, zoom]);

  // Handle map canvas click to set active custom waypoint
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const w = canvas.width;
    const h = canvas.height;

    const worldX = ((clickX - w / 2) / ((w / 2) * zoom)) * worldRange;
    const worldZ = ((clickY - h / 2) / ((h / 2) * zoom)) * worldRange;

    setWaypoint({ x: Math.round(worldX), z: Math.round(worldZ) });
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md select-none">
      <div className="max-w-4xl w-full h-[90vh] glass-panel p-5 rounded-3xl border border-white/20 shadow-2xl flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shadow-lg">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-race font-black text-2xl text-white">INDIAN ROAD NETWORK GPS</h2>
              <span className="text-xs font-mono text-cyan-300 uppercase">
                DISTRICT: {currentDistrict} • COORDS: ({Math.round(playerX)}m, {Math.round(playerZ)}m)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom((z) => Math.min(1.6, z + 0.2))}
              className="p-2 rounded-xl glass-panel border border-white/10 hover:border-cyan-400 text-zinc-300 hover:text-white transition-all cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(0.4, z - 0.2))}
              className="p-2 rounded-xl glass-panel border border-white/10 hover:border-cyan-400 text-zinc-300 hover:text-white transition-all cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl glass-panel border border-white/10 hover:border-orange-500 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Map Interactive Canvas */}
        <div className="relative flex-1 my-3 rounded-2xl overflow-hidden border border-white/10 bg-[#0a0e14]">
          <canvas
            ref={canvasRef}
            width={850}
            height={520}
            onClick={handleCanvasClick}
            className="w-full h-full cursor-crosshair"
          />

          {/* Quick Tip Overlay */}
          <div className="absolute bottom-3 left-3 glass-panel px-3 py-1.5 rounded-xl border border-white/10 text-[11px] font-mono text-zinc-400 bg-black/60 pointer-events-none">
            💡 Click anywhere to set a GPS Waypoint Route
          </div>

          {/* Waypoint Actions if set */}
          {waypoint && (
            <div className="absolute top-3 right-3 glass-panel px-4 py-2.5 rounded-2xl border border-cyan-400/50 bg-black/75 shadow-xl flex items-center gap-3">
              <div>
                <div className="text-[10px] font-mono text-cyan-400 uppercase font-bold">CUSTOM GPS WAYPOINT</div>
                <div className="text-xs font-mono text-white">
                  ({waypoint.x}m, {waypoint.z}m)
                </div>
              </div>
              <button
                onClick={() => {
                  onFastTravel(waypoint.x, waypoint.z);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-xl bg-cyan-500 text-black font-race font-bold text-xs flex items-center gap-1 active:scale-95 transition-all cursor-pointer shadow-lg"
              >
                <FastForward className="w-3.5 h-3.5" />
                TELEPORT
              </button>
              <button
                onClick={() => setWaypoint(null)}
                className="text-xs text-zinc-400 hover:text-white font-mono cursor-pointer"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Footer Quick Teleport Bar to Connected Indian Districts */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10 gap-2 overflow-x-auto">
          <div className="text-xs font-race uppercase text-zinc-400 shrink-0">KEY DESTINATIONS:</div>
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            {indianKeyLocations.map((loc) => (
              <button
                key={loc.name}
                onClick={() => {
                  onFastTravel(loc.x, loc.z);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-xl glass-panel border border-white/10 hover:border-cyan-400 text-zinc-300 hover:text-white font-mono text-xs shrink-0 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: loc.color }} />
                {loc.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
