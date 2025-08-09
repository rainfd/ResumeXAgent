/**
 * 语法检测问题类型定义
 */

/**
 * 问题类型
 */
export type IssueType =
  | 'typo' // 错别字
  | 'grammar' // 语法问题
  | 'style' // 文体问题
  | 'format' // 格式问题
  | 'resume-specific' // 简历专项问题

/**
 * 问题严重程度
 */
export type IssueSeverity = 
  | 'error'      // 错误 - 必须修复
  | 'warning'    // 警告 - 建议修复
  | 'suggestion'; // 建议 - 可选修复

/**
 * 检测类型
 */
export type CheckType = 
  | 'grammar'   // 语法检测
  | 'format'    // 格式检测
  | 'complete'; // 全面检测

/**
 * 文本位置信息
 */
export interface ITextPosition {
  start: number;      // 开始位置
  end: number;        // 结束位置
  line: number;       // 行号（从1开始）
  column: number;     // 列号（从1开始）
  context: string;    // 上下文文本（包含问题的句子或段落）
}

/**
 * 修改建议
 */
export interface ISuggestion {
  id: string;
  original: string;     // 原始文本
  replacement: string;  // 建议替换的文本
  reason: string;      // 修改理由
  confidence: number;  // 置信度（0-1）
}

/**
 * 语法检测问题
 */
export interface IGrammarIssue {
  id: string;
  type: IssueType;
  severity: IssueSeverity;
  position: ITextPosition;
  message: string;        // 问题描述
  suggestion: ISuggestion; // 修改建议
  ruleId?: string;       // 触发的规则ID
  category?: string;     // 问题分类（如"标点符号"、"语法错误"等）
}

/**
 * 检测统计信息
 */
export interface ICheckStatistics {
  total_issues: number;   // 问题总数
  errors: number;         // 错误数量
  warnings: number;       // 警告数量
  suggestions: number;    // 建议数量
  overall_score: number;  // 总分（0-100）
  readability_score: number; // 可读性分数（0-100）
}

/**
 * 语法检测结果
 */
export interface IGrammarCheckResult {
  id: string;
  resume_id: string;
  check_type: CheckType;
  issues: IGrammarIssue[];
  statistics: ICheckStatistics;
  processed_text: string;  // 处理的原始文本
  processing_time: number; // 处理时间（毫秒）
  created_at: Date;
  updated_at: Date;
}

/**
 * 检测选项
 */
export interface ICheckOptions {
  enable_ai_check?: boolean;    // 启用AI检测
  enable_rule_check?: boolean;  // 启用规则检测
  check_typos?: boolean;        // 检测错别字
  check_grammar?: boolean;      // 检测语法
  check_format?: boolean;       // 检测格式
  check_style?: boolean;        // 检测文体
  industry_context?: string;    // 行业上下文
  max_suggestions?: number;     // 最大建议数量
}

/**
 * 批量修改操作
 */
export interface IBatchFixOperation {
  issue_ids: string[];         // 要修复的问题ID列表
  auto_apply: boolean;         // 是否自动应用修改
  preview: boolean;           // 是否仅预览
}

/**
 * 批量修改结果
 */
export interface IBatchFixResult {
  operation_id: string;
  applied_fixes: string[];     // 已应用的修复ID
  failed_fixes: string[];      // 失败的修复ID
  preview_text?: string;       // 预览文本（如果preview=true）
  success_count: number;
  failure_count: number;
}

/**
 * 检测进度信息
 */
export interface ICheckProgress {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;           // 进度百分比（0-100）
  current_step: string;       // 当前步骤描述
  estimated_time?: number;    // 预估剩余时间（秒）
  error_message?: string;     // 错误信息（如果失败）
}

/**
 * 中文语法规则
 */
export interface IChineseGrammarRule {
  id: string;
  name: string;
  description: string;
  pattern: RegExp | string;   // 匹配模式
  category: string;           // 规则分类
  severity: IssueSeverity;
  suggestion_template: string; // 建议模板
  examples: {
    wrong: string;
    correct: string;
  }[];
}

/**
 * 词典条目
 */
export interface IDictionaryEntry {
  word: string;
  correct: string[];          // 正确写法
  wrong: string[];           // 常见错误写法
  frequency: number;         // 使用频率
  context: string[];         // 使用上下文
}

/**
 * 导出API响应类型
 */
export type {
  IssueType,
  IssueSeverity,
  CheckType,
  ITextPosition,
  ISuggestion,
  IGrammarIssue,
  ICheckStatistics,
  IGrammarCheckResult,
  ICheckOptions,
  IBatchFixOperation,
  IBatchFixResult,
  ICheckProgress,
  IChineseGrammarRule,
  IDictionaryEntry
};