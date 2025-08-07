import { Progress } from './progress';
import { cn } from '@/lib/utils';
import { CheckCircle } from 'lucide-react';

interface Step {
  title: string;
  description?: string;
  completed?: boolean;
}

interface ProgressIndicatorProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function ProgressIndicator({
  steps,
  currentStep,
  className,
}: ProgressIndicatorProps) {
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className={cn('space-y-4', className)}>
      {/* 进度条 */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium">进度</span>
          <span className="text-muted-foreground">
            {currentStep + 1} / {steps.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* 步骤列表 */}
      <div className="space-y-3">
        {steps.map((step, index) => {
          const isCompleted = step.completed || index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <div
              key={index}
              className={cn(
                'flex items-start space-x-3 p-3 rounded-lg border transition-colors',
                isCurrent && 'bg-accent/50 border-primary/50',
                isCompleted && 'bg-muted/30'
              )}
            >
              <div
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-medium',
                  isCompleted
                    ? 'bg-primary border-primary text-primary-foreground'
                    : isCurrent
                      ? 'border-primary text-primary'
                      : 'border-muted-foreground text-muted-foreground'
                )}
              >
                {isCompleted ? <CheckCircle className="h-3 w-3" /> : index + 1}
              </div>

              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    'text-sm font-medium',
                    isCurrent && 'text-foreground',
                    isCompleted && 'text-muted-foreground',
                    !isCurrent && !isCompleted && 'text-muted-foreground'
                  )}
                >
                  {step.title}
                </p>
                {step.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 预定义的进度指示器
export function ResumeProcessProgress({
  currentStep,
}: {
  currentStep: number;
}) {
  const steps = [
    {
      title: '上传简历',
      description: '上传PDF或Word格式的简历文件',
    },
    {
      title: '内容解析',
      description: 'AI解析简历内容，提取关键信息',
    },
    {
      title: '结构分析',
      description: '分析简历结构，识别各个部分',
    },
    {
      title: '完成处理',
      description: '简历处理完成，可以开始优化',
    },
  ];

  return <ProgressIndicator steps={steps} currentStep={currentStep} />;
}
