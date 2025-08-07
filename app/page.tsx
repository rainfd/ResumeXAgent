import type { Metadata } from 'next';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';

export const metadata: Metadata = {
  title: 'ResumeXAgent - 智能简历分析与岗位匹配工具',
  description:
    '帮助求职者提升简历质量，精准匹配心仪岗位。通过AI技术深度分析简历内容，智能匹配岗位要求，提供专业的优化建议，让您在求职路上更加从容自信。',
  keywords: [
    'AI简历分析',
    '简历优化',
    '岗位匹配',
    '求职助手',
    'STAR法则',
    '简历工具',
    '职业规划',
    '面试准备',
  ],
  openGraph: {
    title: 'ResumeXAgent - 智能简历分析与岗位匹配工具',
    description: '帮助求职者提升简历质量，精准匹配心仪岗位',
    url: '/',
    images: [
      {
        url: '/images/og-home.png',
        width: 1200,
        height: 630,
        alt: 'ResumeXAgent 首页',
      },
    ],
  },
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

export default function HomePage(): JSX.Element {
  return (
    <MainLayout>
      <div className="container mx-auto px-6 py-8 space-y-12">
        {/* Hero Section */}
        <section className="text-center space-y-6 py-12">
          <div className="space-y-4">
            <Badge variant="secondary" className="mb-4">
              AI 驱动的职场助手
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ResumeXAgent
            </h1>
            <h2 className="text-xl md:text-2xl text-muted-foreground font-medium">
              智能简历分析与岗位匹配工具
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              帮助求职者提升简历质量，精准匹配心仪岗位。通过AI技术深度分析简历内容，
              智能匹配岗位要求，提供专业的优化建议，让您在求职路上更加从容自信。
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="min-w-[140px]" asChild>
              <Link href="/dashboard">立即开始</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="min-w-[140px]"
              asChild
            >
              <Link href="/resume/upload">上传简历</Link>
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">核心功能</h2>
            <p className="text-muted-foreground">全方位提升您的求职竞争力</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="h-full transition-all duration-200 hover:shadow-md">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-2">
                  <svg
                    className="w-6 h-6 text-blue-600 dark:text-blue-400"
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
                <CardTitle>智能简历分析</CardTitle>
                <CardDescription>
                  AI深度解析简历内容，识别关键技能和项目经历，提供专业的优化建议
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="ghost"
                  className="w-full justify-start p-0"
                  asChild
                >
                  <Link href="/resume">管理简历 →</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="h-full transition-all duration-200 hover:shadow-md">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-2">
                  <svg
                    className="w-6 h-6 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6"
                    />
                  </svg>
                </div>
                <CardTitle>岗位智能分析</CardTitle>
                <CardDescription>
                  自动抓取岗位描述，AI解析关键要求和技能需求，为匹配分析提供基础
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="ghost"
                  className="w-full justify-start p-0"
                  asChild
                >
                  <Link href="/job">岗位管理 →</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="h-full transition-all duration-200 hover:shadow-md">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mb-2">
                  <svg
                    className="w-6 h-6 text-purple-600 dark:text-purple-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <CardTitle>精准匹配分析</CardTitle>
                <CardDescription>
                  智能评估简历与岗位的匹配度，生成详细报告和改进建议
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="ghost"
                  className="w-full justify-start p-0"
                  asChild
                >
                  <Link href="/match">匹配分析 →</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="h-full transition-all duration-200 hover:shadow-md">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center mb-2">
                  <svg
                    className="w-6 h-6 text-orange-600 dark:text-orange-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <CardTitle>AI 智能助手</CardTitle>
                <CardDescription>
                  STAR法则检测、自定义分析等AI工具，全方位提升简历质量
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="ghost"
                  className="w-full justify-start p-0"
                  asChild
                >
                  <Link href="/ai/star">AI工具 →</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Quick Start Section */}
        <section className="bg-muted/30 rounded-xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">快速开始</h2>
            <p className="text-muted-foreground">三步轻松开启AI简历优化之旅</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold mx-auto">
                1
              </div>
              <h3 className="font-semibold">上传简历</h3>
              <p className="text-sm text-muted-foreground">
                支持PDF、Word、Markdown等多种格式，AI自动解析简历内容
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold mx-auto">
                2
              </div>
              <h3 className="font-semibold">分析岗位</h3>
              <p className="text-sm text-muted-foreground">
                添加目标岗位信息，系统自动分析岗位要求和技能需求
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold mx-auto">
                3
              </div>
              <h3 className="font-semibold">获取建议</h3>
              <p className="text-sm text-muted-foreground">
                查看匹配分析报告，获得专业的简历优化建议和改进方案
              </p>
            </div>
          </div>

          <div className="text-center">
            <Button size="lg" asChild>
              <Link href="/dashboard">开始体验</Link>
            </Button>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
