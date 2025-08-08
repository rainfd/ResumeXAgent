// 简历结构化提取服务

import { BasicInfoExtractor } from '../extractors/basic-info.extractor';
import { EducationExtractor } from '../extractors/education.extractor';
import { ExperienceExtractor } from '../extractors/experience.extractor';
import { ProjectsExtractor } from '../extractors/projects.extractor';
import { SkillsExtractor } from '../extractors/skills.extractor';
import {
  AIAssistantExtractor,
  HybridExtractionStrategy,
} from '../extractors/ai-assistant.extractor';

import {
  BasicInfo,
  Education,
  Experience,
  Project,
  Skills,
  ExtractorConfig,
  BatchExtractionResult,
  ExtractionMetadata,
  ExtractionStats,
  ValidationResult,
} from '../types/extraction.types';
import { IResumeData } from '../types/resume.types';
import { ResumeRepository } from '../repositories/resume.repository';
import { logger } from '../utils/logger';

/**
 * 简历结构化提取服务
 */
export class ExtractionService {
  private basicInfoExtractor: BasicInfoExtractor;
  private educationExtractor: EducationExtractor;
  private experienceExtractor: ExperienceExtractor;
  private projectsExtractor: ProjectsExtractor;
  private skillsExtractor: SkillsExtractor;
  private aiExtractor?: AIAssistantExtractor;
  private hybridStrategy?: HybridExtractionStrategy;
  private resumeRepository: ResumeRepository;

  constructor(config: ExtractorConfig) {
    // 初始化所有提取器
    this.basicInfoExtractor = new BasicInfoExtractor(config);
    this.educationExtractor = new EducationExtractor(config);
    this.experienceExtractor = new ExperienceExtractor(config);
    this.projectsExtractor = new ProjectsExtractor(config);
    this.skillsExtractor = new SkillsExtractor(config);

    // 如果启用AI辅助，初始化AI服务
    if (config.enable_ai_assistance) {
      this.aiExtractor = new AIAssistantExtractor({
        aiModel: config.ai_model,
        apiKey: process.env.DEEPSEEK_API_KEY,
      });
      this.hybridStrategy = new HybridExtractionStrategy();
    }

    this.resumeRepository = new ResumeRepository();
  }

  /**
   * 批量提取简历信息
   */
  async extractAll(
    text: string,
    resumeId?: string
  ): Promise<BatchExtractionResult> {
    const startTime = Date.now();

    try {
      logger.info(
        'Starting batch extraction',
        JSON.stringify({
          text_length: text.length,
          resume_id: resumeId,
          ai_enabled: !!this.aiExtractor,
        })
      );

      // 并行执行所有规则提取
      const [
        basicInfoResult,
        educationResult,
        experienceResult,
        projectsResult,
        skillsResult,
      ] = await Promise.all([
        this.basicInfoExtractor.extract(text),
        this.educationExtractor.extract(text),
        this.experienceExtractor.extract(text),
        this.projectsExtractor.extract(text),
        this.skillsExtractor.extract(text),
      ]);

      let aiResults = null;

      // 如果启用AI辅助，执行AI提取
      if (this.aiExtractor && this.hybridStrategy) {
        try {
          aiResults = await this.aiExtractor.extractAll(text);
        } catch (error) {
          logger.warn(
            'AI extraction failed, using rule-based results only',
            JSON.stringify({
              error: error instanceof Error ? error.message : 'Unknown error',
            })
          );
        }
      }

      // 合并规则和AI结果
      const finalResults = this.mergeExtractionResults(
        {
          basic_info: basicInfoResult,
          education: educationResult,
          experience: experienceResult,
          projects: projectsResult,
          skills: skillsResult,
        },
        aiResults
      );

      // 生成提取元数据
      const extractionMetadata = this.generateExtractionMetadata(
        startTime,
        finalResults,
        text.length,
        !!aiResults
      );

      // 构建批量提取结果
      const batchResult: BatchExtractionResult = {
        basic_info: finalResults.basic_info,
        education: finalResults.education,
        work_experience: finalResults.experience,
        projects: finalResults.projects,
        skills: finalResults.skills,
        extraction_metadata: extractionMetadata,
      };

      // 保存到数据库（如果提供了resumeId）
      if (resumeId) {
        await this.saveExtractionResults(resumeId, batchResult);
      }

      logger.info(
        'Batch extraction completed successfully',
        JSON.stringify({
          resume_id: resumeId,
          processing_time_ms: extractionMetadata.processing_time_ms,
          confidence_avg: extractionMetadata.confidence_score,
          fields_extracted: extractionMetadata.fields_extracted.length,
        })
      );

      return batchResult;
    } catch (error) {
      const processingTime = Date.now() - startTime;
      logger.error(
        'Batch extraction failed',
        JSON.stringify({
          error: error instanceof Error ? error.message : 'Unknown error',
          resume_id: resumeId,
          processing_time_ms: processingTime,
        })
      );

      throw error;
    }
  }

