import { MainLayout } from '@/components/layout/main-layout';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function HomePage(): JSX.Element {
  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            欢迎使用 ResumeXAgent
          </h1>
          <p className="text-muted-foreground">
            AI驱动的简历优化与岗位匹配平台
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>上传简历</CardTitle>
              <CardDescription>
                上传您的简历，让AI帮您分析和优化
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">开始上传</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>分析岗位</CardTitle>
              <CardDescription>输入目标岗位描述，获得深度分析</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                添加岗位
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>匹配分析</CardTitle>
              <CardDescription>查看简历与岗位的匹配度分析</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                查看报告
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
