import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, TextField, Button,
  Alert, CircularProgress, Link, Tabs, Tab,
} from '@mui/material';
import {
  SecurityRounded,
  KeyRounded,
  ArrowBackRounded,
  VpnKeyRounded,
  ErrorOutlineRounded,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

export default function MFAPage() {
  const navigate = useNavigate();
  const { verifyMFA, pendingMFA } = useAuth();

  const [tab, setTab] = useState<'totp' | 'recovery'>('totp');
  const [totpDigits, setTotpDigits] = useState(['', '', '', '', '', '']);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // If no pending MFA, redirect back to login
  useEffect(() => {
    if (!pendingMFA) {
      navigate('/login', { replace: true });
    }
  }, [pendingMFA, navigate]);

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...totpDigits];
    newDigits[index] = value.slice(-1);
    setTotpDigits(newDigits);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (newDigits.every((d) => d !== '') && index === 5) {
      handleVerify(newDigits.join(''), false);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !totpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (paste.length === 6) {
      const newDigits = paste.split('');
      setTotpDigits(newDigits);
      handleVerify(paste, false);
    }
  };

  const handleVerify = async (code: string, isRecovery: boolean) => {
    if (!code) {
      setError(isRecovery ? 'Please enter a backup recovery code.' : 'Please enter the 6-digit code.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await verifyMFA(code, isRecovery);
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message || 'MFA verification failed. Please try again.');
      if (!isRecovery) {
        setTotpDigits(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
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
        background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99, 102, 241, 0.18), transparent 70%), #070b14',
        position: 'relative',
        overflow: 'hidden',
        p: { xs: 2, sm: 3 },
      }}
    >
      {/* Ambient background glow orbs */}
      <Box
        sx={{
          position: 'absolute',
          top: '-15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: { xs: 450, sm: 700 },
          height: { xs: 450, sm: 700 },
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.14) 0%, rgba(139, 92, 246, 0.06) 40%, transparent 70%)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
          animation: 'ambientFloat 14s ease-in-out infinite alternate',
          '@keyframes ambientFloat': {
            '0%': { transform: 'translateX(-50%) translateY(0)' },
            '100%': { transform: 'translateX(-50%) translateY(35px)' },
          },
          '@media (prefers-reduced-motion: reduce)': {
            animation: 'none',
          },
        }}
      />

      {/* Centered MFA Card */}
      <Card
        elevation={0}
        sx={{
          maxWidth: 440,
          width: '100%',
          background: 'linear-gradient(180deg, rgba(19, 27, 46, 0.82) 0%, rgba(11, 17, 32, 0.94) 100%)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(99, 102, 241, 0.15)',
          borderRadius: 4,
          p: { xs: 3, sm: 4.5 },
          position: 'relative',
          zIndex: 1,
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.98)',
          transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
          '@media (prefers-reduced-motion: reduce)': {
            transition: 'none',
            transform: 'none',
            opacity: 1,
          },
        }}
      >
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          {/* Header */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #4f46e5 100%)',
                boxShadow: '0 8px 24px -4px rgba(99, 102, 241, 0.55)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
              }}
            >
              <SecurityRounded sx={{ color: '#ffffff', fontSize: 26 }} />
            </Box>

            <Typography
              variant="h5"
              component="h1"
              sx={{
                color: '#f8fafc',
                fontWeight: 700,
                fontSize: { xs: '1.35rem', sm: '1.45rem' },
                letterSpacing: '-0.025em',
                lineHeight: 1.25,
                mb: 0.75,
              }}
            >
              Two-Factor Authentication
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: '#94a3b8',
                fontSize: '0.85rem',
                fontWeight: 400,
                letterSpacing: '-0.01em',
              }}
            >
              Signing in as <span style={{ color: '#a5b4fc', fontWeight: 600 }}>{pendingMFA?.email}</span>
            </Typography>
          </Box>

          {/* Mode Tabs */}
          <Tabs
            value={tab}
            onChange={(_, val) => {
              setTab(val);
              setError('');
            }}
            centered
            sx={{
              mb: 3,
              minHeight: 38,
              '& .MuiTabs-indicator': {
                bgcolor: '#818cf8',
                height: 2,
                borderRadius: 1,
              },
              '& .MuiTab-root': {
                color: '#64748b',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.8125rem',
                minHeight: 38,
                py: 0.5,
                px: 1.5,
                transition: 'color 0.2s ease',
                '&.Mui-selected': { color: '#c7d2fe' },
              },
            }}
          >
            <Tab
              icon={<KeyRounded sx={{ fontSize: 16 }} />}
              iconPosition="start"
              label="Authenticator"
              value="totp"
            />
            <Tab
              icon={<VpnKeyRounded sx={{ fontSize: 16 }} />}
              iconPosition="start"
              label="Recovery Code"
              value="recovery"
            />
          </Tabs>

          {/* Error Alert */}
          {error && (
            <Alert
              severity="error"
              icon={<ErrorOutlineRounded sx={{ color: '#f87171', fontSize: 20 }} />}
              sx={{
                mb: 3,
                bgcolor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: 2,
                color: '#fca5a5',
                fontSize: '0.84rem',
                py: 0.8,
                px: 1.5,
                animation: 'alertSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                '@keyframes alertSlideIn': {
                  from: { opacity: 0, transform: 'translateY(-6px)' },
                  to: { opacity: 1, transform: 'translateY(0)' },
                },
              }}
            >
              {error}
            </Alert>
          )}

          {tab === 'totp' ? (
            <Box>
              <Typography
                variant="body2"
                sx={{
                  color: '#94a3b8',
                  textAlign: 'center',
                  fontSize: '0.825rem',
                  mb: 2.5,
                }}
              >
                Enter the 6-digit code from your authenticator app
              </Typography>

              {/* 6-digit inputs */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: { xs: 1, sm: 1.25 },
                  mb: 3,
                }}
                onPaste={handlePaste}
              >
                {totpDigits.map((digit, i) => (
                  <TextField
                    key={i}
                    inputRef={(el) => (inputRefs.current[i] = el)}
                    value={digit}
                    onChange={(e) => handleDigitChange(i, e.target.value)}
                    onKeyDown={(e: any) => handleKeyDown(i, e)}
                    slotProps={{
                      htmlInput: {
                        maxLength: 1,
                        style: {
                          textAlign: 'center',
                          fontSize: '1.4rem',
                          fontWeight: 700,
                          padding: '10px 0',
                          color: '#f8fafc',
                          fontFamily: 'monospace',
                        },
                      },
                    }}
                    sx={{
                      width: { xs: 44, sm: 48 },
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'rgba(15, 23, 42, 0.65)',
                        borderRadius: 2,
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        '& fieldset': {
                          borderColor: digit ? 'rgba(99, 102, 241, 0.6)' : 'rgba(148, 163, 184, 0.16)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(99, 102, 241, 0.5)',
                        },
                        '&.Mui-focused': {
                          boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.25)',
                          '& fieldset': {
                            borderColor: '#818cf8',
                            borderWidth: '1.5px',
                          },
                        },
                      },
                    }}
                  />
                ))}
              </Box>

              <Button
                fullWidth
                variant="contained"
                disabled={loading || totpDigits.some((d) => !d)}
                onClick={() => handleVerify(totpDigits.join(''), false)}
                sx={{
                  py: 1.35,
                  fontWeight: 600,
                  fontSize: '0.925rem',
                  letterSpacing: '-0.01em',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #7c3aed 100%)',
                  boxShadow: '0 8px 22px -4px rgba(99, 102, 241, 0.5), 0 0 0 1px rgba(129, 140, 248, 0.25)',
                  borderRadius: 2,
                  textTransform: 'none',
                  color: '#ffffff',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #6d28d9 100%)',
                    boxShadow: '0 10px 28px -4px rgba(99, 102, 241, 0.65)',
                    transform: 'translateY(-1px)',
                  },
                  '&:active': {
                    transform: 'translateY(1px) scale(0.99)',
                  },
                  '&:disabled': {
                    opacity: 0.65,
                    cursor: 'not-allowed',
                  },
                }}
              >
                {loading ? <CircularProgress size={20} sx={{ color: '#ffffff' }} /> : 'Verify & Continue'}
              </Button>
            </Box>
          ) : (
            <Box>
              <Typography
                variant="body2"
                sx={{
                  color: '#94a3b8',
                  textAlign: 'center',
                  fontSize: '0.825rem',
                  mb: 2,
                }}
              >
                Enter one of your 8-character one-time backup recovery codes
              </Typography>
              <TextField
                fullWidth
                placeholder="e.g. A3F8-9BC2"
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    height: 46,
                    bgcolor: 'rgba(15, 23, 42, 0.65)',
                    borderRadius: 2,
                    color: '#f8fafc',
                    fontFamily: 'monospace',
                    fontSize: '1rem',
                    letterSpacing: '0.1em',
                    textAlign: 'center',
                    '& fieldset': {
                      borderColor: 'rgba(148, 163, 184, 0.16)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(99, 102, 241, 0.5)',
                    },
                    '&.Mui-focused': {
                      boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.25)',
                      '& fieldset': {
                        borderColor: '#818cf8',
                      },
                    },
                  },
                }}
              />
              <Button
                fullWidth
                variant="contained"
                disabled={loading || !recoveryCode.trim()}
                onClick={() => handleVerify(recoveryCode, true)}
                sx={{
                  py: 1.35,
                  fontWeight: 600,
                  fontSize: '0.925rem',
                  letterSpacing: '-0.01em',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #7c3aed 100%)',
                  boxShadow: '0 8px 22px -4px rgba(99, 102, 241, 0.5)',
                  borderRadius: 2,
                  textTransform: 'none',
                  color: '#ffffff',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #6d28d9 100%)',
                    transform: 'translateY(-1px)',
                  },
                  '&:disabled': {
                    opacity: 0.65,
                    cursor: 'not-allowed',
                  },
                }}
              >
                {loading ? <CircularProgress size={20} sx={{ color: '#ffffff' }} /> : 'Use Recovery Code'}
              </Button>
            </Box>
          )}

          {/* Back to login */}
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Link
              component="button"
              variant="body2"
              onClick={() => navigate('/login')}
              sx={{
                color: '#94a3b8',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                fontSize: '0.8125rem',
                fontWeight: 500,
                transition: 'color 0.15s ease',
                '&:hover': { color: '#c7d2fe' },
              }}
            >
              <ArrowBackRounded sx={{ fontSize: 16 }} /> Back to Login
            </Link>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
