import type {
  AttendanceRecord,
  DepartmentData,
  EmployeeActivity,
  KpiData,
  WorkforceSegment,
} from '../types';

// ─── KPI Cards ───────────────────────────────────────────────────────────────

export const kpiData: KpiData[] = [
  {
    id: 'total-employees',
    title: 'Total Employees',
    value: 2847,
    trend: 3.2,
    trendDirection: 'up',
    trendPositive: true,
    icon: 'people',
    color: '#6366f1',
    description: 'Across all departments',
  },
  {
    id: 'present-today',
    title: 'Present Today',
    value: '91.4%',
    trend: 1.8,
    trendDirection: 'up',
    trendPositive: true,
    icon: 'check_circle',
    color: '#10b981',
    description: '2,602 of 2,847 employees',
  },
  {
    id: 'on-leave',
    title: 'On Leave',
    value: 134,
    trend: 5.1,
    trendDirection: 'up',
    trendPositive: false,
    icon: 'event_busy',
    color: '#f59e0b',
    description: 'Approved leave today',
  },
  {
    id: 'new-hires',
    title: 'New Hires',
    value: 48,
    trend: 12.5,
    trendDirection: 'up',
    trendPositive: true,
    icon: 'person_add',
    color: '#06b6d4',
    description: 'This month',
  },
  {
    id: 'attrition-rate',
    title: 'Attrition Rate',
    value: '2.3%',
    trend: 0.4,
    trendDirection: 'down',
    trendPositive: true,
    icon: 'trending_down',
    color: '#8b5cf6',
    description: 'Monthly average',
  },
];

// ─── Attendance Trend (30 days) ───────────────────────────────────────────────

const generateAttendanceTrend = (): AttendanceRecord[] => {
  const data: AttendanceRecord[] = [];
  const baseDate = new Date('2026-09-27');
  for (let i = 0; i < 30; i++) {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() + i);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const present = isWeekend
      ? Math.floor(Math.random() * 200 + 100)
      : Math.floor(Math.random() * 300 + 2400);
    const total = 2847;
    const onLeave = Math.floor(Math.random() * 80 + 60);
    const remote = Math.floor(Math.random() * 200 + 150);
    const absent = total - present - onLeave;
    data.push({
      date: date.toISOString().split('T')[0],
      present,
      absent: Math.max(0, absent),
      onLeave,
      remote,
    });
  }
  return data;
};

export const attendanceTrend: AttendanceRecord[] = generateAttendanceTrend();

// ─── Department Distribution ─────────────────────────────────────────────────

export const departmentData: DepartmentData[] = [
  { department: 'Engineering', employees: 742, present: 698, onLeave: 18, color: '#6366f1' },
  { department: 'Sales', employees: 534, present: 489, onLeave: 22, color: '#10b981' },
  { department: 'Marketing', employees: 287, present: 261, onLeave: 12, color: '#06b6d4' },
  { department: 'HR', employees: 156, present: 148, onLeave: 5, color: '#f59e0b' },
  { department: 'Finance', employees: 198, present: 187, onLeave: 8, color: '#8b5cf6' },
  { department: 'Operations', employees: 423, present: 389, onLeave: 20, color: '#ec4899' },
  { department: 'Legal', employees: 89, present: 82, onLeave: 3, color: '#14b8a6' },
  { department: 'Product', employees: 312, present: 291, onLeave: 14, color: '#f97316' },
  { department: 'Design', employees: 106, present: 97, onLeave: 6, color: '#a855f7' },
];

// ─── Workforce Donut ─────────────────────────────────────────────────────────

export const workforceSegments: WorkforceSegment[] = [
  { name: 'Full-time', value: 1980, color: '#6366f1' },
  { name: 'Part-time', value: 412, color: '#10b981' },
  { name: 'Contractor', value: 328, color: '#f59e0b' },
  { name: 'Intern', value: 127, color: '#06b6d4' },
];

// ─── Recent Employee Activity ─────────────────────────────────────────────────

export const recentActivity: EmployeeActivity[] = [
  {
    id: '1',
    name: 'Sophia Ramirez',
    avatar: 'SR',
    department: 'Engineering',
    action: 'check-in',
    timestamp: '2026-10-26T08:02:00',
    status: 'active',
    location: 'New York HQ',
    employmentType: 'Full-time',
  },
  {
    id: '2',
    name: 'Marcus Chen',
    avatar: 'MC',
    department: 'Sales',
    action: 'leave-approved',
    timestamp: '2026-10-26T08:15:00',
    status: 'on-leave',
    location: 'San Francisco',
    employmentType: 'Full-time',
  },
  {
    id: '3',
    name: 'Aisha Patel',
    avatar: 'AP',
    department: 'Design',
    action: 'check-in',
    timestamp: '2026-10-26T08:30:00',
    status: 'remote',
    location: 'Remote',
    employmentType: 'Part-time',
  },
  {
    id: '4',
    name: 'James O\'Brien',
    avatar: 'JO',
    department: 'HR',
    action: 'new-hire',
    timestamp: '2026-10-26T09:00:00',
    status: 'active',
    location: 'Chicago Office',
    employmentType: 'Full-time',
  },
  {
    id: '5',
    name: 'Priya Nair',
    avatar: 'PN',
    department: 'Finance',
    action: 'check-in',
    timestamp: '2026-10-26T09:05:00',
    status: 'active',
    location: 'New York HQ',
    employmentType: 'Contractor',
  },
  {
    id: '6',
    name: 'David Kim',
    avatar: 'DK',
    department: 'Product',
    action: 'leave-requested',
    timestamp: '2026-10-26T09:20:00',
    status: 'active',
    location: 'Austin',
    employmentType: 'Part-time',
  },
  {
    id: '7',
    name: 'Lena Fischer',
    avatar: 'LF',
    department: 'Marketing',
    action: 'check-out',
    timestamp: '2026-10-26T09:45:00',
    status: 'remote',
    location: 'Remote',
    employmentType: 'Full-time',
  },
  {
    id: '8',
    name: 'Carlos Mendez',
    avatar: 'CM',
    department: 'Operations',
    action: 'check-in',
    timestamp: '2026-10-26T10:00:00',
    status: 'active',
    location: 'Dallas',
    employmentType: 'Contractor',
  },
  {
    id: '9',
    name: 'Yuki Tanaka',
    avatar: 'YT',
    department: 'Engineering',
    action: 'resigned',
    timestamp: '2026-10-26T10:15:00',
    status: 'inactive',
    location: 'New York HQ',
    employmentType: 'Intern',
  },
  {
    id: '10',
    name: 'Rachel Green',
    avatar: 'RG',
    department: 'Legal',
    action: 'check-in',
    timestamp: '2026-10-26T10:30:00',
    status: 'active',
    location: 'New York HQ',
    employmentType: 'Full-time',
  },
];

// ─── Filter Options ───────────────────────────────────────────────────────────

export const departmentOptions = departmentData.map((d) => d.department);

export const locationOptions = [
  'All Locations',
  'New York HQ',
  'San Francisco',
  'Chicago Office',
  'Austin',
  'Dallas',
  'Remote',
];

export const statusOptions = ['All', 'Active', 'On Leave', 'Remote', 'Inactive'];
