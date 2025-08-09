import { AIService } from './ai.service';
import { logger } from '../utils/logger';
import {
  CompanyAnalysis,
  CompanyAnalysisRequest,
  CompanyAnalysisResponse,
  CompanyBasicInfo,
  CorporateCulture,
  BenefitsPackage,
  WorkEnvironment,
  CompanyTag,
  CompanyScore,
  CompanySize,
  Industry,
  CultureValue,
  ManagementStyle,
  WorkStyle,
  DevelopmentStage,
  CompanyNature,
  OfficeType,
  TeamAtmosphere,
  WorkIntensity,
  CommunicationStyle,
  TeamActivity,
  TagCategory,
  BasicBenefit,
  SpecialBenefit,
  CompensationStructure,
  DevelopmentBenefit,
} from '../types/company.types';
import { IAIExtractionPrompt } from '../types/parser.types';

interface CompanyKeywords {
  [key: string]: {
    keywords: string[];
    context?: string[];
    weight: number;
  };
}

export class CompanyAnalyzerService {
  private aiService: AIService;
  private readonly keywords: CompanyKeywords;
  
  constructor() {
    this.aiService = new AIService();
    this.keywords = this.initializeKeywords();
  }

  async analyzeCompany(request: CompanyAnalysisRequest): Promise<CompanyAnalysisResponse> {
    const startTime = Date.now();
    
    try {
      logger.info('开始公司分析', 'CompanyAnalyzerService', {
        company: request.companyName,
      });

      const analysis: CompanyAnalysis = {
        basicInfo: await this.extractCompanyBasics(
          request.jobDescription,
          request.companyName
        ),
        culture: await this.analyzeCorporateCulture(request.jobDescription),
        benefits: await this.extractBenefitsAndWelfare(request.jobDescription),
        workEnvironment: await this.analyzeWorkEnvironment(request.jobDescription),
        companyTags: [],
        overallScore: { total: 0, cultureScore: 0, benefitsScore: 0, environmentScore: 0, developmentScore: 0 },
        analysisMetadata: {
          analysisDate: new Date().toISOString(),
          confidence: 0,
          aiModel: request.options?.aiModel || 'deepseek-chat',
          extractionQuality: 'medium',
          processingTime: 0,
        },
      };

      // 生成公司标签
      analysis.companyTags = this.generateCompanyTags(analysis);
      
      // 计算综合评分
      analysis.overallScore = this.calculateOverallScore(analysis);
      
      // 计算整体置信度
      const confidenceSum = (analysis.basicInfo ? 0.8 : 0.3) +
                           (analysis.culture.cultureScore / 10) * 0.3 +
                           (analysis.benefits.benefitsScore / 10) * 0.2 +
                           (analysis.workEnvironment.environmentScore / 10) * 0.2;
                           
      analysis.analysisMetadata.confidence = Math.min(confidenceSum, 1.0);
      analysis.analysisMetadata.processingTime = Date.now() - startTime;
      analysis.analysisMetadata.extractionQuality = 
        analysis.analysisMetadata.confidence > 0.8 ? 'high' :
        analysis.analysisMetadata.confidence > 0.6 ? 'medium' : 'low';

      logger.info('公司分析完成', 'CompanyAnalyzerService', {
        company: request.companyName,
        confidence: analysis.analysisMetadata.confidence,
        processingTime: analysis.analysisMetadata.processingTime,
      });

      return {
        success: true,
        data: analysis,
      };

    } catch (error) {
      const errorInstance = error instanceof Error ? error : new Error(String(error));
      logger.error('公司分析失败', 'CompanyAnalyzerService', errorInstance);
      return {
        success: false,
        error: errorInstance.message,
      };
    }
  }

  private async extractCompanyBasics(
    description: string,
    companyName: string
  ): Promise<CompanyBasicInfo> {
    const prompt = this.createCompanyBasicsPrompt(companyName);
    const result = await this.aiService.extractStructuredInfo(description, prompt);

    if (!result.success || !result.data) {
      return this.generateFallbackBasicInfo(companyName);
    }

    const data = result.data;
    return {
      industry: this.mapIndustries(data.industries || []),
      size: this.determineCompanySize(description, companyName, data.size),
      stage: this.determineDevelopmentStage(description, data.stage),
      nature: this.determineCompanyNature(description, data.nature),
      founded: data.founded,
      headquarters: data.headquarters,
      employees: data.employees,
      revenue: data.revenue,
    };
  }

