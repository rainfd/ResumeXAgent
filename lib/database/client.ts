import Database from 'better-sqlite3';
import path from 'path';

let database: Database.Database | null = null;

export interface DatabaseOptions {
  readonly?: boolean;
  fileMustExist?: boolean;
  timeout?: number;
  verbose?: (message?: unknown, ...additionalArgs: unknown[]) => void;
}

export function initializeDatabase(dbPath?: string, options: DatabaseOptions = {}): Database.Database {
  if (database) {
    return database;
  }

  const databasePath = dbPath || process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'database', 'resume.db');
  
  // 确保数据库目录存在
  const dbDirectory = path.dirname(databasePath);
  const fs = require('fs');
  if (!fs.existsSync(dbDirectory)) {
    fs.mkdirSync(dbDirectory, { recursive: true });
  }

  try {
    database = new Database(databasePath, {
      verbose: options.verbose || (() => {}),
      readonly: options.readonly || false,
      fileMustExist: options.fileMustExist || false,
      timeout: options.timeout || 5000,
    });

    // 启用 WAL 模式以改善并发性能
    database.pragma('journal_mode = WAL');
    // 启用外键约束
    database.pragma('foreign_keys = ON');

    return database;
  } catch (error) {
    throw new Error(`Failed to initialize database: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function getDatabase(): Database.Database {
  if (!database) {
    return initializeDatabase();
  }
  return database;
}

export function closeDatabase(): void {
  if (database) {
    database.close();
    database = null;
  }
}

export function isDatabaseOpen(): boolean {
  return database !== null && database.open;
}

export function getDatabasePath(): string {
  return process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'database', 'resume.db');
}