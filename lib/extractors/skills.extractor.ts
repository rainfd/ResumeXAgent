// 技能清单智能分类提取器

import { BaseExtractor } from './base.extractor';
import {
  Skills,
  TechnicalSkill,
  SkillItem,
  Language,
  Certification,
  ExtractionResult,
} from '../types/extraction.types';
import {
  ChinesePatternsUtil,
  SKILL_CATEGORIES,
} from '../utils/chinese-patterns.util';

export class SkillsExtractor extends BaseExtractor<Skills> {
  // 技术技能详细分类
  private readonly detailedTechSkills = {
    programming_languages: {
      keywords: [
        'Java',
        'Python',
        'JavaScript',
        'TypeScript',
        'C++',
        'C#',
        'Go',
        'PHP',
        'Ruby',
        'Swift',
        'Kotlin',
        'Scala',
        'Rust',
        'C',
      ],
      aliases: {
        JS: 'JavaScript',
        TS: 'TypeScript',
        'C++': 'C++',
        'C#': 'C#',
      },
    },
    frontend_frameworks: {
      keywords: [
        'React',
        'Vue',
        'Angular',
        'jQuery',
        'Bootstrap',
        'Ant Design',
        'Element UI',
        'Vant',
        'Next.js',
        'Nuxt.js',
        'Svelte',
      ],
      aliases: {
        'Vue.js': 'Vue',
        AngularJS: 'Angular',
        ReactJS: 'React',
      },
    },
    backend_frameworks: {
      keywords: [
        'Spring',
        'Spring Boot',
        'Django',
        'Flask',
        'Express',
        'Koa',
        'Gin',
        'Laravel',
        'Rails',
        'ASP.NET',
        'FastAPI',
      ],
      aliases: {
        SpringBoot: 'Spring Boot',
        'Express.js': 'Express',
        'Koa.js': 'Koa',
      },
    },
    databases: {
      keywords: [
        'MySQL',
        'PostgreSQL',
        'MongoDB',
        'Redis',
        'Oracle',
        'SQL Server',
        'SQLite',
        'Elasticsearch',
        'InfluxDB',
        'Cassandra',
      ],
      aliases: {
        Postgres: 'PostgreSQL',
        ES: 'Elasticsearch',
        ElasticSearch: 'Elasticsearch',
      },
    },
    cloud_services: {
      keywords: [
        'AWS',
        '阿里云',
        '腾讯云',
        '华为云',
        'Azure',
        'Google Cloud',
        'Docker',
        'Kubernetes',
        'K8s',
        '容器化',
        '微服务',
      ],
      aliases: {
        K8s: 'Kubernetes',
        GCP: 'Google Cloud',
        Aliyun: '阿里云',
      },
    },
    devops_tools: {
      keywords: [
        'Git',
        'SVN',
        'Jenkins',
        'GitLab CI',
        'GitHub Actions',
        'Maven',
        'Gradle',
        'Webpack',
        'Vite',
        'npm',
        'yarn',
      ],
      aliases: {
        Github: 'GitHub',
        Gitlab: 'GitLab',
      },
    },
    mobile_development: {
      keywords: [
        'Android',
        'iOS',
        'React Native',
        'Flutter',
        '小程序',
        '微信小程序',
        '支付宝小程序',
        'Xamarin',
        'Cordova',
      ],
      aliases: {
        RN: 'React Native',
        'WeChat Mini Program': '微信小程序',
      },
    },
    ai_ml: {
      keywords: [
        '机器学习',
        '深度学习',
        'TensorFlow',
        'PyTorch',
        'scikit-learn',
        'Pandas',
        'NumPy',
        'OpenCV',
        '自然语言处理',
        'NLP',
        '计算机视觉',
        'CV',
      ],
      aliases: {
        ML: '机器学习',
        DL: '深度学习',
        sklearn: 'scikit-learn',
      },
    },
    testing: {
      keywords: [
        '单元测试',
        '集成测试',
        'JUnit',
        'TestNG',
        'Jest',
        'Mocha',
        'Selenium',
        'Cypress',
        'Postman',
        '自动化测试',
      ],
      aliases: {
        'Unit Test': '单元测试',
        'Integration Test': '集成测试',
      },
    },
  };