  private async analyzeCorporateCulture(description: string): Promise<CorporateCulture> {
    const prompt = this.createCulturePrompt();
    const result = await this.aiService.extractStructuredInfo(description, prompt);

    if (!result.success || !result.data) {
      return this.generateFallbackCulture();
    }

    const data = result.data;
    const values = this.mapCultureValues(data.values || []);
    const workStyle = this.mapWorkStyles(data.workStyle || []);
    
    return {
      values,
      workStyle,
      management: this.determineManagementStyle(description),
      mission: data.mission,
      vision: data.vision,
      cultureScore: this.calculateCultureScore(values, workStyle, data.evidence || []),
      evidence: data.evidence || [],
    };
  }

  private async extractBenefitsAndWelfare(description: string): Promise<BenefitsPackage> {
    const prompt = this.createBenefitsPrompt();
    const result = await this.aiService.extractStructuredInfo(description, prompt);

    if (!result.success || !result.data) {
      return this.generateFallbackBenefits();
    }

    const data = result.data;
    const basicBenefits = this.mapBasicBenefits(data.basicBenefits || []);
    const specialBenefits = this.mapSpecialBenefits(data.specialBenefits || []);
    const developmentBenefits = this.mapDevelopmentBenefits(data.developmentBenefits || []);
    
    return {
      basicBenefits,
      specialBenefits,
      compensation: data.compensation || {},
      developmentBenefits,
      benefitsScore: this.calculateBenefitsScore(basicBenefits, specialBenefits, developmentBenefits),
    };
  }

  private async analyzeWorkEnvironment(description: string): Promise<WorkEnvironment> {
    const prompt = this.createEnvironmentPrompt();
    const result = await this.aiService.extractStructuredInfo(description, prompt);

    if (!result.success || !result.data) {
      return this.generateFallbackEnvironment();
    }

    const data = result.data;
    const teamAtmosphere = this.mapTeamAtmosphere(data.atmosphere || []);
    const teamActivities = this.mapTeamActivities(data.activities || []);
    
    return {
      officeSetup: this.determineOfficeType(description),
      teamAtmosphere,
      workIntensity: this.determineWorkIntensity(description),
      communication: this.determineCommunicationStyle(description),
      teamActivities,
      environmentScore: this.calculateEnvironmentScore(teamAtmosphere, data.workIntensity),
    };
  }

  private generateCompanyTags(analysis: CompanyAnalysis): CompanyTag[] {
    const tags: CompanyTag[] = [];

    // 规模标签
    if (analysis.basicInfo.size) {
      tags.push(this.createTag(analysis.basicInfo.size, TagCategory.SIZE, 0.9, 0.9));
    }

    // 行业标签
    analysis.basicInfo.industry.forEach(industry => {
      tags.push(this.createTag(industry, TagCategory.INDUSTRY, 0.8, 0.8));
    });

    // 文化标签
    analysis.culture.values.slice(0, 3).forEach((value, index) => {
      const weight = 0.9 - (index * 0.1);
      tags.push(this.createTag(value, TagCategory.CULTURE, weight, 0.8));
    });

    // 发展阶段标签
    if (analysis.basicInfo.stage) {
      tags.push(this.createTag(analysis.basicInfo.stage, TagCategory.STAGE, 0.7, 0.7));
    }

    // 工作环境标签
    analysis.workEnvironment.teamAtmosphere.slice(0, 2).forEach(atmosphere => {
      tags.push(this.createTag(atmosphere, TagCategory.ENVIRONMENT, 0.6, 0.7));
    });

    return tags.sort((a, b) => b.weight - a.weight);
  }

