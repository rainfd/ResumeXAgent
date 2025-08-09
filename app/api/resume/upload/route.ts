import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { fileService } from '@/lib/services/file.service';

// 上传验证 schema
const FileUploadSchema = z.object({
  filename: z.string().max(255, '文件名过长'),
  fileType: z.enum(['pdf', 'md', 'txt']),
  fileSize: z
    .number()
    .max(10 * 1024 * 1024, '文件大小超过 10MB 限制')
    .min(1, '文件不能为空'),
});

// MIME 类型映射
const ALLOWED_MIME_TYPES = {
  'application/pdf': 'pdf',
  'text/markdown': 'md',
  'text/plain': 'txt',
  'text/x-markdown': 'md',
} as const;

// 生成唯一文件名
function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = path.extname(originalName);
  const baseName = path.basename(originalName, extension);
  return `${baseName}-${timestamp}-${random}${extension}`;
}

// 验证文件类型
function validateFileType(file: File): string {
  const mimeType = file.type as keyof typeof ALLOWED_MIME_TYPES;

  if (!mimeType || !ALLOWED_MIME_TYPES[mimeType]) {
    // 如果 MIME 类型不可用，尝试从文件扩展名推断
    const extension = path.extname(file.name).toLowerCase();
    const extensionToType: Record<string, string> = {
      '.pdf': 'pdf',
      '.md': 'md',
      '.txt': 'txt',
    };

    const fileType = extensionToType[extension];
    if (!fileType) {
      throw new Error('不支持的文件类型，仅支持 PDF、Markdown 和文本文件');
    }
    return fileType;
  }

  return ALLOWED_MIME_TYPES[mimeType];
}

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

export async function POST(request: NextRequest) {
  try {
    // 解析表单数据
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return createApiResponse(false, null, '请选择要上传的文件', 400);
    }

    // 验证文件类型
    let fileType: string;
    try {
      fileType = validateFileType(file);
    } catch (error) {
      return createApiResponse(
        false,
        null,
        error instanceof Error ? error.message : '文件类型验证失败',
        400
      );
    }

    // 验证文件数据
    try {
      FileUploadSchema.parse({
        filename: file.name,
        fileType,
        fileSize: file.size,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.issues.map((e: any) => e.message).join(', ');
        return createApiResponse(false, null, errorMessage, 400);
      }
      return createApiResponse(false, null, '文件验证失败', 400);
    }

    // 确保上传目录存在
    const uploadDir = path.join(process.cwd(), 'data', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    // 生成唯一文件名
    const uniqueFilename = generateUniqueFilename(file.name);
    const filePath = path.join(uploadDir, uniqueFilename);

    // 读取文件内容
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 保存文件
    await writeFile(filePath, buffer);

    // 生成文件ID和元数据
    const fileId = fileService.generateFileId();
    const fileMetadata = {
      id: fileId,
      originalFilename: file.name,
      filename: uniqueFilename,
      fileType,
      fileSize: file.size,
      uploadPath: `/data/uploads/${uniqueFilename}`,
      mimeType: file.type,
      createdAt: new Date(),
    };

    // TODO: 在实际实现中，这里应该:
    // 1. 将文件元数据存储到数据库
    // await resumeRepository.create(fileMetadata);
    // 2. 触发文件解析任务
    // 3. 生成文件访问权限

    // 返回成功响应
    return createApiResponse(true, fileMetadata);
  } catch (error) {
    // TODO: Use logger service instead of console.error
    // logger.error('File upload error', { error });

    return createApiResponse(false, null, '服务器内部错误，上传失败', 500);
  }
}

// 处理 GET 请求（可能用于检查上传状态）
export async function GET() {
  return createApiResponse(false, null, '方法不允许', 405);
}

// 处理其他 HTTP 方法
export async function PUT() {
  return createApiResponse(false, null, '方法不允许', 405);
}

export async function DELETE() {
  return createApiResponse(false, null, '方法不允许', 405);
}
