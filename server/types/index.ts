export interface DepartmentRecord {
  id: number;
  name: string;
  code: string;
  manager: string | null;
  color: string;
  budget: number;
  created_at: string;
}

export interface EmployeeRecord {
  id: number;
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string;
  department_id: number;
  role: string;
  employment_type: 'Full-time' | 'Part-time' | 'Contractor' | 'Intern';
  location: string;
  status: 'active' | 'on-leave' | 'remote' | 'inactive';
  avatar_initials: string;
  joined_date: string;
  created_at: string;
}

export interface AttendanceRecordRow {
  id: number;
  employee_id: number;
  date: string;
  status: 'present' | 'absent' | 'on-leave' | 'remote';
  check_in_time: string | null;
  check_out_time: string | null;
  work_mode: 'Office' | 'Remote' | 'Hybrid' | 'Leave';
  notes: string | null;
  created_at: string;
}

export interface ActivityLogRow {
  id: number;
  employee_id: number;
  employee_name: string;
  avatar_initials: string;
  department_name: string;
  location: string;
  employment_type: 'Full-time' | 'Part-time' | 'Contractor' | 'Intern';
  action: 'check-in' | 'check-out' | 'leave-requested' | 'leave-approved' | 'new-hire' | 'resigned';
  status: 'active' | 'on-leave' | 'remote' | 'inactive';
  timestamp: string;
  details?: string;
}

export interface QueryFilters {
  department?: string[];
  location?: string;
  status?: string;
  employmentType?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface KpiCardMetric {
  id: string;
  title: string;
  value: number | string;
  unit?: string;
  trend: number;
  trendDirection: 'up' | 'down' | 'neutral';
  trendPositive: boolean;
  icon: string;
  color: string;
  description: string;
}
