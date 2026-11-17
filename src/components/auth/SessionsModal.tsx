import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Typography, Box, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, IconButton, Alert, CircularProgress,
} from '@mui/material';
import { Devices, Close, DeleteOutlined, PhoneIphone, Computer } from '@mui/icons-material';
import { authApi } from '../../services/authApi';
import type { SessionInfo } from '../../types/auth';

interface SessionsModalProps {
  open: boolean;
  onClose: () => void;
}

export const SessionsModal: React.FC<SessionsModalProps> = ({ open, onClose }) => {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadSessions = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await authApi.getSessions();
      setSessions(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load active sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadSessions();
      setSuccess('');
    }
  }, [open]);

  const handleRevoke = async (sessionId: string) => {
    try {
      await authApi.revokeSession(sessionId);
      setSuccess('Session revoked successfully.');
      loadSessions();
    } catch (err: any) {
      setError(err.message || 'Failed to revoke session');
    }
  };

  const handleLogoutAll = async () => {
    if (!window.confirm('This will log you out from all devices including this one. Continue?')) return;
    try {
      await authApi.logoutAll();
      window.location.href = '/login';
    } catch (err: any) {
      setError(err.message || 'Failed to logout from all devices');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Devices sx={{ color: 'primary.main' }} />
          Active Sessions & Devices
        </Box>
        <IconButton onClick={onClose} size="small"><Close /></IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ m: 2 }}>{success}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Device / Browser</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>IP Address</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Last Activity</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Session Expiration</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sessions.map((s) => (
                  <TableRow key={s.session_id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {s.device?.includes('Mobile') ? (
                          <PhoneIphone sx={{ color: 'text.secondary', fontSize: 20 }} />
                        ) : (
                          <Computer sx={{ color: 'text.secondary', fontSize: 20 }} />
                        )}
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {s.device || 'Web Browser'}
                            {s.is_current && (
                              <Chip label="Current Device" size="small" color="primary" sx={{ ml: 1, height: 20, fontSize: 10 }} />
                            )}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {s.session_id.slice(0, 8)}...
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{s.ip_address || '127.0.0.1'}</TableCell>
                    <TableCell>{new Date(s.last_active_at).toLocaleString()}</TableCell>
                    <TableCell>{new Date(s.expires_at).toLocaleDateString()}</TableCell>
                    <TableCell align="right">
                      {!s.is_current && (
                        <Button
                          size="small"
                          color="error"
                          variant="outlined"
                          onClick={() => handleRevoke(s.session_id)}
                        >
                          Revoke
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
        <Button
          color="error"
          variant="outlined"
          startIcon={<DeleteOutlined />}
          onClick={handleLogoutAll}
        >
          Log Out from All Devices
        </Button>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
