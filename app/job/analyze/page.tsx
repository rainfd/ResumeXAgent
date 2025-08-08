'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function JobAnalyzePage() {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');

  const validateBossUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return (
        urlObj.hostname.includes('zhipin.com') ||
        urlObj.hostname.includes('boss.com')
      );
    } catch {
      return false;
    }
  };

  const handleAnalyze = async () => {
    setError('');
    setNeedsVerification(false);

    if (!url.trim()) {
      setError('请输入岗位URL');
      return;
    }

    if (!validateBossUrl(url)) {
      setError('请输入有效的Boss直聘网址');
      return;
    }

    setIsAnalyzing(true);

    try {
      const response = await fetch('/api/job/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (response.status === 202 && data.needsUserAction) {
        // 需要用户验证
        setNeedsVerification(true);
        setVerificationMessage(data.message || '需要在浏览器中完成验证');
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || '分析失败');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析失败，请重试');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleContinueAfterVerification = async () => {
    setError('');
    setIsAnalyzing(true);

    try {
      const response = await fetch('/api/job/analyze', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '分析失败');
      }

      setResult(data);
      setNeedsVerification(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析失败，请重试');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">岗位分析</h1>
          <p className="text-muted-foreground mt-2">
            输入Boss直聘的岗位网址，系统将自动获取并分析岗位要求
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>岗位URL分析</CardTitle>
            <CardDescription>
              支持Boss直聘网址格式，如：https://www.zhipin.com/job_detail/xxx.html
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="请输入Boss直聘岗位网址..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isAnalyzing}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !url.trim()}
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <LoadingSpinner className="mr-2 h-4 w-4" />
                  正在分析...
                </>
              ) : (
                '开始分析'
              )}
            </Button>
          </CardContent>
        </Card>

        {needsVerification && (
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="text-amber-800">需要用户验证</CardTitle>
              <CardDescription className="text-amber-700">
                {verificationMessage}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-amber-700">
                  请按照以下步骤完成验证：
                </p>
                <ol className="list-decimal list-inside space-y-2 text-sm text-amber-700">
                  <li>在弹出的浏览器窗口中完成登录或验证码验证</li>
                  <li>确保可以正常查看岗位信息页面</li>
                  <li>点击下方&quot;继续分析&quot;按钮</li>
                </ol>
                <Button
                  onClick={handleContinueAfterVerification}
                  disabled={isAnalyzing}
                  variant="secondary"
                  className="w-full"
                >
                  {isAnalyzing ? (
                    <>
                      <LoadingSpinner className="mr-2 h-4 w-4" />
                      正在继续分析...
                    </>
                  ) : (
                    '继续分析'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {result && result.success && (
          <Card>
            <CardHeader>
              <CardTitle>分析结果</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-1">
                    职位名称
                  </h3>
                  <p>{result.data?.title || '未获取'}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-1">
                    公司名称
                  </h3>
                  <p>{result.data?.company || '未获取'}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-1">
                    工作地点
                  </h3>
                  <p>{result.data?.location || '未获取'}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-1">
                    薪资范围
                  </h3>
                  <p>{result.data?.salary_range || '未获取'}</p>
                </div>
              </div>

              {result.data?.raw_description && (
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                    岗位描述
                  </h3>
                  <div className="bg-muted p-4 rounded-md">
                    <pre className="whitespace-pre-wrap text-sm">
                      {result.data.raw_description}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
