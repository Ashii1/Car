import React, { useState } from 'react';
import { OpenCityBike, OpenCityBikeStats } from '../types/openCity';
import { calculateEffectiveStats } from '../data/openCityCatalog';

export interface RadarMetric {
  key: string;
  label: string;
  value: number; // 0 - 100
  displayValue: string;
  description: string;
}

export function getBikeRadarMetrics(bike: OpenCityBike, effectiveStats?: OpenCityBikeStats): RadarMetric[] {
  const stats = effectiveStats || calculateEffectiveStats(bike);
  const handling = stats.handlingCharacteristics || bike.handlingCharacteristics;

  // 1. Top Speed (normalized against 340 km/h)
  const speedRating = Math.min(100, Math.round((stats.topSpeed / 340) * 100));

  // 2. Accel Curve Rating (torque delivery & throttle punch)
  let curveBonus = 0;
  if (handling.accelerationCurve === 'Instant Electric') curveBonus = 12;
  else if (handling.accelerationCurve === 'Explosive Snap') curveBonus = 10;
  else if (handling.accelerationCurve === 'High-Rev Screamer') curveBonus = 8;
  else if (handling.accelerationCurve === 'Low-End Punch') curveBonus = 6;
  const accelRating = Math.min(100, Math.max(30, Math.round(stats.acceleration * 0.88 + curveBonus)));

  // 3. Turning Agility (tight turning radius: 2.0m = 98%, 4.2m = 48%)
  const agilityRating = Math.min(
    100,
    Math.max(32, Math.round(100 - (handling.turningRadius - 2.0) * 23.5))
  );

  // 4. Lean Angle (chassis apex clearance: 65° = 98%, 42° = 45%)
  const leanRating = Math.min(
    100,
    Math.max(30, Math.round(((handling.maxLeanAngle - 38) / (66 - 38)) * 68 + 32))
  );

  // 5. High-Speed Stability
  const stabilityRating = Math.min(100, Math.max(30, handling.highSpeedStability));

  // 6. Braking & Grip Control
  const brakeRating = Math.min(100, Math.max(30, Math.round(stats.braking * 0.55 + stats.grip * 0.45)));

  return [
    {
      key: 'speed',
      label: 'TOP SPEED',
      value: speedRating,
      displayValue: `${stats.topSpeed} KM/H`,
      description: 'Aerodynamic top speed on highways',
    },
    {
      key: 'accel',
      label: 'ACCEL CURVE',
      value: accelRating,
      displayValue: handling.accelerationCurve,
      description: `Torque profile: ${handling.accelerationCurve} (${handling.curveExponent}x curve)`,
    },
    {
      key: 'agility',
      label: 'AGILITY',
      value: agilityRating,
      displayValue: `${handling.turningRadius}m Turn Radius`,
      description: `Minimum turning radius: ${handling.turningRadius}m circle`,
    },
    {
      key: 'lean',
      label: 'LEAN ANGLE',
      value: leanRating,
      displayValue: `${handling.maxLeanAngle}° Max Lean`,
      description: `Chassis lean limit: ${handling.maxLeanAngle}° cornering angle`,
    },
    {
      key: 'stability',
      label: 'STABILITY',
      value: stabilityRating,
      displayValue: `${handling.highSpeedStability}% Stability`,
      description: 'High-speed directional stability & tracking',
    },
    {
      key: 'braking',
      label: 'BRAKE BITE',
      value: brakeRating,
      displayValue: `${stats.braking}% Control`,
      description: `Braking balance: ${handling.brakingBias}`,
    },
  ];
}

interface BikeRadarChartProps {
  bike: OpenCityBike;
  compareWithBike?: OpenCityBike | null;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  interactive?: boolean;
  className?: string;
}

