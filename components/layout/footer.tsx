import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface FooterProps {
  currentFile?: string;
  aiModelStatus?: 'idle' | 'processing' | 'error';
  taskProgress?: number;
  statusMessage?: string;
}

export function Footer({
  currentFile = '未选择文件',
  aiModelStatus = 'idle',
  taskProgress = 0,
  statusMessage = '准备就绪',
}: FooterProps) {
  const getStatusIcon = () => {
    switch (aiModelStatus) {
      case 'processing':
        return <Clock className="h-3 w-3" />;
      case 'error':
        return <AlertCircle className="h-3 w-3" />;
      default:
        return <CheckCircle className="h-3 w-3" />;
    }
  };

  const getStatusColor = () => {
    switch (aiModelStatus) {
      case 'processing':
        return 'secondary';
      case 'error':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <footer className="flex h-6 items-center justify-between border-t bg-background px-4 text-xs">
      {/* Left Section - File Status */}
      <div className="flex items-center space-x-4">
        <span className="text-muted-foreground">
          当前文件: <span className="text-foreground">{currentFile}</span>
        </span>

        {taskProgress > 0 && (
          <div className="flex items-center space-x-2">
            <Progress value={taskProgress} className="w-20 h-1" />
            <span className="text-muted-foreground">{taskProgress}%</span>
          </div>
        )}
      </div>

      {/* Right Section - AI Status */}
      <div className="flex items-center space-x-4">
        <span className="text-muted-foreground">{statusMessage}</span>

        <Badge
          variant={getStatusColor()}
          className="flex items-center space-x-1 text-xs"
        >
          {getStatusIcon()}
          <span>
            {aiModelStatus === 'processing'
              ? 'AI处理中'
              : aiModelStatus === 'error'
                ? 'AI错误'
                : 'AI就绪'}
          </span>
        </Badge>

        <div className="text-muted-foreground">行 1, 列 1</div>
      </div>
    </footer>
  );
}
