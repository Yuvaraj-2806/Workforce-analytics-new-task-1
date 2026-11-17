import type {
  KpiData,
  AttendanceRecord,
  DepartmentData,
  WorkforceSegment,
  EmployeeActivity,
  FilterState,
  FilterOptions,
} from '../types';
import { authFetch } from './authApi';

const API_BASE = '/api';

function buildQuery(params: Record<string, any>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '' && value !== 'All' && value !== 'All Locations' && value !== 'All Types') {
      if (Array.isArray(value)) {
        if (value.length > 0) query.append(key, value.join(','));
      } else {
        query.append(key, String(value));
      }
    }
  }
  const qStr = query.toString();
  return qStr ? `?${qStr}` : '';
}

export const apiService = {
  /**
   * Fetches the 5 core KPI metrics
   */
  async getKpis(filters: FilterState): Promise<KpiData[]> {
    const qs = buildQuery({
      department: filters.department,
      location: filters.location,
      status: filters.status,
      employmentType: filters.employmentType,
    });
    const res = await authFetch(`${API_BASE}/kpi${qs}`);
    if (!res.ok) throw new Error(`Failed to fetch KPIs: ${res.statusText}`);
    const json = await res.json();
    return json.data;
  },

  /**
   * Fetches attendance trend points for charts
   */
  async getAttendanceTrend(days: number = 14, filters: FilterState): Promise<AttendanceRecord[]> {
    const qs = buildQuery({
      days,
      department: filters.department,
      location: filters.location,
    });
    const res = await authFetch(`${API_BASE}/charts/attendance-trend${qs}`);
    if (!res.ok) throw new Error(`Failed to fetch attendance trend: ${res.statusText}`);
    const json = await res.json();
    return json.data;
  },

  /**
   * Fetches department headcount distribution
   */
  async getDepartmentDistribution(filters: FilterState): Promise<DepartmentData[]> {
    const qs = buildQuery({
      department: filters.department,
      location: filters.location,
      status: filters.status,
    });
    const res = await authFetch(`${API_BASE}/charts/department-distribution${qs}`);
    if (!res.ok) throw new Error(`Failed to fetch department distribution: ${res.statusText}`);
    const json = await res.json();
    return json.data;
  },

  /**
   * Fetches workforce breakdown by employment type
   */
  async getWorkforceSegments(filters: FilterState): Promise<{ data: WorkforceSegment[]; total: number }> {
    const qs = buildQuery({
      department: filters.department,
      location: filters.location,
      status: filters.status,
    });
    const res = await authFetch(`${API_BASE}/charts/workforce-segments${qs}`);
    if (!res.ok) throw new Error(`Failed to fetch workforce segments: ${res.statusText}`);
    const json = await res.json();
    return { data: json.data, total: json.total };
  },

  /**
   * Fetches paginated, sorted, and searched employee activity records
   */
  async getEmployees(params: {
    filters: FilterState;
    search?: string;
    page: number; // 1-indexed
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ items: EmployeeActivity[]; total: number; totalPages: number }> {
    const qs = buildQuery({
      department: params.filters.department,
      location: params.filters.location,
      status: params.filters.status,
      employmentType: params.filters.employmentType,
      search: params.search,
      page: params.page,
      limit: params.limit,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    });
    const res = await authFetch(`${API_BASE}/employees${qs}`);
    if (!res.ok) throw new Error(`Failed to fetch employees: ${res.statusText}`);
    const json = await res.json();
    return {
      items: json.data,
      total: json.pagination.total,
      totalPages: json.pagination.totalPages,
    };
  },

  /**
   * Fetches single employee by ID (with backend IDOR protection)
   */
  async getEmployeeById(id: number): Promise<EmployeeActivity> {
    const res = await authFetch(`${API_BASE}/employees/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch employee: ${res.statusText}`);
    const json = await res.json();
    return json.data;
  },

  /**
   * Fetches the current logged-in employee's own profile
   */
  async getMyProfile(): Promise<any> {
    const res = await authFetch(`${API_BASE}/my-profile`);
    if (!res.ok) throw new Error(`Failed to fetch profile: ${res.statusText}`);
    const json = await res.json();
    return json.data;
  },

  /**
   * Fetches the current logged-in employee's attendance records
   */
  async getMyAttendance(days: number = 30): Promise<any[]> {
    const res = await authFetch(`${API_BASE}/my-attendance?days=${days}`);
    if (!res.ok) throw new Error(`Failed to fetch personal attendance: ${res.statusText}`);
    const json = await res.json();
    return json.data;
  },

  /**
   * Fetches dynamic filter options
   */
  async getFilterOptions(): Promise<FilterOptions> {
    const res = await authFetch(`${API_BASE}/filters/options`);
    if (!res.ok) throw new Error(`Failed to fetch filter options: ${res.statusText}`);
    const json = await res.json();
    return json.data;
  },
};
