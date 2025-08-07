import type { Metadata } from 'next';
import { MainLayout } from '@/components/layout/main-layout';

export const metadata: Metadata = {
  title: '简历管理',
  description:
    '管理您的简历文档，查看AI分析结果，支持PDF、Word、Markdown等多种格式。',
  keywords: ['简历管理', '简历分析', 'AI分析', '简历优化', '文档管理'],
};
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function ResumePage(): JSX.Element {
  return (
    <MainLayout>
      <div className="container mx-auto px-6 py-8 space-y-8">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">简历管理</h1>
            <p className="text-muted-foreground">
              管理您的简历文档，查看AI分析结果
            </p>
          </div>
          <Button asChild>
            <Link href="/resume/upload">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              上传新简历
            </Link>
          </Button>
        </div>

        {/* Resume List */}
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-12 space-y-4">
                <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">暂无简历</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    上传您的第一份简历，开始AI驱动的简历优化之旅
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button asChild>
                    <Link href="/resume/upload">上传简历</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/dashboard">返回仪表板</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tips */}
        <div className="bg-muted/30 rounded-xl p-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <svg
              className="w-5 h-5 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            使用提示
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div className="space-y-2">
              <p>
                <strong>支持的文件格式：</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>PDF (.pdf)</li>
                <li>Word文档 (.doc, .docx)</li>
                <li>Markdown (.md)</li>
                <li>纯文本 (.txt)</li>
              </ul>
            </div>
            <div className="space-y-2">
              <p>
                <strong>AI分析功能：</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>关键技能提取和评估</li>
                <li>项目经历STAR结构化分析</li>
                <li>简历内容完整性检查</li>
                <li>个性化优化建议</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
