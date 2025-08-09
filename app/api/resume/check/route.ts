import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { GrammarCheckerService } from '@/lib/services/grammar-checker.service';
import { ResumeRepository } from '@/lib/repositories/resume.repository';
import { 
  ICheckOptions, 
  IGrammarCheckResult,
  CheckType,
  IBatchFixOperation 
} from '@/lib/types/grammar-issue.types';
import { logger } from '@/lib/utils/logger';

// 检查请求验证 schema
const GrammarCheckSchema = z.object({
  text: z.string().min(1, '文本内容不能为空').max(50000, '文本内容过长'),
  resumeId: z.string().optional(),
  options: z.object({
    enable_ai_check: z.boolean().optional(),
    enable_rule_check: z.boolean().optional(),
    check_typos: z.boolean().optional(),
    check_grammar: z.boolean().optional(),
    check_format: z.boolean().optional(),
    check_style: z.boolean().optional(),
    industry_context: z.string().optional(),
    max_suggestions: z.number().min(1).max(100).optional()
  }).optional()
});

// 批量修复请求验证 schema
const BatchFixSchema = z.object({
  text: z.string().min(1, '文本内容不能为空'),
  operation: z.object({
    issue_ids: z.array(z.string()).min(1, '至少选择一个问题'),
    auto_apply: z.boolean(),
    preview: z.boolean()
  })
});

// 创建 API 响应格式
function createApiResponse<T>(
  success: boolean,
  data?: T,
  error?: string,
  code: number = 200
) {
  return NextResponse.json(
    {
      success,
      data: data || null,
      error: error || null,
      timestamp: new Date().toISOString(),
    },
    { status: code }
  );
}

// 初始化服务
const grammarCheckerService = new GrammarCheckerService();
const resumeRepository = new ResumeRepository();

/**
 * POST /api/resume/check - 执行语法检查
 */
export async function POST(request: NextRequest) {
  try {
    logger.info('接收语法检查请求');

    // 解析请求体
    const body = await request.json();
    
    // 验证请求数据
    let validatedData;
    try {
      validatedData = GrammarCheckSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.issues.map((e) => e.message).join(', ');
        return createApiResponse(false, null, errorMessage, 400);
      }
      return createApiResponse(false, null, '请求数据验证失败', 400);
    }

    const { text, resumeId, options = {} } = validatedData;

    // 获取简历数据（如果提供了resumeId）
    let resumeData = null;
    if (resumeId) {
      try {
        resumeData = await resumeRepository.findById(resumeId);
        if (!resumeData) {
          return createApiResponse(false, null, '简历不存在', 404);
        }
      } catch (error) {
        logger.error('获取简历数据失败', { resumeId, error });
        return createApiResponse(false, null, '获取简历数据失败', 500);
      }
    }

    // 设置默认检查选项
    const checkOptions: ICheckOptions = {
      enable_ai_check: options.enable_ai_check ?? false,
      enable_rule_check: options.enable_rule_check ?? true,
      check_typos: options.check_typos ?? true,
      check_grammar: options.check_grammar ?? true,
      check_format: options.check_format ?? true,
      check_style: options.check_style ?? true,
      industry_context: options.industry_context,
      max_suggestions: options.max_suggestions ?? 50
    };

    // 执行语法检查
    let result: IGrammarCheckResult;
    try {
      result = await grammarCheckerService.checkGrammar(
        text,
        resumeData || undefined,
        checkOptions
      );
    } catch (error) {
      logger.error('语法检查失败', { error, resumeId });
      return createApiResponse(
        false, 
        null, 
        error instanceof Error ? error.message : '语法检查失败', 
        500
      );
    }

    // 记录检查结果
    logger.info('语法检查完成', {
      checkId: result.id,
      resumeId: result.resume_id,
      issueCount: result.issues.length,
      overallScore: result.statistics.overall_score,
      processingTime: result.processing_time
    });

    // 返回结果（移除原始文本以减少响应大小）
    const responseData = {
      ...result,
      processed_text: undefined // 不返回处理的文本内容
    };

    return createApiResponse(true, responseData);

  } catch (error) {
    logger.error('语法检查API错误', { error });
    return createApiResponse(false, null, '服务器内部错误', 500);
  }
}

