#!/usr/bin/env node

import { WorkforceService } from './application/workforce-service.js';
import { InquirerPrompt } from './cli/inquirer-prompt.js';
import { ConsoleOutput } from './cli/output-adapter.js';
import { WorkforceCli } from './cli/workforce-cli.js';
import { loadConfig } from './config.js';
import { createDatabasePool } from './infrastructure/mysql/pool.js';
import { MysqlWorkforceRepository } from './infrastructure/mysql/workforce-repository.js';

async function main(): Promise<void> {
  const config = loadConfig();
  const pool = createDatabasePool(config.database);

  try {
    const service = new WorkforceService(new MysqlWorkforceRepository(pool));
    await new WorkforceCli(service, new InquirerPrompt(), new ConsoleOutput()).run();
  } finally {
    await pool.end();
  }
}

try {
  await main();
} catch (error) {
  if (error instanceof Error && error.name === 'ExitPromptError') {
    console.log('\nGoodbye.');
  } else {
    console.error(error instanceof Error ? error.message : 'The application could not start.');
    process.exitCode = 1;
  }
}