  // 软技能关键词
  private readonly softSkillsKeywords = {
    communication: [
      '沟通能力',
      '表达能力',
      '演讲',
      '汇报',
      '文档写作',
      '技术写作',
    ],
    leadership: [
      '领导力',
      '团队管理',
      '项目管理',
      '人员管理',
      '团队协作',
      'PMP',
    ],
    problem_solving: [
      '问题解决',
      '分析能力',
      '逻辑思维',
      '创新思维',
      '批判性思维',
    ],
    learning: ['学习能力', '自学能力', '快速学习', '持续学习', '适应能力'],
    time_management: ['时间管理', '任务管理', '优先级管理', '计划能力'],
    collaboration: ['团队合作', '跨部门协作', '敏捷开发', 'Scrum', '协调能力'],
  };

  // 语言能力关键词
  private readonly languageKeywords = {
    english: ['英语', 'English', 'CET-4', 'CET-6', 'TOEFL', 'IELTS', 'GRE'],
    chinese: ['中文', '普通话', '汉语'],
    japanese: ['日语', 'Japanese', 'N1', 'N2', 'N3', 'N4', 'N5'],
    korean: ['韩语', 'Korean'],
    german: ['德语', 'German'],
    french: ['法语', 'French'],
    spanish: ['西班牙语', 'Spanish'],
  };

  // 证书认证关键词
  private readonly certificationKeywords = [
    'PMP',
    'CISSP',
    'AWS',
    '阿里云',
    '腾讯云',
    'Oracle',
    'Microsoft',
    'Google',
    'Red Hat',
    'Cisco',
    'VMware',
    'Salesforce',
    'CompTIA',
    'ITIL',
    '软考',
    '系统架构师',
    '信息系统项目管理师',
    '网络工程师',
    '数据库工程师',
    'CPA',
    'CFA',
    'FRM',
    'ACCA',
    '注册会计师',
  ];

  // 熟练度关键词
  private readonly proficiencyKeywords = {
    expert: ['精通', '专家级', '资深', '高级', 'Expert', '深度掌握'],
    advanced: ['熟练', '熟悉', '擅长', '较强', 'Advanced', '良好掌握'],
    intermediate: ['掌握', '了解', '一般', 'Intermediate', '基本掌握'],
    beginner: ['初级', '入门', '学习中', 'Beginner', '接触过'],
  };

