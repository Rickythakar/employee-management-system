import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import type { WorkforceRepository } from '../../application/workforce-repository.js';
import type {
  Department,
  DepartmentBudget,
  Employee,
  EmployeeView,
  NewEmployee,
  NewRole,
  Role,
  RoleView,
  WorkforceSummary,
} from '../../domain/models.js';

interface DepartmentRow extends RowDataPacket {
  id: number;
  name: string;
}

interface RoleRow extends RowDataPacket {
  id: number;
  title: string;
  salary_cents: number | string;
  department_id: number;
}

interface RoleViewRow extends RoleRow {
  department_name: string;
}

interface EmployeeRow extends RowDataPacket {
  id: number;
  first_name: string;
  last_name: string;
  role_id: number;
  manager_id: number | null;
}

interface EmployeeViewRow extends EmployeeRow {
  role_title: string;
  department_name: string;
  salary_cents: number | string;
  manager_name: string | null;
}

interface CountRow extends RowDataPacket {
  count: number | string;
}

interface CycleRow extends RowDataPacket {
  creates_cycle: number;
}

interface BudgetRow extends RowDataPacket {
  department_id: number;
  department_name: string;
  employee_count: number | string;
  total_salary_cents: number | string;
}

interface SummaryRow extends RowDataPacket {
  department_count: number | string;
  role_count: number | string;
  employee_count: number | string;
  total_salary_cents: number | string;
}

export class MysqlWorkforceRepository implements WorkforceRepository {
  constructor(private readonly pool: Pool) {}

  async listDepartments(): Promise<Department[]> {
    const [rows] = await this.pool.query<DepartmentRow[]>(
      'SELECT id, name FROM departments ORDER BY name, id',
    );
    return rows.map(mapDepartment);
  }

  async findDepartmentById(id: number): Promise<Department | null> {
    const [rows] = await this.pool.execute<DepartmentRow[]>(
      'SELECT id, name FROM departments WHERE id = ? LIMIT 1',
      [id],
    );
    return rows[0] ? mapDepartment(rows[0]) : null;
  }

  async findDepartmentByName(name: string): Promise<Department | null> {
    const [rows] = await this.pool.execute<DepartmentRow[]>(
      'SELECT id, name FROM departments WHERE name = ? LIMIT 1',
      [name],
    );
    return rows[0] ? mapDepartment(rows[0]) : null;
  }

  async createDepartment(name: string): Promise<Department> {
    const [result] = await this.pool.execute<ResultSetHeader>(
      'INSERT INTO departments (name) VALUES (?)',
      [name],
    );
    return { id: result.insertId, name };
  }

  async deleteDepartment(id: number): Promise<void> {
    await this.pool.execute('DELETE FROM departments WHERE id = ?', [id]);
  }

  async countRolesByDepartment(departmentId: number): Promise<number> {
    return this.count('SELECT COUNT(*) AS count FROM roles WHERE department_id = ?', [
      departmentId,
    ]);
  }

  async listRoles(): Promise<RoleView[]> {
    const [rows] = await this.pool.query<RoleViewRow[]>(`
      SELECT r.id, r.title, r.salary_cents, r.department_id, d.name AS department_name
      FROM roles r
      INNER JOIN departments d ON d.id = r.department_id
      ORDER BY d.name, r.title, r.id
    `);
    return rows.map((row) => ({ ...mapRole(row), departmentName: row.department_name }));
  }

  async findRoleById(id: number): Promise<Role | null> {
    const [rows] = await this.pool.execute<RoleRow[]>(
      'SELECT id, title, salary_cents, department_id FROM roles WHERE id = ? LIMIT 1',
      [id],
    );
    return rows[0] ? mapRole(rows[0]) : null;
  }

  async findRoleByTitle(title: string): Promise<Role | null> {
    const [rows] = await this.pool.execute<RoleRow[]>(
      'SELECT id, title, salary_cents, department_id FROM roles WHERE title = ? LIMIT 1',
      [title],
    );
    return rows[0] ? mapRole(rows[0]) : null;
  }

  async createRole(input: NewRole): Promise<Role> {
    const [result] = await this.pool.execute<ResultSetHeader>(
      'INSERT INTO roles (title, salary_cents, department_id) VALUES (?, ?, ?)',
      [input.title, input.salaryCents, input.departmentId],
    );
    return { id: result.insertId, ...input };
  }

  async deleteRole(id: number): Promise<void> {
    await this.pool.execute('DELETE FROM roles WHERE id = ?', [id]);
  }

  async countEmployeesByRole(roleId: number): Promise<number> {
    return this.count('SELECT COUNT(*) AS count FROM employees WHERE role_id = ?', [roleId]);
  }

  async listEmployees(): Promise<EmployeeView[]> {
    const [rows] = await this.pool.query<EmployeeViewRow[]>(`
      SELECT
        e.id,
        e.first_name,
        e.last_name,
        e.role_id,
        e.manager_id,
        r.title AS role_title,
        r.salary_cents,
        d.name AS department_name,
        CASE
          WHEN manager.id IS NULL THEN NULL
          ELSE CONCAT(manager.first_name, ' ', manager.last_name)
        END AS manager_name
      FROM employees e
      INNER JOIN roles r ON r.id = e.role_id
      INNER JOIN departments d ON d.id = r.department_id
      LEFT JOIN employees manager ON manager.id = e.manager_id
      ORDER BY e.last_name, e.first_name, e.id
    `);
    return rows.map((row) => ({
      ...mapEmployee(row),
      roleTitle: row.role_title,
      departmentName: row.department_name,
      salaryCents: toSafeInteger(row.salary_cents, 'salary'),
      managerName: row.manager_name,
    }));
  }

