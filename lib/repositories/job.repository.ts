import { BaseRepository } from './base.repository';
import { validationSchemas } from '../utils/validation';

export interface Job {
  id: string;
  url?: string;
  title: string;
  company: string;
  location?: string;
  salary_range?: string;
  experience_required?: string;
  education_required?: string;
  raw_description: string;
  parsed_requirements?: any;
  technical_skills?: any;
  soft_skills?: any;
  responsibilities?: any;
  company_info?: any;
  created_at: string;
}

export interface CreateJobData {
  url?: string;
  title: string;
  company: string;
  location?: string;
  salary_range?: string;
  experience_required?: string;
  education_required?: string;
  raw_description: string;
  parsed_requirements?: any;
  technical_skills?: any;
  soft_skills?: any;
  responsibilities?: any;
  company_info?: any;
}

export class JobRepository extends BaseRepository<Job> {
  constructor() {
    super('jobs', validationSchemas.createJob, validationSchemas.createJob);
  }

  public create(data: CreateJobData): Job {
    const id = this.generateId();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO jobs (
        id, url, title, company, location, salary_range, 
        experience_required, education_required, raw_description,
        parsed_requirements, technical_skills, soft_skills,
        responsibilities, company_info, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    try {
      stmt.run(
        id,
        data.url || null,
        data.title,
        data.company,
        data.location || null,
        data.salary_range || null,
        data.experience_required || null,
        data.education_required || null,
        data.raw_description,
        this.serializeJson(data.parsed_requirements),
        this.serializeJson(data.technical_skills),
        this.serializeJson(data.soft_skills),
        this.serializeJson(data.responsibilities),
        this.serializeJson(data.company_info),
        now
      );

      const created = this.findById(id);
      if (!created) {
        throw new Error('Failed to create job');
      }
      return created;
    } catch (error) {
      throw new Error(`Failed to create job: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public findById(id: string): Job | null {
    const stmt = this.db.prepare('SELECT * FROM jobs WHERE id = ?');
    const result = stmt.get(id) as any;
    
    if (!result) return null;

    return this.mapRowToJob(result);
  }

  public findAll(limit = 50, offset = 0): Job[] {
    const stmt = this.db.prepare(`
      SELECT * FROM jobs 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `);
    
    const results = stmt.all(limit, offset) as any[];
    return results.map(row => this.mapRowToJob(row));
  }

  public findByCompany(company: string): Job[] {
    const stmt = this.db.prepare('SELECT * FROM jobs WHERE company = ? ORDER BY created_at DESC');
    const results = stmt.all(company) as any[];
    return results.map(row => this.mapRowToJob(row));
  }

  public findByTitle(title: string): Job[] {
    const stmt = this.db.prepare('SELECT * FROM jobs WHERE title LIKE ? ORDER BY created_at DESC');
    const results = stmt.all(`%${title}%`) as any[];
    return results.map(row => this.mapRowToJob(row));
  }

  public findByLocation(location: string): Job[] {
    const stmt = this.db.prepare('SELECT * FROM jobs WHERE location LIKE ? ORDER BY created_at DESC');
    const results = stmt.all(`%${location}%`) as any[];
    return results.map(row => this.mapRowToJob(row));
  }

  public findByUrl(url: string): Job | null {
    const stmt = this.db.prepare('SELECT * FROM jobs WHERE url = ?');
    const result = stmt.get(url) as any;
    
    if (!result) return null;
    return this.mapRowToJob(result);
  }

  public search(query: string): Job[] {
    const stmt = this.db.prepare(`
      SELECT * FROM jobs 
      WHERE title LIKE ? OR company LIKE ? OR raw_description LIKE ?
      ORDER BY created_at DESC
    `);
    const searchPattern = `%${query}%`;
    const results = stmt.all(searchPattern, searchPattern, searchPattern) as any[];
    return results.map(row => this.mapRowToJob(row));
  }

  public update(id: string, data: Partial<CreateJobData>): Job | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (data.url !== undefined) {
      updateFields.push('url = ?');
      updateValues.push(data.url);
    }
    if (data.title !== undefined) {
      updateFields.push('title = ?');
      updateValues.push(data.title);
    }
    if (data.company !== undefined) {
      updateFields.push('company = ?');
      updateValues.push(data.company);
    }
    if (data.location !== undefined) {
      updateFields.push('location = ?');
      updateValues.push(data.location);
    }
    if (data.salary_range !== undefined) {
      updateFields.push('salary_range = ?');
      updateValues.push(data.salary_range);
    }
    if (data.experience_required !== undefined) {
      updateFields.push('experience_required = ?');
      updateValues.push(data.experience_required);
    }
    if (data.education_required !== undefined) {
      updateFields.push('education_required = ?');
      updateValues.push(data.education_required);
    }
    if (data.raw_description !== undefined) {
      updateFields.push('raw_description = ?');
      updateValues.push(data.raw_description);
    }
    if (data.parsed_requirements !== undefined) {
      updateFields.push('parsed_requirements = ?');
      updateValues.push(this.serializeJson(data.parsed_requirements));
    }
    if (data.technical_skills !== undefined) {
      updateFields.push('technical_skills = ?');
      updateValues.push(this.serializeJson(data.technical_skills));
    }
    if (data.soft_skills !== undefined) {
      updateFields.push('soft_skills = ?');
      updateValues.push(this.serializeJson(data.soft_skills));
    }
    if (data.responsibilities !== undefined) {
      updateFields.push('responsibilities = ?');
      updateValues.push(this.serializeJson(data.responsibilities));
    }
    if (data.company_info !== undefined) {
      updateFields.push('company_info = ?');
      updateValues.push(this.serializeJson(data.company_info));
    }

    if (updateFields.length === 0) return existing;

    const stmt = this.db.prepare(`
      UPDATE jobs SET ${updateFields.join(', ')} WHERE id = ?
    `);

    try {
      updateValues.push(id);
      stmt.run(...updateValues);
      return this.findById(id);
    } catch (error) {
      throw new Error(`Failed to update job: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM jobs WHERE id = ?');
    try {
      const result = stmt.run(id);
      return result.changes > 0;
    } catch (error) {
      throw new Error(`Failed to delete job: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public count(): number {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM jobs');
    const result = stmt.get() as { count: number };
    return result.count;
  }

  private mapRowToJob(row: any): Job {
    return {
      id: row.id,
      url: row.url,
      title: row.title,
      company: row.company,
      location: row.location,
      salary_range: row.salary_range,
      experience_required: row.experience_required,
      education_required: row.education_required,
      raw_description: row.raw_description,
      parsed_requirements: this.deserializeJson(row.parsed_requirements),
      technical_skills: this.deserializeJson(row.technical_skills),
      soft_skills: this.deserializeJson(row.soft_skills),
      responsibilities: this.deserializeJson(row.responsibilities),
      company_info: this.deserializeJson(row.company_info),
      created_at: row.created_at
    };
  }
}