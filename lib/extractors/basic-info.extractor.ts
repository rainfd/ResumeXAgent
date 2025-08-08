// 基本信息智能提取器

import { BaseExtractor } from './base.extractor';
import { BasicInfo, ExtractionResult } from '../types/extraction.types';
import {
  ChinesePatternsUtil,
  CONTACT_PATTERNS,
  ADDRESS_PATTERNS,
  NAME_PATTERNS,
} from '../utils/chinese-patterns.util';

export class BasicInfoExtractor extends BaseExtractor<BasicInfo> {
  /**
   * 提取基本信息
   */
  async extract(text: string): Promise<ExtractionResult<BasicInfo>> {
    return this.safeExtract('BasicInfoExtractor', async () => {
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
   * 使用规则提取基本信息
   */
  private extractWithRules(text: string): Partial<BasicInfo> {
    const result: Partial<BasicInfo> = {};

    // 提取姓名
    result.name = this.extractName(text);

    // 提取联系方式
    const contacts = this.extractContactInfo(text);
    Object.assign(result, contacts);

    // 提取地址信息
    result.address = this.extractAddress(text);
    const locationInfo = ChinesePatternsUtil.normalizeAddress(
      result.address || ''
    );
    result.location = locationInfo.province || locationInfo.city;

    // 提取求职意向
    result.desired_position = this.extractDesiredPosition(text);
    result.current_status = this.extractCurrentStatus(text);

    // 提取个人简介/总结
    result.summary = this.extractSummary(text);

    return result;
  }

  /**
   * 提取姓名（支持中文和英文）
   */
  private extractName(text: string): string | undefined {
    const warnings: string[] = [];

    // 方法1: 查找"姓名"标签后的内容
    const nameWithLabelMatch = text.match(
      /(?:姓名|姓\s*名|Name)[：:\s]*([一-龯A-Za-z\s]{2,10})/i
    );
    if (nameWithLabelMatch) {
      const name = nameWithLabelMatch[1].trim();
      if (this.validateName(name)) {
        return name;
      }
    }

    // 方法2: 使用中文姓名模式匹配
    const chineseNames = ChinesePatternsUtil.extractChineseName(text);
    if (chineseNames.length > 0) {
      // 选择最可能的姓名（通常出现在简历开头）
      const textStart = text.substring(0, 200);
      for (const name of chineseNames) {
        if (textStart.includes(name) && this.validateName(name)) {
          return name;
        }
      }
      // 如果开头没有找到，返回第一个有效姓名
      const validName = chineseNames.find((name) => this.validateName(name));
      if (validName) return validName;
    }

    // 方法3: 英文姓名模式
    const englishNameMatch = text.match(NAME_PATTERNS.english_name);
    if (englishNameMatch && this.validateName(englishNameMatch[1])) {
      return englishNameMatch[1].trim();
    }

    // 方法4: 从文档开头提取（假设姓名在最前面）
    const firstLine = text.split('\n')[0]?.trim();
    if (firstLine && firstLine.length >= 2 && firstLine.length <= 10) {
      // 检查是否包含中文字符且看起来像姓名
      if (/^[一-龯]{2,4}$/.test(firstLine) && this.validateName(firstLine)) {
        return firstLine;
      }
    }

    return undefined;
  }

  /**
   * 提取联系方式
   */
  private extractContactInfo(text: string): Partial<BasicInfo> {
    const result: Partial<BasicInfo> = {};

    // 提取手机号
    const phoneMatches = text.match(CONTACT_PATTERNS.phone);
    if (phoneMatches) {
      const validPhones = phoneMatches.filter((phone) =>
        ChinesePatternsUtil.validateContact('phone', phone)
      );
      if (validPhones.length > 0) {
        result.phone = validPhones[0].replace(/[-\s]/g, '');
      }
    }

    // 提取邮箱
    const emailMatches = text.match(CONTACT_PATTERNS.email);
    if (emailMatches) {
      const validEmails = emailMatches.filter((email) =>
        ChinesePatternsUtil.validateContact('email', email)
      );
      if (validEmails.length > 0) {
        result.email = validEmails[0];
      }
    }

    // 提取微信号
    const wechatMatch = text.match(
      /(?:微信号?|WeChat|wechat)[：:\s]*([a-zA-Z0-9_-]{6,20})/gi
    );
    if (wechatMatch) {
      const wechatId = wechatMatch[0].replace(/.*[：:\s]/, '');
      if (ChinesePatternsUtil.validateContact('wechat', wechatId)) {
        result.wechat = wechatId;
      }
    }

    // 提取QQ号
    const qqMatch = text.match(/(?:QQ号?|qq)[：:\s]*(\d{5,12})/gi);
    if (qqMatch) {
      const qqNumber = qqMatch[0].replace(/.*[：:\s]/, '');
      if (ChinesePatternsUtil.validateContact('qq', qqNumber)) {
        result.qq = qqNumber;
      }
    }

    // 提取LinkedIn
    const linkedinMatch = text.match(CONTACT_PATTERNS.linkedin);
    if (linkedinMatch) {
      result.linkedIn = linkedinMatch[0];
    }

    // 提取GitHub
    const githubMatch = text.match(CONTACT_PATTERNS.github);
    if (githubMatch) {
      result.github = githubMatch[0];
    }

    return result;
  }

  /**
   * 提取地址信息
   */
  private extractAddress(text: string): string | undefined {
    // 方法1: 查找"地址"、"住址"标签
    const addressWithLabel = text.match(
      /(?:地址|住址|居住地|现居)[：:\s]*([^,，。\n]{5,50})/i
    );
    if (addressWithLabel) {
      return addressWithLabel[1].trim();
    }

    // 方法2: 使用地址模式匹配
    const addressMatch = text.match(ADDRESS_PATTERNS.full_address);
    if (addressMatch) {
      return addressMatch[0].replace(/^地址[：:]?\s*/, '').trim();
    }

    // 方法3: 查找省市信息
    const provinceMatch = text.match(ADDRESS_PATTERNS.province);
    if (provinceMatch) {
      const province = provinceMatch[0];
      const context = this.extractTextSegment(text, new RegExp(province));
      if (context && context.length < 100) {
        return `${province}${context}`.trim();
      }
      return province;
    }

    return undefined;
  }

  /**
   * 提取求职意向/目标职位
   */
  private extractDesiredPosition(text: string): string | undefined {
    const patterns = [
      /(?:求职意向|目标职位|应聘职位|期望职位|意向职位)[：:\s]*([^\n,，。]{2,30})/i,
      /(?:期望|希望|意向)(?:从事|担任|成为)[^\n,，。]*?([^\n,，。]{2,20})(?:工作|职位|岗位)/i,
      /(?:应聘|申请)[：:\s]*([^\n,，。]{2,30})/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const position = match[1].trim();
        if (position.length >= 2 && position.length <= 30) {
          return position;
        }
      }
    }

    return undefined;
  }

  /**
   * 提取当前状态
   */
  private extractCurrentStatus(text: string): string | undefined {
    const statusPatterns = [
      /(?:目前|现在|当前)(?:状态|情况)[：:\s]*([^\n,，。]{2,20})/i,
      /(?:在职|离职|待业|求职中|应届毕业生|实习生)/gi,
    ];

    for (const pattern of statusPatterns) {
      const match = text.match(pattern);
      if (match) {
        if (match[1]) {
          return match[1].trim();
        }
        return match[0];
      }
    }

    return undefined;
  }

  /**
   * 提取个人简介/总结
   */
  private extractSummary(text: string): string | undefined {
    const summaryPatterns = [
      /(?:个人简介|自我介绍|个人总结|Profile|Summary)[：:\s]*([^\n]{10,200})/i,
      /(?:我是|本人)[^\n]{20,200}/i,
    ];

    for (const pattern of summaryPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const summary = match[1].trim();
        if (summary.length >= 10 && summary.length <= 200) {
          return summary;
        }
      }
    }

    // 如果没有找到标记的简介，尝试提取第一段较长的描述性文字
    const lines = text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    for (const line of lines) {
      if (
        line.length >= 20 &&
        line.length <= 200 &&
        !this.isContactInfo(line) &&
        !this.isHeaderInfo(line)
      ) {
        return line;
      }
    }

    return undefined;
  }

  /**
   * 验证姓名格式
   */
  private validateName(name: string): boolean {
    if (!name || name.length < 2 || name.length > 10) return false;

    // 中文姓名验证
    if (/^[一-龯]{2,4}$/.test(name)) {
      // 检查是否以常见姓氏开头
      const firstChar = name[0];
      return ChinesePatternsUtil.isChineseSurname(firstChar);
    }

    // 英文姓名验证
    if (/^[A-Za-z\s]{2,20}$/.test(name)) {
      const words = name.split(' ').filter((w) => w.length > 0);
      return words.length >= 2 && words.every((word) => word.length >= 2);
    }

    return false;
  }

  /**
   * 检查是否为联系信息行
   */
  private isContactInfo(line: string): boolean {
    return (
      CONTACT_PATTERNS.phone.test(line) ||
      CONTACT_PATTERNS.email.test(line) ||
      /(?:微信|QQ|linkedin|github)/i.test(line)
    );
  }

  /**
   * 检查是否为标题信息行
   */
  private isHeaderInfo(line: string): boolean {
    return /^(?:姓名|联系方式|个人信息|基本信息|简历|Resume)/.test(line);
  }

  /**
   * 验证提取结果
   */
  validateResult(data: BasicInfo): boolean {
    // 基本要求：至少要有姓名或联系方式之一
    return !!(data.name || data.phone || data.email);
  }

  /**
   * 获取验证警告
   */
  private validateAndGetWarnings(data: Partial<BasicInfo>): string[] {
    const warnings: string[] = [];

    if (!data.name) {
      warnings.push('未能提取到姓名信息');
    }

    if (!data.phone && !data.email) {
      warnings.push('未能提取到有效的联系方式');
    }

    if (
      data.phone &&
      !ChinesePatternsUtil.validateContact('phone', data.phone)
    ) {
      warnings.push('手机号码格式可能不正确');
    }

    if (
      data.email &&
      !ChinesePatternsUtil.validateContact('email', data.email)
    ) {
      warnings.push('邮箱地址格式可能不正确');
    }

    return warnings;
  }

  /**
   * 计算正则匹配得分
   */
  protected calculateRegexMatchScore(data: BasicInfo): number {
    let score = 0;
    let totalChecks = 0;

    // 姓名匹配
    if (data.name) {
      totalChecks++;
      if (this.validateName(data.name)) score++;
    }

    // 联系方式匹配
    ['phone', 'email', 'wechat', 'qq'].forEach((field) => {
      const value = data[field as keyof BasicInfo] as string;
      if (value) {
        totalChecks++;
        if (ChinesePatternsUtil.validateContact(field as any, value)) {
          score++;
        }
      }
    });

    return totalChecks > 0 ? score / totalChecks : 0;
  }

  /**
   * 计算上下文相关性得分
   */
  protected calculateContextRelevanceScore(data: BasicInfo): number {
    let score = 0;
    const fields = ['name', 'phone', 'email', 'address', 'desired_position'];
    const presentFields = fields.filter(
      (field) => data[field as keyof BasicInfo]
    );

    // 基础分：有联系信息就有基本的相关性
    if (data.phone || data.email) score += 0.3;

    // 姓名存在且合理
    if (data.name && this.validateName(data.name)) score += 0.3;

    // 地址信息完整性
    if (data.address && data.address.length > 5) score += 0.2;

    // 求职意向明确
    if (data.desired_position) score += 0.2;

    return Math.min(score, 1);
  }
}