  private createTag(name: string, category: TagCategory, weight: number, confidence: number): CompanyTag {
    const colors: Record<TagCategory, string> = {
      [TagCategory.SIZE]: '#3B82F6',
      [TagCategory.INDUSTRY]: '#10B981',
      [TagCategory.CULTURE]: '#8B5CF6',
      [TagCategory.STAGE]: '#F59E0B',
      [TagCategory.ENVIRONMENT]: '#EF4444',
      [TagCategory.BENEFITS]: '#06B6D4',
      [TagCategory.DEVELOPMENT]: '#84CC16',
      [TagCategory.NATURE]: '#6B7280',
    };

    return {
      name,
      category,
      weight,
      confidence,
      source: 'AI分析',
      color: colors[category] || '#6B7280',
    };
  }

  private calculateOverallScore(analysis: CompanyAnalysis): CompanyScore {
    const weights = {
      culture: 0.3,
      benefits: 0.25,
      environment: 0.25,
      development: 0.2,
    };

    const developmentScore = this.calculateDevelopmentScore(analysis.basicInfo, analysis.benefits);
    
    const total = 
      analysis.culture.cultureScore * weights.culture +
      analysis.benefits.benefitsScore * weights.benefits +
      analysis.workEnvironment.environmentScore * weights.environment +
      developmentScore * weights.development;

    return {
      total: Math.round(total * 10) / 10,
      cultureScore: analysis.culture.cultureScore,
      benefitsScore: analysis.benefits.benefitsScore,
      environmentScore: analysis.workEnvironment.environmentScore,
      developmentScore,
    };
  }

  // AI 提示词创建方法
  private createCompanyBasicsPrompt(companyName: string): IAIExtractionPrompt {
    return {
      systemPrompt: `你是一个专业的公司信息分析专家。从岗位描述中提取公司基本信息。

要求：
1. 识别公司所属行业（可多个）
2. 判断公司规模（初创、小型、中型、大型、上市等）
3. 确定发展阶段（种子期、成长期、成熟期等）
4. 识别企业性质（民企、外企、国企等）
5. 提取成立时间、总部地点等信息（如果有）

返回JSON格式，包含confidence字段（0-1之间的置信度）。`,
      userPrompt: `请从以下岗位描述中提取公司基本信息：

公司名称：${companyName}
岗位描述：{{DESCRIPTION}}

请返回JSON格式：
{
  "industries": ["互联网", "金融科技"],
  "size": "大型企业",
  "stage": "成熟期", 
  "nature": "民营企业",
  "founded": 2010,
  "headquarters": "北京",
  "employees": "1000-5000人",
  "revenue": "10亿以上",
  "confidence": 0.85
}`,
      expectedFormat: {
        industries: 'array',
        size: 'string',
        stage: 'string', 
        nature: 'string',
        founded: 'number',
        headquarters: 'string',
        employees: 'string',
        revenue: 'string',
        confidence: 'number',
      },
    };
  }

  private createCulturePrompt(): IAIExtractionPrompt {
    return {
      systemPrompt: `你是一个专业的企业文化分析专家。从岗位描述中提取企业文化相关信息。

要求：
1. 识别核心价值观（创新、协作、客户导向等）
2. 分析工作风格（灵活、远程友好、快节奏等）
3. 提取企业使命和愿景（如果有明确描述）
4. 找出文化相关的原文证据

返回JSON格式，包含confidence字段。`,
      userPrompt: `请从以下岗位描述中分析企业文化：

{{DESCRIPTION}}

请返回JSON格式：
{
  "values": ["创新", "协作", "客户导向"],
  "workStyle": ["灵活工作", "快节奏"],
  "mission": "企业使命描述",
  "vision": "企业愿景描述",
  "evidence": ["原文证据1", "原文证据2"],
  "confidence": 0.8
}`,
      expectedFormat: {
        values: 'array',
        workStyle: 'array', 
        mission: 'string',
        vision: 'string',
        evidence: 'array',
        confidence: 'number',
      },
    };
  }

