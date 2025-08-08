// AI辅助智能提取器

import {
  BasicInfo,
  Education,
  Experience,
  Project,
  Skills,
  ExtractionResult,
} from '../types/extraction.types';
import { logger } from '../utils/logger';

// AI提示词模板
const AI_PROMPTS = {
  basic_info: `
请从以下简历文本中提取基本信息，以JSON格式返回：
{
  "name": "姓名",
  "email": "邮箱",
  "phone": "手机号",
  "wechat": "微信号",
  "qq": "QQ号",
  "address": "地址",
  "desired_position": "求职意向",
  "current_status": "当前状态",
  "summary": "个人简介"
}

简历文本：
{{text}}

请确保：
1. 只提取明确存在的信息，不要推测
2. 手机号格式为11位数字
3. 邮箱格式要正确
4. 如果某项信息不存在，请设为null
5. 返回纯JSON格式，不要包含其他内容
`,

  education: `
请从以下简历文本中提取教育背景信息，以JSON数组格式返回：
[
  {
    "school": "学校名称",
    "degree": "学历（学士/硕士/博士）",
    "major": "专业名称",
    "start_date": "开始时间",
    "end_date": "结束时间",
    "gpa": "绩点（数字）",
    "honors": ["荣誉1", "荣誉2"],
    "is_key_university": "是否为985/211高校（布尔值）"
  }
]

简历文本：
{{text}}

请确保：
1. 识别所有教育经历
2. 学历标准化为：学士、硕士、博士、专科、高中
3. 时间格式尽量统一为YYYY-MM或YYYY
4. 985/211高校标记为true
5. 返回纯JSON格式，不要包含其他内容
`,

  experience: `
请从以下简历文本中提取工作经历信息，以JSON数组格式返回：
[
  {
    "company": "公司名称",
    "position": "职位名称",
    "industry": "所属行业",
    "start_date": "开始时间",
    "end_date": "结束时间",
    "is_current": "是否当前工作（布尔值）",
    "location": "工作地点",
    "responsibilities": ["职责1", "职责2"],
    "achievements": ["成就1", "成就2"],
    "company_type": "公司类型（state_owned/private/foreign/startup）"
  }
]

简历文本：
{{text}}

请确保：
1. 识别所有工作经历
2. 区分职责和成就
3. 成就要包含量化数据
4. 公司类型准确分类
5. 返回纯JSON格式，不要包含其他内容
`,

  projects: `
请从以下简历文本中提取项目经历信息，以JSON数组格式返回：
[
  {
    "name": "项目名称",
    "description": "项目描述",
    "type": "项目类型（personal/team/commercial/academic）",
    "technologies": ["技术1", "技术2"],
    "role": "担任角色",
    "start_date": "开始时间",
    "end_date": "结束时间",
    "achievements": ["成就1", "成就2"],
    "url": "项目链接",
    "star_elements": {
      "situation": ["背景情况"],
      "task": ["任务要求"],
      "action": ["采取行动"],
      "result": ["取得结果"]
    }
  }
]

简历文本：
{{text}}

请确保：
1. 识别所有项目经历
2. 提取完整的技术栈
3. 分析STAR法则要素
4. 项目类型准确分类
5. 返回纯JSON格式，不要包含其他内容
`,

  skills: `
请从以下简历文本中提取技能信息，以JSON格式返回：
{
  "technical_skills": [
    {
      "category": "技能分类（如：编程语言、框架等）",
      "items": [
        {
          "name": "技能名称",
          "proficiency": "熟练度（beginner/intermediate/advanced/expert）",
          "years_experience": "工作年限（数字）"
        }
      ]
    }
  ],
  "soft_skills": ["软技能1", "软技能2"],
  "languages": [
    {
      "language": "语言名称",
      "proficiency": "熟练度（native/fluent/proficient/intermediate/basic）",
      "certificate": "相关证书"
    }
  ],
  "certifications": [
    {
      "name": "证书名称",
      "issuer": "发行机构",
      "issue_date": "颁发日期"
    }
  ]
}

简历文本：
{{text}}

请确保：
1. 技能分类要准确
2. 熟练度评估要合理
3. 识别所有相关证书
4. 技能去重
5. 返回纯JSON格式，不要包含其他内容
`,
};

/**
 * AI辅助提取服务
 */
export class AIAssistantExtractor {
  private aiModel: string;
  private apiKey: string;
  private baseURL: string;

