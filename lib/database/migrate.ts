import { getDatabase } from './client';
import fs from 'fs';
import path from 'path';

export interface MigrationRecord {
  version: string;
  name: string;
  applied_at: string;
}

export class DatabaseMigrator {
  private get db() {
    return getDatabase();
  }
  private migrationsPath = path.join(__dirname, 'migrations');

  constructor() {
    this.ensureMigrationTable();
  }

  private ensureMigrationTable(): void {
    const createMigrationTable = `
      CREATE TABLE IF NOT EXISTS migrations (
        version TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;

    this.db.exec(createMigrationTable);
  }

  public getAppliedMigrations(): MigrationRecord[] {
    const stmt = this.db.prepare('SELECT * FROM migrations ORDER BY version');
    return stmt.all() as MigrationRecord[];
  }

  public getPendingMigrations(): string[] {
    const appliedMigrations = new Set(
      this.getAppliedMigrations().map((m) => m.version)
    );

    const allMigrationFiles = fs
      .readdirSync(this.migrationsPath)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    return allMigrationFiles.filter((file) => {
      const version = this.extractVersionFromFilename(file);
      return !appliedMigrations.has(version);
    });
  }

  private extractVersionFromFilename(filename: string): string {
    // 从文件名提取版本号，例如 "001_initial.sql" -> "001"
    const match = filename.match(/^(\d+)_/);
    if (!match) {
      throw new Error(`Invalid migration filename format: ${filename}`);
    }
    return match[1];
  }

  private extractNameFromFilename(filename: string): string {
    // 从文件名提取名称，例如 "001_initial.sql" -> "initial"
    const match = filename.match(/^\d+_(.+)\.sql$/);
    if (!match) {
      throw new Error(`Invalid migration filename format: ${filename}`);
    }
    return match[1];
  }

  public async runMigrations(): Promise<void> {
    const pendingMigrations = this.getPendingMigrations();

    if (pendingMigrations.length === 0) {
      return;
    }

    const transaction = this.db.transaction(() => {
      for (const migrationFile of pendingMigrations) {
        this.applyMigration(migrationFile);
      }
    });

    try {
      transaction();
    } catch (error) {
      throw new Error(
        `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private applyMigration(migrationFile: string): void {
    const migrationPath = path.join(this.migrationsPath, migrationFile);
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');

    const version = this.extractVersionFromFilename(migrationFile);
    const name = this.extractNameFromFilename(migrationFile);

    try {
      // 执行迁移SQL
      this.db.exec(migrationSql);

      // 记录迁移已应用
      const recordStmt = this.db.prepare(
        'INSERT INTO migrations (version, name) VALUES (?, ?)'
      );
      recordStmt.run(version, name);
    } catch (error) {
      throw new Error(
        `Failed to apply migration ${migrationFile}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  public async runSingleMigration(migrationFile: string): Promise<void> {
    const migrationPath = path.join(this.migrationsPath, migrationFile);

    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationFile}`);
    }

    const version = this.extractVersionFromFilename(migrationFile);
    const appliedMigrations = this.getAppliedMigrations();

    if (appliedMigrations.some((m) => m.version === version)) {
      throw new Error(`Migration ${version} has already been applied`);
    }

    const transaction = this.db.transaction(() => {
      this.applyMigration(migrationFile);
    });

    try {
      transaction();
    } catch (error) {
      throw new Error(
        `Single migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  public getMigrationStatus(): {
    applied: MigrationRecord[];
    pending: string[];
  } {
    return {
      applied: this.getAppliedMigrations(),
      pending: this.getPendingMigrations(),
    };
  }
}

// Convenience function for running all pending migrations
export async function runMigrations(): Promise<void> {
  const migrator = new DatabaseMigrator();
  await migrator.runMigrations();
}
