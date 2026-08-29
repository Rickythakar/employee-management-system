import { beforeEach, describe, expect, it } from 'vitest';

import { WorkforceCli } from '../../src/cli/workforce-cli.js';
import { WorkforceService } from '../../src/application/workforce-service.js';
import { CapturedOutput } from '../support/captured-output.js';
import { InMemoryWorkforceRepository } from '../support/in-memory-workforce-repository.js';
import { ScriptedPrompt } from '../support/scripted-prompt.js';

describe('WorkforceCli', () => {
  let repository: InMemoryWorkforceRepository;
  let service: WorkforceService;
  let output: CapturedOutput;

  beforeEach(() => {
    repository = new InMemoryWorkforceRepository();
    service = new WorkforceService(repository);
    output = new CapturedOutput();
  });

  it('routes a complete create and reporting workflow', async () => {
    const prompt = new ScriptedPrompt([
      'add-department',
      'Engineering',
      'add-role',
      'Engineer',
      '125000',
      1,
      'add-employee',
      'Ada',
      'Lovelace',
      1,
      null,
      'view-summary',
      'view-employees',
      'exit',
    ]);

    await new WorkforceCli(service, prompt, output).run();

    expect(repository.departments).toMatchObject([{ name: 'Engineering' }]);
    expect(repository.roles).toMatchObject([{ title: 'Engineer', salaryCents: 12_500_000 }]);
    expect(repository.employees).toMatchObject([{ firstName: 'Ada', lastName: 'Lovelace' }]);
    expect(output.tables.at(-2)).toEqual([
      {
        Departments: 1,
        Roles: 1,
        Employees: 1,
        'Annual payroll': '$125,000.00',
      },
    ]);
    expect(output.tables.at(-1)?.[0]).toMatchObject({ Employee: 'Ada Lovelace' });
  });

  it('reports a validation error and returns to the main menu', async () => {
    const prompt = new ScriptedPrompt(['add-department', '   ', 'exit']);

    await new WorkforceCli(service, prompt, output).run();

    expect(output.errors).toEqual(['Department name is required.']);
    expect(repository.departments).toEqual([]);
  });

  it('requires confirmation before deleting a record', async () => {
    repository.departments.push({ id: 1, name: 'Engineering' });
    const prompt = new ScriptedPrompt(['remove-department', 1, false, 'exit']);

    await new WorkforceCli(service, prompt, output).run();

    expect(repository.departments).toHaveLength(1);
    expect(output.messages).toContain('Deletion cancelled.');
  });

  it('routes views, updates, and dependency-safe removals', async () => {
    repository.departments.push({ id: 1, name: 'Engineering' });
    repository.roles.push({
      id: 1,
      title: 'Engineer',
      salaryCents: 12_500_000,
      departmentId: 1,
    });
    repository.employees.push(
      {
        id: 1,
        firstName: 'Grace',
        lastName: 'Hopper',
        roleId: 1,
        managerId: null,
      },
      {
        id: 2,
        firstName: 'Ada',
        lastName: 'Lovelace',
        roleId: 1,
        managerId: 1,
      },
    );
    const prompt = new ScriptedPrompt([
      'view-departments',
      'view-roles',
      'view-budgets',
      'update-role',
      2,
      1,
      'update-manager',
      2,
      null,
      'remove-employee',
      2,
      true,
      'remove-employee',
      1,
      true,
      'remove-role',
      1,
      true,
      'remove-department',
      1,
      true,
      'exit',
    ]);

    await new WorkforceCli(service, prompt, output).run();

    expect(repository.departments).toEqual([]);
    expect(repository.roles).toEqual([]);
    expect(repository.employees).toEqual([]);
    expect(output.messages).toContain('Employee role updated.');
    expect(output.messages).toContain('Employee manager updated.');
    expect(output.tables).toHaveLength(3);
  });
});
