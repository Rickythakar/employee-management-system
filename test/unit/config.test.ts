import { describe, expect, it } from 'vitest';

import { parseConfig } from '../../src/config.js';

const validEnvironment = {
  NODE_ENV: 'test',
  DB_HOST: '127.0.0.1',
  DB_PORT: '3306',
  DB_USER: 'employee_app',
  DB_PASSWORD: 'secret',
  DB_NAME: 'employee_manager_test',
  DB_CONNECTION_LIMIT: '5',
};

describe('parseConfig', () => {
  it('parses and normalizes a complete database configuration', () => {
    const config = parseConfig(validEnvironment);

    expect(config.database).toEqual({
      host: '127.0.0.1',
      port: 3306,
      user: 'employee_app',
      password: 'secret',
      database: 'employee_manager_test',
      connectionLimit: 5,
    });
    expect(config.environment).toBe('test');
  });

  it('rejects a missing database password', () => {
    expect(() => parseConfig({ ...validEnvironment, DB_PASSWORD: '' })).toThrow(
      'Invalid environment configuration',
    );
  });

  it('rejects unsafe database identifiers', () => {
    expect(() =>
      parseConfig({ ...validEnvironment, DB_NAME: 'employee-manager; DROP DATABASE prod' }),
    ).toThrow('Invalid environment configuration');
  });
});
