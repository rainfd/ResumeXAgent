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
    super('resumes', validationSchemas.createResume, validationSchemas.updateResume);
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
        fileType: validatedData.file_type 
      });
      
      return created;
    } catch (error) {
      this.logOperation('create_failed', id, Date.now() - startTime, { 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error(`Failed to create resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    return results.map(row => this.mapRowToResume(row));
  }

  public findByFilename(filename: string): Resume[] {
    const stmt = this.db.prepare('SELECT * FROM resumes WHERE original_filename = ? ORDER BY created_at DESC');
    const results = stmt.all(filename) as any[];
    return results.map(row => this.mapRowToResume(row));
  }

  public findByFileType(fileType: 'pdf' | 'markdown' | 'txt'): Resume[] {
    const stmt = this.db.prepare('SELECT * FROM resumes WHERE file_type = ? ORDER BY created_at DESC');
    const results = stmt.all(fileType) as any[];
    return results.map(row => this.mapRowToResume(row));
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
        fields: updateFields.map(f => f.split(' = ?')[0])
      });
      
      return updated;
    } catch (error) {
      this.logOperation('update_failed', id, Date.now() - startTime, { 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error(`Failed to update resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM resumes WHERE id = ?');
    try {
      const result = stmt.run(id);
      return result.changes > 0;
    } catch (error) {
      throw new Error(`Failed to delete resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public count(): number {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM resumes');
    const result = stmt.get() as { count: number };
    return result.count;
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
      updated_at: row.updated_at
    };
  }
}