  async findEmployeeById(id: number): Promise<Employee | null> {
    const [rows] = await this.pool.execute<EmployeeRow[]>(
      'SELECT id, first_name, last_name, role_id, manager_id FROM employees WHERE id = ? LIMIT 1',
      [id],
    );
    return rows[0] ? mapEmployee(rows[0]) : null;
  }

  async createEmployee(input: NewEmployee): Promise<Employee> {
    const [result] = await this.pool.execute<ResultSetHeader>(
      `INSERT INTO employees (first_name, last_name, role_id, manager_id)
       VALUES (?, ?, ?, ?)`,
      [input.firstName, input.lastName, input.roleId, input.managerId],
    );
    return { id: result.insertId, ...input };
  }

  async updateEmployeeRole(employeeId: number, roleId: number): Promise<Employee> {
    await this.pool.execute('UPDATE employees SET role_id = ? WHERE id = ?', [roleId, employeeId]);
    return this.requireEmployee(employeeId);
  }

  async updateEmployeeManager(employeeId: number, managerId: number | null): Promise<Employee> {
    await this.pool.execute('UPDATE employees SET manager_id = ? WHERE id = ?', [
      managerId,
      employeeId,
    ]);
    return this.requireEmployee(employeeId);
  }

  async deleteEmployee(id: number): Promise<void> {
    await this.pool.execute('DELETE FROM employees WHERE id = ?', [id]);
  }

  async countReportsByManager(managerId: number): Promise<number> {
    return this.count('SELECT COUNT(*) AS count FROM employees WHERE manager_id = ?', [managerId]);
  }

  async wouldCreateManagementCycle(employeeId: number, managerId: number): Promise<boolean> {
    const [rows] = await this.pool.execute<CycleRow[]>(
      `WITH RECURSIVE management_chain AS (
         SELECT id, manager_id FROM employees WHERE id = ?
         UNION ALL
         SELECT e.id, e.manager_id
         FROM employees e
         INNER JOIN management_chain chain ON e.id = chain.manager_id
       )
       SELECT EXISTS(
         SELECT 1 FROM management_chain WHERE id = ?
       ) AS creates_cycle`,
      [managerId, employeeId],
    );
    return rows[0]?.creates_cycle === 1;
  }

  async getDepartmentBudgets(): Promise<DepartmentBudget[]> {
    const [rows] = await this.pool.query<BudgetRow[]>(`
      SELECT
        d.id AS department_id,
        d.name AS department_name,
        COUNT(e.id) AS employee_count,
        COALESCE(SUM(r.salary_cents), 0) AS total_salary_cents
      FROM departments d
      LEFT JOIN roles r ON r.department_id = d.id
      LEFT JOIN employees e ON e.role_id = r.id
      GROUP BY d.id, d.name
      ORDER BY d.name, d.id
    `);
    return rows.map((row) => ({
      departmentId: row.department_id,
      departmentName: row.department_name,
      employeeCount: toSafeInteger(row.employee_count, 'employee count'),
      totalSalaryCents: toSafeInteger(row.total_salary_cents, 'department budget'),
    }));
  }

  async getSummary(): Promise<WorkforceSummary> {
    const [rows] = await this.pool.query<SummaryRow[]>(`
      SELECT
        (SELECT COUNT(*) FROM departments) AS department_count,
        (SELECT COUNT(*) FROM roles) AS role_count,
        COUNT(e.id) AS employee_count,
        COALESCE(SUM(r.salary_cents), 0) AS total_salary_cents
      FROM employees e
      LEFT JOIN roles r ON r.id = e.role_id
    `);
    const row = rows[0];
    if (!row) throw new Error('MySQL returned no workforce summary.');
    return {
      departmentCount: toSafeInteger(row.department_count, 'department count'),
      roleCount: toSafeInteger(row.role_count, 'role count'),
      employeeCount: toSafeInteger(row.employee_count, 'employee count'),
      totalSalaryCents: toSafeInteger(row.total_salary_cents, 'total salary'),
    };
  }

  private async count(sql: string, parameters: Array<number | string | null>): Promise<number> {
    const [rows] = await this.pool.execute<CountRow[]>(sql, parameters);
    return toSafeInteger(rows[0]?.count ?? 0, 'record count');
  }

  private async requireEmployee(id: number): Promise<Employee> {
    const employee = await this.findEmployeeById(id);
    if (!employee) throw new Error(`Employee ${id} disappeared during update.`);
    return employee;
  }
}

function mapDepartment(row: DepartmentRow): Department {
  return { id: row.id, name: row.name };
}

function mapRole(row: RoleRow): Role {
  return {
    id: row.id,
    title: row.title,
    salaryCents: toSafeInteger(row.salary_cents, 'salary'),
    departmentId: row.department_id,
  };
}

function mapEmployee(row: EmployeeRow): Employee {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    roleId: row.role_id,
    managerId: row.manager_id,
  };
}

function toSafeInteger(value: number | string, label: string): number {
  const number = Number(value);
  if (!Number.isSafeInteger(number)) throw new Error(`MySQL returned an unsafe ${label}.`);
  return number;
}