  private createBenefitsPrompt(): IAIExtractionPrompt {
    return {
      systemPrompt: `你是一个专业的福利待遇分析专家。从岗位描述中提取福利待遇信息。

要求：
1. 识别基础福利（五险一金、带薪年假等）
2. 识别特色福利（股权激励、健身房等）
3. 分析薪酬结构（基本工资、绩效奖金等）
4. 提取发展福利（培训、学历提升等）

返回JSON格式，包含confidence字段。`,
      userPrompt: `请从以下岗位描述中提取福利待遇信息：

{{DESCRIPTION}}

请返回JSON格式：
{
  "basicBenefits": ["五险一金", "带薪年假"],
  "specialBenefits": ["股权激励", "健身房"],
  "compensation": {
    "baseSalary": "基本工资描述",
    "performance": "绩效奖金描述",
    "bonus": "年终奖描述"
  },
  "developmentBenefits": ["培训基金", "技能认证"],
  "confidence": 0.75
}`,
      expectedFormat: {
        basicBenefits: 'array',
        specialBenefits: 'array',
        compensation: 'object',
        developmentBenefits: 'array',
        confidence: 'number',
      },
    };
  }

  private createEnvironmentPrompt(): IAIExtractionPrompt {
    return {
      systemPrompt: `你是一个专业的工作环境分析专家。从岗位描述中分析工作环境相关信息。

要求：
1. 识别办公环境类型（开放式、独立办公室等）
2. 分析团队氛围（年轻化、多元化等）
3. 判断工作强度（正常工时、弹性工作等）
4. 识别沟通文化（开放沟通、层级汇报等）
5. 提取团队活动信息（团建、培训等）

返回JSON格式，包含confidence字段。`,
      userPrompt: `请从以下岗位描述中分析工作环境：

{{DESCRIPTION}}

请返回JSON格式：
{
  "officeType": "开放式办公",
  "atmosphere": ["年轻化", "专业化"],
  "workIntensity": "适中",
  "communication": "开放沟通",
  "activities": ["团建活动", "培训活动"],
  "confidence": 0.7
}`,
      expectedFormat: {
        officeType: 'string',
        atmosphere: 'array',
        workIntensity: 'string',
        communication: 'string', 
        activities: 'array',
        confidence: 'number',
      },
    };
  }

  // 映射和转换方法
  private mapIndustries(industries: string[]): Industry[] {
    const industryMap: Record<string, Industry> = {
      '互联网': Industry.INTERNET,
      '金融科技': Industry.FINTECH,
      '电子商务': Industry.ECOMMERCE,
      '教育培训': Industry.EDUCATION,
      '医疗健康': Industry.HEALTHCARE,
      '游戏娱乐': Industry.GAMING,
      '制造业': Industry.MANUFACTURING,
      '咨询服务': Industry.CONSULTING,
      '人工智能': Industry.AI_ML,
      '区块链': Industry.BLOCKCHAIN,
    };

    return industries
      .map(industry => industryMap[industry])
      .filter((industry): industry is Industry => industry !== undefined);
  }

  private mapCultureValues(values: string[]): CultureValue[] {
    const valueMap: Record<string, CultureValue> = {
      '创新': CultureValue.INNOVATION,
      '协作': CultureValue.COLLABORATION,
      '客户导向': CultureValue.CUSTOMER_FOCUS,
      '结果导向': CultureValue.RESULTS_DRIVEN,
      '诚信': CultureValue.INTEGRITY,
      '学习成长': CultureValue.LEARNING,
      '多元化': CultureValue.DIVERSITY,
      '工作生活平衡': CultureValue.WORK_LIFE_BALANCE,
    };

    return values
      .map(value => valueMap[value])
      .filter((value): value is CultureValue => value !== undefined);
  }

  private mapWorkStyles(styles: string[]): WorkStyle[] {
    const styleMap: Record<string, WorkStyle> = {
      '灵活工作': WorkStyle.FLEXIBLE,
      '远程友好': WorkStyle.REMOTE_FRIENDLY,
      '快节奏': WorkStyle.FAST_PACED,
      '协作式': WorkStyle.COLLABORATIVE,
      '自主性强': WorkStyle.AUTONOMOUS,
    };

    return styles
      .map(style => styleMap[style])
      .filter((style): style is WorkStyle => style !== undefined);
  }

  private mapBasicBenefits(benefits: string[]): BasicBenefit[] {
    return benefits.map(benefit => ({
      name: benefit,
      category: this.categorizeBenefit(benefit) as 'insurance' | 'leave' | 'allowance' | 'welfare',
    }));
  }