  /**
   * 提取技能信息
   */
  async extract(text: string): Promise<ExtractionResult<Skills>> {
    return this.safeExtract('SkillsExtractor', async () => {
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
   * 使用规则提取技能
   */
  private extractWithRules(text: string): Partial<Skills> {
    const result: Partial<Skills> = {
      technical_skills: [],
      soft_skills: [],
      languages: [],
      certifications: [],
    };

    // 提取技术技能
    result.technical_skills = this.extractTechnicalSkills(text);

    // 提取软技能
    result.soft_skills = this.extractSoftSkills(text);

    // 提取语言能力
    result.languages = this.extractLanguages(text);

    // 提取证书认证
    result.certifications = this.extractCertifications(text);

    return result;
  }

  /**
   * 提取技术技能
   */
  private extractTechnicalSkills(text: string): TechnicalSkill[] {
    const technicalSkills: TechnicalSkill[] = [];

    // 查找技能章节
    const skillsSection = this.extractSkillsSection(text);
    const skillsText = skillsSection || text;

    // 为每个技能分类提取技能项
    Object.entries(this.detailedTechSkills).forEach(([category, config]) => {
      const skillItems = this.extractSkillsForCategory(
        skillsText,
        config,
        category
      );

      if (skillItems.length > 0) {
        technicalSkills.push({
          category: this.translateCategory(category),
          items: skillItems,
        });
      }
    });

    return technicalSkills;
  }

  /**
   * 提取技能章节
   */
  private extractSkillsSection(text: string): string | null {
    const sectionPatterns = [
      /(?:技能|专业技能|技术技能|Skills|Technical Skills)[：:\s]*\n?([\s\S]*?)(?=\n(?:教育|工作|项目|Education|Work|Projects)|$)/i,
      /(?:掌握技能|熟悉技术)[：:\s]*\n?([\s\S]*?)(?=\n(?:教育|工作|项目|Education|Work|Projects)|$)/i,
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
   * 为特定分类提取技能
   */
  private extractSkillsForCategory(
    text: string,
    config: any,
    category: string
  ): SkillItem[] {
    const skillItems: SkillItem[] = [];
    const foundSkills = new Set<string>();

    // 查找关键词
    config.keywords.forEach((keyword: string) => {
      if (
        text.toLowerCase().includes(keyword.toLowerCase()) ||
        text.includes(keyword)
      ) {
        const standardizedName = config.aliases[keyword] || keyword;

        if (!foundSkills.has(standardizedName)) {
          foundSkills.add(standardizedName);

          const proficiency = this.extractProficiencyForSkill(text, keyword);
          const yearsExperience = this.extractYearsExperience(text, keyword);

          skillItems.push({
            name: standardizedName,
            proficiency,
            years_experience: yearsExperience,
          });
        }
      }
    });

    return skillItems;
  }

  /**
   * 提取技能熟练度
   */
  private extractProficiencyForSkill(
    text: string,
    skill: string
  ): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
    // 在技能周围查找熟练度关键词
    const lines = text.split('\n');

    for (const line of lines) {
      if (
        line.toLowerCase().includes(skill.toLowerCase()) ||
        line.includes(skill)
      ) {
        // 检查熟练度关键词
        for (const [level, keywords] of Object.entries(
          this.proficiencyKeywords
        )) {
          if (keywords.some((keyword) => line.includes(keyword))) {
            return level as any;
          }
        }

        // 根据上下文推断
        if (
          line.includes('项目') ||
          line.includes('开发') ||
          line.includes('实现')
        ) {
          return 'advanced';
        } else if (line.includes('了解') || line.includes('学习')) {
          return 'intermediate';
        }
      }
    }

    return 'intermediate'; // 默认中级
  }

  /**
   * 提取工作年限
   */
  private extractYearsExperience(
    text: string,
    skill: string
  ): number | undefined {
    const lines = text.split('\n');

    for (const line of lines) {
      if (
        line.toLowerCase().includes(skill.toLowerCase()) ||
        line.includes(skill)
      ) {
        // 查找年限表达
        const yearMatch = line.match(/(\d+)\s*年/);
        if (yearMatch) {
          const years = parseInt(yearMatch[1]);
          if (years >= 0 && years <= 20) {
            return years;
          }
        }
      }
    }

    return undefined;
  }

  /**
   * 提取软技能
   */
  private extractSoftSkills(text: string): string[] {
    const softSkills: string[] = [];
    const foundSkills = new Set<string>();

    // 查找软技能关键词
    Object.values(this.softSkillsKeywords)
      .flat()
      .forEach((skill) => {
        if (text.includes(skill) && !foundSkills.has(skill)) {
          foundSkills.add(skill);
          softSkills.push(skill);
        }
      });

    // 查找其他可能的软技能描述
    const additionalSoftSkills = this.extractAdditionalSoftSkills(text);
    additionalSoftSkills.forEach((skill) => {
      if (!foundSkills.has(skill)) {
        foundSkills.add(skill);
        softSkills.push(skill);
      }
    });

    return softSkills;
  }

  /**
   * 提取其他软技能
   */
  private extractAdditionalSoftSkills(text: string): string[] {
    const skills: string[] = [];

    // 查找"具备"、"拥有"等描述性软技能
    const patterns = [
      /(?:具备|拥有|擅长)([^。，\n]{2,20}(?:能力|思维|意识))/g,
      /(?:良好的|较强的|出色的)([^。，\n]{2,20}(?:能力|技能|素质))/g,
    ];

    patterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const skill = match[1].trim();
        if (skill.length >= 2 && skill.length <= 20) {
          skills.push(skill);
        }
      }
    });

    return skills;
  }

  /**
   * 提取语言能力
   */
  private extractLanguages(text: string): Language[] {
    const languages: Language[] = [];
    const foundLanguages = new Set<string>();

    // 查找语言关键词
    Object.entries(this.languageKeywords).forEach(([langCode, keywords]) => {
      keywords.forEach((keyword) => {
        if (text.includes(keyword) && !foundLanguages.has(langCode)) {
          foundLanguages.add(langCode);

          const language = this.standardizeLanguageName(keyword);
          const proficiency = this.extractLanguageProficiency(text, keyword);
          const certificate = this.extractLanguageCertificate(text, keyword);

          languages.push({
            language,
            proficiency,
            certificate,
          });
        }
      });
    });

    return languages;
  }

  /**
   * 标准化语言名称
   */
  private standardizeLanguageName(keyword: string): string {
    const languageMap: { [key: string]: string } = {
      英语: '英语',
      English: '英语',
      'CET-4': '英语',
      'CET-6': '英语',
      TOEFL: '英语',
      IELTS: '英语',
      中文: '中文',
      普通话: '中文',
      日语: '日语',
      Japanese: '日语',
      韩语: '韩语',
      Korean: '韩语',
      德语: '德语',
      German: '德语',
      法语: '法语',
      French: '法语',
    };

    return languageMap[keyword] || keyword;
  }

  /**
   * 提取语言熟练度
   */
  private extractLanguageProficiency(
    text: string,
    language: string
  ): 'native' | 'fluent' | 'proficient' | 'intermediate' | 'basic' {
    const lines = text.split('\n');

    for (const line of lines) {
      if (line.includes(language)) {
        // 检查熟练度关键词
        if (
          ['母语', '本族语', 'Native'].some((keyword) => line.includes(keyword))
        ) {
          return 'native';
        } else if (
          ['流利', 'Fluent', '熟练'].some((keyword) => line.includes(keyword))
        ) {
          return 'fluent';
        } else if (
          ['精通', 'Proficient', '良好'].some((keyword) =>
            line.includes(keyword)
          )
        ) {
          return 'proficient';
        } else if (
          ['一般', 'Intermediate', '基本'].some((keyword) =>
            line.includes(keyword)
          )
        ) {
          return 'intermediate';
        } else if (
          ['初级', 'Basic', '入门'].some((keyword) => line.includes(keyword))
        ) {
          return 'basic';
        }
      }
    }

    return 'intermediate'; // 默认中级
  }

  /**
   * 提取语言证书
   */
  private extractLanguageCertificate(
    text: string,
    language: string
  ): string | undefined {
    const lines = text.split('\n');

    for (const line of lines) {
      if (line.includes(language)) {
        // 查找证书关键词
        const certPatterns = [
          /CET-[46]/,
          /TOEFL\s*\d+/,
          /IELTS\s*[\d.]+/,
          /N[1-5]/,
          /[四六]级/,
        ];

        for (const pattern of certPatterns) {
          const match = line.match(pattern);
          if (match) {
            return match[0];
          }
        }
      }
    }

    return undefined;
  }

  /**
   * 提取证书认证
   */
  private extractCertifications(text: string): Certification[] {
    const certifications: Certification[] = [];
    const foundCerts = new Set<string>();

    // 查找证书关键词
    this.certificationKeywords.forEach((keyword) => {
      if (text.includes(keyword) && !foundCerts.has(keyword)) {
        foundCerts.add(keyword);

        const certInfo = this.extractCertificationDetails(text, keyword);

        certifications.push({
          name: keyword,
          issuer: certInfo.issuer || this.inferIssuer(keyword),
          issue_date: certInfo.issue_date,
          expiry_date: certInfo.expiry_date,
          certificate_id: certInfo.certificate_id,
        });
      }
    });

    return certifications;
  }

  /**
   * 提取证书详细信息
   */
  private extractCertificationDetails(
    text: string,
    certName: string
  ): Partial<Certification> {
    const lines = text.split('\n');

    for (const line of lines) {
      if (line.includes(certName)) {
        const details: Partial<Certification> = {};

        // 提取时间
        const dateMatch = line.match(/(\d{4})[年\-](\d{1,2})[月\-]?(\d{1,2})?/);
        if (dateMatch) {
          details.issue_date = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}${dateMatch[3] ? '-' + dateMatch[3].padStart(2, '0') : ''}`;
        }

        // 提取证书编号
        const idMatch = line.match(
          /(?:证书号|编号|ID)[：:]?\s*([A-Za-z0-9\-]+)/
        );
        if (idMatch) {
          details.certificate_id = idMatch[1];
        }

        return details;
      }
    }

    return {};
  }

  /**
   * 推断证书发行机构
   */
  private inferIssuer(certName: string): string {
    const issuerMap: { [key: string]: string } = {
      PMP: 'PMI',
      CISSP: 'ISC2',
      AWS: 'Amazon Web Services',
      阿里云: '阿里巴巴',
      腾讯云: '腾讯',
      Oracle: 'Oracle Corporation',
      Microsoft: 'Microsoft Corporation',
      Google: 'Google',
      'Red Hat': 'Red Hat',
      Cisco: 'Cisco Systems',
      VMware: 'VMware',
      ITIL: 'AXELOS',
      软考: '工信部',
      系统架构师: '工信部',
      CPA: '财政部',
      CFA: 'CFA Institute',
    };

    return issuerMap[certName] || '';
  }

  /**
   * 翻译分类名称
   */
  private translateCategory(category: string): string {
    const categoryMap: { [key: string]: string } = {
      programming_languages: '编程语言',
      frontend_frameworks: '前端框架',
      backend_frameworks: '后端框架',
      databases: '数据库',
      cloud_services: '云服务',
      devops_tools: '开发工具',
      mobile_development: '移动开发',
      ai_ml: '人工智能/机器学习',
      testing: '测试',
    };

    return categoryMap[category] || category;
  }

  /**
   * 验证提取结果
   */
  validateResult(data: Skills): boolean {
    if (!data || typeof data !== 'object') return false;

    // 至少应该有一种类型的技能
    return !!(
      (data.technical_skills && data.technical_skills.length > 0) ||
      (data.soft_skills && data.soft_skills.length > 0) ||
      (data.languages && data.languages.length > 0) ||
      (data.certifications && data.certifications.length > 0)
    );
  }

  /**
   * 获取验证警告
   */
  private validateAndGetWarnings(data: Partial<Skills>): string[] {
    const warnings: string[] = [];

    if (!data.technical_skills || data.technical_skills.length === 0) {
      warnings.push('未能提取到技术技能信息');
    }

    if (!data.soft_skills || data.soft_skills.length === 0) {
      warnings.push('未能提取到软技能信息');
    }

    if (!data.languages || data.languages.length === 0) {
      warnings.push('未能提取到语言能力信息');
    }

    // 检查技术技能的完整性
    if (data.technical_skills) {
      data.technical_skills.forEach((techSkill, index) => {
        if (!techSkill.category) {
          warnings.push(`技术技能分类${index + 1}缺少分类名称`);
        }

        if (!techSkill.items || techSkill.items.length === 0) {
          warnings.push(`技术技能分类${index + 1}缺少技能项`);
        }
      });
    }

    return warnings;
  }

  /**
   * 计算正则匹配得分
   */
  protected calculateRegexMatchScore(data: Skills): number {
    let score = 0;
    let checks = 0;

    // 技术技能匹配度
    if (data.technical_skills && data.technical_skills.length > 0) {
      checks++;
      const hasValidTechSkills = data.technical_skills.some(
        (skill) => skill.items && skill.items.length > 0
      );
      if (hasValidTechSkills) score++;
    }

    // 软技能匹配度
    if (data.soft_skills && data.soft_skills.length > 0) {
      checks++;
      score++; // 有软技能就加分
    }

    // 语言能力匹配度
    if (data.languages && data.languages.length > 0) {
      checks++;
      score++; // 有语言能力就加分
    }

    // 证书认证匹配度
    if (data.certifications && data.certifications.length > 0) {
      checks++;
      score++; // 有证书就加分
    }

    return checks > 0 ? score / checks : 0;
  }

  /**
   * 计算上下文相关性得分
   */
  protected calculateContextRelevanceScore(data: Skills): number {
    let score = 0;

    // 技术技能多样性和深度
    if (data.technical_skills && data.technical_skills.length > 0) {
      const totalSkillItems = data.technical_skills.reduce(
        (sum, skill) => sum + (skill.items?.length || 0),
        0
      );
      if (totalSkillItems >= 5) score += 0.3;
      if (data.technical_skills.length >= 3) score += 0.1; // 多分类
    }

    // 技能熟练度信息
    const hasAdvancedSkills = data.technical_skills?.some((skill) =>
      skill.items?.some(
        (item) =>
          item.proficiency === 'advanced' || item.proficiency === 'expert'
      )
    );
    if (hasAdvancedSkills) score += 0.2;

    // 软技能丰富度
    if (data.soft_skills && data.soft_skills.length >= 3) {
      score += 0.2;
    }

    // 语言能力
    if (data.languages && data.languages.length > 0) {
      score += 0.1;
      // 有证书的语言能力更有价值
      const hasLanguageCerts = data.languages.some((lang) => lang.certificate);
      if (hasLanguageCerts) score += 0.1;
    }

    return Math.min(score, 1);
  }
}
