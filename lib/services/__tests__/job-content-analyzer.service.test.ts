import { JobContentAnalyzerService } from '../job-content-analyzer.service';
import {
  ResponsibilityCategory,
  ImportanceLevel,
  FrequencyLevel,
  WorkType,
  ExperienceLevel,
  ComplexityLevel,
  BusinessDomain,
  CareerPath,
  ImpactScope,
} from '../../types/job.types';

// Mock AIService
jest.mock('../ai.service', () => ({
  AIService: jest.fn().mockImplementation(() => ({
    extractStructuredInfo: jest
      .fn()
      .mockImplementation((description, prompt, model) => {
        // 处理空描述的情况
        if (!description || description.trim() === '') {
          return Promise.resolve({
            success: false,
            data: null,
          });
        }

        // 根据提示词类型返回不同的模拟数据
        if (prompt.systemPrompt.includes('工作职责分析')) {
          return Promise.resolve({
            success: true,
            data: {
              responsibilities: [
                {
                  description: '开发和维护前端应用',
                  importance: 'high',
                  frequency: 'daily',
                  category: 'core',
                  keywords: ['开发', '维护', '前端'],
                },
                {
                  description: '参与代码评审',
                  importance: 'medium',
                  frequency: 'weekly',
                  category: 'support',
                  keywords: ['代码评审', '质量控制'],
                },
              ],
              confidence: 0.9,
            },
          });
        }

        if (prompt.systemPrompt.includes('工作类型分类')) {
          return Promise.resolve({
            success: true,
            data: {
              workTypes: [
                {
                  type: '开发',
                  percentage: 70,
                  description: '主要负责系统开发和功能实现',
                  level: '中级',
                },
                {
                  type: '测试',
                  percentage: 20,
                  description: '单元测试和集成测试',
                  level: '初级',
                },
                {
                  type: '设计',
                  percentage: 10,
                  description: 'UI/UX设计协作',
                  level: '初级',
                },
              ],
              confidence: 0.85,
            },
          });
        }

        if (prompt.systemPrompt.includes('技术栈和项目分析')) {
          return Promise.resolve({
            success: true,
            data: {
              projectScale: {
                teamSize: '5-10人',
                projectDuration: '3-6个月',
                userScale: '万级用户',
              },
              techComplexity: 'medium',
              domain: ['电商', '企业服务'],
              modernization: 7,
              challenges: [
                {
                  type: '性能优化',
                  description: '处理高并发请求',
                  complexity: 'high',
                },
              ],
              confidence: 0.8,
            },
          });
        }

        if (prompt.systemPrompt.includes('协作关系分析')) {
          return Promise.resolve({
            success: true,
            data: {
              collaborations: [
                {
                  department: '产品',
                  frequency: 'weekly',
                  depth: '紧密合作',
                  requirements: ['需求评审', '产品规划'],
                },
                {
                  department: '设计',
                  frequency: 'daily',
                  depth: '日常协作',
                  requirements: ['UI还原', '交互确认'],
                },
              ],
              confidence: 0.75,
            },
          });
        }

        if (prompt.systemPrompt.includes('成长潜力评估')) {
          return Promise.resolve({
            success: true,
            data: {
              learningOpportunities: 8,
              careerPath: ['技术专家', '架构师'],
              challengeLevel: 7,
              impactScope: '部门级',
              growthPotential: 8,
              confidence: 0.8,
            },
          });
        }

        // 默认返回空结果
        return Promise.resolve({
          success: false,
          data: null,
        });
      }),
  })),
}));

