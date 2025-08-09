// 技能分析相关类型定义

// 技能分类枚举
export enum SkillCategory {
  PROGRAMMING_LANGUAGE = '编程语言',
  FRAMEWORK = '开发框架', 
  DATABASE = '数据库',
  TOOL = '开发工具',
  CLOUD = '云计算',
  OPERATING_SYSTEM = '操作系统',
  VERSION_CONTROL = '版本控制',
  TESTING = '测试工具',
  DEVOPS = '运维部署',
  OTHER = '其他技术',
}

// 软技能分类枚举
export enum SoftSkillCategory {
  COMMUNICATION = '沟通协调',
  LEADERSHIP = '领导管理', 
  ANALYTICAL = '分析思维',
  LEARNING = '学习能力',
  TEAMWORK = '团队协作',
  PROJECT_MANAGEMENT = '项目管理',
  PROBLEM_SOLVING = '问题解决',
  CREATIVITY = '创新创造',
  OTHER = '其他软技能',
}

// 技能优先级枚举
export enum SkillPriority {
  REQUIRED = 'required',     // 必需技能
  PREFERRED = 'preferred',   // 优先技能 
  OPTIONAL = 'optional',     // 可选技能
}

// 熟练度等级枚举
export enum ProficiencyLevel {
  EXPERT = 'expert',         // 精通
  PROFICIENT = 'proficient', // 熟练
  FAMILIAR = 'familiar',     // 熟悉
  BASIC = 'basic',          // 了解
  UNKNOWN = 'unknown',      // 未知
}

// 技术技能接口
export interface TechnicalSkill {
  name: string;                    // 技能名称
  category: SkillCategory;         // 技能分类
  priority: SkillPriority;         // 必需/加分
  proficiency: ProficiencyLevel;   // 熟练度要求
  weight: number;                  // 权重分数 1-10
  aliases: string[];               // 别名和变体
  version?: string;                // 版本要求
  context: string;                 // 上下文描述
  yearRequirement?: number;        // 年限要求
  evidence?: string;               // 原文证据
}

// 软技能接口
export interface SoftSkill {
  name: string;                    // 技能名称
  category: SoftSkillCategory;     // 技能分类
  importance: number;              // 重要性评分 1-10
  description: string;             // 具体要求描述
  priority: SkillPriority;         // 必需/优先/可选
  evidence?: string;               // 原文证据
}

// 技能要求接口
export interface SkillRequirement {
  type: 'technical' | 'soft';      // 技能类型
  skillName: string;               // 技能名称
  priority: SkillPriority;         // 优先级
  proficiency?: ProficiencyLevel;  // 熟练度要求（仅技术技能）
  yearRequirement?: number;        // 年限要求
  description: string;             // 要求描述
  source: string;                  // 来源文本
  confidence: number;              // 置信度 0-1
}

// 技能可视化数据接口
export interface SkillVisualization {
  wordCloudData: SkillWordCloudItem[];          // 技能云图数据
  categoryDistribution: SkillCategoryData[];    // 分类分布数据
  proficiencyRadar: SkillRadarData[];          // 熟练度雷达图数据
  priorityBreakdown: SkillPriorityData[];      // 优先级分布数据
  skillComparison?: SkillComparisonData;       // 技能对比数据（可选）
}

// 技能云图项目
export interface SkillWordCloudItem {
  text: string;                    // 技能名称
  value: number;                   // 权重值
  color: string;                   // 颜色
  category: SkillCategory | SoftSkillCategory; // 分类
  priority: SkillPriority;         // 优先级
}

// 技能分类数据
export interface SkillCategoryData {
  category: string;                // 分类名称
  count: number;                   // 技能数量
  weight: number;                  // 总权重
  color: string;                   // 显示颜色
}

// 技能雷达图数据
export interface SkillRadarData {
  category: string;                // 分类名称
  required: number;                // 必需技能数量
  preferred: number;               // 优先技能数量
  total: number;                   // 总技能数量
  maxLevel: ProficiencyLevel;      // 最高熟练度要求
}

// 优先级数据
export interface SkillPriorityData {
  priority: SkillPriority;         // 优先级
  count: number;                   // 数量
  percentage: number;              // 百分比
  color: string;                   // 显示颜色
}

// 技能对比数据
export interface SkillComparisonData {
  jobRequiredSkills: string[];     // 岗位要求技能
  userSkills: string[];            // 用户技能
  matchedSkills: string[];         // 匹配技能
  missingSkills: string[];         // 缺失技能
  extraSkills: string[];           // 额外技能
  matchScore: number;              // 匹配分数 0-100
}

// 主要的技能分析结果接口
export interface SkillAnalysis {
  technicalSkills: TechnicalSkill[];          // 技术技能列表
  softSkills: SoftSkill[];                    // 软技能列表
  skillRequirements: SkillRequirement[];      // 技能要求总览
  visualizationData: SkillVisualization;      // 可视化数据
  metadata: SkillAnalysisMetadata;            // 分析元数据
}

