import type { Pool } from 'mysql2/promise';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { WorkforceService } from '../../src/application/workforce-service.js';
import { loadConfig } from '../../src/config.js';
import { ConflictError, DependencyError } from '../../src/domain/errors.js';
import { runMigrations } from '../../src/infrastructure/mysql/database-lifecycle.js';
import { createDatabasePool } from '../../src/infrastructure/mysql/pool.js';
import { MysqlWorkforceRepository } from '../../src/infrastructure/mysql/workforce-repository.js';

const integrationEnabled = process.env.RUN_INTEGRATION_TESTS === 'true';

describe.skipIf(!integrationEnabled)('MysqlWorkforceRepository', () => {
  let pool: Pool;
  let service: WorkforceService;
  const suffix = `${Date.now()}_${process.pid}`;
  const departmentName = `Integration ${suffix}`;

  beforeAll(async () => {
    const config = loadConfig();
    await runMigrations(config.database);
    pool = createDatabasePool(config.database);
    service = new WorkforceService(new MysqlWorkforceRepository(pool));
  });

  afterAll(async () => {
    if (!pool) return;
    await pool.execute(
      `DELETE e FROM employees e
       INNER JOIN roles r ON r.id = e.role_id
       INNER JOIN departments d ON d.id = r.department_id
       WHERE d.name = ?`,
      [departmentName],
    );
    await pool.execute(
      `DELETE r FROM roles r
       INNER JOIN departments d ON d.id = r.department_id
       WHERE d.name = ?`,
      [departmentName],
    );
    await pool.execute('DELETE FROM departments WHERE name = ?', [departmentName]);
    await pool.end();
  });

  it('persists the complete workforce lifecycle against MySQL', async () => {
    const baseline = await service.getSummary();
    const department = await service.addDepartment(departmentName);
    const engineer = await service.addRole({
      title: `Integration Engineer ${suffix}`,
      salaryCents: 14_000_000,
      departmentId: department.id,
    });
    const lead = await service.addRole({
      title: `Integration Lead ${suffix}`,
      salaryCents: 18_000_000,
      departmentId: department.id,
    });
    const manager = await service.addEmployee({
      firstName: 'Integration',
      lastName: 'Manager',
      roleId: lead.id,
      managerId: null,
    });
    const employee = await service.addEmployee({
      firstName: 'Integration',
      lastName: 'Employee',
      roleId: engineer.id,
      managerId: manager.id,
    });

    const employeeView = (await service.listEmployees()).find(
      (candidate) => candidate.id === employee.id,
    );
    expect(employeeView).toMatchObject({
      roleTitle: engineer.title,
      departmentName,
      managerName: 'Integration Manager',
      salaryCents: 14_000_000,
    });

    await expect(service.changeRole(employee.id, lead.id)).resolves.toMatchObject({
      roleId: lead.id,
    });
    await expect(service.changeManager(manager.id, employee.id)).rejects.toBeInstanceOf(
      ConflictError,
    );
    await expect(service.removeRole(lead.id)).rejects.toBeInstanceOf(DependencyError);
    await expect(service.removeEmployee(manager.id)).rejects.toBeInstanceOf(DependencyError);

    const budget = (await service.getDepartmentBudgets()).find(
      (candidate) => candidate.departmentId === department.id,
    );
    expect(budget).toEqual({
      departmentId: department.id,
      departmentName,
      employeeCount: 2,
      totalSalaryCents: 36_000_000,
    });
    await expect(service.getSummary()).resolves.toMatchObject({
      departmentCount: baseline.departmentCount + 1,
      roleCount: baseline.roleCount + 2,
      employeeCount: baseline.employeeCount + 2,
      totalSalaryCents: baseline.totalSalaryCents + 36_000_000,
    });

    await service.removeEmployee(employee.id);
    await service.removeEmployee(manager.id);
    await service.removeRole(engineer.id);
    await service.removeRole(lead.id);
    await service.removeDepartment(department.id);
  });
});
