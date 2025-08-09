import { initializeDatabase, closeDatabase, getDatabase } from './client';
import { runMigrations } from './migrate';
import { dbHelpers } from './helpers';

export interface InitializationResult {
  success: boolean;
  message: string;
  tablesCreated: string[];
  migrationsApplied: number;
  errors: string[];
}

export async function initializeApp(): Promise<InitializationResult> {
  const result: InitializationResult = {
    success: false,
    message: '',
    tablesCreated: [],
    migrationsApplied: 0,
    errors: [],
  };

  try {
    // 1. 初始化数据库连接
    const db = initializeDatabase();

    // 2. 检查数据库健康状态
    const health = await dbHelpers.checkHealth();
    if (!health.isOpen || !health.canRead || !health.canWrite) {
      throw new Error(
        `Database health check failed: ${health.lastError || 'Unknown error'}`
      );
    }

    // 3. 运行数据库迁移
    await runMigrations();

    // 4. 验证表创建
    const tables = dbHelpers.getTableNames();
    const expectedTables = [
      'resumes',
      'jobs',
      'analyses',
      'job_matches',
      'custom_prompts',
      'migrations',
    ];

    const missingTables = expectedTables.filter(
      (table) => !tables.includes(table)
    );
    if (missingTables.length > 0) {
      throw new Error(`Missing tables: ${missingTables.join(', ')}`);
    }

    result.tablesCreated = tables;
    result.success = true;
    result.message = 'Database initialized successfully';

    // 5. 获取应用的迁移数量
    const migrationStatus = getDatabase()
      .prepare('SELECT COUNT(*) as count FROM migrations')
      .get() as { count: number };
    result.migrationsApplied = migrationStatus.count;
  } catch (error) {
    result.success = false;
    result.message = 'Database initialization failed';
    result.errors.push(
      error instanceof Error ? error.message : 'Unknown initialization error'
    );
  }

  return result;
}

export async function seedDatabase(): Promise<void> {
  // 创建种子数据用于开发和测试
  const { ResumeRepository } = await import(
    '../repositories/resume.repository'
  );
  const { JobRepository } = await import('../repositories/job.repository');
  const { AnalysisRepository } = await import(
    '../repositories/analysis.repository'
  );

  try {
    const resumeRepo = new ResumeRepository();
    const jobRepo = new JobRepository();
    const analysisRepo = new AnalysisRepository();

    // 检查是否已有数据，避免重复创建
    const existingResumes = resumeRepo.count();
    if (existingResumes > 0) {
      return; // 已有数据，跳过种子数据创建
    }

    // 创建示例简历
    const sampleResume = resumeRepo.create({
      original_filename: 'sample_resume.txt',
      file_type: 'txt',
      raw_text: `John Doe
Software Engineer

Contact: john.doe@email.com | (555) 123-4567

Experience:
- Senior Software Engineer at TechCorp (2020-Present)
  * Led development of microservices architecture using Node.js and Python
  * Implemented CI/CD pipelines reducing deployment time by 50%
  * Mentored junior developers and conducted code reviews

- Software Engineer at StartupXYZ (2018-2020)
  * Developed full-stack web applications using React and Node.js
  * Optimized database queries improving performance by 30%

Skills:
- Programming: JavaScript, TypeScript, Python, Java
- Frameworks: React, Node.js, Express, Django
- Databases: PostgreSQL, MongoDB, Redis
- Tools: Docker, Kubernetes, Git, Jenkins`,
      basic_info: {
        name: 'John Doe',
        email: 'john.doe@email.com',
        phone: '(555) 123-4567',
      },
      skills: {
        technical: {
          programming: ['JavaScript', 'TypeScript', 'Python', 'Java'],
          frameworks: ['React', 'Node.js', 'Express', 'Django'],
          databases: ['PostgreSQL', 'MongoDB', 'Redis'],
          tools: ['Docker', 'Kubernetes', 'Git', 'Jenkins'],
        },
      },
    });

    // 创建示例岗位
    const sampleJob = jobRepo.create({
      title: 'Senior Full Stack Developer',
      company: 'TechInnovate Inc.',
      location: 'San Francisco, CA',
      salary_range: '$120,000 - $150,000',
      experience_required: '3-5 years',
      education_required: "Bachelor's degree in Computer Science or equivalent",
      raw_description: `We are looking for a Senior Full Stack Developer to join our growing team.

Responsibilities:
- Develop and maintain web applications using modern JavaScript frameworks
- Design and implement RESTful APIs and microservices
- Collaborate with cross-functional teams to deliver high-quality software
- Mentor junior developers and participate in code reviews

Requirements:
- 3+ years of experience in full-stack development
- Proficiency in JavaScript, TypeScript, React, and Node.js
- Experience with databases (PostgreSQL, MongoDB)
- Knowledge of cloud platforms (AWS, GCP)
- Strong communication and problem-solving skills`,
      technical_skills: [
        'JavaScript',
        'TypeScript',
        'React',
        'Node.js',
        'PostgreSQL',
        'MongoDB',
        'AWS',
      ],
      soft_skills: [
        'Communication',
        'Problem-solving',
        'Team collaboration',
        'Mentoring',
      ],
    });

    // 创建示例分析
    await analysisRepo.create({
      resume_id: sampleResume.id,
      analysis_type: 'optimization',
      ai_model: 'gpt-4',
      results: {
        keywords: {
          present: ['JavaScript', 'Node.js', 'React', 'Python'],
          missing: ['AWS', 'Microservices', 'CI/CD'],
          suggested: ['Kubernetes', 'Docker', 'TypeScript'],
        },
        structure: {
          hasContactInfo: true,
          hasExperience: true,
          hasSkills: true,
          score: 85,
        },
      },
      suggestions: {
        immediate: ['Add AWS experience to skills section'],
        shortTerm: ['Include more specific metrics in experience descriptions'],
        longTerm: ['Consider adding a professional summary section'],
      },
      score: 85,
    });
  } catch (error) {
    throw new Error(
      `Failed to seed database: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// 数据库重置函数（仅用于开发/测试）
export async function resetDatabase(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Database reset is not allowed in production');
  }

  try {
    // 清空所有表数据
    dbHelpers.truncateAllTables();

    // 重新运行迁移
    await runMigrations();
  } catch (error) {
    throw new Error(
      `Failed to reset database: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// 优雅关闭数据库连接
export function shutdown(): void {
  closeDatabase();
}
