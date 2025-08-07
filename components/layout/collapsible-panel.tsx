'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CollapsiblePanelProps {
  children: React.ReactNode;
  title: string;
  defaultCollapsed?: boolean;
  side?: 'left' | 'right';
  width?: number;
  collapsedWidth?: number;
  className?: string;
  onToggle?: (collapsed: boolean) => void;
  persistKey?: string; // 用于持久化状态
}

export function CollapsiblePanel({
  children,
  title,
  defaultCollapsed = false,
  side = 'left',
  width = 300,
  collapsedWidth = 48,
  className,
  onToggle,
  persistKey,
}: CollapsiblePanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  // 从 localStorage 恢复状态
  useEffect(() => {
    if (persistKey && typeof window !== 'undefined') {
      const saved = localStorage.getItem(`panel-${persistKey}`);
      if (saved !== null) {
        setIsCollapsed(JSON.parse(saved));
      }
    }
  }, [persistKey]);

  const toggleCollapse = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    onToggle?.(newCollapsed);

    // 持久化状态
    if (persistKey && typeof window !== 'undefined') {
      localStorage.setItem(`panel-${persistKey}`, JSON.stringify(newCollapsed));
    }
  };

  const currentWidth = isCollapsed ? collapsedWidth : width;
  const ToggleIcon =
    side === 'left'
      ? isCollapsed
        ? ChevronRight
        : ChevronLeft
      : isCollapsed
        ? ChevronLeft
        : ChevronRight;

  return (
    <div
      className={cn(
        'relative flex-shrink-0 border-r bg-background transition-all duration-300 ease-in-out',
        side === 'right' && 'border-r-0 border-l',
        className
      )}
      style={{ width: currentWidth }}
    >
      {/* 标题栏 */}
      <div className="flex h-10 items-center justify-between border-b px-3">
        {!isCollapsed && (
          <span className="text-sm font-medium truncate">{title}</span>
        )}

        <Button
          variant="ghost"
          size="sm"
          className={cn('h-6 w-6 p-0', isCollapsed && 'mx-auto')}
          onClick={toggleCollapse}
        >
          <ToggleIcon className="h-4 w-4" />
          <span className="sr-only">
            {isCollapsed ? '展开面板' : '折叠面板'}
          </span>
        </Button>
      </div>

      {/* 内容区域 */}
      <div
        className={cn(
          'flex-1 overflow-hidden transition-opacity duration-200',
          isCollapsed && 'opacity-0'
        )}
      >
        {!isCollapsed && children}
      </div>

      {/* 折叠时的图标指示 */}
      {isCollapsed && (
        <div className="flex flex-col items-center justify-start p-2 space-y-4">
          {/* 这里可以添加折叠时显示的图标 */}
        </div>
      )}
    </div>
  );
}
