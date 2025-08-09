import { AIService } from './ai.service';
import { logger } from '../utils/logger';
import {
  JobContentAnalysis,
  Responsibility,
  ResponsibilityCategory,
  ImportanceLevel,
  FrequencyLevel,
  WorkTypeAnalysis,
  WorkType,
  ExperienceLevel,
  TechStackAnalysis,
  ProjectScale,
  ComplexityLevel,
  BusinessDomain,
  TechChallenge,
  CollaborationInfo,
  GrowthAssessment,
  CareerPath,
  ImpactScope,
  JobSummary,
} from '../types/job.types';

interface ResponsibilityExtractionResult {
  responsibilities: Array<{
    description: string;
    importance: string;
    frequency: string;
    category: string;
    keywords: string[];
  }>;
  confidence: number;
}

interface WorkTypeClassificationResult {
  workTypes: Array<{
    type: string;
    percentage: number;
    description: string;
    level: string;
  }>;
  confidence: number;
}

interface TechStackAnalysisResult {
  projectScale: {
    teamSize: string;
    projectDuration: string;
    userScale: string;
  };
  techComplexity: string;
  domain: string[];
  modernization: number;
  challenges: Array<{
    type: string;
    description: string;
    complexity: string;
  }>;
  confidence: number;
}

interface CollaborationAnalysisResult {
  collaborations: Array<{
    department: string;
    frequency: string;
    depth: string;
    requirements: string[];
  }>;
  confidence: number;
}

interface GrowthAssessmentResult {
  learningOpportunities: number;
  careerPath: string[];
  challengeLevel: number;
  impactScope: string;
  growthPotential: number;
  confidence: number;
}

export class JobContentAnalyzerService {
  private aiService: AIService;

  constructor() {
    this.aiService = new AIService();
  }

