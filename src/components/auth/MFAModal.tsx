import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Typography, Box, TextField, Alert, CircularProgress,
  Divider, IconButton, Paper
} from '@mui/material';
import { Security, CheckCircle, ContentCopy, Download, Close, Warning } from '@mui/icons-material';
import { authApi } from '../../services/authApi';
import { useAuth } from '../../context/AuthContext';
import type { MFASetupResponse } from '../../types/auth';

interface MFAModalProps {
  open: boolean;
  onClose: () => void;
}

export const MFAModal: React.FC<MFAModalProps> = ({ open, onClose }) => {
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState<'status' | 'setup' | 'disable'>('status');
  const [setupData, setSetupData] = useState<MFASetupResponse | null>(null);
  const [totpInput, setTotpInput] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (open) {
      setStep('status');
      setError('');
      setSuccessMsg('');
      setTotpInput('');
    }
  }, [open, user?.mfaEnabled]);

  const handleStartSetup = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await authApi.setupMFA();
      setSetupData(data);
      setStep('setup');
    } catch (err: any) {
      setError(err.message || 'Failed to start MFA setup');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmEnable = async () => {
    if (!totpInput.trim() || totpInput.length !== 6) {
      setError('Please enter the 6-digit code from Google Authenticator.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authApi.enableMFA(totpInput.trim());
      setSuccessMsg('Two-Factor Authentication is now enabled on your account!');
      await refreshUser();
      setStep('status');
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check the 6-digit code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisableMFA = async () => {
    if (!disablePassword || !disableCode) {
      setError('Please enter your account password and a verification code.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authApi.disableMFA(disablePassword, disableCode);
      setSuccessMsg('Two-Factor Authentication has been disabled.');
      await refreshUser();
      setStep('status');
      setDisablePassword('');
      setDisableCode('');
    } catch (err: any) {
      setError(err.message || 'Failed to disable MFA. Verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyRecoveryCodes = () => {
    if (!setupData?.recoveryCodes) return;
    navigator.clipboard.writeText(setupData.recoveryCodes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadRecoveryCodes = () => {
    if (!setupData?.recoveryCodes) return;
    const blob = new Blob([
      `STACKLY WORKFORCE ANALYTICS - BACKUP RECOVERY CODES\nAccount: ${user?.email}\nGenerated: ${new Date().toISOString()}\n\nEach code can be used ONCE if you lose your phone:\n\n${setupData.recoveryCodes.join('\n')}\n`
    ], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wfa-recovery-codes-${user?.email}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Security sx={{ color: user?.mfaEnabled ? '#10b981' : '#6366f1' }} />
          Multi-Factor Authentication (MFA)
        </Box>
        <IconButton onClick={onClose} size="small"><Close /></IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 2 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {successMsg && <Alert severity="success" sx={{ mb: 2 }}>{successMsg}</Alert>}

        {/* Status View */}
        {step === 'status' && (
          <Box>
            <Box
              sx={{
                p: 3,
                borderRadius: 2,
                bgcolor: user?.mfaEnabled ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                border: `1px solid ${user?.mfaEnabled ? '#10b981' : '#ef4444'}33`,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mb: 3,
              }}
            >
              {user?.mfaEnabled ? (
                <CheckCircle sx={{ fontSize: 36, color: '#10b981' }} />
              ) : (
                <Warning sx={{ fontSize: 36, color: '#ef4444' }} />
              )}
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {user?.mfaEnabled ? 'Two-Factor Authentication is Active' : 'Two-Factor Authentication is Disabled'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user?.mfaEnabled
                    ? 'Your account is secured with Google Authenticator (TOTP) and backup recovery codes.'
                    : 'Add an extra layer of security to prevent unauthorized access to your workforce analytics account.'}
                </Typography>
              </Box>
            </Box>

            {user?.mfaEnabled ? (
              <Box>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Remaining Unused Backup Recovery Codes: <strong>{user?.recoveryCodesRemaining ?? 8}</strong>
                </Typography>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => { setStep('disable'); setError(''); }}
                >
                  Disable Two-Factor Authentication
                </Button>
              </Box>
            ) : (
              <Button
                variant="contained"
                onClick={handleStartSetup}
                disabled={loading}
                sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' } }}
              >
                {loading ? <CircularProgress size={24} /> : 'Set Up Google Authenticator'}
              </Button>
            )}
          </Box>
        )}

        {/* Setup View */}
        {step === 'setup' && setupData && (
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              Step 1: Scan QR Code with Google Authenticator or Authy
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <Box
                component="img"
                src={setupData.qrCodeDataUrl}
                alt="MFA QR Code"
                sx={{ width: 180, height: 180, border: '2px solid #6366f1', borderRadius: 2, p: 1 }}
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              Step 2: Save Your Backup Recovery Codes
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
              Store these one-time codes safely. If you lose access to your authenticator app, each code can be used once to log in.
            </Typography>

            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover', mb: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
                {setupData.recoveryCodes.map((code, idx) => (
                  <Typography key={idx} sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem' }}>
                    {idx + 1}. {code}
                  </Typography>
                ))}
              </Box>
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Button size="small" startIcon={<ContentCopy />} onClick={handleCopyRecoveryCodes}>
                  {copied ? 'Copied!' : 'Copy Codes'}
                </Button>
                <Button size="small" startIcon={<Download />} onClick={handleDownloadRecoveryCodes}>
                  Download TXT
                </Button>
              </Box>
            </Paper>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              Step 3: Verify & Activate
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Enter the 6-digit code generated by your authenticator app:
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="123456"
              value={totpInput}
              onChange={(e) => setTotpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
              slotProps={{
                htmlInput: {
                  maxLength: 6,
                  style: { letterSpacing: 4, textAlign: 'center', fontWeight: 700, fontSize: '1.2rem' },
                },
              }}
            />
          </Box>
        )}

        {/* Disable View */}
        {step === 'disable' && (
          <Box>
            <Typography variant="body2" color="error" sx={{ mb: 2, fontWeight: 600 }}>
              Security Check: To disable MFA, you must enter your current password AND a valid verification code.
            </Typography>
            <TextField
              fullWidth
              type="password"
              size="small"
              label="Account Password"
              value={disablePassword}
              onChange={(e) => setDisablePassword(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              size="small"
              label="Current TOTP Code or Recovery Code"
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value)}
              sx={{ mb: 2 }}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        {step === 'setup' ? (
          <>
            <Button onClick={() => setStep('status')} disabled={loading}>Back</Button>
            <Button variant="contained" onClick={handleConfirmEnable} disabled={loading || totpInput.length !== 6}>
              {loading ? <CircularProgress size={20} /> : 'Confirm & Enable 2FA'}
            </Button>
          </>
        ) : step === 'disable' ? (
          <>
            <Button onClick={() => setStep('status')} disabled={loading}>Cancel</Button>
            <Button variant="contained" color="error" onClick={handleDisableMFA} disabled={loading}>
              {loading ? <CircularProgress size={20} /> : 'Confirm Disable'}
            </Button>
          </>
        ) : (
          <Button onClick={onClose}>Close</Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
