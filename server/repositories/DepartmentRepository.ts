import { db } from '../db/database';
import type { DepartmentRecord } from '../types';

export class DepartmentRepository {
  /**
   * Retrieves all departments with their current headcount and attendance statistics
   */
  public getAllWithMetrics(filters?: { location?: string; status?: string }): Array<{
    department: string;
    employees: number;
    present: number;
    onLeave: number;
    color: string;
  }> {
    let whereClauses: string[] = [];
    const params: any[] = [];

    if (filters?.location && filters.location !== 'All Locations') {
      whereClauses.push('e.location = ?');
      params.push(filters.location);
    }

    if (filters?.status && filters.status !== 'All') {
      whereClauses.push('e.status = ?');
      params.push(filters.status.toLowerCase());
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const query = `
      SELECT 
        d.name AS department,
        d.color AS color,
        COUNT(e.id) AS employees,
        SUM(CASE WHEN e.status = 'active' OR e.status = 'remote' THEN 1 ELSE 0 END) AS present,
        SUM(CASE WHEN e.status = 'on-leave' THEN 1 ELSE 0 END) AS onLeave
      FROM departments d
      LEFT JOIN employees e ON e.department_id = d.id
      ${whereSQL ? `AND ${whereClauses.join(' AND ')}` : ''}
      GROUP BY d.id, d.name, d.color
      ORDER BY employees DESC
    `;

    const stmt = db.prepare(query);
    return stmt.all(params) as Array<{
      department: string;
      employees: number;
      present: number;
      onLeave: number;
      color: string;
    }>;
  }

  public findAll(): DepartmentRecord[] {
    const stmt = db.prepare('SELECT * FROM departments ORDER BY name ASC');
    return stmt.all() as DepartmentRecord[];
  }

  public findById(id: number): DepartmentRecord | undefined {
    const stmt = db.prepare('SELECT * FROM departments WHERE id = ?');
    return stmt.get(id) as DepartmentRecord | undefined;
  }
}

export const departmentRepository = new DepartmentRepository();
