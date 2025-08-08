// 提取器配置

import { ExtractorConfig, ChinesePatterns } from '../types/extraction.types';
import {
  CHINESE_SURNAMES,
  COMPOUND_SURNAMES,
  KEY_UNIVERSITIES,
  COMPANY_TYPE_KEYWORDS,
  POSITION_LEVELS,
  SKILL_CATEGORIES,
} from '../utils/chinese-patterns.util';

// 默认中文模式配置
const defaultChinesePatterns: ChinesePatterns = {
  surnames: CHINESE_SURNAMES,
  compound_surnames: COMPOUND_SURNAMES,
  minority_names: [], // 少数民族姓名模式可以后续扩展
  university_keywords: KEY_UNIVERSITIES,
  company_types: Object.keys(COMPANY_TYPE_KEYWORDS),
  position_levels: Object.keys(POSITION_LEVELS),
  skill_categories: Object.keys(SKILL_CATEGORIES),
};

// 默认提取器配置
export const DEFAULT_EXTRACTOR_CONFIG: ExtractorConfig = {
  enable_ai_assistance: process.env.ENABLE_AI_EXTRACTION === 'true' || false,
  ai_model: process.env.AI_MODEL || 'deepseek-chat',
  confidence_threshold: 0.6,
  max_retries: 3,
  timeout_ms: 30000, // 30秒超时
  language: 'zh-CN',
  patterns: defaultChinesePatterns,
};

// 高精度配置（启用AI，更高的置信度要求）
export const HIGH_ACCURACY_CONFIG: ExtractorConfig = {
  enable_ai_assistance: true,
  ai_model: 'deepseek-chat',
  confidence_threshold: 0.8,
  max_retries: 5,
  timeout_ms: 60000, // 60秒超时
  language: 'zh-CN',
  patterns: defaultChinesePatterns,
};

// 快速模式配置（仅规则提取）
export const FAST_MODE_CONFIG: ExtractorConfig = {
  enable_ai_assistance: false,
  confidence_threshold: 0.5,
  max_retries: 1,
  timeout_ms: 15000, // 15秒超时
  language: 'zh-CN',
  patterns: defaultChinesePatterns,
};

// 英文简历配置
export const ENGLISH_CONFIG: ExtractorConfig = {
  enable_ai_assistance: process.env.ENABLE_AI_EXTRACTION === 'true' || false,
  ai_model: process.env.AI_MODEL || 'deepseek-chat',
  confidence_threshold: 0.6,
  max_retries: 3,
  timeout_ms: 30000,
  language: 'en-US',
  patterns: {
    surnames: [], // 英文不需要姓氏库
    compound_surnames: [],
    minority_names: [],
    university_keywords: [
      'Harvard',
      'MIT',
      'Stanford',
      'Yale',
      'Princeton',
      'Columbia',
      'UPenn',
      'Cornell',
      'Dartmouth',
      'Brown',
      'University',
      'College',
      'Institute',
    ],
    company_types: [
      'Inc',
      'Corp',
      'LLC',
      'Ltd',
      'Co',
      'Company',
      'Corporation',
    ],
    position_levels: [
      'Senior',
      'Junior',
      'Lead',
      'Principal',
      'Manager',
      'Director',
      'VP',
      'CTO',
      'CEO',
    ],
    skill_categories: Object.keys(SKILL_CATEGORIES),
  },
};

/**
 * 根据环境变量获取配置
 */
export function getExtractorConfig(): ExtractorConfig {
  const mode = process.env.EXTRACTION_MODE || 'default';

  switch (mode) {
    case 'high_accuracy':
      return HIGH_ACCURACY_CONFIG;
    case 'fast':
      return FAST_MODE_CONFIG;
    case 'english':
      return ENGLISH_CONFIG;
    default:
      return DEFAULT_EXTRACTOR_CONFIG;
  }
}

/**
 * 创建自定义配置
 */
export function createCustomConfig(
  overrides: Partial<ExtractorConfig>
): ExtractorConfig {
  return {
    ...DEFAULT_EXTRACTOR_CONFIG,
    ...overrides,
    patterns: {
      ...DEFAULT_EXTRACTOR_CONFIG.patterns,
      ...overrides.patterns,
    },
  };
}
