import { db } from '../db/database';
import type { QueryFilters, PaginationParams } from '../types';

export interface PaginatedEmployeesResult {
  items: Array<{
    id: string;
    name: string;
    avatar: string;
    department: string;
    location: string;
    role: string;
    employmentType: 'Full-time' | 'Part-time' | 'Contractor' | 'Intern';
    status: 'active' | 'on-leave' | 'remote' | 'inactive';
    action: string;
    timestamp: string;
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class EmployeeRepository {
  /**
   * Builds dynamic WHERE query based on filter parameters
   */
  private buildWhereClause(filters: QueryFilters): { whereSQL: string; params: any[] } {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters.search && filters.search.trim().length > 0) {
      const searchTerm = `%${filters.search.trim()}%`;
      conditions.push("(e.first_name LIKE ? OR e.last_name LIKE ? OR (e.first_name || ' ' || e.last_name) LIKE ? OR e.role LIKE ? OR d.name LIKE ? OR e.location LIKE ?)");
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (filters.department && filters.department.length > 0) {
      const placeholders = filters.department.map(() => '?').join(',');
      conditions.push(`d.name IN (${placeholders})`);
      params.push(...filters.department);
    }

    if (filters.location && filters.location !== 'All Locations') {
      conditions.push('e.location = ?');
      params.push(filters.location);
    }

    if (filters.status && filters.status !== 'All') {
      const statusMap: Record<string, string> = {
        'Active': 'active',
        'On Leave': 'on-leave',
        'Remote': 'remote',
        'Inactive': 'inactive'
      };
      const dbStatus = statusMap[filters.status] || filters.status.toLowerCase();
      conditions.push('e.status = ?');
      params.push(dbStatus);
    }

    if (filters.employmentType) {
      conditions.push('e.employment_type = ?');
      params.push(filters.employmentType);
    }

    const whereSQL = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return { whereSQL, params };
  }

  /**
   * Retrieves paginated employee activities / records with search, filter, and sorting
   */
  public findPaginated(filters: QueryFilters, pagination: PaginationParams): PaginatedEmployeesResult {
    const { whereSQL, params } = this.buildWhereClause(filters);

    // Count total matching
    const countQuery = `
      SELECT COUNT(DISTINCT e.id) AS total
      FROM employees e
      JOIN departments d ON e.department_id = d.id
      ${whereSQL}
    `;
    const countStmt = db.prepare(countQuery);
    const totalRow = countStmt.get(...params) as { total: number };
    const total = totalRow?.total || 0;

    // Sorting configuration
    const validSortFields: Record<string, string> = {
      name: 'e.first_name',
      department: 'd.name',
      role: 'e.role',
      location: 'e.location',
      status: 'e.status',
      employmentType: 'e.employment_type',
      timestamp: 'al.timestamp',
    };

    const sortField = validSortFields[pagination.sortBy || 'name'] || 'e.id';
    const sortOrder = pagination.sortOrder === 'desc' ? 'DESC' : 'ASC';

    const offset = Math.max(0, (pagination.page - 1) * pagination.limit);

    const query = `
      SELECT 
        e.id,
        e.employee_code,
        (e.first_name || ' ' || e.last_name) AS name,
        e.avatar_initials AS avatar,
        d.name AS department,
        e.location,
        e.role,
        e.employment_type AS employmentType,
        e.status,
        COALESCE(al.action, 'check-in') AS action,
        COALESCE(al.timestamp, datetime('now')) AS timestamp
      FROM employees e
      JOIN departments d ON e.department_id = d.id
      LEFT JOIN (
        SELECT employee_id, action, timestamp
        FROM activity_logs
        GROUP BY employee_id
        HAVING max(timestamp)
      ) al ON al.employee_id = e.id
      ${whereSQL}
      ORDER BY ${sortField} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    const stmt = db.prepare(query);
    const items = stmt.all(...params, pagination.limit, offset) as any[];

    return {
      items: items.map(item => ({
        ...item,
        id: String(item.id),
      })),
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit) || 1,
    };
  }

  /**
   * Retrieves employment type distribution for Donut Chart
   */
  public getEmploymentTypeDistribution(filters?: QueryFilters): Array<{ name: string; value: number; color: string }> {
    const { whereSQL, params } = this.buildWhereClause(filters || {});

    const query = `
      SELECT 
        e.employment_type AS name,
        COUNT(e.id) AS value
      FROM employees e
      JOIN departments d ON e.department_id = d.id
      ${whereSQL}
      GROUP BY e.employment_type
      ORDER BY value DESC
    `;

    const colorMap: Record<string, string> = {
      'Full-time': '#6366f1',
      'Part-time': '#06b6d4',
      'Contractor': '#f59e0b',
      'Intern': '#10b981',
    };

    const rows = db.prepare(query).all(...params) as Array<{ name: string; value: number }>;

    return rows.map(r => ({
      name: r.name,
      value: r.value,
      color: colorMap[r.name] || '#8b5cf6',
    }));
  }

  /**
   * Retrieves distinct list of locations in DB
   */
  public getLocations(): string[] {
    const rows = db.prepare('SELECT DISTINCT location FROM employees ORDER BY location ASC').all() as Array<{ location: string }>;
    return rows.map(r => r.location);
  }
}

export const employeeRepository = new EmployeeRepository();
