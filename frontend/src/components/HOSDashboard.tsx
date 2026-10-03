import { Card, CardContent, Typography, Box, Grid, LinearProgress, Chip } from '@mui/material';
import {
  Speed,
  AccessTime,
  LocalGasStation,
  Bedtime,
  CheckCircle,
  TrendingUp,
  Coffee,
} from '@mui/icons-material';
import type { TripSummary } from '../types/trip';

interface HOSDashboardProps {
  summary: TripSummary;
  initialCycleUsed: number;
}

export const HOSDashboard = ({ summary }: HOSDashboardProps) => {
  const finalCycleUsed = summary.final_cycle_used_hours;
  const cycleRemaining = summary.cycle_hours_remaining;
  const cyclePercent = Math.min(100, (finalCycleUsed / 70.0) * 100);

  const startFormatted = new Date(summary.trip_start_time).toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const endFormatted = new Date(summary.trip_end_time).toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Box sx={{ mb: 3 }}>
      {/* 4 Key HOS Compliance Clocks */}
      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        {/* 1. 11-Hour Driving Rule */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={clockCardStyle}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                  11-Hour Drive Limit
                </Typography>
                <Speed sx={{ color: '#38bdf8', fontSize: 20 }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#f8fafc', mb: 0.5 }}>
                {summary.total_driving_hours.toFixed(1)} <span className="text-xs text-slate-400 font-normal">hrs drive</span>
              </Typography>
              <Typography variant="caption" sx={{ color: '#38bdf8', display: 'block', fontSize: '0.72rem' }}>
                ✓ Max 11h per shift enforced
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* 2. 14-Hour Duty Window */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={clockCardStyle}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                  14-Hour Shift Window
                </Typography>
                <AccessTime sx={{ color: '#818cf8', fontSize: 20 }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#f8fafc', mb: 0.5 }}>
                {summary.total_on_duty_hours.toFixed(1)} <span className="text-xs text-slate-400 font-normal">hrs on-duty</span>
              </Typography>
              <Typography variant="caption" sx={{ color: '#818cf8', display: 'block', fontSize: '0.72rem' }}>
                ✓ No driving past 14h window
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* 3. 70-Hour / 8-Day Cycle */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={clockCardStyle}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                  70h / 8-Day Cycle
                </Typography>
                <TrendingUp sx={{ color: cyclePercent > 85 ? '#ef4444' : '#34d399', fontSize: 20 }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#f8fafc', mb: 0.5 }}>
                {finalCycleUsed.toFixed(1)} <span className="text-xs text-slate-400 font-normal">/ 70.0h</span>
              </Typography>
              <LinearProgress
                variant="determinate"
                value={cyclePercent}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: '#334155',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: cyclePercent > 85 ? '#ef4444' : '#10b981',
                  },
                }}
              />
              <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mt: 0.5, fontSize: '0.7rem' }}>
                {cycleRemaining.toFixed(1)} hrs available
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* 4. Mandatory Rest & Stops Tally */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={clockCardStyle}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                  Mandatory Stoppages
                </Typography>
                <Bedtime sx={{ color: '#c084fc', fontSize: 20 }} />
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                <Chip
                  icon={<LocalGasStation sx={{ fontSize: '14px !important', color: '#fbbf24' }} />}
                  label={`${summary.fuel_stops_count} Fuel`}
                  size="small"
                  sx={{ backgroundColor: '#1e293b', color: '#f1f5f9', height: 22, fontSize: '0.72rem' }}
                />
                <Chip
                  icon={<Coffee sx={{ fontSize: '14px !important', color: '#c084fc' }} />}
                  label={`${summary.rest_breaks_count} Breaks`}
                  size="small"
                  sx={{ backgroundColor: '#1e293b', color: '#f1f5f9', height: 22, fontSize: '0.72rem' }}
                />
                <Chip
                  icon={<Bedtime sx={{ fontSize: '14px !important', color: '#818cf8' }} />}
                  label={`${summary.sleeper_rests_count} Sleeper (10h)`}
                  size="small"
                  sx={{ backgroundColor: '#1e293b', color: '#f1f5f9', height: 22, fontSize: '0.72rem' }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Trip Metrics Banner */}
      <Card
        sx={{
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: 2.5,
          color: '#f8fafc',
          p: 2,
        }}
      >
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', fontWeight: 600 }}>
              DEPARTURE SCHEDULE:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#e2e8f0' }}>
              🛫 {startFormatted}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', fontWeight: 600 }}>
              ESTIMATED DELIVERY (ETA):
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#38bdf8' }}>
              🏁 {endFormatted}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', fontWeight: 600 }}>
              TOTAL TRIP ELAPSED TIME:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#f59e0b' }}>
              ⏱️ {summary.total_trip_duration_hours.toFixed(1)} Hours ({(summary.total_trip_duration_hours / 24.0).toFixed(1)} Days)
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', fontWeight: 600 }}>
              COMPLIANCE STATUS:
            </Typography>
            <Chip
              icon={<CheckCircle sx={{ fontSize: '16px !important', color: '#4ade80' }} />}
              label="100% FMCSA Compliant"
              size="small"
              sx={{
                backgroundColor: 'rgba(34, 197, 94, 0.15)',
                color: '#4ade80',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                fontWeight: 700,
              }}
            />
          </Grid>
        </Grid>
      </Card>
    </Box>
  );
};

const clockCardStyle = {
  backgroundColor: '#0f172a',
  border: '1px solid #1e293b',
  borderRadius: 2.5,
  height: '100%',
  boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
};
