import { useState, useEffect, type FormEvent } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Slider,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  InputAdornment,
  Chip,
} from '@mui/material';
import {
  LocationOn,
  PlayCircleOutlined,
  Storefront,
  WhereToVote,
  Timer,
  ExpandMore,
  Tune,
} from '@mui/icons-material';
import type { TripInput } from '../types/trip';

interface TripFormProps {
  onSubmit: (input: TripInput) => void;
  isLoading: boolean;
  initialValues: TripInput;
  onQuickSelect: (demoKey: string) => void;
}

export const TripForm = ({
  onSubmit,
  isLoading,
  initialValues,
  onQuickSelect,
}: TripFormProps) => {
  const [formData, setFormData] = useState<TripInput>(initialValues);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    setFormData(initialValues);
  }, [initialValues]);

  const handleChange = (field: keyof TripInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const cycleRemaining = Math.max(0, 70 - formData.current_cycle_used_hours);

  return (
    <Card
      sx={{
        backgroundColor: '#0f172a',
        border: '1px solid #1e293b',
        borderRadius: 3,
        color: '#f8fafc',
        boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
      }}
    >
      <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                p: 0.8,
                borderRadius: 2,
                backgroundColor: 'rgba(37, 99, 235, 0.2)',
                color: '#60a5fa',
              }}
            >
              <Tune sx={{ fontSize: 20 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
              Trip & HOS Parameters
            </Typography>
          </Box>

          <Chip
            label="FMCSA 70h / 8-Day Rule"
            size="small"
            sx={{
              backgroundColor: 'rgba(59, 130, 246, 0.12)',
              color: '#93c5fd',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              fontWeight: 600,
              fontSize: '0.72rem',
            }}
          />
        </Box>

        {/* Quick Demo Pre-sets for Evaluators */}
        <Box sx={{ mb: 2.5 }}>
          <Typography variant="caption" sx={{ color: '#94a3b8', mb: 0.8, display: 'block', fontWeight: 600 }}>
            QUICK LOAD TEST SCENARIOS:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
            <Chip
              label="Chicago ➔ Dallas (1,100 mi)"
              onClick={() => onQuickSelect('demo-chicago-dallas')}
              clickable
              size="small"
              sx={{
                backgroundColor: '#1e293b',
                color: '#e2e8f0',
                border: '1px solid #334155',
                '&:hover': { backgroundColor: '#2563eb', borderColor: '#3b82f6' },
              }}
            />
            <Chip
              label="LA ➔ Miami (2,800 mi, Multi-day)"
              onClick={() => onQuickSelect('demo-coast-to-coast')}
              clickable
              size="small"
              sx={{
                backgroundColor: '#1e293b',
                color: '#e2e8f0',
                border: '1px solid #334155',
                '&:hover': { backgroundColor: '#2563eb', borderColor: '#3b82f6' },
              }}
            />
            <Chip
              label="Richmond ➔ Newark (PDF Sample)"
              onClick={() => onQuickSelect('demo-pdf-richmond')}
              clickable
              size="small"
              sx={{
                backgroundColor: '#1e293b',
                color: '#e2e8f0',
                border: '1px solid #334155',
                '&:hover': { backgroundColor: '#2563eb', borderColor: '#3b82f6' },
              }}
            />
          </Box>
        </Box>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            {/* 1. Current Location */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                size="small"
                label="Current Location (Driver Origin)"
                placeholder="e.g. Chicago, IL"
                value={formData.current_location}
                onChange={(e) => handleChange('current_location', e.target.value)}
                required
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOn sx={{ color: '#22c55e', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={fieldStyles}
              />
            </Grid>

            {/* 2. Pickup Location */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Pickup Location (Shipper)"
                placeholder="e.g. Indianapolis, IN"
                value={formData.pickup_location}
                onChange={(e) => handleChange('pickup_location', e.target.value)}
                required
                helperText="1 Hour on-duty loading scheduled"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Storefront sx={{ color: '#3b82f6', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={fieldStyles}
              />
            </Grid>

            {/* 3. Dropoff Location */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Dropoff Location (Receiver)"
                placeholder="e.g. Dallas, TX"
                value={formData.dropoff_location}
                onChange={(e) => handleChange('dropoff_location', e.target.value)}
                required
                helperText="1 Hour on-duty unloading scheduled"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <WhereToVote sx={{ color: '#ef4444', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={fieldStyles}
              />
            </Grid>

            {/* 4. Current Cycle Used Hours */}
            <Grid size={{ xs: 12 }}>
              <Box sx={{ p: 2, backgroundColor: '#131d31', borderRadius: 2, border: '1px solid #1e293b' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <Timer sx={{ fontSize: 18, color: '#f59e0b' }} />
                    Current Cycle Used (Hours):
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#38bdf8' }}>
                    {formData.current_cycle_used_hours.toFixed(1)} / 70.0 hrs
                  </Typography>
                </Box>

                <Slider
                  value={formData.current_cycle_used_hours}
                  onChange={(_, val) => handleChange('current_cycle_used_hours', val as number)}
                  min={0}
                  max={70}
                  step={0.5}
                  valueLabelDisplay="auto"
                  sx={{
                    color: formData.current_cycle_used_hours > 60 ? '#ef4444' : '#0284c7',
                    height: 6,
                    '& .MuiSlider-thumb': {
                      backgroundColor: '#ffffff',
                      border: '2px solid #0284c7',
                      '&:hover, &.Mui-focusVisible': {
                        boxShadow: '0 0 0 8px rgba(2, 132, 199, 0.16)',
                      },
                    },
                  }}
                />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8' }}>
                  <span>0 hrs (Fresh restart)</span>
                  <span className={cycleRemaining < 15 ? 'text-rose-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                    {cycleRemaining.toFixed(1)} hrs remaining
                  </span>
                  <span>70 hrs limit</span>
                </Box>
              </Box>
            </Grid>
          </Grid>

          {/* Advanced Carrier & Driver Details */}
          <Accordion
            expanded={showAdvanced}
            onChange={() => setShowAdvanced(!showAdvanced)}
            sx={{
              mt: 2,
              backgroundColor: 'transparent',
              boxShadow: 'none',
              '&:before': { display: 'none' },
              border: '1px solid #1e293b',
              borderRadius: '8px !important',
            }}
          >
            <AccordionSummary expandIcon={<ExpandMore sx={{ color: '#94a3b8' }} />}>
              <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                Advanced ELD Header & Vehicle Details
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              <Grid container spacing={1.5}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Carrier Name"
                    value={formData.carrier_name || ''}
                    onChange={(e) => handleChange('carrier_name', e.target.value)}
                    sx={fieldStyles}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Driver Name"
                    value={formData.driver_name || ''}
                    onChange={(e) => handleChange('driver_name', e.target.value)}
                    sx={fieldStyles}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Truck / Tractor #"
                    value={formData.truck_number || ''}
                    onChange={(e) => handleChange('truck_number', e.target.value)}
                    sx={fieldStyles}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Trailer #"
                    value={formData.trailer_number || ''}
                    onChange={(e) => handleChange('trailer_number', e.target.value)}
                    sx={fieldStyles}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="BOL / Shipping Doc #"
                    value={formData.shipping_doc_number || ''}
                    placeholder="e.g. BOL-101601"
                    onChange={(e) => handleChange('shipping_doc_number', e.target.value)}
                    sx={fieldStyles}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Submit Button */}
          <Box sx={{ mt: 3 }}>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <PlayCircleOutlined />}
              sx={{
                py: 1.4,
                backgroundColor: '#2563eb',
                fontWeight: 700,
                fontSize: '0.95rem',
                textTransform: 'none',
                borderRadius: 2.5,
                background: 'linear-gradient(135deg, #2563eb, #0284c7)',
                boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1d4ed8, #0369a1)',
                  boxShadow: '0 6px 20px rgba(37, 99, 235, 0.6)',
                },
              }}
            >
              {isLoading ? 'Calculating Optimal Route & Logs...' : 'Plan Route & Generate ELD Logs'}
            </Button>
          </Box>
        </form>
      </CardContent>
    </Card>
  );
};

const fieldStyles = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: '#090d16',
    borderRadius: 2,
    color: '#f8fafc',
    '& fieldset': { borderColor: '#334155' },
    '&:hover fieldset': { borderColor: '#60a5fa' },
    '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
  },
  '& .MuiInputLabel-root': { color: '#94a3b8' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#60a5fa' },
  '& .MuiFormHelperText-root': { color: '#64748b', fontSize: '0.72rem' },
};