  async analyzeJobContent(
    jobDescription: string,
    jobTitle: string
  ): Promise<JobContentAnalysis> {
    try {
      logger.info('开始工作内容分析', 'JobContentAnalyzer', { jobTitle });

      // 并行执行所有分析任务
      const [
        responsibilities,
        workTypes,
        techStackAnalysis,
        collaborationRequirements,
        growthAssessment,
      ] = await Promise.all([
        this.extractResponsibilities(jobDescription),
        this.classifyWorkType(jobDescription, jobTitle),
        this.analyzeTechStackAndProjects(jobDescription),
        this.analyzeCollaboration(jobDescription),
        this.assessGrowthPotential(jobDescription),
      ]);

      // 生成工作内容摘要
      const summary = this.generateJobSummary({
        responsibilities,
        workTypes,
        techStackAnalysis,
        collaborationRequirements,
        growthAssessment,
      } as Partial<JobContentAnalysis>);

      const analysis: JobContentAnalysis = {
        responsibilities,
        workTypes,
        techStackAnalysis,
        collaborationRequirements,
        growthAssessment,
        summary,
        analysisDate: new Date().toISOString(),
        confidenceScore: this.calculateOverallConfidence([
          responsibilities.length > 0 ? 0.8 : 0,
          workTypes.length > 0 ? 0.8 : 0,
          0.8, // techStackAnalysis 置信度
          collaborationRequirements.length > 0 ? 0.8 : 0,
          0.8, // growthAssessment 置信度
        ]),
      };

      logger.info('工作内容分析完成', 'JobContentAnalyzer', {
        confidenceScore: analysis.confidenceScore,
      });

      return analysis;
    } catch (error) {
      logger.error(
        '工作内容分析失败',
        'JobContentAnalyzer',
        error instanceof Error ? error : undefined
      );
      throw new Error(
        `工作内容分析失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  }

  async extractResponsibilities(
    description: string
  ): Promise<Responsibility[]> {
    try {
      const prompt = {
        systemPrompt: `你是一个专业的工作职责分析专家。从岗位描述中提取具体的工作职责，并进行分类和排序。

要求：
1. 识别具体的工作任务和职责，忽略通用要求如"沟通协调"
2. 按重要性排序：high（核心职责）、medium（重要职责）、low（辅助职责）
3. 判断执行频率：daily（每日）、weekly（每周）、monthly（每月）、occasional（偶尔）
4. 分类职责类型：core（核心职责）、support（辅助职责）、occasional（临时任务）
5. 提取每个职责的关键词

返回JSON格式，包含confidence字段。`,
        userPrompt: `请从以下岗位描述中提取工作职责：

${description}

请返回JSON格式：
{
  "responsibilities": [
    {
      "description": "具体职责描述",
      "importance": "high/medium/low",
      "frequency": "daily/weekly/monthly/occasional",
      "category": "core/support/occasional",
      "keywords": ["关键词1", "关键词2"]
    }
  ],
  "confidence": 0.9
}`,
        expectedFormat: {
          responsibilities: 'array',
          confidence: 'number',
        },
      };

      const result = await this.aiService.extractStructuredInfo(
        description,
        prompt,
        'deepseek-chat'
      );

      if (!result.success || !result.data) {
        return [];
      }

      const extractionResult = result.data as ResponsibilityExtractionResult;

      return extractionResult.responsibilities.map((resp) => ({
        description: resp.description,
        category: this.mapResponsibilityCategory(resp.category),
        importance: this.mapImportanceLevel(resp.importance),
        frequency: this.mapFrequencyLevel(resp.frequency),
        keywords: resp.keywords || [],
      }));
    } catch (error) {
      logger.error(
        '职责提取失败',
        'JobContentAnalyzer',
        error instanceof Error ? error : undefined
      );
      return [];
    }
  }

  async classifyWorkType(
    description: string,
    jobTitle: string
  ): Promise<WorkTypeAnalysis[]> {
    try {
      const prompt = {
        systemPrompt: `你是一个专业的工作类型分类专家。分析岗位描述和职位名称，确定工作类型分布。

支持的工作类型：
- 开发：编程、开发、构建系统
- 测试：测试、质量保证、缺陷修复  
- 设计：UI/UX设计、原型设计
- 产品管理：需求分析、产品规划
- 项目管理：项目协调、进度管理
- 研发：技术研究、创新开发
- 运维：系统维护、部署运维
- 数据分析：数据处理、分析报告

要求：
1. 分析工作内容，确定涉及的工作类型
2. 估算每种工作类型的占比（总和100%）
3. 判断对应的技能级别要求：初级、中级、高级、专家级

返回JSON格式。`,
        userPrompt: `请分析以下岗位的工作类型分布：

职位：${jobTitle}
描述：${description}

请返回JSON格式：
{
  "workTypes": [
    {
      "type": "开发",
      "percentage": 70,
      "description": "主要负责系统开发和功能实现",
      "level": "中级"
    }
  ],
  "confidence": 0.85
}`,
        expectedFormat: {
          workTypes: 'array',
          confidence: 'number',
        },
      };

      const result = await this.aiService.extractStructuredInfo(
        description,
        prompt,
        'deepseek-chat'
      );

      if (!result.success || !result.data) {
        return [];
      }

      const classificationResult = result.data as WorkTypeClassificationResult;

      return classificationResult.workTypes.map((wt) => ({
        type: this.mapWorkType(wt.type),
        percentage: wt.percentage,
        description: wt.description,
        level: this.mapExperienceLevel(wt.level),
      }));
    } catch (error) {
      logger.error(
        '工作类型分类失败',
        'JobContentAnalyzer',
        error instanceof Error ? error : undefined
      );
      return [];
    }
  }

  async analyzeTechStackAndProjects(
    description: string
  ): Promise<TechStackAnalysis> {
    try {
      const prompt = {
        systemPrompt: `你是一个专业的技术栈和项目分析专家。从岗位描述中分析项目规模、技术复杂度、业务领域等。

要求：
1. 项目规模：团队大小、项目周期、用户规模
2. 技术复杂度：low（简单）、medium（中等）、high（复杂）、expert（专家级）
3. 业务领域：电商、金融科技、教育、医疗、游戏、企业服务等
4. 技术现代化程度：1-10评分
5. 技术挑战：识别技术难点和挑战

返回JSON格式。`,
        userPrompt: `请分析以下岗位的技术栈和项目信息：

${description}

请返回JSON格式：
{
  "projectScale": {
    "teamSize": "5-10人",
    "projectDuration": "3-6个月",
    "userScale": "百万级用户"
  },
  "techComplexity": "high",
  "domain": ["电商", "金融科技"],
  "modernization": 8,
  "challenges": [
    {
      "type": "性能优化",
      "description": "高并发场景下的性能优化",
      "complexity": "high"
    }
  ],
  "confidence": 0.8
}`,
        expectedFormat: {
          projectScale: 'object',
          techComplexity: 'string',
          domain: 'array',
          modernization: 'number',
          challenges: 'array',
          confidence: 'number',
        },
      };

      const result = await this.aiService.extractStructuredInfo(
        description,
        prompt,
        'deepseek-chat'
      );

      if (!result.success || !result.data) {
        return this.getDefaultTechStackAnalysis();
      }

      const analysisResult = result.data as TechStackAnalysisResult;

      return {
        projectScale: analysisResult.projectScale,
        techComplexity: this.mapComplexityLevel(analysisResult.techComplexity),
        domain: analysisResult.domain
          .map((d) => this.mapBusinessDomain(d))
          .filter(Boolean) as BusinessDomain[],
        modernization: analysisResult.modernization,
        challenges: analysisResult.challenges.map((ch) => ({
          type: ch.type,
          description: ch.description,
          complexity: this.mapComplexityLevel(ch.complexity),
        })),
      };
    } catch (error) {
      logger.error(
        '技术栈分析失败',
        'JobContentAnalyzer',
        error instanceof Error ? error : undefined
      );
      return this.getDefaultTechStackAnalysis();
    }
  }

  async analyzeCollaboration(
    description: string
  ): Promise<CollaborationInfo[]> {
    try {
      const prompt = {
        systemPrompt: `你是一个专业的协作关系分析专家。从岗位描述中识别跨部门协作要求。

协作部门类型：
- 产品：产品经理、需求对接
- 设计：UI/UX设计师、视觉设计
- 测试：测试工程师、质量保证
- 运营：运营团队、数据分析
- 销售：销售团队、客户支持
- 客户：外部客户、用户沟通

要求：
1. 识别需要协作的部门
2. 评估协作频率：daily、weekly、monthly、occasional
3. 分析协作深度：紧密合作、定期沟通、偶尔配合
4. 提取具体协作要求

返回JSON格式。`,
        userPrompt: `请分析以下岗位的协作要求：

${description}

请返回JSON格式：
{
  "collaborations": [
    {
      "department": "产品",
      "frequency": "weekly",
      "depth": "紧密合作",
      "requirements": ["需求评审", "产品规划讨论"]
    }
  ],
  "confidence": 0.75
}`,
        expectedFormat: {
          collaborations: 'array',
          confidence: 'number',
        },
      };

      const result = await this.aiService.extractStructuredInfo(
        description,
        prompt,
        'deepseek-chat'
      );

      if (!result.success || !result.data) {
        return [];
      }

      const collaborationResult = result.data as CollaborationAnalysisResult;

      return collaborationResult.collaborations.map((collab) => ({
        department: collab.department,
        frequency: this.mapFrequencyLevel(collab.frequency),
        depth: collab.depth,
        requirements: collab.requirements || [],
      }));
    } catch (error) {
      logger.error(
        '协作分析失败',
        'JobContentAnalyzer',
        error instanceof Error ? error : undefined
      );
      return [];
    }
  }

  async assessGrowthPotential(description: string): Promise<GrowthAssessment> {
    try {
      const prompt = {
        systemPrompt: `你是一个专业的成长潜力评估专家。从岗位描述中评估职业发展和成长空间。

评估维度：
1. 学习机会：新技术、新业务、培训机会（1-10评分）
2. 职业路径：技术专家、管理路线、产品方向、架构师
3. 挑战程度：工作难度和创新性（1-10评分）
4. 影响范围：团队级、部门级、公司级、行业级
5. 成长潜力：综合发展空间（1-10评分）

要求：
1. 基于岗位内容客观评估
2. 考虑技术发展趋势
3. 分析业务价值和影响力

返回JSON格式。`,
        userPrompt: `请评估以下岗位的成长潜力：

${description}

请返回JSON格式：
{
  "learningOpportunities": 8,
  "careerPath": ["技术专家", "架构师"],
  "challengeLevel": 7,
  "impactScope": "部门级",
  "growthPotential": 8,
  "confidence": 0.8
}`,
        expectedFormat: {
          learningOpportunities: 'number',
          careerPath: 'array',
          challengeLevel: 'number',
          impactScope: 'string',
          growthPotential: 'number',
          confidence: 'number',
        },
      };

      const result = await this.aiService.extractStructuredInfo(
        description,
        prompt,
        'deepseek-chat'
      );

      if (!result.success || !result.data) {
        return this.getDefaultGrowthAssessment();
      }

      const assessmentResult = result.data as GrowthAssessmentResult;

      return {
        learningOpportunities: assessmentResult.learningOpportunities,
        careerPath: assessmentResult.careerPath
          .map((cp) => this.mapCareerPath(cp))
          .filter(Boolean) as CareerPath[],
        challengeLevel: assessmentResult.challengeLevel,
        impactScope: this.mapImpactScope(assessmentResult.impactScope),
        growthPotential: assessmentResult.growthPotential,
      };
    } catch (error) {
      logger.error(
        '成长潜力评估失败',
        'JobContentAnalyzer',
        error instanceof Error ? error : undefined
      );
      return this.getDefaultGrowthAssessment();
    }
  }

  generateJobSummary(analysis: Partial<JobContentAnalysis>): JobSummary {
    const responsibilities = analysis.responsibilities || [];
    const workTypes = analysis.workTypes || [];

    // 生成概述
    const primaryWorkTypes = workTypes
      .filter((wt) => wt.percentage > 30)
      .map((wt) => wt.type)
      .slice(0, 2);

    const overview = `该岗位主要涉及${primaryWorkTypes.join('和')}工作，包含${responsibilities.length}项核心职责。`;

    // 提取关键词
    const keywords: string[] = [];
    responsibilities.forEach((resp) => {
      keywords.push(...resp.keywords);
    });

    // 去重并取前10个关键词
    const uniqueKeywords = Array.from(new Set(keywords)).slice(0, 10);

    // 生成亮点
    const highlights: string[] = [];

    if (workTypes.length > 0) {
      const mainWorkType = workTypes[0];
      highlights.push(`${mainWorkType.type}占比${mainWorkType.percentage}%`);
    }

    if (analysis.techStackAnalysis) {
      highlights.push(
        `技术现代化评分：${analysis.techStackAnalysis.modernization}/10`
      );
    }

    if (analysis.growthAssessment) {
      highlights.push(
        `成长潜力评分：${analysis.growthAssessment.growthPotential}/10`
      );
    }

    return {
      overview,
      keywords: uniqueKeywords,
      highlights,
    };
  }

  // 辅助方法：映射枚举值
  private mapResponsibilityCategory(category: string): ResponsibilityCategory {
    switch (category.toLowerCase()) {
      case 'core':
        return ResponsibilityCategory.CORE;
      case 'support':
        return ResponsibilityCategory.SUPPORT;
      case 'occasional':
        return ResponsibilityCategory.OCCASIONAL;
      default:
        return ResponsibilityCategory.CORE;
    }
  }

  private mapImportanceLevel(importance: string): ImportanceLevel {
    switch (importance.toLowerCase()) {
      case 'high':
        return ImportanceLevel.HIGH;
      case 'medium':
        return ImportanceLevel.MEDIUM;
      case 'low':
        return ImportanceLevel.LOW;
      default:
        return ImportanceLevel.MEDIUM;
    }
  }

  private mapFrequencyLevel(frequency: string): FrequencyLevel {
    switch (frequency.toLowerCase()) {
      case 'daily':
        return FrequencyLevel.DAILY;
      case 'weekly':
        return FrequencyLevel.WEEKLY;
      case 'monthly':
        return FrequencyLevel.MONTHLY;
      case 'occasional':
        return FrequencyLevel.OCCASIONAL;
      default:
        return FrequencyLevel.WEEKLY;
    }
  }

  private mapWorkType(type: string): WorkType {
    switch (type) {
      case '开发':
        return WorkType.DEVELOPMENT;
      case '测试':
        return WorkType.TESTING;
      case '设计':
        return WorkType.DESIGN;
      case '产品管理':
        return WorkType.PRODUCT_MANAGEMENT;
      case '项目管理':
        return WorkType.PROJECT_MANAGEMENT;
      case '研发':
        return WorkType.RESEARCH;
      case '运维':
        return WorkType.OPERATIONS;
      case '数据分析':
        return WorkType.DATA_ANALYSIS;
      default:
        return WorkType.DEVELOPMENT;
    }
  }

  private mapExperienceLevel(level: string): ExperienceLevel {
    switch (level) {
      case '初级':
        return ExperienceLevel.JUNIOR;
      case '中级':
        return ExperienceLevel.INTERMEDIATE;
      case '高级':
        return ExperienceLevel.SENIOR;
      case '专家级':
        return ExperienceLevel.EXPERT;
      default:
        return ExperienceLevel.INTERMEDIATE;
    }
  }

  private mapComplexityLevel(complexity: string): ComplexityLevel {
    switch (complexity.toLowerCase()) {
      case 'low':
        return ComplexityLevel.LOW;
      case 'medium':
        return ComplexityLevel.MEDIUM;
      case 'high':
        return ComplexityLevel.HIGH;
      case 'expert':
        return ComplexityLevel.EXPERT;
      default:
        return ComplexityLevel.MEDIUM;
    }
  }

  private mapBusinessDomain(domain: string): BusinessDomain | null {
    switch (domain) {
      case '电商':
        return BusinessDomain.ECOMMERCE;
      case '金融科技':
        return BusinessDomain.FINTECH;
      case '教育':
        return BusinessDomain.EDUCATION;
      case '医疗':
        return BusinessDomain.HEALTHCARE;
      case '游戏':
        return BusinessDomain.GAMING;
      case '企业服务':
        return BusinessDomain.ENTERPRISE;
      default:
        return null;
    }
  }

  private mapCareerPath(path: string): CareerPath | null {
    switch (path) {
      case '技术专家':
        return CareerPath.TECHNICAL_EXPERT;
      case '管理路线':
        return CareerPath.MANAGEMENT;
      case '产品方向':
        return CareerPath.PRODUCT;
      case '架构师':
        return CareerPath.ARCHITECT;
      default:
        return null;
    }
  }

  private mapImpactScope(scope: string): ImpactScope {
    switch (scope) {
      case '团队级':
        return ImpactScope.TEAM;
      case '部门级':
        return ImpactScope.DEPARTMENT;
      case '公司级':
        return ImpactScope.COMPANY;
      case '行业级':
        return ImpactScope.INDUSTRY;
      default:
        return ImpactScope.TEAM;
    }
  }

  // 默认值方法
  private getDefaultTechStackAnalysis(): TechStackAnalysis {
    return {
      projectScale: {
        teamSize: '未知',
        projectDuration: '未知',
        userScale: '未知',
      },
      techComplexity: ComplexityLevel.MEDIUM,
      domain: [],
      modernization: 5,
      challenges: [],
    };
  }

  private getDefaultGrowthAssessment(): GrowthAssessment {
    return {
      learningOpportunities: 5,
      careerPath: [CareerPath.TECHNICAL_EXPERT],
      challengeLevel: 5,
      impactScope: ImpactScope.TEAM,
      growthPotential: 5,
    };
  }

  private calculateOverallConfidence(confidenceScores: number[]): number {
    const validScores = confidenceScores.filter((score) => score > 0);
    if (validScores.length === 0) return 0;

    const average =
      validScores.reduce((sum, score) => sum + score, 0) / validScores.length;
    return Math.round(average * 10) / 10;
  }
}
