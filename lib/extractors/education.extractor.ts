// 教育背景结构化提取器

import { BaseExtractor } from './base.extractor';
import { Education, ExtractionResult } from '../types/extraction.types';
import {
  ChinesePatternsUtil,
  KEY_UNIVERSITIES,
  DATE_PATTERNS,
} from '../utils/chinese-patterns.util';

export class EducationExtractor extends BaseExtractor<Education[]> {
  // 学历层次关键词
  private readonly degreeKeywords = {
    doctorate: ['博士', '博士学位', '博士研究生', 'Ph.D', 'PhD', 'Doctor'],
    master: [
      '硕士',
      '硕士学位',
      '硕士研究生',
      '研究生',
      'Master',
      'M.S',
      'M.A',
      'MBA',
      'MPA',
    ],
    bachelor: [
      '学士',
      '学士学位',
      '本科',
      '大学本科',
      'Bachelor',
      'B.S',
      'B.A',
    ],
    college: ['专科', '大专', '高职', '高等专科', 'Diploma', 'Associate'],
    highschool: ['高中', '中学', '高级中学', 'High School'],
    other: ['进修', '培训', '证书', '短期', '在职'],
  };

  // 专业分类关键词
  private readonly majorCategories = {
    computer: [
      '计算机',
      '软件',
      '信息',
      '网络',
      '数据',
      '人工智能',
      'AI',
      '机器学习',
    ],
    engineering: [
      '工程',
      '机械',
      '电气',
      '自动化',
      '建筑',
      '土木',
      '化工',
      '材料',
    ],
    business: [
      '管理',
      '经济',
      '金融',
      '会计',
      '市场营销',
      '工商',
      'MBA',
      '商务',
    ],
    science: ['数学', '物理', '化学', '生物', '统计', '应用数学'],
    medicine: ['医学', '临床', '护理', '药学', '生物医学'],
    art: ['艺术', '设计', '美术', '音乐', '传媒', '新闻', '广告'],
    language: ['外语', '英语', '中文', '翻译', '语言学'],
    law: ['法学', '法律', '政治', '行政', '公共管理'],
    education: ['教育', '师范', '心理学', '社会学'],
  };

  /**
   * 提取教育背景信息
   */
  async extract(text: string): Promise<ExtractionResult<Education[]>> {
    return this.safeExtract('EducationExtractor', async () => {
      const startTime = Date.now();
      const processedText = this.preprocessText(text);

      // 规则提取
      const ruleBasedResult = this.extractWithRules(processedText);

      // AI辅助提取（如果启用）
      const aiResult = await this.performAIExtraction(processedText);

      // 合并结果
      const finalResult = this.mergeResults(ruleBasedResult, aiResult);

      const processingTime = Date.now() - startTime;
      const warnings = this.validateAndGetWarnings(finalResult);

      return this.createResult(
        finalResult,
        processingTime,
        warnings,
        'regex',
        processedText
      );
    });
  }

  /**
   * 使用规则提取教育背景
   */
  private extractWithRules(text: string): Education[] {
    const educationList: Education[] = [];

    // 方法1: 查找教育背景章节
    const educationSection = this.extractEducationSection(text);
    if (educationSection) {
      educationList.push(...this.parseEducationSection(educationSection));
    }

    // 方法2: 查找学校+专业模式
    const schoolMajorPairs = this.extractSchoolMajorPairs(text);
    schoolMajorPairs.forEach((pair) => {
      if (
        !educationList.some(
          (edu) => edu.school === pair.school && edu.major === pair.major
        )
      ) {
        educationList.push(pair);
      }
    });

    // 方法3: 查找学历+学校模式
    const degreeSchoolPairs = this.extractDegreeSchoolPairs(text);
    degreeSchoolPairs.forEach((pair) => {
      const existing = educationList.find((edu) => edu.school === pair.school);
      if (existing) {
        // 合并信息
        if (pair.degree && !existing.degree) existing.degree = pair.degree;
        if (pair.major && !existing.major) existing.major = pair.major;
      } else {
        educationList.push(pair);
      }
    });

    // 数据清洗和补充
    return educationList.map((edu) => this.enhanceEducationData(edu, text));
  }

