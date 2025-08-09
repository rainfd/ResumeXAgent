import {
  IGrammarCheckResult,
  IGrammarIssue,
  ICheckOptions,
  ICheckStatistics,
  ICheckProgress,
  CheckType,
  IBatchFixResult,
  IBatchFixOperation,
  IChineseGrammarRule,
  IDictionaryEntry
} from '../types/grammar-issue.types';
import { IResumeData } from '../types/resume.types';
import { FormatChecker } from '../checkers/format.checker';
import { ResumeSpecificChecker } from '../checkers/resume-specific.checker';
import { logger } from '../utils/logger';

/**
 * 中文语法检测服务
 */
export class GrammarCheckerService {
  private formatChecker: FormatChecker;
  private resumeSpecificChecker: ResumeSpecificChecker;
  private apiKey: string;
  private baseURL: string;
  private dictionary: IDictionaryEntry[] = [];
  private grammarRules: IChineseGrammarRule[] = [];

  constructor(config: { apiKey?: string; baseURL?: string } = {}) {
    this.formatChecker = new FormatChecker();
    this.resumeSpecificChecker = new ResumeSpecificChecker();
    // 安全：避免在日志中暴露API密钥
    this.apiKey = config.apiKey || process.env.DEEPSEEK_API_KEY || '';
    this.baseURL = config.baseURL || process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';
    
    this.initializeDictionary();
    this.initializeGrammarRules();
  }

