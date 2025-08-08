// 项目经历深度提取器

import { BaseExtractor } from './base.extractor';
import {
  Project,
  STARElements,
  ExtractionResult,
} from '../types/extraction.types';
import {
  ChinesePatternsUtil,
  SKILL_CATEGORIES,
  DATE_PATTERNS,
} from '../utils/chinese-patterns.util';

export class ProjectsExtractor extends BaseExtractor<Project[]> {
  // 项目类型关键词
  private readonly projectTypeKeywords = {
    personal: ['个人项目', '自主开发', '个人作品', '独立开发', '业余项目'],
    team: ['团队项目', '合作开发', '小组项目', '协作项目', '团队作品'],
    commercial: ['商业项目', '企业项目', '生产项目', '线上项目', '正式项目'],
    academic: ['学术项目', '研究项目', '课程项目', '毕业设计', '学校项目'],
    open_source: ['开源项目', 'GitHub', '开源贡献', '社区项目'],
  };

  // 技术栈识别
  private readonly techStackPatterns = {
    frontend: [
      'React',
      'Vue',
      'Angular',
      'JavaScript',
      'TypeScript',
      'HTML',
      'CSS',
      'jQuery',
      '前端',
    ],
    backend: [
      'Java',
      'Python',
      'Node.js',
      'Spring',
      'Django',
      'Express',
      'PHP',
      'Go',
      '后端',
    ],
    mobile: [
      'Android',
      'iOS',
      'Flutter',
      'React Native',
      'Swift',
      'Kotlin',
      '移动端',
    ],
    database: ['MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Oracle', '数据库'],
    cloud: ['AWS', '阿里云', '腾讯云', 'Docker', 'Kubernetes', '云服务'],
    ai: ['机器学习', '深度学习', 'TensorFlow', 'PyTorch', 'AI', '人工智能'],
    tools: ['Git', 'Jenkins', 'Maven', 'Gradle', 'Webpack', '工具'],
  };

  // 角色关键词
  private readonly roleKeywords = {
    leader: [
      '负责人',
      '项目经理',
      '技术负责人',
      '团队负责人',
      '主导',
      'PM',
      'Tech Lead',
    ],
    developer: ['开发工程师', '程序员', '开发者', '工程师', 'Developer'],
    designer: ['设计师', 'UI设计', 'UX设计', '界面设计', 'Designer'],
    tester: ['测试工程师', '测试员', 'QA', '质量保证'],
    participant: ['参与者', '团队成员', '贡献者', '协作者'],
  };

  // STAR法则关键词
  private readonly starKeywords = {
    situation: ['背景', '情况', '环境', '现状', '问题', '挑战', '需求'],
    task: ['任务', '目标', '要求', '职责', '负责', '承担'],
    action: ['实现', '开发', '设计', '采用', '使用', '解决', '优化', '改进'],
    result: ['效果', '结果', '成果', '提升', '改善', '完成', '达到', '实现'],
  };

