// 工作经历智能解析器

import { BaseExtractor } from './base.extractor';
import { Experience, ExtractionResult } from '../types/extraction.types';
import {
  ChinesePatternsUtil,
  COMPANY_TYPE_KEYWORDS,
  POSITION_LEVELS,
  DATE_PATTERNS,
} from '../utils/chinese-patterns.util';

export class ExperienceExtractor extends BaseExtractor<Experience[]> {
  // 行业分类关键词
  private readonly industryKeywords = {
    internet: ['互联网', '电商', '在线', '网络', '平台', 'IT', '科技', '软件'],
    finance: ['银行', '金融', '投资', '保险', '证券', '基金', '支付', 'P2P'],
    manufacturing: ['制造', '生产', '工厂', '设备', '机械', '汽车', '电子'],
    healthcare: ['医疗', '医院', '药品', '生物医学', '健康', '医药'],
    education: ['教育', '培训', '学校', '大学', '教学', '学习'],
    retail: ['零售', '商贸', '销售', '连锁', '超市', '商场'],
    realestate: ['房地产', '地产', '物业', '建筑', '装修'],
    media: ['媒体', '广告', '传媒', '出版', '新闻', '营销'],
    consulting: ['咨询', '顾问', '管理', '服务', '外包'],
    government: ['政府', '事业单位', '公务员', '机关', '国有'],
  };

  // 工作职责关键词
  private readonly responsibilityKeywords = [
    '负责',
    '主导',
    '参与',
    '协助',
    '管理',
    '开发',
    '设计',
    '实现',
    '维护',
    '优化',
    '分析',
    '策划',
    '执行',
    '监督',
    '指导',
    '培训',
  ];

  // 成就量化关键词
  private readonly achievementKeywords = {
    increase: ['提升', '增长', '提高', '改善', '优化', '增加'],
    decrease: ['降低', '减少', '节省', '缩短', '控制'],
    scale: ['万', '千', '百', '亿', '%', '倍', '人', '项', '个'],
    metrics: ['效率', '性能', '质量', '成本', '时间', '用户', '收入', '利润'],
  };

