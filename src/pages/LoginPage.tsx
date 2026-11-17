import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  IconButton, InputAdornment, Alert, CircularProgress,
} from '@mui/material';
import {
  MailOutlineRounded,
  LockOutlined,
  VisibilityOutlined,
  VisibilityOffOutlined,
  ArrowForwardRounded,
  AnalyticsRounded,
  ErrorOutlineRounded,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, user } = useAuth();

  // Controlled empty state on initial load — strictly empty, no defaults
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string }>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Role-based portal navigation router
  const redirectByRole = (role: UserRole) => {
    const from = (location.state as any)?.from?.pathname;
    if (from && from !== '/login') {
      navigate(from, { replace: true });
      return;
    }
    switch (role) {
      case 'admin':
        navigate('/admin', { replace: true });
        break;
      case 'hr':
        navigate('/dashboard', { replace: true });
        break;
      case 'manager':
        navigate('/manager-dashboard', { replace: true });
        break;
      case 'team_lead':
        navigate('/team-lead-dashboard', { replace: true });
        break;
      case 'employee':
        navigate('/employee-dashboard', { replace: true });
        break;
      default:
        navigate('/dashboard', { replace: true });
    }
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      redirectByRole(user.role);
    }
  }, [isAuthenticated, user]);

  // Form input validation
  const validateForm = (): boolean => {
    const errs: { email?: string; password?: string } = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      errs.email = 'Please enter your email address.';
    } else if (!emailRegex.test(email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errs.password = 'Please enter your password.';
    }

    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // Prevent duplicate submissions

    setError('');
    if (!validateForm()) return;

    setLoading(true);
    const submittedEmail = email.trim();
    const submittedPassword = password;

    try {
      const result = await login(submittedEmail, submittedPassword);

      if (result.requiresMFA) {
        // Clear password immediately on MFA handoff
        setPassword('');
        navigate('/mfa', { replace: true });
        return;
      }

      // Successful login: clear both fields completely
      setEmail('');
      setPassword('');
      setValidationErrors({});
    } catch (err: any) {
      // Failed login: clear password field, keep email for correction
      setPassword('');
      const serverMessage = err.message || 'Invalid email or password. Please try again.';
      setError(serverMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#F5F7FC',
        position: 'relative',
        overflow: 'hidden',
        p: { xs: 2, sm: 3 },
      }}
    >
      {/* Subtle soft ambient background accents */}
      <Box
        sx={{
          position: 'absolute',
          top: '-10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: { xs: 500, sm: 800 },
          height: { xs: 500, sm: 800 },
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(107, 131, 247, 0.08) 0%, rgba(238, 240, 255, 0.4) 40%, transparent 70%)',
          filter: 'blur(70px)',
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '-15%',
          right: '-5%',
          width: 450,
          height: 450,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(49, 92, 245, 0.05) 0%, transparent 70%)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
        }}
      />

      {/* Centered Premium White Login Card */}
      <Card
        elevation={0}
        sx={{
          maxWidth: 430,
          width: { xs: 'calc(100% - 32px)', sm: '100%' },
          bgcolor: '#FFFFFF',
          border: '1px solid #EAECF0',
          boxShadow: '0 12px 32px -4px rgba(16, 24, 40, 0.08), 0 4px 12px -2px rgba(16, 24, 40, 0.04)',
          borderRadius: '20px',
          p: { xs: 3.5, sm: 4.5 },
          position: 'relative',
          zIndex: 1,
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(14px)',
          transition: 'opacity 0.45s ease-out, transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
          '@media (prefers-reduced-motion: reduce)': {
            transition: 'none',
            transform: 'none',
            opacity: 1,
          },
        }}
      >
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          {/* Header */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', mb: 3.5 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '12px',
                bgcolor: '#EEF0FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
              }}
            >
              <AnalyticsRounded sx={{ color: '#315CF5', fontSize: 26 }} />
            </Box>

            <Typography
              variant="h5"
              component="h1"
              sx={{
                color: '#182230',
                fontWeight: 700,
                fontSize: { xs: '1.4rem', sm: '1.5rem' },
                letterSpacing: '-0.025em',
                lineHeight: 1.25,
                mb: 0.75,
              }}
            >
              Welcome Back
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: '#697586',
                fontSize: '0.875rem',
                fontWeight: 400,
                letterSpacing: '-0.01em',
              }}
            >
              Sign in to access your workforce dashboard.
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert
              severity="error"
              icon={<ErrorOutlineRounded sx={{ color: '#DC3545', fontSize: 20 }} />}
              sx={{
                mb: 3,
                bgcolor: '#FEF3F2',
                border: '1px solid #FECDCA',
                borderRadius: '10px',
                color: '#B42318',
                fontSize: '0.84rem',
                lineHeight: 1.45,
                py: 0.75,
                px: 1.5,
                animation: 'alertFadeIn 0.3s ease',
                '@keyframes alertFadeIn': {
                  from: { opacity: 0, transform: 'translateY(-4px)' },
                  to: { opacity: 1, transform: 'translateY(0)' },
                },
                '& .MuiAlert-message': {
                  p: 0,
                  alignSelf: 'center',
                },
              }}
            >
              {error}
            </Alert>
          )}

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit} noValidate>
            {/* Email Field */}
            <Box sx={{ mb: 2.25 }}>
              <Typography
                component="label"
                htmlFor="login-email"
                sx={{
                  display: 'block',
                  color: '#182230',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  mb: 0.75,
                  letterSpacing: '-0.01em',
                }}
              >
                Email Address
              </Typography>
              <TextField
                id="login-email"
                type="email"
                fullWidth
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (validationErrors.email) {
                    setValidationErrors((prev) => ({ ...prev, email: undefined }));
                  }
                }}
                placeholder="Enter your email address"
                disabled={loading}
                autoComplete="email"
                error={Boolean(validationErrors.email)}
                helperText={validationErrors.email}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start" sx={{ mr: 1 }}>
                        <MailOutlineRounded sx={{ color: '#697586', fontSize: 19 }} />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: 48,
                    color: '#182230',
                    fontSize: '0.9rem',
                    bgcolor: '#FFFFFF',
                    borderRadius: '10px',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    '&:hover': {
                      bgcolor: '#FFFFFF',
                    },
                    '& fieldset': {
                      borderColor: '#E2E8F0',
                      transition: 'all 0.2s ease',
                    },
                    '&:hover fieldset': {
                      borderColor: '#6B83F7',
                    },
                    '&.Mui-focused': {
                      bgcolor: '#FFFFFF',
                      boxShadow: '0 0 0 3px rgba(49, 92, 245, 0.12)',
                      '& fieldset': {
                        borderColor: '#315CF5',
                        borderWidth: '1.5px',
                      },
                    },
                    '&.Mui-error': {
                      bgcolor: '#FFFFFF',
                      boxShadow: '0 0 0 3px rgba(220, 53, 69, 0.12)',
                      '& fieldset': {
                        borderColor: '#DC3545',
                      },
                    },
                    '& input': {
                      bgcolor: 'transparent',
                    },
                    '& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus, & input:-webkit-autofill:active': {
                      WebkitBoxShadow: '0 0 0 1000px #ffffff inset !important',
                      WebkitTextFillColor: '#182230 !important',
                      transition: 'background-color 5000s ease-in-out 0s',
                    },
                    '& input::placeholder': {
                      color: '#94A3B8',
                      opacity: 1,
                      fontSize: '0.875rem',
                    },
                  },
                  '& .MuiFormHelperText-root': {
                    color: '#DC3545',
                    fontSize: '0.75rem',
                    mt: 0.5,
                    ml: 0.5,
                  },
                }}
              />
            </Box>

            {/* Password Field */}
            <Box sx={{ mb: 3 }}>
              <Typography
                component="label"
                htmlFor="login-password"
                sx={{
                  display: 'block',
                  color: '#182230',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  mb: 0.75,
                  letterSpacing: '-0.01em',
                }}
              >
                Password
              </Typography>
              <TextField
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (validationErrors.password) {
                    setValidationErrors((prev) => ({ ...prev, password: undefined }));
                  }
                }}
                placeholder="Enter your password"
                disabled={loading}
                autoComplete="current-password"
                error={Boolean(validationErrors.password)}
                helperText={validationErrors.password}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start" sx={{ mr: 1 }}>
                        <LockOutlined sx={{ color: '#697586', fontSize: 19 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          onClick={() => setShowPassword((prev) => !prev)}
                          edge="end"
                          tabIndex={-1}
                          sx={{
                            color: '#697586',
                            p: 0.75,
                            transition: 'color 0.15s ease',
                            '&:hover': { color: '#182230' },
                          }}
                        >
                          {showPassword ? (
                            <VisibilityOffOutlined sx={{ fontSize: 19 }} />
                          ) : (
                            <VisibilityOutlined sx={{ fontSize: 19 }} />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: 48,
                    color: '#182230',
                    fontSize: '0.9rem',
                    bgcolor: '#FFFFFF',
                    borderRadius: '10px',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    '&:hover': {
                      bgcolor: '#FFFFFF',
                    },
                    '& fieldset': {
                      borderColor: '#E2E8F0',
                      transition: 'all 0.2s ease',
                    },
                    '&:hover fieldset': {
                      borderColor: '#6B83F7',
                    },
                    '&.Mui-focused': {
                      bgcolor: '#FFFFFF',
                      boxShadow: '0 0 0 3px rgba(49, 92, 245, 0.12)',
                      '& fieldset': {
                        borderColor: '#315CF5',
                        borderWidth: '1.5px',
                      },
                    },
                    '&.Mui-error': {
                      bgcolor: '#FFFFFF',
                      boxShadow: '0 0 0 3px rgba(220, 53, 69, 0.12)',
                      '& fieldset': {
                        borderColor: '#DC3545',
                      },
                    },
                    '& input': {
                      bgcolor: 'transparent',
                    },
                    '& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus, & input:-webkit-autofill:active': {
                      WebkitBoxShadow: '0 0 0 1000px #ffffff inset !important',
                      WebkitTextFillColor: '#182230 !important',
                      transition: 'background-color 5000s ease-in-out 0s',
                    },
                    '& input::placeholder': {
                      color: '#94A3B8',
                      opacity: 1,
                      fontSize: '0.875rem',
                    },
                  },
                  '& .MuiFormHelperText-root': {
                    color: '#DC3545',
                    fontSize: '0.75rem',
                    mt: 0.5,
                    ml: 0.5,
                  },
                }}
              />
            </Box>

            {/* Premium Royal Blue Sign In Button */}
            <Button
              id="login-submit"
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              endIcon={
                loading ? (
                  <CircularProgress size={18} sx={{ color: '#FFFFFF' }} />
                ) : (
                  <ArrowForwardRounded sx={{ fontSize: 18, transition: 'transform 0.2s ease' }} />
                )
              }
              sx={{
                height: 50,
                fontWeight: 600,
                fontSize: '0.95rem',
                letterSpacing: '-0.01em',
                bgcolor: '#315CF5',
                boxShadow: '0 4px 12px rgba(49, 92, 245, 0.25)',
                borderRadius: '10px',
                textTransform: 'none',
                color: '#FFFFFF',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                '&:hover': {
                  bgcolor: '#254EDB',
                  boxShadow: '0 8px 20px -2px rgba(49, 92, 245, 0.35)',
                  transform: 'translateY(-1px)',
                  '& .MuiButton-endIcon': {
                    transform: 'translateX(2px)',
                  },
                },
                '&:active': {
                  transform: 'translateY(1px) scale(0.99)',
                },
                '&:disabled': {
                  bgcolor: 'rgba(49, 92, 245, 0.6)',
                  color: '#FFFFFF',
                  cursor: 'not-allowed',
                },
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </Box>

          {/* Security Indicator Footer */}
          <Box
            sx={{
              mt: 3.5,
              pt: 2.5,
              borderTop: '1px solid #F1F5F9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: '#697586',
                fontSize: '0.75rem',
                fontWeight: 500,
                letterSpacing: '0.01em',
                textAlign: 'center',
              }}
            >
              Enterprise-Grade Security • RBAC Authorized
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
