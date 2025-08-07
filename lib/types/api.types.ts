// API 相关类型定义

// 通用 API 响应类型
export interface IApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

export interface IApiError {
  code: string;
  message: string;
  details?: any;
  stack?: string;
}

export interface IApiListResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface IPaginationParams {
  limit?: number;
  offset?: number;
  page?: number;
  pageSize?: number;
}

export interface ISortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IFilterParams {
  [key: string]: any;
}

export interface IQueryParams extends IPaginationParams, ISortParams {
  filters?: IFilterParams;
  search?: string;
}

// 文件上传相关类型
export interface IFileUploadRequest {
  file: File | Buffer;
  filename: string;
  fileType: string;
  metadata?: {
    [key: string]: any;
  };
}

export interface IFileUploadResponse {
  fileId: string;
  filename: string;
  fileType: string;
  size: number;
  uploadedAt: string;
  url?: string;
}

// 批量操作类型
export interface IBatchRequest<T> {
  items: T[];
  options?: {
    continueOnError?: boolean;
    validateAll?: boolean;
  };
}

export interface IBatchResponse<T> {
  successful: T[];
  failed: {
    item: any;
    error: string;
  }[];
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

// Job Match 相关 API 类型
export interface IJobMatchRequest {
  resumeId: string;
  jobId: string;
  options?: {
    aiModel?: string;
    includeHrMessage?: boolean;
    detailLevel?: 'basic' | 'detailed' | 'comprehensive';
  };
}

export interface IJobMatchData {
  id: string;
  resumeId: string;
  jobId: string;
  matchScore: number;
  skillMatch?: {
    matched: string[];
    missing: string[];
    score: number;
  };
  experienceMatch?: {
    required: string;
    candidate: string;
    score: number;
    gaps: string[];
  };
  educationMatch?: {
    required: string;
    candidate: string;
    score: number;
    meets: boolean;
  };
  strengths?: string[];
  gaps?: string[];
  recommendations?: string[];
  hrMessage?: string;
  createdAt: string;
}

export interface IJobMatchResponse extends IApiResponse<IJobMatchData> {}

export interface IJobMatchListResponse extends IApiResponse<IApiListResponse<IJobMatchData>> {}

// Custom Prompt 相关类型
export interface ICustomPromptData {
  id: string;
  name: string;
  description?: string;
  promptTemplate: string;
  aiModel?: string;
  category?: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateCustomPromptRequest {
  name: string;
  description?: string;
  promptTemplate: string;
  aiModel?: string;
  category?: string;
}

export interface IUpdateCustomPromptRequest extends Partial<ICreateCustomPromptRequest> {
  id: string;
}

export interface ICustomPromptResponse extends IApiResponse<ICustomPromptData> {}

export interface ICustomPromptListResponse extends IApiResponse<IApiListResponse<ICustomPromptData>> {}

// AI 模型和配置相关类型
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

export interface IAiRequest {
  model: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  metadata?: {
    task: string;
    userId?: string;
    sessionId?: string;
  };
}

export interface IAiResponse {
  success: boolean;
  content?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  processingTime: number;
  error?: string;
}

// 统计和分析 API 类型
export interface IDashboardStats {
  resumes: {
    total: number;
    recentUploads: number;
    byFileType: Record<string, number>;
  };
  jobs: {
    total: number;
    recentlyAdded: number;
    topCompanies: { name: string; count: number }[];
  };
  analyses: {
    total: number;
    recentAnalyses: number;
    byType: Record<string, number>;
    averageScores: Record<string, number>;
  };
  matches: {
    total: number;
    recentMatches: number;
    averageScore: number;
    scoreDistribution: { range: string; count: number }[];
  };
}

export interface IHealthCheckResponse extends IApiResponse {
  data: {
    database: {
      status: 'healthy' | 'unhealthy';
      canRead: boolean;
      canWrite: boolean;
      tablesExist: boolean;
      lastError?: string;
    };
    ai: {
      models: {
        name: string;
        status: 'available' | 'unavailable';
        lastChecked: string;
      }[];
    };
    system: {
      uptime: number;
      memory: {
        used: number;
        total: number;
        percentage: number;
      };
      version: string;
    };
  };
}

// 导出/导入相关类型
export interface IExportRequest {
  type: 'resumes' | 'jobs' | 'analyses' | 'matches' | 'all';
  format: 'json' | 'csv' | 'xlsx';
  filters?: IFilterParams;
  options?: {
    includeDeleted?: boolean;
    dateRange?: {
      from: string;
      to: string;
    };
  };
}

export interface IExportResponse extends IApiResponse {
  data: {
    downloadUrl: string;
    filename: string;
    fileSize: number;
    recordCount: number;
    expiresAt: string;
  };
}

export interface IImportRequest {
  type: 'resumes' | 'jobs' | 'custom_prompts';
  file: File | Buffer;
  format: 'json' | 'csv' | 'xlsx';
  options?: {
    skipDuplicates?: boolean;
    validateData?: boolean;
    dryRun?: boolean;
  };
}

export interface IImportResponse extends IApiResponse {
  data: {
    total: number;
    imported: number;
    skipped: number;
    errors: {
      row: number;
      error: string;
    }[];
  };
}