  /**
   * 提取工作经历信息
   */
  async extract(text: string): Promise<ExtractionResult<Experience[]>> {
    return this.safeExtract('ExperienceExtractor', async () => {
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
   * 使用规则提取工作经历
   */
  private extractWithRules(text: string): Experience[] {
    const experienceList: Experience[] = [];

    // 方法1: 查找工作经历章节
    const workSection = this.extractWorkSection(text);
    if (workSection) {
      experienceList.push(...this.parseWorkSection(workSection));
    }

    // 方法2: 查找公司+职位模式
    const companyPositionPairs = this.extractCompanyPositionPairs(text);
    companyPositionPairs.forEach((pair) => {
      if (
        !experienceList.some(
          (exp) =>
            exp.company === pair.company && exp.position === pair.position
        )
      ) {
        experienceList.push(pair);
      }
    });

    // 方法3: 查找时间+公司+职位的完整模式
    const timeCompanyPositionEntries =
      this.extractTimeCompanyPositionEntries(text);
    timeCompanyPositionEntries.forEach((entry) => {
      const existing = experienceList.find(
        (exp) =>
          exp.company === entry.company && exp.position === entry.position
      );
      if (existing) {
        // 合并信息
        Object.assign(existing, entry);
      } else {
        experienceList.push(entry);
      }
    });

    // 数据增强和清洗
    return experienceList.map((exp) => this.enhanceExperienceData(exp, text));
  }

  /**
   * 提取工作经历章节
   */
  private extractWorkSection(text: string): string | null {
    const sectionPatterns = [
      /(?:工作经历|工作经验|职业经历|Employment|Work Experience|Professional)[：:\s]*\n?([\s\S]*?)(?=\n(?:教育|项目|技能|Education|Projects|Skills)|$)/i,
      /(?:工作|经历)[：:\s]*\n?([\s\S]*?)(?=\n(?:教育|项目|技能|Education|Projects|Skills)|$)/i,
    ];

    for (const pattern of sectionPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const section = match[1].trim();
        if (section.length > 20) {
          return section;
        }
      }
    }

    return null;
  }

  /**
   * 解析工作经历章节
   */
  private parseWorkSection(section: string): Experience[] {
    const experienceList: Experience[] = [];
    const entries = this.splitWorkEntries(section);

    entries.forEach((entry) => {
      const experience = this.parseWorkEntry(entry);
      if (experience.company && experience.position) {
        experienceList.push(experience);
      }
    });

    return experienceList;
  }

  /**
   * 分割工作条目
   */
  private splitWorkEntries(section: string): string[] {
    const entries: string[] = [];
    const lines = section
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    let currentEntry: string[] = [];

    for (const line of lines) {
      // 检查是否是新的工作经历开始
      if (this.isWorkEntryStart(line) && currentEntry.length > 0) {
        entries.push(currentEntry.join('\n'));
        currentEntry = [line];
      } else {
        currentEntry.push(line);
      }
    }

    // 添加最后一个条目
    if (currentEntry.length > 0) {
      entries.push(currentEntry.join('\n'));
    }

    return entries;
  }

  /**
   * 判断是否是工作条目开始
   */
  private isWorkEntryStart(line: string): boolean {
    // 包含时间和公司的行通常是开始行
    const hasDate =
      DATE_PATTERNS.year.test(line) || DATE_PATTERNS.date_range.test(line);
    const hasCompany = this.containsCompanyPattern(line);
    const hasPosition = this.containsPositionPattern(line);

    return (hasDate && hasCompany) || (hasCompany && hasPosition);
  }

  /**
   * 解析单个工作条目
   */
  private parseWorkEntry(entry: string): Experience {
    const lines = entry.split('\n').map((line) => line.trim());
    const firstLine = lines[0];

    const experience: Partial<Experience> = {
      responsibilities: [],
      achievements: [],
    };

    // 解析第一行（通常包含时间、公司、职位）
    this.parseFirstLine(firstLine, experience);

    // 解析其他行（职责、成就等）
    lines.slice(1).forEach((line) => {
      this.parseAdditionalLine(line, experience);
    });

    return this.completeExperienceRecord(experience);
  }

  /**
   * 解析首行信息
   */
  private parseFirstLine(line: string, experience: Partial<Experience>): void {
    // 提取时间
    const dateRange = this.extractDateRange(line);
    experience.start_date = dateRange.start_date;
    experience.end_date = dateRange.end_date;
    experience.is_current = dateRange.is_current;

    // 提取公司
    const company = this.extractCompanyFromLine(line);
    if (company) {
      experience.company = company;
      experience.company_type =
        ChinesePatternsUtil.identifyCompanyType(company);
    }

    // 提取职位
    const position = this.extractPositionFromLine(line);
    if (position) {
      experience.position = position;
    }

    // 提取地点
    const location = this.extractLocationFromLine(line);
    if (location) {
      experience.location = location;
    }
  }

  /**
   * 解析附加行信息
   */
  private parseAdditionalLine(
    line: string,
    experience: Partial<Experience>
  ): void {
    // 职责描述
    if (this.isResponsibilityLine(line)) {
      if (!experience.responsibilities) experience.responsibilities = [];
      experience.responsibilities.push(line);
    }

    // 成就描述
    if (this.isAchievementLine(line)) {
      if (!experience.achievements) experience.achievements = [];
      experience.achievements.push(line);
    }

    // 补充信息提取
    this.extractSupplementaryInfo(line, experience);
  }

  /**
   * 提取公司+职位对
   */
  private extractCompanyPositionPairs(text: string): Experience[] {
    const pairs: Experience[] = [];

    // 模式1: 公司名 + 职位
    const pattern1 =
      /([一-龯]{2,20}(?:公司|集团|企业|科技|网络|信息))[^。\n]{0,50}?([一-龯]{2,15}(?:工程师|经理|总监|专员|助理|主管|负责人))/g;
    let match;

    while ((match = pattern1.exec(text)) !== null) {
      const company = match[1];
      const position = match[2];

      if (this.isValidCompany(company) && this.isValidPosition(position)) {
        pairs.push({
          company,
          position,
          industry: this.identifyIndustry(company),
          company_type: ChinesePatternsUtil.identifyCompanyType(company),
          responsibilities: [],
          achievements: [],
        });
      }
    }

    return pairs;
  }

  /**
   * 提取时间+公司+职位条目
   */
  private extractTimeCompanyPositionEntries(text: string): Experience[] {
    const entries: Experience[] = [];

    // 查找包含完整信息的行
    const lines = text.split('\n');

    lines.forEach((line) => {
      const hasDate = DATE_PATTERNS.date_range.test(line);
      const company = this.extractCompanyFromLine(line);
      const position = this.extractPositionFromLine(line);

      if (hasDate && company && position) {
        const dateRange = this.extractDateRange(line);
        entries.push({
          company,
          position,
          start_date: dateRange.start_date,
          end_date: dateRange.end_date,
          is_current: dateRange.is_current,
          industry: this.identifyIndustry(company),
          company_type: ChinesePatternsUtil.identifyCompanyType(company),
          location: this.extractLocationFromLine(line),
          responsibilities: [],
          achievements: [],
        });
      }
    });

    return entries;
  }

  /**
   * 从行中提取公司名
   */
  private extractCompanyFromLine(line: string): string {
    const companyPatterns = [
      /([一-龯A-Za-z0-9]{2,30}(?:公司|集团|企业|科技|网络|信息|系统|软件|技术|服务|咨询|投资|银行|保险|证券|医院|学校|大学))/,
      /([A-Za-z]{2,20}(?:\s+[A-Za-z]{2,20})*(?:\s+(?:Inc|Corp|Ltd|LLC|Co))?)/,
    ];

    for (const pattern of companyPatterns) {
      const match = line.match(pattern);
      if (match && this.isValidCompany(match[1])) {
        return match[1];
      }
    }

    return '';
  }

  /**
   * 从行中提取职位名
   */
  private extractPositionFromLine(line: string): string {
    const positionPatterns = [
      /([一-龯]{2,15}(?:工程师|经理|总监|专员|助理|主管|负责人|顾问|分析师|设计师|开发|运营|产品|技术|市场|销售))/,
      /([A-Za-z\s]{5,30}(?:Engineer|Manager|Director|Analyst|Designer|Developer|Specialist|Coordinator|Lead))/i,
    ];

    for (const pattern of positionPatterns) {
      const match = line.match(pattern);
      if (match && this.isValidPosition(match[1])) {
        return match[1];
      }
    }

    return '';
  }

  /**
   * 从行中提取地点信息
   */
  private extractLocationFromLine(line: string): string {
    const locationMatch = line.match(/([一-龯]{2,10}(?:市|省|区|县))/);
    return locationMatch ? locationMatch[1] : '';
  }

  /**
   * 提取时间范围
   */
  private extractDateRange(text: string): {
    start_date?: string;
    end_date?: string;
    is_current?: boolean;
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
   * 识别行业
   */
  private identifyIndustry(company: string): string {
    for (const [industry, keywords] of Object.entries(this.industryKeywords)) {
      if (keywords.some((keyword) => company.includes(keyword))) {
        return industry;
      }
    }
    return 'other';
  }

  /**
   * 判断是否是职责描述行
   */
  private isResponsibilityLine(line: string): boolean {
    return this.responsibilityKeywords.some((keyword) =>
      line.includes(keyword)
    );
  }

  /**
   * 判断是否是成就描述行
   */
  private isAchievementLine(line: string): boolean {
    const hasAchievementKeyword = this.achievementKeywords.increase
      .concat(this.achievementKeywords.decrease)
      .some((keyword) => line.includes(keyword));

    const hasScale = this.achievementKeywords.scale.some((keyword) =>
      line.includes(keyword)
    );

    return hasAchievementKeyword && hasScale;
  }

  /**
   * 提取补充信息
   */
  private extractSupplementaryInfo(
    line: string,
    experience: Partial<Experience>
  ): void {
    // 团队规模
    const teamSizeMatch = line.match(/(?:团队|小组)[^0-9]*(\d+)[^0-9]*人/);
    if (teamSizeMatch) {
      experience.team_size = parseInt(teamSizeMatch[1]);
    }

    // 薪资范围
    const salaryMatch = line.match(
      /(?:薪资|工资|月薪)[：:]?\s*(\d+[kK万]*-?\d*[kK万]*)/
    );
    if (salaryMatch) {
      experience.salary_range = salaryMatch[1];
    }
  }

  /**
   * 包含公司模式
   */
  private containsCompanyPattern(line: string): boolean {
    return /[一-龯A-Za-z0-9]{2,20}(?:公司|集团|企业|科技|网络|信息|系统|软件|技术|服务|咨询|投资|银行|保险|证券|医院|学校|大学)/.test(
      line
    );
  }

  /**
   * 包含职位模式
   */
  private containsPositionPattern(line: string): boolean {
    return /[一-龯]{2,15}(?:工程师|经理|总监|专员|助理|主管|负责人|顾问|分析师|设计师|开发|运营|产品|技术|市场|销售)/.test(
      line
    );
  }

  /**
   * 验证公司名称
   */
  private isValidCompany(company: string): boolean {
    if (!company || company.length < 2 || company.length > 50) return false;

    // 排除明显不是公司的词汇
    const excludeWords = ['工作', '职位', '经历', '负责', '参与'];
    return !excludeWords.some((word) => company.includes(word));
  }

  /**
   * 验证职位名称
   */
  private isValidPosition(position: string): boolean {
    if (!position || position.length < 2 || position.length > 30) return false;

    // 排除明显不是职位的词汇
    const excludeWords = ['公司', '企业', '工作', '年'];
    return !excludeWords.some((word) => position.includes(word));
  }

  /**
   * 完善工作经历记录
   */
  private completeExperienceRecord(
    experience: Partial<Experience>
  ): Experience {
    return {
      company: experience.company || '',
      position: experience.position || '',
      industry: experience.industry,
      start_date: experience.start_date,
      end_date: experience.end_date,
      is_current: experience.is_current || false,
      location: experience.location,
      responsibilities: experience.responsibilities || [],
      achievements: experience.achievements || [],
      team_size: experience.team_size,
      salary_range: experience.salary_range,
      company_type: (experience.company_type as any) || 'other',
    };
  }

  /**
   * 增强工作经历数据
   */
  private enhanceExperienceData(
    experience: Experience,
    fullText: string
  ): Experience {
    // 补充行业信息
    if (!experience.industry) {
      experience.industry = this.identifyIndustry(experience.company);
    }

    // 补充公司类型
    if (!experience.company_type || experience.company_type === 'other') {
      experience.company_type = ChinesePatternsUtil.identifyCompanyType(
        experience.company
      ) as any;
    }

    // 补充职责和成就（从全文中搜索相关内容）
    if (
      experience.responsibilities.length === 0 ||
      experience.achievements.length === 0
    ) {
      const relatedContent = this.findRelatedContent(
        fullText,
        experience.company,
        experience.position
      );

      relatedContent.forEach((content) => {
        if (
          this.isResponsibilityLine(content) &&
          experience.responsibilities.length < 5
        ) {
          experience.responsibilities.push(content);
        } else if (
          this.isAchievementLine(content) &&
          experience.achievements.length < 5
        ) {
          experience.achievements.push(content);
        }
      });
    }

    return experience;
  }

  /**
   * 查找相关内容
   */
  private findRelatedContent(
    text: string,
    company: string,
    position: string
  ): string[] {
    const lines = text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    const relatedLines: string[] = [];

    lines.forEach((line) => {
      if (line.includes(company) || line.includes(position)) {
        relatedLines.push(line);
      }
    });

    return relatedLines;
  }

  /**
   * 验证提取结果
   */
  validateResult(data: Experience[]): boolean {
    if (!Array.isArray(data)) return false;

    return data.every(
      (experience) =>
        experience.company &&
        experience.position &&
        this.isValidCompany(experience.company) &&
        this.isValidPosition(experience.position)
    );
  }

  /**
   * 获取验证警告
   */
  private validateAndGetWarnings(data: Experience[]): string[] {
    const warnings: string[] = [];

    if (!Array.isArray(data) || data.length === 0) {
      warnings.push('未能提取到工作经历信息');
      return warnings;
    }

    data.forEach((experience, index) => {
      if (!experience.company) {
        warnings.push(`工作经历${index + 1}缺少公司信息`);
      }

      if (!experience.position) {
        warnings.push(`工作经历${index + 1}缺少职位信息`);
      }

      if (!experience.start_date) {
        warnings.push(`工作经历${index + 1}缺少开始时间`);
      }

      if (
        !experience.responsibilities ||
        experience.responsibilities.length === 0
      ) {
        warnings.push(`工作经历${index + 1}缺少职责描述`);
      }
    });

    return warnings;
  }

  /**
   * 计算正则匹配得分
   */
  protected calculateRegexMatchScore(data: Experience[]): number {
    if (!Array.isArray(data) || data.length === 0) return 0;

    let totalScore = 0;

    data.forEach((experience) => {
      let score = 0;
      let checks = 0;

      // 公司名称验证
      if (experience.company) {
        checks++;
        if (this.isValidCompany(experience.company)) score++;
      }

      // 职位名称验证
      if (experience.position) {
        checks++;
        if (this.isValidPosition(experience.position)) score++;
      }

      // 时间信息验证
      if (experience.start_date) {
        checks++;
        score++; // 有时间信息就加分
      }

      totalScore += checks > 0 ? score / checks : 0;
    });

    return data.length > 0 ? totalScore / data.length : 0;
  }

  /**
   * 计算上下文相关性得分
   */
  protected calculateContextRelevanceScore(data: Experience[]): number {
    if (!Array.isArray(data) || data.length === 0) return 0;

    let score = 0;

    // 基础工作信息完整性
    const hasCompleteWork = data.some(
      (exp) => exp.company && exp.position && exp.start_date
    );
    if (hasCompleteWork) score += 0.3;

    // 职责描述完整性
    const hasResponsibilities = data.some(
      (exp) => exp.responsibilities && exp.responsibilities.length > 0
    );
    if (hasResponsibilities) score += 0.3;

    // 成就描述
    const hasAchievements = data.some(
      (exp) => exp.achievements && exp.achievements.length > 0
    );
    if (hasAchievements) score += 0.2;

    // 附加信息（行业、团队规模等）
    const hasAdditionalInfo = data.some(
      (exp) => exp.industry && exp.industry !== 'other'
    );
    if (hasAdditionalInfo) score += 0.2;

    return Math.min(score, 1);
  }
}