  private mapSpecialBenefits(benefits: string[]): SpecialBenefit[] {
    return benefits.map(benefit => ({
      name: benefit,
      category: this.categorizeSpecialBenefit(benefit) as 'equity' | 'development' | 'lifestyle' | 'health',
    }));
  }

  private mapDevelopmentBenefits(benefits: string[]): DevelopmentBenefit[] {
    return benefits.map(benefit => ({
      name: benefit,
      category: this.categorizeDevelopmentBenefit(benefit) as 'training' | 'education' | 'certification' | 'conference',
    }));
  }

  private mapTeamAtmosphere(atmosphere: string[]): TeamAtmosphere[] {
    const atmosphereMap: Record<string, TeamAtmosphere> = {
      '年轻化': TeamAtmosphere.YOUTHFUL,
      '多元化': TeamAtmosphere.DIVERSE,
      '国际化': TeamAtmosphere.INTERNATIONAL,
      '专业化': TeamAtmosphere.PROFESSIONAL,
      '创新型': TeamAtmosphere.INNOVATIVE,
      '友好型': TeamAtmosphere.FRIENDLY,
    };

    return atmosphere
      .map(atm => atmosphereMap[atm])
      .filter((atm): atm is TeamAtmosphere => atm !== undefined);
  }

  private mapTeamActivities(activities: string[]): TeamActivity[] {
    const activityMap: Record<string, TeamActivity> = {
      '团建活动': TeamActivity.TEAM_BUILDING,
      '聚餐活动': TeamActivity.DINING,
      '培训活动': TeamActivity.TRAINING,
      '体育活动': TeamActivity.SPORTS,
      '文化活动': TeamActivity.CULTURAL,
    };

    return activities
      .map(activity => activityMap[activity])
      .filter((activity): activity is TeamActivity => activity !== undefined);
  }

  // 工具方法
  private determineCompanySize(description: string, companyName: string, aiSuggestion?: string): CompanySize {
    const sizeKeywords = {
      [CompanySize.STARTUP]: ['初创', '创业', '种子轮', 'A轮', '天使轮'],
      [CompanySize.SMALL]: ['小型', '50人以下', '团队精干'],
      [CompanySize.MEDIUM]: ['中型', '100-500人', '快速发展'],
      [CompanySize.LARGE]: ['大型', '500人以上', '行业领先'],
      [CompanySize.PUBLIC]: ['上市', '公开交易', '股票代码', 'IPO'],
      [CompanySize.UNICORN]: ['独角兽', '估值10亿', '头部企业'],
    };

    // 优先使用AI建议
    if (aiSuggestion) {
      for (const [size, keywords] of Object.entries(sizeKeywords)) {
        if (keywords.some(keyword => aiSuggestion.includes(keyword))) {
          return size as CompanySize;
        }
      }
    }

    // 关键词匹配
    for (const [size, keywords] of Object.entries(sizeKeywords)) {
      if (keywords.some(keyword => description.includes(keyword))) {
        return size as CompanySize;
      }
    }

    return CompanySize.MEDIUM; // 默认值
  }

  private determineDevelopmentStage(description: string, aiSuggestion?: string): DevelopmentStage {
    const stageKeywords = {
      [DevelopmentStage.SEED]: ['种子期', '天使轮', '早期'],
      [DevelopmentStage.STARTUP]: ['初创期', 'A轮', 'B轮'],
      [DevelopmentStage.GROWTH]: ['成长期', '快速发展', '扩张'],
      [DevelopmentStage.MATURE]: ['成熟期', '稳定发展', '行业领先'],
      [DevelopmentStage.TRANSFORMATION]: ['转型期', '业务转型', '数字化转型'],
    };

    if (aiSuggestion) {
      for (const [stage, keywords] of Object.entries(stageKeywords)) {
        if (keywords.some(keyword => aiSuggestion.includes(keyword))) {
          return stage as DevelopmentStage;
        }
      }
    }

    for (const [stage, keywords] of Object.entries(stageKeywords)) {
      if (keywords.some(keyword => description.includes(keyword))) {
        return stage as DevelopmentStage;
      }
    }

    return DevelopmentStage.GROWTH; // 默认值
  }

