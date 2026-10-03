import { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Box,
  Alert,
  CircularProgress,
  Fade,
} from '@mui/material';
import { Navbar } from './components/Navbar';
import { TripForm } from './components/TripForm';
import { RouteMap } from './components/RouteMap';
import { EldLogSheet } from './components/EldLogSheet';
import { HOSDashboard } from './components/HOSDashboard';
import { TimelineView } from './components/TimelineView';
import type { TripInput, TripPlanResponse } from './types/trip';
import { planTruckRoute, checkBackendHealth } from './services/api';

const QUICK_DEMOS: Record<string, TripInput> = {
  'demo-chicago-dallas': {
    current_location: 'Chicago, IL',
    pickup_location: 'Indianapolis, IN',
    dropoff_location: 'Dallas, TX',
    current_cycle_used_hours: 20.0,
    carrier_name: 'Spotter Logistics Inc.',
    driver_name: 'John E. Doe',
    truck_number: 'TRK-8841',
    trailer_number: 'TLR-9022',
    commodity: 'General Freight / Palletized Goods',
    shipping_doc_number: 'BOL-101601',
  },
  'demo-coast-to-coast': {
    current_location: 'Los Angeles, CA',
    pickup_location: 'Phoenix, AZ',
    dropoff_location: 'Miami, FL',
    current_cycle_used_hours: 15.0,
    carrier_name: 'Spotter Express Hauling',
    driver_name: 'Alex Rivera',
    truck_number: 'TRK-5502',
    trailer_number: 'TLR-7714',
    commodity: 'Refrigerated Electronics & Produce',
    shipping_doc_number: 'BOL-994320',
  },
  'demo-pdf-richmond': {
    current_location: 'Richmond, VA',
    pickup_location: 'Richmond, VA',
    dropoff_location: 'Newark, NJ',
    current_cycle_used_hours: 10.0,
    carrier_name: "John Doe's Transportation",
    driver_name: 'John E. Doe',
    truck_number: '123',
    trailer_number: '20544',
    commodity: 'Commercial Goods',
    shipping_doc_number: '101601',
  },
};

export default function App() {
  const [selectedDemoKey, setSelectedDemoKey] = useState<string>('demo-chicago-dallas');
  const [currentInput, setCurrentInput] = useState<TripInput>(QUICK_DEMOS['demo-chicago-dallas']);
  const [tripPlan, setTripPlan] = useState<TripPlanResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean>(false);

  useEffect(() => {
    const checkHealth = async () => {
      const online = await checkBackendHealth();
      setBackendOnline(online);
    };
    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    handlePlanRoute(currentInput);
  }, []);

  const handlePlanRoute = async (input: TripInput) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const plan = await planTruckRoute(input);
      setTripPlan(plan);
      setCurrentInput(input);
    } catch (err: any) {
      console.error('Failed to plan truck route:', err);
      const serverMsg = err.response?.data?.error || err.message || 'Error communicating with backend';
      setErrorMsg(`Route calculation failed: ${serverMsg}. Please ensure Django backend is running.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectQuickDemo = (demoKey: string) => {
    if (QUICK_DEMOS[demoKey]) {
      setSelectedDemoKey(demoKey);
      setCurrentInput(QUICK_DEMOS[demoKey]);
      handlePlanRoute(QUICK_DEMOS[demoKey]);
    }
  };

  const handlePrintLogs = () => {
    window.print();
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#090d16', color: '#f8fafc', pb: 8 }}>
      {/* Navigation Bar */}
      <Navbar
        onPrintLogs={handlePrintLogs}
        backendOnline={backendOnline}
        onSelectQuickDemo={handleSelectQuickDemo}
        selectedDemo={selectedDemoKey}
      />

      <Container maxWidth="xl" sx={{ mt: 3, px: { xs: 2, md: 3 } }}>
        {/* Error Notification Alert */}
        {errorMsg && (
          <Alert
            severity="error"
            onClose={() => setErrorMsg(null)}
            sx={{ mb: 3, backgroundColor: '#450a0a', color: '#fca5a5', border: '1px solid #7f1d1d' }}
          >
            {errorMsg}
          </Alert>
        )}

        {/* Top Split: Trip Parameters & Interactive Route Map */}
        <Grid container spacing={3} className="no-print">
          {/* Left Column: Trip Form */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <TripForm
              onSubmit={handlePlanRoute}
              isLoading={isLoading}
              initialValues={currentInput}
              onQuickSelect={handleSelectQuickDemo}
            />
          </Grid>

          {/* Right Column: Interactive Route Map */}
          <Grid size={{ xs: 12, lg: 8 }}>
            {tripPlan ? (
              <RouteMap
                routeCoordinates={tripPlan.route_geometry.coordinates}
                stops={tripPlan.stops}
                totalDistanceMiles={tripPlan.summary.total_distance_miles}
              />
            ) : (
              <Box
                sx={{
                  height: '100%',
                  minHeight: 400,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#0f172a',
                  borderRadius: 3,
                  border: '1px solid #1e293b',
                }}
              >
                <CircularProgress color="primary" />
              </Box>
            )}
          </Grid>
        </Grid>

        {/* Bottom Section: HOS Dashboard, ELD Daily Logs & Timeline */}
        {tripPlan && (
          <Fade in={!isLoading} timeout={500}>
            <Box sx={{ mt: 4 }}>
              {/* 1. HOS Clocks & Trip Metrics */}
              <div className="no-print">
                <HOSDashboard
                  summary={tripPlan.summary}
                  initialCycleUsed={tripPlan.trip_info.initial_cycle_used_hours}
                />
              </div>

              {/* 2. Authentic FMCSA 24-Hour Driver's Daily Log Sheets */}
              <EldLogSheet
                dailyLogs={tripPlan.daily_logs}
                onPrint={handlePrintLogs}
              />

              {/* 3. Chronological Itinerary & Stops Sequence */}
              <div className="no-print">
                <TimelineView stops={tripPlan.stops} />
              </div>
            </Box>
          </Fade>
        )}
      </Container>
    </Box>
  );
}
