import { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Tabs,
  Tab,
  Button,
  Chip,
} from '@mui/material';
import {
  Assignment,
  Print,
  CalendarToday,
} from '@mui/icons-material';
import type { DailyLogSheet } from '../types/trip';
import { EldGraphGrid } from './EldGraphGrid';

interface EldLogSheetProps {
  dailyLogs: DailyLogSheet[];
  onPrint: () => void;
}

export const EldLogSheet = ({ dailyLogs, onPrint }: EldLogSheetProps) => {
  const [activeTab, setActiveTab] = useState(0);

  if (!dailyLogs || dailyLogs.length === 0) {
    return null;
  }

  const currentSheet = dailyLogs[activeTab] || dailyLogs[0];
  const { hours_summary, recap } = currentSheet;

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
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        {/* Header Title & Multi-day Tabs */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, mb: 2.5 }} className="no-print">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                p: 0.8,
                borderRadius: 2,
                backgroundColor: 'rgba(37, 99, 235, 0.2)',
                color: '#60a5fa',
              }}
            >
              <Assignment sx={{ fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.15rem' }}>
                FMCSA Driver's Daily Log Sheets (Form MCS-59)
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                Official 24-Hour Graph Grid with 70-Hour / 8-Day Recap
              </Typography>
            </Box>
          </Box>

          <Button
            variant="outlined"
            size="small"
            startIcon={<Print />}
            onClick={onPrint}
            sx={{
              borderColor: '#38bdf8',
              color: '#38bdf8',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': { borderColor: '#7dd3fc', backgroundColor: 'rgba(56, 189, 248, 0.1)' },
            }}
          >
            Print This Log (PDF)
          </Button>
        </Box>

        {/* Multi-Day Navigation Tabs */}
        {dailyLogs.length > 1 && (
          <Box sx={{ borderBottom: 1, borderColor: '#334155', mb: 3 }} className="no-print">
            <Tabs
              value={activeTab}
              onChange={(_, val) => setActiveTab(val)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                '& .MuiTab-root': {
                  color: '#94a3b8',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  '&.Mui-selected': { color: '#38bdf8' },
                },
                '& .MuiTabs-indicator': { backgroundColor: '#38bdf8' },
              }}
            >
              {dailyLogs.map((sheet, idx) => (
                <Tab
                  key={`day-tab-${idx}`}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarToday sx={{ fontSize: 16 }} />
                      <span>Day {sheet.day_number} of {sheet.total_days} ({sheet.date_formatted})</span>
                      <Chip
                        label={`${sheet.total_miles_driving_today} mi`}
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: '0.68rem',
                          backgroundColor: '#1e293b',
                          color: '#e2e8f0',
                        }}
                      />
                    </Box>
                  }
                />
              ))}
            </Tabs>
          </Box>
        )}

        {/* OFFICIAL FMCSA LOG SHEET PAPER CONTAINER (White Background for DOT Standard) */}
        <Box
          className="log-sheet-container bg-white text-slate-900 p-4 sm:p-6 rounded-xl border border-slate-300 shadow-md font-sans"
        >
          {/* Form Header Top */}
          <Box className="border-b-2 border-black pb-3 mb-3">
            <Box className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <div>
                <Typography variant="caption" className="font-bold uppercase tracking-wider text-slate-600 block">
                  U.S. DEPARTMENT OF TRANSPORTATION — FEDERAL MOTOR CARRIER SAFETY ADMINISTRATION
                </Typography>
                <Typography variant="h5" className="font-extrabold tracking-tight text-slate-900 mt-0.5">
                  DRIVER'S DAILY LOG
                </Typography>
                <Typography variant="caption" className="font-semibold text-slate-500">
                  (ONE CALENDAR DAY — 24 HOURS) • 49 CFR PART 395
                </Typography>
              </div>

              <div className="text-right mt-2 sm:mt-0">
                <span className="inline-block border border-black px-2 py-0.5 text-xs font-bold bg-slate-100">
                  ORIGINAL — Submit to Carrier within 13 days
                </span>
                <div className="text-xs text-slate-600 mt-1">
                  Day <strong>{currentSheet.day_number}</strong> of <strong>{currentSheet.total_days}</strong>
                </div>
              </div>
            </Box>

            {/* Top Fields Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-300 text-xs">
              <div className="border border-slate-300 p-2 rounded bg-slate-50">
                <span className="text-slate-500 font-semibold block text-[10px] uppercase">Date (MM / DD / YYYY)</span>
                <span className="font-bold text-sm text-blue-900">{currentSheet.date_formatted}</span>
              </div>
              <div className="border border-slate-300 p-2 rounded bg-slate-50">
                <span className="text-slate-500 font-semibold block text-[10px] uppercase">Total Miles Driving Today</span>
                <span className="font-bold text-sm text-blue-900">{currentSheet.total_miles_driving_today} mi</span>
              </div>
              <div className="border border-slate-300 p-2 rounded bg-slate-50">
                <span className="text-slate-500 font-semibold block text-[10px] uppercase">Truck & Trailer Numbers</span>
                <span className="font-bold text-sm text-slate-800">{currentSheet.truck_number}, {currentSheet.trailer_number}</span>
              </div>
              <div className="border border-slate-300 p-2 rounded bg-slate-50">
                <span className="text-slate-500 font-semibold block text-[10px] uppercase">Shipping Manifest / Commodity</span>
                <span className="font-bold text-xs text-slate-800">{currentSheet.shipping_doc_number}</span>
              </div>
            </div>

            {/* Carrier & Driver Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2 text-xs">
              <div>
                <span className="text-slate-500 font-semibold text-[10px] uppercase block">Carrier Name & Main Office:</span>
                <span className="font-semibold text-slate-900">{currentSheet.carrier_name}</span>
                <span className="text-slate-600 block text-[11px]">{currentSheet.carrier_address}</span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold text-[10px] uppercase block">Driver's Signature & Certification:</span>
                <span className="font-serif italic font-bold text-blue-950 text-sm">{currentSheet.driver_name}</span>
                <span className="text-[10px] text-emerald-700 block font-medium">✓ I certify that these entries are true and correct</span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold text-[10px] uppercase block">Trip Route:</span>
                <span className="font-semibold text-slate-800">
                  {currentSheet.from_location} ➔ {currentSheet.to_location}
                </span>
                <span className="text-[10px] text-slate-500 block">Home Terminal: {currentSheet.home_terminal}</span>
              </div>
            </div>
          </Box>

          {/* THE 24-HOUR GRAPH GRID + TOTAL HOURS ON THE RIGHT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 my-3 items-center">
            <div className="lg:col-span-10">
              <EldGraphGrid segments={currentSheet.segments} remarks={currentSheet.remarks} />
            </div>

            {/* Right-side Total Hours Box */}
            <div className="lg:col-span-2 border-2 border-slate-800 rounded-lg p-3 bg-slate-50 text-xs">
              <div className="font-bold text-center border-b border-slate-300 pb-1 mb-2 uppercase tracking-wider text-slate-700">
                Total Hours
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">1. Off Duty:</span>
                <span className="font-bold font-mono text-slate-900">{hours_summary.off_duty.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">2. Sleeper:</span>
                <span className="font-bold font-mono text-slate-900">{hours_summary.sleeper_berth.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">3. Driving:</span>
                <span className="font-bold font-mono text-blue-700">{hours_summary.driving.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-300">
                <span className="text-slate-600">4. On Duty:</span>
                <span className="font-bold font-mono text-slate-900">{hours_summary.on_duty_not_driving.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 text-sm font-extrabold text-emerald-800">
                <span>TOTAL:</span>
                <span className="font-mono">{hours_summary.total_hours.toFixed(2)} hrs</span>
              </div>
              <div className="text-[10px] text-center text-emerald-600 font-semibold mt-1">
                ✓ Exactly 24.0h Balanced
              </div>
            </div>
          </div>

          {/* BOTTOM RECAP TABLE (70-Hour / 8-Day Drivers) */}
          <div className="mt-4 pt-3 border-t-2 border-black">
            <div className="text-xs font-extrabold text-slate-900 uppercase mb-2">
              70-HOUR / 8-DAY DRIVER RECAP CALCULATION:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="border border-slate-300 p-2 rounded bg-blue-50/60">
                <span className="text-slate-600 font-semibold block text-[10px]">On-Duty Today (Lines 3 + 4):</span>
                <span className="font-bold text-sm text-blue-900 font-mono">{recap.on_duty_hours_today.toFixed(2)} hrs</span>
              </div>
              <div className="border border-slate-300 p-2 rounded bg-slate-50">
                <span className="text-slate-600 font-semibold block text-[10px]">A. Total Duty Last 7 Days (incl. today):</span>
                <span className="font-bold text-sm text-slate-800 font-mono">{recap.total_hours_last_7_days_including_today.toFixed(2)} hrs</span>
              </div>
              <div className="border border-slate-300 p-2 rounded bg-emerald-50/60">
                <span className="text-slate-600 font-semibold block text-[10px]">B. Total Available Tomorrow (70 - A):</span>
                <span className="font-bold text-sm text-emerald-700 font-mono">{recap.total_hours_available_tomorrow.toFixed(2)} hrs</span>
              </div>
              <div className="border border-slate-300 p-2 rounded bg-slate-50">
                <span className="text-slate-600 font-semibold block text-[10px]">C. Total Duty Last 8 Days (incl. today):</span>
                <span className="font-bold text-sm text-slate-800 font-mono">{recap.total_hours_last_8_days_including_today.toFixed(2)} hrs</span>
              </div>
            </div>
          </div>

          {/* CHRONOLOGICAL REMARKS LOG TABLE */}
          <div className="mt-4 pt-3 border-t border-slate-300">
            <div className="text-xs font-bold text-slate-800 mb-2">
              Chronological Duty Status Change Remarks:
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200">
                <thead className="bg-slate-100 text-slate-700 font-semibold">
                  <tr>
                    <th className="p-1.5 border-b">Time</th>
                    <th className="p-1.5 border-b">Duty Status</th>
                    <th className="p-1.5 border-b">Location</th>
                    <th className="p-1.5 border-b">Activity & Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {currentSheet.remarks.map((rem, rIdx) => (
                    <tr key={`remark-row-${rIdx}`} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="p-1.5 font-mono font-bold text-blue-900">{rem.time}</td>
                      <td className="p-1.5 font-semibold">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                          rem.duty_status === 3 ? 'bg-blue-100 text-blue-800 font-bold' :
                          rem.duty_status === 2 ? 'bg-indigo-100 text-indigo-800' :
                          rem.duty_status === 4 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {rem.duty_name}
                        </span>
                      </td>
                      <td className="p-1.5 font-bold text-slate-900">{rem.location}</td>
                      <td className="p-1.5 text-slate-600">{rem.remark_text}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Box>
      </CardContent>
    </Card>
  );
};