  private determineCompanyNature(description: string, aiSuggestion?: string): CompanyNature {
    const natureKeywords = {
      [CompanyNature.FOREIGN]: ['外资', '外企', '跨国公司'],
      [CompanyNature.STATE_OWNED]: ['国企', '国有', '央企'],
      [CompanyNature.LISTED]: ['上市公司', '公开交易'],
      [CompanyNature.PRIVATE]: ['民营', '私企'],
    };

    if (aiSuggestion) {
      for (const [nature, keywords] of Object.entries(natureKeywords)) {
        if (keywords.some(keyword => aiSuggestion.includes(keyword))) {
          return nature as CompanyNature;
        }
      }
    }

    for (const [nature, keywords] of Object.entries(natureKeywords)) {
      if (keywords.some(keyword => description.includes(keyword))) {
        return nature as CompanyNature;
      }
    }

    return CompanyNature.PRIVATE; // 默认值
  }

  private determineManagementStyle(description: string): ManagementStyle {
    const styleKeywords = {
      [ManagementStyle.FLAT]: ['扁平', '扁平化管理'],
      [ManagementStyle.AGILE]: ['敏捷', '敏捷开发', 'Scrum'],
      [ManagementStyle.HIERARCHICAL]: ['层级', '等级制'],
    };

    for (const [style, keywords] of Object.entries(styleKeywords)) {
      if (keywords.some(keyword => description.includes(keyword))) {
        return style as ManagementStyle;
      }
    }

    return ManagementStyle.FLAT; // 默认值
  }

  private determineOfficeType(description: string): OfficeType {
    if (description.includes('远程') || description.includes('在家')) return OfficeType.REMOTE_WORK;
    if (description.includes('混合') || description.includes('弹性')) return OfficeType.HYBRID_OFFICE;
    if (description.includes('开放式')) return OfficeType.OPEN_OFFICE;
    return OfficeType.OPEN_OFFICE; // 默认值
  }

  private determineWorkIntensity(description: string): WorkIntensity {
    if (description.includes('996')) return WorkIntensity.NINE_NINE_SIX;
    if (description.includes('高压') || description.includes('快节奏')) return WorkIntensity.HIGH_PRESSURE;
    if (description.includes('适中') || description.includes('正常')) return WorkIntensity.MODERATE;
    if (description.includes('弹性') || description.includes('灵活')) return WorkIntensity.FLEXIBLE;
    return WorkIntensity.MODERATE; // 默认值
  }

  private determineCommunicationStyle(description: string): CommunicationStyle {
    if (description.includes('开放沟通') || description.includes('透明')) return CommunicationStyle.OPEN_COMMUNICATION;
    if (description.includes('跨部门')) return CommunicationStyle.CROSS_DEPARTMENT;
    return CommunicationStyle.OPEN_COMMUNICATION; // 默认值
  }

  // 评分计算方法
  private calculateCultureScore(values: CultureValue[], workStyle: WorkStyle[], evidence: string[]): number {
    const baseScore = Math.min(values.length * 2 + workStyle.length * 1.5, 8);
    const evidenceBonus = Math.min(evidence.length * 0.5, 2);
    return Math.min(baseScore + evidenceBonus, 10);
  }

  private calculateBenefitsScore(
    basicBenefits: BasicBenefit[],
    specialBenefits: SpecialBenefit[],
    developmentBenefits: DevelopmentBenefit[]
  ): number {
    const basicScore = Math.min(basicBenefits.length * 1.5, 5);
    const specialScore = Math.min(specialBenefits.length * 2, 3);
    const developmentScore = Math.min(developmentBenefits.length * 1, 2);
    return Math.min(basicScore + specialScore + developmentScore, 10);
  }

  private calculateEnvironmentScore(atmosphere: TeamAtmosphere[], workIntensity?: string): number {
    const atmosphereScore = Math.min(atmosphere.length * 2, 6);
    const intensityScore = workIntensity === '适中' || workIntensity === '弹性' ? 4 : 2;
    return Math.min(atmosphereScore + intensityScore, 10);
  }

