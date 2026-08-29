import { loadConfig } from '../src/config.js';
import { bootstrapDatabase } from '../src/infrastructure/mysql/database-lifecycle.js';

const config = loadConfig();
await bootstrapDatabase(config.database);
console.log(`Database ${config.database.database} is available.`);
