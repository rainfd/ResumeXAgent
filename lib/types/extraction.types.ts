// 简历结构化提取相关类型定义

// 基本信息类型 (扩展自现有类型)
export interface BasicInfo {
  name?: string;
  email?: string;
  phone?: string;
  wechat?: string;
  qq?: string;
  address?: string;
  birth_date?: string;
  desired_position?: string;
  current_status?: string;
  location?: string;
  linkedIn?: string;
  github?: string;
  website?: string;
  summary?: string;
}

// 教育背景类型
export interface Education {
  school: string;
  degree: string; // 学士、硕士、博士
  major: string;
  start_date?: string;
  end_date?: string;
  gpa?: number;
  honors?: string[];
  description?: string;
  is_key_university?: boolean; // 985/211标识
}

// 工作经历类型
export interface Experience {
  company: string;
  position: string;
  industry?: string;
  start_date?: string;
  end_date?: string;
  is_current?: boolean;
  location?: string;
  responsibilities: string[];
  achievements: string[];
  team_size?: number;
  salary_range?: string;
  company_type?: 'state_owned' | 'private' | 'foreign' | 'startup' | 'other';
}

// 项目经历类型
export interface Project {
  name: string;
  type: string; // 个人、团队、商业
  description: string;
  technologies: string[];
  role: string;
  start_date?: string;
  end_date?: string;
  achievements: string[];
  url?: string;
  star_elements?: STARElements;
}

// STAR法则要素
export interface STARElements {
  situation: string[]; // 情境
  task: string[]; // 任务
  action: string[]; // 行动
  result: string[]; // 结果
}

// 技能类型
export interface Skills {
  technical_skills: TechnicalSkill[];
  soft_skills: string[];
  languages: Language[];
  certifications: Certification[];
}

// 技术技能分类
export interface TechnicalSkill {
  category: string; // 编程语言、框架、工具等
  items: SkillItem[];
}

// 技能项
export interface SkillItem {
  name: string;
  proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  years_experience?: number;
}

// 语言能力
export interface Language {
  language: string;
  proficiency: 'native' | 'fluent' | 'proficient' | 'intermediate' | 'basic';
  certificate?: string; // 如：CET-6, IELTS 7.0
}

// 证书认证
export interface Certification {
  name: string;
  issuer: string;
  issue_date?: string;
  expiry_date?: string;
  certificate_id?: string;
}

// 提取元数据
export interface ExtractionMetadata {
  extraction_method: 'rule_based' | 'ai_assisted' | 'hybrid';
  ai_model?: string;
  confidence_score: number; // 0-1
  timestamp: string;
  processing_time_ms: number;
  warnings: string[];
  errors: string[];
  fields_extracted: string[];
  fields_missing: string[];
}

// 提取结果基础接口
export interface ExtractionResult<T> {
  data: T;
  confidence: number;
  warnings: string[];
  metadata: {
    method: 'regex' | 'ai' | 'pattern';
    processing_time_ms: number;
    source_text?: string;
  };
}

// 基础提取器接口
export interface IExtractor<T> {
  extract(text: string): Promise<ExtractionResult<T>>;
  validateResult(data: T): boolean;
  getConfidenceScore(data: T): number;
}

// 中文特殊模式
export interface ChinesePatterns {
  surnames: string[]; // 中文姓氏库
  compound_surnames: string[]; // 复姓
  minority_names: string[]; // 少数民族姓名模式
  university_keywords: string[]; // 985/211关键词
  company_types: string[]; // 公司类型标识
  position_levels: string[]; // 职位层级
  skill_categories: string[]; // 技能分类
}

// 提取器配置
export interface ExtractorConfig {
  enable_ai_assistance: boolean;
  ai_model?: string;
  confidence_threshold: number;
  max_retries: number;
  timeout_ms: number;
  language: 'zh-CN' | 'en-US';
  patterns: ChinesePatterns;
}

// 批量提取结果
export interface BatchExtractionResult {
  basic_info: ExtractionResult<BasicInfo>;
  education: ExtractionResult<Education[]>;
  work_experience: ExtractionResult<Experience[]>;
  projects: ExtractionResult<Project[]>;
  skills: ExtractionResult<Skills>;
  extraction_metadata: ExtractionMetadata;
}

// 提取统计
export interface ExtractionStats {
  total_fields: number;
  extracted_fields: number;
  confidence_avg: number;
  processing_time_ms: number;
  ai_calls_count: number;
  cost_estimate_usd?: number;
}

// 验证结果
export interface ValidationResult {
  is_valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

// 置信度评分权重
export interface ConfidenceWeights {
  regex_match: number;
  context_relevance: number;
  data_completeness: number;
  format_validity: number;
  ai_confidence?: number;
}
