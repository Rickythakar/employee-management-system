import { loadConfig } from '../src/config.js';
import { runSeedFiles } from '../src/infrastructure/mysql/database-lifecycle.js';

const config = loadConfig();
const applied = await runSeedFiles(config.database);
console.log(`Loaded seed data from: ${applied.join(', ')}`);
