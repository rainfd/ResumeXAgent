import { BaseRepository } from './base.repository';
import { validationSchemas } from '../utils/validation';

export interface Analysis {
  id: string;
  resume_id: string;
  job_id?: string;
  analysis_type: 'star_check' | 'optimization' | 'grammar_check' | 'custom';
  ai_model: string;
  results: any;
  suggestions?: any;
  score?: number;
  created_at: string;
}

export interface CreateAnalysisData {
  resume_id: string;
  job_id?: string;
  analysis_type: 'star_check' | 'optimization' | 'grammar_check' | 'custom';
  ai_model: string;
  results: any;
  suggestions?: any;
  score?: number;
}

export class AnalysisRepository extends BaseRepository<Analysis> {
  constructor() {
    super(
      'analyses',
      validationSchemas.createAnalysis,
      validationSchemas.createAnalysis
    );
  }

  public create(data: CreateAnalysisData): Analysis {
    const id = this.generateId();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO analyses (
        id, resume_id, job_id, analysis_type, ai_model, 
        results, suggestions, score, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    try {
      stmt.run(
        id,
        data.resume_id,
        data.job_id || null,
        data.analysis_type,
        data.ai_model,
        this.serializeJson(data.results),
        this.serializeJson(data.suggestions),
        data.score || null,
        now
      );

      const created = this.findById(id);
      if (!created) {
        throw new Error('Failed to create analysis');
      }
      return created;
    } catch (error) {
      throw new Error(
        `Failed to create analysis: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  public findById(id: string): Analysis | null {
    const stmt = this.db.prepare('SELECT * FROM analyses WHERE id = ?');
    const result = stmt.get(id) as any;

    if (!result) return null;

    return this.mapRowToAnalysis(result);
  }

  public findAll(limit = 50, offset = 0): Analysis[] {
    const stmt = this.db.prepare(`
      SELECT * FROM analyses 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `);

    const results = stmt.all(limit, offset) as any[];
    return results.map((row) => this.mapRowToAnalysis(row));
  }

  public findByResumeId(resumeId: string): Analysis[] {
    const stmt = this.db.prepare(
      'SELECT * FROM analyses WHERE resume_id = ? ORDER BY created_at DESC'
    );
    const results = stmt.all(resumeId) as any[];
    return results.map((row) => this.mapRowToAnalysis(row));
  }

  public findByJobId(jobId: string): Analysis[] {
    const stmt = this.db.prepare(
      'SELECT * FROM analyses WHERE job_id = ? ORDER BY created_at DESC'
    );
    const results = stmt.all(jobId) as any[];
    return results.map((row) => this.mapRowToAnalysis(row));
  }

  public findByType(
    analysisType: 'star_check' | 'optimization' | 'grammar_check' | 'custom'
  ): Analysis[] {
    const stmt = this.db.prepare(
      'SELECT * FROM analyses WHERE analysis_type = ? ORDER BY created_at DESC'
    );
    const results = stmt.all(analysisType) as any[];
    return results.map((row) => this.mapRowToAnalysis(row));
  }

  public findByModel(aiModel: string): Analysis[] {
    const stmt = this.db.prepare(
      'SELECT * FROM analyses WHERE ai_model = ? ORDER BY created_at DESC'
    );
    const results = stmt.all(aiModel) as any[];
    return results.map((row) => this.mapRowToAnalysis(row));
  }

  public findByResumeAndJob(resumeId: string, jobId: string): Analysis[] {
    const stmt = this.db.prepare(
      'SELECT * FROM analyses WHERE resume_id = ? AND job_id = ? ORDER BY created_at DESC'
    );
    const results = stmt.all(resumeId, jobId) as any[];
    return results.map((row) => this.mapRowToAnalysis(row));
  }

  public findLatestByResumeAndType(
    resumeId: string,
    analysisType: string
  ): Analysis | null {
    const stmt = this.db.prepare(`
      SELECT * FROM analyses 
      WHERE resume_id = ? AND analysis_type = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    const result = stmt.get(resumeId, analysisType) as any;

    if (!result) return null;
    return this.mapRowToAnalysis(result);
  }

  public update(
    id: string,
    data: Partial<CreateAnalysisData>
  ): Analysis | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (data.resume_id !== undefined) {
      updateFields.push('resume_id = ?');
      updateValues.push(data.resume_id);
    }
    if (data.job_id !== undefined) {
      updateFields.push('job_id = ?');
      updateValues.push(data.job_id);
    }
    if (data.analysis_type !== undefined) {
      updateFields.push('analysis_type = ?');
      updateValues.push(data.analysis_type);
    }
    if (data.ai_model !== undefined) {
      updateFields.push('ai_model = ?');
      updateValues.push(data.ai_model);
    }
    if (data.results !== undefined) {
      updateFields.push('results = ?');
      updateValues.push(this.serializeJson(data.results));
    }
    if (data.suggestions !== undefined) {
      updateFields.push('suggestions = ?');
      updateValues.push(this.serializeJson(data.suggestions));
    }
    if (data.score !== undefined) {
      updateFields.push('score = ?');
      updateValues.push(data.score);
    }

    if (updateFields.length === 0) return existing;

    const stmt = this.db.prepare(`
      UPDATE analyses SET ${updateFields.join(', ')} WHERE id = ?
    `);

    try {
      updateValues.push(id);
      stmt.run(...updateValues);
      return this.findById(id);
    } catch (error) {
      throw new Error(
        `Failed to update analysis: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  public delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM analyses WHERE id = ?');
    try {
      const result = stmt.run(id);
      return result.changes > 0;
    } catch (error) {
      throw new Error(
        `Failed to delete analysis: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  public deleteByResumeId(resumeId: string): number {
    const stmt = this.db.prepare('DELETE FROM analyses WHERE resume_id = ?');
    try {
      const result = stmt.run(resumeId);
      return result.changes;
    } catch (error) {
      throw new Error(
        `Failed to delete analyses by resume: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  public count(): number {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM analyses');
    const result = stmt.get() as { count: number };
    return result.count;
  }

  public getAnalyticsByType(): { analysis_type: string; count: number }[] {
    const stmt = this.db.prepare(
      'SELECT analysis_type, COUNT(*) as count FROM analyses GROUP BY analysis_type ORDER BY count DESC'
    );
    return stmt.all() as { analysis_type: string; count: number }[];
  }

  private mapRowToAnalysis(row: any): Analysis {
    return {
      id: row.id,
      resume_id: row.resume_id,
      job_id: row.job_id,
      analysis_type: row.analysis_type,
      ai_model: row.ai_model,
      results: this.deserializeJson(row.results),
      suggestions: this.deserializeJson(row.suggestions),
      score: row.score,
      created_at: row.created_at,
    };
  }
}
