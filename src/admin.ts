#!/usr/bin/env node

import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { WorkforceService } from './application/workforce-service.js';
import { loadConfig, type AppConfig } from './config.js';
import type { WorkforceSummary } from './domain/models.js';
import {
  bootstrapDatabase,
  runMigrations,
  runSeedFiles,
} from './infrastructure/mysql/database-lifecycle.js';
import { createDatabasePool } from './infrastructure/mysql/pool.js';
import { MysqlWorkforceRepository } from './infrastructure/mysql/workforce-repository.js';

type AdminCommand = 'bootstrap' | 'migrate' | 'seed' | 'health' | 'smoke';
const commands: AdminCommand[] = ['bootstrap', 'migrate', 'seed', 'health', 'smoke'];

export function parseAdminCommand(value: string | undefined): AdminCommand {
  if (!commands.includes(value as AdminCommand)) {
    throw new Error(`Usage: admin <${commands.join('|')}>`);
  }
  return value as AdminCommand;
}

export async function runAdmin(command: AdminCommand, config: AppConfig): Promise<string> {
  if (command === 'bootstrap') {
    await bootstrapDatabase(config.database);
    return `Database ${config.database.database} is available.`;
  }
  if (command === 'migrate') {
    const applied = await runMigrations(config.database);
    return applied.length === 0 ? 'Database is already current.' : `Applied: ${applied.join(', ')}`;
  }
  if (command === 'seed') {
    const applied = await runSeedFiles(config.database);
    return `Loaded seed data from: ${applied.join(', ')}`;
  }

  const pool = createDatabasePool(config.database);
  try {
    if (command === 'health') {
      await pool.query('SELECT 1');
      return 'Database connection is healthy.';
    }

    const service = new WorkforceService(new MysqlWorkforceRepository(pool));
    const summary = await service.getSummary();
    if (summary.departmentCount === 0 || summary.roleCount === 0 || summary.employeeCount === 0) {
      throw new Error('Smoke check failed: seeded workforce records are missing.');
    }
    return renderSmokeResult(config.database.database, summary);
  } finally {
    await pool.end();
  }
}

export function renderSmokeResult(database: string, summary: WorkforceSummary): string {
  return JSON.stringify({ status: 'ready', database, summary }, null, 2);
}

const isMainModule =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMainModule) {
  try {
    const command = parseAdminCommand(process.argv[2]);
    console.log(await runAdmin(command, loadConfig()));
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Administrative command failed.');
    process.exitCode = 1;
  }
}
