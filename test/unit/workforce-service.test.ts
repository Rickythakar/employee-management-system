import { beforeEach, describe, expect, it } from 'vitest';

import { WorkforceService } from '../../src/application/workforce-service.js';
import {
  ConflictError,
  DependencyError,
  NotFoundError,
  ValidationError,
} from '../../src/domain/errors.js';
import { InMemoryWorkforceRepository } from '../support/in-memory-workforce-repository.js';

describe('WorkforceService', () => {
  let repository: InMemoryWorkforceRepository;
  let service: WorkforceService;

  beforeEach(() => {
    repository = new InMemoryWorkforceRepository();
    service = new WorkforceService(repository);
  });

  it('normalizes a department name before creating it', async () => {
    const department = await service.addDepartment('  Customer Success  ');

    expect(department.name).toBe('Customer Success');
  });

  it('rejects an empty department name', async () => {
    await expect(service.addDepartment('   ')).rejects.toBeInstanceOf(ValidationError);
  });

  it('rejects a duplicate department name regardless of case', async () => {
    await service.addDepartment('Engineering');

    await expect(service.addDepartment('engineering')).rejects.toBeInstanceOf(ConflictError);
  });

  it('creates a role only when its department exists', async () => {
    await expect(
      service.addRole({ title: 'Engineer', salaryCents: 12_500_000, departmentId: 404 }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('rejects a non-positive salary', async () => {
    const department = await service.addDepartment('Engineering');

    await expect(
      service.addRole({ title: 'Engineer', salaryCents: 0, departmentId: department.id }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('creates an employee with an optional manager', async () => {
    const department = await service.addDepartment('Engineering');
    const role = await service.addRole({
      title: 'Engineer',
      salaryCents: 12_500_000,
      departmentId: department.id,
    });
    const manager = await service.addEmployee({
      firstName: 'Grace',
      lastName: 'Hopper',
      roleId: role.id,
      managerId: null,
    });

    const employee = await service.addEmployee({
      firstName: '  Ada ',
      lastName: ' Lovelace ',
      roleId: role.id,
      managerId: manager.id,
    });

    expect(employee).toMatchObject({
      firstName: 'Ada',
      lastName: 'Lovelace',
      managerId: manager.id,
    });
  });

  it('rejects a manager that does not exist', async () => {
    const department = await service.addDepartment('Engineering');
    const role = await service.addRole({
      title: 'Engineer',
      salaryCents: 12_500_000,
      departmentId: department.id,
    });

    await expect(
      service.addEmployee({
        firstName: 'Ada',
        lastName: 'Lovelace',
        roleId: role.id,
        managerId: 404,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('prevents an employee from managing themself', async () => {
    await seedEmployee(repository);

    await expect(service.changeManager(1, 1)).rejects.toBeInstanceOf(ValidationError);
  });

  it('prevents management cycles', async () => {
    await seedEmployee(repository);
    repository.employees.push({
      id: 2,
      firstName: 'Ada',
      lastName: 'Lovelace',
      roleId: 1,
      managerId: 1,
    });

    await expect(service.changeManager(1, 2)).rejects.toBeInstanceOf(ConflictError);
  });

  it('prevents deleting a department that still has roles', async () => {
    const department = await service.addDepartment('Engineering');
    await service.addRole({
      title: 'Engineer',
      salaryCents: 12_500_000,
      departmentId: department.id,
    });

    await expect(service.removeDepartment(department.id)).rejects.toBeInstanceOf(DependencyError);
  });

  it('prevents deleting a role assigned to employees', async () => {
    await seedEmployee(repository);

    await expect(service.removeRole(1)).rejects.toBeInstanceOf(DependencyError);
  });

  it('prevents deleting a manager with direct reports', async () => {
    await seedEmployee(repository);
    repository.employees.push({
      id: 2,
      firstName: 'Ada',
      lastName: 'Lovelace',
      roleId: 1,
      managerId: 1,
    });

    await expect(service.removeEmployee(1)).rejects.toBeInstanceOf(DependencyError);
  });

  it('returns an organization summary and department budgets', async () => {
    await seedEmployee(repository);

    await expect(service.getSummary()).resolves.toEqual({
      departmentCount: 1,
      roleCount: 1,
      employeeCount: 1,
      totalSalaryCents: 12_500_000,
    });
    await expect(service.getDepartmentBudgets()).resolves.toEqual([
      {
        departmentId: 1,
        departmentName: 'Engineering',
        employeeCount: 1,
        totalSalaryCents: 12_500_000,
      },
    ]);
  });

  it('lists departments, roles, and joined employee records', async () => {
    await seedEmployee(repository);

    await expect(service.listDepartments()).resolves.toHaveLength(1);
    await expect(service.listRoles()).resolves.toMatchObject([
      { title: 'Engineer', departmentName: 'Engineering' },
    ]);
    await expect(service.listEmployees()).resolves.toMatchObject([
      {
        firstName: 'Grace',
        roleTitle: 'Engineer',
        departmentName: 'Engineering',
        managerName: null,
      },
    ]);
  });

  it('changes an employee role after validating both records', async () => {
    await seedEmployee(repository);
    repository.roles.push({
      id: 2,
      title: 'Principal Engineer',
      salaryCents: 18_000_000,
      departmentId: 1,
    });

    await expect(service.changeRole(1, 2)).resolves.toMatchObject({ roleId: 2 });
    await expect(service.changeRole(404, 2)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('clears an employee manager', async () => {
    await seedEmployee(repository);
    repository.employees.push({
      id: 2,
      firstName: 'Ada',
      lastName: 'Lovelace',
      roleId: 1,
      managerId: 1,
    });

    await expect(service.changeManager(2, null)).resolves.toMatchObject({ managerId: null });
  });

  it('removes records after their dependencies are cleared', async () => {
    await seedEmployee(repository);

    await service.removeEmployee(1);
    await service.removeRole(1);
    await service.removeDepartment(1);

    expect(repository.employees).toEqual([]);
    expect(repository.roles).toEqual([]);
    expect(repository.departments).toEqual([]);
  });

  it('rejects invalid identifiers and overly long names', async () => {
    await expect(service.removeEmployee(0)).rejects.toBeInstanceOf(ValidationError);
    await expect(service.addDepartment('a'.repeat(81))).rejects.toBeInstanceOf(ValidationError);
  });
});

async function seedEmployee(repository: InMemoryWorkforceRepository): Promise<void> {
  repository.departments.push({ id: 1, name: 'Engineering' });
  repository.roles.push({
    id: 1,
    title: 'Engineer',
    salaryCents: 12_500_000,
    departmentId: 1,
  });
  repository.employees.push({
    id: 1,
    firstName: 'Grace',
    lastName: 'Hopper',
    roleId: 1,
    managerId: null,
  });
}
