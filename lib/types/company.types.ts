// 公司分析相关类型定义

export enum CompanySize {
  STARTUP = '初创公司',
  SMALL = '小型企业',
  MEDIUM = '中型企业',
  LARGE = '大型企业',
  UNICORN = '独角兽',
  PUBLIC = '上市公司',
}

export enum Industry {
  INTERNET = '互联网',
  FINTECH = '金融科技',
  ECOMMERCE = '电子商务',
  EDUCATION = '教育培训',
  HEALTHCARE = '医疗健康',
  GAMING = '游戏娱乐',
  MANUFACTURING = '制造业',
  CONSULTING = '咨询服务',
  AI_ML = '人工智能',
  BLOCKCHAIN = '区块链',
  IOT = '物联网',
  AUTOMOTIVE = '汽车',
  REAL_ESTATE = '房地产',
  MEDIA = '媒体娱乐',
  LOGISTICS = '物流配送',
  RETAIL = '零售',
  ENERGY = '能源',
  GOVERNMENT = '政府机构',
}

export enum CultureValue {
  INNOVATION = '创新',
  COLLABORATION = '协作',
  CUSTOMER_FOCUS = '客户导向',
  RESULTS_DRIVEN = '结果导向',
  INTEGRITY = '诚信',
  LEARNING = '学习成长',
  DIVERSITY = '多元化',
  WORK_LIFE_BALANCE = '工作生活平衡',
  EXCELLENCE = '追求卓越',
  RESPONSIBILITY = '责任担当',
  OPENNESS = '开放包容',
  EFFICIENCY = '高效执行',
}

export enum ManagementStyle {
  FLAT = '扁平化管理',
  HIERARCHICAL = '层级制管理',
  AGILE = '敏捷管理',
  TRADITIONAL = '传统管理',
  MATRIX = '矩阵式管理',
  DEMOCRATIC = '民主化管理',
}

export enum WorkStyle {
  FLEXIBLE = '灵活工作',
  REMOTE_FRIENDLY = '远程友好',
  OFFICE_FIRST = '办公室优先',
  HYBRID = '混合办公',
  FAST_PACED = '快节奏',
  COLLABORATIVE = '协作式',
  AUTONOMOUS = '自主性强',
  STRUCTURED = '结构化',
}

export enum DevelopmentStage {
  SEED = '种子期',
  STARTUP = '初创期',
  GROWTH = '成长期',
  MATURE = '成熟期',
  TRANSFORMATION = '转型期',
  EXPANSION = '扩张期',
  IPO_PREPARATION = 'IPO筹备期',
}

export enum CompanyNature {
  PRIVATE = '民营企业',
  FOREIGN = '外资企业',
  STATE_OWNED = '国有企业',
  JOINT_VENTURE = '合资企业',
  LISTED = '上市公司',
  UNICORN_COMPANY = '独角兽企业',
  STARTUP_COMPANY = '创业公司',
}

export enum OfficeType {
  OPEN_OFFICE = '开放式办公',
  PRIVATE_OFFICE = '独立办公室',
  SHARED_WORKSPACE = '共享工作空间',
  REMOTE_WORK = '远程办公',
  HYBRID_OFFICE = '混合办公',
  COWORKING = '联合办公',
}

export enum TeamAtmosphere {
  YOUTHFUL = '年轻化',
  DIVERSE = '多元化',
  INTERNATIONAL = '国际化',
  PROFESSIONAL = '专业化',
  INNOVATIVE = '创新型',
  FRIENDLY = '友好型',
  COMPETITIVE = '竞争型',
  SUPPORTIVE = '支持型',
}

export enum WorkIntensity {
  RELAXED = '轻松',
  MODERATE = '适中',
  INTENSE = '紧张',
  HIGH_PRESSURE = '高压',
  FLEXIBLE = '弹性',
  NINE_NINE_SIX = '996',
  NORMAL_HOURS = '正常工时',
  OVERTIME = '经常加班',
}

export enum CommunicationStyle {
  OPEN_COMMUNICATION = '开放沟通',
  HIERARCHICAL_REPORTING = '层级汇报',
  CROSS_DEPARTMENT = '跨部门协作',
  TRANSPARENT = '透明沟通',
  FORMAL = '正式沟通',
  INFORMAL = '非正式沟通',
}

