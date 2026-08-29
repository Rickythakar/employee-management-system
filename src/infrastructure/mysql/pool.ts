import mysql, { type Pool, type PoolOptions } from 'mysql2/promise';

import type { AppConfig } from '../../config.js';

export function createDatabasePool(config: AppConfig['database']): Pool {
  const options: PoolOptions = {
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    connectionLimit: config.connectionLimit,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10_000,
    supportBigNumbers: true,
    bigNumberStrings: false,
    timezone: 'Z',
    charset: 'utf8mb4',
  };

  return mysql.createPool(options);
}
