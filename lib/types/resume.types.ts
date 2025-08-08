// Resume 相关类型定义

export interface IBasicInfo {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedIn?: string;
  github?: string;
  website?: string;
  summary?: string;
}

export interface IEducation {
  institution: string;
  degree: string;
  field?: string;
  graduationYear?: number;
  gpa?: string;
  honors?: string[];
  relevantCoursework?: string[];
}

export interface IWorkExperience {
  company: string;
  position: string;
  startDate: string; // ISO date string
  endDate?: string; // ISO date string, undefined if current
  location?: string;
  description: string;
  achievements?: string[];
  technologies?: string[];
  isCurrent?: boolean;
}

export interface IProject {
  name: string;
  description: string;
  startDate?: string;
  endDate?: string;
  url?: string;
  github?: string;
  technologies: string[];
  achievements?: string[];
  role?: string;
}

export interface ISkills {
  technical?: {
    programming?: string[];
    frameworks?: string[];
    databases?: string[];
    tools?: string[];
    cloud?: string[];
    other?: string[];
  };
  soft?: string[];
  languages?: {
    language: string;
    proficiency: 'Native' | 'Fluent' | 'Proficient' | 'Intermediate' | 'Basic';
  }[];
}

export interface IParsedResumeData {
  extractedSections?: {
    basicInfo?: boolean;
    education?: boolean;
    workExperience?: boolean;
    projects?: boolean;
    skills?: boolean;
  };
  parsingMetadata?: {
    method?: string;
    confidence?: number;
    timestamp?: string;
    warnings?: string[];
  };
}

export interface IResumeData {
  id: string;
  originalFilename: string;
  fileType: 'pdf' | 'markdown' | 'txt';
  rawText: string;
  parsedData?: IParsedResumeData;
  basicInfo?: IBasicInfo;
  education?: IEducation[];
  workExperience?: IWorkExperience[];
  projects?: IProject[];
  skills?: ISkills;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateResumeRequest {
  originalFilename: string;
  fileType: 'pdf' | 'markdown' | 'txt';
  rawText: string;
  parsedData?: IParsedResumeData;
  basicInfo?: IBasicInfo;
  education?: IEducation[];
  workExperience?: IWorkExperience[];
  projects?: IProject[];
  skills?: ISkills;
}

export interface IUpdateResumeRequest extends Partial<ICreateResumeRequest> {
  id: string;
}

export interface IResumeQueryParams {
  limit?: number;
  offset?: number;
  filename?: string;
  fileType?: 'pdf' | 'markdown' | 'txt';
  sortBy?: 'created_at' | 'updated_at' | 'filename';
  sortOrder?: 'asc' | 'desc';
}

export interface IResumeListResponse {
  resumes: IResumeData[];
  total: number;
  limit: number;
  offset: number;
}

export interface IResumeValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface IResumeValidationResult {
  isValid: boolean;
  errors: IResumeValidationError[];
}

// Resume 解析相关类型
export type FileType = 'pdf' | 'markdown' | 'txt';

export interface ParsedResume {
  basic_info: IBasicInfo;
  sections: ResumeSection[];
  metadata: ParseMetadata;
}

export interface ResumeSection {
  type: 'education' | 'experience' | 'projects' | 'skills' | 'other';
  title: string;
  content: string;
  items: any[];
}

export interface ParseMetadata {
  file_type: FileType;
  parsing_method: string;
  confidence: number;
  timestamp: string;
  warnings: string[];
  errors: string[];
  text_length: number;
  processing_time_ms: number;
  language?: 'zh-CN' | 'en-US';
  ai_enabled?: boolean;
  ai_model?: string;
}

export interface ParserConfig {
  max_text_size: number;
  timeout_ms: number;
  enable_ai_parsing: boolean;
  ai_model?: string;
  language: 'zh-CN' | 'en-US';
}

export interface ParserOptions {
  extract_basic_info: boolean;
  extract_education: boolean;
  extract_work_experience: boolean;
  extract_projects: boolean;
  extract_skills: boolean;
  preserve_formatting: boolean;
  language_detection: boolean;
}

// Resume 处理相关类型
export interface IResumeParsingOptions {
  extractBasicInfo?: boolean;
  extractEducation?: boolean;
  extractWorkExperience?: boolean;
  extractProjects?: boolean;
  extractSkills?: boolean;
  aiModel?: string;
}

export interface IResumeParsingResult {
  success: boolean;
  parsedData?: IParsedResumeData;
  basicInfo?: IBasicInfo;
  education?: IEducation[];
  workExperience?: IWorkExperience[];
  projects?: IProject[];
  skills?: ISkills;
  errors?: string[];
  warnings?: string[];
}

// 解析器错误类型
export class ParserError extends Error {
  constructor(
    message: string,
    public code: string,
    public file_type?: FileType,
    public original_error?: Error
  ) {
    super(message);
    this.name = 'ParserError';
  }
}

// 简历统计相关类型
export interface IResumeStats {
  totalResumes: number;
  fileTypeDistribution: {
    pdf: number;
    markdown: number;
    txt: number;
  };
  recentUploads: number; // 最近30天
  averageExperienceYears?: number;
  topSkills?: string[];
  topCompanies?: string[];
}
