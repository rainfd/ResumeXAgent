-- Migration 001: Initial Database Schema
-- Created: 2025-08-07
-- Description: Create all initial tables, indexes, and triggers for Resume XAgent

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Resume Table: 存储简历数据和解析结果
CREATE TABLE IF NOT EXISTS resumes (
    id TEXT PRIMARY KEY,  -- UUID
    original_filename TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'markdown', 'txt')),
    raw_text TEXT NOT NULL,
    parsed_data JSON,  -- 解析后的结构化数据
    basic_info JSON,  -- 基本信息 (姓名、联系方式等)
    education JSON,  -- 教育背景
    work_experience JSON,  -- 工作经历
    projects JSON,  -- 项目经历
    skills JSON,  -- 技能清单
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Job Table: 存储岗位信息和要求
CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,  -- UUID
    url TEXT UNIQUE,  -- 岗位URL (可选)
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT,
    salary_range TEXT,
    experience_required TEXT,
    education_required TEXT,
    raw_description TEXT NOT NULL,  -- 原始岗位描述
    parsed_requirements JSON,  -- 解析后的要求
    technical_skills JSON,  -- 技术技能要求
    soft_skills JSON,  -- 软技能要求
    responsibilities JSON,  -- 工作职责
    company_info JSON,  -- 公司信息
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Analysis Table: 存储各种分析结果
CREATE TABLE IF NOT EXISTS analyses (
    id TEXT PRIMARY KEY,  -- UUID
    resume_id TEXT NOT NULL,
    job_id TEXT,  -- 可选，某些分析可能不针对特定岗位
    analysis_type TEXT NOT NULL CHECK (analysis_type IN ('star_check', 'optimization', 'grammar_check', 'custom')),
    ai_model TEXT NOT NULL,  -- 使用的AI模型
    results JSON NOT NULL,  -- 分析结果
    suggestions JSON,  -- 改进建议
    score REAL,  -- 评分 (0-100)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

-- Job Match Table: 存储岗位匹配结果
CREATE TABLE IF NOT EXISTS job_matches (
    id TEXT PRIMARY KEY,  -- UUID
    resume_id TEXT NOT NULL,
    job_id TEXT NOT NULL,
    match_score REAL NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
    skill_match JSON,  -- 技能匹配详情
    experience_match JSON,  -- 经验匹配详情
    education_match JSON,  -- 教育背景匹配详情
    strengths JSON,  -- 优势点
    gaps JSON,  -- 差距分析
    recommendations JSON,  -- 改进建议
    hr_message TEXT,  -- 生成的HR消息
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    UNIQUE(resume_id, job_id)  -- 防止重复匹配记录
);

-- Custom Prompt Table: 存储自定义提示词
CREATE TABLE IF NOT EXISTS custom_prompts (
    id TEXT PRIMARY KEY,  -- UUID
    name TEXT NOT NULL,
    description TEXT,
    prompt_template TEXT NOT NULL,
    ai_model TEXT,
    category TEXT,
    usage_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance

-- Resume indexes
CREATE INDEX IF NOT EXISTS idx_resumes_filename ON resumes(original_filename);
CREATE INDEX IF NOT EXISTS idx_resumes_type ON resumes(file_type);
CREATE INDEX IF NOT EXISTS idx_resumes_created ON resumes(created_at);

-- Job indexes  
CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company);
CREATE INDEX IF NOT EXISTS idx_jobs_title ON jobs(title);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
CREATE INDEX IF NOT EXISTS idx_jobs_created ON jobs(created_at);

-- Analysis indexes
CREATE INDEX IF NOT EXISTS idx_analyses_resume ON analyses(resume_id);
CREATE INDEX IF NOT EXISTS idx_analyses_job ON analyses(job_id);
CREATE INDEX IF NOT EXISTS idx_analyses_type ON analyses(analysis_type);
CREATE INDEX IF NOT EXISTS idx_analyses_model ON analyses(ai_model);
CREATE INDEX IF NOT EXISTS idx_analyses_created ON analyses(created_at);

-- Job Match indexes
CREATE INDEX IF NOT EXISTS idx_matches_resume ON job_matches(resume_id);
CREATE INDEX IF NOT EXISTS idx_matches_job ON job_matches(job_id);
CREATE INDEX IF NOT EXISTS idx_matches_score ON job_matches(match_score);
CREATE INDEX IF NOT EXISTS idx_matches_created ON job_matches(created_at);

-- Custom Prompt indexes
CREATE INDEX IF NOT EXISTS idx_prompts_name ON custom_prompts(name);
CREATE INDEX IF NOT EXISTS idx_prompts_category ON custom_prompts(category);
CREATE INDEX IF NOT EXISTS idx_prompts_model ON custom_prompts(ai_model);

-- Triggers for automatic updated_at timestamp updates

-- Resume updated_at trigger
CREATE TRIGGER IF NOT EXISTS trigger_resumes_updated_at 
    AFTER UPDATE ON resumes
    FOR EACH ROW
BEGIN
    UPDATE resumes SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Custom Prompt updated_at trigger
CREATE TRIGGER IF NOT EXISTS trigger_custom_prompts_updated_at 
    AFTER UPDATE ON custom_prompts
    FOR EACH ROW
BEGIN
    UPDATE custom_prompts SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;