/**
 * PUT /api/resume/check - 批量修复问题
 */
export async function PUT(request: NextRequest) {
  try {
    logger.info('接收批量修复请求');

    // 解析请求体
    const body = await request.json();
    
    // 验证请求数据
    let validatedData;
    try {
      validatedData = BatchFixSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.issues.map((e) => e.message).join(', ');
        return createApiResponse(false, null, errorMessage, 400);
      }
      return createApiResponse(false, null, '请求数据验证失败', 400);
    }

    const { text, operation } = validatedData;

    // 执行批量修复
    try {
      const result = await grammarCheckerService.batchFix(text, operation);
      
      logger.info('批量修复完成', {
        operationId: result.operation_id,
        successCount: result.success_count,
        failureCount: result.failure_count
      });

      return createApiResponse(true, result);
    } catch (error) {
      logger.error('批量修复失败', { error });
      return createApiResponse(
        false, 
        null, 
        error instanceof Error ? error.message : '批量修复失败', 
        500
      );
    }

  } catch (error) {
    logger.error('批量修复API错误', { error });
    return createApiResponse(false, null, '服务器内部错误', 500);
  }
}

/**
 * GET /api/resume/check - 获取检查进度或服务状态
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const checkId = searchParams.get('checkId');
    const action = searchParams.get('action');

    if (action === 'status') {
      // 获取服务状态
      try {
        const status = await grammarCheckerService.getServiceStatus();
        return createApiResponse(true, status);
      } catch (error) {
        logger.error('获取服务状态失败', { error });
        return createApiResponse(false, null, '获取服务状态失败', 500);
      }
    }

    if (checkId) {
      // 获取检查进度
      try {
        const progress = await grammarCheckerService.getCheckProgress(checkId);
        if (!progress) {
          return createApiResponse(false, null, '检查任务不存在', 404);
        }
        return createApiResponse(true, progress);
      } catch (error) {
        logger.error('获取检查进度失败', { checkId, error });
        return createApiResponse(false, null, '获取检查进度失败', 500);
      }
    }

    // 返回API使用说明
    const apiInfo = {
      version: '1.0.0',
      endpoints: {
        'POST /api/resume/check': '执行语法检查',
        'PUT /api/resume/check': '批量修复问题', 
        'GET /api/resume/check?action=status': '获取服务状态',
        'GET /api/resume/check?checkId={id}': '获取检查进度'
      },
      description: '简历语法检测API - 支持中文语法、格式和简历专项问题检测'
    };

    return createApiResponse(true, apiInfo);

  } catch (error) {
    logger.error('语法检查API GET错误', { error });
    return createApiResponse(false, null, '服务器内部错误', 500);
  }
}

/**
 * DELETE /api/resume/check - 取消检查任务
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const checkId = searchParams.get('checkId');

    if (!checkId) {
      return createApiResponse(false, null, '缺少checkId参数', 400);
    }

    // TODO: 实现取消检查任务的逻辑
    // 目前简单返回成功状态
    logger.info('取消检查任务', { checkId });

    return createApiResponse(true, { 
      checkId, 
      status: 'cancelled',
      message: '检查任务已取消' 
    });

  } catch (error) {
    logger.error('取消检查任务失败', { error });
    return createApiResponse(false, null, '取消任务失败', 500);
  }
}

// 处理不支持的 HTTP 方法
export async function PATCH() {
  return createApiResponse(false, null, '方法不允许', 405);
}

export async function OPTIONS() {
  return createApiResponse(false, null, '方法不允许', 405);
}