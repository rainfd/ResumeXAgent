import {
  IGrammarIssue,
  IssueType,
  IssueSeverity,
  ITextPosition,
  ISuggestion
} from '../types/grammar-issue.types';
import { IResumeData, IBasicInfo, IWorkExperience, IEducation } from '../types/resume.types';
import { logger } from '../utils/logger';

/**
 * 简历专项检查器 - 检测简历特有的问题
 */
export class ResumeSpecificChecker {
  
  /**
   * 检查简历专项问题
   */
  async checkResumeSpecific(resume: IResumeData, text: string): Promise<IGrammarIssue[]> {
    try {
      const issues: IGrammarIssue[] = [];

      // 时间格式一致性检测
      const dateFormatIssues = await this.checkDateFormatConsistency(text, resume);
      issues.push(...dateFormatIssues);

      // 必要信息完整性检查
      const completenessIssues = await this.checkInformationCompleteness(resume, text);
      issues.push(...completenessIssues);

      // 联系方式有效性验证
      const contactValidityIssues = await this.checkContactInfoValidity(resume, text);
      issues.push(...contactValidityIssues);

      // 简历长度和结构建议
      const structureIssues = await this.checkResumeStructure(resume, text);
      issues.push(...structureIssues);

      // 时间逻辑性检查
      const timeLogicIssues = await this.checkTimeLogic(resume, text);
      issues.push(...timeLogicIssues);

      // 内容一致性检查
      const consistencyIssues = await this.checkContentConsistency(resume, text);
      issues.push(...consistencyIssues);

      logger.info(`简历专项检查完成，发现 ${issues.length} 个问题`, {
        resumeId: resume.id,
        issueCount: issues.length
      });

      return issues;
    } catch (error) {
      logger.error('简历专项检查失败', { error, resumeId: resume.id });
      throw error;
    }
  }

  /**
   * 检查时间格式一致性
   */
  private async checkDateFormatConsistency(text: string, resume: IResumeData): Promise<IGrammarIssue[]> {
    const issues: IGrammarIssue[] = [];

    // 检测不同的时间格式
    const dateFormats = [
      { pattern: /\d{4}年\d{1,2}月/g, format: 'YYYY年MM月' },
      { pattern: /\d{4}-\d{1,2}/g, format: 'YYYY-MM' },
      { pattern: /\d{4}\/\d{1,2}/g, format: 'YYYY/MM' },
      { pattern: /\d{4}\.\d{1,2}/g, format: 'YYYY.MM' },
      { pattern: /\d{1,2}\/\d{4}/g, format: 'MM/YYYY' }
    ];

    const foundFormats: { format: string; count: number; positions: number[] }[] = [];

    dateFormats.forEach(({ pattern, format }) => {
      const matches = [...text.matchAll(pattern)];
      if (matches.length > 0) {
        foundFormats.push({
          format,
          count: matches.length,
          positions: matches.map(m => m.index || 0)
        });
      }
    });

    // 如果发现多种时间格式，提出一致性建议
    if (foundFormats.length > 1) {
      const mostUsedFormat = foundFormats.reduce((prev, current) => 
        current.count > prev.count ? current : prev
      );

      // 为每种非主流格式创建问题
      foundFormats.forEach(formatInfo => {
        if (formatInfo.format !== mostUsedFormat.format) {
          formatInfo.positions.forEach(position => {
            const textPosition = this.getTextPosition(text, position, 10);
            issues.push({
              id: `date-format-inconsistency-${Date.now()}-${position}`,
              type: 'resume-specific' as IssueType,
              severity: 'warning' as IssueSeverity,
              position: textPosition,
              message: `建议使用统一的时间格式，推荐使用 "${mostUsedFormat.format}" 格式`,
              suggestion: {
                id: `date-format-fix-${Date.now()}-${position}`,
                original: formatInfo.format,
                replacement: mostUsedFormat.format,
                reason: `保持时间格式一致性，提升简历专业度`,
                confidence: 0.8
              },
              ruleId: 'date-format-consistency',
              category: '时间格式'
            });
          });
        }
      });
    }

    return issues;
  }

