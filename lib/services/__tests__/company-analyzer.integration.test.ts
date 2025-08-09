import { CompanyAnalyzerService } from '../company-analyzer.service';
import { CompanyAnalysisRequest } from '../../types/company.types';

// 跳过需要真实API调用的集成测试
describe.skip('CompanyAnalyzerService 集成测试', () => {
  let service: CompanyAnalyzerService;

  beforeEach(() => {
    service = new CompanyAnalyzerService();
  });

  it('应该成功分析真实的岗位描述', async () => {
    const request: CompanyAnalysisRequest = {
      jobDescription: `
        腾讯科技（深圳）有限公司成立于1998年11月，是目前中国领先的互联网增值服务提供商之一。
        
        岗位职责：
        1. 负责微信、QQ等核心产品的后端开发
        2. 参与系统架构设计和技术方案制定
        3. 优化系统性能，保障服务稳定性
        4. 参与团队技术分享和代码审查
        
        任职要求：
        1. 本科及以上学历，计算机相关专业
        2. 3年以上后端开发经验
        3. 精通Java、Python等编程语言
        4. 熟悉微服务架构、分布式系统
        
        我们提供：
        - 具有竞争力的薪酬待遇
        - 五险一金、补充医疗保险
        - 股票期权计划
        - 弹性工作制，良好的工作环境
        - 完善的培训体系和职业发展通道
        - 年度体检、健身房、员工餐厅
        - 定期团建活动和技术分享
        
        公司文化：
        - 用户为本，科技向善
        - 正直、进取、协作、创造
        - 开放包容的工作氛围
        - 扁平化管理结构
      `,
      companyName: '腾讯科技',
    };

    const result = await service.analyzeCompany(request);
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    
    if (result.data) {
      // 验证基本信息
      expect(result.data.basicInfo.industry.length).toBeGreaterThan(0);
      expect(result.data.basicInfo.size).toBeDefined();
      expect(result.data.basicInfo.stage).toBeDefined();
      
      // 验证企业文化
      expect(result.data.culture.values.length).toBeGreaterThan(0);
      expect(result.data.culture.cultureScore).toBeGreaterThan(0);
      
      // 验证福利待遇
      expect(result.data.benefits.basicBenefits.length).toBeGreaterThan(0);
      expect(result.data.benefits.benefitsScore).toBeGreaterThan(0);
      
      // 验证工作环境
      expect(result.data.workEnvironment.environmentScore).toBeGreaterThan(0);
      
      // 验证标签生成
      expect(result.data.companyTags.length).toBeGreaterThan(0);
      
      // 验证综合评分
      expect(result.data.overallScore.total).toBeGreaterThan(0);
      expect(result.data.overallScore.total).toBeLessThanOrEqual(10);
      
      // 验证分析元数据
      expect(result.data.analysisMetadata.confidence).toBeGreaterThan(0);
      expect(result.data.analysisMetadata.confidence).toBeLessThanOrEqual(1);
      
      // console.log('分析结果：', {
      //   基本信息: result.data.basicInfo,
      //   文化评分: result.data.culture.cultureScore,
      //   福利评分: result.data.benefits.benefitsScore,
      //   环境评分: result.data.workEnvironment.environmentScore,
      //   综合评分: result.data.overallScore.total,
      //   标签数量: result.data.companyTags.length,
      //   置信度: result.data.analysisMetadata.confidence,
      // });
    }
  }, 30000); // 30秒超时，因为AI调用可能较慢

  it('应该处理简单的岗位描述', async () => {
    const request: CompanyAnalysisRequest = {
      jobDescription: '我们是一家创新的互联网公司，提供五险一金，弹性工作，团队年轻有活力。',
      companyName: '创新科技公司',
    };

    const result = await service.analyzeCompany(request);
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    
    if (result.data) {
      expect(result.data.analysisMetadata.confidence).toBeGreaterThan(0);
    }
  }, 30000);

  it('应该处理包含外语内容的岗位描述', async () => {
    const request: CompanyAnalysisRequest = {
      jobDescription: `
        Google LLC is a multinational technology company.
        我们致力于通过技术让世界变得更美好。
        
        We offer:
        - Competitive salary
        - 五险一金
        - Stock options
        - Flexible working hours
        - 健身房和免费食堂
        
        Join our innovative team!
      `,
      companyName: 'Google',
    };

    const result = await service.analyzeCompany(request);
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    
    if (result.data) {
      expect(result.data.companyTags.length).toBeGreaterThan(0);
    }
  }, 30000);
});