describe('JobContentAnalyzerService', () => {
  let analyzer: JobContentAnalyzerService;

  beforeEach(() => {
    analyzer = new JobContentAnalyzerService();
  });

  describe('analyzeJobContent', () => {
    test('应该完整分析岗位工作内容', async () => {
      const jobDescription = `
        招聘前端开发工程师，主要职责：
        1. 负责公司电商平台前端开发工作
        2. 参与产品需求评审和技术方案设计
        3. 编写高质量的前端代码，确保用户体验
        4. 配合测试团队进行功能测试和bug修复
        5. 与产品经理、设计师紧密协作
        6. 持续学习新技术，提升技术能力
        
        技术栈：React、TypeScript、Node.js
        团队规模：5-10人
        项目周期：3-6个月
        用户规模：万级用户
      `;

      const jobTitle = '前端开发工程师';

      const result = await analyzer.analyzeJobContent(jobDescription, jobTitle);

      // 验证基本结构
      expect(result).toHaveProperty('responsibilities');
      expect(result).toHaveProperty('workTypes');
      expect(result).toHaveProperty('techStackAnalysis');
      expect(result).toHaveProperty('collaborationRequirements');
      expect(result).toHaveProperty('growthAssessment');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('analysisDate');
      expect(result).toHaveProperty('confidenceScore');

      // 验证职责分析
      expect(result.responsibilities).toHaveLength(2);
      expect(result.responsibilities[0].description).toBe('开发和维护前端应用');
      expect(result.responsibilities[0].category).toBe(
        ResponsibilityCategory.CORE
      );
      expect(result.responsibilities[0].importance).toBe(ImportanceLevel.HIGH);
      expect(result.responsibilities[0].frequency).toBe(FrequencyLevel.DAILY);
      expect(result.responsibilities[0].keywords).toEqual([
        '开发',
        '维护',
        '前端',
      ]);

      // 验证工作类型分析
      expect(result.workTypes).toHaveLength(3);
      expect(result.workTypes[0].type).toBe(WorkType.DEVELOPMENT);
      expect(result.workTypes[0].percentage).toBe(70);
      expect(result.workTypes[0].level).toBe(ExperienceLevel.INTERMEDIATE);

      // 验证技术栈分析
      expect(result.techStackAnalysis.projectScale.teamSize).toBe('5-10人');
      expect(result.techStackAnalysis.techComplexity).toBe(
        ComplexityLevel.MEDIUM
      );
      expect(result.techStackAnalysis.domain).toContain(
        BusinessDomain.ECOMMERCE
      );
      expect(result.techStackAnalysis.modernization).toBe(7);
      expect(result.techStackAnalysis.challenges).toHaveLength(1);

      // 验证协作分析
      expect(result.collaborationRequirements).toHaveLength(2);
      expect(result.collaborationRequirements[0].department).toBe('产品');
      expect(result.collaborationRequirements[0].frequency).toBe(
        FrequencyLevel.WEEKLY
      );

      // 验证成长评估
      expect(result.growthAssessment.learningOpportunities).toBe(8);
      expect(result.growthAssessment.careerPath).toContain(
        CareerPath.TECHNICAL_EXPERT
      );
      expect(result.growthAssessment.challengeLevel).toBe(7);
      expect(result.growthAssessment.impactScope).toBe(ImpactScope.DEPARTMENT);
      expect(result.growthAssessment.growthPotential).toBe(8);

      // 验证摘要
      expect(result.summary.overview).toContain('开发');
      expect(result.summary.keywords.length).toBeGreaterThan(0);
      expect(result.summary.highlights).toHaveLength(3);

      // 验证置信度
      expect(result.confidenceScore).toBeGreaterThan(0);
      expect(result.confidenceScore).toBeLessThanOrEqual(1);
    }, 10000);

    test('应该处理AI服务失败的情况', async () => {
      // Mock AI服务失败
      const mockAIService = analyzer['aiService'] as any;
      mockAIService.extractStructuredInfo = jest.fn().mockResolvedValue({
        success: false,
        data: null,
      });

      const result = await analyzer.analyzeJobContent('测试描述', '测试职位');

      // 应该返回默认值而不是抛出错误
      expect(result.responsibilities).toEqual([]);
      expect(result.workTypes).toEqual([]);
      expect(result.collaborationRequirements).toEqual([]);
      expect(result.techStackAnalysis.techComplexity).toBe(
        ComplexityLevel.MEDIUM
      );
      expect(result.growthAssessment.learningOpportunities).toBe(5);
    });

    test('应该正确计算整体置信度', async () => {
      const result = await analyzer.analyzeJobContent('测试描述', '测试职位');

      // 置信度应该在0-1之间
      expect(result.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(result.confidenceScore).toBeLessThanOrEqual(1);
    });
  });

  describe('extractResponsibilities', () => {
    test('应该正确提取工作职责', async () => {
      const description = '负责前端开发和维护工作';
      const result = await analyzer.extractResponsibilities(description);

      expect(result).toHaveLength(2);
      expect(result[0].description).toBe('开发和维护前端应用');
      expect(result[0].category).toBe(ResponsibilityCategory.CORE);
    });

    test('应该处理空描述', async () => {
      const result = await analyzer.extractResponsibilities('');
      expect(result).toEqual([]);
    });
  });

  describe('classifyWorkType', () => {
    test('应该正确分类工作类型', async () => {
      const description = '负责前端开发工作';
      const jobTitle = '前端开发工程师';
      const result = await analyzer.classifyWorkType(description, jobTitle);

      expect(result).toHaveLength(3);
      expect(result[0].type).toBe(WorkType.DEVELOPMENT);
      expect(result[0].percentage).toBe(70);
    });
  });

  describe('analyzeTechStackAndProjects', () => {
    test('应该分析技术栈和项目信息', async () => {
      const description = '使用React开发电商平台';
      const result = await analyzer.analyzeTechStackAndProjects(description);

      expect(result.projectScale.teamSize).toBe('5-10人');
      expect(result.techComplexity).toBe(ComplexityLevel.MEDIUM);
      expect(result.domain).toContain(BusinessDomain.ECOMMERCE);
      expect(result.modernization).toBe(7);
    });

    test('应该提供默认值当AI失败时', async () => {
      // Mock AI失败
      const mockAIService = analyzer['aiService'] as any;
      mockAIService.extractStructuredInfo = jest.fn().mockResolvedValue({
        success: false,
        data: null,
      });

      const result = await analyzer.analyzeTechStackAndProjects('描述');

      expect(result.projectScale.teamSize).toBe('未知');
      expect(result.techComplexity).toBe(ComplexityLevel.MEDIUM);
      expect(result.modernization).toBe(5);
    });
  });

  describe('analyzeCollaboration', () => {
    test('应该分析协作关系', async () => {
      const description = '需要与产品经理和设计师协作';
      const result = await analyzer.analyzeCollaboration(description);

      expect(result).toHaveLength(2);
      expect(result[0].department).toBe('产品');
      expect(result[0].frequency).toBe(FrequencyLevel.WEEKLY);
      expect(result[1].department).toBe('设计');
      expect(result[1].frequency).toBe(FrequencyLevel.DAILY);
    });
  });

  describe('assessGrowthPotential', () => {
    test('应该评估成长潜力', async () => {
      const description = '技术挑战性高，学习机会多';
      const result = await analyzer.assessGrowthPotential(description);

      expect(result.learningOpportunities).toBe(8);
      expect(result.careerPath).toContain(CareerPath.TECHNICAL_EXPERT);
      expect(result.challengeLevel).toBe(7);
      expect(result.impactScope).toBe(ImpactScope.DEPARTMENT);
      expect(result.growthPotential).toBe(8);
    });
  });

  describe('generateJobSummary', () => {
    test('应该生成工作内容摘要', () => {
      const analysis = {
        responsibilities: [
          {
            description: '前端开发',
            category: ResponsibilityCategory.CORE,
            importance: ImportanceLevel.HIGH,
            frequency: FrequencyLevel.DAILY,
            keywords: ['前端', '开发'],
          },
        ],
        workTypes: [
          {
            type: WorkType.DEVELOPMENT,
            percentage: 70,
            description: '开发工作',
            level: ExperienceLevel.INTERMEDIATE,
          },
        ],
        techStackAnalysis: {
          modernization: 8,
        },
        growthAssessment: {
          growthPotential: 7,
        },
      } as any;

      const result = analyzer.generateJobSummary(analysis);

      expect(result.overview).toContain('开发');
      expect(result.keywords).toContain('前端');
      expect(result.keywords).toContain('开发');
      expect(result.highlights).toContain('开发占比70%');
      expect(result.highlights).toContain('技术现代化评分：8/10');
      expect(result.highlights).toContain('成长潜力评分：7/10');
    });

    test('应该处理空数据', () => {
      const analysis = {
        responsibilities: [],
        workTypes: [],
      } as any;

      const result = analyzer.generateJobSummary(analysis);

      expect(result.overview).toBeDefined();
      expect(result.keywords).toEqual([]);
      expect(result.highlights).toHaveLength(0);
    });
  });

  describe('映射方法测试', () => {
    test('应该正确映射职责分类', () => {
      expect(analyzer['mapResponsibilityCategory']('core')).toBe(
        ResponsibilityCategory.CORE
      );
      expect(analyzer['mapResponsibilityCategory']('support')).toBe(
        ResponsibilityCategory.SUPPORT
      );
      expect(analyzer['mapResponsibilityCategory']('occasional')).toBe(
        ResponsibilityCategory.OCCASIONAL
      );
      expect(analyzer['mapResponsibilityCategory']('unknown')).toBe(
        ResponsibilityCategory.CORE
      );
    });

    test('应该正确映射重要性级别', () => {
      expect(analyzer['mapImportanceLevel']('high')).toBe(ImportanceLevel.HIGH);
      expect(analyzer['mapImportanceLevel']('medium')).toBe(
        ImportanceLevel.MEDIUM
      );
      expect(analyzer['mapImportanceLevel']('low')).toBe(ImportanceLevel.LOW);
      expect(analyzer['mapImportanceLevel']('unknown')).toBe(
        ImportanceLevel.MEDIUM
      );
    });

    test('应该正确映射工作类型', () => {
      expect(analyzer['mapWorkType']('开发')).toBe(WorkType.DEVELOPMENT);
      expect(analyzer['mapWorkType']('测试')).toBe(WorkType.TESTING);
      expect(analyzer['mapWorkType']('设计')).toBe(WorkType.DESIGN);
      expect(analyzer['mapWorkType']('未知')).toBe(WorkType.DEVELOPMENT);
    });

    test('应该正确映射业务领域', () => {
      expect(analyzer['mapBusinessDomain']('电商')).toBe(
        BusinessDomain.ECOMMERCE
      );
      expect(analyzer['mapBusinessDomain']('金融科技')).toBe(
        BusinessDomain.FINTECH
      );
      expect(analyzer['mapBusinessDomain']('未知')).toBe(null);
    });
  });
});