  /**
   * 提取项目经历信息
   */
  async extract(text: string): Promise<ExtractionResult<Project[]>> {
    return this.safeExtract('ProjectsExtractor', async () => {
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
   * 使用规则提取项目经历
   */
  private extractWithRules(text: string): Project[] {
    const projectList: Project[] = [];

    // 方法1: 查找项目经历章节
    const projectSection = this.extractProjectSection(text);
    if (projectSection) {
      projectList.push(...this.parseProjectSection(projectSection));
    }

    // 方法2: 查找项目名称模式
    const projectNameEntries = this.extractProjectNameEntries(text);
    projectNameEntries.forEach((entry) => {
      if (!projectList.some((proj) => proj.name === entry.name)) {
        projectList.push(entry);
      }
    });

    // 方法3: 查找技术栈+项目描述模式
    const techProjectPairs = this.extractTechProjectPairs(text);
    techProjectPairs.forEach((pair) => {
      const existing = projectList.find(
        (proj) =>
          this.isSimilarProject(proj.name, pair.name) ||
          this.isSimilarProject(proj.description, pair.description)
      );
      if (existing) {
        // 合并技术栈和其他信息
        this.mergeProjectInfo(existing, pair);
      } else {
        projectList.push(pair);
      }
    });

    // 数据增强和清洗
    return projectList.map((proj) => this.enhanceProjectData(proj, text));
  }

  /**
   * 提取项目经历章节
   */
  private extractProjectSection(text: string): string | null {
    const sectionPatterns = [
      /(?:项目经历|项目经验|项目作品|Projects|Project Experience)[：:\s]*\n?([\s\S]*?)(?=\n(?:教育|工作|技能|Education|Work|Skills)|$)/i,
      /(?:项目|作品)[：:\s]*\n?([\s\S]*?)(?=\n(?:教育|工作|技能|Education|Work|Skills)|$)/i,
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
   * 解析项目经历章节
   */
  private parseProjectSection(section: string): Project[] {
    const projectList: Project[] = [];
    const entries = this.splitProjectEntries(section);

    entries.forEach((entry) => {
      const project = this.parseProjectEntry(entry);
      if (project.name && project.description) {
        projectList.push(project);
      }
    });

    return projectList;
  }

  /**
   * 分割项目条目
   */
  private splitProjectEntries(section: string): string[] {
    const entries: string[] = [];
    const lines = section
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    let currentEntry: string[] = [];

    for (const line of lines) {
      // 检查是否是新的项目条目开始
      if (this.isProjectEntryStart(line) && currentEntry.length > 0) {
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
   * 判断是否是项目条目开始
   */
  private isProjectEntryStart(line: string): boolean {
    // 包含项目名称模式的行
    const hasProjectName =
      /[一-龯A-Za-z0-9]{2,30}(?:系统|平台|网站|应用|项目|App|管理系统)/.test(
        line
      );

    // 包含时间信息的行
    const hasDate =
      DATE_PATTERNS.year.test(line) || DATE_PATTERNS.date_range.test(line);

    // 包含技术栈的行
    const hasTech = Object.values(this.techStackPatterns)
      .flat()
      .some((tech) => line.toLowerCase().includes(tech.toLowerCase()));

    return hasProjectName || (hasDate && hasTech);
  }

  /**
   * 解析单个项目条目
   */
  private parseProjectEntry(entry: string): Project {
    const lines = entry.split('\n').map((line) => line.trim());
    const firstLine = lines[0];

    const project: Partial<Project> = {
      technologies: [],
      achievements: [],
    };

    // 解析第一行（通常包含项目名称、时间等）
    this.parseProjectFirstLine(firstLine, project);

    // 解析其他行（描述、技术栈、成就等）
    lines.slice(1).forEach((line) => {
      this.parseProjectAdditionalLine(line, project);
    });

    // 分析STAR要素
    project.star_elements = this.analyzeSTARElements(entry);

    return this.completeProjectRecord(project);
  }

  /**
   * 解析项目首行信息
   */
  private parseProjectFirstLine(line: string, project: Partial<Project>): void {
    // 提取项目名称
    const projectName = this.extractProjectNameFromLine(line);
    if (projectName) {
      project.name = projectName;
    }

    // 提取时间信息
    const dateRange = this.extractDateRange(line);
    project.start_date = dateRange.start_date;
    project.end_date = dateRange.end_date;

    // 提取项目类型
    project.type = this.identifyProjectType(line);

    // 提取角色
    project.role = this.extractRoleFromLine(line);

    // 提取技术栈（如果在首行）
    const techs = this.extractTechnologiesFromLine(line);
    if (techs.length > 0) {
      project.technologies = techs;
    }
  }

  /**
   * 解析项目附加行信息
   */
  private parseProjectAdditionalLine(
    line: string,
    project: Partial<Project>
  ): void {
    // 项目描述
    if (!project.description && this.isDescriptionLine(line)) {
      project.description = line;
    } else if (project.description && this.isDescriptionLine(line)) {
      project.description += ' ' + line;
    }

    // 技术栈
    const techs = this.extractTechnologiesFromLine(line);
    if (techs.length > 0) {
      if (!project.technologies) project.technologies = [];
      project.technologies.push(...techs);
    }

    // 成就
    if (this.isAchievementLine(line)) {
      if (!project.achievements) project.achievements = [];
      project.achievements.push(line);
    }

    // URL提取
    if (!project.url) {
      const url = this.extractURLFromLine(line);
      if (url) project.url = url;
    }

    // GitHub链接提取
    if (!project.url) {
      const github = this.extractGitHubFromLine(line);
      if (github) project.url = github;
    }

    // 角色信息补充
    if (!project.role) {
      const role = this.extractRoleFromLine(line);
      if (role) project.role = role;
    }
  }

  /**
   * 提取项目名称条目
   */
  private extractProjectNameEntries(text: string): Project[] {
    const entries: Project[] = [];

    // 匹配项目名称模式
    const projectNamePattern =
      /([一-龯A-Za-z0-9\s]{2,30}(?:系统|平台|网站|应用|项目|App|管理系统|小程序))/g;
    let match;

    while ((match = projectNamePattern.exec(text)) !== null) {
      const projectName = match[1].trim();

      if (this.isValidProjectName(projectName)) {
        // 提取项目周边信息
        const context = this.getProjectContext(text, match.index);

        entries.push({
          name: projectName,
          description: context.description || '',
          type: context.type || 'other',
          technologies: context.technologies || [],
          role: context.role || '',
          start_date: context.start_date,
          end_date: context.end_date,
          achievements: context.achievements || [],
          url: context.url,
          star_elements: context.star_elements,
        });
      }
    }

    return entries;
  }

  /**
   * 提取技术栈+项目对
   */
  private extractTechProjectPairs(text: string): Project[] {
    const pairs: Project[] = [];

    // 查找包含多种技术的行
    const lines = text.split('\n');

    lines.forEach((line) => {
      const technologies = this.extractTechnologiesFromLine(line);

      if (technologies.length >= 2) {
        // 至少包含2种技术
        const projectName =
          this.extractProjectNameFromLine(line) ||
          this.generateProjectNameFromTech(technologies);

        pairs.push({
          name: projectName,
          description: line,
          type: this.identifyProjectType(line),
          technologies,
          role: this.extractRoleFromLine(line) || 'developer',
          achievements: [],
        });
      }
    });

    return pairs;
  }

  /**
   * 从行中提取项目名称
   */
  private extractProjectNameFromLine(line: string): string {
    const patterns = [
      /([一-龯A-Za-z0-9\s]{2,30}(?:系统|平台|网站|应用|项目|App|管理系统|小程序))/,
      /项目[：:]?\s*([一-龯A-Za-z0-9\s]{2,30})/,
      /([A-Za-z][A-Za-z0-9\s]{2,20}(?:System|Platform|App|Project|Website))/i,
    ];

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match && this.isValidProjectName(match[1])) {
        return match[1].trim();
      }
    }

    return '';
  }

  /**
   * 从行中提取技术栈
   */
  private extractTechnologiesFromLine(line: string): string[] {
    const technologies: string[] = [];

    // 检查所有技术栈类别
    Object.values(this.techStackPatterns)
      .flat()
      .forEach((tech) => {
        if (line.toLowerCase().includes(tech.toLowerCase())) {
          technologies.push(tech);
        }
      });

    // 去重
    return [...new Set(technologies)];
  }

  /**
   * 从行中提取角色
   */
  private extractRoleFromLine(line: string): string {
    for (const [roleType, keywords] of Object.entries(this.roleKeywords)) {
      for (const keyword of keywords) {
        if (line.includes(keyword)) {
          return this.standardizeRole(keyword);
        }
      }
    }
    return '';
  }

  /**
   * 从行中提取URL
   */
  private extractURLFromLine(line: string): string | undefined {
    const urlPattern = /(https?:\/\/[^\s]+)/;
    const match = line.match(urlPattern);
    return match ? match[1] : undefined;
  }

  /**
   * 从行中提取GitHub链接
   */
  private extractGitHubFromLine(line: string): string | undefined {
    const githubPattern = /(?:github\.com\/|GitHub[：:]\s*)([^\s]+)/i;
    const match = line.match(githubPattern);
    return match ? match[1] : undefined;
  }

  /**
   * 识别项目类型
   */
  private identifyProjectType(text: string): string {
    for (const [type, keywords] of Object.entries(this.projectTypeKeywords)) {
      if (keywords.some((keyword) => text.includes(keyword))) {
        return type;
      }
    }
    return 'other';
  }

  /**
   * 标准化角色名称
   */
  private standardizeRole(role: string): string {
    const roleMap: { [key: string]: string } = {
      负责人: '项目负责人',
      项目经理: '项目经理',
      技术负责人: '技术负责人',
      主导: '项目负责人',
      开发工程师: '开发工程师',
      程序员: '开发工程师',
      开发者: '开发工程师',
      设计师: '设计师',
      测试工程师: '测试工程师',
      参与者: '参与者',
    };

    return roleMap[role] || role;
  }

  /**
   * 分析STAR要素
   */
  private analyzeSTARElements(text: string): STARElements | undefined {
    const star: STARElements = {
      situation: [],
      task: [],
      action: [],
      result: [],
    };

    const lines = text.split('\n').map((line) => line.trim());

    lines.forEach((line) => {
      // 情况分析
      if (
        this.starKeywords.situation.some((keyword) => line.includes(keyword))
      ) {
        star.situation.push(line);
      }

      // 任务分析
      if (this.starKeywords.task.some((keyword) => line.includes(keyword))) {
        star.task.push(line);
      }

      // 行动分析
      if (this.starKeywords.action.some((keyword) => line.includes(keyword))) {
        star.action.push(line);
      }

      // 结果分析
      if (this.starKeywords.result.some((keyword) => line.includes(keyword))) {
        star.result.push(line);
      }
    });

    // 如果至少有3个要素，才返回STAR分析
    const elementCount = [
      star.situation,
      star.task,
      star.action,
      star.result,
    ].filter((arr) => arr.length > 0).length;

    return elementCount >= 2 ? star : undefined;
  }

  /**
   * 获取项目上下文信息
   */
  private getProjectContext(text: string, position: number): Partial<Project> {
    const contextStart = Math.max(0, position - 200);
    const contextEnd = Math.min(text.length, position + 200);
    const context = text.substring(contextStart, contextEnd);

    return {
      description: this.extractDescriptionFromContext(context),
      type: this.identifyProjectType(context),
      technologies: this.extractTechnologiesFromLine(context),
      role: this.extractRoleFromLine(context),
      ...this.extractDateRange(context),
      url:
        this.extractURLFromLine(context) || this.extractGitHubFromLine(context),
      achievements: this.extractAchievementsFromContext(context),
      star_elements: this.analyzeSTARElements(context),
    };
  }

  /**
   * 从上下文提取描述
   */
  private extractDescriptionFromContext(context: string): string {
    const lines = context
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    for (const line of lines) {
      if (this.isDescriptionLine(line) && line.length >= 10) {
        return line;
      }
    }

    return '';
  }

  /**
   * 从上下文提取成就
   */
  private extractAchievementsFromContext(context: string): string[] {
    const achievements: string[] = [];
    const lines = context.split('\n').map((line) => line.trim());

    lines.forEach((line) => {
      if (this.isAchievementLine(line)) {
        achievements.push(line);
      }
    });

    return achievements;
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
   * 判断是否是描述行
   */
  private isDescriptionLine(line: string): boolean {
    // 包含项目描述性词汇的行
    const descriptionKeywords = [
      '实现',
      '开发',
      '设计',
      '构建',
      '采用',
      '使用',
      '基于',
      '功能',
      '特点',
    ];
    return (
      descriptionKeywords.some((keyword) => line.includes(keyword)) &&
      line.length >= 10
    );
  }

  /**
   * 判断是否是成就行
   */
  private isAchievementLine(line: string): boolean {
    const achievementKeywords = [
      '提升',
      '改善',
      '优化',
      '减少',
      '增加',
      '完成',
      '达到',
      '实现',
    ];
    const hasMetric = /\d+(?:%|万|千|倍|人|天|小时|分钟)/.test(line);

    return (
      achievementKeywords.some((keyword) => line.includes(keyword)) && hasMetric
    );
  }

  /**
   * 验证项目名称
   */
  private isValidProjectName(name: string): boolean {
    if (!name || name.length < 2 || name.length > 50) return false;

    // 排除明显不是项目名的词汇
    const excludeWords = [
      '技术',
      '开发',
      '使用',
      '采用',
      '实现',
      '负责',
      '参与',
    ];
    return !excludeWords.some((word) => name.includes(word));
  }

  /**
   * 根据技术栈生成项目名
   */
  private generateProjectNameFromTech(technologies: string[]): string {
    const mainTech = technologies[0];
    return `基于${mainTech}的项目`;
  }

  /**
   * 判断项目是否相似
   */
  private isSimilarProject(name1: string, name2: string): boolean {
    if (!name1 || !name2) return false;

    const similarity = this.calculateStringSimilarity(name1, name2);
    return similarity > 0.7;
  }

  /**
   * 计算字符串相似度
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * 计算编辑距离
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * 合并项目信息
   */
  private mergeProjectInfo(existing: Project, newInfo: Project): void {
    // 合并技术栈
    const allTechs = [...existing.technologies, ...newInfo.technologies];
    existing.technologies = [...new Set(allTechs)];

    // 合并成就
    existing.achievements.push(...newInfo.achievements);

    // 补充缺失信息
    if (!existing.url && newInfo.url) existing.url = newInfo.url;
    // URL信息已经在前面合并处理了
    if (!existing.role && newInfo.role) existing.role = newInfo.role;
    if (!existing.start_date && newInfo.start_date)
      existing.start_date = newInfo.start_date;
    if (!existing.end_date && newInfo.end_date)
      existing.end_date = newInfo.end_date;
  }

  /**
   * 完善项目记录
   */
  private completeProjectRecord(project: Partial<Project>): Project {
    return {
      name: project.name || '',
      description: project.description || '',
      type: project.type || 'other',
      technologies: [...new Set(project.technologies || [])], // 去重
      role: project.role || 'participant',
      start_date: project.start_date,
      end_date: project.end_date,
      achievements: project.achievements || [],
      url: project.url,
      star_elements: project.star_elements,
    };
  }

  /**
   * 增强项目数据
   */
  private enhanceProjectData(project: Project, fullText: string): Project {
    // 补充项目类型
    if (!project.type || project.type === 'other') {
      project.type = this.identifyProjectType(fullText);
    }

    // 技术栈去重和分类
    project.technologies = [...new Set(project.technologies)];

    // 补充角色信息
    if (!project.role) {
      project.role = 'participant';
    }

    // 如果没有STAR要素，尝试从全文分析
    if (!project.star_elements) {
      const projectContext = this.findProjectInFullText(fullText, project.name);
      if (projectContext) {
        project.star_elements = this.analyzeSTARElements(projectContext);
      }
    }

    return project;
  }

  /**
   * 在全文中查找项目相关内容
   */
  private findProjectInFullText(
    text: string,
    projectName: string
  ): string | null {
    const lines = text.split('\n');
    const relevantLines: string[] = [];

    let inProjectContext = false;

    for (const line of lines) {
      if (line.includes(projectName)) {
        inProjectContext = true;
        relevantLines.push(line);
      } else if (
        inProjectContext &&
        this.isProjectRelatedLine(line, projectName)
      ) {
        relevantLines.push(line);
      } else if (inProjectContext && this.isNewSectionStart(line)) {
        break;
      }
    }

    return relevantLines.length > 0 ? relevantLines.join('\n') : null;
  }

  /**
   * 判断是否是项目相关行
   */
  private isProjectRelatedLine(line: string, projectName: string): boolean {
    const relatedKeywords = [
      '技术',
      '实现',
      '开发',
      '设计',
      '功能',
      '特点',
      '成果',
      '效果',
    ];
    return (
      relatedKeywords.some((keyword) => line.includes(keyword)) &&
      line.length >= 5
    );
  }

  /**
   * 判断是否是新章节开始
   */
  private isNewSectionStart(line: string): boolean {
    const sectionKeywords = [
      '工作经历',
      '教育背景',
      '技能',
      '获奖经历',
      '自我评价',
    ];
    return sectionKeywords.some((keyword) => line.includes(keyword));
  }

  /**
   * 验证提取结果
   */
  validateResult(data: Project[]): boolean {
    if (!Array.isArray(data)) return false;

    return data.every(
      (project) =>
        project.name &&
        project.description &&
        this.isValidProjectName(project.name)
    );
  }

  /**
   * 获取验证警告
   */
  private validateAndGetWarnings(data: Project[]): string[] {
    const warnings: string[] = [];

    if (!Array.isArray(data) || data.length === 0) {
      warnings.push('未能提取到项目经历信息');
      return warnings;
    }

    data.forEach((project, index) => {
      if (!project.name) {
        warnings.push(`项目${index + 1}缺少项目名称`);
      }

      if (!project.description) {
        warnings.push(`项目${index + 1}缺少项目描述`);
      }

      if (!project.technologies || project.technologies.length === 0) {
        warnings.push(`项目${index + 1}缺少技术栈信息`);
      }

      if (!project.role) {
        warnings.push(`项目${index + 1}缺少角色信息`);
      }
    });

    return warnings;
  }

  /**
   * 计算正则匹配得分
   */
  protected calculateRegexMatchScore(data: Project[]): number {
    if (!Array.isArray(data) || data.length === 0) return 0;

    let totalScore = 0;

    data.forEach((project) => {
      let score = 0;
      let checks = 0;

      // 项目名称验证
      if (project.name) {
        checks++;
        if (this.isValidProjectName(project.name)) score++;
      }

      // 技术栈验证
      if (project.technologies && project.technologies.length > 0) {
        checks++;
        score++; // 有技术栈就加分
      }

      // 描述完整性
      if (project.description && project.description.length >= 10) {
        checks++;
        score++;
      }

      totalScore += checks > 0 ? score / checks : 0;
    });

    return data.length > 0 ? totalScore / data.length : 0;
  }

  /**
   * 计算上下文相关性得分
   */
  protected calculateContextRelevanceScore(data: Project[]): number {
    if (!Array.isArray(data) || data.length === 0) return 0;

    let score = 0;

    // 基础项目信息完整性
    const hasCompleteProject = data.some(
      (proj) => proj.name && proj.description && proj.technologies.length > 0
    );
    if (hasCompleteProject) score += 0.3;

    // 技术栈多样性
    const allTechs = data.flatMap((proj) => proj.technologies);
    const uniqueTechs = new Set(allTechs);
    if (uniqueTechs.size >= 3) score += 0.2;

    // 角色信息
    const hasRole = data.some(
      (proj) => proj.role && proj.role !== 'participant'
    );
    if (hasRole) score += 0.2;

    // STAR要素分析
    const hasSTAR = data.some((proj) => proj.star_elements);
    if (hasSTAR) score += 0.2;

    // 时间信息
    const hasTimeInfo = data.some((proj) => proj.start_date);
    if (hasTimeInfo) score += 0.1;

    return Math.min(score, 1);
  }
}
