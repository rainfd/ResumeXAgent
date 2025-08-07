// Analysis 相关类型定义

export type AnalysisType = 'star_check' | 'optimization' | 'grammar_check' | 'custom';

export interface IStarCheckResult {
  sections: {
    [sectionName: string]: {
      hasStarFormat: boolean;
      examples: string[];
      suggestions: string[];
      score: number; // 0-100
    };
  };
  overallScore: number; // 0-100
  totalStarExamples: number;
  improvementAreas: string[];
}

export interface IOptimizationResult {
  keywords: {
    missing: string[];
    present: string[];
    suggested: string[];
    density: number; // 0-1
  };
  structure: {
    hasContactInfo: boolean;
    hasSummary: boolean;
    hasExperience: boolean;
    hasEducation: boolean;
    hasSkills: boolean;
    score: number; // 0-100
  };
  content: {
    lengthScore: number; // 0-100
    clarityScore: number; // 0-100
    impactScore: number; // 0-100
  };
  recommendations: string[];
}

export interface IGrammarCheckResult {
  errors: {
    type: 'grammar' | 'spelling' | 'punctuation' | 'style';
    message: string;
    suggestion: string;
    position: {
      line: number;
      column: number;
    };
    context: string;
  }[];
  score: number; // 0-100
  summary: {
    grammarErrors: number;
    spellingErrors: number;
    punctuationErrors: number;
    styleIssues: number;
  };
}

export interface ICustomAnalysisResult {
  promptUsed: string;
  analysisResults: any; // 自定义分析结果，结构可变
  interpretation?: string;
  actionItems?: string[];
}

export interface IAnalysisResults {
  starCheck?: IStarCheckResult;
  optimization?: IOptimizationResult;
  grammarCheck?: IGrammarCheckResult;
  custom?: ICustomAnalysisResult;
}

export interface IAnalysisSuggestions {
  immediate: string[];  // 立即可以改进的
  shortTerm: string[];  // 短期改进建议
  longTerm: string[];   // 长期改进建议
  priority: {
    high: string[];
    medium: string[];
    low: string[];
  };
}

export interface IAnalysisData {
  id: string;
  resumeId: string;
  jobId?: string;
  analysisType: AnalysisType;
  aiModel: string;
  results: IAnalysisResults;
  suggestions?: IAnalysisSuggestions;
  score?: number;
  createdAt: string;
}

export interface ICreateAnalysisRequest {
  resumeId: string;
  jobId?: string;
  analysisType: AnalysisType;
  aiModel: string;
  customPrompt?: string; // 仅用于 custom 类型
  options?: {
    includeJobComparison?: boolean;
    focusAreas?: string[];
    detailLevel?: 'basic' | 'detailed' | 'comprehensive';
  };
}

export interface IUpdateAnalysisRequest extends Partial<ICreateAnalysisRequest> {
  id: string;
  results?: IAnalysisResults;
  suggestions?: IAnalysisSuggestions;
  score?: number;
}

export interface IAnalysisQueryParams {
  limit?: number;
  offset?: number;
  resumeId?: string;
  jobId?: string;
  analysisType?: AnalysisType;
  aiModel?: string;
  minScore?: number;
  maxScore?: number;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'created_at' | 'score' | 'analysis_type';
  sortOrder?: 'asc' | 'desc';
}

export interface IAnalysisListResponse {
  analyses: IAnalysisData[];
  total: number;
  limit: number;
  offset: number;
}

export interface IAnalysisValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface IAnalysisValidationResult {
  isValid: boolean;
  errors: IAnalysisValidationError[];
}

// Analysis 处理选项
export interface IAnalysisProcessingOptions {
  aiModel?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number; // 秒
  retries?: number;
}

export interface IAnalysisProcessingResult {
  success: boolean;
  analysis?: IAnalysisData;
  processingTime: number; // 毫秒
  tokensUsed?: number;
  errors?: string[];
  warnings?: string[];
}

// Analysis 比较和趋势
export interface IAnalysisComparison {
  currentAnalysis: IAnalysisData;
  previousAnalysis?: IAnalysisData;
  improvements: {
    field: string;
    improvement: number; // 正数表示改进，负数表示退步
    description: string;
  }[];
  overallTrend: 'improving' | 'declining' | 'stable';
}

export interface IAnalysisStats {
  totalAnalyses: number;
  byType: {
    [key in AnalysisType]: number;
  };
  averageScores: {
    [key in AnalysisType]: number;
  };
  recentAnalyses: number; // 最近30天
  topAiModels: {
    model: string;
    count: number;
    averageScore: number;
  }[];
  scoreDistribution: {
    range: string;
    count: number;
  }[];
}