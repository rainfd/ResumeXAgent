import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function NotFound(): JSX.Element {
  return (
    <MainLayout>
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          {/* 404 Visual */}
          <div className="space-y-6">
            <div className="mx-auto w-32 h-32 bg-muted rounded-full flex items-center justify-center">
              <svg
                className="w-16 h-16 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>

            <div className="space-y-3">
              <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
              <h2 className="text-3xl font-bold tracking-tight">页面未找到</h2>
              <p className="text-lg text-muted-foreground max-w-md mx-auto">
                抱歉，您访问的页面不存在或已被移动。让我们帮您找到正确的方向。
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/">返回首页</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/dashboard">前往仪表板</Link>
              </Button>
            </div>
          </div>

          {/* Helpful Links */}
          <Card className="text-left">
            <CardContent className="p-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-center">您可能在寻找：</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Link
                      href="/resume/upload"
                      className="block p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-blue-600 dark:text-blue-400"
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
                        <div>
                          <p className="font-medium">上传简历</p>
                          <p className="text-sm text-muted-foreground">
                            开始AI简历分析
                          </p>
                        </div>
                      </div>
                    </Link>

                    <Link
                      href="/job/analyze"
                      className="block p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-green-600 dark:text-green-400"
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
                        <div>
                          <p className="font-medium">分析岗位</p>
                          <p className="text-sm text-muted-foreground">
                            智能解析岗位要求
                          </p>
                        </div>
                      </div>
                    </Link>
                  </div>

                  <div className="space-y-3">
                    <Link
                      href="/match"
                      className="block p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-purple-600 dark:text-purple-400"
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
                        <div>
                          <p className="font-medium">匹配分析</p>
                          <p className="text-sm text-muted-foreground">
                            查看简历岗位匹配
                          </p>
                        </div>
                      </div>
                    </Link>

                    <Link
                      href="/ai/star"
                      className="block p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-orange-600 dark:text-orange-400"
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
                        <div>
                          <p className="font-medium">AI工具</p>
                          <p className="text-sm text-muted-foreground">
                            STAR法则检测
                          </p>
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search Suggestion */}
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              如果您确信链接正确，请尝试刷新页面或联系技术支持。
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
