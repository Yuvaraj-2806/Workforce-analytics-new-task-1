export type UserRole = 'admin' | 'hr' | 'manager' | 'team_lead' | 'employee';

export interface AuthUser {
  id: number;
  email: string;
  role: UserRole;
  permissions: string[];
  departmentId: number | null;
  departmentName: string | null;
  fullName?: string | null;
  employeeCode?: string | null;
  mfaEnabled?: boolean;
  recoveryCodesRemaining?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  csrfToken?: string;
}

export interface SessionInfo {
  id: number;
  session_id: string;
  user_id: number;
  device?: string | null;
  user_agent?: string | null;
  ip_address?: string | null;
  is_revoked: number;
  last_active_at: string;
  expires_at: string;
  created_at: string;
  is_current?: boolean;
}

export interface LoginResponse {
  success: boolean;
  requiresMFA: boolean;
  userId?: number;
  email?: string;
  message?: string;
  accessToken?: string;
  refreshToken?: string;
  csrfToken?: string;
  user?: AuthUser;
  session?: {
    sessionId: string;
    device: string;
    expiresAt: string;
  };
}

export interface MFASetupResponse {
  success: boolean;
  qrCodeDataUrl: string;
  otpAuthUrl: string;
  recoveryCodes: string[];
}

export interface AuditLogItem {
  id: number;
  user_id: number | null;
  email?: string | null;
  role?: string | null;
  event_type: string;
  resource?: string | null;
  action?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  status: 'SUCCESS' | 'FAILURE' | 'BLOCKED' | 'WARNING';
  details?: string | null;
  created_at: string;
}

export interface ManagedUser {
  id: number;
  email: string;
  role: UserRole;
  first_name?: string | null;
  last_name?: string | null;
  employee_code?: string | null;
  department_name?: string | null;
  mfa_enabled: number;
  is_active: number;
  created_at: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  hr: 'HR Specialist',
  manager: 'Department Manager',
  team_lead: 'Team Lead',
  employee: 'Employee',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  admin: '#ef4444',
  hr: '#8b5cf6',
  manager: '#3b82f6',
  team_lead: '#10b981',
  employee: '#f59e0b',
};
