import Database from 'better-sqlite3';
import { getDatabase } from '../database/client';
import { logger } from '../utils/logger';
import { ValidationSchema, validateData } from '../utils/validation';

export abstract class BaseRepository<T> {
  protected get db(): Database.Database {
    return getDatabase();
  }
  protected tableName: string;
  protected createSchema?: ValidationSchema;
  protected updateSchema?: ValidationSchema;

  constructor(
    tableName: string,
    createSchema?: ValidationSchema,
    updateSchema?: ValidationSchema
  ) {
    this.tableName = tableName;
    this.createSchema = createSchema;
    this.updateSchema = updateSchema;
  }

  protected generateId(): string {
    // 生成UUID v4
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }

  protected serializeJson(value: any): string | null {
    if (value === null || value === undefined) return null;
    return JSON.stringify(value);
  }

  protected deserializeJson(value: string | null): any {
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  /**
   * 验证创建数据
   */
  protected validateCreateData<TData>(data: TData): TData {
    if (this.createSchema) {
      try {
        return validateData(data, this.createSchema);
      } catch (error) {
        logger.error(
          `Validation failed for creating ${this.tableName}`,
          'VALIDATION',
          error instanceof Error ? error : undefined,
          { data }
        );
        throw error;
      }
    }
    return data;
  }

  /**
   * 验证更新数据
   */
  protected validateUpdateData<TData>(data: TData): TData {
    if (this.updateSchema) {
      try {
        return validateData(data, this.updateSchema);
      } catch (error) {
        logger.error(
          `Validation failed for updating ${this.tableName}`,
          'VALIDATION',
          error instanceof Error ? error : undefined,
          { data }
        );
        throw error;
      }
    }
    return data;
  }

  /**
   * 记录操作日志
   */
  protected logOperation(
    operation: string,
    recordId?: string,
    duration?: number,
    metadata?: Record<string, any>
  ): void {
    logger.logDatabaseOperation(
      operation,
      this.tableName,
      recordId,
      duration,
      metadata
    );
  }

  public abstract create(data: Partial<T>): T;
  public abstract findById(id: string): T | null;
  public abstract findAll(limit?: number, offset?: number): T[];
  public abstract update(id: string, data: Partial<T>): T | null;
  public abstract delete(id: string): boolean;
}
