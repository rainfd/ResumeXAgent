import { logger } from '../utils/logger';
import { AIService } from './ai.service';
import * as fs from 'fs';
import * as path from 'path';
import {
  SkillAnalysis,
  TechnicalSkill,
  SoftSkill,
  SkillCategory,
  SoftSkillCategory,
  SkillPriority,
  ProficiencyLevel,
  SkillDictionaryItem,
  SoftSkillDictionaryItem,
  SkillExtractionConfig,
  SkillAnalysisMetadata,
  SkillVisualization,
  WeightBoostRule,
} from '../types/skill.types';
import { IAIExtractionPrompt } from '../types/parser.types';

export class SkillExtractorService {
  private aiService: AIService;
  private technicalSkillsDict: Map<string, SkillDictionaryItem> = new Map();
  private softSkillsDict: Map<string, SoftSkillDictionaryItem> = new Map();
  private config: SkillExtractionConfig;

  constructor(config?: Partial<SkillExtractionConfig>) {
    this.aiService = new AIService();
    this.config = {
      useAI: true,
      aiModel: 'deepseek-chat',
      confidenceThreshold: 0.6,
      maxSkillsPerCategory: 20,
      includeVersions: true,
      filterGenericSkills: true,
      weightBoostRules: this.getDefaultWeightBoostRules(),
      ...config,
    };

    this.loadSkillDictionaries();
  }