// 分析元数据
export interface SkillAnalysisMetadata {
  totalSkillsFound: number;        // 发现的技能总数
  technicalSkillCount: number;     // 技术技能数量
  softSkillCount: number;          // 软技能数量
  requiredSkillCount: number;      // 必需技能数量
  preferredSkillCount: number;     // 优先技能数量
  averageWeight: number;           // 平均权重
  confidence: number;              // 整体置信度
  processingTime: number;          // 处理耗时（毫秒）
  aiModel: string;                 // 使用的AI模型
  extractionMethod: 'ai' | 'dictionary' | 'hybrid'; // 提取方法
  warnings: string[];              // 警告信息
}

// 技能词典项目
export interface SkillDictionaryItem {
  name: string;                    // 标准名称
  aliases: string[];               // 别名列表
  category: SkillCategory;         // 分类
  variants: SkillVariant[];        // 变体
  weight: number;                  // 基础权重
  rarity: number;                  // 稀缺度评分 1-10
  marketDemand: number;            // 市场需求度 1-10
  learningDifficulty: number;      // 学习难度 1-10
}

// 技能变体
export interface SkillVariant {
  name: string;                    // 变体名称
  version?: string;                // 版本信息
  context?: string;                // 上下文
  aliases: string[];               // 变体别名
}

// 软技能词典项目
export interface SoftSkillDictionaryItem {
  name: string;                    // 标准名称
  aliases: string[];               // 别名列表
  category: SoftSkillCategory;     // 分类
  keywords: string[];              // 关键词
  importance: number;              // 重要性 1-10
  description: string;             // 描述
}

// 技能识别配置
export interface SkillExtractionConfig {
  useAI: boolean;                  // 是否使用AI增强
  aiModel: string;                 // AI模型
  confidenceThreshold: number;     // 置信度阈值
  maxSkillsPerCategory: number;    // 每个分类最大技能数
  includeVersions: boolean;        // 是否识别版本
  filterGenericSkills: boolean;    // 是否过滤通用技能
  weightBoostRules: WeightBoostRule[]; // 权重提升规则
}

// 权重提升规则
export interface WeightBoostRule {
  condition: string;               // 条件描述
  type: 'title_match' | 'frequency' | 'rarity' | 'proficiency' | 'custom'; // 规则类型
  boost: number;                   // 提升值
  maxBoost?: number;               // 最大提升值
}

// AI提示词模板（技能提取专用）
export interface SkillExtractionPrompt {
  systemPrompt: string;            // 系统提示词
  userPrompt: string;              // 用户提示词
  expectedFormat: any;             // 期望格式
  examples?: SkillExtractionExample[]; // 示例
}

// 技能提取示例
export interface SkillExtractionExample {
  input: string;                   // 输入文本
  expectedOutput: any;             // 期望输出
  explanation?: string;            // 解释说明
}

// 技能过滤选项
export interface SkillFilterOptions {
  excludeGeneric: boolean;         // 排除通用技能
  minWeight: number;               // 最小权重阈值
  minConfidence: number;           // 最小置信度阈值
  maxResults: number;              // 最大结果数
  categoryFilter: SkillCategory[]; // 分类过滤
  priorityFilter: SkillPriority[]; // 优先级过滤
}

// 技能匹配结果
export interface SkillMatchResult {
  jobId: string;                   // 岗位ID
  resumeId?: string;               // 简历ID（可选）
  technicalSkillMatch: SkillMatch; // 技术技能匹配
  softSkillMatch: SkillMatch;      // 软技能匹配
  overallMatch: SkillMatch;        // 整体匹配
  recommendations: SkillRecommendation[]; // 推荐建议
  analysisDate: string;            // 分析日期
}

// 技能匹配详情
export interface SkillMatch {
  score: number;                   // 匹配分数 0-100
  matchedSkills: string[];         // 匹配的技能
  missingSkills: string[];         // 缺失的技能
  extraSkills: string[];           // 额外的技能
  partialMatches: PartialSkillMatch[]; // 部分匹配
}

// 部分技能匹配
export interface PartialSkillMatch {
  requiredSkill: string;           // 要求的技能
  userSkill: string;               // 用户技能
  similarity: number;              // 相似度 0-1
  reason: string;                  // 匹配原因
}

// 技能推荐建议
export interface SkillRecommendation {
  type: 'learn' | 'improve' | 'showcase'; // 建议类型
  skill: string;                   // 技能名称
  priority: 'high' | 'medium' | 'low'; // 优先级
  reason: string;                  // 建议原因
  resources?: string[];            // 学习资源（可选）
  estimatedTime?: string;          // 预估学习时间（可选）
}

// 技能趋势数据
export interface SkillTrendData {
  skill: string;                   // 技能名称
  category: SkillCategory;         // 分类
  demandTrend: number;             // 需求趋势（正数上升，负数下降）
  avgSalary: number;               // 平均薪资
  jobCount: number;                // 岗位数量
  growthRate: number;              // 增长率
  region: string;                  // 地区
  lastUpdated: string;             // 最后更新时间
}