export enum TeamActivity {
  TEAM_BUILDING = '团建活动',
  DINING = '聚餐活动',
  TRAVEL = '旅游活动',
  TRAINING = '培训活动',
  SPORTS = '体育活动',
  CULTURAL = '文化活动',
  VOLUNTEER = '志愿活动',
}

export enum TagCategory {
  SIZE = '规模',
  CULTURE = '文化',
  BENEFITS = '福利',
  ENVIRONMENT = '环境',
  DEVELOPMENT = '发展',
  INDUSTRY = '行业',
  STAGE = '阶段',
  NATURE = '性质',
}

export interface CompanyBasicInfo {
  industry: Industry[];
  size: CompanySize;
  stage: DevelopmentStage;
  nature: CompanyNature;
  founded?: number;
  headquarters?: string;
  employees?: string;
  revenue?: string;
}

export interface CorporateCulture {
  values: CultureValue[];
  workStyle: WorkStyle[];
  management: ManagementStyle;
  mission?: string;
  vision?: string;
  cultureScore: number;
  evidence: string[];
}

export interface BasicBenefit {
  name: string;
  description?: string;
  category: 'insurance' | 'leave' | 'allowance' | 'welfare';
}

export interface SpecialBenefit {
  name: string;
  description?: string;
  category: 'equity' | 'development' | 'lifestyle' | 'health';
}

export interface CompensationStructure {
  baseSalary?: string;
  performance?: string;
  bonus?: string;
  equity?: string;
  other?: string[];
}

export interface DevelopmentBenefit {
  name: string;
  description?: string;
  category: 'training' | 'education' | 'certification' | 'conference';
}

export interface BenefitsPackage {
  basicBenefits: BasicBenefit[];
  specialBenefits: SpecialBenefit[];
  compensation: CompensationStructure;
  developmentBenefits: DevelopmentBenefit[];
  benefitsScore: number;
}

export interface WorkEnvironment {
  officeSetup: OfficeType;
  teamAtmosphere: TeamAtmosphere[];
  workIntensity: WorkIntensity;
  communication: CommunicationStyle;
  teamActivities: TeamActivity[];
  environmentScore: number;
}

export interface CompanyTag {
  name: string;
  category: TagCategory;
  weight: number;
  confidence: number;
  source: string;
  color: string;
}

export interface CompanyScore {
  total: number;
  cultureScore: number;
  benefitsScore: number;
  environmentScore: number;
  developmentScore: number;
}

export interface CompanyAnalysis {
  basicInfo: CompanyBasicInfo;
  culture: CorporateCulture;
  benefits: BenefitsPackage;
  workEnvironment: WorkEnvironment;
  companyTags: CompanyTag[];
  overallScore: CompanyScore;
  analysisMetadata: {
    analysisDate: string;
    confidence: number;
    aiModel: string;
    extractionQuality: 'high' | 'medium' | 'low';
    processingTime?: number;
  };
}

export interface CompanyAnalysisRequest {
  jobDescription: string;
  companyName: string;
  options?: {
    skipBasicInfo?: boolean;
    skipCulture?: boolean;
    skipBenefits?: boolean;
    skipEnvironment?: boolean;
    aiModel?: string;
  };
}

export interface CompanyAnalysisResponse {
  success: boolean;
  data?: CompanyAnalysis;
  error?: string;
  warnings?: string[];
}

// AI 分析相关类型
export interface CompanyAnalysisPrompt {
  systemPrompt: string;
  userPrompt: string;
  expectedFormat: string;
}

export interface CompanyKeywordPatterns {
  size: Record<CompanySize, string[]>;
  industry: Record<Industry, string[]>;
  culture: Record<CultureValue, string[]>;
  benefits: {
    basic: string[];
    special: string[];
    development: string[];
  };
  environment: Record<WorkIntensity, string[]>;
}

export interface CompanyAnalysisConfig {
  keywords: CompanyKeywordPatterns;
  weights: {
    culture: number;
    benefits: number;
    environment: number;
    development: number;
  };
  confidenceThresholds: {
    high: number;
    medium: number;
    low: number;
  };
}