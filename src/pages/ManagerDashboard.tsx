import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Button,
  useTheme,
  Alert,
  Divider,
} from '@mui/material';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import PageHeader from '../components/layout/PageHeader';
import KpiCard from '../components/kpi/KpiCard';
import AttendanceTrendChart from '../components/charts/AttendanceTrendChart';
import WorkforceDonutChart from '../components/charts/WorkforceDonutChart';
import RecentActivityTable from '../components/tables/RecentActivityTable';
import LoadingState from '../components/common/LoadingState';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { KpiData, AttendanceRecord, WorkforceSegment, EmployeeActivity, FilterState } from '../types';

export default function ManagerDashboard() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [kpis, setKpis] = useState<KpiData[]>([]);
  const [attendanceTrend, setAttendanceTrend] = useState<AttendanceRecord[]>([]);
  const [workforceSegments, setWorkforceSegments] = useState<WorkforceSegment[]>([]);
  const [totalWorkforce, setTotalWorkforce] = useState(0);
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);

  // Employee Table state
  const [employees, setEmployees] = useState<EmployeeActivity[]>([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSortChange = (column: string) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const departmentName = user?.departmentName || 'Department';

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const filter: FilterState = {
        dateFrom: '',
        dateTo: '',
        department: user?.departmentName ? [user.departmentName] : [],
        location: '',
        status: '',
        employmentType: selectedSegment || undefined,
      };

      const [kpiRes, trendRes, segmentsRes, empRes] = await Promise.all([
        apiService.getKpis(filter),
        apiService.getAttendanceTrend(14, filter),
        apiService.getWorkforceSegments(filter),
        apiService.getEmployees({
          filters: filter,
          search: searchQuery,
          page: page + 1,
          limit: rowsPerPage,
          sortBy,
          sortOrder,
        }),
      ]);

      setKpis(kpiRes);
      setAttendanceTrend(trendRes);
      setWorkforceSegments(segmentsRes.data);
      setTotalWorkforce(segmentsRes.total);
      setEmployees(empRes.items);
      setTotalEmployees(empRes.total);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message || 'Failed to load manager dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, rowsPerPage, sortBy, sortOrder, searchQuery, selectedSegment]);

  const exportDepartmentCSV = () => {
    if (!employees.length) return;
    const headers = ['ID', 'Name', 'Department', 'Role', 'Status', 'Location', 'Employment Type'];
    const rows = employees.map((m) => [
      m.id,
      `"${m.name}"`,
      `"${m.department}"`,
      `"${m.role || 'Staff'}"`,
      m.status,
      `"${m.location}"`,
      m.employmentType || 'Full-time',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${departmentName.toLowerCase().replace(/\s+/g, '_')}_department_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && !kpis.length) {
    return <LoadingState />;
  }

  return (
    <Box sx={{ maxWidth: 1600, mx: 'auto' }}>
      {/* Uniform Page Header */}
      <PageHeader
        title="Department Operations Overview"
        subtitle={`Real-time team headcount, attendance velocity, and departmental allocation • Scope: Manager`}
        badgeLabel={user?.departmentName ? `${user.departmentName} Department` : 'Department Authorized'}
        badgeIcon={<BusinessRoundedIcon sx={{ fontSize: 13 }} />}
        badgeColor="#3b82f6"
        badgeBg="rgba(59,130,246,0.1)"
        badgeBorder="rgba(59,130,246,0.2)"
        lastSynced={lastUpdated}
        onRefresh={fetchData}
        actions={
          <Button
            variant="contained"
            size="small"
            onClick={exportDepartmentCSV}
            startIcon={<DownloadRoundedIcon />}
            sx={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: '#ffffff',
              borderRadius: 2,
              px: 2,
              py: 0.75,
              fontSize: '0.8125rem',
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: '0 4px 14px rgba(59,130,246,0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)',
                boxShadow: '0 6px 20px rgba(59,130,246,0.4)',
              },
            }}
          >
            Export Department CSV
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2.5 }}>
          {error}
        </Alert>
      )}

      {/* KPI Cards Grid — 5 Responsive Cards from SQLite */}
      <Grid container spacing={2.5} sx={{ mb: 3, alignItems: 'stretch' }}>
        {kpis.map((kpi, idx) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }} key={kpi.id} sx={{ display: 'flex' }}>
            <KpiCard data={kpi} index={idx} />
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ mb: 3, opacity: isDark ? 0.08 : 0.6 }} />

      {/* Charts Row: Attendance Trend + Workforce Donut */}
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
              onSegmentSelect={(segment) => setSelectedSegment(segment)}
            />
          </Box>
        </Grid>
      </Grid>

      {/* Department Team Members Table (Using Uniform RecentActivityTable) */}
      <Box sx={{ mb: 3 }}>
        <RecentActivityTable
          data={employees}
          total={totalEmployees}
          page={page}
          rowsPerPage={rowsPerPage}
          sortBy={sortBy}
          sortOrder={sortOrder}
          searchQuery={searchQuery}
          onSearchChange={(q) => { setSearchQuery(q); setPage(0); }}
          onPageChange={setPage}
          onRowsPerPageChange={setRowsPerPage}
          onSortChange={handleSortChange}
          activeEmploymentFilter={selectedSegment}
          onClearEmploymentFilter={() => setSelectedSegment(null)}
          onResetAllFilters={() => { setSearchQuery(''); setSelectedSegment(null); setPage(0); }}
        />
      </Box>
    </Box>
  );
}
