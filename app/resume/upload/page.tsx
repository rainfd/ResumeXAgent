import type { Metadata } from 'next';
import { MainLayout } from '@/components/layout/main-layout';

export const metadata: Metadata = {
  title: '上传简历',
  description:
    '上传您的简历文档，支持PDF、Word、Markdown和文本格式，AI将智能分析简历内容。',
  keywords: ['简历上传', '文档上传', 'AI分析', '简历解析'],
};
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ResumeUploadPage(): JSX.Element {
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
                支持 PDF、Word、Markdown 和文本格式，文件大小不超过 10MB
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer">
                <div className="space-y-4">
                  <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-blue-600 dark:text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-medium">点击或拖拽文件到此处</p>
                    <p className="text-sm text-muted-foreground">
                      支持 .pdf, .doc, .docx, .md, .txt 格式
                    </p>
                  </div>
                  <Button>选择文件</Button>
                </div>
              </div>

              <div className="text-center">
                <Button variant="outline" className="mr-4" asChild>
                  <Link href="/resume">返回简历列表</Link>
                </Button>
                <Button disabled>开始上传</Button>
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
                    <li>• Word文档 - 易于编辑</li>
                    <li>• Markdown - 结构化文档</li>
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
