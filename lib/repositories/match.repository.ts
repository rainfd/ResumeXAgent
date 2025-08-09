import { BaseRepository } from './base.repository';
import { validationSchemas } from '../utils/validation';

export interface JobMatch {
  id: string;
  resume_id: string;
  job_id: string;
  match_score: number;
  skill_match?: any;
  experience_match?: any;
  education_match?: any;
  strengths?: any;
  gaps?: any;
  recommendations?: any;
  hr_message?: string;
  created_at: string;
}

export interface CreateJobMatchData {
  resume_id: string;
  job_id: string;
  match_score: number;
  skill_match?: any;
  experience_match?: any;
  education_match?: any;
  strengths?: any;
  gaps?: any;
  recommendations?: any;
  hr_message?: string;
}

export class MatchRepository extends BaseRepository<JobMatch> {
  constructor() {
    super(
      'job_matches',
      validationSchemas.createMatch,
      validationSchemas.createMatch
    );
  }

  public create(data: CreateJobMatchData): JobMatch {
    const id = this.generateId();
    const now = new Date().toISOString();

    // 验证匹配分数范围
    if (data.match_score < 0 || data.match_score > 100) {
      throw new Error('Match score must be between 0 and 100');
    }

    const stmt = this.db.prepare(`
      INSERT INTO job_matches (
        id, resume_id, job_id, match_score, skill_match, 
        experience_match, education_match, strengths, gaps, 
        recommendations, hr_message, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    try {
      stmt.run(
        id,
        data.resume_id,
        data.job_id,
        data.match_score,
        this.serializeJson(data.skill_match),
        this.serializeJson(data.experience_match),
        this.serializeJson(data.education_match),
        this.serializeJson(data.strengths),
        this.serializeJson(data.gaps),
        this.serializeJson(data.recommendations),
        data.hr_message || null,
        now
      );

      const created = this.findById(id);
      if (!created) {
        throw new Error('Failed to create job match');
      }
      return created;
    } catch (error) {
      if (error instanceof Error && error.message.includes('UNIQUE')) {
        throw new Error(
          'Match already exists for this resume and job combination'
        );
      }
      throw new Error(
        `Failed to create job match: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  public findById(id: string): JobMatch | null {
    const stmt = this.db.prepare('SELECT * FROM job_matches WHERE id = ?');
    const result = stmt.get(id) as any;

    if (!result) return null;

    return this.mapRowToJobMatch(result);
  }

  public findAll(limit = 50, offset = 0): JobMatch[] {
    const stmt = this.db.prepare(`
      SELECT * FROM job_matches 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `);

    const results = stmt.all(limit, offset) as any[];
    return results.map((row) => this.mapRowToJobMatch(row));
  }

  public findByResumeId(resumeId: string): JobMatch[] {
    const stmt = this.db.prepare(
      'SELECT * FROM job_matches WHERE resume_id = ? ORDER BY match_score DESC, created_at DESC'
    );
    const results = stmt.all(resumeId) as any[];
    return results.map((row) => this.mapRowToJobMatch(row));
  }

  public findByJobId(jobId: string): JobMatch[] {
    const stmt = this.db.prepare(
      'SELECT * FROM job_matches WHERE job_id = ? ORDER BY match_score DESC, created_at DESC'
    );
    const results = stmt.all(jobId) as any[];
    return results.map((row) => this.mapRowToJobMatch(row));
  }

  public findByResumeAndJob(resumeId: string, jobId: string): JobMatch | null {
    const stmt = this.db.prepare(
      'SELECT * FROM job_matches WHERE resume_id = ? AND job_id = ?'
    );
    const result = stmt.get(resumeId, jobId) as any;

    if (!result) return null;
    return this.mapRowToJobMatch(result);
  }

  public findTopMatches(resumeId: string, limit = 10): JobMatch[] {
    const stmt = this.db.prepare(`
      SELECT * FROM job_matches 
      WHERE resume_id = ? 
      ORDER BY match_score DESC, created_at DESC 
      LIMIT ?
    `);
    const results = stmt.all(resumeId, limit) as any[];
    return results.map((row) => this.mapRowToJobMatch(row));
  }

  public findByScoreRange(minScore: number, maxScore: number): JobMatch[] {
    const stmt = this.db.prepare(`
      SELECT * FROM job_matches 
      WHERE match_score >= ? AND match_score <= ? 
      ORDER BY match_score DESC, created_at DESC
    `);
    const results = stmt.all(minScore, maxScore) as any[];
    return results.map((row) => this.mapRowToJobMatch(row));
  }

  public findHighScoreMatches(minScore = 80): JobMatch[] {
    const stmt = this.db.prepare(`
      SELECT * FROM job_matches 
      WHERE match_score >= ? 
      ORDER BY match_score DESC, created_at DESC
    `);
    const results = stmt.all(minScore) as any[];
    return results.map((row) => this.mapRowToJobMatch(row));
  }

  public update(
    id: string,
    data: Partial<CreateJobMatchData>
  ): JobMatch | null {
    const existing = this.findById(id);
    if (!existing) return null;

    // 验证匹配分数范围
    if (
      data.match_score !== undefined &&
      (data.match_score < 0 || data.match_score > 100)
    ) {
      throw new Error('Match score must be between 0 and 100');
    }

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
    if (data.match_score !== undefined) {
      updateFields.push('match_score = ?');
      updateValues.push(data.match_score);
    }
    if (data.skill_match !== undefined) {
      updateFields.push('skill_match = ?');
      updateValues.push(this.serializeJson(data.skill_match));
    }
    if (data.experience_match !== undefined) {
      updateFields.push('experience_match = ?');
      updateValues.push(this.serializeJson(data.experience_match));
    }
    if (data.education_match !== undefined) {
      updateFields.push('education_match = ?');
      updateValues.push(this.serializeJson(data.education_match));
    }
    if (data.strengths !== undefined) {
      updateFields.push('strengths = ?');
      updateValues.push(this.serializeJson(data.strengths));
    }
    if (data.gaps !== undefined) {
      updateFields.push('gaps = ?');
      updateValues.push(this.serializeJson(data.gaps));
    }
    if (data.recommendations !== undefined) {
      updateFields.push('recommendations = ?');
      updateValues.push(this.serializeJson(data.recommendations));
    }
    if (data.hr_message !== undefined) {
      updateFields.push('hr_message = ?');
      updateValues.push(data.hr_message);
    }

    if (updateFields.length === 0) return existing;

    const stmt = this.db.prepare(`
      UPDATE job_matches SET ${updateFields.join(', ')} WHERE id = ?
    `);

    try {
      updateValues.push(id);
      stmt.run(...updateValues);
      return this.findById(id);
    } catch (error) {
      throw new Error(
        `Failed to update job match: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  public delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM job_matches WHERE id = ?');
    try {
      const result = stmt.run(id);
      return result.changes > 0;
    } catch (error) {
      throw new Error(
        `Failed to delete job match: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  public deleteByResumeId(resumeId: string): number {
    const stmt = this.db.prepare('DELETE FROM job_matches WHERE resume_id = ?');
    try {
      const result = stmt.run(resumeId);
      return result.changes;
    } catch (error) {
      throw new Error(
        `Failed to delete job matches by resume: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  public deleteByJobId(jobId: string): number {
    const stmt = this.db.prepare('DELETE FROM job_matches WHERE job_id = ?');
    try {
      const result = stmt.run(jobId);
      return result.changes;
    } catch (error) {
      throw new Error(
        `Failed to delete job matches by job: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  public count(): number {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM job_matches');
    const result = stmt.get() as { count: number };
    return result.count;
  }

  public getAverageScore(): number {
    const stmt = this.db.prepare(
      'SELECT AVG(match_score) as avg_score FROM job_matches'
    );
    const result = stmt.get() as { avg_score: number | null };
    return result.avg_score || 0;
  }

  public getScoreDistribution(): { score_range: string; count: number }[] {
    const stmt = this.db.prepare(`
      SELECT 
        CASE 
          WHEN match_score >= 90 THEN '90-100'
          WHEN match_score >= 80 THEN '80-89'
          WHEN match_score >= 70 THEN '70-79'
          WHEN match_score >= 60 THEN '60-69'
          WHEN match_score >= 50 THEN '50-59'
          ELSE '0-49'
        END as score_range,
        COUNT(*) as count
      FROM job_matches 
      GROUP BY score_range 
      ORDER BY MIN(match_score) DESC
    `);
    return stmt.all() as { score_range: string; count: number }[];
  }

  private mapRowToJobMatch(row: any): JobMatch {
    return {
      id: row.id,
      resume_id: row.resume_id,
      job_id: row.job_id,
      match_score: row.match_score,
      skill_match: this.deserializeJson(row.skill_match),
      experience_match: this.deserializeJson(row.experience_match),
      education_match: this.deserializeJson(row.education_match),
      strengths: this.deserializeJson(row.strengths),
      gaps: this.deserializeJson(row.gaps),
      recommendations: this.deserializeJson(row.recommendations),
      hr_message: row.hr_message,
      created_at: row.created_at,
    };
  }
}
