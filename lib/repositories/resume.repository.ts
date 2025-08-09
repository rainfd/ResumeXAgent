import { BaseRepository } from './base.repository';
import { validationSchemas } from '../utils/validation';

export interface Resume {
  id: string;
  original_filename: string;
  file_type: 'pdf' | 'markdown' | 'txt';
  raw_text: string;
  parsed_data?: any;
  basic_info?: any;
  education?: any;
  work_experience?: any;
  projects?: any;
  skills?: any;
  created_at: string;
  updated_at: string;
}

export interface CreateResumeData {
  original_filename: string;
  file_type: 'pdf' | 'markdown' | 'txt';
  raw_text: string;
  parsed_data?: any;
  basic_info?: any;
  education?: any;
  work_experience?: any;
  projects?: any;
  skills?: any;
}

export class ResumeRepository extends BaseRepository<Resume> {
  constructor() {
    super(
      'resumes',
      validationSchemas.createResume,
      validationSchemas.updateResume
    );
  }

  public create(data: CreateResumeData): Resume {
    // 验证输入数据
    const validatedData = this.validateCreateData(data);

    const id = this.generateId();
    const now = new Date().toISOString();
    const startTime = Date.now();

    const stmt = this.db.prepare(`
      INSERT INTO resumes (
        id, original_filename, file_type, raw_text, parsed_data, 
        basic_info, education, work_experience, projects, skills,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    try {
      stmt.run(
        id,
        validatedData.original_filename,
        validatedData.file_type,
        validatedData.raw_text,
        this.serializeJson(validatedData.parsed_data),
        this.serializeJson(validatedData.basic_info),
        this.serializeJson(validatedData.education),
        this.serializeJson(validatedData.work_experience),
        this.serializeJson(validatedData.projects),
        this.serializeJson(validatedData.skills),
        now,
        now
      );

      const created = this.findById(id);
      if (!created) {
        throw new Error('Failed to create resume');
      }

      const duration = Date.now() - startTime;
      this.logOperation('create', id, duration, {
        filename: validatedData.original_filename,
        fileType: validatedData.file_type,
      });

      return created;
    } catch (error) {
      this.logOperation('create_failed', id, Date.now() - startTime, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error(
        `Failed to create resume: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  public findById(id: string): Resume | null {
    const stmt = this.db.prepare('SELECT * FROM resumes WHERE id = ?');
    const result = stmt.get(id) as any;

    if (!result) return null;

    return this.mapRowToResume(result);
  }

  public findAll(limit = 50, offset = 0): Resume[] {
    const stmt = this.db.prepare(`
      SELECT * FROM resumes 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `);

    const results = stmt.all(limit, offset) as any[];
    return results.map((row) => this.mapRowToResume(row));
  }

  public findByFilename(filename: string): Resume[] {
    const stmt = this.db.prepare(
      'SELECT * FROM resumes WHERE original_filename = ? ORDER BY created_at DESC'
    );
    const results = stmt.all(filename) as any[];
    return results.map((row) => this.mapRowToResume(row));
  }

  public findByFileType(fileType: 'pdf' | 'markdown' | 'txt'): Resume[] {
    const stmt = this.db.prepare(
      'SELECT * FROM resumes WHERE file_type = ? ORDER BY created_at DESC'
    );
    const results = stmt.all(fileType) as any[];
    return results.map((row) => this.mapRowToResume(row));
  }

  public update(id: string, data: Partial<CreateResumeData>): Resume | null {
    // 验证输入数据
    const validatedData = this.validateUpdateData(data);

    const existing = this.findById(id);
    if (!existing) return null;

    const startTime = Date.now();

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (validatedData.original_filename !== undefined) {
      updateFields.push('original_filename = ?');
      updateValues.push(validatedData.original_filename);
    }
    if (validatedData.file_type !== undefined) {
      updateFields.push('file_type = ?');
      updateValues.push(validatedData.file_type);
    }
    if (validatedData.raw_text !== undefined) {
      updateFields.push('raw_text = ?');
      updateValues.push(validatedData.raw_text);
    }
    if (validatedData.parsed_data !== undefined) {
      updateFields.push('parsed_data = ?');
      updateValues.push(this.serializeJson(validatedData.parsed_data));
    }
    if (validatedData.basic_info !== undefined) {
      updateFields.push('basic_info = ?');
      updateValues.push(this.serializeJson(validatedData.basic_info));
    }
    if (validatedData.education !== undefined) {
      updateFields.push('education = ?');
      updateValues.push(this.serializeJson(validatedData.education));
    }
    if (validatedData.work_experience !== undefined) {
      updateFields.push('work_experience = ?');
      updateValues.push(this.serializeJson(validatedData.work_experience));
    }
    if (validatedData.projects !== undefined) {
      updateFields.push('projects = ?');
      updateValues.push(this.serializeJson(validatedData.projects));
    }
    if (validatedData.skills !== undefined) {
      updateFields.push('skills = ?');
      updateValues.push(this.serializeJson(validatedData.skills));
    }

    if (updateFields.length === 0) return existing;

    // updated_at 会通过触发器自动更新
    const stmt = this.db.prepare(`
      UPDATE resumes SET ${updateFields.join(', ')} WHERE id = ?
    `);

    try {
      updateValues.push(id);
      stmt.run(...updateValues);

      const updated = this.findById(id);
      const duration = Date.now() - startTime;
      this.logOperation('update', id, duration, {
        fieldsUpdated: updateFields.length,
        fields: updateFields.map((f) => f.split(' = ?')[0]),
      });

      return updated;
    } catch (error) {
      this.logOperation('update_failed', id, Date.now() - startTime, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error(
        `Failed to update resume: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  public delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM resumes WHERE id = ?');
    try {
      const result = stmt.run(id);
      return result.changes > 0;
    } catch (error) {
      throw new Error(
        `Failed to delete resume: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  public count(): number {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM resumes');
    const result = stmt.get() as { count: number };
    return result.count;
  }

  /**
   * 批量创建简历记录
   * @param dataList 简历数据列表
   * @returns 创建的简历记录列表
   */
  public createBatch(dataList: CreateResumeData[]): Resume[] {
    if (!dataList || dataList.length === 0) {
      return [];
    }

    const startTime = Date.now();
    const results: Resume[] = [];

    // 使用事务确保数据一致性
    const transaction = this.db.transaction(() => {
      const stmt = this.db.prepare(`
        INSERT INTO resumes (
          id, original_filename, file_type, raw_text, parsed_data, 
          basic_info, education, work_experience, projects, skills,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      dataList.forEach((data, index) => {
        try {
          // 验证每个数据项
          const validatedData = this.validateCreateData(data);

          const id = this.generateId();
          const now = new Date().toISOString();

          stmt.run(
            id,
            validatedData.original_filename,
            validatedData.file_type,
            validatedData.raw_text,
            this.serializeJson(validatedData.parsed_data),
            this.serializeJson(validatedData.basic_info),
            this.serializeJson(validatedData.education),
            this.serializeJson(validatedData.work_experience),
            this.serializeJson(validatedData.projects),
            this.serializeJson(validatedData.skills),
            now,
            now
          );

          const created = this.findById(id);
          if (created) {
            results.push(created);
          }
        } catch (error) {
          this.logOperation(
            'batch_create_item_failed',
            `batch_${index}`,
            Date.now() - startTime,
            {
              error: error instanceof Error ? error.message : 'Unknown error',
              filename: data.original_filename,
            }
          );
          // 继续处理其他项目，不中断整个批次
        }
      });
    });

    try {
      transaction();

      const duration = Date.now() - startTime;
      this.logOperation('batch_create', 'batch', duration, {
        requested: dataList.length,
        created: results.length,
        success_rate:
          ((results.length / dataList.length) * 100).toFixed(1) + '%',
      });

      return results;
    } catch (error) {
      this.logOperation(
        'batch_create_failed',
        'batch',
        Date.now() - startTime,
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          requested: dataList.length,
        }
      );
      throw new Error(
        `Batch create failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 批量更新简历记录
   * @param updates 更新数据列表 {id, data}
   * @returns 更新的简历记录列表
   */
  public updateBatch(
    updates: { id: string; data: Partial<CreateResumeData> }[]
  ): Resume[] {
    if (!updates || updates.length === 0) {
      return [];
    }

    const startTime = Date.now();
    const results: Resume[] = [];

    const transaction = this.db.transaction(() => {
      updates.forEach((update, index) => {
        try {
          const updated = this.update(update.id, update.data);
          if (updated) {
            results.push(updated);
          }
        } catch (error) {
          this.logOperation(
            'batch_update_item_failed',
            `batch_${index}`,
            Date.now() - startTime,
            {
              error: error instanceof Error ? error.message : 'Unknown error',
              id: update.id,
            }
          );
        }
      });
    });

    try {
      transaction();

      const duration = Date.now() - startTime;
      this.logOperation('batch_update', 'batch', duration, {
        requested: updates.length,
        updated: results.length,
        success_rate:
          ((results.length / updates.length) * 100).toFixed(1) + '%',
      });

      return results;
    } catch (error) {
      this.logOperation(
        'batch_update_failed',
        'batch',
        Date.now() - startTime,
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          requested: updates.length,
        }
      );
      throw new Error(
        `Batch update failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 批量删除简历记录
   * @param ids ID列表
   * @returns 删除的记录数量
   */
  public deleteBatch(ids: string[]): number {
    if (!ids || ids.length === 0) {
      return 0;
    }

    const startTime = Date.now();
    let deletedCount = 0;

    const transaction = this.db.transaction(() => {
      const stmt = this.db.prepare('DELETE FROM resumes WHERE id = ?');

      ids.forEach((id) => {
        try {
          const result = stmt.run(id);
          if (result.changes > 0) {
            deletedCount++;
          }
        } catch (error) {
          this.logOperation(
            'batch_delete_item_failed',
            id,
            Date.now() - startTime,
            {
              error: error instanceof Error ? error.message : 'Unknown error',
            }
          );
        }
      });
    });

    try {
      transaction();

      const duration = Date.now() - startTime;
      this.logOperation('batch_delete', 'batch', duration, {
        requested: ids.length,
        deleted: deletedCount,
        success_rate: ((deletedCount / ids.length) * 100).toFixed(1) + '%',
      });

      return deletedCount;
    } catch (error) {
      this.logOperation(
        'batch_delete_failed',
        'batch',
        Date.now() - startTime,
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          requested: ids.length,
        }
      );
      throw new Error(
        `Batch delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 按条件批量更新
   * @param condition WHERE条件
   * @param data 更新数据
   * @param params 条件参数
   * @returns 更新的记录数量
   */
  public updateByCondition(
    condition: string,
    data: Partial<CreateResumeData>,
    params: any[] = []
  ): number {
    const startTime = Date.now();

    try {
      // 验证数据
      const validatedData = this.validateUpdateData(data);

      // 构建更新语句
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      Object.entries(validatedData).forEach(([key, value]) => {
        if (value !== undefined) {
          if (
            [
              'parsed_data',
              'basic_info',
              'education',
              'work_experience',
              'projects',
              'skills',
            ].includes(key)
          ) {
            updateFields.push(`${key} = ?`);
            updateValues.push(this.serializeJson(value));
          } else {
            updateFields.push(`${key} = ?`);
            updateValues.push(value);
          }
        }
      });

      if (updateFields.length === 0) {
        return 0;
      }

      const stmt = this.db.prepare(`
        UPDATE resumes SET ${updateFields.join(', ')} 
        WHERE ${condition}
      `);

      const result = stmt.run(...updateValues, ...params);

      const duration = Date.now() - startTime;
      this.logOperation('update_by_condition', 'condition', duration, {
        condition,
        updated: result.changes,
        fields_updated: updateFields.length,
      });

      return result.changes;
    } catch (error) {
      this.logOperation(
        'update_by_condition_failed',
        'condition',
        Date.now() - startTime,
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          condition,
        }
      );
      throw new Error(
        `Conditional update failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 重新解析简历（更新解析数据但保留原始文本）
   * @param id 简历ID
   * @param newParsedData 新的解析数据
   * @returns 更新的简历记录
   */
  public reparse(
    id: string,
    newParsedData: {
      parsed_data?: any;
      basic_info?: any;
      education?: any;
      work_experience?: any;
      projects?: any;
      skills?: any;
    }
  ): Resume | null {
    const startTime = Date.now();

    try {
      const existing = this.findById(id);
      if (!existing) {
        return null;
      }

      // 只更新解析相关字段，保留原始文本和文件信息
      const result = this.update(id, {
        parsed_data: newParsedData.parsed_data,
        basic_info: newParsedData.basic_info,
        education: newParsedData.education,
        work_experience: newParsedData.work_experience,
        projects: newParsedData.projects,
        skills: newParsedData.skills,
      });

      const duration = Date.now() - startTime;
      this.logOperation('reparse', id, duration, {
        filename: existing.original_filename,
        file_type: existing.file_type,
      });

      return result;
    } catch (error) {
      this.logOperation('reparse_failed', id, Date.now() - startTime, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error(
        `Reparse failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private mapRowToResume(row: any): Resume {
    return {
      id: row.id,
      original_filename: row.original_filename,
      file_type: row.file_type,
      raw_text: row.raw_text,
      parsed_data: this.deserializeJson(row.parsed_data),
      basic_info: this.deserializeJson(row.basic_info),
      education: this.deserializeJson(row.education),
      work_experience: this.deserializeJson(row.work_experience),
      projects: this.deserializeJson(row.projects),
      skills: this.deserializeJson(row.skills),
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
