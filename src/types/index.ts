export type ThemeMode = 'light' | 'dark';

export interface KpiData {
  id: string;
  title: string;
  value: number | string;
  unit?: string;
  trend: number; // percentage change vs last period
  trendDirection: 'up' | 'down' | 'neutral';
  trendPositive: boolean; // up=good or down=good
  icon: string;
  color: string;
  description: string;
}

export interface AttendanceRecord {
  date: string;
  present: number;
  absent: number;
  onLeave: number;
  remote: number;
}

export interface DepartmentData {
  department: string;
  employees: number;
  present: number;
  onLeave: number;
  color: string;
}

export interface WorkforceSegment {
  name: string;
  value: number;
  color: string;
}

export interface EmployeeActivity {
  id: string;
  employee_code?: string;
  name: string;
  avatar: string;
  department: string;
  action: 'check-in' | 'check-out' | 'leave-requested' | 'leave-approved' | 'new-hire' | 'resigned';
  timestamp: string;
  status: 'active' | 'on-leave' | 'remote' | 'inactive';
  location: string;
  role?: string;
  employmentType?: 'Full-time' | 'Part-time' | 'Contractor' | 'Intern';
}

export interface FilterState {
  dateFrom: string;
  dateTo: string;
  department: string[];
  location: string;
  status: string;
  employmentType?: string;
}

export interface PaginationState {
  page: number; // 0-indexed for MUI TablePagination
  limit: number;
  total: number;
  totalPages: number;
}

export interface SortState {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface FilterOptions {
  departments: string[];
  locations: string[];
  statuses: string[];
  employmentTypes: string[];
}

export type DataState = 'loading' | 'success' | 'empty' | 'error';
