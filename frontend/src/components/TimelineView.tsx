import {
  Card,
  CardContent,
  Typography,
  Box,
} from '@mui/material';
import {
  LocationOn,
  Storefront,
  WhereToVote,
  LocalGasStation,
  Coffee,
  Bedtime,
  RestartAlt,
  FormatListBulleted,
  Schedule,
} from '@mui/icons-material';
import type { StopInfo } from '../types/trip';

interface TimelineViewProps {
  stops: StopInfo[];
}

export const TimelineView = ({ stops }: TimelineViewProps) => {
  if (!stops || stops.length === 0) return null;

  const getStopIcon = (type: string) => {
    switch (type) {
      case 'ORIGIN':
        return <LocationOn sx={{ color: '#22c55e' }} />;
      case 'PICKUP':
        return <Storefront sx={{ color: '#0284c7' }} />;
      case 'FUEL_STOP':
        return <LocalGasStation sx={{ color: '#f59e0b' }} />;
      case 'REST_BREAK':
        return <Coffee sx={{ color: '#a855f7' }} />;
      case 'SLEEPER_REST':
        return <Bedtime sx={{ color: '#6366f1' }} />;
      case 'CYCLE_RESTART':
        return <RestartAlt sx={{ color: '#ec4899' }} />;
      case 'DROPOFF':
        return <WhereToVote sx={{ color: '#ef4444' }} />;
      default:
        return <Schedule sx={{ color: '#38bdf8' }} />;
    }
  };

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'ORIGIN':
        return { bg: 'rgba(34, 197, 94, 0.15)', text: '#4ade80', border: '#22c55e' };
      case 'PICKUP':
        return { bg: 'rgba(2, 132, 199, 0.15)', text: '#38bdf8', border: '#0284c7' };
      case 'FUEL_STOP':
        return { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: '#f59e0b' };
      case 'REST_BREAK':
        return { bg: 'rgba(168, 85, 247, 0.15)', text: '#c084fc', border: '#a855f7' };
      case 'SLEEPER_REST':
        return { bg: 'rgba(99, 102, 241, 0.15)', text: '#818cf8', border: '#6366f1' };
      case 'CYCLE_RESTART':
        return { bg: 'rgba(236, 72, 153, 0.15)', text: '#f472b6', border: '#ec4899' };
      case 'DROPOFF':
        return { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', border: '#ef4444' };
      default:
        return { bg: 'rgba(56, 189, 248, 0.15)', text: '#38bdf8', border: '#0284c7' };
    }
  };

  return (
    <Card
      sx={{
        backgroundColor: '#0f172a',
        border: '1px solid #1e293b',
        borderRadius: 3,
        color: '#f8fafc',
        boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
        mt: 3,
      }}
    >
      <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
          <Box
            sx={{
              p: 0.8,
              borderRadius: 2,
              backgroundColor: 'rgba(37, 99, 235, 0.2)',
              color: '#60a5fa',
            }}
          >
            <FormatListBulleted sx={{ fontSize: 20 }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
            Trip Itinerary & Chronological Stops
          </Typography>
        </Box>

        <div className="space-y-3">
          {stops.map((stop, idx) => {
            const badge = getBadgeStyle(stop.stop_type);
            const arrival = new Date(stop.arrival_time).toLocaleString([], {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });
            const departure = new Date(stop.departure_time).toLocaleString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={`stop-card-${idx}`}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-colors gap-2"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center">
                    {getStopIcon(stop.stop_type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100 text-sm">{stop.title}</span>
                      <span
                        className="px-2 py-0.5 rounded text-[11px] font-semibold"
                        style={{
                          backgroundColor: badge.bg,
                          color: badge.text,
                          border: `1px solid ${badge.border}`,
                        }}
                      >
                        {stop.duty_status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                      <span>📍 {stop.location}</span>
                      <span className="text-slate-600">•</span>
                      <span>{stop.cumulative_miles.toFixed(1)} miles from origin</span>
                    </div>
                    <div className="text-xs text-slate-500 italic mt-0.5">{stop.remarks}</div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-end justify-between w-full sm:w-auto text-xs text-slate-400 gap-1 mt-1 sm:mt-0">
                  <div className="font-mono text-slate-300">
                    <strong>{arrival}</strong> {stop.duration_minutes > 0 ? `➔ ${departure}` : ''}
                  </div>
                  {stop.duration_minutes > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-cyan-400 font-mono text-[11px]">
                      ⏱️ {stop.duration_minutes} min ({stop.duration_hours.toFixed(1)}h)
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
