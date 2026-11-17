import { useState, useEffect } from 'react';
import {
  Box, Typography, Tabs, Tab, Card, CardContent, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip,
  Button, Select, MenuItem, FormControl, InputLabel, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid, useTheme,
} from '@mui/material';
import {
  SupervisorAccount, Security, Devices, Delete,
  CheckCircle, Edit,
} from '@mui/icons-material';
import PageHeader from '../components/layout/PageHeader';
import { authApi } from '../services/authApi';
import type { ManagedUser, AuditLogItem, SessionInfo, UserRole } from '../types/auth';
import { ROLE_COLORS, ROLE_LABELS } from '../types/auth';

export default function AdminPanel() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [tab, setTab] = useState(0);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Role change dialog
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('employee');
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const [usersData, logsData, sessionsData] = await Promise.all([
        authApi.getUsers(),
        authApi.getAuditLogs({ limit: 50 }),
        authApi.getSessions(),
      ]);
      setUsers(usersData);
      setAuditLogs(logsData.data);
      setSessions(sessionsData);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to fetch admin data' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRoleChangeSubmit = async () => {
    if (!selectedUser) return;
    try {
      await authApi.updateUserRole(selectedUser.id, newRole);
      setMessage({ type: 'success', text: `Role for ${selectedUser.email} updated to ${newRole}` });
      setRoleDialogOpen(false);
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update role' });
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await authApi.revokeSession(sessionId);
      setMessage({ type: 'success', text: 'Session successfully revoked' });
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to revoke session' });
    }
  };

  const handleLogoutAll = async () => {
    if (!window.confirm('Are you sure you want to terminate all active sessions? You will need to log back in.')) return;
    try {
      await authApi.logoutAll();
      window.location.href = '/login';
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to logout from all devices' });
    }
  };

  return (
    <Box sx={{ maxWidth: 1600, mx: 'auto' }}>
      {/* Reusable Uniform Page Header */}
      <PageHeader
        title="Admin Security & RBAC Center"
        subtitle="Centralized user role assignment, active multi-device session management, and system audit logs"
        badgeLabel="Superuser Authorized"
        badgeIcon={<Security sx={{ fontSize: 13 }} />}
        badgeColor="#ef4444"
        badgeBg="rgba(239,68,68,0.1)"
        badgeBorder="rgba(239,68,68,0.2)"
        lastSynced={new Date()}
        onRefresh={fetchData}
        refreshing={loading}
      />

      {message && (
        <Alert severity={message.type} sx={{ mb: 3, borderRadius: 2.5 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      {/* Top Metric Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              bgcolor: theme.palette.background.paper,
              borderRadius: 2.5,
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
              boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.35)' : '0 2px 12px rgba(0,0,0,0.06)',
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600 }}>
                TOTAL SYSTEM USERS
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: theme.palette.text.primary }}>
                {users.length}
              </Typography>
              <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 600 }}>
                100% SQLite Persisted
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              bgcolor: theme.palette.background.paper,
              borderRadius: 2.5,
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
              boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.35)' : '0 2px 12px rgba(0,0,0,0.06)',
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600 }}>
                ADMINISTRATORS & HR
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: '#ef4444' }}>
                {users.filter((u) => u.role === 'admin' || u.role === 'hr').length}
              </Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                High-privilege accounts
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              bgcolor: theme.palette.background.paper,
              borderRadius: 2.5,
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
              boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.35)' : '0 2px 12px rgba(0,0,0,0.06)',
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600 }}>
                MFA PROTECTED USERS
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: '#10b981' }}>
                {users.filter((u) => u.mfa_enabled === 1).length} / {users.length}
              </Typography>
              <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 600 }}>
                TOTP Authenticator active
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              bgcolor: theme.palette.background.paper,
              borderRadius: 2.5,
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
              boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.35)' : '0 2px 12px rgba(0,0,0,0.06)',
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600 }}>
                ACTIVE SESSIONS
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: '#3b82f6' }}>
                {sessions.length}
              </Typography>
              <Typography variant="caption" sx={{ color: '#3b82f6', fontWeight: 600 }}>
                Multi-device tokens tracked
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Navigation Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, val) => setTab(val)}
          sx={{
            '& .MuiTab-root': {
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '0.875rem',
            },
          }}
        >
          <Tab icon={<SupervisorAccount sx={{ fontSize: 18 }} />} iconPosition="start" label={`Users & Roles (${users.length})`} />
          <Tab icon={<Security sx={{ fontSize: 18 }} />} iconPosition="start" label={`Security Audit Logs (${auditLogs.length})`} />
          <Tab icon={<Devices sx={{ fontSize: 18 }} />} iconPosition="start" label={`Active Sessions (${sessions.length})`} />
        </Tabs>
      </Box>

      {/* Tab 0: User Management */}
      {tab === 0 && (
        <Card
          sx={{
            bgcolor: theme.palette.background.paper,
            borderRadius: 2.5,
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
            boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.35)' : '0 2px 12px rgba(0,0,0,0.06)',
            p: 2.5,
            mb: 3,
          }}
        >
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1.25 }}>USER / EMAIL</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1.25 }}>LINKED EMPLOYEE</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1.25 }}>DEPARTMENT</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1.25 }}>ROLE</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1.25 }}>MFA STATUS</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1.25 }}>ACCOUNT STATUS</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1.25 }}>ACTIONS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u) => (
                  <TableRow
                    key={u.id}
                    hover
                    sx={{
                      '&:hover': {
                        bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                      },
                    }}
                  >
                    <TableCell sx={{ py: 1.25 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                        {u.email}
                      </Typography>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.7rem' }}>
                        User ID: #{u.id}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.25, fontSize: '0.8125rem' }}>
                      {u.employee_code ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CheckCircle sx={{ fontSize: 14, color: '#10b981' }} />
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>Employee #{u.employee_code}</Typography>
                        </Box>
                      ) : (
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>System User</Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ py: 1.25, fontSize: '0.8125rem', color: theme.palette.text.secondary }}>
                      {u.department_name || 'All Departments'}
                    </TableCell>
                    <TableCell sx={{ py: 1.25 }}>
                      <Chip
                        label={ROLE_LABELS[u.role] || u.role}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.7rem',
                          borderRadius: 1.5,
                          bgcolor: `${ROLE_COLORS[u.role] || '#6366f1'}20`,
                          color: ROLE_COLORS[u.role] || '#6366f1',
                          border: `1px solid ${ROLE_COLORS[u.role] || '#6366f1'}40`,
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 1.25 }}>
                      <Chip
                        size="small"
                        label={u.mfa_enabled === 1 ? 'MFA Enabled' : 'Disabled'}
                        sx={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          borderRadius: 1.5,
                          bgcolor: u.mfa_enabled === 1 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                          color: u.mfa_enabled === 1 ? '#10b981' : '#ef4444',
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 1.25 }}>
                      <Chip
                        size="small"
                        label={u.is_active === 1 ? 'Active' : 'Locked'}
                        sx={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          borderRadius: 1.5,
                          bgcolor: u.is_active === 1 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                          color: u.is_active === 1 ? '#10b981' : '#ef4444',
                        }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.25 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Edit sx={{ fontSize: 14 }} />}
                        onClick={() => {
                          setSelectedUser(u);
                          setNewRole(u.role);
                          setRoleDialogOpen(true);
                        }}
                        sx={{
                          borderRadius: 1.5,
                          fontSize: '0.75rem',
                          textTransform: 'none',
                          fontWeight: 600,
                          py: 0.25,
                        }}
                      >
                        Change Role
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Tab 1: Audit Logs */}
      {tab === 1 && (
        <Card
          sx={{
            bgcolor: theme.palette.background.paper,
            borderRadius: 2.5,
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
            boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.35)' : '0 2px 12px rgba(0,0,0,0.06)',
            p: 2.5,
            mb: 3,
          }}
        >
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1.25 }}>TIMESTAMP</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1.25 }}>USER</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1.25 }}>ACTION</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1.25 }}>RESOURCE</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1.25 }}>IP ADDRESS</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1.25 }}>STATUS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {auditLogs.map((log) => (
                  <TableRow
                    key={log.id}
                    hover
                    sx={{
                      '&:hover': {
                        bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                      },
                    }}
                  >
                    <TableCell sx={{ py: 1.25, fontSize: '0.75rem', color: theme.palette.text.secondary }}>
                      {new Date(log.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell sx={{ py: 1.25, fontWeight: 600, fontSize: '0.8125rem' }}>
                      {log.email || (log.user_id ? `User #${log.user_id}` : 'System')}
                    </TableCell>
                    <TableCell sx={{ py: 1.25 }}>
                      <Chip
                        size="small"
                        label={log.action}
                        sx={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          borderRadius: 1.5,
                          bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 1.25, fontSize: '0.8125rem', color: theme.palette.text.secondary }}>
                      {log.resource || '-'}
                    </TableCell>
                    <TableCell sx={{ py: 1.25, fontSize: '0.75rem', color: theme.palette.text.secondary }}>
                      {log.ip_address}
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.25 }}>
                      <Chip
                        size="small"
                        label={log.status}
                        sx={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          borderRadius: 1.5,
                          bgcolor: log.status === 'SUCCESS' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                          color: log.status === 'SUCCESS' ? '#10b981' : '#ef4444',
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Tab 2: Active Sessions */}
      {tab === 2 && (
        <Card
          sx={{
            bgcolor: theme.palette.background.paper,
            borderRadius: 2.5,
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
            boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.35)' : '0 2px 12px rgba(0,0,0,0.06)',
            p: 2.5,
            mb: 3,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>
              All Active Platform Sessions
            </Typography>
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={handleLogoutAll}
              startIcon={<Delete sx={{ fontSize: 14 }} />}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              Terminate All Sessions
            </Button>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1.25 }}>DEVICE / CLIENT</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1.25 }}>IP ADDRESS</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1.25 }}>CREATED AT</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1.25 }}>LAST ACTIVE</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1.25 }}>STATUS</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1.25 }}>ACTION</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sessions.map((s) => (
                  <TableRow
                    key={s.id}
                    hover
                    sx={{
                      '&:hover': {
                        bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                      },
                    }}
                  >
                    <TableCell sx={{ py: 1.25 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                        {s.device || s.user_agent || 'Desktop Browser'}
                      </Typography>
                      {s.is_current && (
                        <Chip
                          size="small"
                          label="Current Device"
                          sx={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            height: 18,
                            bgcolor: 'rgba(16,185,129,0.12)',
                            color: '#10b981',
                            borderRadius: 1,
                            mt: 0.25,
                          }}
                        />
                      )}
                    </TableCell>
                    <TableCell sx={{ py: 1.25, fontSize: '0.8125rem', color: theme.palette.text.secondary }}>
                      {s.ip_address}
                    </TableCell>
                    <TableCell sx={{ py: 1.25, fontSize: '0.75rem', color: theme.palette.text.secondary }}>
                      {new Date(s.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell sx={{ py: 1.25, fontSize: '0.75rem', color: theme.palette.text.secondary }}>
                      {new Date(s.last_active_at).toLocaleString()}
                    </TableCell>
                    <TableCell sx={{ py: 1.25 }}>
                      <Chip
                        size="small"
                        label="Active"
                        sx={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          borderRadius: 1.5,
                          bgcolor: 'rgba(16,185,129,0.12)',
                          color: '#10b981',
                        }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.25 }}>
                      {!s.is_current && (
                        <Button
                          size="small"
                          color="error"
                          onClick={() => handleRevokeSession(s.session_id)}
                          sx={{ fontSize: '0.75rem', textTransform: 'none', fontWeight: 600 }}
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
        </Card>
      )}

      {/* Role Assignment Dialog */}
      <Dialog open={roleDialogOpen} onClose={() => setRoleDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Assign User Role</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Update the RBAC role for <strong>{selectedUser?.email}</strong>. This takes effect immediately in SQLite.
          </Typography>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Role</InputLabel>
            <Select value={newRole} label="Role" onChange={(e) => setNewRole(e.target.value as UserRole)}>
              <MenuItem value="admin">Administrator (Full Access)</MenuItem>
              <MenuItem value="hr">HR Specialist (All Employees & Attendance)</MenuItem>
              <MenuItem value="manager">Department Manager (Assigned Dept Only)</MenuItem>
              <MenuItem value="team_lead">Team Lead (Team Only)</MenuItem>
              <MenuItem value="employee">Employee (Own Profile Only)</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setRoleDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleRoleChangeSubmit}>Save Role</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
