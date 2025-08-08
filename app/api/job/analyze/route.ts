import { NextRequest, NextResponse } from 'next/server';
import { BrowserService } from '@/lib/services/browser.service';
import { JobRepository } from '@/lib/repositories/job.repository';
import { logger } from '@/lib/utils/logger';

interface AnalyzeRequest {
  url: string;
}

// 辅助函数：从提取的岗位信息创建数据库记录
function createJobFromInfo(jobRepository: JobRepository, url: string, jobInfo: any) {
  const jobData = {
    url: url,
    title: jobInfo.title,
    company: jobInfo.company,
    location: jobInfo.location || null,
    salary_range: jobInfo.salary_range || null,
    experience_required: jobInfo.experience_required || null,
    education_required: jobInfo.education_required || null,
    raw_description: jobInfo.raw_description,
  };
  return jobRepository.create(jobData);
}

export async function POST(request: NextRequest) {
  let browserService: BrowserService | null = null;

  try {
    // 检查请求体是否为空
    const contentLength = request.headers.get('content-length');
    if (!contentLength || contentLength === '0') {
      return NextResponse.json(
        { success: false, error: '请求体不能为空' },
        { status: 400 }
      );
    }

    const body: AnalyzeRequest = await request.json();

    if (!body.url) {
      return NextResponse.json(
        { success: false, error: '缺少必需的 url 参数' },
        { status: 400 }
      );
    }

    // 验证URL格式
    let validUrl: URL;
    try {
      validUrl = new URL(body.url);
    } catch {
      return NextResponse.json(
        { success: false, error: 'URL 格式无效' },
        { status: 400 }
      );
    }

    // 验证是否为Boss直聘网址
    const isBossUrl =
      validUrl.hostname.includes('zhipin.com') ||
      validUrl.hostname.includes('boss.com');

    if (!isBossUrl) {
      return NextResponse.json(
        { success: false, error: '仅支持Boss直聘网址' },
        { status: 400 }
      );
    }

    logger.info(`开始分析岗位URL: ${body.url}`);

    // 检查是否已存在该URL的岗位
    const jobRepository = new JobRepository();
    const existingJob = jobRepository.findByUrl(body.url);

    if (existingJob) {
      logger.info(`岗位已存在，直接返回: ${existingJob.id}`);
      return NextResponse.json({
        success: true,
        data: {
          id: existingJob.id,
          url: existingJob.url,
          title: existingJob.title,
          company: existingJob.company,
          location: existingJob.location,
          salary_range: existingJob.salary_range,
          experience_required: existingJob.experience_required,
          education_required: existingJob.education_required,
          raw_description: existingJob.raw_description,
          created_at: existingJob.created_at,
        },
        message: '岗位信息已存在，直接返回缓存结果',
      });
    }

    // 使用浏览器服务获取岗位信息
    browserService = new BrowserService();
    const result = await browserService.fetchJobPage(body.url);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || '获取岗位信息失败',
          needsUserAction: result.needsUserAction,
          message: result.message,
        },
        { status: result.needsUserAction ? 202 : 400 }
      );
    }

    if (!result.data) {
      return NextResponse.json(
        { success: false, error: '未能提取到岗位信息' },
        { status: 400 }
      );
    }

    // 存储岗位信息到数据库
    const createdJob = createJobFromInfo(jobRepository, body.url, result.data);

    logger.info(`岗位分析完成，已保存: ${createdJob.id}`);

    return NextResponse.json({
      success: true,
      data: {
        id: createdJob.id,
        url: createdJob.url,
        title: createdJob.title,
        company: createdJob.company,
        location: createdJob.location,
        salary_range: createdJob.salary_range,
        experience_required: createdJob.experience_required,
        education_required: createdJob.education_required,
        raw_description: createdJob.raw_description,
        created_at: createdJob.created_at,
      },
      message: '岗位分析完成',
    });
  } catch (error) {
    logger.error('岗位分析API错误', 'API', error instanceof Error ? error : undefined);

    return NextResponse.json(
      {
        success: false,
        error: '服务器内部错误，请稍后重试',
      },
      { status: 500 }
    );
  } finally {
    // 确保浏览器关闭
    if (browserService) {
      try {
        await browserService.closeBrowser();
      } catch (error) {
        logger.error('关闭浏览器失败', 'API', error instanceof Error ? error : undefined);
      }
    }
  }
}

// 处理需要用户验证的情况
export async function PUT(request: NextRequest) {
  let browserService: BrowserService | null = null;

  try {
    const body = await request.json();

    if (!body.url) {
      return NextResponse.json(
        { success: false, error: '缺少必需的 url 参数' },
        { status: 400 }
      );
    }

    logger.info(`继续分析岗位URL（验证后）: ${body.url}`);

    browserService = new BrowserService();

    // 等待用户验证完成
    const verified = await browserService.waitForUserVerification();

    if (!verified) {
      return NextResponse.json(
        {
          success: false,
          error: '用户验证超时或失败',
        },
        { status: 408 }
      );
    }

    // 继续提取岗位信息
    const jobInfo = await browserService.extractJobInfo();

    // 存储到数据库
    const jobRepository = new JobRepository();
    const createdJob = createJobFromInfo(jobRepository, body.url, jobInfo);

    logger.info(`岗位分析完成（验证后），已保存: ${createdJob.id}`);

    return NextResponse.json({
      success: true,
      data: {
        id: createdJob.id,
        url: createdJob.url,
        title: createdJob.title,
        company: createdJob.company,
        location: createdJob.location,
        salary_range: createdJob.salary_range,
        experience_required: createdJob.experience_required,
        education_required: createdJob.education_required,
        raw_description: createdJob.raw_description,
        created_at: createdJob.created_at,
      },
      message: '岗位分析完成',
    });
  } catch (error) {
    logger.error('岗位分析API错误（验证后）', 'API', error instanceof Error ? error : undefined);

    return NextResponse.json(
      {
        success: false,
        error: '服务器内部错误，请稍后重试',
      },
      { status: 500 }
    );
  } finally {
    if (browserService) {
      try {
        await browserService.closeBrowser();
      } catch (error) {
        logger.error('关闭浏览器失败', 'API', error instanceof Error ? error : undefined);
      }
    }
  }
}
