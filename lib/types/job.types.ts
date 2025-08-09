// Job 相关类型定义

export interface IJobRequirements {
  required?: string[];
  preferred?: string[];
  education?: string[];
  experience?: string[];
  certifications?: string[];
}

export interface IJobSkills {
  technical: string[];
  soft: string[];
  tools?: string[];
  languages?: string[];
}

export interface IJobResponsibilities {
  primary: string[];
  secondary?: string[];
  growth?: string[];
}

export interface ICompanyInfo {
  name: string;
  size?: string;
  industry?: string;
  culture?: string[];
  benefits?: string[];
  website?: string;
  description?: string;
}

export interface IParsedJobData {
  extractionMethod?: string;
  confidence?: number;
  timestamp?: string;
  warnings?: string[];
  sections?: {
    requirements?: boolean;
    responsibilities?: boolean;
    skills?: boolean;
    company?: boolean;
  };
}

export interface IJobData {
  id: string;
  url?: string;
  title: string;
  company: string;
  location?: string;
  salaryRange?: string;
  experienceRequired?: string;
  educationRequired?: string;
  rawDescription: string;
  parsedRequirements?: IJobRequirements;
  technicalSkills?: string[];
  softSkills?: string[];
  responsibilities?: IJobResponsibilities;
  companyInfo?: ICompanyInfo;
  createdAt: string;
}

export interface ICreateJobRequest {
  url?: string;
  title: string;
  company: string;
  location?: string;
  salaryRange?: string;
  experienceRequired?: string;
  educationRequired?: string;
  rawDescription: string;
  parsedRequirements?: IJobRequirements;
  technicalSkills?: string[];
  softSkills?: string[];
  responsibilities?: IJobResponsibilities;
  companyInfo?: ICompanyInfo;
}

export interface IUpdateJobRequest extends Partial<ICreateJobRequest> {
  id: string;
}

export interface IJobQueryParams {
  limit?: number;
  offset?: number;
  company?: string;
  title?: string;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'lead';
  skills?: string[];
  sortBy?: 'created_at' | 'title' | 'company' | 'location';
  sortOrder?: 'asc' | 'desc';
}

export interface IJobListResponse {
  jobs: IJobData[];
  total: number;
  limit: number;
  offset: number;
}

export interface IJobSearchRequest {
  query: string;
  filters?: {
    company?: string[];
    location?: string[];
    salaryRange?: {
      min?: number;
      max?: number;
    };
    experienceLevel?: string[];
    skills?: string[];
  };
  limit?: number;
  offset?: number;
}

export interface IJobValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface IJobValidationResult {
  isValid: boolean;
  errors: IJobValidationError[];
}

// Job 解析相关类型
export interface IJobParsingOptions {
  extractRequirements?: boolean;
  extractSkills?: boolean;
  extractResponsibilities?: boolean;
  extractCompanyInfo?: boolean;
  aiModel?: string;
}

export interface IJobParsingResult {
  success: boolean;
  parsedRequirements?: IJobRequirements;
  technicalSkills?: string[];
  softSkills?: string[];
  responsibilities?: IJobResponsibilities;
  companyInfo?: ICompanyInfo;
  errors?: string[];
  warnings?: string[];
}

// Job 统计相关类型
export interface IJobStats {
  totalJobs: number;
  topCompanies: {
    company: string;
    count: number;
  }[];
  topLocations: {
    location: string;
    count: number;
  }[];
  salaryDistribution?: {
    range: string;
    count: number;
  }[];
  skillDemand: {
    skill: string;
    count: number;
  }[];
  experienceLevels: {
    level: string;
    count: number;
  }[];
}

// Job 匹配评分相关类型
export interface IJobScoring {
  skillMatch: number; // 0-100
  experienceMatch: number; // 0-100
  educationMatch: number; // 0-100
  locationMatch?: number; // 0-100
  cultureMatch?: number; // 0-100
}

export interface IJobMatchCriteria {
  requiredSkills: string[];
  preferredSkills?: string[];
  experienceYears: number;
  educationLevel: string;
  location?: string;
  weights?: {
    skills: number;
    experience: number;
    education: number;
    location: number;
  };
}
