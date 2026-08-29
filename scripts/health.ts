import { loadConfig } from '../src/config.js';
import { createDatabasePool } from '../src/infrastructure/mysql/pool.js';

const config = loadConfig();
const pool = createDatabasePool(config.database);

try {
  await pool.query('SELECT 1');
  console.log('Database connection is healthy.');
} finally {
  await pool.end();
}