  /**
   * 检查必要信息完整性
   */
  private async checkInformationCompleteness(resume: IResumeData, text: string): Promise<IGrammarIssue[]> {
    const issues: IGrammarIssue[] = [];

    const basicInfo = resume.basicInfo || {};
    const requiredFields = {
      name: '姓名',
      email: '邮箱',
      phone: '电话号码'
    };

    Object.entries(requiredFields).forEach(([field, fieldName]) => {
      if (!basicInfo[field as keyof IBasicInfo]) {
        issues.push({
          id: `missing-${field}-${Date.now()}`,
          type: 'resume-specific' as IssueType,
          severity: 'error' as IssueSeverity,
          position: this.getTextPosition(text, 0, 1),
          message: `缺少必要信息：${fieldName}`,
          suggestion: {
            id: `add-${field}-${Date.now()}`,
            original: '',
            replacement: `请添加${fieldName}信息`,
            reason: `${fieldName}是简历必备信息`,
            confidence: 1.0
          },
          ruleId: `required-${field}`,
          category: '必要信息'
        });
      }
    });

    // 检查工作经历是否为空
    if (!resume.workExperience || resume.workExperience.length === 0) {
      issues.push({
        id: `missing-work-experience-${Date.now()}`,
        type: 'resume-specific' as IssueType,
        severity: 'warning' as IssueSeverity,
        position: this.getTextPosition(text, 0, 1),
        message: '建议添加工作经历信息',
        suggestion: {
          id: `add-work-experience-${Date.now()}`,
          original: '',
          replacement: '请添加工作经历',
          reason: '工作经历有助于展示专业能力',
          confidence: 0.9
        },
        ruleId: 'missing-work-experience',
        category: '内容完整性'
      });
    }

    // 检查教育背景是否为空
    if (!resume.education || resume.education.length === 0) {
      issues.push({
        id: `missing-education-${Date.now()}`,
        type: 'resume-specific' as IssueType,
        severity: 'warning' as IssueSeverity,
        position: this.getTextPosition(text, 0, 1),
        message: '建议添加教育背景信息',
        suggestion: {
          id: `add-education-${Date.now()}`,
          original: '',
          replacement: '请添加教育背景',
          reason: '教育背景是简历重要组成部分',
          confidence: 0.9
        },
        ruleId: 'missing-education',
        category: '内容完整性'
      });
    }

    return issues;
  }

  /**
   * 检查联系方式有效性
   */
  private async checkContactInfoValidity(resume: IResumeData, text: string): Promise<IGrammarIssue[]> {
    const issues: IGrammarIssue[] = [];
    const basicInfo = resume.basicInfo || {};

    // 检查邮箱格式
    if (basicInfo.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(basicInfo.email)) {
        const emailPosition = text.indexOf(basicInfo.email);
        issues.push({
          id: `invalid-email-${Date.now()}`,
          type: 'resume-specific' as IssueType,
          severity: 'error' as IssueSeverity,
          position: this.getTextPosition(text, emailPosition, basicInfo.email.length),
          message: '邮箱格式不正确',
          suggestion: {
            id: `fix-email-${Date.now()}`,
            original: basicInfo.email,
            replacement: '请提供正确的邮箱格式，如: example@domain.com',
            reason: '正确的邮箱格式有助于联系',
            confidence: 0.95
          },
          ruleId: 'invalid-email-format',
          category: '联系方式'
        });
      }
    }

    // 检查手机号格式
    if (basicInfo.phone) {
      const phoneRegex = /^1[3-9]\d{9}$|^\+86[- ]?1[3-9]\d{9}$/;
      const cleanPhone = basicInfo.phone.replace(/[\s\-\(\)]/g, '');
      if (!phoneRegex.test(cleanPhone)) {
        const phonePosition = text.indexOf(basicInfo.phone);
        issues.push({
          id: `invalid-phone-${Date.now()}`,
          type: 'resume-specific' as IssueType,
          severity: 'warning' as IssueSeverity,
          position: this.getTextPosition(text, phonePosition, basicInfo.phone.length),
          message: '手机号格式可能不正确',
          suggestion: {
            id: `fix-phone-${Date.now()}`,
            original: basicInfo.phone,
            replacement: '请提供正确的手机号格式，如: 138-0000-0000',
            reason: '标准的手机号格式更易识别',
            confidence: 0.8
          },
          ruleId: 'invalid-phone-format',
          category: '联系方式'
        });
      }
    }

