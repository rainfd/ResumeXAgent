import { MainLayout } from '@/components/layout/main-layout';
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

export default function AIStarPage(): JSX.Element {
  return (
    <MainLayout>
      <div className="container mx-auto px-6 py-8 space-y-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">STAR法则检测</h1>
            <Badge variant="secondary">AI工具</Badge>
          </div>
          <p className="text-muted-foreground">
            使用AI技术检测和优化项目经历的STAR结构，提升简历表达效果
          </p>
        </div>

        {/* STAR Method Introduction */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-xl p-8 space-y-6">
          <h2 className="text-2xl font-bold">什么是STAR法则？</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  S
                </span>
              </div>
              <h3 className="font-semibold">Situation</h3>
              <p className="text-sm text-muted-foreground">
                描述项目背景和情境
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                  T
                </span>
              </div>
              <h3 className="font-semibold">Task</h3>
              <p className="text-sm text-muted-foreground">
                明确任务目标和职责
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  A
                </span>
              </div>
              <h3 className="font-semibold">Action</h3>
              <p className="text-sm text-muted-foreground">
                详述采取的具体行动
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  R
                </span>
              </div>
              <h3 className="font-semibold">Result</h3>
              <p className="text-sm text-muted-foreground">量化展示项目成果</p>
            </div>
          </div>
        </div>

        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>项目经历检测</CardTitle>
            <CardDescription>
              粘贴您的项目经历描述，AI将分析其STAR结构完整性并提供优化建议
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">项目经历描述</label>
              <textarea
                className="w-full min-h-[300px] p-4 text-sm border border-input bg-background rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                placeholder="请输入您的项目经历描述，例如：

负责开发电商平台用户管理系统，使用React和Node.js技术栈。项目周期3个月，团队规模5人。主要负责前端架构设计和API接口开发，实现了用户注册、登录、权限管理等核心功能。通过性能优化，页面加载速度提升40%，用户体验显著改善。

AI将分析这段描述的STAR结构，并提供具体的改进建议..."
              />
            </div>
            <div className="flex gap-3">
              <Button>开始检测</Button>
              <Button variant="outline">清空内容</Button>
            </div>
          </CardContent>
        </Card>

        {/* Example Results */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">检测示例</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-red-200 dark:border-red-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-red-600 dark:text-red-400">
                    检测前
                  </CardTitle>
                  <Badge variant="destructive">STAR评分: 40%</Badge>
                </div>
                <CardDescription>结构不够清晰的项目描述</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-3">
                  <p className="bg-muted/50 p-3 rounded border-l-4 border-red-500">
                    &ldquo;负责开发电商网站，用了React和Node.js，做了很多功能，用户反馈不错。&rdquo;
                  </p>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-red-600">问题分析：</h4>
                    <ul className="text-muted-foreground list-disc list-inside space-y-1">
                      <li>缺少具体的项目背景 (Situation)</li>
                      <li>任务目标模糊 (Task)</li>
                      <li>行动描述过于笼统 (Action)</li>
                      <li>没有量化的成果展示 (Result)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200 dark:border-green-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-green-600 dark:text-green-400">
                    优化后
                  </CardTitle>
                  <Badge variant="default" className="bg-green-600">
                    STAR评分: 95%
                  </Badge>
                </div>
                <CardDescription>结构完整的STAR描述</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-3">
                  <p className="bg-muted/50 p-3 rounded border-l-4 border-green-500">
                    &ldquo;<strong>情境：</strong>
                    负责公司电商平台重构项目，面临用户增长200%带来的性能瓶颈。
                    <br />
                    <strong>任务：</strong>
                    设计并实现高并发用户管理系统，支持10万+日活用户。
                    <br />
                    <strong>行动：</strong>
                    采用React+Redux前端架构，Node.js+MongoDB后端，实现用户注册、认证、权限管理等模块。
                    <br />
                    <strong>结果：</strong>
                    系统响应时间减少60%，用户转化率提升25%，获得团队季度最佳项目奖。&rdquo;
                  </p>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-green-600">优化亮点：</h4>
                    <ul className="text-muted-foreground list-disc list-inside space-y-1">
                      <li>明确的项目背景和挑战 ✓</li>
                      <li>具体的任务目标和指标 ✓</li>
                      <li>详细的技术方案和实施 ✓</li>
                      <li>量化的业务成果展示 ✓</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">AI检测功能</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
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
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <CardTitle>结构化分析</CardTitle>
                <CardDescription>
                  AI识别项目描述中的STAR四个要素，评估结构完整性
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
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
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </div>
                <CardTitle>优化建议</CardTitle>
                <CardDescription>
                  针对每个STAR要素提供具体的改进建议和示例
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
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
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                </div>
                <CardTitle>量化指标</CardTitle>
                <CardDescription>
                  提供STAR评分和改进前后对比，量化优化效果
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="outline" asChild>
            <Link href="/ai/custom">自定义AI分析</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/resume">返回简历管理</Link>
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
