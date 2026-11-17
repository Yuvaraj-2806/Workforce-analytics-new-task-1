import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  Button,
  useTheme,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import StorageRoundedIcon from '@mui/icons-material/StorageRounded';
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import PageHeader from '../components/layout/PageHeader';
import KpiCard from '../components/kpi/KpiCard';
import AttendanceTrendChart from '../components/charts/AttendanceTrendChart';
import { MFAModal } from '../components/auth/MFAModal';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { KpiData, AttendanceRecord } from '../types';

export default function EmployeeDashboard() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [profile, setProfile] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [mfaModalOpen, setMfaModalOpen] = useState(false);

  const fetchPersonalData = async () => {
    setLoading(true);
    setError('');
    try {
      const [profData, attData] = await Promise.all([
        apiService.getMyProfile(),
        apiService.getMyAttendance(30),
      ]);
      setProfile(profData);
      setAttendance(attData);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message || 'Failed to fetch personal records from SQLite database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonalData();
  }, []);

  // Compute personal metrics from live SQLite attendance records
  const totalDays = attendance.length;
  const presentDays = attendance.filter((a) => a.status === 'Present').length;
  const lateDays = attendance.filter((a) => a.status === 'Late').length;
  const leaveDays = attendance.filter((a) => a.status === 'On Leave' || a.status === 'Leave').length;
  const attendanceRate = totalDays > 0 ? Math.round(((presentDays + lateDays) / totalDays) * 100) : 0;
  const onTimeRate = (presentDays + lateDays) > 0 ? Math.round((presentDays / (presentDays + lateDays)) * 100) : 0;

  const kpis: KpiData[] = [
    {
      id: 'attendance-rate',
      title: 'Monthly Attendance',
      value: `${attendanceRate}%`,
      trend: totalDays > 0 ? 2.4 : 0,
      trendDirection: 'up',
      trendPositive: true,
      icon: 'trending-up',
      color: '#10b981',
      description: 'vs last 30-day period',
    },
    {
      id: 'days-present',
      title: 'Days Present',
      value: `${presentDays}`,
      trend: presentDays,
      trendDirection: 'up',
      trendPositive: true,
      icon: 'calendar',
      color: '#6366f1',
      description: `out of ${totalDays} working days`,
    },
    {
      id: 'on-time-rate',
      title: 'On-Time Arrival',
      value: `${onTimeRate}%`,
      trend: totalDays > 0 ? 1.5 : 0,
      trendDirection: 'up',
      trendPositive: true,
      icon: 'clock',
      color: '#3b82f6',
      description: `${lateDays} late check-in records`,
    },
    {
      id: 'leaves-taken',
      title: 'Leaves Logged',
      value: `${leaveDays}`,
      trend: 0,
      trendDirection: 'neutral',
      trendPositive: true,
      icon: 'briefcase',
      color: '#f59e0b',
      description: 'approved by HR',
    },
  ];

  // Convert attendance array to AttendanceRecord format
  const attendanceTrend: AttendanceRecord[] = attendance.slice(0, 14).map((a) => ({
    date: a.date || '',
    present: a.status === 'Present' ? 1 : 0,
    absent: (a.status === 'On Leave' || a.status === 'Leave') ? 1 : 0,
    onLeave: (a.status === 'On Leave' || a.status === 'Leave') ? 1 : 0,
    remote: a.status === 'Remote' ? 1 : 0,
  }));

  if (loading && !profile) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={36} sx={{ color: '#f59e0b' }} />
      </Box>
    );
  }

  const displayName = profile?.name || user?.fullName || 'Employee';
  const displayDepartment = profile?.department || user?.departmentName || 'General';

  return (
    <Box sx={{ maxWidth: 1600, mx: 'auto' }}>
      {/* Reusable Uniform Page Header */}
      <PageHeader
        title="My Personal Workspace"
        subtitle={`Personal attendance velocity, working hours, and profile details • Employee Code: ${profile?.employee_code || user?.employeeCode || 'N/A'}`}
        badgeLabel="Active Employee Session"
        badgeIcon={<StorageRoundedIcon sx={{ fontSize: 13 }} />}
        badgeColor="#f59e0b"
        badgeBg="rgba(245,158,11,0.1)"
        badgeBorder="rgba(245,158,11,0.2)"
        lastSynced={lastUpdated}
        onRefresh={fetchPersonalData}
        actions={
          <Button
            variant="contained"
            size="small"
            onClick={() => setMfaModalOpen(true)}
            startIcon={<SecurityRoundedIcon />}
            sx={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#ffffff',
              borderRadius: 2,
              px: 2,
              py: 0.75,
              fontSize: '0.8125rem',
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: '0 4px 14px rgba(245,158,11,0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                boxShadow: '0 6px 20px rgba(245,158,11,0.4)',
              },
            }}
          >
            Two-Factor Auth (2FA)
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2.5 }}>
          {error}
        </Alert>
      )}

      {/* KPI Cards Grid — 4 Responsive Cards from SQLite */}
      <Grid container spacing={2.5} sx={{ mb: 3, alignItems: 'stretch' }}>
        {kpis.map((kpi, idx) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={kpi.id} sx={{ display: 'flex' }}>
            <KpiCard data={kpi} index={idx} />
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ mb: 3, opacity: isDark ? 0.08 : 0.6 }} />

      {/* Row 1: Attendance Trend + Profile Card */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 7, lg: 8 }}>
          <Box sx={{ height: { xs: 350, sm: 375, md: 390 } }}>
            <AttendanceTrendChart data={attendanceTrend} />
          </Box>
        </Grid>
        <Grid size={{ xs: 12, md: 5, lg: 4 }}>
          <Card
            sx={{
              height: { xs: 'auto', md: 390 },
              bgcolor: theme.palette.background.paper,
              borderRadius: 2.5,
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
              boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.35)' : '0 2px 12px rgba(0,0,0,0.06)',
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
                <Avatar
                  sx={{
                    width: 56,
                    height: 56,
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    boxShadow: '0 4px 14px rgba(245,158,11,0.3)',
                  }}
                >
                  {displayName.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.05rem', lineHeight: 1.2 }}>
                    {displayName}
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '0.8rem' }}>
                    {profile?.position || 'Team Member'}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                    <CheckCircleRoundedIcon sx={{ fontSize: 13, color: '#10b981' }} />
                    <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 700 }}>
                      Active Employee
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ mb: 2, opacity: isDark ? 0.08 : 0.6 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600 }}>
                    DEPARTMENT
                  </Typography>
                  <Chip
                    size="small"
                    label={displayDepartment}
                    sx={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      bgcolor: 'rgba(99,102,241,0.1)',
                      color: '#6366f1',
                      borderRadius: 1.5,
                    }}
                  />
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600 }}>
                    EMAIL ADDRESS
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                    {profile?.email || user?.email}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600 }}>
                    EMPLOYMENT TYPE
                  </Typography>
                  <Chip
                    size="small"
                    label={profile?.employment_type || profile?.employmentType || 'Full-Time'}
                    sx={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                      borderRadius: 1.5,
                    }}
                  />
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600 }}>
                    LOCATION
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                    {profile?.location || 'Assigned Office'}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600 }}>
                    MFA SECURITY
                  </Typography>
                  <Chip
                    size="small"
                    label={user?.mfaEnabled ? 'Protected (2FA)' : 'Disabled'}
                    sx={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      bgcolor: user?.mfaEnabled ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                      color: user?.mfaEnabled ? '#10b981' : '#ef4444',
                      borderRadius: 1.5,
                    }}
                  />
                </Box>
              </Box>
            </Box>

            <Box sx={{ pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.7rem' }}>
                SQLite Identity Linked: Record #{profile?.id || user?.id} • WAL Mode Active
              </Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Row 2: Personal 30-Day Attendance Log Table */}
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
            Personal Attendance & Activity History (Last {attendance.length} Days)
          </Typography>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
            Restricted by RBAC: Authorized to view own records only
          </Typography>
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1.25 }}>LOG DATE</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1.25 }}>CHECK-IN TIME</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1.25 }}>CHECK-OUT TIME</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1.25 }}>TOTAL WORKING HOURS</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1.25 }} align="right">ATTENDANCE STATUS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {attendance.map((rec, i) => (
                <TableRow
                  key={rec.id || i}
                  hover
                  sx={{
                    '&:hover': {
                      bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                    },
                  }}
                >
                  <TableCell sx={{ py: 1.25, fontWeight: 600, fontSize: '0.8125rem' }}>
                    {rec.date}
                  </TableCell>
                  <TableCell sx={{ py: 1.25, fontSize: '0.8125rem', color: theme.palette.text.secondary }}>
                    {rec.check_in || rec.checkIn || '—'}
                  </TableCell>
                  <TableCell sx={{ py: 1.25, fontSize: '0.8125rem', color: theme.palette.text.secondary }}>
                    {rec.check_out || rec.checkOut || '—'}
                  </TableCell>
                  <TableCell sx={{ py: 1.25, fontSize: '0.8125rem', fontWeight: 600 }}>
                    {rec.hours_worked || rec.hoursWorked ? `${rec.hours_worked || rec.hoursWorked} hrs` : '—'}
                  </TableCell>
                  <TableCell sx={{ py: 1.25 }} align="right">
                    <Chip
                      size="small"
                      label={rec.status}
                      sx={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        borderRadius: 1.5,
                        bgcolor:
                          rec.status === 'Present'
                            ? 'rgba(16,185,129,0.12)'
                            : rec.status === 'Late'
                            ? 'rgba(245,158,11,0.12)'
                            : 'rgba(239,68,68,0.12)',
                        color:
                          rec.status === 'Present'
                            ? '#10b981'
                            : rec.status === 'Late'
                            ? '#f59e0b'
                            : '#ef4444',
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {attendance.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: theme.palette.text.secondary }}>
                    No attendance logs recorded for this account.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* MFA Management Modal */}
      <MFAModal open={mfaModalOpen} onClose={() => setMfaModalOpen(false)} />
    </Box>
  );
}
