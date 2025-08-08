// 简历提取器测试

import { ExtractionService } from '../../services/extraction.service';
import { DEFAULT_EXTRACTOR_CONFIG } from '../../config/extractor.config';

// 测试简历文本
const testResumeText = `
张三
手机：13812345678
邮箱：zhangsan@example.com
地址：北京市海淀区中关村大街1号

求职意向：软件工程师

教育背景：
2018年9月-2022年6月  清华大学  计算机科学与技术  本科
GPA: 3.8/4.0
获得校级奖学金

工作经历：
2022年7月-至今  北京字节跳动科技有限公司  Java开发工程师
负责后端服务开发，使用Spring Boot、MySQL、Redis等技术
优化系统性能，响应时间提升30%

项目经历：
在线教育平台
2022年3月-2022年6月
使用Vue.js、Spring Boot、MySQL开发
实现用户管理、课程管理、在线考试等功能
服务1000+用户，获得良好反馈

技能：
编程语言：Java、Python、JavaScript
框架：Spring Boot、Vue.js、React
数据库：MySQL、Redis、MongoDB
工具：Git、Docker、Maven

语言能力：
英语：CET-6，能够熟练阅读英文技术文档

证书：
Java程序员认证（Oracle）2023年
`;

describe('ExtractionService', () => {
  let extractionService: ExtractionService;

  beforeAll(() => {
    // 使用测试配置（禁用AI以避免API调用）
    const testConfig = {
      ...DEFAULT_EXTRACTOR_CONFIG,
      enable_ai_assistance: false,
    };
    extractionService = new ExtractionService(testConfig);
  });

  test('should extract basic info correctly', async () => {
    const result = await extractionService.extractBasicInfo(testResumeText);

    expect(result.name).toBe('张三');
    expect(result.phone).toBe('13812345678');
    expect(result.email).toBe('zhangsan@example.com');
    expect(result.desired_position).toContain('软件工程师');
  });

  test('should extract education correctly', async () => {
    const result = await extractionService.extractEducation(testResumeText);

    expect(result).toHaveLength(1);
    expect(result[0].school).toContain('清华大学');
    expect(result[0].major).toContain('计算机科学与技术');
    expect(result[0].degree).toContain('学士');
    expect(result[0].is_key_university).toBe(true);
  });

  test('should extract work experience correctly', async () => {
    const result = await extractionService.extractExperience(testResumeText);

    expect(result).toHaveLength(1);
    expect(result[0].company).toContain('字节跳动');
    expect(result[0].position).toContain('Java开发工程师');
    expect(result[0].is_current).toBe(true);
  });

  test('should extract projects correctly', async () => {
    const result = await extractionService.extractProjects(testResumeText);

    expect(result).toHaveLength(1);
    expect(result[0].name).toContain('在线教育平台');
    expect(result[0].technologies).toContain('Vue.js');
    expect(result[0].technologies).toContain('Spring Boot');
  });

  test('should extract skills correctly', async () => {
    const result = await extractionService.extractSkills(testResumeText);

    expect(result.technical_skills).toBeDefined();
    expect(result.technical_skills.length).toBeGreaterThan(0);

    // 检查编程语言分类
    const programmingCategory = result.technical_skills.find((cat) =>
      cat.category.includes('编程语言')
    );
    expect(programmingCategory).toBeDefined();
    expect(
      programmingCategory?.items.some((item) => item.name === 'Java')
    ).toBe(true);
  });

  test('should perform batch extraction correctly', async () => {
    const result = await extractionService.extractAll(testResumeText);

    // 检查所有部分都被提取
    expect(result.basic_info.data.name).toBe('张三');
    expect(result.education.data).toHaveLength(1);
    expect(result.work_experience.data).toHaveLength(1);
    expect(result.projects.data).toHaveLength(1);
    expect(result.skills.data.technical_skills).toBeDefined();

    // 检查元数据
    expect(result.extraction_metadata).toBeDefined();
    expect(result.extraction_metadata.processing_time_ms).toBeGreaterThan(0);
    expect(result.extraction_metadata.confidence_score).toBeGreaterThan(0);
  });

  test('should validate extraction results', async () => {
    const result = await extractionService.extractAll(testResumeText);
    const validation = extractionService.validateExtractionResults(result);

    expect(validation.is_valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  test('should generate extraction stats', async () => {
    const result = await extractionService.extractAll(testResumeText);
    const stats = extractionService.getExtractionStats(result);

    expect(stats.total_fields).toBe(5);
    expect(stats.extracted_fields).toBeGreaterThan(0);
    expect(stats.confidence_avg).toBeGreaterThan(0);
    expect(stats.processing_time_ms).toBeGreaterThan(0);
  });
});

describe('Individual Extractors', () => {
  test('should handle empty text gracefully', async () => {
    const extractionService = new ExtractionService({
      ...DEFAULT_EXTRACTOR_CONFIG,
      enable_ai_assistance: false,
    });

    const result = await extractionService.extractAll('');

    expect(result.basic_info.warnings.length).toBeGreaterThan(0);
    expect(result.extraction_metadata.fields_missing.length).toBeGreaterThan(0);
  });

  test('should handle malformed data gracefully', async () => {
    const extractionService = new ExtractionService({
      ...DEFAULT_EXTRACTOR_CONFIG,
      enable_ai_assistance: false,
    });

    const malformedText = '这是一段没有结构的文本，不包含简历信息。';
    const result = await extractionService.extractAll(malformedText);

    expect(result.extraction_metadata.warnings.length).toBeGreaterThan(0);
  });
});