export const BikeRadarChart: React.FC<BikeRadarChartProps> = ({
  bike,
  compareWithBike,
  size = 'md',
  showLabels = true,
  interactive = true,
  className = '',
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const metrics = getBikeRadarMetrics(bike);
  const compareMetrics = compareWithBike ? getBikeRadarMetrics(compareWithBike) : null;

  const config = {
    sm: { width: 170, height: 170, radius: 52, cx: 85, cy: 85, labelOffset: 16, fontSize: 8 },
    md: { width: 220, height: 220, radius: 72, cx: 110, cy: 110, labelOffset: 20, fontSize: 9 },
    lg: { width: 280, height: 280, radius: 95, cx: 140, cy: 140, labelOffset: 25, fontSize: 10 },
  }[size];

  const { width, height, radius, cx, cy, labelOffset, fontSize } = config;
  const numAxes = metrics.length;
  const angleStep = (Math.PI * 2) / numAxes;

  // Concentric polygon ring levels (20%, 40%, 60%, 80%, 100%)
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0];

  const getCoordinates = (index: number, normalizedValue: number, rOffset = 0) => {
    const angle = -Math.PI / 2 + index * angleStep;
    const r = radius * normalizedValue + rOffset;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  const getPolygonPoints = (metricList: RadarMetric[]) => {
    return metricList
      .map((m, idx) => {
        const norm = Math.max(0.12, Math.min(1.0, m.value / 100));
        const { x, y } = getCoordinates(idx, norm);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const candidatePoints = getPolygonPoints(metrics);
  const comparePoints = compareMetrics ? getPolygonPoints(compareMetrics) : null;

  const chartId = `radar-${bike.id}-${size}`;

  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        className="overflow-visible filter drop-shadow-[0_0_12px_rgba(16,185,129,0.15)]"
      >
        <defs>
          {/* Neon Gradient Fill for candidate bike */}
          <radialGradient id={`grad-${chartId}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.45" />
            <stop offset="65%" stopColor="#10b981" stopOpacity="0.30" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.15" />
          </radialGradient>
          {/* Comparison Ghost Fill */}
          <radialGradient id={`grad-compare-${chartId}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.05" />
          </radialGradient>
        </defs>

        {/* 1. Background Concentric Web Polygons */}
        {levels.map((lvl, lvlIdx) => {
          const ringPoints = Array.from({ length: numAxes })
            .map((_, i) => {
              const { x, y } = getCoordinates(i, lvl);
              return `${x.toFixed(1)},${y.toFixed(1)}`;
            })
            .join(' ');
          const isOuter = lvlIdx === levels.length - 1;

          return (
            <polygon
              key={`web-ring-${lvlIdx}`}
              points={ringPoints}
              fill={isOuter ? 'rgba(15, 23, 42, 0.45)' : 'none'}
              stroke={isOuter ? 'rgba(16, 185, 129, 0.35)' : 'rgba(255, 255, 255, 0.08)'}
              strokeWidth={isOuter ? '1.5' : '1'}
              strokeDasharray={isOuter ? 'none' : '3,3'}
            />
          );
        })}

        {/* 2. Radial Spoke Axes */}
        {Array.from({ length: numAxes }).map((_, i) => {
          const { x, y } = getCoordinates(i, 1.0);
          return (
            <line
              key={`spoke-${i}`}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke="rgba(255, 255, 255, 0.12)"
              strokeWidth="1"
            />
          );
        })}

        {/* 3. Comparison Ghost Polygon (Current Equipped Bike) */}
        {comparePoints && (
          <g className="transition-all duration-300">
            <polygon
              points={comparePoints}
              fill={`url(#grad-compare-${chartId})`}
              stroke="#f59e0b"
              strokeWidth="1.5"
              strokeDasharray="4,3"
              strokeOpacity="0.85"
            />
            {compareMetrics?.map((m, idx) => {
              const norm = Math.max(0.12, Math.min(1.0, m.value / 100));
              const { x, y } = getCoordinates(idx, norm);
              return (
                <circle
                  key={`cmp-dot-${idx}`}
                  cx={x}
                  cy={y}
                  r={size === 'sm' ? 2 : 2.5}
                  fill="#f59e0b"
                  stroke="#18181b"
                  strokeWidth="1"
                  opacity="0.8"
                />
              );
            })}
          </g>
        )}

        {/* 4. Candidate Bike Polygon */}
        <polygon
          points={candidatePoints}
          fill={`url(#grad-${chartId})`}
          stroke="#10b981"
          strokeWidth={size === 'sm' ? '1.8' : '2.4'}
          className="transition-all duration-300 filter drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
        />

        {/* 5. Data Point Vertices & Interactive Nodes */}
        {metrics.map((m, idx) => {
          const norm = Math.max(0.12, Math.min(1.0, m.value / 100));
          const { x, y } = getCoordinates(idx, norm);
          const isHovered = hoveredIdx === idx;

          return (
            <g
              key={`vertex-${idx}`}
              onMouseEnter={() => interactive && setHoveredIdx(idx)}
              onMouseLeave={() => interactive && setHoveredIdx(null)}
              className="cursor-pointer"
            >
              {/* Outer Pulsing Aura when hovered */}
              {isHovered && (
                <circle
                  cx={x}
                  cy={y}
                  r={size === 'sm' ? 6 : 8}
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="1.5"
                  className="animate-ping"
                />
              )}
              {/* Solid Point */}
              <circle
                cx={x}
                cy={y}
                r={isHovered ? 4.5 : size === 'sm' ? 2.5 : 3.5}
                fill="#34d399"
                stroke="#09090b"
                strokeWidth="1.5"
                className="transition-all duration-200"
              />
            </g>
          );
        })}

        {/* 6. Axis Labels */}
        {showLabels &&
          metrics.map((m, idx) => {
            const { x, y } = getCoordinates(idx, 1.0, labelOffset);
            const isHovered = hoveredIdx === idx;

            // Anchor alignment based on position
            let textAnchor: 'start' | 'middle' | 'end' = 'middle';
            if (Math.abs(x - cx) > 10) {
              textAnchor = x > cx ? 'start' : 'end';
            }

            return (
              <text
                key={`label-${idx}`}
                x={x}
                y={y + 3}
                textAnchor={textAnchor}
                fontSize={fontSize}
                className={`font-mono font-bold tracking-wider transition-colors duration-200 ${
                  isHovered ? 'fill-emerald-300' : 'fill-zinc-400'
                }`}
              >
                {m.label}
              </text>
            );
          })}
      </svg>

      {/* Interactive Tooltip Card */}
      {interactive && hoveredIdx !== null && (
        <div className="absolute -bottom-8 z-30 bg-black/90 border border-emerald-500/50 rounded-lg px-2.5 py-1 text-center shadow-xl backdrop-blur-md pointer-events-none whitespace-nowrap">
          <span className="font-race font-bold text-[10px] text-emerald-400 block">
            {metrics[hoveredIdx].label}: {metrics[hoveredIdx].displayValue}
          </span>
          <span className="font-mono text-[9px] text-zinc-300 block">
            {metrics[hoveredIdx].description}
          </span>
        </div>
      )}
    </div>
  );
};
