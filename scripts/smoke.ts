import { WorkforceService } from '../src/application/workforce-service.js';
import { loadConfig } from '../src/config.js';
import { createDatabasePool } from '../src/infrastructure/mysql/pool.js';
import { MysqlWorkforceRepository } from '../src/infrastructure/mysql/workforce-repository.js';

const config = loadConfig();
const pool = createDatabasePool(config.database);

try {
  const service = new WorkforceService(new MysqlWorkforceRepository(pool));
  const summary = await service.getSummary();
  if (summary.departmentCount === 0 || summary.roleCount === 0 || summary.employeeCount === 0) {
    throw new Error('Smoke check failed: seeded workforce records are missing.');
  }
  console.log(
    JSON.stringify(
      {
        status: 'ready',
        database: config.database.database,
        summary,
      },
      null,
      2,
    ),
  );
} finally {
  await pool.end();
}
