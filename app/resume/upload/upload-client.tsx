'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { ResumeUploader } from '@/components/resume/resume-uploader';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ResumeUploadClient(): JSX.Element {
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (file: File): Promise<void> => {
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/resume/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('上传失败，请稍后重试');
      }

      const result = await response.json();
      // TODO: Use logger service instead of console.log
      // logger.info('Upload successful', { result });
    } catch (error) {
      // TODO: Use logger service instead of console.error
      // logger.error('Upload error', { error });
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadComplete = (fileId: string, result: any) => {
    setUploadedFiles((prev) => [...prev, fileId]);
  };

  const handleUploadError = (fileId: string, error: string) => {
    // TODO: Use logger service instead of console.error
    // logger.error(`File upload error`, { fileId, error });
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-6 py-8 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">上传简历</h1>
          <p className="text-muted-foreground">
            上传您的简历文档，我们将使用AI技术进行智能分析
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Upload Area */}
          <Card>
            <CardHeader>
              <CardTitle>选择简历文件</CardTitle>
              <CardDescription>
                支持 PDF、Markdown 和文本格式，文件大小不超过 10MB
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ResumeUploader
                onFileUpload={handleFileUpload}
                onUploadComplete={handleUploadComplete}
                onUploadError={handleUploadError}
                acceptedFileTypes={['.pdf', '.md', '.txt']}
                maxFileSize={10 * 1024 * 1024} // 10MB
                disabled={isUploading}
              />

              <div className="text-center">
                <Button variant="outline" className="mr-4" asChild>
                  <Link href="/resume">返回简历列表</Link>
                </Button>
                {uploadedFiles.length > 0 && (
                  <Button asChild>
                    <Link href="/resume">查看已上传简历</Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Upload Instructions */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>上传说明</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-green-600">✓ 推荐格式</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• PDF格式 - 保持原始格式</li>
                    <li>• Markdown - 结构化文档</li>
                    <li>• 文本文件 - 纯文本内容</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold text-blue-600">📋 分析内容</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 基本信息和联系方式</li>
                    <li>• 教育背景和工作经历</li>
                    <li>• 技能清单和项目经历</li>
                    <li>• 简历整体结构和完整性</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
