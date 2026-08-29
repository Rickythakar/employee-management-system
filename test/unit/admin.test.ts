import { describe, expect, it } from 'vitest';

import { parseAdminCommand, renderSmokeResult } from '../../src/admin.js';

describe('admin commands', () => {
  it('accepts every supported command', () => {
    expect(['bootstrap', 'migrate', 'seed', 'health', 'smoke'].map(parseAdminCommand)).toEqual([
      'bootstrap',
      'migrate',
      'seed',
      'health',
      'smoke',
    ]);
  });

  it('rejects missing and unsupported commands', () => {
    expect(() => parseAdminCommand(undefined)).toThrow('Usage:');
    expect(() => parseAdminCommand('drop')).toThrow('Usage:');
  });

  it('renders deterministic smoke evidence', () => {
    expect(
      JSON.parse(
        renderSmokeResult('employee_manager', {
          departmentCount: 3,
          roleCount: 4,
          employeeCount: 4,
          totalSalaryCents: 52_000_000,
        }),
      ),
    ).toEqual({
      status: 'ready',
      database: 'employee_manager',
      summary: {
        departmentCount: 3,
        roleCount: 4,
        employeeCount: 4,
        totalSalaryCents: 52_000_000,
      },
    });
  });
});
