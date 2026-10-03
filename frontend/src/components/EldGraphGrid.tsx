import { useState } from 'react';
import { Box } from '@mui/material';
import type { LogSegment, LogRemark } from '../types/trip';

interface EldGraphGridProps {
  segments: LogSegment[];
  remarks: LogRemark[];
}

const ROW_NAMES = [
  '1. Off Duty',
  '2. Sleeper Berth',
  '3. Driving',
  '4. On Duty (Not Driving)',
];

const ROW_Y_CENTERS = [30, 70, 110, 150]; // Y coordinate for horizontal lines in SVG

export const EldGraphGrid = ({ segments, remarks }: EldGraphGridProps) => {
  const [hoveredSegment, setHoveredSegment] = useState<LogSegment | null>(null);

  // SVG dimensions
  const svgWidth = 960;
  const svgHeight = 260;
  const gridLeft = 140; // Left margin for row labels
  const gridRight = 920; // Right margin where 24:00 ends
  const gridWidth = gridRight - gridLeft;
  const gridTop = 15;
  const gridBottom = 165;
  const rowHeight = 40;

  // Convert hour (0.0 to 24.0) to X pixel coordinate
  const hourToX = (hour: number) => {
    return gridLeft + (Math.max(0, Math.min(24, hour)) / 24.0) * gridWidth;
  };

  // Status index to Y center
  const statusToY = (status: number) => {
    const idx = Math.max(1, Math.min(4, status)) - 1;
    return ROW_Y_CENTERS[idx];
  };

  // Generate SVG path for the continuous status duty line
  const generateDutyPath = () => {
    if (!segments || segments.length === 0) return '';

    let d = '';
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const startX = hourToX(seg.start_hour);
      const endX = hourToX(seg.end_hour);
      const currentY = statusToY(seg.duty_status);

      if (i === 0) {
        d += `M ${startX.toFixed(1)} ${currentY}`;
      } else {
        const prevSeg = segments[i - 1];
        const prevY = statusToY(prevSeg.duty_status);
        if (prevY !== currentY) {
          // Vertical transition line
          d += ` V ${currentY}`;
        }
      }
      // Horizontal duty line
      d += ` H ${endX.toFixed(1)}`;
    }
    return d;
  };

  return (
    <Box sx={{ width: '100%', overflowX: 'auto', py: 1 }}>
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{ width: '100%', minWidth: '850px', height: 'auto', display: 'block' }}
        className="font-mono select-none"
      >
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#2563eb" floodOpacity="0.6" />
          </filter>
        </defs>

        {/* Outer Background / Container */}
        <rect x="0" y="0" width={svgWidth} height={svgHeight} fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />

        {/* Header Black Bar for Hour Numbers */}
        <rect x={gridLeft} y={gridTop - 12} width={gridWidth} height="12" fill="#0f172a" />

        {/* 24 Hour Numbers on Top */}
        {Array.from({ length: 25 }).map((_, h) => {
          const x = hourToX(h);
          let label = `${h}`;
          if (h === 0) label = 'Mid-night';
          else if (h === 12) label = 'Noon';
          else if (h === 24) label = 'Mid-night';
          else if (h > 12) label = `${h - 12}`;

          return (
            <text
              key={`hour-num-${h}`}
              x={x}
              y={gridTop - 3}
              textAnchor="middle"
              fill="#ffffff"
              fontSize={h === 0 || h === 12 || h === 24 ? '7.5' : '8.5'}
              fontWeight="bold"
            >
              {label}
            </text>
          );
        })}

        {/* Row Labels (Left Side) */}
        {ROW_NAMES.map((name, idx) => (
          <g key={`row-label-${idx}`}>
            <rect
              x="5"
              y={gridTop + idx * rowHeight}
              width={gridLeft - 10}
              height={rowHeight}
              fill={idx % 2 === 0 ? '#f8fafc' : '#ffffff'}
              stroke="#e2e8f0"
              strokeWidth="0.5"
            />
            <text
              x="12"
              y={ROW_Y_CENTERS[idx] + 4}
              fontSize="10"
              fontWeight="700"
              fill="#1e293b"
              fontFamily="sans-serif"
            >
              {name}
            </text>
          </g>
        ))}

        {/* Background 4-Row Grid */}
        {Array.from({ length: 4 }).map((_, r) => {
          const y = gridTop + r * rowHeight;
          return (
            <rect
              key={`row-rect-${r}`}
              x={gridLeft}
              y={y}
              width={gridWidth}
              height={rowHeight}
              fill={r % 2 === 0 ? '#fcfcfd' : '#ffffff'}
              stroke="#64748b"
              strokeWidth="0.75"
            />
          );
        })}

        {/* Subdivisions: Hour, Half-Hour, Quarter-Hour Ticks */}
        {Array.from({ length: 24 }).map((_, h) => {
          const xHour = hourToX(h);
          const x15 = hourToX(h + 0.25);
          const x30 = hourToX(h + 0.5);
          const x45 = hourToX(h + 0.75);

          return (
            <g key={`ticks-${h}`}>
              {/* Major Hour Line across all 4 rows */}
              <line
                x1={xHour}
                y1={gridTop}
                x2={xHour}
                y2={gridBottom}
                stroke="#64748b"
                strokeWidth={h === 0 || h === 12 || h === 24 ? '1.5' : '0.8'}
              />

              {/* Sub-ticks inside each of the 4 rows */}
              {Array.from({ length: 4 }).map((_, r) => {
                const rowY = gridTop + r * rowHeight;
                return (
                  <g key={`row-${r}-ticks-${h}`}>
                    {/* 15-min tick */}
                    <line x1={x15} y1={rowY} x2={x15} y2={rowY + 7} stroke="#94a3b8" strokeWidth="0.5" />
                    <line x1={x15} y1={rowY + rowHeight - 7} x2={x15} y2={rowY + rowHeight} stroke="#94a3b8" strokeWidth="0.5" />

                    {/* 30-min tick (medium) */}
                    <line x1={x30} y1={rowY} x2={x30} y2={rowY + 12} stroke="#64748b" strokeWidth="0.65" />
                    <line x1={x30} y1={rowY + rowHeight - 12} x2={x30} y2={rowY + rowHeight} stroke="#64748b" strokeWidth="0.65" />

                    {/* 45-min tick */}
                    <line x1={x45} y1={rowY} x2={x45} y2={rowY + 7} stroke="#94a3b8" strokeWidth="0.5" />
                    <line x1={x45} y1={rowY + rowHeight - 7} x2={x45} y2={rowY + rowHeight} stroke="#94a3b8" strokeWidth="0.5" />
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* 24:00 Closing Vertical Line */}
        <line x1={gridRight} y1={gridTop} x2={gridRight} y2={gridBottom} stroke="#64748b" strokeWidth="1.5" />

        {/* Remarks Header Bar & Ticks */}
        <rect x="5" y={gridBottom + 5} width={svgWidth - 10} height="16" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="0.8" />
        <text x="15" y={gridBottom + 17} fontSize="10" fontWeight="bold" fill="#0f172a" fontFamily="sans-serif">
          REMARKS (Location of Duty Status Change)
        </text>

        {/* Remarks Hour Ticks Bar */}
        {Array.from({ length: 25 }).map((_, h) => {
          const x = hourToX(h);
          return (
            <g key={`remarks-tick-${h}`}>
              <line x1={x} y1={gridBottom + 5} x2={x} y2={gridBottom + 21} stroke="#94a3b8" strokeWidth="0.5" />
              <text x={x} y={gridBottom + 17} textAnchor="middle" fontSize="6.5" fill="#475569">
                {h === 0 || h === 24 ? 'M' : h === 12 ? 'N' : h > 12 ? h - 12 : h}
              </text>
            </g>
          );
        })}

        {/* DRAWN DUTY STATUS PATH */}
        <path
          d={generateDutyPath()}
          fill="none"
          stroke="#1d4ed8"
          strokeWidth="3.5"
          strokeLinecap="square"
          strokeLinejoin="miter"
          filter="url(#glow)"
        />

        {/* Interactive Hover Segment Rectangles */}
        {segments.map((seg, idx) => {
          const startX = hourToX(seg.start_hour);
          const endX = hourToX(seg.end_hour);
          const width = Math.max(2, endX - startX);
          const y = gridTop + (seg.duty_status - 1) * rowHeight;

          return (
            <rect
              key={`interactive-seg-${idx}`}
              x={startX}
              y={y}
              width={width}
              height={rowHeight}
              fill="rgba(37, 99, 235, 0.08)"
              stroke="transparent"
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoveredSegment(seg)}
              onMouseLeave={() => setHoveredSegment(null)}
            />
          );
        })}

        {/* REMARKS TEXT LABELS */}
        {remarks.map((rem, idx) => {
          const x = hourToX(rem.hour_fraction);
          const yStart = gridBottom + 21;
          const yText = yStart + 22 + (idx % 3) * 16;

          return (
            <g key={`remark-draw-${idx}`}>
              <line
                x1={x}
                y1={yStart}
                x2={x}
                y2={yText - 6}
                stroke="#0284c7"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
              <circle cx={x} cy={yStart + 2} r="2.5" fill="#0284c7" />
              <text
                x={x}
                y={yText}
                fontSize="8.5"
                fontWeight="bold"
                fill="#0369a1"
                fontFamily="sans-serif"
                transform={`rotate(-25, ${x}, ${yText})`}
              >
                {rem.location}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Hover Info Tooltip */}
      {hoveredSegment && (
        <Box
          sx={{
            mt: 1,
            p: 1.2,
            backgroundColor: '#0f172a',
            color: '#f8fafc',
            borderRadius: 1.5,
            border: '1px solid #3b82f6',
            fontSize: '0.8rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>
            <strong>{hoveredSegment.duty_name}</strong>: {hoveredSegment.activity} at <em>{hoveredSegment.location}</em>
          </span>
          <span className="text-cyan-400 font-mono">
            {hoveredSegment.start_hour.toFixed(2)}h - {hoveredSegment.end_hour.toFixed(2)}h ({hoveredSegment.duration_hours.toFixed(2)} hrs)
          </span>
        </Box>
      )}
    </Box>
  );
};
