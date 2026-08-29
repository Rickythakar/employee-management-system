import { loadConfig } from '../src/config.js';
import { runMigrations } from '../src/infrastructure/mysql/database-lifecycle.js';

const config = loadConfig();
const applied = await runMigrations(config.database);
console.log(
  applied.length === 0 ? 'Database is already current.' : `Applied: ${applied.join(', ')}`,
);
