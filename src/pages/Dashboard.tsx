import React, { useState } from 'react';
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
import StorageRoundedIcon from '@mui/icons-material/StorageRounded';
import KpiCard from '../components/kpi/KpiCard';
import AttendanceTrendChart from '../components/charts/AttendanceTrendChart';
import DepartmentDistributionChart from '../components/charts/DepartmentDistributionChart';
import WorkforceDonutChart from '../components/charts/WorkforceDonutChart';
import RecentActivityTable from '../components/tables/RecentActivityTable';
import FilterBar from '../components/filters/FilterBar';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import { useDashboardData } from '../hooks/useDashboardData';

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const {
    dataState,
    errorMessage,
    filters,
    setFilters,
    filterOptions,
    lastUpdated,
    selectedSegment,
    handleSegmentSelect,
    kpis,
    attendanceTrend,
    departmentData,
    workforceSegments,
    totalWorkforce,
    employees,
    totalEmployees,
    page,
    rowsPerPage,
    sortBy,
    sortOrder,
    searchQuery,
    handleSearchChange,
    setPage,
    setRowsPerPage,
    handleSortChange,
    handleResetFilters,
    refresh,
    exportCSV,
  } = useDashboardData();

  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  const handleRefreshClick = () => {
    refresh();
    setSnackbarMessage('Metrics updated from SQLite database.');
  };

  const handleExportCSVClick = () => {
    setExportAnchorEl(null);
    exportCSV();
    setSnackbarMessage('Workforce data exported to CSV successfully.');
  };

  const handleExportPDFClick = () => {
    setExportAnchorEl(null);
    window.print();
  };

  if (dataState === 'loading') return <LoadingState />;
  if (dataState === 'error') {
    return <ErrorState message={errorMessage || undefined} onRetry={refresh} />;
  }

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
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                bgcolor: 'rgba(16,185,129,0.1)',
                color: '#10b981',
                border: '1px solid rgba(16,185,129,0.2)',
                borderRadius: 1.5,
                px: 1,
                py: 0.2,
                fontSize: '0.72rem',
                fontWeight: 700,
              }}
            >
              <StorageRoundedIcon sx={{ fontSize: 13 }} />
              SQLite Connected
            </Box>
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
            onClick={handleRefreshClick}
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
            <MenuItem onClick={handleExportCSVClick} sx={{ py: 1, borderRadius: 1.5, fontSize: '0.85rem' }}>
              <ListItemIcon sx={{ minWidth: 30, color: '#10b981' }}>
                <TableChartRoundedIcon fontSize="small" />
              </ListItemIcon>
              Export as CSV
            </MenuItem>
            <MenuItem onClick={handleExportPDFClick} sx={{ py: 1, borderRadius: 1.5, fontSize: '0.85rem' }}>
              <ListItemIcon sx={{ minWidth: 30, color: '#ef4444' }}>
                <PictureAsPdfRoundedIcon fontSize="small" />
              </ListItemIcon>
              Print / Save PDF
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        onChange={setFilters}
        filterOptions={filterOptions}
      />

      {/* KPI Cards Grid — 5 Responsive Cards from SQLite */}
      <Grid container spacing={2.5} sx={{ mb: 3, alignItems: 'stretch' }}>
        {kpis.map((kpi, idx) => {
          const isSelected =
            (kpi.id === 'present' && filters.status === 'Active') ||
            (kpi.id === 'on-leave' && filters.status === 'On Leave');

          const handleCardClick = () => {
            if (kpi.id === 'present') {
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
              total={totalWorkforce}
              selectedSegment={selectedSegment}
              onSegmentSelect={(segment) => {
                handleSegmentSelect(segment);
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
            <DepartmentDistributionChart data={departmentData} />
          </Box>
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          <RecentActivityTable
            data={employees}
            total={totalEmployees}
            page={page}
            rowsPerPage={rowsPerPage}
            sortBy={sortBy}
            sortOrder={sortOrder}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            onPageChange={setPage}
            onRowsPerPageChange={setRowsPerPage}
            onSortChange={handleSortChange}
            activeEmploymentFilter={selectedSegment}
            onClearEmploymentFilter={() => handleSegmentSelect(null)}
            onResetAllFilters={handleResetFilters}
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