  /**
   * 分析岗位描述的技能要求
   */
  async analyzeJobSkills(jobDescription: string, jobTitle?: string): Promise<SkillAnalysis> {
    const startTime = Date.now();
    
    try {
      logger.info('开始分析岗位技能要求', 'SkillExtractorService', { jobTitle });

      // 清理和预处理文本
      const cleanDescription = this.preprocessJobDescription(jobDescription);

      // 提取技术技能
      const technicalSkills = await this.extractTechnicalSkills(cleanDescription, jobTitle);

      // 提取软技能
      const softSkills = await this.extractSoftSkills(cleanDescription);

      // 应用技能过滤
      const filteredTechnicalSkills = this.filterRelevantSkills(technicalSkills, jobTitle || '');
      const filteredSoftSkills = this.filterSoftSkills(softSkills);

      // 生成可视化数据
      const visualizationData = this.generateVisualizationData(
        filteredTechnicalSkills,
        filteredSoftSkills
      );

      // 生成元数据
      const metadata = this.generateMetadata(
        filteredTechnicalSkills,
        filteredSoftSkills,
        Date.now() - startTime
      );

      const result: SkillAnalysis = {
        technicalSkills: filteredTechnicalSkills,
        softSkills: filteredSoftSkills,
        skillRequirements: this.consolidateSkillRequirements(filteredTechnicalSkills, filteredSoftSkills),
        visualizationData,
        metadata,
      };

      logger.info('岗位技能分析完成', 'SkillExtractorService', {
        technicalSkillCount: filteredTechnicalSkills.length,
        softSkillCount: filteredSoftSkills.length,
        processingTime: metadata.processingTime,
      });

      return result;
    } catch (error) {
      logger.error('岗位技能分析失败', 'SkillExtractorService', error instanceof Error ? error : undefined);
      throw new Error(`技能分析失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 提取技术技能
   */
  async extractTechnicalSkills(
    jobDescription: string, 
    jobTitle?: string
  ): Promise<TechnicalSkill[]> {
    const skills: TechnicalSkill[] = [];

    try {
      // 使用词典匹配
      const dictionarySkills = this.extractSkillsFromDictionary(jobDescription);
      skills.push(...dictionarySkills);

      // 如果启用AI增强，使用AI识别更多技能
      if (this.config.useAI) {
        const aiSkills = await this.extractTechnicalSkillsWithAI(jobDescription);
        skills.push(...aiSkills);
      }

      // 去重和合并
      const uniqueSkills = this.deduplicateSkills(skills);

      // 分析技能优先级
      const skillsWithPriority = uniqueSkills.map(skill => ({
        ...skill,
        priority: this.classifySkillPriority(skill.name, jobDescription),
      }));

      // 分析熟练度要求
      const skillsWithProficiency = skillsWithPriority.map(skill => ({
        ...skill,
        proficiency: this.extractSkillProficiency(skill.name, jobDescription),
      }));

      // 应用权重提升规则
      const skillsWithWeight = this.applyWeightBoosts(skillsWithProficiency, jobTitle || '');

      logger.info('技术技能提取完成', 'SkillExtractorService', {
        totalSkills: skillsWithWeight.length,
        requiredSkills: skillsWithWeight.filter(s => s.priority === SkillPriority.REQUIRED).length,
      });

      return skillsWithWeight;
    } catch (error) {
      logger.error('技术技能提取失败', 'SkillExtractorService', error instanceof Error ? error : undefined);
      return [];
    }
  }

  /**
   * 提取软技能
   */
  async extractSoftSkills(jobDescription: string): Promise<SoftSkill[]> {
    const skills: SoftSkill[] = [];

    try {
      // 使用词典匹配
      const dictionarySkills = this.extractSoftSkillsFromDictionary(jobDescription);
      skills.push(...dictionarySkills);

      // 如果启用AI增强，使用AI识别更多软技能
      if (this.config.useAI) {
        const aiSkills = await this.extractSoftSkillsWithAI(jobDescription);
        skills.push(...aiSkills);
      }

      // 去重和合并
      const uniqueSkills = this.deduplicate(skills, 'name');

      // 分析优先级
      const skillsWithPriority = uniqueSkills.map(skill => ({
        ...skill,
        priority: this.classifySkillPriority(skill.name, jobDescription),
      }));

      logger.info('软技能提取完成', 'SkillExtractorService', {
        totalSkills: skillsWithPriority.length,
      });

      return skillsWithPriority;
    } catch (error) {
      logger.error('软技能提取失败', 'SkillExtractorService', error instanceof Error ? error : undefined);
      return [];
    }
  }

  /**
   * 使用AI提取技术技能
   */
  private async extractTechnicalSkillsWithAI(jobDescription: string): Promise<TechnicalSkill[]> {
    const prompt = this.createTechnicalSkillPrompt();
    
    try {
      const result = await this.aiService.extractStructuredInfo(
        jobDescription,
        prompt,
        this.config.aiModel
      );

      if (!result.success || !result.data?.technical_skills) {
        logger.warn('AI技术技能提取失败或无结果', 'SkillExtractorService');
        return [];
      }

      const skills: TechnicalSkill[] = result.data.technical_skills.map((skillData: any) => ({
        name: skillData.skill || skillData.name,
        category: this.mapToSkillCategory(skillData.category),
        priority: this.mapToSkillPriority(skillData.priority),
        proficiency: this.mapToProficiencyLevel(skillData.proficiency),
        weight: skillData.weight || 5,
        aliases: skillData.aliases || [],
        version: skillData.version,
        context: skillData.evidence || skillData.context || '',
        yearRequirement: skillData.years || skillData.yearRequirement,
        evidence: skillData.evidence,
      }));

      return skills;
    } catch (error) {
      logger.error('AI技术技能提取异常', 'SkillExtractorService', error instanceof Error ? error : undefined);
      return [];
    }
  }

  /**
   * 使用AI提取软技能
   */
  private async extractSoftSkillsWithAI(jobDescription: string): Promise<SoftSkill[]> {
    const prompt = this.createSoftSkillPrompt();
    
    try {
      const result = await this.aiService.extractStructuredInfo(
        jobDescription,
        prompt,
        this.config.aiModel
      );

      if (!result.success || !result.data?.soft_skills) {
        logger.warn('AI软技能提取失败或无结果', 'SkillExtractorService');
        return [];
      }

      const skills: SoftSkill[] = result.data.soft_skills.map((skillData: any) => ({
        name: skillData.skill || skillData.name,
        category: this.mapToSoftSkillCategory(skillData.category),
        importance: skillData.importance || skillData.weight || 5,
        description: skillData.description || skillData.evidence || '',
        priority: this.mapToSkillPriority(skillData.priority),
        evidence: skillData.evidence,
      }));

      return skills;
    } catch (error) {
      logger.error('AI软技能提取异常', 'SkillExtractorService', error instanceof Error ? error : undefined);
      return [];
    }
  }

  /**
   * 从词典中提取技术技能
   */
  private extractSkillsFromDictionary(text: string): TechnicalSkill[] {
    const skills: TechnicalSkill[] = [];
    const lowerText = text.toLowerCase();

    for (const [key, dictItem] of this.technicalSkillsDict) {
      const allNames = [dictItem.name, ...dictItem.aliases];
      
      for (const name of allNames) {
        const pattern = new RegExp(`\\b${this.escapeRegExp(name.toLowerCase())}\\b`, 'gi');
        const matches = lowerText.match(pattern);
        
        if (matches) {
          // 检查上下文以避免误识别
          if (this.validateSkillContext(name, text)) {
            const skill: TechnicalSkill = {
              name: dictItem.name,
              category: dictItem.category,
              priority: SkillPriority.OPTIONAL, // 默认值，后续会重新分析
              proficiency: ProficiencyLevel.UNKNOWN,
              weight: dictItem.weight,
              aliases: dictItem.aliases,
              context: this.extractSkillContext(name, text),
              version: this.extractVersionInfo(name, text),
            };

            // 检查变体和版本信息
            const variant = this.findBestVariant(name, text, dictItem);
            if (variant) {
              skill.version = variant.version || skill.version;
              skill.context += variant.context ? ` (${variant.context})` : '';
            }

            // 如果没有从变体获取版本，尝试从文本中提取
            if (!skill.version) {
              skill.version = this.extractVersionInfo(dictItem.name, text);
            }

            skills.push(skill);
          }
          break; // 找到匹配就跳出别名循环
        }
      }
    }

    return skills;
  }

  /**
   * 从词典中提取软技能
   */
  private extractSoftSkillsFromDictionary(text: string): SoftSkill[] {
    const skills: SoftSkill[] = [];
    const lowerText = text.toLowerCase();

    for (const [key, dictItem] of this.softSkillsDict) {
      const allNames = [dictItem.name, ...dictItem.aliases];
      
      for (const name of allNames) {
        const pattern = new RegExp(`\\b${this.escapeRegExp(name.toLowerCase())}\\b`, 'gi');
        const matches = lowerText.match(pattern);
        
        if (matches || this.checkKeywordMatch(dictItem.keywords, lowerText)) {
          const skill: SoftSkill = {
            name: dictItem.name,
            category: dictItem.category,
            importance: dictItem.importance,
            description: dictItem.description,
            priority: SkillPriority.OPTIONAL, // 默认值，后续会重新分析
            evidence: this.extractSkillContext(name, text),
          };

          skills.push(skill);
          break; // 找到匹配就跳出别名循环
        }
      }
    }

    return skills;
  }

  /**
   * 分类技能优先级
   */
  private classifySkillPriority(skillName: string, context: string): SkillPriority {
    const lowerContext = context.toLowerCase();
    const skillPattern = skillName.toLowerCase();

    // 查找技能周围的文本
    const skillIndex = lowerContext.indexOf(skillPattern);
    if (skillIndex === -1) return SkillPriority.OPTIONAL;

    const beforeText = lowerContext.substring(Math.max(0, skillIndex - 50), skillIndex);
    const afterText = lowerContext.substring(skillIndex + skillPattern.length, 
                                           Math.min(lowerContext.length, skillIndex + skillPattern.length + 50));
    const surroundingText = beforeText + afterText;

    // 必需技能关键词
    const requiredKeywords = ['必须', '要求', '需要', '掌握', '具备', '熟练掌握', '精通', '必备'];
    const requiredScore = this.countKeywords(requiredKeywords, surroundingText);

    // 优先技能关键词
    const preferredKeywords = ['优先', '加分', '最好', '熟悉更佳', '有经验者优先', '了解'];
    const preferredScore = this.countKeywords(preferredKeywords, surroundingText);

    if (requiredScore > preferredScore && requiredScore > 0) {
      return SkillPriority.REQUIRED;
    } else if (preferredScore > 0) {
      return SkillPriority.PREFERRED;
    }

    return SkillPriority.OPTIONAL;
  }

  /**
   * 提取技能熟练度要求
   */
  private extractSkillProficiency(skillName: string, context: string): ProficiencyLevel {
    const lowerContext = context.toLowerCase();
    const skillPattern = skillName.toLowerCase();

    // 查找技能周围的文本，简化版本
    const skillIndex = lowerContext.indexOf(skillPattern);
    if (skillIndex === -1) return ProficiencyLevel.UNKNOWN;

    const beforeText = lowerContext.substring(Math.max(0, skillIndex - 20), skillIndex);
    const afterText = lowerContext.substring(skillIndex + skillPattern.length, 
                                           Math.min(lowerContext.length, skillIndex + skillPattern.length + 20));
    const surroundingText = beforeText + skillPattern + afterText;

    // 熟练度关键词匹配，按优先级从高到低排序
    const proficiencyPatterns = [
      { level: ProficiencyLevel.EXPERT, keywords: ['精通', '专家', '深入', '资深', '高级'] },
      { level: ProficiencyLevel.PROFICIENT, keywords: ['熟练', '掌握', '胜任'] },
      { level: ProficiencyLevel.FAMILIAR, keywords: ['熟悉', '了解', '接触', '使用过', '有经验'] },
      { level: ProficiencyLevel.BASIC, keywords: ['基础', '基本', '入门', '初步'] },
    ];

    // 使用更精确的匹配，按从高到低的优先级检查
    // 检查复合词组优先级更高（中文不需要单词边界）
    if (/熟练\s*掌握/gi.test(surroundingText)) return ProficiencyLevel.PROFICIENT;
    if (/精通/gi.test(surroundingText)) return ProficiencyLevel.EXPERT;
    if (/专家/gi.test(surroundingText)) return ProficiencyLevel.EXPERT;
    if (/深入/gi.test(surroundingText)) return ProficiencyLevel.EXPERT;
    if (/资深/gi.test(surroundingText)) return ProficiencyLevel.EXPERT;
    if (/高级/gi.test(surroundingText)) return ProficiencyLevel.EXPERT;
    if (/熟练/gi.test(surroundingText)) return ProficiencyLevel.PROFICIENT;
    if (/掌握/gi.test(surroundingText)) return ProficiencyLevel.PROFICIENT;
    if (/胜任/gi.test(surroundingText)) return ProficiencyLevel.PROFICIENT;
    if (/熟悉/gi.test(surroundingText)) return ProficiencyLevel.FAMILIAR;
    if (/了解/gi.test(surroundingText)) return ProficiencyLevel.FAMILIAR;
    if (/使用过/gi.test(surroundingText)) return ProficiencyLevel.FAMILIAR;
    if (/有经验/gi.test(surroundingText)) return ProficiencyLevel.FAMILIAR;
    if (/接触/gi.test(surroundingText)) return ProficiencyLevel.FAMILIAR;
    if (/基础/gi.test(surroundingText)) return ProficiencyLevel.BASIC;
    if (/基本/gi.test(surroundingText)) return ProficiencyLevel.BASIC;
    if (/入门/gi.test(surroundingText)) return ProficiencyLevel.BASIC;
    if (/初步/gi.test(surroundingText)) return ProficiencyLevel.BASIC;

    // 通过年限推断熟练度，查找紧邻技能的年限描述
    const skillContext = surroundingText;
    
    // 更精确的年限匹配，查找技能前后的年限
    const skillPos = skillContext.indexOf(skillPattern);
    if (skillPos !== -1) {
      // 在技能前查找年限
      const beforeSkill = skillContext.substring(0, skillPos);
      const afterSkill = skillContext.substring(skillPos + skillPattern.length);
      
      const yearPatterns = [
        /(\d+)\s*[年年]\s*以上/g,
        /(\d+)\s*年/g,
      ];
      
      for (const pattern of yearPatterns) {
        // 先检查技能后面
        const afterMatch = afterSkill.match(pattern);
        if (afterMatch) {
          const years = parseInt(afterMatch[0].match(/\d+/)![0]);
          if (years >= 5) return ProficiencyLevel.EXPERT;
          if (years >= 3) return ProficiencyLevel.PROFICIENT;
          if (years >= 2) return ProficiencyLevel.FAMILIAR;
          return ProficiencyLevel.BASIC;
        }
        
        // 再检查技能前面（不需要反转，直接匹配）
        const beforeMatch = beforeSkill.match(pattern);
        if (beforeMatch && beforeSkill.length < 30) { // 扩大查找范围到30个字符
          const years = parseInt(beforeMatch[beforeMatch.length - 1].match(/\d+/)![0]);
          if (years >= 5) return ProficiencyLevel.EXPERT;
          if (years >= 3) return ProficiencyLevel.PROFICIENT;
          if (years >= 2) return ProficiencyLevel.FAMILIAR;
          return ProficiencyLevel.BASIC;
        }
      }
    }

    return ProficiencyLevel.UNKNOWN;
  }

  /**
   * 过滤相关技能
   */
  private filterRelevantSkills(skills: TechnicalSkill[], jobTitle: string): TechnicalSkill[] {
    if (!this.config.filterGenericSkills) return skills;

    // 通用技能黑名单
    const genericSkills = ['Office', '办公软件', '沟通能力', '团队合作', '责任心'];
    
    let filtered = skills.filter(skill => {
      // 过滤通用技能
      if (genericSkills.some(generic => 
        skill.name.toLowerCase().includes(generic.toLowerCase()))) {
        return false;
      }

      // 过滤低权重技能
      if (skill.weight < this.config.confidenceThreshold * 10) {
        return false;
      }

      return true;
    });

    // 按类别限制数量
    const skillsByCategory = new Map<SkillCategory, TechnicalSkill[]>();
    filtered.forEach(skill => {
      if (!skillsByCategory.has(skill.category)) {
        skillsByCategory.set(skill.category, []);
      }
      skillsByCategory.get(skill.category)!.push(skill);
    });

    // 每个类别只保留前N个高权重技能
    filtered = [];
    skillsByCategory.forEach((categorySkills, category) => {
      const sorted = categorySkills.sort((a, b) => b.weight - a.weight);
      const limited = sorted.slice(0, this.config.maxSkillsPerCategory);
      filtered.push(...limited);
    });

    return filtered;
  }

  /**
   * 过滤软技能
   */
  private filterSoftSkills(skills: SoftSkill[]): SoftSkill[] {
    // 按重要性排序，保留前20个
    return skills
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 20);
  }

  // 辅助方法
  private loadSkillDictionaries(): void {
    try {
      // 加载技术技能词典
      const techSkillsPath = path.join(__dirname, '../data/technical-skills-dictionary.json');
      const techSkillsData = JSON.parse(fs.readFileSync(techSkillsPath, 'utf-8'));
      
      // 构建技术技能映射
      Object.values(techSkillsData).flat().forEach((item: any) => {
        if (item.name) {
          this.technicalSkillsDict.set(item.name.toLowerCase(), item);
          item.aliases?.forEach((alias: string) => {
            this.technicalSkillsDict.set(alias.toLowerCase(), item);
          });
        }
      });

      // 加载软技能词典
      const softSkillsPath = path.join(__dirname, '../data/soft-skills-dictionary.json');
      const softSkillsData = JSON.parse(fs.readFileSync(softSkillsPath, 'utf-8'));
      
      // 构建软技能映射
      Object.values(softSkillsData).flat().forEach((item: any) => {
        if (item.name) {
          this.softSkillsDict.set(item.name.toLowerCase(), item);
          item.aliases?.forEach((alias: string) => {
            this.softSkillsDict.set(alias.toLowerCase(), item);
          });
        }
      });

      logger.info('技能词典加载完成', 'SkillExtractorService', {
        technicalSkills: this.technicalSkillsDict.size,
        softSkills: this.softSkillsDict.size,
      });
    } catch (error) {
      logger.error('技能词典加载失败', 'SkillExtractorService', error instanceof Error ? error : undefined);
      // 继续运行，但会降级到仅AI模式
    }
  }

  private preprocessJobDescription(text: string): string {
    return text
      .replace(/[【】]/g, '') // 移除特殊括号
      .replace(/\s+/g, ' ') // 标准化空格
      .trim();
  }

  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private countKeywords(keywords: string[], text: string): number {
    return keywords.reduce((count, keyword) => {
      const matches = text.match(new RegExp(keyword, 'gi'));
      return count + (matches ? matches.length : 0);
    }, 0);
  }

  private checkKeywordMatch(keywords: string[], text: string): boolean {
    return keywords.some(keyword => 
      text.includes(keyword.toLowerCase())
    );
  }

  private validateSkillContext(skillName: string, text: string): boolean {
    // 简化的上下文验证，实际可以更复杂
    const lowerText = text.toLowerCase();
    const skillPattern = skillName.toLowerCase();
    
    // 避免在否定上下文中识别技能
    const negativePatterns = ['不需要', '无需', '不要求', '除外'];
    const skillIndex = lowerText.indexOf(skillPattern);
    
    if (skillIndex > 0) {
      const beforeText = lowerText.substring(Math.max(0, skillIndex - 20), skillIndex);
      if (negativePatterns.some(pattern => beforeText.includes(pattern))) {
        return false;
      }
    }
    
    return true;
  }

  private extractSkillContext(skillName: string, text: string): string {
    const skillIndex = text.toLowerCase().indexOf(skillName.toLowerCase());
    if (skillIndex === -1) return '';
    
    const start = Math.max(0, skillIndex - 50);
    const end = Math.min(text.length, skillIndex + skillName.length + 50);
    
    return text.substring(start, end).trim();
  }

  private extractVersionInfo(skillName: string, text: string): string | undefined {
    if (!this.config.includeVersions) return undefined;
    
    const skillIndex = text.toLowerCase().indexOf(skillName.toLowerCase());
    if (skillIndex === -1) return undefined;
    
    // 在技能名称后查找版本号
    const afterSkillText = text.substring(skillIndex + skillName.length, skillIndex + skillName.length + 30);
    
    const versionPatterns = [
      // React 18, Node.js 20 等
      new RegExp(`${this.escapeRegExp(skillName)}\\s*(\\d+)`, 'i'),
      // React 18.0, Python 3.10 等
      new RegExp(`${this.escapeRegExp(skillName)}\\s*(\\d+\\.\\d+)`, 'i'), 
      // ES版本
      /(ES\d+|ES20\d+)/i,
      // Java版本
      /(Java\s*\d+|JDK\s*\d+)/i,
    ];
    
    // 首先在技能后面的文本中查找
    for (const pattern of versionPatterns) {
      const matches = text.substring(skillIndex).match(pattern);
      if (matches && matches[1]) {
        return matches[1];
      }
    }
    
    // 如果没找到，在整个上下文中查找
    const context = this.extractSkillContext(skillName, text);
    for (const pattern of versionPatterns.slice(2)) { // 跳过技能特定的模式
      const matches = context.match(pattern);
      if (matches) {
        return matches[0].replace(/\s+/g, '');
      }
    }
    
    return undefined;
  }

  // 更多辅助方法...
  private deduplicateSkills(skills: TechnicalSkill[]): TechnicalSkill[] {
    const uniqueSkills = new Map<string, TechnicalSkill>();
    
    skills.forEach(skill => {
      const key = skill.name.toLowerCase();
      const existing = uniqueSkills.get(key);
      
      if (!existing || skill.weight > existing.weight) {
        uniqueSkills.set(key, skill);
      }
    });
    
    return Array.from(uniqueSkills.values());
  }

  private deduplicate<T>(items: T[], keyField: keyof T): T[] {
    const unique = new Map<any, T>();
    items.forEach(item => {
      const key = String(item[keyField]).toLowerCase();
      if (!unique.has(key)) {
        unique.set(key, item);
      }
    });
    return Array.from(unique.values());
  }

  // 映射方法
  private mapToSkillCategory(category: string): SkillCategory {
    const categoryMap: Record<string, SkillCategory> = {
      '编程语言': SkillCategory.PROGRAMMING_LANGUAGE,
      '开发框架': SkillCategory.FRAMEWORK,
      '数据库': SkillCategory.DATABASE,
      '开发工具': SkillCategory.TOOL,
      '云计算': SkillCategory.CLOUD,
      '操作系统': SkillCategory.OPERATING_SYSTEM,
      '版本控制': SkillCategory.VERSION_CONTROL,
      '测试工具': SkillCategory.TESTING,
      '运维部署': SkillCategory.DEVOPS,
    };
    
    return categoryMap[category] || SkillCategory.OTHER;
  }

  private mapToSoftSkillCategory(category: string): SoftSkillCategory {
    const categoryMap: Record<string, SoftSkillCategory> = {
      '沟通协调': SoftSkillCategory.COMMUNICATION,
      '领导管理': SoftSkillCategory.LEADERSHIP,
      '分析思维': SoftSkillCategory.ANALYTICAL,
      '学习能力': SoftSkillCategory.LEARNING,
      '团队协作': SoftSkillCategory.TEAMWORK,
      '项目管理': SoftSkillCategory.PROJECT_MANAGEMENT,
      '问题解决': SoftSkillCategory.PROBLEM_SOLVING,
      '创新创造': SoftSkillCategory.CREATIVITY,
    };
    
    return categoryMap[category] || SoftSkillCategory.OTHER;
  }

  private mapToSkillPriority(priority: string): SkillPriority {
    const priorityMap: Record<string, SkillPriority> = {
      'required': SkillPriority.REQUIRED,
      'preferred': SkillPriority.PREFERRED,
      'optional': SkillPriority.OPTIONAL,
      '必需': SkillPriority.REQUIRED,
      '优先': SkillPriority.PREFERRED,
      '可选': SkillPriority.OPTIONAL,
    };
    
    return priorityMap[priority] || SkillPriority.OPTIONAL;
  }

  private mapToProficiencyLevel(proficiency: string): ProficiencyLevel {
    const proficiencyMap: Record<string, ProficiencyLevel> = {
      'expert': ProficiencyLevel.EXPERT,
      'proficient': ProficiencyLevel.PROFICIENT,
      'familiar': ProficiencyLevel.FAMILIAR,
      'basic': ProficiencyLevel.BASIC,
      '精通': ProficiencyLevel.EXPERT,
      '熟练': ProficiencyLevel.PROFICIENT,
      '熟悉': ProficiencyLevel.FAMILIAR,
      '了解': ProficiencyLevel.BASIC,
    };
    
    return proficiencyMap[proficiency] || ProficiencyLevel.UNKNOWN;
  }

  // AI提示词创建方法
  private createTechnicalSkillPrompt(): IAIExtractionPrompt {
    return {
      systemPrompt: `你是一个专业的技术技能分析专家。从岗位描述中提取技术技能要求。

要求：
1. 识别编程语言、框架、数据库、工具等技术技能
2. 区分必需技能和优先技能
3. 识别技能熟练度要求
4. 提取技能版本要求
5. 避免提取通用技能（如Office、沟通能力等）

返回JSON格式，包含confidence字段（0-1之间的置信度）。`,
      userPrompt: `请从以下岗位描述中提取技术技能要求：

{{DESCRIPTION}}

请返回JSON格式：
{
  "technical_skills": [
    {
      "skill": "技能名称",
      "category": "技能分类",
      "priority": "必需/优先/可选",
      "proficiency": "精通/熟练/熟悉/了解",
      "weight": 8,
      "aliases": ["别名1", "别名2"],
      "version": "版本要求",
      "evidence": "原文证据",
      "years": 3
    }
  ],
  "confidence": 0.9,
  "warnings": []
}`,
      expectedFormat: {
        technical_skills: 'array',
        confidence: 'number',
        warnings: 'array',
      },
    };
  }

  private createSoftSkillPrompt(): IAIExtractionPrompt {
    return {
      systemPrompt: `你是一个专业的软技能分析专家。从岗位描述中提取软技能和个人素质要求。

要求：
1. 识别沟通、领导、分析、学习、团队协作等软技能
2. 区分技能重要性和优先级
3. 提取具体的素质要求描述
4. 避免重复和通用描述

返回JSON格式，包含confidence字段。`,
      userPrompt: `请从以下岗位描述中提取软技能要求：

{{DESCRIPTION}}

请返回JSON格式：
{
  "soft_skills": [
    {
      "skill": "技能名称",
      "category": "技能分类",
      "priority": "必需/优先/可选",
      "importance": 8,
      "description": "具体要求描述",
      "evidence": "原文证据"
    }
  ],
  "confidence": 0.85,
  "warnings": []
}`,
      expectedFormat: {
        soft_skills: 'array',
        confidence: 'number',
        warnings: 'array',
      },
    };
  }

  // 剩余方法的实现将在后续完成...
  private findBestVariant(skillName: string, text: string, dictItem: SkillDictionaryItem) {
    // 简化实现
    return dictItem.variants[0] || null;
  }

  private applyWeightBoosts(skills: TechnicalSkill[], jobTitle: string): TechnicalSkill[] {
    return skills.map(skill => ({
      ...skill,
      weight: Math.min(10, skill.weight + this.calculateWeightBoost(skill, jobTitle)),
    }));
  }

  private calculateWeightBoost(skill: TechnicalSkill, jobTitle: string): number {
    let boost = 0;
    
    // 标题匹配提升
    if (jobTitle.toLowerCase().includes(skill.name.toLowerCase())) {
      boost += 3;
    }
    
    // 优先级提升
    if (skill.priority === SkillPriority.REQUIRED) {
      boost += 2;
    } else if (skill.priority === SkillPriority.PREFERRED) {
      boost += 1;
    }
    
    return boost;
  }

  private consolidateSkillRequirements(technicalSkills: TechnicalSkill[], softSkills: SoftSkill[]) {
    // 简化实现
    return [];
  }

  private generateVisualizationData(technicalSkills: TechnicalSkill[], softSkills: SoftSkill[]): SkillVisualization {
    // 简化实现
    return {
      wordCloudData: [],
      categoryDistribution: [],
      proficiencyRadar: [],
      priorityBreakdown: [],
    };
  }

  private generateMetadata(
    technicalSkills: TechnicalSkill[], 
    softSkills: SoftSkill[], 
    processingTime: number
  ): SkillAnalysisMetadata {
    return {
      totalSkillsFound: technicalSkills.length + softSkills.length,
      technicalSkillCount: technicalSkills.length,
      softSkillCount: softSkills.length,
      requiredSkillCount: technicalSkills.filter(s => s.priority === SkillPriority.REQUIRED).length,
      preferredSkillCount: technicalSkills.filter(s => s.priority === SkillPriority.PREFERRED).length,
      averageWeight: technicalSkills.reduce((sum, s) => sum + s.weight, 0) / (technicalSkills.length || 1),
      confidence: 0.8, // 简化计算
      processingTime,
      aiModel: this.config.aiModel,
      extractionMethod: this.config.useAI ? 'hybrid' : 'dictionary',
      warnings: [],
    };
  }

  private getDefaultWeightBoostRules(): WeightBoostRule[] {
    return [
      {
        condition: 'title_match',
        type: 'title_match',
        boost: 3,
        maxBoost: 5,
      },
      {
        condition: 'required_priority',
        type: 'custom',
        boost: 2,
      },
    ];
  }
}