  private calculateDevelopmentScore(basicInfo: CompanyBasicInfo, benefits: BenefitsPackage): number {
    let score = 5; // 基础分

    // 公司规模加分
    if (basicInfo.size === CompanySize.UNICORN || basicInfo.size === CompanySize.PUBLIC) score += 2;
    else if (basicInfo.size === CompanySize.LARGE) score += 1;

    // 发展阶段加分
    if (basicInfo.stage === DevelopmentStage.GROWTH) score += 1.5;
    else if (basicInfo.stage === DevelopmentStage.MATURE) score += 1;

    // 发展福利加分
    score += Math.min(benefits.developmentBenefits.length * 0.5, 1.5);

    return Math.min(score, 10);
  }

  // 分类辅助方法
  private categorizeBenefit(benefit: string): string {
    if (benefit.includes('保险') || benefit.includes('社保')) return 'insurance';
    if (benefit.includes('假期') || benefit.includes('年假')) return 'leave';
    if (benefit.includes('补贴') || benefit.includes('津贴')) return 'allowance';
    return 'welfare';
  }

  private categorizeSpecialBenefit(benefit: string): string {
    if (benefit.includes('股权') || benefit.includes('期权')) return 'equity';
    if (benefit.includes('培训') || benefit.includes('学习')) return 'development';
    if (benefit.includes('健身') || benefit.includes('娱乐')) return 'lifestyle';
    if (benefit.includes('体检') || benefit.includes('医疗')) return 'health';
    return 'lifestyle';
  }

  private categorizeDevelopmentBenefit(benefit: string): string {
    if (benefit.includes('培训')) return 'training';
    if (benefit.includes('学历') || benefit.includes('学位')) return 'education';
    if (benefit.includes('认证') || benefit.includes('证书')) return 'certification';
    if (benefit.includes('会议') || benefit.includes('大会')) return 'conference';
    return 'training';
  }

  // 失败回退方法
  private generateFallbackBasicInfo(companyName: string): CompanyBasicInfo {
    return {
      industry: [Industry.INTERNET],
      size: CompanySize.MEDIUM,
      stage: DevelopmentStage.GROWTH,
      nature: CompanyNature.PRIVATE,
    };
  }

  private generateFallbackCulture(): CorporateCulture {
    return {
      values: [CultureValue.COLLABORATION, CultureValue.LEARNING],
      workStyle: [WorkStyle.COLLABORATIVE],
      management: ManagementStyle.FLAT,
      cultureScore: 6.0,
      evidence: [],
    };
  }

  private generateFallbackBenefits(): BenefitsPackage {
    return {
      basicBenefits: [
        { name: '五险一金', category: 'insurance' },
        { name: '带薪年假', category: 'leave' },
      ],
      specialBenefits: [],
      compensation: {},
      developmentBenefits: [],
      benefitsScore: 5.0,
    };
  }

  private generateFallbackEnvironment(): WorkEnvironment {
    return {
      officeSetup: OfficeType.OPEN_OFFICE,
      teamAtmosphere: [TeamAtmosphere.PROFESSIONAL],
      workIntensity: WorkIntensity.MODERATE,
      communication: CommunicationStyle.OPEN_COMMUNICATION,
      teamActivities: [],
      environmentScore: 6.0,
    };
  }

  private initializeKeywords(): CompanyKeywords {
    return {
      size_startup: {
        keywords: ['初创', '创业', '种子轮', 'A轮', '天使轮', '早期阶段'],
        weight: 1.0,
      },
      size_large: {
        keywords: ['大型', '500人以上', '行业领先', '知名企业', '头部公司'],
        weight: 1.0,
      },
      culture_innovative: {
        keywords: ['创新', '突破', '前沿', '颠覆性', '探索'],
        weight: 0.9,
      },
      culture_collaborative: {
        keywords: ['协作', '团队合作', '配合', '共同', '一起'],
        weight: 0.8,
      },
      benefits_equity: {
        keywords: ['股权激励', '期权', '股票期权', '员工持股'],
        weight: 1.0,
      },
      work_flexible: {
        keywords: ['弹性工作', '灵活办公', '远程工作', '在家办公'],
        weight: 0.9,
      },
    };
  }
}