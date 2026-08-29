import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import mysql, { type Connection, type RowDataPacket } from 'mysql2/promise';

import type { AppConfig } from '../../config.js';

interface AppliedMigrationRow extends RowDataPacket {
  filename: string;
  checksum: string;
}

const MIGRATION_LOCK = 'employee_management_system_migrations';

export async function bootstrapDatabase(config: AppConfig['database']): Promise<void> {
  const connection = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    charset: 'utf8mb4',
  });

  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`,
    );
  } finally {
    await connection.end();
  }
}

export async function runMigrations(
  config: AppConfig['database'],
  migrationsDirectory = path.resolve(process.cwd(), 'db/migrations'),
): Promise<string[]> {
  const connection = await lifecycleConnection(config);
  const appliedNow: string[] = [];

  try {
    await acquireMigrationLock(connection);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename VARCHAR(255) NOT NULL,
        checksum CHAR(64) NOT NULL,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (filename)
      ) ENGINE = InnoDB
    `);

    const [rows] = await connection.query<AppliedMigrationRow[]>(
      'SELECT filename, checksum FROM schema_migrations ORDER BY filename',
    );
    const applied = new Map(rows.map((row) => [row.filename, row.checksum]));
    const files = (await readdir(migrationsDirectory))
      .filter((filename) => /^\d+_.+\.sql$/.test(filename))
      .sort();

    for (const filename of files) {
      const sql = await readFile(path.join(migrationsDirectory, filename), 'utf8');
      const checksum = createHash('sha256').update(sql).digest('hex');
      const recordedChecksum = applied.get(filename);

      if (recordedChecksum && recordedChecksum !== checksum) {
        throw new Error(`Applied migration ${filename} has been modified.`);
      }
      if (recordedChecksum) continue;

      await connection.query(sql);
      await connection.execute('INSERT INTO schema_migrations (filename, checksum) VALUES (?, ?)', [
        filename,
        checksum,
      ]);
      appliedNow.push(filename);
    }

    return appliedNow;
  } finally {
    await releaseMigrationLock(connection);
    await connection.end();
  }
}

export async function runSeedFiles(
  config: AppConfig['database'],
  seedsDirectory = path.resolve(process.cwd(), 'db/seeds'),
): Promise<string[]> {
  const connection = await lifecycleConnection(config);
  const applied: string[] = [];

  try {
    const files = (await readdir(seedsDirectory))
      .filter((filename) => /^\d+_.+\.sql$/.test(filename))
      .sort();
    for (const filename of files) {
      const sql = await readFile(path.join(seedsDirectory, filename), 'utf8');
      await connection.query(sql);
      applied.push(filename);
    }
    return applied;
  } finally {
    await connection.end();
  }
}

async function lifecycleConnection(config: AppConfig['database']): Promise<Connection> {
  return mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    charset: 'utf8mb4',
    multipleStatements: true,
    supportBigNumbers: true,
    bigNumberStrings: false,
  });
}

async function acquireMigrationLock(connection: Connection): Promise<void> {
  const [rows] = await connection.query<Array<RowDataPacket & { acquired: number }>>(
    'SELECT GET_LOCK(?, 30) AS acquired',
    [MIGRATION_LOCK],
  );
  if (rows[0]?.acquired !== 1) throw new Error('Could not acquire the migration lock.');
}

async function releaseMigrationLock(connection: Connection): Promise<void> {
  try {
    await connection.query('SELECT RELEASE_LOCK(?)', [MIGRATION_LOCK]);
  } catch {
    // The connection may already be unusable; MySQL releases named locks on disconnect.
  }
}
