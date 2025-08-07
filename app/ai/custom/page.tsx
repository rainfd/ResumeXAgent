import { MainLayout } from '@/components/layout/main-layout';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function AICustomPage(): JSX.Element {
  return (
    <MainLayout>
      <div className="container mx-auto px-6 py-8 space-y-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">自定义AI分析</h1>
            <Badge variant="secondary">AI工具</Badge>
          </div>
          <p className="text-muted-foreground">
            根据您的具体需求，定制化AI分析简历内容和求职策略
          </p>
        </div>

        {/* Analysis Templates */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">分析模板</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="cursor-pointer hover:shadow-md transition-shadow border-blue-200 dark:border-blue-800">
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-2">
                  <svg
                    className="w-5 h-5 text-blue-600 dark:text-blue-400"
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
                <CardTitle>技能差距分析</CardTitle>
                <CardDescription>
                  分析简历中技能与目标岗位要求的差距，提供学习建议
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow border-green-200 dark:border-green-800">
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-2">
                  <svg
                    className="w-5 h-5 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
                  </svg>
                </div>
                <CardTitle>薪资谈判策略</CardTitle>
                <CardDescription>
                  基于经验和市场行情，提供薪资谈判的策略和话术
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow border-purple-200 dark:border-purple-800">
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mb-2">
                  <svg
                    className="w-5 h-5 text-purple-600 dark:text-purple-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <CardTitle>面试问题预测</CardTitle>
                <CardDescription>
                  基于简历内容预测可能的面试问题，提供回答思路
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow border-orange-200 dark:border-orange-800">
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center mb-2">
                  <svg
                    className="w-5 h-5 text-orange-600 dark:text-orange-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <CardTitle>职业发展路径</CardTitle>
                <CardDescription>
                  基于当前背景分析未来职业发展方向和成长建议
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow border-red-200 dark:border-red-800">
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-2">
                  <svg
                    className="w-5 h-5 text-red-600 dark:text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L5.35 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <CardTitle>简历风险评估</CardTitle>
                <CardDescription>
                  识别简历中的潜在问题和风险点，提供规避建议
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow border-indigo-200 dark:border-indigo-800">
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center mb-2">
                  <svg
                    className="w-5 h-5 text-indigo-600 dark:text-indigo-400"
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
                <CardTitle>行业转换分析</CardTitle>
                <CardDescription>
                  分析跨行业求职的可行性，提供转换策略和准备建议
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* Custom Analysis Input */}
        <Card>
          <CardHeader>
            <CardTitle>自定义分析需求</CardTitle>
            <CardDescription>
              描述您的具体分析需求，AI将提供个性化的专业建议
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">分析类型</label>
                <select className="w-full p-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                  <option>选择分析类型</option>
                  <option>技能评估</option>
                  <option>职业规划</option>
                  <option>面试准备</option>
                  <option>薪资分析</option>
                  <option>行业转换</option>
                  <option>其他自定义</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">目标行业/岗位</label>
                <Input placeholder="如：互联网/前端开发工程师" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">具体分析需求</label>
              <textarea
                className="w-full min-h-[150px] p-3 text-sm border border-input bg-background rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                placeholder="请详细描述您的分析需求，例如：

1. 我想从Java后端转向前端开发，请分析转换的可行性和需要补充的技能
2. 即将面试阿里巴巴的P6前端工程师，请预测可能的面试问题并提供回答思路
3. 工作3年想要跳槽，请分析我的简历竞争力和薪资谈判策略
4. 请评估我简历中的项目经历是否足够突出，如何更好地展示技术实力

越详细的需求描述，AI提供的建议越精准..."
              />
            </div>

            <div className="flex gap-3">
              <Button>开始分析</Button>
              <Button variant="outline">保存草稿</Button>
              <Button variant="outline">清空内容</Button>
            </div>
          </CardContent>
        </Card>

        {/* Analysis History */}
        <Card>
          <CardHeader>
            <CardTitle>分析历史</CardTitle>
            <CardDescription>查看您之前的AI分析记录</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <p>暂无分析记录</p>
              <p className="text-sm mt-2">开始您的第一次AI分析吧</p>
            </div>
          </CardContent>
        </Card>

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
                <strong>获得更好分析结果的建议：</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>提供详细的背景信息和目标</li>
                <li>明确具体的分析需求和期望</li>
                <li>上传最新版本的简历</li>
                <li>描述当前面临的具体问题</li>
              </ul>
            </div>
            <div className="space-y-2">
              <p>
                <strong>AI分析能力范围：</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>简历内容深度分析和优化</li>
                <li>职业发展路径规划建议</li>
                <li>面试准备和问题预测</li>
                <li>薪资水平分析和谈判策略</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="outline" asChild>
            <Link href="/ai/star">STAR法则检测</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/match">匹配分析</Link>
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