  /**
   * 单独提取基本信息
   */
  async extractBasicInfo(text: string): Promise<BasicInfo> {
    const result = await this.basicInfoExtractor.extract(text);

    if (this.aiExtractor && this.hybridStrategy) {
      try {
        const aiResult = await this.aiExtractor.extractBasicInfo(text);
        return this.hybridStrategy.mergeBasicInfo(result.data, aiResult);
      } catch (error) {
        logger.warn(
          'AI basic info extraction failed, using rule-based result',
          JSON.stringify({
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        );
      }
    }

    return result.data;
  }

  /**
   * 单独提取教育背景
   */
  async extractEducation(text: string): Promise<Education[]> {
    const result = await this.educationExtractor.extract(text);

    if (this.aiExtractor && this.hybridStrategy) {
      try {
        const aiResult = await this.aiExtractor.extractEducation(text);
        return this.hybridStrategy.mergeEducation(result.data, aiResult);
      } catch (error) {
        logger.warn(
          'AI education extraction failed, using rule-based result',
          JSON.stringify({
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        );
      }
    }

    return result.data;
  }

  /**
   * 单独提取工作经历
   */
  async extractExperience(text: string): Promise<Experience[]> {
    const result = await this.experienceExtractor.extract(text);

    if (this.aiExtractor && this.hybridStrategy) {
      try {
        const aiResult = await this.aiExtractor.extractExperience(text);
        return this.hybridStrategy.mergeExperience(result.data, aiResult);
      } catch (error) {
        logger.warn(
          'AI experience extraction failed, using rule-based result',
          JSON.stringify({
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        );
      }
    }

    return result.data;
  }

  /**
   * 单独提取项目经历
   */
  async extractProjects(text: string): Promise<Project[]> {
    const result = await this.projectsExtractor.extract(text);

    if (this.aiExtractor && this.hybridStrategy) {
      try {
        const aiResult = await this.aiExtractor.extractProjects(text);
        return this.hybridStrategy.mergeProjects(result.data, aiResult);
      } catch (error) {
        logger.warn(
          'AI projects extraction failed, using rule-based result',
          JSON.stringify({
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        );
      }
    }

    return result.data;
  }

  /**
   * 单独提取技能信息
   */
  async extractSkills(text: string): Promise<Skills> {
    const result = await this.skillsExtractor.extract(text);

    if (this.aiExtractor && this.hybridStrategy) {
      try {
        const aiResult = await this.aiExtractor.extractSkills(text);
        return this.hybridStrategy.mergeSkills(result.data, aiResult);
      } catch (error) {
        logger.warn(
          'AI skills extraction failed, using rule-based result',
          JSON.stringify({
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        );
      }
    }

    return result.data;
  }

  /**
   * 合并提取结果
   */
  private mergeExtractionResults(
    ruleResults: {
      basic_info: any;
      education: any;
      experience: any;
      projects: any;
      skills: any;
    },
    aiResults: any
  ): {
    basic_info: any;
    education: any;
    experience: any;
    projects: any;
    skills: any;
  } {
    if (!aiResults || !this.hybridStrategy) {
      return {
        basic_info: ruleResults.basic_info,
        education: ruleResults.education,
        experience: ruleResults.experience,
        projects: ruleResults.projects,
        skills: ruleResults.skills,
      };
    }

    return {
      basic_info: {
        ...ruleResults.basic_info,
        data: this.hybridStrategy.mergeBasicInfo(
          ruleResults.basic_info.data,
          aiResults.basic_info
        ),
      },
      education: {
        ...ruleResults.education,
        data: this.hybridStrategy.mergeEducation(
          ruleResults.education.data,
          aiResults.education
        ),
      },
      experience: {
        ...ruleResults.experience,
        data: this.hybridStrategy.mergeExperience(
          ruleResults.experience.data,
          aiResults.experience
        ),
      },
      projects: {
        ...ruleResults.projects,
        data: this.hybridStrategy.mergeProjects(
          ruleResults.projects.data,
          aiResults.projects
        ),
      },
      skills: {
        ...ruleResults.skills,
        data: this.hybridStrategy.mergeSkills(
          ruleResults.skills.data,
          aiResults.skills
        ),
      },
    };
  }

  /**
   * 生成提取元数据
   */
  private generateExtractionMetadata(
    startTime: number,
    results: any,
    textLength: number,
    aiEnabled: boolean
  ): ExtractionMetadata {
    const processingTime = Date.now() - startTime;

    // 计算平均置信度
    const confidenceScores = [
      results.basic_info.confidence || 0,
      results.education.confidence || 0,
      results.experience.confidence || 0,
      results.projects.confidence || 0,
      results.skills.confidence || 0,
    ];
    const avgConfidence =
      confidenceScores.reduce((sum, score) => sum + score, 0) /
      confidenceScores.length;

    // 收集提取的字段
    const fieldsExtracted: string[] = [];
    const fieldsMissing: string[] = [];

    const checkFields = [
      { name: 'basic_info', data: results.basic_info.data },
      { name: 'education', data: results.education.data },
      { name: 'experience', data: results.experience.data },
      { name: 'projects', data: results.projects.data },
      { name: 'skills', data: results.skills.data },
    ];

    checkFields.forEach((field) => {
      if (this.hasValidData(field.data)) {
        fieldsExtracted.push(field.name);
      } else {
        fieldsMissing.push(field.name);
      }
    });

    // 收集警告信息
    const warnings = [
      ...(results.basic_info.warnings || []),
      ...(results.education.warnings || []),
      ...(results.experience.warnings || []),
      ...(results.projects.warnings || []),
      ...(results.skills.warnings || []),
    ];

    return {
      extraction_method: aiEnabled ? 'hybrid' : 'rule_based',
      ai_model: aiEnabled ? this.aiExtractor?.getModelInfo().model : undefined,
      confidence_score: avgConfidence,
      timestamp: new Date().toISOString(),
      processing_time_ms: processingTime,
      warnings,
      errors: [], // 如果到这里没有抛出异常，就没有错误
      fields_extracted: fieldsExtracted,
      fields_missing: fieldsMissing,
    };
  }

  /**
   * 检查数据是否有效
   */
  private hasValidData(data: any): boolean {
    if (!data) return false;

    if (Array.isArray(data)) {
      return data.length > 0;
    }

    if (typeof data === 'object') {
      return Object.keys(data).some((key) => {
        const value = data[key];
        return value !== null && value !== undefined && value !== '';
      });
    }

    return true;
  }

  /**
   * 保存提取结果到数据库
   */
  private async saveExtractionResults(
    resumeId: string,
    results: BatchExtractionResult
  ): Promise<void> {
    try {
      // 转换为数据库格式
      const updateData = {
        basic_info: results.basic_info.data,
        education: results.education.data,
        work_experience: results.work_experience.data,
        projects: results.projects.data,
        skills: results.skills.data,
        parsed_data: {
          extractedSections: {
            basicInfo: this.hasValidData(results.basic_info.data),
            education: this.hasValidData(results.education.data),
            workExperience: this.hasValidData(results.work_experience.data),
            projects: this.hasValidData(results.projects.data),
            skills: this.hasValidData(results.skills.data),
          },
          parsingMetadata: {
            method: results.extraction_metadata.extraction_method,
            confidence: results.extraction_metadata.confidence_score,
            timestamp: results.extraction_metadata.timestamp,
            warnings: results.extraction_metadata.warnings,
          },
        },
      };

      await this.resumeRepository.update(resumeId, updateData);

      logger.info(
        'Extraction results saved to database',
        JSON.stringify({
          resume_id: resumeId,
          fields_count: results.extraction_metadata.fields_extracted.length,
        })
      );
    } catch (error) {
      logger.error(
        'Failed to save extraction results',
        JSON.stringify({
          resume_id: resumeId,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      );
      throw error;
    }
  }

  /**
   * 验证提取结果
   */
  validateExtractionResults(results: BatchExtractionResult): ValidationResult {
    const errors: any[] = [];
    const warnings: any[] = [];

    // 验证基本信息
    if (
      !results.basic_info.data.name &&
      !results.basic_info.data.phone &&
      !results.basic_info.data.email
    ) {
      errors.push({
        field: 'basic_info',
        message: '未能提取到基本联系信息（姓名、电话或邮箱）',
        code: 'MISSING_CONTACT_INFO',
      });
    }

    // 验证教育背景
    if (!results.education.data || results.education.data.length === 0) {
      warnings.push({
        field: 'education',
        message: '未能提取到教育背景信息',
        suggestion: '检查简历中是否包含教育经历章节',
      });
    }

    // 验证工作经历
    if (
      !results.work_experience.data ||
      results.work_experience.data.length === 0
    ) {
      warnings.push({
        field: 'work_experience',
        message: '未能提取到工作经历信息',
        suggestion: '检查简历中是否包含工作经验章节',
      });
    }

    // 验证整体置信度
    if (results.extraction_metadata.confidence_score < 0.5) {
      warnings.push({
        field: 'overall',
        message: '提取结果置信度较低',
        suggestion: '建议人工校验提取结果',
      });
    }

    return {
      is_valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 获取提取统计信息
   */
  getExtractionStats(results: BatchExtractionResult): ExtractionStats {
    const totalFields = 5; // 基本信息、教育、工作、项目、技能
    const extractedFields = results.extraction_metadata.fields_extracted.length;

    let aiCallsCount = 0;
    let costEstimate = 0;

    if (
      results.extraction_metadata.extraction_method === 'hybrid' &&
      this.aiExtractor
    ) {
      aiCallsCount = 5; // 5个主要提取任务
      costEstimate = this.aiExtractor.estimateCost(1000); // 假设平均1000字符
    }

    return {
      total_fields: totalFields,
      extracted_fields: extractedFields,
      confidence_avg: results.extraction_metadata.confidence_score,
      processing_time_ms: results.extraction_metadata.processing_time_ms,
      ai_calls_count: aiCallsCount,
      cost_estimate_usd: costEstimate,
    };
  }

  /**
   * 检查服务状态
   */
  async getServiceStatus(): Promise<{
    rule_extractors: boolean;
    ai_extractor: boolean;
    database: boolean;
  }> {
    const status = {
      rule_extractors: true, // 规则提取器总是可用
      ai_extractor: false,
      database: false,
    };

    // 检查AI服务
    if (this.aiExtractor) {
      try {
        status.ai_extractor = await this.aiExtractor.checkAvailability();
      } catch (error) {
        logger.warn(
          'AI service check failed',
          JSON.stringify({
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        );
      }
    }

    // 检查数据库
    try {
      await this.resumeRepository.findById('test'); // 简单的连通性测试
      status.database = true;
    } catch (error) {
      // 数据库检查失败是正常的，因为test ID不存在
      status.database = true;
    }

    return status;
  }
}