  /**
   * 提取教育背景章节
   */
  private extractEducationSection(text: string): string | null {
    const sectionPatterns = [
      /(?:教育背景|教育经历|学习经历|Education|Academic)[：:\s]*\n?([\s\S]*?)(?=\n(?:工作|项目|技能|Experience|Work|Skills)|$)/i,
      /(?:教育|学历)[：:\s]*\n?([\s\S]*?)(?=\n(?:工作|项目|技能|Experience|Work|Skills)|$)/i,
    ];

    for (const pattern of sectionPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const section = match[1].trim();
        if (section.length > 10) {
          return section;
        }
      }
    }

    return null;
  }

  /**
   * 解析教育背景章节
   */
  private parseEducationSection(section: string): Education[] {
    const educationList: Education[] = [];
    const lines = section
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    let currentEducation: Partial<Education> = {};

    for (const line of lines) {
      // 检查是否是新的教育经历开始
      if (this.isEducationStart(line)) {
        // 保存当前记录
        if (currentEducation.school && currentEducation.major) {
          educationList.push(this.completeEducationRecord(currentEducation));
        }
        // 开始新记录
        currentEducation = this.parseEducationLine(line);
      } else {
        // 补充当前记录信息
        this.supplementEducationInfo(currentEducation, line);
      }
    }

    // 保存最后一条记录
    if (currentEducation.school && currentEducation.major) {
      educationList.push(this.completeEducationRecord(currentEducation));
    }

    return educationList;
  }

  /**
   * 提取学校+专业对
   */
  private extractSchoolMajorPairs(text: string): Education[] {
    const pairs: Education[] = [];

    // 模式1: 学校名 + 专业名
    const pattern1 =
      /([一-龯]{2,10}(?:大学|学院|学校|大专|高中))[^。\n]{0,50}?([一-龯]{2,20}(?:专业|系|学科)?)/g;
    let match;

    while ((match = pattern1.exec(text)) !== null) {
      const school = match[1];
      const major = match[2].replace(/专业$/, '').replace(/系$/, '');

      if (this.isValidSchool(school) && this.isValidMajor(major)) {
        pairs.push({
          school,
          major,
          degree: this.inferDegreeFromContext(text, match.index),
        });
      }
    }

    return pairs;
  }

  /**
   * 提取学历+学校对
   */
  private extractDegreeSchoolPairs(text: string): Education[] {
    const pairs: Education[] = [];

    // 匹配学历+学校的模式
    for (const [degreeType, keywords] of Object.entries(this.degreeKeywords)) {
      for (const keyword of keywords) {
        const pattern = new RegExp(
          `(${keyword})[^。\n]{0,50}?([一-龯]{2,10}(?:大学|学院|学校))`,
          'gi'
        );
        let match;

        while ((match = pattern.exec(text)) !== null) {
          const degree = this.standardizeDegree(match[1]);
          const school = match[2];

          if (this.isValidSchool(school)) {
            pairs.push({
              school,
              degree,
              major: this.extractMajorFromContext(text, match.index),
            });
          }
        }
      }
    }

    return pairs;
  }

  /**
   * 判断是否是教育经历开始行
   */
  private isEducationStart(line: string): boolean {
    // 包含时间和学校的行通常是开始行
    const hasDate =
      DATE_PATTERNS.year.test(line) || DATE_PATTERNS.date_range.test(line);
    const hasSchool = /[一-龯]{2,10}(?:大学|学院|学校|大专|高中)/.test(line);

    return hasDate && hasSchool;
  }

  /**
   * 解析教育经历行
   */
  private parseEducationLine(line: string): Partial<Education> {
    const education: Partial<Education> = {};

    // 提取时间
    const dateRange = this.extractDateRange(line);
    if (dateRange.start_date) education.start_date = dateRange.start_date;
    if (dateRange.end_date) education.end_date = dateRange.end_date;

    // 提取学校
    const schoolMatch = line.match(
      /([一-龯]{2,10}(?:大学|学院|学校|大专|高中))/
    );
    if (schoolMatch) {
      education.school = schoolMatch[1];
      education.is_key_university = ChinesePatternsUtil.isKeyUniversity(
        education.school
      );
    }

    // 提取专业
    const majorMatch = line.match(/([一-龯]{2,20}(?:专业|系|学科)?)/);
    if (majorMatch && majorMatch[1] !== education.school) {
      education.major = majorMatch[1].replace(/专业$/, '').replace(/系$/, '');
    }

    // 提取学历
    education.degree = this.extractDegreeFromLine(line);

    return education;
  }

  /**
   * 补充教育信息
   */
  private supplementEducationInfo(
    education: Partial<Education>,
    line: string
  ): void {
    // 补充专业信息
    if (!education.major) {
      const majorMatch = line.match(/专业[：:]?([一-龯]{2,20})/);
      if (majorMatch) {
        education.major = majorMatch[1];
      }
    }

    // 补充GPA信息
    if (!education.gpa) {
      const gpaMatch = line.match(/(?:GPA|绩点|平均分)[：:]?(\d+\.?\d*)/i);
      if (gpaMatch) {
        education.gpa = parseFloat(gpaMatch[1]);
      }
    }

    // 补充荣誉信息
    const honorKeywords = ['奖学金', '优秀', '三好', '荣誉', '获奖', '奖'];
    if (honorKeywords.some((keyword) => line.includes(keyword))) {
      if (!education.honors) education.honors = [];
      education.honors.push(line);
    }
  }

  /**
   * 完善教育记录
   */
  private completeEducationRecord(education: Partial<Education>): Education {
    const completed: Education = {
      school: education.school || '',
      major: education.major || '',
      degree:
        education.degree || this.inferDegreeFromSchool(education.school || ''),
      start_date: education.start_date,
      end_date: education.end_date,
      gpa: education.gpa,
      honors: education.honors,
      description: education.description,
      is_key_university: education.is_key_university || false,
    };

    return completed;
  }

  /**
   * 增强教育数据
   */
  private enhanceEducationData(
    education: Education,
    fullText: string
  ): Education {
    // 补充缺失的学历信息
    if (!education.degree) {
      education.degree = this.inferDegreeFromSchool(education.school);
    }

    // 标记重点大学
    education.is_key_university = ChinesePatternsUtil.isKeyUniversity(
      education.school
    );

    // 补充时间信息
    if (!education.start_date || !education.end_date) {
      const timeInfo = this.extractTimeForSchool(fullText, education.school);
      if (timeInfo.start_date && !education.start_date) {
        education.start_date = timeInfo.start_date;
      }
      if (timeInfo.end_date && !education.end_date) {
        education.end_date = timeInfo.end_date;
      }
    }

    return education;
  }

  /**
   * 从上下文推断学历
   */
  private inferDegreeFromContext(text: string, position: number): string {
    const contextStart = Math.max(0, position - 100);
    const contextEnd = Math.min(text.length, position + 100);
    const context = text.substring(contextStart, contextEnd);

    return this.extractDegreeFromLine(context);
  }

  /**
   * 从上下文提取专业
   */
  private extractMajorFromContext(text: string, position: number): string {
    const contextStart = Math.max(0, position - 50);
    const contextEnd = Math.min(text.length, position + 100);
    const context = text.substring(contextStart, contextEnd);

    const majorMatch = context.match(/([一-龯]{2,20}(?:专业|系|学科)?)/);
    if (majorMatch) {
      return majorMatch[1].replace(/专业$/, '').replace(/系$/, '');
    }

    return '';
  }

  /**
   * 从行中提取学历
   */
  private extractDegreeFromLine(line: string): string {
    for (const [degreeType, keywords] of Object.entries(this.degreeKeywords)) {
      for (const keyword of keywords) {
        if (line.includes(keyword)) {
          return this.standardizeDegree(keyword);
        }
      }
    }
    return '';
  }

  /**
   * 标准化学历名称
   */
  private standardizeDegree(degree: string): string {
    const degreeMap: { [key: string]: string } = {
      博士: '博士',
      博士学位: '博士',
      博士研究生: '博士',
      'Ph.D': '博士',
      PhD: '博士',
      Doctor: '博士',

      硕士: '硕士',
      硕士学位: '硕士',
      硕士研究生: '硕士',
      研究生: '硕士',
      Master: '硕士',
      'M.S': '硕士',
      'M.A': '硕士',
      MBA: 'MBA',
      MPA: 'MPA',

      学士: '学士',
      学士学位: '学士',
      本科: '学士',
      大学本科: '学士',
      Bachelor: '学士',
      'B.S': '学士',
      'B.A': '学士',

      专科: '专科',
      大专: '专科',
      高职: '专科',
      Diploma: '专科',
      Associate: '专科',
    };

    return degreeMap[degree] || degree;
  }

  /**
   * 根据学校推断学历
   */
  private inferDegreeFromSchool(school: string): string {
    if (school.includes('大学') || school.includes('学院')) {
      return '学士'; // 默认本科
    }
    if (school.includes('大专') || school.includes('职业')) {
      return '专科';
    }
    if (school.includes('高中') || school.includes('中学')) {
      return '高中';
    }
    return '学士';
  }

  /**
   * 提取时间范围
   */
  private extractDateRange(text: string): {
    start_date?: string;
    end_date?: string;
  } {
    const dateRangeMatch = text.match(DATE_PATTERNS.date_range);
    if (dateRangeMatch) {
      return ChinesePatternsUtil.parseDateRange(dateRangeMatch[0]);
    }

    const yearMatch = text.match(DATE_PATTERNS.year);
    if (yearMatch) {
      return { start_date: yearMatch[1] };
    }

    return {};
  }

  /**
   * 为特定学校提取时间信息
   */
  private extractTimeForSchool(
    text: string,
    school: string
  ): { start_date?: string; end_date?: string } {
    // 查找包含学校名的行的时间信息
    const lines = text.split('\n');
    for (const line of lines) {
      if (line.includes(school)) {
        return this.extractDateRange(line);
      }
    }
    return {};
  }

  /**
   * 验证学校名称
   */
  private isValidSchool(school: string): boolean {
    if (!school || school.length < 2 || school.length > 20) return false;

    const validSuffixes = ['大学', '学院', '学校', '大专', '高中', '中学'];
    return validSuffixes.some((suffix) => school.includes(suffix));
  }

  /**
   * 验证专业名称
   */
  private isValidMajor(major: string): boolean {
    if (!major || major.length < 2 || major.length > 30) return false;

    // 排除明显不是专业的词汇
    const excludeWords = ['学校', '大学', '学院', '毕业', '入学', '年级'];
    return !excludeWords.some((word) => major.includes(word));
  }

  /**
   * 验证提取结果
   */
  validateResult(data: Education[]): boolean {
    if (!Array.isArray(data)) return false;

    return data.every(
      (education) =>
        education.school &&
        education.major &&
        this.isValidSchool(education.school) &&
        this.isValidMajor(education.major)
    );
  }

  /**
   * 获取验证警告
   */
  private validateAndGetWarnings(data: Education[]): string[] {
    const warnings: string[] = [];

    if (!Array.isArray(data) || data.length === 0) {
      warnings.push('未能提取到教育背景信息');
      return warnings;
    }

    data.forEach((education, index) => {
      if (!education.school) {
        warnings.push(`教育记录${index + 1}缺少学校信息`);
      }

      if (!education.major) {
        warnings.push(`教育记录${index + 1}缺少专业信息`);
      }

      if (!education.degree) {
        warnings.push(`教育记录${index + 1}缺少学历层次`);
      }

      if (!education.start_date && !education.end_date) {
        warnings.push(`教育记录${index + 1}缺少时间信息`);
      }
    });

    return warnings;
  }

  /**
   * 计算正则匹配得分
   */
  protected calculateRegexMatchScore(data: Education[]): number {
    if (!Array.isArray(data) || data.length === 0) return 0;

    let totalScore = 0;

    data.forEach((education) => {
      let score = 0;
      let checks = 0;

      // 学校名称验证
      if (education.school) {
        checks++;
        if (this.isValidSchool(education.school)) score++;
      }

      // 专业名称验证
      if (education.major) {
        checks++;
        if (this.isValidMajor(education.major)) score++;
      }

      // 学历验证
      if (education.degree) {
        checks++;
        if (
          Object.values(this.degreeKeywords).flat().includes(education.degree)
        ) {
          score++;
        }
      }

      totalScore += checks > 0 ? score / checks : 0;
    });

    return data.length > 0 ? totalScore / data.length : 0;
  }

  /**
   * 计算上下文相关性得分
   */
  protected calculateContextRelevanceScore(data: Education[]): number {
    if (!Array.isArray(data) || data.length === 0) return 0;

    let score = 0;

    // 基础教育信息完整性
    const hasCompleteEducation = data.some(
      (edu) => edu.school && edu.major && edu.degree
    );
    if (hasCompleteEducation) score += 0.4;

    // 时间信息完整性
    const hasTimeInfo = data.some((edu) => edu.start_date || edu.end_date);
    if (hasTimeInfo) score += 0.3;

    // 重点大学标识
    const hasKeyUniversity = data.some((edu) => edu.is_key_university);
    if (hasKeyUniversity) score += 0.2;

    // 附加信息（GPA、荣誉等）
    const hasAdditionalInfo = data.some((edu) => edu.gpa || edu.honors?.length);
    if (hasAdditionalInfo) score += 0.1;

    return Math.min(score, 1);
  }
}
