import type {
  AuthUser,
  LoginResponse,
  MFASetupResponse,
  SessionInfo,
  AuditLogItem,
  ManagedUser,
} from '../types/auth';

const API_BASE = '/api';

// ── In-Memory Token & State (Never store Refresh Tokens in localStorage) ──
let memoryAccessToken: string | null = null;
let memoryCsrfToken: string | null = null;

export function setMemoryAccessToken(token: string | null): void {
  memoryAccessToken = token;
}

export function getMemoryAccessToken(): string | null {
  return memoryAccessToken;
}

export function setMemoryCsrfToken(csrf: string | null): void {
  memoryCsrfToken = csrf;
}

export function getMemoryCsrfToken(): string | null {
  return memoryCsrfToken;
}

/**
 * Custom fetch wrapper with:
 * - In-memory JWT access token attachment
 * - Automatic credentials forwarding for HttpOnly cookies
 * - CSRF token header (X-CSRF-Token)
 * - Automatic 401 retry via cookie-based refresh token rotation
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (memoryAccessToken) {
    headers['Authorization'] = `Bearer ${memoryAccessToken}`;
  }

  if (memoryCsrfToken) {
    headers['X-CSRF-Token'] = memoryCsrfToken;
  }
  headers['X-Requested-With'] = 'XMLHttpRequest';

  let res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // sends HttpOnly refresh cookie & csrf cookie
  });

  // If unauthorized due to access token expiry, automatically try to refresh once
  if (res.status === 401) {
    const errorBody = (await res.clone().json().catch(() => ({}))) as any;
    if (errorBody?.code === 'TOKEN_EXPIRED') {
      try {
        const refreshed = await authApi.refreshToken();
        if (refreshed?.accessToken) {
          headers['Authorization'] = `Bearer ${refreshed.accessToken}`;
          res = await fetch(url, {
            ...options,
            headers,
            credentials: 'include',
          });
        }
      } catch {
        memoryAccessToken = null;
      }
    }
  }

  return res;
}

export const authApi = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      credentials: 'include',
      body: JSON.stringify({ email: email.toLowerCase().trim(), password }),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || 'Login failed');
    }

    if (json.accessToken) {
      memoryAccessToken = json.accessToken;
      if (json.csrfToken) {
        memoryCsrfToken = json.csrfToken;
      }
    }

    return json;
  },

  async verifyMFA(
    userId: number,
    code: string,
    isRecoveryCode: boolean = false
  ): Promise<LoginResponse> {
    const payload = isRecoveryCode
      ? { userId, recoveryCode: code }
      : { userId, token: code };

    const res = await fetch(`${API_BASE}/auth/mfa/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || 'MFA verification failed');
    }

    if (json.accessToken) {
      memoryAccessToken = json.accessToken;
      if (json.csrfToken) {
        memoryCsrfToken = json.csrfToken;
      }
    }

    return json;
  },

  async refreshToken(): Promise<{ accessToken: string; csrfToken?: string }> {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(memoryCsrfToken ? { 'X-CSRF-Token': memoryCsrfToken } : {}),
        'X-Requested-With': 'XMLHttpRequest',
      },
      credentials: 'include',
      body: JSON.stringify({}),
    });

    const json = await res.json();
    if (!res.ok) {
      memoryAccessToken = null;
      throw new Error(json.error || 'Failed to refresh token');
    }

    memoryAccessToken = json.accessToken;
    if (json.csrfToken) {
      memoryCsrfToken = json.csrfToken;
    }

    return json;
  },

  async logout(): Promise<void> {
    try {
      await authFetch(`${API_BASE}/auth/logout`, { method: 'POST' });
    } finally {
      memoryAccessToken = null;
      memoryCsrfToken = null;
    }
  },

  async logoutAll(): Promise<{ message: string }> {
    try {
      const res = await authFetch(`${API_BASE}/auth/logout-all`, { method: 'POST' });
      const json = await res.json();
      return json;
    } finally {
      memoryAccessToken = null;
      memoryCsrfToken = null;
    }
  },

  async getSessions(): Promise<SessionInfo[]> {
    const res = await authFetch(`${API_BASE}/auth/sessions`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to fetch active sessions');
    return json.data || [];
  },

  async revokeSession(sessionId: string): Promise<void> {
    const res = await authFetch(`${API_BASE}/auth/sessions/${sessionId}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to revoke session');
  },

  async setupMFA(): Promise<MFASetupResponse> {
    const res = await authFetch(`${API_BASE}/auth/mfa/setup`, { method: 'POST' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to setup MFA');
    return json;
  },

  async enableMFA(token: string): Promise<void> {
    const res = await authFetch(`${API_BASE}/auth/mfa/enable`, {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to enable MFA');
  },

  async disableMFA(password: string, code: string): Promise<void> {
    const res = await authFetch(`${API_BASE}/auth/mfa/disable`, {
      method: 'POST',
      body: JSON.stringify({ password, code }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to disable MFA');
  },

  async getMe(): Promise<AuthUser> {
    const res = await authFetch(`${API_BASE}/auth/me`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to fetch user profile');
    const d = json.data;
    return {
      id: d.id,
      email: d.email,
      role: d.role,
      permissions: d.permissions || [],
      departmentId: d.department_id,
      departmentName: d.department_name,
      fullName: d.fullName,
      employeeCode: d.employee_code,
      mfaEnabled: Boolean(d.mfa_enabled),
      recoveryCodesRemaining: d.recoveryCodesRemaining,
    };
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const res = await authFetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to change password');
  },

  async getAuditLogs(params?: { eventType?: string; page?: number; limit?: number }): Promise<{
    data: AuditLogItem[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const searchParams = new URLSearchParams();
    if (params?.eventType) searchParams.append('eventType', params.eventType);
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));

    const res = await authFetch(`${API_BASE}/auth/audit-logs?${searchParams.toString()}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to fetch audit logs');
    return json;
  },

  async getUsers(): Promise<ManagedUser[]> {
    const res = await authFetch(`${API_BASE}/auth/users`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to fetch users');
    return json.data || [];
  },

  async updateUserRole(userId: number, role: string): Promise<void> {
    const res = await authFetch(`${API_BASE}/auth/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update user role');
  },
};