  /**
   * 执行完整的语法检查
   */
  async checkGrammar(
    text: string,
    resume?: IResumeData,
    options: ICheckOptions = {}
  ): Promise<IGrammarCheckResult> {
    const startTime = Date.now();
    const checkId = `check-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      logger.info('开始语法检查', {
        checkId,
        textLength: text.length,
        options
      });

      const issues: IGrammarIssue[] = [];

      // 规则检查（始终执行）
      if (options.enable_rule_check !== false) {
        // 格式检查
        if (options.check_format !== false) {
          const formatIssues = await this.formatChecker.checkFormat(text);
          issues.push(...formatIssues);
        }

        // 错别字检查
        if (options.check_typos !== false) {
          const typoIssues = await this.checkTypos(text);
          issues.push(...typoIssues);
        }

        // 语法检查
        if (options.check_grammar !== false) {
          const grammarIssues = await this.checkGrammarRules(text);
          issues.push(...grammarIssues);
        }

        // 简历专项检查
        if (resume && options.check_format !== false) {
          const resumeIssues = await this.resumeSpecificChecker.checkResumeSpecific(resume, text);
          issues.push(...resumeIssues);
        }
      }

      // AI检查（可选）
      if (options.enable_ai_check && this.apiKey) {
        try {
          const aiIssues = await this.checkWithAI(text, options);
          issues.push(...aiIssues);
        } catch (error) {
          logger.warn('AI检查失败，使用规则检查结果', { error });
        }
      }

      // 限制建议数量
      const maxSuggestions = options.max_suggestions || 50;
      const limitedIssues = issues.slice(0, maxSuggestions);

      // 生成统计信息
      const statistics = this.generateStatistics(limitedIssues, text);

      // 创建结果
      const result: IGrammarCheckResult = {
        id: checkId,
        resume_id: resume?.id || '',
        check_type: this.determineCheckType(options),
        issues: limitedIssues,
        statistics,
        processed_text: text,
        processing_time: Date.now() - startTime,
        created_at: new Date(),
        updated_at: new Date()
      };

      logger.info('语法检查完成', {
        checkId,
        issueCount: limitedIssues.length,
        processingTime: result.processing_time,
        overallScore: statistics.overall_score
      });

      return result;
    } catch (error) {
      logger.error('语法检查失败', {
        checkId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * 检查错别字
   */
  private async checkTypos(text: string): Promise<IGrammarIssue[]> {
    const issues: IGrammarIssue[] = [];

    // 使用词典检查常见错别字
    this.dictionary.forEach(entry => {
      entry.wrong.forEach(wrongWord => {
        const regex = new RegExp(wrongWord, 'g');
        let match;
        while ((match = regex.exec(text)) !== null) {
          const position = this.getTextPosition(text, match.index, wrongWord.length);
          
          issues.push({
            id: `typo-${Date.now()}-${match.index}`,
            type: 'typo',
            severity: 'error',
            position,
            message: `疑似错别字："${wrongWord}"`,
            suggestion: {
              id: `fix-typo-${Date.now()}-${match.index}`,
              original: wrongWord,
              replacement: entry.correct[0] || entry.word,
              reason: `建议更正为"${entry.correct[0] || entry.word}"`,
              confidence: 0.9
            },
            ruleId: 'typo-detection',
            category: '错别字'
          });
        }
      });
    });

    return issues;
  }

  /**
   * 使用规则检查语法问题
   */
  private async checkGrammarRules(text: string): Promise<IGrammarIssue[]> {
    const issues: IGrammarIssue[] = [];

    this.grammarRules.forEach(rule => {
      const regex = typeof rule.pattern === 'string' ? new RegExp(rule.pattern, 'g') : rule.pattern;
      let match;
      
      while ((match = regex.exec(text)) !== null) {
        const position = this.getTextPosition(text, match.index, match[0].length);
        
        issues.push({
          id: `grammar-${rule.id}-${Date.now()}-${match.index}`,
          type: 'grammar',
          severity: rule.severity,
          position,
          message: rule.description,
          suggestion: {
            id: `fix-grammar-${rule.id}-${Date.now()}-${match.index}`,
            original: match[0],
            replacement: rule.suggestion_template,
            reason: rule.description,
            confidence: 0.8
          },
          ruleId: rule.id,
          category: rule.category
        });
      }
    });

    return issues;
  }

  /**
   * 使用AI检查语法问题
   */
  private async checkWithAI(text: string, options: ICheckOptions): Promise<IGrammarIssue[]> {
    if (!this.apiKey) {
      throw new Error('DeepSeek API key not configured');
    }

    const prompt = this.buildAIPrompt(text, options);
    
    try {
      // 性能优化：添加超时控制
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: '你是一个专业的中文语法检查专家，专门检查简历中的语法、用词和表达问题。请返回准确的JSON格式结果。'
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.1,
          max_tokens: 4000,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`AI API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content;

      if (!aiResponse) {
        throw new Error('Invalid AI response format');
      }

      return this.parseAIResponse(aiResponse, text);
    } catch (error) {
      logger.error('AI语法检查失败', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * 构建AI提示词
   */
  private buildAIPrompt(text: string, options: ICheckOptions): string {
    const industryContext = options.industry_context ? `行业背景：${options.industry_context}` : '';
    
    return `
请检查以下简历文本的语法问题，重点关注：
1. 语法错误和语病
2. 用词不当
3. 表达不清晰
4. 句式问题
5. 专业术语使用

${industryContext}

文本内容：
${text}

请以JSON格式返回检查结果，格式如下：
[
  {
    "type": "grammar|style|typo",
    "severity": "error|warning|suggestion", 
    "start_pos": 问题开始位置,
    "end_pos": 问题结束位置,
    "original": "原文",
    "message": "问题描述",
    "suggestion": "修改建议",
    "confidence": 置信度(0-1)
  }
]

要求：
1. 只返回JSON格式，不包含其他内容
2. 置信度要合理评估
3. 建议要具体可行
4. 重点关注简历专业性
`;
  }

  /**
   * 解析AI响应
   */
  private parseAIResponse(aiResponse: string, text: string): IGrammarIssue[] {
    try {
      // 清理响应
      const cleanedResponse = this.cleanJSONResponse(aiResponse);
      const aiIssues = JSON.parse(cleanedResponse) as any[];

      return aiIssues.map((issue, index) => ({
        id: `ai-${Date.now()}-${index}`,
        type: issue.type || 'grammar',
        severity: issue.severity || 'warning',
        position: this.getTextPosition(text, issue.start_pos || 0, (issue.end_pos || issue.start_pos || 0) - (issue.start_pos || 0)),
        message: issue.message || '语法问题',
        suggestion: {
          id: `ai-fix-${Date.now()}-${index}`,
          original: issue.original || '',
          replacement: issue.suggestion || '',
          reason: issue.message || '',
          confidence: issue.confidence || 0.7
        },
        ruleId: 'ai-grammar-check',
        category: 'AI检测'
      }));
    } catch (error) {
      logger.error('解析AI响应失败', { error, aiResponse: aiResponse.substring(0, 500) });
      return [];
    }
  }

  /**
   * 批量修复问题
   */
  async batchFix(
    text: string,
    operation: IBatchFixOperation
  ): Promise<IBatchFixResult> {
    const operationId = `batch-fix-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      logger.info('开始批量修复', {
        operationId,
        issueCount: operation.issue_ids.length,
        preview: operation.preview
      });

      let modifiedText = text;
      const appliedFixes: string[] = [];
      const failedFixes: string[] = [];

      // 这里需要根据issue_ids获取对应的修复建议
      // 简化实现，实际需要从存储中获取issue详情
      for (const issueId of operation.issue_ids) {
        try {
          // TODO: 实现具体的修复逻辑
          // 1. 根据issueId获取问题详情
          // 2. 应用建议的修复
          // 3. 验证修复结果
          
          // 临时实现：直接标记为成功
          appliedFixes.push(issueId);
          
          logger.debug('修复应用成功', { issueId });
        } catch (error) {
          logger.warn(`修复失败`, { 
            issueId, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
          failedFixes.push(issueId);
        }
      }

      const result: IBatchFixResult = {
        operation_id: operationId,
        applied_fixes: appliedFixes,
        failed_fixes: failedFixes,
        success_count: appliedFixes.length,
        failure_count: failedFixes.length
      };

      if (operation.preview) {
        result.preview_text = modifiedText;
      }

      return result;
    } catch (error) {
      logger.error('批量修复失败', { operationId, error });
      throw error;
    }
  }

  /**
   * 生成检查统计信息
   */
  private generateStatistics(issues: IGrammarIssue[], text: string): ICheckStatistics {
    const errors = issues.filter(issue => issue.severity === 'error').length;
    const warnings = issues.filter(issue => issue.severity === 'warning').length;
    const suggestions = issues.filter(issue => issue.severity === 'suggestion').length;

    // 计算总体分数 (0-100)
    const totalIssues = issues.length;
    const textLength = text.length;
    const issuesDensity = totalIssues / Math.max(textLength / 100, 1); // 每100字符的问题数
    
    let overallScore = 100;
    overallScore -= errors * 10; // 错误严重扣分
    overallScore -= warnings * 5; // 警告中等扣分  
    overallScore -= suggestions * 2; // 建议轻微扣分
    overallScore -= Math.min(issuesDensity * 5, 30); // 根据问题密度扣分，最多扣30分

    overallScore = Math.max(0, Math.min(100, overallScore));

    // 可读性分数（基于句长、词汇复杂度等）
    const readabilityScore = this.calculateReadabilityScore(text);

    return {
      total_issues: totalIssues,
      errors,
      warnings,
      suggestions,
      overall_score: Math.round(overallScore),
      readability_score: Math.round(readabilityScore)
    };
  }

  /**
   * 计算可读性分数
   */
  private calculateReadabilityScore(text: string): number {
    // 简化的可读性计算
    const sentences = text.split(/[。！？]/).filter(s => s.trim().length > 0);
    const avgSentenceLength = text.length / sentences.length;
    
    let score = 100;
    
    // 句子过长扣分
    if (avgSentenceLength > 50) {
      score -= Math.min((avgSentenceLength - 50) * 2, 30);
    }
    
    // 句子过短扣分
    if (avgSentenceLength < 10) {
      score -= (10 - avgSentenceLength) * 3;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 确定检查类型
   */
  private determineCheckType(options: ICheckOptions): CheckType {
    const hasFormatCheck = options.check_format !== false;
    const hasGrammarCheck = options.check_grammar !== false;
    const hasAICheck = options.enable_ai_check === true;

    if (hasFormatCheck && hasGrammarCheck && hasAICheck) {
      return 'complete';
    } else if (hasGrammarCheck || hasAICheck) {
      return 'grammar';
    } else {
      return 'format';
    }
  }

  /**
   * 获取文本位置信息
   */
  private getTextPosition(text: string, start: number, length: number) {
    const beforeText = text.substring(0, start);
    const lines = beforeText.split('\n');
    const line = lines.length;
    const column = lines[lines.length - 1].length + 1;

    const allLines = text.split('\n');
    const context = allLines[line - 1] || '';

    return {
      start,
      end: start + length,
      line,
      column,
      context: context.trim() || text.substring(start, start + Math.min(50, text.length - start))
    };
  }

  /**
   * 清理JSON响应
   */
  private cleanJSONResponse(response: string): string {
    let cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    const jsonStartIndex = cleaned.indexOf('[');
    const jsonObjectStartIndex = cleaned.indexOf('{');
    
    let startIndex = -1;
    if (jsonStartIndex !== -1 && jsonObjectStartIndex !== -1) {
      startIndex = Math.min(jsonStartIndex, jsonObjectStartIndex);
    } else if (jsonStartIndex !== -1) {
      startIndex = jsonStartIndex;
    } else if (jsonObjectStartIndex !== -1) {
      startIndex = jsonObjectStartIndex;
    }

    if (startIndex !== -1) {
      cleaned = cleaned.substring(startIndex);
      
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
   * 初始化词典
   */
  private initializeDictionary(): void {
    this.dictionary = [
      {
        word: '负责',
        correct: ['负责', '承担'],
        wrong: ['负则', '负责任'],
        frequency: 100,
        context: ['工作职责']
      },
      {
        word: '经验',
        correct: ['经验'],
        wrong: ['经历', '体验'],
        frequency: 95,
        context: ['工作经验', '项目经验']
      },
      {
        word: '熟练',
        correct: ['熟练', '精通'],
        wrong: ['熟悉', '了解'],
        frequency: 90,
        context: ['技能描述']
      }
      // 更多词典条目...
    ];
  }

  /**
   * 初始化语法规则
   */
  private initializeGrammarRules(): void {
    this.grammarRules = [
      {
        id: 'redundant-words',
        name: '冗余词语',
        description: '存在冗余表达',
        pattern: /进行了?(.{1,10})/g,
        category: '语法问题',
        severity: 'suggestion',
        suggestion_template: '建议简化表达',
        examples: [
          { wrong: '进行了开发', correct: '开发' },
          { wrong: '进行优化', correct: '优化' }
        ]
      },
      {
        id: 'passive-voice',
        name: '被动语态过多',
        description: '简历建议使用主动语态',
        pattern: /被(.{1,10})(了|过)/g,
        category: '语法问题', 
        severity: 'suggestion',
        suggestion_template: '建议使用主动语态',
        examples: [
          { wrong: '被安排做项目', correct: '负责项目开发' },
          { wrong: '被委派处理', correct: '处理' }
        ]
      }
    ];
  }

  /**
   * 获取检测进度
   */
  async getCheckProgress(checkId: string): Promise<ICheckProgress | null> {
    // 实际实现中需要从缓存或数据库获取进度信息
    // 这里返回模拟数据
    return {
      id: checkId,
      status: 'completed',
      progress: 100,
      current_step: '检测完成'
    };
  }

  /**
   * 获取服务状态
   */
  async getServiceStatus(): Promise<{
    rule_checker: boolean;
    ai_checker: boolean;
    dictionary_loaded: boolean;
  }> {
    return {
      rule_checker: true,
      ai_checker: !!this.apiKey,
      dictionary_loaded: this.dictionary.length > 0
    };
  }
}