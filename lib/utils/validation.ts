/**
 * 输入数据验证系统
 * 提供类型安全的数据验证功能，防止无效数据进入数据库
 */

export interface ValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: readonly string[];
  custom?: (value: any) => boolean | string;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * 数据验证器类
 */
export class Validator {
  /**
   * 验证数据是否符合指定的 schema
   */
  static validate<T>(data: T, schema: ValidationSchema): ValidationResult {
    const errors: ValidationError[] = [];

    for (const [fieldName, rule] of Object.entries(schema)) {
      const value = (data as any)[fieldName];
      const fieldErrors = this.validateField(fieldName, value, rule);
      errors.push(...fieldErrors);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 验证单个字段
   */
  private static validateField(fieldName: string, value: any, rule: ValidationRule): ValidationError[] {
    const errors: ValidationError[] = [];

    // 检查必填字段
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push({
        field: fieldName,
        message: `${fieldName} is required`
      });
      return errors; // 如果必填字段为空，不需要继续验证其他规则
    }

    // 如果字段不是必填且为空，跳过其他验证
    if (!rule.required && (value === undefined || value === null || value === '')) {
      return errors;
    }

    // 类型检查
    if (rule.type && typeof value !== rule.type) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must be of type ${rule.type}`
      });
      return errors; // 类型不匹配时，跳过其他验证
    }

    // 字符串长度验证
    if (rule.type === 'string' && typeof value === 'string') {
      if (rule.minLength !== undefined && value.length < rule.minLength) {
        errors.push({
          field: fieldName,
          message: `${fieldName} must be at least ${rule.minLength} characters long`
        });
      }
      if (rule.maxLength !== undefined && value.length > rule.maxLength) {
        errors.push({
          field: fieldName,
          message: `${fieldName} must not exceed ${rule.maxLength} characters`
        });
      }
    }

    // 数字范围验证
    if (rule.type === 'number' && typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        errors.push({
          field: fieldName,
          message: `${fieldName} must be at least ${rule.min}`
        });
      }
      if (rule.max !== undefined && value > rule.max) {
        errors.push({
          field: fieldName,
          message: `${fieldName} must not exceed ${rule.max}`
        });
      }
    }

    // 正则表达式验证
    if (rule.pattern && typeof value === 'string') {
      if (!rule.pattern.test(value)) {
        errors.push({
          field: fieldName,
          message: `${fieldName} format is invalid`
        });
      }
    }

    // 枚举值验证
    if (rule.enum && !rule.enum.includes(value)) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must be one of: ${rule.enum.join(', ')}`
      });
    }

    // 自定义验证
    if (rule.custom) {
      const customResult = rule.custom(value);
      if (typeof customResult === 'string') {
        errors.push({
          field: fieldName,
          message: customResult
        });
      } else if (!customResult) {
        errors.push({
          field: fieldName,
          message: `${fieldName} failed custom validation`
        });
      }
    }

    return errors;
  }
}

// 预定义的验证 schemas
export const validationSchemas = {
  // 简历创建数据验证
  createResume: {
    original_filename: {
      required: true,
      type: 'string' as const,
      minLength: 1,
      maxLength: 255,
      pattern: /^[^<>:"/\\|?*\x00-\x1f]+$/
    },
    file_type: {
      required: true,
      type: 'string' as const,
      enum: ['pdf', 'markdown', 'txt'] as const
    },
    raw_text: {
      required: true,
      type: 'string' as const,
      minLength: 10,
      maxLength: 1000000
    }
  },

  // 简历更新数据验证
  updateResume: {
    original_filename: {
      required: false,
      type: 'string' as const,
      minLength: 1,
      maxLength: 255,
      pattern: /^[^<>:"/\\|?*\x00-\x1f]+$/
    },
    file_type: {
      required: false,
      type: 'string' as const,
      enum: ['pdf', 'markdown', 'txt'] as const
    },
    raw_text: {
      required: false,
      type: 'string' as const,
      minLength: 10,
      maxLength: 1000000
    }
  },

  // 岗位创建数据验证
  createJob: {
    title: {
      required: true,
      type: 'string' as const,
      minLength: 1,
      maxLength: 255
    },
    company: {
      required: true,
      type: 'string' as const,
      minLength: 1,
      maxLength: 255
    },
    raw_description: {
      required: true,
      type: 'string' as const,
      minLength: 10,
      maxLength: 100000
    },
    url: {
      required: false,
      type: 'string' as const,
      maxLength: 2048,
      pattern: /^https?:\/\/.+/
    },
    location: {
      required: false,
      type: 'string' as const,
      maxLength: 255
    },
    salary_range: {
      required: false,
      type: 'string' as const,
      maxLength: 100
    },
    experience_required: {
      required: false,
      type: 'string' as const,
      maxLength: 100
    },
    education_required: {
      required: false,
      type: 'string' as const,
      maxLength: 100
    }
  },

  // 分析数据创建验证
  createAnalysis: {
    resume_id: {
      required: true,
      type: 'string' as const,
      pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    },
    job_id: {
      required: false,
      type: 'string' as const,
      pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    },
    analysis_type: {
      required: true,
      type: 'string' as const,
      enum: ['star_check', 'optimization', 'grammar_check', 'custom'] as const
    },
    ai_model: {
      required: true,
      type: 'string' as const,
      minLength: 1,
      maxLength: 100
    },
    results: {
      required: true,
      type: 'object' as const
    },
    score: {
      required: false,
      type: 'number' as const,
      min: 0,
      max: 100
    }
  },

  // 匹配数据创建验证
  createMatch: {
    resume_id: {
      required: true,
      type: 'string' as const,
      pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    },
    job_id: {
      required: true,
      type: 'string' as const,
      pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    },
    match_score: {
      required: true,
      type: 'number' as const,
      min: 0,
      max: 100
    },
    hr_message: {
      required: false,
      type: 'string' as const,
      maxLength: 5000
    }
  },

  // 自定义提示词验证
  createCustomPrompt: {
    name: {
      required: true,
      type: 'string' as const,
      minLength: 1,
      maxLength: 255
    },
    description: {
      required: false,
      type: 'string' as const,
      maxLength: 1000
    },
    prompt_template: {
      required: false,
      type: 'string' as const,
      maxLength: 10000
    },
    ai_model: {
      required: false,
      type: 'string' as const,
      maxLength: 100
    },
    category: {
      required: false,
      type: 'string' as const,
      maxLength: 100
    }
  }
} as const;

/**
 * 验证工具函数
 */
export const validateData = <T>(data: T, schema: ValidationSchema): T => {
  const result = Validator.validate(data, schema);
  
  if (!result.isValid) {
    const errorMessages = result.errors.map(error => 
      `${error.field}: ${error.message}`
    ).join('; ');
    
    throw new Error(`Validation failed: ${errorMessages}`);
  }
  
  return data;
};