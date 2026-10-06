import { useEffect, useRef } from 'react';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import { Navigation } from '@mui/icons-material';
import L from 'leaflet';
import type { StopInfo } from '../types/trip';

interface RouteMapProps {
  routeCoordinates: [number, number][]; // [lat, lng]
  stops: StopInfo[];
  totalDistanceMiles: number;
}


// Custom SVG map marker generator
const createCustomMarkerIcon = (stopType: string, _label: string) => {
  let bgColor = '#3b82f6';
  let iconSvg = '';

  switch (stopType) {
    case 'ORIGIN':
      bgColor = '#22c55e'; // Green
      iconSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>';
      break;
    case 'PICKUP':
      bgColor = '#0284c7'; // Blue
      iconSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>';
      break;
    case 'FUEL_STOP':
      bgColor = '#f59e0b'; // Amber
      iconSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11c-.94.36-1.61 1.26-1.61 2.33 0 1.38 1.12 2.5 2.5 2.5.36 0 .69-.08 1-.21v7.21c0 .55-.45 1-1 1s-1-.45-1-1V14c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v16h10v-7.5h1.5v5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V9c0-.69-.28-1.32-.73-1.77zM12 10H6V5h6v5z"/></svg>';
      break;
    case 'REST_BREAK':
      bgColor = '#a855f7'; // Purple
      iconSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.9 2-2V5c0-1.11-.89-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z"/></svg>';
      break;
    case 'SLEEPER_REST':
      bgColor = '#6366f1'; // Indigo
      iconSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M23 11v2h-2v7h-2v-2H5v2H3v-7H1v-2l1.37-.82C3.41 9.56 4.7 9 6.07 9H12c1.37 0 2.66.56 3.7 1.18L17.07 11H23zM7 8c1.66 0 3-1.34 3-3S8.66 2 7 2 4 3.34 4 5s1.34 3 3 3z"/></svg>';
      break;
    case 'DROPOFF':
      bgColor = '#ef4444'; // Red
      iconSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/></svg>';
      break;
    default:
      bgColor = '#3b82f6';
      iconSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="white"><circle cx="12" cy="12" r="8"/></svg>';
  }

  const html = `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: ${bgColor};
      border-radius: 50%;
      border: 2.5px solid #ffffff;
      box-shadow: 0 4px 10px rgba(0,0,0,0.5);
      cursor: pointer;
    ">
      ${iconSvg}
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-map-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
};

export const RouteMap = ({
  routeCoordinates,
  stops,
  totalDistanceMiles,
}: RouteMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [39.8283, -98.5795],
        zoom: 4,
        zoomControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // CartoDB Voyager tile layer with CARTO 'key' parameter
      const cartoApiKey = import.meta.env.VITE_CARTO_API_KEY;
      const tileUrl = cartoApiKey
        ? `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${cartoApiKey}`
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

      L.tileLayer(tileUrl, {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // 1. Draw Route Polyline
    if (routeCoordinates && routeCoordinates.length > 1) {
      const polyline = L.polyline(routeCoordinates, {
        color: '#2563eb',
        weight: 5,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(layerGroup);

      // Glow outline
      L.polyline(routeCoordinates, {
        color: '#60a5fa',
        weight: 8,
        opacity: 0.3,
        lineCap: 'round',
      }).addTo(layerGroup);

      map.fitBounds(polyline.getBounds(), { padding: [40, 40] });
    }

    // 2. Add Stop Markers
    if (stops && stops.length > 0) {
      stops.forEach((stop, idx) => {
        if (!stop.coordinates || stop.coordinates.length < 2) return;
        const [lat, lng] = stop.coordinates;

        const marker = L.marker([lat, lng], {
          icon: createCustomMarkerIcon(stop.stop_type, `${idx + 1}`),
        }).addTo(layerGroup);

        const arrivalFormatted = new Date(stop.arrival_time).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          month: 'short',
          day: 'numeric',
        });
        const departureFormatted = new Date(stop.departure_time).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          month: 'short',
          day: 'numeric',
        });

        const popupContent = `
          <div style="font-family: 'Inter', sans-serif; font-size: 13px; line-height: 1.4;">
            <div style="font-weight: 700; color: #38bdf8; font-size: 14px; margin-bottom: 4px;">
              ${stop.title}
            </div>
            <div style="color: #e2e8f0; font-weight: 600; margin-bottom: 6px;">
              📍 ${stop.location}
            </div>
            <div style="background: rgba(30, 41, 59, 0.8); padding: 8px; border-radius: 6px; border: 1px solid #334155; margin-bottom: 6px;">
              <div style="color: #94a3b8; font-size: 11px;">
                <strong>Arrival:</strong> ${arrivalFormatted}
              </div>
              <div style="color: #94a3b8; font-size: 11px;">
                <strong>Departure:</strong> ${departureFormatted}
              </div>
              <div style="color: #4ade80; font-size: 11px; margin-top: 2px;">
                <strong>Duration:</strong> ${stop.duration_minutes > 0 ? `${stop.duration_minutes} mins (${stop.duration_hours}h)` : 'Start Point'}
              </div>
              <div style="color: #cbd5e1; font-size: 11px;">
                <strong>Trip Distance:</strong> ${stop.cumulative_miles.toFixed(1)} miles
              </div>
            </div>
            <div style="color: #94a3b8; font-size: 11px; font-style: italic;">
              ${stop.remarks}
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);
      });
    }

    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  }, [routeCoordinates, stops]);

  return (
    <Card
      sx={{
        backgroundColor: '#0f172a',
        border: '1px solid #1e293b',
        borderRadius: 3,
        color: '#f8fafc',
        boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CardContent sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Map Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                p: 0.8,
                borderRadius: 2,
                backgroundColor: 'rgba(37, 99, 235, 0.2)',
                color: '#60a5fa',
              }}
            >
              <Navigation sx={{ fontSize: 20 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem' }}>
              Interactive Truck Route & Scheduled Stops
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              label={`${totalDistanceMiles.toLocaleString()} Total Miles`}
              size="small"
              sx={{
                backgroundColor: 'rgba(14, 165, 233, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(14, 165, 233, 0.3)',
                fontWeight: 600,
              }}
            />
            <Chip
              label={`${stops.length} Stops & Waypoints`}
              size="small"
              sx={{
                backgroundColor: 'rgba(34, 197, 94, 0.15)',
                color: '#4ade80',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                fontWeight: 600,
              }}
            />
          </Box>
        </Box>

        {/* Map Legend */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1.5,
            mb: 1.5,
            p: 1,
            backgroundColor: '#090d16',
            borderRadius: 2,
            border: '1px solid #1e293b',
            fontSize: '0.75rem',
          }}
        >
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span> Origin
          </span>
          <span className="flex items-center gap-1.5 text-sky-400">
            <span className="w-3 h-3 rounded-full bg-sky-500 inline-block"></span> Shipper (1h Load)
          </span>
          <span className="flex items-center gap-1.5 text-amber-400">
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span> Fuel Stop (1,000mi)
          </span>
          <span className="flex items-center gap-1.5 text-purple-400">
            <span className="w-3 h-3 rounded-full bg-purple-500 inline-block"></span> 30-min Rest Break
          </span>
          <span className="flex items-center gap-1.5 text-indigo-400">
            <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block"></span> 10-hr Sleeper Berth
          </span>
          <span className="flex items-center gap-1.5 text-rose-400">
            <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span> Consignee (1h Unload)
          </span>
        </Box>

        {/* Leaflet Map Canvas */}
        <Box
          ref={mapContainerRef}
          sx={{
            flex: 1,
            minHeight: { xs: 350, md: 450 },
            borderRadius: 2,
            overflow: 'hidden',
            border: '1px solid #334155',
          }}
        />
      </CardContent>
    </Card>
  );
};
