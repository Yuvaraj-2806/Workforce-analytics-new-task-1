import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../services/api';
import type {
  KpiData,
  AttendanceRecord,
  DepartmentData,
  WorkforceSegment,
  EmployeeActivity,
  FilterState,
  DataState,
  FilterOptions,
} from '../types';

const DEFAULT_FILTERS: FilterState = {
  dateFrom: '',
  dateTo: '',
  department: [],
  location: 'All Locations',
  status: 'All',
  employmentType: undefined,
};

export const useDashboardData = () => {
  const [dataState, setDataState] = useState<DataState>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);

  // Dynamic filter options from DB
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    departments: [],
    locations: [],
    statuses: ['All', 'Active', 'On Leave', 'Remote', 'Inactive'],
    employmentTypes: ['All Types', 'Full-time', 'Part-time', 'Contractor', 'Intern'],
  });

  // Analytics & Charts Data
  const [kpis, setKpis] = useState<KpiData[]>([]);
  const [attendanceTrend, setAttendanceTrend] = useState<AttendanceRecord[]>([]);
  const [departmentData, setDepartmentData] = useState<DepartmentData[]>([]);
  const [workforceSegments, setWorkforceSegments] = useState<WorkforceSegment[]>([]);
  const [totalWorkforce, setTotalWorkforce] = useState<number>(0);

  // Employee Table: Search, Sorting, and Pagination
  const [employees, setEmployees] = useState<EmployeeActivity[]>([]);
  const [totalEmployees, setTotalEmployees] = useState<number>(0);
  const [page, setPage] = useState<number>(0); // 0-indexed for MUI TablePagination
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');

  // Debounce search query input (300ms)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(query);
      setPage(0); // Reset to first page on search
    }, 300);
  };

  // Fetch filter options once on mount
  useEffect(() => {
    apiService.getFilterOptions()
      .then(opts => setFilterOptions(opts))
      .catch(err => console.warn('Could not load dynamic filter options:', err));
  }, []);

  // Sync selected segment from donut chart to filters
  const handleSegmentSelect = useCallback((segment: string | null) => {
    setSelectedSegment(segment);
    setPage(0);
  }, []);

  // Main data loader function
  const loadDashboardData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setDataState('loading');
      setErrorMessage(null);

      const activeFilters: FilterState = {
        ...filters,
        employmentType: selectedSegment || undefined,
      };

      const [kpiRes, trendRes, deptRes, segmentRes, empRes] = await Promise.all([
        apiService.getKpis(activeFilters),
        apiService.getAttendanceTrend(14, activeFilters),
        apiService.getDepartmentDistribution(activeFilters),
        apiService.getWorkforceSegments(activeFilters),
        apiService.getEmployees({
          filters: activeFilters,
          search: debouncedSearch,
          page: page + 1, // API is 1-indexed
          limit: rowsPerPage,
          sortBy,
          sortOrder,
        }),
      ]);

      setKpis(kpiRes);
      setAttendanceTrend(trendRes);
      setDepartmentData(deptRes);
      setWorkforceSegments(segmentRes.data);
      setTotalWorkforce(segmentRes.total);

      setEmployees(empRes.items);
      setTotalEmployees(empRes.total);

      setLastUpdated(new Date());
      setDataState('success');
    } catch (err: any) {
      console.error('Dashboard data fetch error:', err);
      setErrorMessage(err.message || 'Failed to communicate with SQLite backend.');
      setDataState('error');
    }
  }, [filters, selectedSegment, debouncedSearch, page, rowsPerPage, sortBy, sortOrder]);

  // Load data when dependencies change
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Sorting handler
  const handleSortChange = (column: string) => {
    if (sortBy === column) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setPage(0);
  };

  // Reset filters handler
  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSelectedSegment(null);
    setSearchQuery('');
    setDebouncedSearch('');
    setPage(0);
  };

  // CSV export handler
  const exportCSV = () => {
    const headers = ['ID', 'Code', 'Name', 'Department', 'Location', 'Role', 'Employment Type', 'Status', 'Action', 'Timestamp'];
    const rows = employees.map(emp => [
      emp.id,
      emp.employee_code || '',
      `"${emp.name}"`,
      `"${emp.department}"`,
      `"${emp.location}"`,
      `"${emp.role || ''}"`,
      `"${emp.employmentType || ''}"`,
      `"${emp.status}"`,
      `"${emp.action}"`,
      `"${emp.timestamp}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `stackly-workforce-analytics-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
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
    refresh: () => loadDashboardData(true),
    exportCSV,
  };
};