  constructor(
    config: { aiModel?: string; apiKey?: string; baseURL?: string } = {}
  ) {
    this.aiModel = config.aiModel || 'deepseek-chat';
    this.apiKey = config.apiKey || process.env.DEEPSEEK_API_KEY || '';
    this.baseURL = config.baseURL || 'https://api.deepseek.com/v1';
  }

  /**
   * 提取基本信息
   */
  async extractBasicInfo(text: string): Promise<BasicInfo | null> {
    try {
      const prompt = AI_PROMPTS.basic_info.replace('{{text}}', text);
      const response = await this.callAI(prompt);

      if (response) {
        return this.parseJSONResponse<BasicInfo>(response);
      }

      return null;
    } catch (error) {
      logger.error(
        'AI basic info extraction failed',
        JSON.stringify({
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      );
      return null;
    }
  }

  /**
   * 提取教育背景
   */
  async extractEducation(text: string): Promise<Education[] | null> {
    try {
      const prompt = AI_PROMPTS.education.replace('{{text}}', text);
      const response = await this.callAI(prompt);

      if (response) {
        return this.parseJSONResponse<Education[]>(response);
      }

      return null;
    } catch (error) {
      logger.error(
        'AI education extraction failed',
        JSON.stringify({
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      );
      return null;
    }
  }

  /**
   * 提取工作经历
   */
  async extractExperience(text: string): Promise<Experience[] | null> {
    try {
      const prompt = AI_PROMPTS.experience.replace('{{text}}', text);
      const response = await this.callAI(prompt);

      if (response) {
        return this.parseJSONResponse<Experience[]>(response);
      }

      return null;
    } catch (error) {
      logger.error(
        'AI experience extraction failed',
        JSON.stringify({
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      );
      return null;
    }
  }

  /**
   * 提取项目经历
   */
  async extractProjects(text: string): Promise<Project[] | null> {
    try {
      const prompt = AI_PROMPTS.projects.replace('{{text}}', text);
      const response = await this.callAI(prompt);

      if (response) {
        return this.parseJSONResponse<Project[]>(response);
      }

      return null;
    } catch (error) {
      logger.error(
        'AI projects extraction failed',
        JSON.stringify({
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      );
      return null;
    }
  }

  /**
   * 提取技能信息
   */
  async extractSkills(text: string): Promise<Skills | null> {
    try {
      const prompt = AI_PROMPTS.skills.replace('{{text}}', text);
      const response = await this.callAI(prompt);

      if (response) {
        return this.parseJSONResponse<Skills>(response);
      }

      return null;
    } catch (error) {
      logger.error(
        'AI skills extraction failed',
        JSON.stringify({
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      );
      return null;
    }
  }

  /**
   * 调用AI接口
   */
  private async callAI(prompt: string): Promise<string | null> {
    if (!this.apiKey) {
      logger.warn('AI API key not configured');
      return null;
    }

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.aiModel,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.1, // 低温度保证结果一致性
          max_tokens: 4000,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `AI API request failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      if (data.choices && data.choices[0] && data.choices[0].message) {
        return data.choices[0].message.content;
      }

      throw new Error('Invalid AI response format');
    } catch (error) {
      logger.error(
        'AI API call failed',
        JSON.stringify({
          error: error instanceof Error ? error.message : 'Unknown error',
          model: this.aiModel,
        })
      );
      return null;
    }
  }

  /**
   * 解析JSON响应
   */
  private parseJSONResponse<T>(response: string): T | null {
    try {
      // 尝试清理响应中的非JSON内容
      const cleanedResponse = this.cleanJSONResponse(response);
      return JSON.parse(cleanedResponse) as T;
    } catch (error) {
      logger.error(
        'Failed to parse AI JSON response',
        JSON.stringify({
          error: error instanceof Error ? error.message : 'Unknown error',
          response: response.substring(0, 200) + '...', // 只记录前200字符
        })
      );
      return null;
    }
  }

  /**
   * 清理JSON响应
   */
  private cleanJSONResponse(response: string): string {
    // 移除markdown代码块标记
    let cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '');

    // 移除可能的前后空白和说明文字
    const jsonStartIndex = cleaned.indexOf('{');
    const jsonArrayStartIndex = cleaned.indexOf('[');

    let startIndex = -1;
    if (jsonStartIndex !== -1 && jsonArrayStartIndex !== -1) {
      startIndex = Math.min(jsonStartIndex, jsonArrayStartIndex);
    } else if (jsonStartIndex !== -1) {
      startIndex = jsonStartIndex;
    } else if (jsonArrayStartIndex !== -1) {
      startIndex = jsonArrayStartIndex;
    }

    if (startIndex !== -1) {
      cleaned = cleaned.substring(startIndex);

      // 找到最后一个 } 或 ]
      const lastBraceIndex = cleaned.lastIndexOf('}');
      const lastBracketIndex = cleaned.lastIndexOf(']');

      const endIndex = Math.max(lastBraceIndex, lastBracketIndex);
      if (endIndex !== -1) {
        cleaned = cleaned.substring(0, endIndex + 1);
      }
    }

    return cleaned.trim();
  }

  /**
   * 批量提取所有信息
   */
  async extractAll(text: string): Promise<{
    basic_info: BasicInfo | null;
    education: Education[] | null;
    experience: Experience[] | null;
    projects: Project[] | null;
    skills: Skills | null;
  }> {
    const startTime = Date.now();

    try {
      // 并行调用所有提取方法
      const [basicInfo, education, experience, projects, skills] =
        await Promise.all([
          this.extractBasicInfo(text),
          this.extractEducation(text),
          this.extractExperience(text),
          this.extractProjects(text),
          this.extractSkills(text),
        ]);

      const processingTime = Date.now() - startTime;
      logger.info(
        'AI batch extraction completed',
        JSON.stringify({
          processing_time_ms: processingTime,
          model: this.aiModel,
          basic_info_success: !!basicInfo,
          education_success: !!education,
          experience_success: !!experience,
          projects_success: !!projects,
          skills_success: !!skills,
        })
      );

      return {
        basic_info: basicInfo,
        education: education,
        experience: experience,
        projects: projects,
        skills: skills,
      };
    } catch (error) {
      logger.error(
        'AI batch extraction failed',
        JSON.stringify({
          error: error instanceof Error ? error.message : 'Unknown error',
          processing_time_ms: Date.now() - startTime,
        })
      );

      return {
        basic_info: null,
        education: null,
        experience: null,
        projects: null,
        skills: null,
      };
    }
  }

  /**
   * 检查AI服务可用性
   */
  async checkAvailability(): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseURL}/models`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      return response.ok;
    } catch (error) {
      logger.error(
        'AI service availability check failed',
        JSON.stringify({
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      );
      return false;
    }
  }

  /**
   * 获取AI模型信息
   */
  getModelInfo(): { model: string; provider: string; available: boolean } {
    return {
      model: this.aiModel,
      provider: 'DeepSeek',
      available: !!this.apiKey,
    };
  }

  /**
   * 估算API调用成本（基于DeepSeek定价）
   */
  estimateCost(textLength: number): number {
    // DeepSeek大约每1000tokens $0.0014
    // 估算中文文本token比例约为1:1.5
    const estimatedTokens = Math.ceil(textLength * 1.5);
    const costPer1000Tokens = 0.0014;

    // 5次API调用（基本信息、教育、工作、项目、技能）
    const totalTokens = estimatedTokens * 5;

    return (totalTokens / 1000) * costPer1000Tokens;
  }
}

// 默认AI提取器实例
export const defaultAIExtractor = new AIAssistantExtractor();

/**
 * 混合提取策略：结合规则和AI提取结果
 */
export class HybridExtractionStrategy {
  private aiExtractor: AIAssistantExtractor;

  constructor(aiConfig?: {
    aiModel?: string;
    apiKey?: string;
    baseURL?: string;
  }) {
    this.aiExtractor = new AIAssistantExtractor(aiConfig);
  }

  /**
   * 合并规则提取和AI提取的基本信息
   */
  mergeBasicInfo(
    ruleResult: Partial<BasicInfo>,
    aiResult: BasicInfo | null
  ): BasicInfo {
    if (!aiResult) return ruleResult as BasicInfo;

    const merged: BasicInfo = {
      name: ruleResult.name || aiResult.name,
      email: ruleResult.email || aiResult.email,
      phone: ruleResult.phone || aiResult.phone,
      wechat: ruleResult.wechat || aiResult.wechat,
      qq: ruleResult.qq || aiResult.qq,
      address: ruleResult.address || aiResult.address,
      desired_position:
        ruleResult.desired_position || aiResult.desired_position,
      current_status: ruleResult.current_status || aiResult.current_status,
      summary: ruleResult.summary || aiResult.summary,
      location: ruleResult.location || aiResult.location,
      linkedIn: ruleResult.linkedIn || aiResult.linkedIn,
      github: ruleResult.github || aiResult.github,
      website: ruleResult.website || aiResult.website,
    };

    return merged;
  }

  /**
   * 合并教育背景信息
   */
  mergeEducation(
    ruleResult: Education[],
    aiResult: Education[] | null
  ): Education[] {
    if (!aiResult || aiResult.length === 0) return ruleResult;
    if (ruleResult.length === 0) return aiResult;

    const merged = [...ruleResult];

    // 添加AI发现的新教育经历
    aiResult.forEach((aiEdu) => {
      const exists = merged.some(
        (ruleEdu) =>
          ruleEdu.school === aiEdu.school && ruleEdu.major === aiEdu.major
      );

      if (!exists) {
        merged.push(aiEdu);
      }
    });

    return merged;
  }

  /**
   * 合并工作经历信息
   */
  mergeExperience(
    ruleResult: Experience[],
    aiResult: Experience[] | null
  ): Experience[] {
    if (!aiResult || aiResult.length === 0) return ruleResult;
    if (ruleResult.length === 0) return aiResult;

    const merged = [...ruleResult];

    // 添加AI发现的新工作经历
    aiResult.forEach((aiExp) => {
      const exists = merged.some(
        (ruleExp) =>
          ruleExp.company === aiExp.company &&
          ruleExp.position === aiExp.position
      );

      if (!exists) {
        merged.push(aiExp);
      }
    });

    return merged;
  }

  /**
   * 合并项目经历信息
   */
  mergeProjects(ruleResult: Project[], aiResult: Project[] | null): Project[] {
    if (!aiResult || aiResult.length === 0) return ruleResult;
    if (ruleResult.length === 0) return aiResult;

    const merged = [...ruleResult];

    // 添加AI发现的新项目
    aiResult.forEach((aiProj) => {
      const exists = merged.some(
        (ruleProj) =>
          ruleProj.name === aiProj.name ||
          this.isSimilarProject(ruleProj, aiProj)
      );

      if (!exists) {
        merged.push(aiProj);
      }
    });

    return merged;
  }

  /**
   * 合并技能信息
   */
  mergeSkills(ruleResult: Partial<Skills>, aiResult: Skills | null): Skills {
    if (!aiResult) return ruleResult as Skills;

    const merged: Skills = {
      technical_skills: this.mergeTechnicalSkills(
        ruleResult.technical_skills || [],
        aiResult.technical_skills || []
      ),
      soft_skills: [
        ...new Set([
          ...(ruleResult.soft_skills || []),
          ...(aiResult.soft_skills || []),
        ]),
      ],
      languages: this.mergeLanguages(
        ruleResult.languages || [],
        aiResult.languages || []
      ),
      certifications: this.mergeCertifications(
        ruleResult.certifications || [],
        aiResult.certifications || []
      ),
    };

    return merged;
  }

  /**
   * 判断项目是否相似
   */
  private isSimilarProject(proj1: Project, proj2: Project): boolean {
    // 简单的相似度判断
    const name1 = proj1.name.toLowerCase();
    const name2 = proj2.name.toLowerCase();

    return (
      name1.includes(name2) ||
      name2.includes(name1) ||
      (proj1.description &&
        proj2.description &&
        proj1.description.includes(proj2.name)) ||
      proj2.description.includes(proj1.name)
    );
  }

  /**
   * 合并技术技能
   */
  private mergeTechnicalSkills(ruleSkills: any[], aiSkills: any[]): any[] {
    const merged = [...ruleSkills];

    aiSkills.forEach((aiSkill) => {
      const existingCategory = merged.find(
        (ruleSkill) => ruleSkill.category === aiSkill.category
      );

      if (existingCategory) {
        // 合并同类技能
        const existingItems = existingCategory.items || [];
        const newItems = aiSkill.items || [];

        newItems.forEach((newItem: any) => {
          const exists = existingItems.some(
            (item: any) => item.name === newItem.name
          );
          if (!exists) {
            existingItems.push(newItem);
          }
        });

        existingCategory.items = existingItems;
      } else {
        merged.push(aiSkill);
      }
    });

    return merged;
  }

  /**
   * 合并语言能力
   */
  private mergeLanguages(ruleLanguages: any[], aiLanguages: any[]): any[] {
    const merged = [...ruleLanguages];

    aiLanguages.forEach((aiLang) => {
      const exists = merged.some(
        (ruleLang) => ruleLang.language === aiLang.language
      );
      if (!exists) {
        merged.push(aiLang);
      }
    });

    return merged;
  }

  /**
   * 合并证书认证
   */
  private mergeCertifications(ruleCerts: any[], aiCerts: any[]): any[] {
    const merged = [...ruleCerts];

    aiCerts.forEach((aiCert) => {
      const exists = merged.some((ruleCert) => ruleCert.name === aiCert.name);
      if (!exists) {
        merged.push(aiCert);
      }
    });

    return merged;
  }
}
