import React, { useState, useEffect } from 'react';
import {
  X,
  Gauge,
  Timer,
  Milestone,
  Zap,
  TrendingUp,
  Flame,
  Award,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from 'recharts';
import {
  telemetryTracker,
  TelemetryPoint,
  LapRecord,
  TelemetrySummary,
} from '../game/TelemetryTracker';
import { soundEngine } from '../audio/SoundEngine';

interface PerformanceDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSpeedUnit?: 'kmh' | 'mph';
}

export const PerformanceDashboardModal: React.FC<PerformanceDashboardModalProps> = ({
  isOpen,
  onClose,
  currentSpeedUnit = 'kmh',
}) => {
  const [timeframe, setTimeframe] = useState<5 | 15 | 30>(30);
  const [dataPoints, setDataPoints] = useState<TelemetryPoint[]>([]);
  const [laps, setLaps] = useState<LapRecord[]>([]);
  const [summary, setSummary] = useState<TelemetrySummary>(telemetryTracker.getSummary());
  const [activeTab, setActiveTab] = useState<'overview' | 'speed' | 'laps' | 'distance'>('overview');

  // Poll live telemetry data every 1 second when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const refreshData = () => {
      setDataPoints(telemetryTracker.getPoints(timeframe));
      setLaps(telemetryTracker.getLaps());
      setSummary(telemetryTracker.getSummary());
    };

    refreshData();
    const interval = setInterval(refreshData, 1000);
    return () => clearInterval(interval);
  }, [isOpen, timeframe]);

  if (!isOpen) return null;

  const unitLabel = currentSpeedUnit.toUpperCase();
  const speedMultiplier = currentSpeedUnit === 'mph' ? 0.621371 : 1.0;

  // Format data for Recharts speed chart
  const speedChartData = dataPoints.map((p) => ({
    time: p.timeLabel.length > 5 ? p.timeLabel.slice(0, 5) : p.timeLabel,
    fullTime: p.timeLabel,
    speed: Math.round(p.speedKmh * speedMultiplier),
    topSpeed: Math.round(p.topSpeedKmh * speedMultiplier),
    gear: p.gear,
    rpm: p.rpm,
  }));

  // Format data for Recharts distance chart
  const distanceChartData = dataPoints.map((p) => ({
    time: p.timeLabel.length > 5 ? p.timeLabel.slice(0, 5) : p.timeLabel,
    fullTime: p.timeLabel,
    distance: Math.round(p.distanceKm * (currentSpeedUnit === 'mph' ? 0.621371 : 1.0) * 10) / 10,
    rate: Math.round(p.deltaDistanceMeters),
  }));

  // Format data for Recharts lap pace chart
  const lapChartData = laps.map((l) => ({
    lap: `Lap ${l.lapNumber}`,
    seconds: l.timeSec,
    timeFormatted: l.timeFormatted,
    topSpeed: Math.round(l.topSpeedKmh * speedMultiplier),
    avgSpeed: Math.round(l.avgSpeedKmh * speedMultiplier),
    isBest: l.isBestLap,
  }));

  const displayTopSpeed = Math.round(summary.topSpeed30m * speedMultiplier);
  const displayAvgSpeed = Math.round(summary.avgSpeed30m * speedMultiplier);
  const displayDistance = (summary.totalDistance30mKm * (currentSpeedUnit === 'mph' ? 0.621371 : 1.0)).toFixed(2);
  const distUnit = currentSpeedUnit === 'mph' ? 'MILES' : 'KM';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 select-none animate-in fade-in duration-150">
      <div className="max-w-5xl w-full bg-[#0a0e17] border border-white/15 rounded-3xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#0d131f]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shadow-lg">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-race font-black text-xl text-white tracking-wider">
                  REAL-TIME MOTORSPORT TELEMETRY
                </h2>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[10px] font-mono text-emerald-400 font-bold tracking-widest">
                  LIVE 30M
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
                <span>Speed Analytics</span>
                <span aria-hidden="true">·</span>
                <span>Lap Time Pace</span>
                <span aria-hidden="true">·</span>
                <span>Distance Accumulated</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Timeframe Selector Tabs */}
            <div className="flex items-center p-1 bg-black/60 rounded-xl border border-white/10">
              {([5, 15, 30] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    soundEngine.playUIClick();
                    setTimeframe(m);
                  }}
                  className={`px-3 py-1 text-xs font-mono font-bold rounded-lg transition-colors cursor-pointer ${
                    timeframe === m
                      ? 'bg-cyan-500 text-black shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {m} MIN
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                soundEngine.playUIClick();
                onClose();
              }}
              className="w-9 h-9 rounded-xl border border-white/15 bg-white/5 hover:border-cyan-400 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 4 Core Primary Telemetry KPI Banners */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 p-4 bg-[#080c14] border-b border-white/10">
          {/* KPI 1: TOP SPEED */}
          <div className="p-3.5 rounded-2xl bg-[#0e1422] border border-cyan-500/25 flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-wider">30M TOP SPEED</span>
              <Zap className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-race font-black text-2xl sm:text-3xl text-cyan-300">
                {displayTopSpeed}
              </span>
              <span className="text-[11px] font-race text-cyan-400/80 font-bold">
                {unitLabel}
              </span>
            </div>
            <div className="text-[10px] font-mono text-zinc-400 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-cyan-400" />
              <span>Avg: {displayAvgSpeed} {unitLabel}</span>
            </div>
          </div>

          {/* KPI 2: AVERAGE LAP TIME */}
          <div className="p-3.5 rounded-2xl bg-[#0e1422] border border-amber-500/25 flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-wider">AVERAGE LAP TIME</span>
              <Timer className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono-num font-black text-2xl sm:text-3xl text-amber-300">
                {summary.avgLapFormatted}
              </span>
            </div>
            <div className="text-[10px] font-mono text-zinc-400 mt-1">
              Across {summary.totalLaps} Circuit Laps
            </div>
          </div>

          {/* KPI 3: BEST LAP TIME */}
          <div className="p-3.5 rounded-2xl bg-[#0e1422] border border-emerald-500/25 flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-wider">PERSONAL BEST LAP</span>
              <Award className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono-num font-black text-2xl sm:text-3xl text-emerald-300">
                {summary.bestLapFormatted}
              </span>
            </div>
            <div className="text-[10px] font-mono text-emerald-400/90 mt-1 flex items-center gap-1">
              <Flame className="w-3 h-3 text-emerald-400" />
              <span>Peak Circuit Pace</span>
            </div>
          </div>

          {/* KPI 4: DISTANCE COVERED */}
          <div className="p-3.5 rounded-2xl bg-[#0e1422] border border-purple-500/25 flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-wider">DISTANCE (LAST 30M)</span>
              <Milestone className="w-4 h-4 text-purple-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-race font-black text-2xl sm:text-3xl text-purple-300">
                {displayDistance}
              </span>
              <span className="text-[11px] font-race text-purple-400/80 font-bold">
                {distUnit}
              </span>
            </div>
            <div className="text-[10px] font-mono text-zinc-400 mt-1">
              {summary.activeDurationMinutes} Mins Driving
            </div>
          </div>
        </div>

        {/* View Segmented Tabs */}
        <div className="flex items-center gap-2 px-5 py-2.5 bg-[#0a0e17] border-b border-white/10">
          <button
            onClick={() => {
              soundEngine.playUIClick();
              setActiveTab('overview');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-race font-bold transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-cyan-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white bg-white/5'
            }`}
          >
            ALL TELEMETRY
          </button>
          <button
            onClick={() => {
              soundEngine.playUIClick();
              setActiveTab('speed');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-race font-bold transition-all cursor-pointer ${
              activeTab === 'speed'
                ? 'bg-cyan-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white bg-white/5'
            }`}
          >
            TOP SPEEDS CURVE
          </button>
          <button
            onClick={() => {
              soundEngine.playUIClick();
              setActiveTab('laps');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-race font-bold transition-all cursor-pointer ${
              activeTab === 'laps'
                ? 'bg-cyan-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white bg-white/5'
            }`}
          >
            CIRCUIT LAP TIMES
          </button>
          <button
            onClick={() => {
              soundEngine.playUIClick();
              setActiveTab('distance');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-race font-bold transition-all cursor-pointer ${
              activeTab === 'distance'
                ? 'bg-cyan-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white bg-white/5'
            }`}
          >
            DISTANCE ACCUMULATION
          </button>
        </div>

        {/* Main Charts Area */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* CHART 1: TOP SPEEDS OVER 30 MINUTES */}
          {(activeTab === 'overview' || activeTab === 'speed') && (
            <div className="bg-[#0e1422] p-4 sm:p-5 rounded-2xl border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-race font-bold text-sm text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                    TOP SPEEDS & SPEED TELEMETRY TIMELINE ({timeframe} MINS)
                  </h3>
                  <span className="text-[11px] font-mono text-zinc-400">
                    Live velocity trace with rolling 30-minute top speed ceiling ({displayTopSpeed} {unitLabel})
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-cyan-400" />
                    <span className="text-zinc-300">Speed ({unitLabel})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-amber-400 border-dashed" />
                    <span className="text-zinc-300">Peak Top Speed</span>
                  </div>
                </div>
              </div>

              <div className="h-64 sm:h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={speedChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="speedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                    <XAxis
                      dataKey="time"
                      stroke="#6b7280"
                      tick={{ fill: '#9ca3af', fontSize: 11, fontFamily: 'monospace' }}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#6b7280"
                      tick={{ fill: '#9ca3af', fontSize: 11, fontFamily: 'monospace' }}
                      tickLine={false}
                      domain={[0, 'dataMax + 20']}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-[#0b0f19] border border-cyan-500/40 p-2.5 rounded-xl shadow-xl font-mono text-xs">
                              <div className="text-zinc-400 mb-1">{data.fullTime}</div>
                              <div className="text-cyan-300 font-bold text-sm">
                                {data.speed} {unitLabel}
                              </div>
                              <div className="text-zinc-300 text-[11px] mt-0.5">
                                Gear: <span className="text-white font-bold">{data.gear}</span> · RPM: <span className="text-white">{data.rpm}</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <ReferenceLine
                      y={displayTopSpeed}
                      stroke="#f59e0b"
                      strokeDasharray="4 4"
                      label={{
                        value: `TOP: ${displayTopSpeed} ${unitLabel}`,
                        fill: '#f59e0b',
                        fontSize: 10,
                        position: 'insideTopRight',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="speed"
                      stroke="#06b6d4"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#speedGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* CHART 2: CIRCUIT LAP TIMES & PACE BAR CHART */}
          {(activeTab === 'overview' || activeTab === 'laps') && (
            <div className="bg-[#0e1422] p-4 sm:p-5 rounded-2xl border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-race font-bold text-sm text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    CIRCUIT LAP TIMES & PACE SPLITS
                  </h3>
                  <span className="text-[11px] font-mono text-zinc-400">
                    Timed loops across the Highway & Central Boulevard circuit (Avg: {summary.avgLapFormatted})
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-emerald-400" />
                    <span className="text-zinc-300">Best Lap</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-amber-500" />
                    <span className="text-zinc-300">Standard Lap</span>
                  </div>
                </div>
              </div>

              <div className="h-60 sm:h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={lapChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                    <XAxis
                      dataKey="lap"
                      stroke="#6b7280"
                      tick={{ fill: '#9ca3af', fontSize: 11, fontFamily: 'monospace' }}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#6b7280"
                      tick={{ fill: '#9ca3af', fontSize: 11, fontFamily: 'monospace' }}
                      tickLine={false}
                      domain={[0, 'dataMax + 15']}
                      unit="s"
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-[#0b0f19] border border-amber-500/40 p-2.5 rounded-xl shadow-xl font-mono text-xs">
                              <div className="text-white font-bold mb-1 flex items-center justify-between gap-4">
                                <span>{data.lap}</span>
                                {data.isBest && (
                                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/40">
                                    BEST LAP
                                  </span>
                                )}
                              </div>
                              <div className="text-amber-300 font-bold text-sm">
                                {data.timeFormatted} ({data.seconds}s)
                              </div>
                              <div className="text-zinc-400 text-[11px] mt-1">
                                Top Speed: {data.topSpeed} {unitLabel} · Avg: {data.avgSpeed} {unitLabel}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <ReferenceLine
                      y={summary.avgLapTimeSec}
                      stroke="#9ca3af"
                      strokeDasharray="4 4"
                      label={{
                        value: `AVG: ${summary.avgLapFormatted}`,
                        fill: '#9ca3af',
                        fontSize: 10,
                        position: 'insideTopLeft',
                      }}
                    />
                    <Bar dataKey="seconds" radius={[6, 6, 0, 0]}>
                      {lapChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.isBest ? '#10b981' : '#f59e0b'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* CHART 3: CUMULATIVE DISTANCE COVERED */}
          {(activeTab === 'overview' || activeTab === 'distance') && (
            <div className="bg-[#0e1422] p-4 sm:p-5 rounded-2xl border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-race font-bold text-sm text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                    DISTANCE COVERED OVER 30 MINUTES
                  </h3>
                  <span className="text-[11px] font-mono text-zinc-400">
                    Cumulative odometer progress tracking ({displayDistance} {distUnit} total)
                  </span>
                </div>
                <div className="text-xs font-mono text-purple-300 font-bold">
                  +{displayDistance} {distUnit}
                </div>
              </div>

              <div className="h-60 sm:h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={distanceChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="distGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                    <XAxis
                      dataKey="time"
                      stroke="#6b7280"
                      tick={{ fill: '#9ca3af', fontSize: 11, fontFamily: 'monospace' }}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#6b7280"
                      tick={{ fill: '#9ca3af', fontSize: 11, fontFamily: 'monospace' }}
                      tickLine={false}
                      unit={` ${distUnit.toLowerCase()}`}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-[#0b0f19] border border-purple-500/40 p-2.5 rounded-xl shadow-xl font-mono text-xs">
                              <div className="text-zinc-400 mb-1">{data.fullTime}</div>
                              <div className="text-purple-300 font-bold text-sm">
                                {data.distance} {distUnit}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="distance"
                      stroke="#a855f7"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#distGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-white/10 bg-[#0d131f] flex items-center justify-between text-xs font-mono text-zinc-400">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            <span>Telemetry streams live every second from physical vehicle sensors.</span>
          </div>
          <button
            onClick={() => {
              soundEngine.playUIClick();
              onClose();
            }}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-race font-bold cursor-pointer transition-all active:scale-95"
          >
            RESUME DRIVING [ESC]
          </button>
        </div>
      </div>
    </div>
  );
};
