import {
  IGrammarIssue,
  IssueType,
  IssueSeverity,
  ITextPosition,
  ISuggestion,
  IChineseGrammarRule
} from '../types/grammar-issue.types';
import { logger } from '../utils/logger';

/**
 * 格式检查器 - 检测文本格式问题
 */
export class FormatChecker {
  private rules: IChineseGrammarRule[] = [];

  constructor() {
    this.initializeRules();
  }

  /**
   * 检查文本格式问题
   */
  async checkFormat(text: string): Promise<IGrammarIssue[]> {
    try {
      const issues: IGrammarIssue[] = [];

      // 标点符号检查
      const punctuationIssues = await this.checkPunctuation(text);
      issues.push(...punctuationIssues);

      // 空格检查
      const spacingIssues = await this.checkSpacing(text);
      issues.push(...spacingIssues);

      // 换行符检查
      const lineBreakIssues = await this.checkLineBreaks(text);
      issues.push(...lineBreakIssues);

      // 数字格式检查
      const numberFormatIssues = await this.checkNumberFormat(text);
      issues.push(...numberFormatIssues);

      logger.info(`格式检查完成，发现 ${issues.length} 个问题`, {
        textLength: text.length,
        issueCount: issues.length
      });

      return issues;
    } catch (error) {
      logger.error('格式检查失败', { error });
      throw error;
    }
  }

  /**
   * 检查标点符号使用
   */
  private async checkPunctuation(text: string): Promise<IGrammarIssue[]> {
    const issues: IGrammarIssue[] = [];

    // 检查中英文标点混用
    const mixedPunctuationPattern = /([a-zA-Z\d])\s*[，。；：！？]/g;
    let match;
    while ((match = mixedPunctuationPattern.exec(text)) !== null) {
      const position = this.getTextPosition(text, match.index, match[0].length);
      const suggestion = this.generatePunctuationSuggestion(match[0]);
      
      issues.push({
        id: `punctuation-${Date.now()}-${match.index}`,
        type: 'format' as IssueType,
        severity: 'warning' as IssueSeverity,
        position,
        message: '建议在英文内容后使用英文标点符号',
        suggestion,
        ruleId: 'mixed-punctuation',
        category: '标点符号'
      });
    }

    // 检查标点符号后多余空格
    const extraSpacePattern = /[，。；：！？]\s+/g;
    while ((match = extraSpacePattern.exec(text)) !== null) {
      const position = this.getTextPosition(text, match.index, match[0].length);
      
      issues.push({
        id: `spacing-after-punct-${Date.now()}-${match.index}`,
        type: 'format' as IssueType,
        severity: 'suggestion' as IssueSeverity,
        position,
        message: '中文标点符号后不需要空格',
        suggestion: {
          id: `fix-${Date.now()}-${match.index}`,
          original: match[0],
          replacement: match[0].trim(),
          reason: '中文标点符号后不需要空格',
          confidence: 0.95
        },
        ruleId: 'space-after-chinese-punctuation',
        category: '标点符号'
      });
    }

    // 检查标点符号前多余空格
    const spaceBeforePunctPattern = /\s+[，。；：！？]/g;
    while ((match = spaceBeforePunctPattern.exec(text)) !== null) {
      const position = this.getTextPosition(text, match.index, match[0].length);
      
      issues.push({
        id: `spacing-before-punct-${Date.now()}-${match.index}`,
        type: 'format' as IssueType,
        severity: 'error' as IssueSeverity,
        position,
        message: '标点符号前不应该有空格',
        suggestion: {
          id: `fix-${Date.now()}-${match.index}`,
          original: match[0],
          replacement: match[0].trim(),
          reason: '标点符号前不应该有空格',
          confidence: 0.98
        },
        ruleId: 'space-before-punctuation',
        category: '标点符号'
      });
    }

    return issues;
  }

  /**
   * 检查空格使用
   */
  private async checkSpacing(text: string): Promise<IGrammarIssue[]> {
    const issues: IGrammarIssue[] = [];

    // 检查中英文之间缺少空格
    const missingSpacePattern = /[\u4e00-\u9fff][a-zA-Z]|[a-zA-Z][\u4e00-\u9fff]/g;
    let match;
    while ((match = missingSpacePattern.exec(text)) !== null) {
      const position = this.getTextPosition(text, match.index, match[0].length);
      const suggestion = this.generateSpacingSuggestion(match[0]);
      
      issues.push({
        id: `missing-space-${Date.now()}-${match.index}`,
        type: 'format' as IssueType,
        severity: 'suggestion' as IssueSeverity,
        position,
        message: '建议在中英文之间添加空格',
        suggestion,
        ruleId: 'chinese-english-spacing',
        category: '空格'
      });
    }

    // 检查多余的空格
    const multipleSpacePattern = /\s{2,}/g;
    while ((match = multipleSpacePattern.exec(text)) !== null) {
      const position = this.getTextPosition(text, match.index, match[0].length);
      
      issues.push({
        id: `multiple-space-${Date.now()}-${match.index}`,
        type: 'format' as IssueType,
        severity: 'warning' as IssueSeverity,
        position,
        message: '发现多个连续空格',
        suggestion: {
          id: `fix-${Date.now()}-${match.index}`,
          original: match[0],
          replacement: ' ',
          reason: '多个空格应替换为单个空格',
          confidence: 0.9
        },
        ruleId: 'multiple-spaces',
        category: '空格'
      });
    }

    return issues;
  }

