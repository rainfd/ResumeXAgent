import { CompanyAnalyzerService } from '../company-analyzer.service';
import { 
  CompanySize, 
  Industry, 
  CultureValue, 
  WorkIntensity, 
  DevelopmentStage, 
  CompanyNature,
  WorkStyle,
  ManagementStyle,
  OfficeType,
  TeamAtmosphere,
  CommunicationStyle
} from '../../types/company.types';

// Mock AIService
jest.mock('../ai.service', () => ({
  AIService: jest.fn().mockImplementation(() => ({
    extractStructuredInfo: jest.fn(),
  })),
}));

describe('CompanyAnalyzerService', () => {
  let service: CompanyAnalyzerService;
  let mockAIService: any;

  beforeEach(() => {
    service = new CompanyAnalyzerService();
    mockAIService = (service as any).aiService;
    jest.clearAllMocks();
  });

  describe('analyzeCompany', () => {
    it('应该成功分析公司信息', async () => {
      // 模拟AI服务响应
      mockAIService.extractStructuredInfo
        .mockResolvedValueOnce({
          // 基本信息响应
          success: true,
          data: {
            industries: ['互联网', '人工智能'],
            size: '大型企业',
            stage: '成熟期',
            nature: '民营企业',
            founded: 2015,
            headquarters: '北京',
            employees: '1000-5000人',
            confidence: 0.9,
          },
        })
        .mockResolvedValueOnce({
          // 企业文化响应
          success: true,
          data: {
            values: ['创新', '协作', '客户导向'],
            workStyle: ['灵活工作', '快节奏'],
            mission: '用技术改变世界',
            vision: '成为行业领先企业',
            evidence: ['公司重视创新文化', '团队协作氛围良好'],
            confidence: 0.8,
          },
        })
        .mockResolvedValueOnce({
          // 福利待遇响应
          success: true,
          data: {
            basicBenefits: ['五险一金', '带薪年假'],
            specialBenefits: ['股权激励', '健身房'],
            compensation: {
              baseSalary: '15K-25K',
              performance: '季度绩效奖金',
              bonus: '年终双薪',
            },
            developmentBenefits: ['培训基金', '技能认证'],
            confidence: 0.75,
          },
        })
        .mockResolvedValueOnce({
          // 工作环境响应
          success: true,
          data: {
            officeType: '开放式办公',
            atmosphere: ['年轻化', '专业化'],
            workIntensity: '适中',
            communication: '开放沟通',
            activities: ['团建活动', '培训活动'],
            confidence: 0.7,
          },
        });

      const request = {
        jobDescription: `
          腾讯是一家领先的互联网公司，致力于用技术改变世界。
          我们提供五险一金、股权激励等福利，工作环境年轻化，注重创新和协作。
          团队规模1000-5000人，采用开放式办公，定期组织团建活动。
          工作时间灵活，鼓励员工学习成长。
        `,
        companyName: '腾讯科技',
      };

      const result = await service.analyzeCompany(request);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      if (result.data) {
        expect(result.data.basicInfo.industry).toContain(Industry.INTERNET);
        expect(result.data.basicInfo.industry).toContain(Industry.AI_ML);
        expect(result.data.basicInfo.size).toBe(CompanySize.LARGE);
        expect(result.data.basicInfo.stage).toBe(DevelopmentStage.MATURE);
        expect(result.data.basicInfo.nature).toBe(CompanyNature.PRIVATE);
        
        expect(result.data.culture.values).toContain(CultureValue.INNOVATION);
        expect(result.data.culture.values).toContain(CultureValue.COLLABORATION);
        expect(result.data.culture.values).toContain(CultureValue.CUSTOMER_FOCUS);
        
        expect(result.data.benefits.basicBenefits).toHaveLength(2);
        expect(result.data.benefits.specialBenefits).toHaveLength(2);
        expect(result.data.benefits.developmentBenefits).toHaveLength(2);
        
        expect(result.data.workEnvironment.workIntensity).toBe(WorkIntensity.FLEXIBLE);
        expect(result.data.workEnvironment.teamAtmosphere).toHaveLength(2);
        
        expect(result.data.companyTags.length).toBeGreaterThan(0);
        expect(result.data.overallScore.total).toBeGreaterThan(0);
        expect(result.data.analysisMetadata.confidence).toBeGreaterThan(0);
      }
    });

    it('应该处理AI服务失败的情况', async () => {
      // 模拟AI服务失败
      mockAIService.extractStructuredInfo.mockResolvedValue({
        success: false,
        data: null,
        errors: ['API调用失败'],
      });

      const request = {
        jobDescription: '简单的岗位描述',
        companyName: '测试公司',
      };

      const result = await service.analyzeCompany(request);

      expect(result.success).toBe(true); // 应该使用回退数据
      expect(result.data).toBeDefined();
      
      if (result.data) {
        // 检查回退数据
        expect(result.data.basicInfo.industry).toContain(Industry.INTERNET);
        expect(result.data.basicInfo.size).toBe(CompanySize.MEDIUM);
        expect(result.data.culture.values).toContain(CultureValue.COLLABORATION);
      }
    });

    it('应该处理服务异常', async () => {
      // 模拟AI服务抛出异常
      mockAIService.extractStructuredInfo.mockRejectedValue(
        new Error('网络连接失败')
      );

      const request = {
        jobDescription: '岗位描述',
        companyName: '测试公司',
      };

      const result = await service.analyzeCompany(request);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('公司规模判断', () => {
    it('应该正确识别初创公司', () => {
      const description = '我们是一家初创公司，刚完成A轮融资，团队精干有活力';
      const size = (service as any).determineCompanySize(description, '测试公司', '初创公司');
      expect(size).toBe(CompanySize.STARTUP);
    });

    it('应该正确识别大型公司', () => {
      const description = '我们是行业领先的大型企业，员工超过5000人';
      const size = (service as any).determineCompanySize(description, '测试公司', '大型企业');
      expect(size).toBe(CompanySize.LARGE);
    });

    it('应该正确识别上市公司', () => {
      const description = '我们是一家上市公司，股票代码000001';
      const size = (service as any).determineCompanySize(description, '测试公司', '上市公司');
      expect(size).toBe(CompanySize.PUBLIC);
    });

    it('应该使用默认值处理无法识别的情况', () => {
      const description = '普通的公司描述，无特殊关键词';
      const size = (service as any).determineCompanySize(description, '测试公司');
      expect(size).toBe(CompanySize.MEDIUM);
    });
  });

  describe('行业映射', () => {
    it('应该正确映射行业类型', () => {
      const industries = (service as any).mapIndustries(['互联网', '金融科技', '人工智能', '未知行业']);
      expect(industries).toContain(Industry.INTERNET);
      expect(industries).toContain(Industry.FINTECH);
      expect(industries).toContain(Industry.AI_ML);
      expect(industries).toHaveLength(3); // 未知行业应该被过滤掉
    });

    it('应该处理空数组', () => {
      const industries = (service as any).mapIndustries([]);
      expect(industries).toHaveLength(0);
    });
  });

  describe('文化价值观映射', () => {
    it('应该正确映射文化价值观', () => {
      const values = (service as any).mapCultureValues(['创新', '协作', '诚信', '未知价值观']);
      expect(values).toContain(CultureValue.INNOVATION);
      expect(values).toContain(CultureValue.COLLABORATION);
      expect(values).toContain(CultureValue.INTEGRITY);
      expect(values).toHaveLength(3); // 未知价值观应该被过滤掉
    });
  });

  describe('评分计算', () => {
    it('应该正确计算文化评分', () => {
      const values = [CultureValue.INNOVATION, CultureValue.COLLABORATION];
      const workStyle = [WorkStyle.FLEXIBLE];
      const evidence = ['证据1', '证据2'];
      
      const score = (service as any).calculateCultureScore(values, workStyle, evidence);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(10);
    });

    it('应该正确计算福利评分', () => {
      const basicBenefits = [
        { name: '五险一金', category: 'insurance' },
        { name: '带薪年假', category: 'leave' },
      ];
      const specialBenefits = [
        { name: '股权激励', category: 'equity' },
      ];
      const developmentBenefits = [
        { name: '培训基金', category: 'training' },
      ];
      
      const score = (service as any).calculateBenefitsScore(
        basicBenefits,
        specialBenefits,
        developmentBenefits
      );
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(10);
    });

    it('应该正确计算环境评分', () => {
      const atmosphere = [TeamAtmosphere.YOUTHFUL, TeamAtmosphere.PROFESSIONAL];
      const workIntensity = '适中';
      
      const score = (service as any).calculateEnvironmentScore(atmosphere, workIntensity);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(10);
    });
  });

  describe('标签生成', () => {
    it('应该生成合适的公司标签', () => {
      const mockAnalysis = {
        basicInfo: {
          industry: [Industry.INTERNET, Industry.AI_ML],
          size: CompanySize.LARGE,
          stage: DevelopmentStage.GROWTH,
          nature: CompanyNature.PRIVATE,
        },
        culture: {
          values: [CultureValue.INNOVATION, CultureValue.COLLABORATION],
          workStyle: [WorkStyle.FLEXIBLE],
          management: ManagementStyle.FLAT,
          cultureScore: 8.5,
          evidence: [],
        },
        benefits: {
          basicBenefits: [],
          specialBenefits: [],
          compensation: {},
          developmentBenefits: [],
          benefitsScore: 7.0,
        },
        workEnvironment: {
          officeSetup: OfficeType.OPEN_OFFICE,
          teamAtmosphere: [TeamAtmosphere.YOUTHFUL],
          workIntensity: WorkIntensity.MODERATE,
          communication: CommunicationStyle.OPEN_COMMUNICATION,
          teamActivities: [],
          environmentScore: 8.0,
        },
        companyTags: [],
        overallScore: {
          total: 0,
          cultureScore: 0,
          benefitsScore: 0,
          environmentScore: 0,
          developmentScore: 0,
        },
        analysisMetadata: {
          analysisDate: new Date().toISOString(),
          confidence: 0.8,
          aiModel: 'test',
          extractionQuality: 'high' as const,
        },
      };

      const tags = (service as any).generateCompanyTags(mockAnalysis);
      expect(tags.length).toBeGreaterThan(0);
      expect(tags.some((tag: any) => tag.name === CompanySize.LARGE)).toBe(true);
      expect(tags.some((tag: any) => tag.name === Industry.INTERNET)).toBe(true);
      expect(tags.some((tag: any) => tag.name === CultureValue.INNOVATION)).toBe(true);
      
      // 标签应该按权重排序
      for (let i = 0; i < tags.length - 1; i++) {
        expect(tags[i].weight).toBeGreaterThanOrEqual(tags[i + 1].weight);
      }
    });
  });

  describe('回退数据生成', () => {
    it('应该生成有效的回退基本信息', () => {
      const fallback = (service as any).generateFallbackBasicInfo('测试公司');
      expect(fallback.industry).toContain(Industry.INTERNET);
      expect(fallback.size).toBe(CompanySize.MEDIUM);
      expect(fallback.stage).toBe(DevelopmentStage.GROWTH);
      expect(fallback.nature).toBe(CompanyNature.PRIVATE);
    });

    it('应该生成有效的回退文化信息', () => {
      const fallback = (service as any).generateFallbackCulture();
      expect(fallback.values).toContain(CultureValue.COLLABORATION);
      expect(fallback.values).toContain(CultureValue.LEARNING);
      expect(fallback.cultureScore).toBe(6.0);
    });

    it('应该生成有效的回退福利信息', () => {
      const fallback = (service as any).generateFallbackBenefits();
      expect(fallback.basicBenefits).toHaveLength(2);
      expect(fallback.benefitsScore).toBe(5.0);
    });

    it('应该生成有效的回退环境信息', () => {
      const fallback = (service as any).generateFallbackEnvironment();
      expect(fallback.teamAtmosphere).toContain(TeamAtmosphere.PROFESSIONAL);
      expect(fallback.workIntensity).toBe(WorkIntensity.MODERATE);
      expect(fallback.environmentScore).toBe(6.0);
    });
  });
});