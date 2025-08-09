import { getDatabase, closeDatabase, isDatabaseOpen } from './client';
import Database from 'better-sqlite3';
import { logger } from '../utils/logger';

export interface DatabaseHealth {
  isOpen: boolean;
  canRead: boolean;
  canWrite: boolean;
  tablesExist: boolean;
  lastError?: string;
}

export interface TransactionOptions {
  immediate?: boolean;
  exclusive?: boolean;
}

export class DatabaseHelpers {
  private get db() {
    return getDatabase();
  }

  /**
   * 允许的表名白名单，用于防止 SQL 注入
   */
  private readonly allowedTables = [
    'resumes',
    'jobs',
    'analyses',
    'job_matches',
    'custom_prompts',
    'migrations',
  ] as const;

  /**
   * 验证表名是否在允许的白名单中
   */
  private validateTableName(tableName: string): void {
    if (!this.allowedTables.includes(tableName as any)) {
      const error = new Error(
        `Invalid table name: ${tableName}. Allowed tables: ${this.allowedTables.join(', ')}`
      );
      logger.error('SQL injection attempt blocked', 'SECURITY', error, {
        attemptedTable: tableName,
        allowedTables: this.allowedTables,
      });
      throw error;
    }
  }

  /**
   * 检查数据库健康状态
   */
  public async checkHealth(): Promise<DatabaseHealth> {
    const health: DatabaseHealth = {
      isOpen: isDatabaseOpen(),
      canRead: false,
      canWrite: false,
      tablesExist: false,
    };

    try {
      if (!health.isOpen) {
        health.lastError = 'Database is not open';
        return health;
      }

      // 测试读取操作
      try {
        this.db.prepare('SELECT 1 as test').get();
        health.canRead = true;
      } catch (error) {
        health.lastError = `Read test failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        logger.error(
          'Database read test failed',
          'DATABASE',
          error instanceof Error ? error : undefined
        );
        return health;
      }

      // 测试写入操作
      try {
        this.db
          .prepare('CREATE TEMP TABLE IF NOT EXISTS health_check (id INTEGER)')
          .run();
        this.db.prepare('INSERT INTO temp.health_check (id) VALUES (1)').run();
        this.db.prepare('DROP TABLE temp.health_check').run();
        health.canWrite = true;
      } catch (error) {
        health.lastError = `Write test failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        logger.error(
          'Database write test failed',
          'DATABASE',
          error instanceof Error ? error : undefined
        );
        return health;
      }

      // 检查核心表是否存在
      try {
        const tables = this.getTableNames();
        const requiredTables = [
          'resumes',
          'jobs',
          'analyses',
          'job_matches',
          'custom_prompts',
        ];
        health.tablesExist = requiredTables.every((table) =>
          tables.includes(table)
        );
      } catch (error) {
        health.lastError = `Table check failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    } catch (error) {
      health.lastError =
        error instanceof Error ? error.message : 'Unknown health check error';
    }

    return health;
  }

  /**
   * 获取数据库中所有表名
   */
  public getTableNames(): string[] {
    const stmt = this.db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    );
    const tables = stmt.all() as { name: string }[];
    return tables.map((table) => table.name);
  }

  /**
   * 获取表的行数
   */
  public getTableRowCount(tableName: string): number {
    // 验证表名，防止 SQL 注入
    this.validateTableName(tableName);

    const stmt = this.db.prepare(
      `SELECT COUNT(*) as count FROM "${tableName}"`
    );
    const result = stmt.get() as { count: number };

    logger.debug(`Got row count for table ${tableName}`, 'DATABASE', {
      table: tableName,
      count: result.count,
    });

    return result.count;
  }

  /**
   * 获取数据库统计信息
   */
  public getDatabaseStats(): Record<string, number> {
    const tables = this.getTableNames();
    const stats: Record<string, number> = {};

    tables.forEach((table) => {
      try {
        stats[table] = this.getTableRowCount(table);
      } catch (error) {
        stats[table] = -1; // 表示错误
      }
    });

    return stats;
  }

  /**
   * 执行带事务的操作
   */
  public transaction<T>(
    operations: (db: Database.Database) => T,
    options: TransactionOptions = {}
  ): T {
    const transaction = this.db.transaction(operations);

    if (options.immediate) {
      return transaction.immediate(this.db);
    } else if (options.exclusive) {
      return transaction.exclusive(this.db);
    } else {
      return transaction(this.db);
    }
  }

  /**
   * 异步事务包装器（虽然 better-sqlite3 是同步的，但为了API一致性）
   */
  public async transactionAsync<T>(
    operations: (db: Database.Database) => T | Promise<T>,
    options: TransactionOptions = {}
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      try {
        const result = this.transaction(() => {
          return operations(this.db);
        }, options);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 备份数据库
   */
  public async backup(backupPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.db
          .backup(backupPath)
          .then(() => resolve())
          .catch((error) => reject(error));
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 压缩数据库（VACUUM）
   */
  public vacuum(): void {
    this.db.exec('VACUUM');
  }

  /**
   * 分析数据库以更新统计信息
   */
  public analyze(): void {
    this.db.exec('ANALYZE');
  }

  /**
   * 获取数据库文件大小（字节）
   */
  public getDatabaseSize(): number {
    const stmt = this.db.prepare(
      'SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()'
    );
    const result = stmt.get() as { size: number };
    return result.size;
  }

  /**
   * 设置数据库配置
   */
  public setPragma(pragma: string, value: string | number): void {
    this.db.pragma(`${pragma} = ${value}`);
  }

  /**
   * 获取数据库配置
   */
  public getPragma(pragma: string): any {
    return this.db.pragma(pragma);
  }

  /**
   * 优雅关闭数据库连接
   */
  public close(): void {
    closeDatabase();
  }

  /**
   * 检查表是否存在
   */
  public tableExists(tableName: string): boolean {
    const stmt = this.db.prepare(
      "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name=?"
    );
    const result = stmt.get(tableName) as { count: number };
    return result.count > 0;
  }

  /**
   * 检查索引是否存在
   */
  public indexExists(indexName: string): boolean {
    const stmt = this.db.prepare(
      "SELECT COUNT(*) as count FROM sqlite_master WHERE type='index' AND name=?"
    );
    const result = stmt.get(indexName) as { count: number };
    return result.count > 0;
  }

  /**
   * 获取表结构信息
   */
  public getTableSchema(tableName: string): any[] {
    // 验证表名，防止 SQL 注入
    this.validateTableName(tableName);

    const stmt = this.db.prepare(`PRAGMA table_info("${tableName}")`);
    const result = stmt.all();

    logger.debug(`Retrieved schema for table ${tableName}`, 'DATABASE', {
      table: tableName,
      columnCount: result.length,
    });

    return result;
  }

  /**
   * 清空表数据（保留结构）
   */
  public truncateTable(tableName: string): void {
    // 验证表名，防止 SQL 注入
    this.validateTableName(tableName);

    logger.warn(`Truncating table ${tableName}`, 'DATABASE', {
      table: tableName,
    });

    this.db.prepare(`DELETE FROM "${tableName}"`).run();
    this.db.prepare('VACUUM').run();
  }

  /**
   * 清空所有表数据
   */
  public truncateAllTables(): void {
    const tables = this.getTableNames().filter((name) => name !== 'migrations');

    this.transaction(() => {
      // 临时禁用外键约束
      this.db.pragma('foreign_keys = OFF');

      tables.forEach((table) => {
        this.db.prepare(`DELETE FROM "${table}"`).run();
      });

      // 重新启用外键约束
      this.db.pragma('foreign_keys = ON');
    });

    this.vacuum();
  }
}

// 创建单例实例函数
export function getDbHelpers(): DatabaseHelpers {
  return new DatabaseHelpers();
}

// 导出默认实例
export const dbHelpers = {
  checkHealth: () => getDbHelpers().checkHealth(),
  getTableNames: () => getDbHelpers().getTableNames(),
  getTableRowCount: (tableName: string) =>
    getDbHelpers().getTableRowCount(tableName),
  getDatabaseStats: () => getDbHelpers().getDatabaseStats(),
  transaction: <T>(
    operations: (db: Database.Database) => T,
    options?: TransactionOptions
  ) => getDbHelpers().transaction(operations, options),
  transactionAsync: <T>(
    operations: (db: Database.Database) => T | Promise<T>,
    options?: TransactionOptions
  ) => getDbHelpers().transactionAsync(operations, options),
  backup: (backupPath: string) => getDbHelpers().backup(backupPath),
  vacuum: () => getDbHelpers().vacuum(),
  analyze: () => getDbHelpers().analyze(),
  getDatabaseSize: () => getDbHelpers().getDatabaseSize(),
  setPragma: (pragma: string, value: string | number) =>
    getDbHelpers().setPragma(pragma, value),
  getPragma: (pragma: string) => getDbHelpers().getPragma(pragma),
  close: () => getDbHelpers().close(),
  tableExists: (tableName: string) => getDbHelpers().tableExists(tableName),
  indexExists: (indexName: string) => getDbHelpers().indexExists(indexName),
  getTableSchema: (tableName: string) =>
    getDbHelpers().getTableSchema(tableName),
  truncateTable: (tableName: string) => getDbHelpers().truncateTable(tableName),
  truncateAllTables: () => getDbHelpers().truncateAllTables(),
};
