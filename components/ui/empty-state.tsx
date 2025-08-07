import { Button } from './button';
import { cn } from '@/lib/utils';
import { FileX, Plus } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon = FileX,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex min-h-[400px] flex-col items-center justify-center space-y-4 text-center',
        className
      )}
    >
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-medium">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground max-w-md">
            {description}
          </p>
        )}
      </div>

      {action && (
        <Button onClick={action.onClick}>
          <Plus className="mr-2 h-4 w-4" />
          {action.label}
        </Button>
      )}
    </div>
  );
}

// 预定义的空状态组件
export function EmptyResumes() {
  return (
    <EmptyState
      title="暂无简历"
      description="开始上传你的第一份简历，让AI帮助你优化和分析。"
      action={{
        label: '上传简历',
        onClick: () => {
          // TODO: 实现上传简历功能
        },
      }}
    />
  );
}

export function EmptyJobs() {
  return (
    <EmptyState
      title="暂无岗位信息"
      description="添加目标岗位描述，获取深度分析和匹配建议。"
      action={{
        label: '添加岗位',
        onClick: () => {
          // TODO: 实现添加岗位功能
        },
      }}
    />
  );
}

export function EmptyReports() {
  return (
    <EmptyState
      title="暂无匹配报告"
      description="上传简历并添加岗位信息后，系统将自动生成匹配分析报告。"
    />
  );
}