  /**
   * 检查换行符使用
   */
  private async checkLineBreaks(text: string): Promise<IGrammarIssue[]> {
    const issues: IGrammarIssue[] = [];

    // 检查多余的换行符
    const multipleLineBreaksPattern = /\n{3,}/g;
    let match;
    while ((match = multipleLineBreaksPattern.exec(text)) !== null) {
      const position = this.getTextPosition(text, match.index, match[0].length);
      
      issues.push({
        id: `multiple-linebreaks-${Date.now()}-${match.index}`,
        type: 'format' as IssueType,
        severity: 'suggestion' as IssueSeverity,
        position,
        message: '发现过多空行',
        suggestion: {
          id: `fix-${Date.now()}-${match.index}`,
          original: match[0],
          replacement: '\n\n',
          reason: '建议最多保留一个空行',
          confidence: 0.8
        },
        ruleId: 'multiple-line-breaks',
        category: '换行'
      });
    }

    return issues;
  }

  /**
   * 检查数字格式
   */
  private async checkNumberFormat(text: string): Promise<IGrammarIssue[]> {
    const issues: IGrammarIssue[] = [];

    // 检查不一致的数字格式（阿拉伯数字 vs 中文数字）
    const numberInconsistencyPattern = /(\d+)([年月日]).*?([一二三四五六七八九十百千万]+)([年月日])/g;
    let match;
    while ((match = numberInconsistencyPattern.exec(text)) !== null) {
      const position = this.getTextPosition(text, match.index, match[0].length);
      
      issues.push({
        id: `number-inconsistency-${Date.now()}-${match.index}`,
        type: 'format' as IssueType,
        severity: 'warning' as IssueSeverity,
        position,
        message: '建议在同一文档中保持数字格式一致',
        suggestion: {
          id: `fix-${Date.now()}-${match.index}`,
          original: match[0],
          replacement: match[0], // 实际应该转换格式
          reason: '保持数字格式一致性',
          confidence: 0.7
        },
        ruleId: 'number-format-consistency',
        category: '数字格式'
      });
    }

    return issues;
  }

  /**
   * 生成标点符号建议
   */
  private generatePunctuationSuggestion(original: string): ISuggestion {
    const punctuationMap: Record<string, string> = {
      '，': ',',
      '。': '.',
      '；': ';',
      '：': ':',
      '！': '!',
      '？': '?'
    };

    const lastChar = original.trim().slice(-1);
    const replacement = original.replace(lastChar, punctuationMap[lastChar] || lastChar);

    return {
      id: `punct-fix-${Date.now()}`,
      original,
      replacement,
      reason: '英文内容后建议使用英文标点',
      confidence: 0.85
    };
  }

  /**
   * 生成空格建议
   */
  private generateSpacingSuggestion(original: string): ISuggestion {
    const [chinese, english] = original.split('');
    const isChinese = (char: string) => /[\u4e00-\u9fff]/.test(char);
    
    let replacement: string;
    if (isChinese(chinese) && /[a-zA-Z]/.test(english)) {
      replacement = `${chinese} ${english}`;
    } else if (/[a-zA-Z]/.test(chinese) && isChinese(english)) {
      replacement = `${chinese} ${english}`;
    } else {
      replacement = original;
    }

    return {
      id: `space-fix-${Date.now()}`,
      original,
      replacement,
      reason: '中英文之间建议添加空格以提高可读性',
      confidence: 0.8
    };
  }

  /**
   * 获取文本位置信息
   */
  private getTextPosition(text: string, start: number, length: number): ITextPosition {
    const beforeText = text.substring(0, start);
    const lines = beforeText.split('\n');
    const line = lines.length;
    const column = lines[lines.length - 1].length + 1;

    // 获取上下文（包含问题的整行）
    const allLines = text.split('\n');
    const context = allLines[line - 1] || '';

    return {
      start,
      end: start + length,
      line,
      column,
      context: context.trim()
    };
  }

  /**
   * 初始化格式检查规则
   */
  private initializeRules(): void {
    this.rules = [
      {
        id: 'mixed-punctuation',
        name: '中英文标点混用',
        description: '在英文内容后使用了中文标点符号',
        pattern: /([a-zA-Z\d])\s*[，。；：！？]/g,
        category: '标点符号',
        severity: 'warning' as IssueSeverity,
        suggestion_template: '建议使用英文标点符号',
        examples: [
          {
            wrong: 'Hello，世界',
            correct: 'Hello, 世界'
          }
        ]
      },
      {
        id: 'space-after-chinese-punctuation',
        name: '中文标点后多余空格',
        description: '中文标点符号后不需要空格',
        pattern: /[，。；：！？]\s+/g,
        category: '标点符号',
        severity: 'suggestion' as IssueSeverity,
        suggestion_template: '删除标点符号后的空格',
        examples: [
          {
            wrong: '你好， 世界',
            correct: '你好，世界'
          }
        ]
      },
      {
        id: 'chinese-english-spacing',
        name: '中英文间距',
        description: '中文和英文之间缺少空格',
        pattern: /[\u4e00-\u9fff][a-zA-Z]|[a-zA-Z][\u4e00-\u9fff]/g,
        category: '空格',
        severity: 'suggestion' as IssueSeverity,
        suggestion_template: '在中英文之间添加空格',
        examples: [
          {
            wrong: '使用JavaScript开发',
            correct: '使用 JavaScript 开发'
          }
        ]
      }
    ];
  }

  /**
   * 获取所有格式检查规则
   */
  getRules(): IChineseGrammarRule[] {
    return [...this.rules];
  }

  /**
   * 根据规则ID获取规则
   */
  getRule(ruleId: string): IChineseGrammarRule | undefined {
    return this.rules.find(rule => rule.id === ruleId);
  }
}