    // 检查LinkedIn URL格式
    if (basicInfo.linkedIn && basicInfo.linkedIn.trim()) {
      const linkedInRegex = /^https?:\/\/(www\.)?linkedin\.com\/in\/[\w\-]+\/?$/;
      if (!linkedInRegex.test(basicInfo.linkedIn)) {
        const linkedInPosition = text.indexOf(basicInfo.linkedIn);
        issues.push({
          id: `invalid-linkedin-${Date.now()}`,
          type: 'resume-specific' as IssueType,
          severity: 'suggestion' as IssueSeverity,
          position: this.getTextPosition(text, linkedInPosition, basicInfo.linkedIn.length),
          message: 'LinkedIn链接格式建议优化',
          suggestion: {
            id: `fix-linkedin-${Date.now()}`,
            original: basicInfo.linkedIn,
            replacement: '建议使用完整的LinkedIn个人资料链接',
            reason: '标准格式：https://www.linkedin.com/in/yourprofile',
            confidence: 0.7
          },
          ruleId: 'linkedin-format',
          category: '联系方式'
        });
      }
    }

    return issues;
  }

  /**
   * 检查简历长度和结构
   */
  private async checkResumeStructure(resume: IResumeData, text: string): Promise<IGrammarIssue[]> {
    const issues: IGrammarIssue[] = [];

    // 检查简历长度
    const textLength = text.length;
    const wordCount = text.split(/\s+/).length;

    if (textLength < 500) {
      issues.push({
        id: `resume-too-short-${Date.now()}`,
        type: 'resume-specific' as IssueType,
        severity: 'warning' as IssueSeverity,
        position: this.getTextPosition(text, 0, 1),
        message: '简历内容过少，建议增加更多详细信息',
        suggestion: {
          id: `expand-resume-${Date.now()}`,
          original: '',
          replacement: '建议详细描述工作经历、项目经验和技能',
          reason: '充实的简历内容有助于展示能力',
          confidence: 0.8
        },
        ruleId: 'resume-too-short',
        category: '结构建议'
      });
    } else if (textLength > 3000) {
      issues.push({
        id: `resume-too-long-${Date.now()}`,
        type: 'resume-specific' as IssueType,
        severity: 'suggestion' as IssueSeverity,
        position: this.getTextPosition(text, 0, 1),
        message: '简历内容较长，建议精简表达',
        suggestion: {
          id: `condense-resume-${Date.now()}`,
          original: '',
          replacement: '建议突出重点，删除不太相关的信息',
          reason: '简洁明了的简历更易被阅读',
          confidence: 0.7
        },
        ruleId: 'resume-too-long',
        category: '结构建议'
      });
    }

    // 检查工作经历描述长度
    if (resume.workExperience) {
      resume.workExperience.forEach((exp, index) => {
        if (exp.description && exp.description.length < 50) {
          const expPosition = text.indexOf(exp.description);
          issues.push({
            id: `work-desc-too-short-${Date.now()}-${index}`,
            type: 'resume-specific' as IssueType,
            severity: 'suggestion' as IssueSeverity,
            position: this.getTextPosition(text, expPosition, exp.description.length),
            message: '工作经历描述过于简单，建议详细说明',
            suggestion: {
              id: `expand-work-desc-${Date.now()}-${index}`,
              original: exp.description,
              replacement: '建议详细描述工作职责、取得的成果和使用的技术',
              reason: '详细的工作描述有助于展示专业能力',
              confidence: 0.8
            },
            ruleId: 'work-description-too-short',
            category: '内容质量'
          });
        }
      });
    }

    return issues;
  }

  /**
   * 检查时间逻辑性
   */
  private async checkTimeLogic(resume: IResumeData, text: string): Promise<IGrammarIssue[]> {
    const issues: IGrammarIssue[] = [];

    if (resume.workExperience && resume.workExperience.length > 1) {
      // 检查工作经历时间是否重叠
      for (let i = 0; i < resume.workExperience.length; i++) {
        for (let j = i + 1; j < resume.workExperience.length; j++) {
          const exp1 = resume.workExperience[i];
          const exp2 = resume.workExperience[j];

          if (exp1.startDate && exp2.startDate && exp1.endDate && exp2.endDate) {
            const start1 = new Date(exp1.startDate);
            const end1 = new Date(exp1.endDate);
            const start2 = new Date(exp2.startDate);
            const end2 = new Date(exp2.endDate);

            // 检查是否有时间重叠
            if ((start1 <= end2 && end1 >= start2)) {
              const position = text.indexOf(exp1.company) || 0;
              issues.push({
                id: `time-overlap-${Date.now()}-${i}-${j}`,
                type: 'resume-specific' as IssueType,
                severity: 'warning' as IssueSeverity,
                position: this.getTextPosition(text, position, exp1.company.length),
                message: `工作经历时间重叠：${exp1.company} 和 ${exp2.company}`,
                suggestion: {
                  id: `fix-time-overlap-${Date.now()}-${i}-${j}`,
                  original: `${exp1.startDate} - ${exp1.endDate}`,
                  replacement: '请检查并修正工作时间',
                  reason: '工作时间重叠可能引起疑问',
                  confidence: 0.9
                },
                ruleId: 'work-time-overlap',
                category: '时间逻辑'
              });
            }
          }
        }
      }
    }

    return issues;
  }

  /**
   * 检查内容一致性
   */
  private async checkContentConsistency(resume: IResumeData, text: string): Promise<IGrammarIssue[]> {
    const issues: IGrammarIssue[] = [];

    // 检查技能和工作经历的一致性
    if (resume.skills?.technical && resume.workExperience) {
      const allSkills = [
        ...(resume.skills.technical.programming || []),
        ...(resume.skills.technical.frameworks || []),
        ...(resume.skills.technical.databases || []),
        ...(resume.skills.technical.tools || []),
        ...(resume.skills.technical.cloud || [])
      ];

      const workTechnologies = resume.workExperience.flatMap(exp => exp.technologies || []);
      
      // 查找在工作经历中提到但未在技能中列出的技术
      const missingSkills = workTechnologies.filter(tech => 
        !allSkills.some(skill => 
          skill.toLowerCase().includes(tech.toLowerCase()) || 
          tech.toLowerCase().includes(skill.toLowerCase())
        )
      );

      if (missingSkills.length > 0) {
        issues.push({
          id: `missing-skills-${Date.now()}`,
          type: 'resume-specific' as IssueType,
          severity: 'suggestion' as IssueSeverity,
          position: this.getTextPosition(text, 0, 1),
          message: `建议在技能部分添加在工作中使用的技术：${missingSkills.slice(0, 3).join(', ')}`,
          suggestion: {
            id: `add-missing-skills-${Date.now()}`,
            original: '',
            replacement: `建议在技能列表中添加：${missingSkills.join(', ')}`,
            reason: '保持技能列表与工作经历的一致性',
            confidence: 0.7
          },
          ruleId: 'skills-experience-consistency',
          category: '内容一致性'
        });
      }
    }

    return issues;
  }

  /**
   * 获取文本位置信息
   */
  private getTextPosition(text: string, start: number, length: number): ITextPosition {
    const beforeText = text.substring(0, start);
    const lines = beforeText.split('\n');
    const line = lines.length;
    const column = lines[lines.length - 1].length + 1;

    // 获取上下文（包含问题的整行或周围文本）
    const allLines = text.split('\n');
    const contextLine = allLines[line - 1] || '';
    const context = contextLine.length > 100 ? 
      contextLine.substring(Math.max(0, column - 50), column + 50) : 
      contextLine;

    return {
      start,
      end: start + length,
      line,
      column,
      context: context.trim() || text.substring(start, start + Math.min(50, text.length - start))
    };
  }

  /**
   * 获取行业特定建议
   */
  async getIndustrySpecificSuggestions(resume: IResumeData, industry?: string): Promise<IGrammarIssue[]> {
    const issues: IGrammarIssue[] = [];

    // 这里可以根据不同行业提供特定建议
    // 例如：技术行业强调项目经验，金融行业强调合规经验等

    if (industry === 'technology' || this.inferTechIndustry(resume)) {
      // 技术行业特定建议
      if (resume.projects && resume.projects.length === 0) {
        const resumeText = resume.rawText || '';
        issues.push({
          id: `tech-missing-projects-${Date.now()}`,
          type: 'resume-specific' as IssueType,
          severity: 'warning' as IssueSeverity,
          position: this.getTextPosition(resumeText, 0, 1),
          message: '技术岗位建议添加项目经验',
          suggestion: {
            id: `add-tech-projects-${Date.now()}`,
            original: '',
            replacement: '建议详细描述参与的技术项目',
            reason: '项目经验是技术能力的重要体现',
            confidence: 0.8
          },
          ruleId: 'tech-industry-projects',
          category: '行业建议'
        });
      }
    }

    return issues;
  }

  /**
   * 推断是否为技术行业
   */
  private inferTechIndustry(resume: IResumeData): boolean {
    const techKeywords = ['开发', '程序员', '工程师', '技术', '软件', 'developer', 'engineer', 'programmer'];
    
    const allText = [
      resume.basicInfo?.summary || '',
      ...(resume.workExperience?.map(exp => exp.position + ' ' + exp.description) || []),
      ...(resume.projects?.map(proj => proj.name + ' ' + proj.description) || [])
    ].join(' ').toLowerCase();

    return techKeywords.some(keyword => allText.includes(keyword));
  }
}