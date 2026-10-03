import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  LocalShipping,
  Print,
  CloudDone,
  Schedule,
} from '@mui/icons-material';

interface NavbarProps {
  onPrintLogs: () => void;
  backendOnline: boolean;
  onSelectQuickDemo: (demoId: string) => void;
  selectedDemo: string;
}

export const Navbar = ({
  onPrintLogs,
  backendOnline,
  onSelectQuickDemo,
  selectedDemo,
}: NavbarProps) => {
  return (
    <AppBar
      position="sticky"
      className="no-print"
      sx={{
        backgroundColor: '#090d16',
        borderBottom: '1px solid rgba(51, 65, 85, 0.4)',
        boxShadow: '0 4px 20px -2px rgba(0,0,0,0.5)',
      }}
    >
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', px: { xs: 2, md: 4 } }}>
        {/* Brand Logo & Title */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 42,
              height: 42,
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
              boxShadow: '0 0 15px rgba(37, 99, 235, 0.5)',
            }}
          >
            <LocalShipping sx={{ color: '#ffffff', fontSize: 26 }} />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="h6"
                component="div"
                sx={{
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  background: 'linear-gradient(90deg, #ffffff, #93c5fd)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: 1.2,
                }}
              >
                SPOTTER <span className="text-cyan-400">AI</span>
              </Typography>
              <Chip
                label="ELD & HOS Pro"
                size="small"
                sx={{
                  backgroundColor: 'rgba(6, 182, 212, 0.15)',
                  color: '#22d3ee',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  height: 20,
                }}
              />
            </Box>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.72rem' }}>
              FMCSA 70hr/8day Route & Electronic Logging Device Engine
            </Typography>
          </Box>
        </Box>

        {/* Quick Demos Selector & Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ display: { xs: 'none', lg: 'flex' }, alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
              Quick Scenarios:
            </Typography>
            <Button
              size="small"
              variant={selectedDemo === 'demo-chicago-dallas' ? 'contained' : 'outlined'}
              onClick={() => onSelectQuickDemo('demo-chicago-dallas')}
              sx={{
                textTransform: 'none',
                fontSize: '0.75rem',
                py: 0.5,
                px: 1.2,
                borderColor: '#334155',
                backgroundColor: selectedDemo === 'demo-chicago-dallas' ? '#2563eb' : 'transparent',
                color: '#e2e8f0',
                '&:hover': { borderColor: '#60a5fa', backgroundColor: '#1e40af' },
              }}
            >
              Chicago ➔ Dallas
            </Button>
            <Button
              size="small"
              variant={selectedDemo === 'demo-coast-to-coast' ? 'contained' : 'outlined'}
              onClick={() => onSelectQuickDemo('demo-coast-to-coast')}
              sx={{
                textTransform: 'none',
                fontSize: '0.75rem',
                py: 0.5,
                px: 1.2,
                borderColor: '#334155',
                backgroundColor: selectedDemo === 'demo-coast-to-coast' ? '#2563eb' : 'transparent',
                color: '#e2e8f0',
                '&:hover': { borderColor: '#60a5fa', backgroundColor: '#1e40af' },
              }}
            >
              LA ➔ Miami (Cross-Country)
            </Button>
            <Button
              size="small"
              variant={selectedDemo === 'demo-pdf-richmond' ? 'contained' : 'outlined'}
              onClick={() => onSelectQuickDemo('demo-pdf-richmond')}
              sx={{
                textTransform: 'none',
                fontSize: '0.75rem',
                py: 0.5,
                px: 1.2,
                borderColor: '#334155',
                backgroundColor: selectedDemo === 'demo-pdf-richmond' ? '#2563eb' : 'transparent',
                color: '#e2e8f0',
                '&:hover': { borderColor: '#60a5fa', backgroundColor: '#1e40af' },
              }}
            >
              PDF Example: Richmond ➔ Newark
            </Button>
          </Box>

          {/* Backend Status Indicator */}
          <Tooltip title={backendOnline ? 'Django DRF Backend Connected (Port 8000)' : 'Connecting to Django Backend...'}>
            <Chip
              icon={backendOnline ? <CloudDone sx={{ fontSize: 16, color: '#4ade80 !important' }} /> : <Schedule sx={{ fontSize: 16, color: '#facc15 !important' }} />}
              label={backendOnline ? 'API Online' : 'API Syncing'}
              size="small"
              sx={{
                backgroundColor: backendOnline ? 'rgba(34, 197, 94, 0.12)' : 'rgba(234, 179, 8, 0.12)',
                color: backendOnline ? '#4ade80' : '#facc15',
                border: `1px solid ${backendOnline ? 'rgba(34, 197, 94, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`,
                fontWeight: 600,
                fontSize: '0.72rem',
              }}
            />
          </Tooltip>

          {/* Print / Export Action */}
          <Button
            variant="contained"
            color="primary"
            startIcon={<Print />}
            onClick={onPrintLogs}
            sx={{
              backgroundColor: '#0284c7',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.82rem',
              px: 2,
              borderRadius: '8px',
              boxShadow: '0 0 12px rgba(2, 132, 199, 0.4)',
              '&:hover': { backgroundColor: '#0369a1' },
            }}
          >
            Print / Save ELD Logs
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};
