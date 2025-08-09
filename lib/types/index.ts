// 类型定义索引文件 - 统一导出所有类型

// Resume 相关类型
export * from './resume.types';

// Job 相关类型
export * from './job.types';

// Analysis 相关类型
export * from './analysis.types';

// API 相关类型
export * from './api.types';

// Grammar Issue 相关类型
export * from './grammar-issue.types';

// Company 相关类型
export * from './company.types';

// Skill 相关类型
export * from './skill.types';

// Repository 基础类型（从 repository 文件重新导出）
export type {
  Resume,
  CreateResumeData,
} from '../repositories/resume.repository';
export type { Job, CreateJobData } from '../repositories/job.repository';
export type {
  Analysis,
  CreateAnalysisData,
} from '../repositories/analysis.repository';
export type {
  JobMatch,
  CreateJobMatchData,
} from '../repositories/match.repository';

// Database 相关类型
export interface IDatabaseConfig {
  path: string;
  readonly?: boolean;
  timeout?: number;
  verbose?: boolean;
}

export interface IMigrationInfo {
  version: string;
  name: string;
  appliedAt: string;
}

export interface IDatabaseStats {
  tables: Record<string, number>;
  size: number;
  lastVacuum?: string;
  walMode: boolean;
  foreignKeys: boolean;
}

// 通用工具类型
export interface ITimestamps {
  createdAt: string;
  updatedAt?: string;
}

export interface IIdentifiable {
  id: string;
}

export interface IEntity extends IIdentifiable, ITimestamps {}

export interface IValidationResult {
  isValid: boolean;
  errors: IValidationError[];
}

export interface IValidationError {
  field: string;
  message: string;
  code?: string;
  value?: any;
}

// 服务层通用类型
export interface IServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: IValidationError[];
}

export interface IServiceOptions {
  skipValidation?: boolean;
  includeDeleted?: boolean;
  transaction?: boolean;
}

// 事件和日志类型
export interface ILogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
  context?: {
    userId?: string;
    sessionId?: string;
    action?: string;
    entityId?: string;
    entityType?: string;
    metadata?: Record<string, any>;
  };
}

export interface IEvent {
  type: string;
  entityType: 'resume' | 'job' | 'analysis' | 'match' | 'custom_prompt';
  entityId: string;
  action: 'created' | 'updated' | 'deleted' | 'analyzed' | 'matched';
  timestamp: string;
  metadata?: Record<string, any>;
}

// AI 模型配置类型（从 api.types.ts 导入）
export interface IAiModelConfig {
  name: string;
  provider: 'openrouter' | 'deepseek' | 'openai' | 'anthropic';
  modelId: string;
  maxTokens: number;
  temperature: number;
  supportedTasks: ('analysis' | 'matching' | 'generation')[];
  costPer1kTokens?: number;
  isDefault?: boolean;
}

// 配置相关类型
export interface IAppConfig {
  database: IDatabaseConfig;
  ai: {
    models: IAiModelConfig[];
    defaultModel: string;
    timeout: number;
    maxRetries: number;
  };
  upload: {
    maxFileSize: number;
    allowedTypes: string[];
    uploadDir: string;
  };
  api: {
    rateLimit: {
      windowMs: number;
      maxRequests: number;
    };
    cors: {
      origins: string[];
      credentials: boolean;
    };
  };
}

// 重新导出常用的枚举和常量类型
export const FILE_TYPES = ['pdf', 'markdown', 'txt'] as const;
export type FileType = (typeof FILE_TYPES)[number];

export const ANALYSIS_TYPES = [
  'star_check',
  'optimization',
  'grammar_check',
  'custom',
] as const;
export type AnalysisTypeEnum = (typeof ANALYSIS_TYPES)[number];

export const AI_PROVIDERS = [
  'openrouter',
  'deepseek',
  'openai',
  'anthropic',
] as const;
export type AiProvider = (typeof AI_PROVIDERS)[number];

export const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

export const ENTITY_TYPES = [
  'resume',
  'job',
  'analysis',
  'match',
  'custom_prompt',
] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

export const ACTIONS = [
  'created',
  'updated',
  'deleted',
  'analyzed',
  'matched',
] as const;
export type Action = (typeof ACTIONS)[number];
