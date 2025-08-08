// 基础提取器抽象类

import {
  IExtractor,
  ExtractionResult,
  ExtractorConfig,
  ConfidenceWeights,
} from '../types/extraction.types';
import { logger } from '../utils/logger';

export abstract class BaseExtractor<T> implements IExtractor<T> {
  protected config: ExtractorConfig;
  protected confidenceWeights: ConfidenceWeights;

  constructor(config: ExtractorConfig) {
    this.config = config;
    this.confidenceWeights = {
      regex_match: 0.3,
      context_relevance: 0.25,
      data_completeness: 0.25,
      format_validity: 0.2,
      ai_confidence: this.config.enable_ai_assistance ? 0.3 : 0,
    };
  }

  /**
   * 抽象方法：执行提取
   */
  abstract extract(text: string): Promise<ExtractionResult<T>>;

  /**
   * 抽象方法：验证提取结果
   */
  abstract validateResult(data: T): boolean;

  /**
   * 计算置信度评分
   */
  getConfidenceScore(data: T): number {
    const scores = {
      regex_match: this.calculateRegexMatchScore(data),
      context_relevance: this.calculateContextRelevanceScore(data),
      data_completeness: this.calculateCompletenessScore(data),
      format_validity: this.calculateFormatValidityScore(data),
    };

    let totalScore = 0;
    let totalWeight = 0;

    for (const [metric, score] of Object.entries(scores)) {
      const weight =
        this.confidenceWeights[metric as keyof ConfidenceWeights] || 0;
      totalScore += score * weight;
      totalWeight += weight;
    }

    return totalWeight > 0
      ? Math.min(Math.max(totalScore / totalWeight, 0), 1)
      : 0;
  }

  /**
   * 计算正则匹配得分
   */
  protected calculateRegexMatchScore(data: T): number {
    // 子类可以重写此方法
    return 0.5;
  }

  /**
   * 计算上下文相关性得分
   */
  protected calculateContextRelevanceScore(data: T): number {
    // 子类可以重写此方法
    return 0.5;
  }

  /**
   * 计算数据完整性得分
   */
  protected calculateCompletenessScore(data: T): number {
    if (!data) return 0;

    const fields = Object.values(data as any);
    const filledFields = fields.filter(
      (field) => field !== null && field !== undefined && field !== ''
    );

    return fields.length > 0 ? filledFields.length / fields.length : 0;
  }

  /**
   * 计算格式有效性得分
   */
  protected calculateFormatValidityScore(data: T): number {
    return this.validateResult(data) ? 1 : 0;
  }

  /**
   * 预处理文本
   */
  protected preprocessText(text: string): string {
    if (!text) return '';

    return text
      .replace(/\r\n/g, '\n') // 统一换行符
      .replace(/\t/g, ' ') // 制表符转空格
      .replace(/\s+/g, ' ') // 多个空格合并
      .replace(/[^\S\n]+/g, ' ') // 清理非换行空白字符
      .trim();
  }

  /**
   * 提取文本片段
   */
  protected extractTextSegment(
    text: string,
    startPattern: RegExp,
    endPattern?: RegExp
  ): string {
    const startMatch = text.match(startPattern);
    if (!startMatch) return '';

    const startIndex = startMatch.index! + startMatch[0].length;

    if (!endPattern) {
      // 提取到下一个段落或结尾
      const endIndex = text.indexOf('\n\n', startIndex);
      return text
        .substring(startIndex, endIndex === -1 ? undefined : endIndex)
        .trim();
    }

    const endMatch = text.slice(startIndex).match(endPattern);
    if (!endMatch) {
      return text.substring(startIndex).trim();
    }

    const endIndex = startIndex + endMatch.index!;
    return text.substring(startIndex, endIndex).trim();
  }

  /**
   * 分割文本为行
   */
  protected splitToLines(text: string): string[] {
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }

  /**
   * 查找包含关键词的行
   */
  protected findLinesContaining(text: string, keywords: string[]): string[] {
    const lines = this.splitToLines(text);
    return lines.filter((line) =>
      keywords.some((keyword) =>
        line.toLowerCase().includes(keyword.toLowerCase())
      )
    );
  }

  /**
   * 记录提取日志
   */
  protected logExtraction(
    extractorName: string,
    success: boolean,
    processingTime: number,
    warnings: string[] = []
  ): void {
    const logData = {
      extractor: extractorName,
      success,
      processing_time_ms: processingTime,
      warnings_count: warnings.length,
      timestamp: new Date().toISOString(),
    };

    if (success) {
      logger.info('Extraction completed', JSON.stringify(logData));
    } else {
      logger.warn('Extraction failed', JSON.stringify(logData));
    }

    if (warnings.length > 0) {
      warnings.forEach((warning) => {
        logger.warn(
          'Extraction warning',
          JSON.stringify({
            extractor: extractorName,
            warning,
          })
        );
      });
    }
  }

  /**
   * 处理AI辅助提取（子类可重写）
   */
  protected async performAIExtraction(
    text: string
  ): Promise<Partial<T> | null> {
    if (!this.config.enable_ai_assistance) {
      return null;
    }

    try {
      // 子类需要实现具体的AI调用逻辑
      return null;
    } catch (error) {
      logger.error(
        'AI extraction failed',
        JSON.stringify({
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      );
      return null;
    }
  }

  /**
   * 合并规则提取和AI提取的结果
   */
  protected mergeResults(
    ruleBasedResult: Partial<T>,
    aiResult: Partial<T> | null
  ): T {
    if (!aiResult) {
      return ruleBasedResult as T;
    }

    // 优先使用规则提取的结果，AI结果作为补充
    const merged = { ...aiResult, ...ruleBasedResult };

    // 移除空值
    Object.keys(merged).forEach((key) => {
      const value = (merged as any)[key];
      if (value === null || value === undefined || value === '') {
        delete (merged as any)[key];
      }
    });

    return merged as T;
  }

  /**
   * 创建提取结果
   */
  protected createResult(
    data: T,
    processingTime: number,
    warnings: string[] = [],
    method: 'regex' | 'ai' | 'pattern' = 'regex',
    sourceText?: string
  ): ExtractionResult<T> {
    const confidence = this.getConfidenceScore(data);

    return {
      data,
      confidence,
      warnings,
      metadata: {
        method,
        processing_time_ms: processingTime,
        source_text: sourceText,
      },
    };
  }

  /**
   * 安全执行提取（异常处理包装）
   */
  protected async safeExtract(
    extractorName: string,
    extractFn: () => Promise<ExtractionResult<T>>
  ): Promise<ExtractionResult<T>> {
    const startTime = Date.now();

    try {
      const result = await Promise.race([
        extractFn(),
        this.createTimeoutPromise(),
      ]);

      const processingTime = Date.now() - startTime;
      this.logExtraction(extractorName, true, processingTime, result.warnings);

      return result;
    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown extraction error';

      this.logExtraction(extractorName, false, processingTime, [errorMessage]);

      return this.createResult(
        {} as T,
        processingTime,
        [errorMessage],
        'regex'
      );
    }
  }

  /**
   * 创建超时Promise
   */
  private createTimeoutPromise(): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(
          new Error(`Extraction timeout after ${this.config.timeout_ms}ms`)
        );
      }, this.config.timeout_ms);
    });
  }
}
