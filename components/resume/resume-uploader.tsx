'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface FileUploadState {
  id: string;
  file: File;
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
}

interface ResumeUploaderProps {
  onFileUpload?: (file: File) => Promise<void>;
  onUploadComplete?: (fileId: string, result: any) => void;
  onUploadError?: (fileId: string, error: string) => void;
  maxFileSize?: number; // in bytes
  acceptedFileTypes?: string[];
  disabled?: boolean;
  className?: string;
}

const DEFAULT_ACCEPTED_TYPES = ['.pdf', '.md', '.txt'];
const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function ResumeUploader({
  onFileUpload,
  onUploadComplete,
  onUploadError,
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  acceptedFileTypes = DEFAULT_ACCEPTED_TYPES,
  disabled = false,
  className,
}: ResumeUploaderProps) {
  const [files, setFiles] = useState<FileUploadState[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 文件验证
  const validateFile = useCallback(
    (file: File): string | null => {
      // 文件大小检查
      if (file.size > maxFileSize) {
        return `文件大小超过 ${Math.round(maxFileSize / 1024 / 1024)}MB 限制`;
      }

      // 文件类型检查
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!acceptedFileTypes.includes(fileExtension)) {
        return `不支持的文件类型，仅支持: ${acceptedFileTypes.join(', ')}`;
      }

      return null;
    },
    [maxFileSize, acceptedFileTypes]
  );

  // 生成唯一文件ID
  const generateFileId = () => Math.random().toString(36).substring(2, 15);

  // 处理文件选择
  const handleFileSelect = useCallback(
    (selectedFiles: FileList) => {
      if (disabled) return;

      const newFiles: FileUploadState[] = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const validationError = validateFile(file);

        if (validationError) {
          const fileId = generateFileId();
          newFiles.push({
            id: fileId,
            file,
            progress: 0,
            status: 'error',
            errorMessage: validationError,
          });
          onUploadError?.(fileId, validationError);
        } else {
          newFiles.push({
            id: generateFileId(),
            file,
            progress: 0,
            status: 'idle',
          });
        }
      }

      setFiles((prev) => [...prev, ...newFiles]);

      // 自动上传有效文件将在 useEffect 中处理
    },
    [disabled, validateFile, onUploadError]
  );

  // 上传单个文件
  const uploadFile = useCallback(
    async (fileState: FileUploadState) => {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileState.id ? { ...f, status: 'uploading', progress: 0 } : f
        )
      );

      try {
        // 模拟上传进度
        const progressInterval = setInterval(() => {
          setFiles((prev) =>
            prev.map((f) => {
              if (f.id === fileState.id && f.status === 'uploading') {
                const newProgress = Math.min(
                  f.progress + Math.random() * 30,
                  90
                );
                return { ...f, progress: newProgress };
              }
              return f;
            })
          );
        }, 200);

        // 执行实际上传
        if (onFileUpload) {
          await onFileUpload(fileState.file);
        }

        clearInterval(progressInterval);

        // 上传成功
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileState.id
              ? { ...f, status: 'success', progress: 100 }
              : f
          )
        );

        onUploadComplete?.(fileState.id, { filename: fileState.file.name });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : '上传失败';

        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileState.id
              ? { ...f, status: 'error', errorMessage, progress: 0 }
              : f
          )
        );

        onUploadError?.(fileState.id, errorMessage);
      }
    },
    [onFileUpload, onUploadComplete, onUploadError]
  );

  // 重试上传
  const retryUpload = (fileId: string) => {
    const fileState = files.find((f) => f.id === fileId);
    if (fileState) {
      uploadFile(fileState);
    }
  };

  // 移除文件
  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  // 拖拽处理
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) {
        setIsDragOver(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      if (disabled) return;

      const droppedFiles = e.dataTransfer.files;
      if (droppedFiles.length > 0) {
        handleFileSelect(droppedFiles);
      }
    },
    [disabled, handleFileSelect]
  );

  // 点击选择文件
  const handleButtonClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files);
      // 清空 input 值，允许重新选择同一文件
      e.target.value = '';
    }
  };

  // 自动上传idle状态的文件
  useEffect(() => {
    files.forEach(async (fileState) => {
      if (fileState.status === 'idle' && onFileUpload) {
        await uploadFile(fileState);
      }
    });
  }, [files, onFileUpload, uploadFile]);

  return (
    <div className={cn('w-full space-y-4', className)}>
      {/* 文件拖拽上传区域 */}
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer',
          isDragOver
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/10'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50',
          disabled && 'cursor-not-allowed opacity-50'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleButtonClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedFileTypes.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />

        <div className="space-y-4">
          <div
            className={cn(
              'mx-auto w-16 h-16 rounded-full flex items-center justify-center transition-colors',
              isDragOver ? 'bg-blue-100 dark:bg-blue-900/20' : 'bg-muted/50'
            )}
          >
            <Upload
              className={cn(
                'w-8 h-8 transition-colors',
                isDragOver
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-muted-foreground'
              )}
            />
          </div>

          <div className="space-y-2">
            <p className="text-lg font-medium">
              {isDragOver ? '释放文件开始上传' : '点击或拖拽文件到此处'}
            </p>
            <p className="text-sm text-muted-foreground">
              支持 {acceptedFileTypes.join(', ')} 格式，最大{' '}
              {Math.round(maxFileSize / 1024 / 1024)}MB
            </p>
          </div>

          <Button variant="outline" disabled={disabled}>
            选择文件
          </Button>
        </div>
      </div>

      {/* 文件上传列表 */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium">上传文件</h4>
          <div className="space-y-2">
            {files.map((fileState) => (
              <div
                key={fileState.id}
                className="flex items-center gap-3 p-3 border rounded-lg"
              >
                <div className="flex-shrink-0">
                  {fileState.status === 'success' && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                  {fileState.status === 'error' && (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  {(fileState.status === 'idle' ||
                    fileState.status === 'uploading') && (
                    <FileText className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {fileState.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(fileState.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>

                  {fileState.status === 'uploading' && (
                    <div className="mt-1">
                      <Progress value={fileState.progress} className="h-1" />
                    </div>
                  )}

                  {fileState.status === 'error' && fileState.errorMessage && (
                    <p className="text-xs text-red-600 mt-1">
                      {fileState.errorMessage}
                    </p>
                  )}
                </div>

                <div className="flex-shrink-0 flex items-center gap-1">
                  {fileState.status === 'error' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => retryUpload(fileState.id)}
                    >
                      重试
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFile(fileState.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
