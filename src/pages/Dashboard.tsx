import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Grid,
  Typography,
  Button,
  useTheme,
  Divider,
  Snackbar,
  Alert,
  Menu,
  MenuItem,
  ListItemIcon,
} from '@mui/material';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded';
import TableChartRoundedIcon from '@mui/icons-material/TableChartRounded';
import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import KpiCard from '../components/kpi/KpiCard';
import AttendanceTrendChart from '../components/charts/AttendanceTrendChart';
import DepartmentDistributionChart from '../components/charts/DepartmentDistributionChart';
import WorkforceDonutChart from '../components/charts/WorkforceDonutChart';
import RecentActivityTable from '../components/tables/RecentActivityTable';
import FilterBar from '../components/filters/FilterBar';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import {
  kpiData,
  attendanceTrend,
  departmentData,
  workforceSegments,
  recentActivity,
} from '../data/mockData';
import type { DataState, FilterState } from '../types';

const TOTAL_WORKFORCE = workforceSegments.reduce((s, d) => s + d.value, 0);

const DEFAULT_FILTERS: FilterState = {
  dateFrom: '',
  dateTo: '',
  department: [],
  location: '',
  status: 'All',
};

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [dataState, setDataState] = useState<DataState>('loading');
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const [workforceSegmentFilter, setWorkforceSegmentFilter] = useState<string | null>(null);

  // Simulate initial data load
  useEffect(() => {
    const timer = setTimeout(() => setDataState('success'), 1200);
    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = () => {
    setDataState('loading');
    setTimeout(() => {
      setDataState('success');
      setLastUpdated(new Date());
      setSnackbarMessage('Dashboard metrics synchronized successfully.');
    }, 1000);
  };

  const handleExportCSV = () => {
    setExportAnchorEl(null);
    const headers = ['ID', 'Name', 'Department', 'Location', 'Action', 'Status', 'Timestamp'];
    const rows = filteredActivity.map((a) => [
      a.id,
      `"${a.name}"`,
      `"${a.department}"`,
      `"${a.location}"`,
      `"${a.action}"`,
      `"${a.status}"`,
      `"${a.timestamp}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `stackly-workforce-analytics-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSnackbarMessage('Stackly workforce report exported to CSV successfully.');
  };

  const handleExportPDF = () => {
    setExportAnchorEl(null);
    window.print();
  };

  // Filter activity data
  const filteredActivity = useMemo(() => {
    let data = [...recentActivity];
    if (filters.department.length > 0) {
      data = data.filter((e) => filters.department.includes(e.department));
    }
    if (filters.location && filters.location !== 'All Locations') {
      data = data.filter((e) => e.location === filters.location);
    }
    if (filters.status && filters.status !== 'All') {
      data = data.filter((e) => {
        const s = e.status;
        if (filters.status === 'Active') return s === 'active';
        if (filters.status === 'On Leave') return s === 'on-leave';
        if (filters.status === 'Remote') return s === 'remote';
        if (filters.status === 'Inactive') return s === 'inactive';
        return true;
      });
    }
    if (workforceSegmentFilter) {
      data = data.filter((e) => e.employmentType === workforceSegmentFilter);
    }
    return data;
  }, [filters, workforceSegmentFilter]);

  // Filter department data
  const filteredDepts = useMemo(() => {
    if (filters.department.length === 0) return departmentData;
    return departmentData.filter((d) => filters.department.includes(d.department));
  }, [filters.department]);

  if (dataState === 'loading') return <LoadingState />;
  if (dataState === 'error') return <ErrorState onRetry={handleRefresh} />;

  return (
    <Box sx={{ maxWidth: 1600, mx: 'auto' }}>
      {/* Page Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          mb: 3,
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5, flexWrap: 'wrap' }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                color: theme.palette.text.primary,
                letterSpacing: '-0.02em',
                fontSize: { xs: '1.25rem', sm: '1.5rem' },
              }}
            >
              Workforce Intelligence Overview
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '0.825rem' }}>
              Real-time headcount, attendance velocity, and departmental allocation
            </Typography>
            <Box
              sx={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                bgcolor: theme.palette.text.secondary,
                opacity: 0.4,
                display: { xs: 'none', sm: 'block' },
              }}
            />
            <Typography
              variant="caption"
              sx={{ color: theme.palette.text.secondary, fontSize: '0.75rem', fontWeight: 500 }}
            >
              Last synced: {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </Typography>
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1.25, flexShrink: 0 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AutorenewRoundedIcon sx={{ fontSize: 18 }} />}
            onClick={handleRefresh}
            sx={{
              borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
              color: theme.palette.text.primary,
              height: 38,
              px: 2,
              borderRadius: 2,
              fontWeight: 600,
              fontSize: '0.8125rem',
              '&:hover': {
                borderColor: '#6366f1',
                color: '#6366f1',
                bgcolor: 'rgba(99,102,241,0.06)',
              },
            }}
          >
            Refresh
          </Button>

          <Button
            variant="contained"
            size="small"
            startIcon={<DownloadRoundedIcon sx={{ fontSize: 18 }} />}
            onClick={(e) => setExportAnchorEl(e.currentTarget)}
            sx={{
              height: 38,
              px: 2.25,
              borderRadius: 2,
              fontWeight: 700,
              fontSize: '0.8125rem',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
              '&:hover': {
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                boxShadow: '0 6px 20px rgba(99,102,241,0.5)',
              },
            }}
          >
            Export Report
          </Button>

          <Menu
            anchorEl={exportAnchorEl}
            open={Boolean(exportAnchorEl)}
            onClose={() => setExportAnchorEl(null)}
            slotProps={{
              paper: {
                sx: {
                  mt: 1,
                  width: 180,
                  borderRadius: 2.5,
                  boxShadow: isDark
                    ? '0 10px 30px rgba(0,0,0,0.6)'
                    : '0 10px 30px rgba(0,0,0,0.1)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                  bgcolor: isDark ? '#111827' : '#ffffff',
                  p: 0.5,
                },
              },
            }}
          >
            <MenuItem onClick={handleExportCSV} sx={{ py: 1, borderRadius: 1.5, fontSize: '0.85rem' }}>
              <ListItemIcon sx={{ minWidth: 30, color: '#10b981' }}>
                <TableChartRoundedIcon fontSize="small" />
              </ListItemIcon>
              Export as CSV
            </MenuItem>
            <MenuItem onClick={handleExportPDF} sx={{ py: 1, borderRadius: 1.5, fontSize: '0.85rem' }}>
              <ListItemIcon sx={{ minWidth: 30, color: '#ef4444' }}>
                <PictureAsPdfRoundedIcon fontSize="small" />
              </ListItemIcon>
              Print / Save PDF
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* Filter Bar */}
      <FilterBar filters={filters} onChange={setFilters} />

      {/* KPI Cards Grid — Unified Equal Height & Interactive Control Pods */}
      <Grid container spacing={2.5} sx={{ mb: 3, alignItems: 'stretch' }}>
        {kpiData.map((kpi, idx) => {
          const isSelected =
            (kpi.id === 'present-today' && filters.status === 'Active') ||
            (kpi.id === 'on-leave' && filters.status === 'On Leave');

          const handleCardClick = () => {
            if (kpi.id === 'present-today') {
              setFilters((prev) => ({
                ...prev,
                status: prev.status === 'Active' ? 'All' : 'Active',
              }));
            } else if (kpi.id === 'on-leave') {
              setFilters((prev) => ({
                ...prev,
                status: prev.status === 'On Leave' ? 'All' : 'On Leave',
              }));
            } else if (kpi.id === 'total-employees') {
              setFilters((prev) => ({ ...prev, status: 'All' }));
            }
          };

          return (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }} key={kpi.id} sx={{ display: 'flex' }}>
              <KpiCard
                data={kpi}
                index={idx}
                selected={isSelected}
                onClick={handleCardClick}
              />
            </Grid>
          );
        })}
      </Grid>

      <Divider sx={{ mb: 3, opacity: isDark ? 0.08 : 0.6 }} />

      {/* Charts Row 1: Attendance Trend + Donut */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 7, lg: 8 }}>
          <Box sx={{ height: { xs: 350, sm: 375, md: 390 } }}>
            <AttendanceTrendChart data={attendanceTrend} />
          </Box>
        </Grid>
        <Grid size={{ xs: 12, md: 5, lg: 4 }}>
          <Box sx={{ height: { xs: 365, sm: 375, md: 390 } }}>
            <WorkforceDonutChart
              data={workforceSegments}
              total={TOTAL_WORKFORCE}
              selectedSegment={workforceSegmentFilter}
              onSegmentSelect={(segment) => {
                setWorkforceSegmentFilter(segment);
                if (segment) {
                  setSnackbarMessage(`Displaying related records for ${segment} workforce.`);
                }
              }}
            />
          </Box>
        </Grid>
      </Grid>

      {/* Charts Row 2: Department Bar + Activity Table */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Box sx={{ height: 520 }}>
            <DepartmentDistributionChart data={filteredDepts} />
          </Box>
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          <RecentActivityTable
            data={filteredActivity}
            activeEmploymentFilter={workforceSegmentFilter}
            onClearEmploymentFilter={() => setWorkforceSegmentFilter(null)}
          />
        </Grid>
      </Grid>

      {/* Snackbar Notification Toast */}
      <Snackbar
        open={Boolean(snackbarMessage)}
        autoHideDuration={3000}
        onClose={() => setSnackbarMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarMessage(null)}
          severity="success"
          icon={<CheckCircleRoundedIcon fontSize="inherit" />}
          sx={{
            borderRadius: 2.5,
            boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
            fontWeight: 600,
            fontSize: '0.85rem',
            bgcolor: isDark ? '#111827' : '#ffffff',
            color: theme.palette.text.primary,
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
            '& .MuiAlert-icon': { color: '#10b981' },
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Dashboard;
