export type UserRole = 'admin' | 'hr' | 'manager' | 'team_lead' | 'employee';

export interface AuthUser {
  id: number;
  email: string;
  role: UserRole;
  employeeId: number | null;
  permissions: string[];
  departmentId: number | null;
  departmentName?: string | null;
  sessionId?: string;
}

export interface JwtPayload extends AuthUser {
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface MFAVerifyRequest {
  userId: number;
  token?: string; // 6-digit TOTP code
  recoveryCode?: string; // or 8-10 char backup recovery code
}

export interface MFADisableRequest {
  password: string;
  code: string; // valid TOTP or recovery code required
}

export interface RefreshRequest {
  refreshToken?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface DbUser {
  id: number;
  employee_id: number | null;
  email: string;
  password_hash: string;
  role: UserRole;
  mfa_enabled: number;
  mfa_secret: string | null;
  mfa_verified: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface UserSession {
  id: number;
  session_id: string;
  user_id: number;
  device?: string | null;
  user_agent?: string | null;
  ip_address?: string | null;
  refresh_token_hash?: string | null;
  is_revoked: number;
  last_active_at: string;
  expires_at: string;
  created_at: string;
  revoked_at?: string | null;
  is_current?: boolean;
}

export type AuditEventType =
  | 'login_success'
  | 'login_failed'
  | 'logout'
  | 'logout_all'
  | 'session_revoked'
  | 'token_refresh'
  | 'token_reuse_detected'
  | 'mfa_setup'
  | 'mfa_enabled'
  | 'mfa_disabled'
  | 'mfa_verified'
  | 'mfa_failed'
  | 'recovery_code_used'
  | 'password_changed'
  | 'role_changed'
  | 'permission_changed'
  | 'account_locked'
  | 'account_unlocked'
  | 'access_denied'
  | 'idor_attempt';

export interface AuditLogParams {
  userId?: number;
  eventType: AuditEventType;
  resource?: string;
  action?: string;
  ipAddress?: string;
  userAgent?: string;
  status?: 'SUCCESS' | 'FAILURE' | 'BLOCKED' | 'WARNING';
  details?: string;
}
