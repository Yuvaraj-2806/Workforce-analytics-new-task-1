import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Card, CardContent, Typography, Button, Chip } from '@mui/material';
import { Block, Dashboard, Logout } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { ROLE_COLORS, ROLE_LABELS } from '../types/auth';

export default function AccessDeniedPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const state = location.state as any;
  const requiredRoles = state?.requiredRoles;
  const requiredPermission = state?.requiredPermission;

  const handleReturn = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    switch (user.role) {
      case 'admin':
        navigate('/admin');
        break;
      case 'hr':
        navigate('/dashboard');
        break;
      case 'manager':
        navigate('/manager-dashboard');
        break;
      case 'team_lead':
        navigate('/team-lead-dashboard');
        break;
      case 'employee':
        navigate('/employee-dashboard');
        break;
      default:
        navigate('/dashboard');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a0f1e 0%, #1a0a0a 50%, #050d1f 100%)',
        p: 3,
      }}
    >
      <Card
        sx={{
          maxWidth: 520,
          width: '100%',
          bgcolor: 'rgba(20, 10, 10, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 4,
          boxShadow: '0 25px 50px -12px rgba(239, 68, 68, 0.2)',
          color: '#fff',
          textAlign: 'center',
        }}
      >
        <CardContent sx={{ p: 5 }}>
          {/* Animated Forbidden Icon */}
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: 'rgba(239, 68, 68, 0.15)',
              border: '2px solid rgba(239, 68, 68, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
            }}
          >
            <Block sx={{ fontSize: 44, color: '#ef4444' }} />
          </Box>

          <Typography variant="overline" sx={{ color: '#ef4444', letterSpacing: 2, fontWeight: 700 }}>
            HTTP 403 · FORBIDDEN
          </Typography>

          <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, mb: 1.5 }}>
            Access Denied
          </Typography>

          <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
            You do not have the required role or authorization permissions to view this resource. Access attempts are recorded in the security audit logs.
          </Typography>

          {/* User Role Details */}
          {user && (
            <Box
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 2,
                p: 2,
                mb: 3,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                Your Current Role:
              </Typography>
              <Chip
                label={ROLE_LABELS[user.role] || user.role}
                size="small"
                sx={{
                  bgcolor: `${ROLE_COLORS[user.role]}22`,
                  color: ROLE_COLORS[user.role],
                  border: `1px solid ${ROLE_COLORS[user.role]}55`,
                  fontWeight: 700,
                }}
              />
            </Box>
          )}

          {requiredRoles && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', display: 'block', mb: 1 }}>
                Required Role(s):
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                {requiredRoles.map((r: string) => (
                  <Chip key={r} label={r} size="small" sx={{ bgcolor: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5' }} />
                ))}
              </Box>
            </Box>
          )}

          {requiredPermission && (
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', display: 'block', mb: 3 }}>
              Required Permission: <code style={{ color: '#fca5a5' }}>{requiredPermission}</code>
            </Typography>
          )}

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              startIcon={<Dashboard />}
              onClick={handleReturn}
              sx={{
                bgcolor: '#4f46e5',
                px: 3,
                py: 1.2,
                fontWeight: 600,
                borderRadius: 2,
                '&:hover': { bgcolor: '#4338ca' },
              }}
            >
              Return to Safe Dashboard
            </Button>
            <Button
              variant="outlined"
              startIcon={<Logout />}
              onClick={() => logout().then(() => navigate('/login'))}
              sx={{
                borderColor: 'rgba(255, 255, 255, 0.2)',
                color: '#fff',
                px: 2.5,
                py: 1.2,
                borderRadius: 2,
                '&:hover': { borderColor: '#ef4444', color: '#ef4444' },
              }}
            >
              Sign Out
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
