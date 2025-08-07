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
import Link from 'next/link';

export default function JobAnalyzePage(): JSX.Element {
  return (
    <MainLayout>
      <div className="container mx-auto px-6 py-8 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">岗位分析</h1>
          <p className="text-muted-foreground">
            添加目标岗位信息，AI将自动分析岗位要求和技能需求
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          {/* Job Input Methods */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
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
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                </div>
                <CardTitle>Boss直聘链接</CardTitle>
                <CardDescription>
                  输入Boss直聘岗位链接，自动抓取和分析岗位信息
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
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
                <CardTitle>手动输入</CardTitle>
                <CardDescription>
                  直接输入岗位描述和要求，支持复制粘贴
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Job URL Input */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Boss直聘岗位链接</CardTitle>
              <CardDescription>
                粘贴Boss直聘岗位详情页链接，系统将自动抓取岗位信息
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder="https://www.zhipin.com/job_detail/..."
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  示例：https://www.zhipin.com/job_detail/12345678.html
                </p>
              </div>
              <div className="flex gap-3">
                <Button>解析岗位</Button>
                <Button variant="outline">清空</Button>
              </div>
            </CardContent>
          </Card>

          {/* Manual Input */}
          <Card>
            <CardHeader>
              <CardTitle>手动输入岗位信息</CardTitle>
              <CardDescription>
                直接输入或粘贴岗位描述、要求等信息
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">岗位名称</label>
                  <Input placeholder="如：前端开发工程师" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">公司名称</label>
                  <Input placeholder="如：阿里巴巴集团" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">薪资范围</label>
                  <Input placeholder="如：15-25K" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">工作地点</label>
                  <Input placeholder="如：杭州·余杭区" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">工作经验</label>
                  <Input placeholder="如：3-5年" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">岗位描述</label>
                <textarea
                  className="w-full min-h-[200px] p-3 text-sm border border-input bg-background rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  placeholder="请输入详细的岗位描述、工作职责、任职要求等信息..."
                />
              </div>

              <div className="flex gap-3">
                <Button>开始分析</Button>
                <Button variant="outline" asChild>
                  <Link href="/job">返回岗位列表</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <div className="mt-8 bg-muted/30 rounded-xl p-6 space-y-4">
            <h3 className="font-semibold">分析提示</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                <p className="font-medium mb-2">
                  岗位信息越详细，分析结果越准确：
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>详细的工作职责描述</li>
                  <li>明确的技能要求列表</li>
                  <li>学历和经验要求</li>
                  <li>公司背景和行业信息</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-2">AI将分析以下内容：</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>核心技能要求权重</li>
                  <li>岗位竞争激烈程度</li>
                  <li>薪资水平合理性</li>
                  <li>职业发展路径建议</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
