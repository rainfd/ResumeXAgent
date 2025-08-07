import { readFile, unlink, stat } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface FileMetadata {
  id: string;
  originalFilename: string;
  filename: string;
  fileType: string;
  fileSize: number;
  uploadPath: string;
  mimeType?: string;
  createdAt: Date;
}

export interface FileUploadResult {
  success: boolean;
  fileId?: string;
  metadata?: FileMetadata;
  error?: string;
}

export class FileService {
  private readonly uploadDir: string;
  private readonly maxFileSize: number;
  private readonly allowedTypes: string[];

  constructor(
    uploadDir: string = 'data/uploads',
    maxFileSize: number = 10 * 1024 * 1024, // 10MB
    allowedTypes: string[] = ['.pdf', '.md', '.txt']
  ) {
    this.uploadDir = path.resolve(process.cwd(), uploadDir);
    this.maxFileSize = maxFileSize;
    this.allowedTypes = allowedTypes;
  }

  /**
   * 生成唯一文件ID
   */
  generateFileId(): string {
    return uuidv4();
  }

  /**
   * 验证文件类型
   */
  validateFileType(filename: string, mimeType?: string): boolean {
    const extension = path.extname(filename).toLowerCase();
    
    // 检查文件扩展名
    if (!this.allowedTypes.includes(extension)) {
      return false;
    }

    // 可选：检查MIME类型（如果提供）
    if (mimeType) {
      const allowedMimeTypes: Record<string, string[]> = {
        '.pdf': ['application/pdf'],
        '.md': ['text/markdown', 'text/x-markdown'],
        '.txt': ['text/plain'],
      };

      const validMimeTypes = allowedMimeTypes[extension];
      if (validMimeTypes && !validMimeTypes.includes(mimeType)) {
        return false;
      }
    }

    return true;
  }

  /**
   * 验证文件大小
   */
  validateFileSize(fileSize: number): boolean {
    return fileSize > 0 && fileSize <= this.maxFileSize;
  }

  /**
   * 获取文件完整路径
   */
  getFilePath(filename: string): string {
    return path.join(this.uploadDir, filename);
  }

  /**
   * 获取文件内容
   */
  async getFileContent(fileId: string): Promise<Buffer | null> {
    try {
      // TODO: 从数据库获取文件信息
      // const fileInfo = await resumeRepository.getById(fileId);
      // if (!fileInfo) return null;
      
      // 临时实现：直接从文件系统读取
      // 在实际实现中应该从数据库获取filename
      const files = await this.listUploadedFiles();
      const targetFile = files.find(f => f.includes(fileId));
      
      if (!targetFile) {
        return null;
      }

      const filePath = this.getFilePath(targetFile);
      return await readFile(filePath);
    } catch (error) {
      // TODO: Use logger service
      // logger.error('Failed to read file content', { fileId, error });
      return null;
    }
  }

  /**
   * 删除文件
   */
  async deleteFile(filename: string): Promise<boolean> {
    try {
      const filePath = this.getFilePath(filename);
      await unlink(filePath);
      return true;
    } catch (error) {
      // TODO: Use logger service
      // logger.error('Failed to delete file', { filename, error });
      return false;
    }
  }

  /**
   * 检查文件是否存在
   */
  async fileExists(filename: string): Promise<boolean> {
    try {
      const filePath = this.getFilePath(filename);
      await stat(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取文件信息
   */
  async getFileInfo(filename: string): Promise<FileMetadata | null> {
    try {
      const filePath = this.getFilePath(filename);
      const stats = await stat(filePath);
      
      return {
        id: path.basename(filename, path.extname(filename)),
        originalFilename: filename,
        filename: filename,
        fileType: path.extname(filename).slice(1),
        fileSize: stats.size,
        uploadPath: filePath,
        createdAt: stats.birthtime,
      };
    } catch (error) {
      // TODO: Use logger service
      // logger.error('Failed to get file info', { filename, error });
      return null;
    }
  }

  /**
   * 列出上传目录中的文件
   */
  async listUploadedFiles(): Promise<string[]> {
    try {
      const fs = require('fs').promises;
      const files = await fs.readdir(this.uploadDir);
      return files.filter((file: string) => 
        this.allowedTypes.includes(path.extname(file).toLowerCase())
      );
    } catch (error) {
      // TODO: Use logger service
      // logger.error('Failed to list uploaded files', { error });
      return [];
    }
  }

  /**
   * 清理临时文件（删除超过指定时间的文件）
   */
  async cleanupTempFiles(maxAgeHours: number = 24): Promise<number> {
    try {
      const files = await this.listUploadedFiles();
      const now = Date.now();
      const maxAge = maxAgeHours * 60 * 60 * 1000; // 转换为毫秒
      let deletedCount = 0;

      for (const filename of files) {
        const fileInfo = await this.getFileInfo(filename);
        if (fileInfo && (now - fileInfo.createdAt.getTime()) > maxAge) {
          const deleted = await this.deleteFile(filename);
          if (deleted) {
            deletedCount++;
          }
        }
      }

      // TODO: Use logger service
      // logger.info('Cleanup completed', { deletedCount, maxAgeHours });
      
      return deletedCount;
    } catch (error) {
      // TODO: Use logger service
      // logger.error('Cleanup failed', { error });
      return 0;
    }
  }

  /**
   * 获取上传目录状态
   */
  async getUploadDirStatus(): Promise<{
    totalFiles: number;
    totalSize: number;
    availableTypes: string[];
  }> {
    try {
      const files = await this.listUploadedFiles();
      let totalSize = 0;

      for (const filename of files) {
        const fileInfo = await this.getFileInfo(filename);
        if (fileInfo) {
          totalSize += fileInfo.fileSize;
        }
      }

      return {
        totalFiles: files.length,
        totalSize,
        availableTypes: this.allowedTypes,
      };
    } catch (error) {
      // TODO: Use logger service
      // logger.error('Failed to get upload dir status', { error });
      return {
        totalFiles: 0,
        totalSize: 0,
        availableTypes: this.allowedTypes,
      };
    }
  }
}

// 默认文件服务实例
export const fileService = new FileService();