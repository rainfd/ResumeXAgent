'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { X, Plus } from 'lucide-react';

export interface Tab {
  id: string;
  title: string;
  content: React.ReactNode;
  closable?: boolean;
  modified?: boolean;
}

interface TabContainerProps {
  tabs: Tab[];
  activeTabId: string;
  onTabChange: (tabId: string) => void;
  onTabClose?: (tabId: string) => void;
  onNewTab?: () => void;
  className?: string;
}

export function TabContainer({
  tabs,
  activeTabId,
  onTabChange,
  onTabClose,
  onNewTab,
  className,
}: TabContainerProps) {
  const [draggedTab, setDraggedTab] = useState<string | null>(null);

  const activeTab = tabs.find((tab) => tab.id === activeTabId);

  const handleTabDragStart = (e: React.DragEvent, tabId: string) => {
    setDraggedTab(tabId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleTabDragEnd = () => {
    setDraggedTab(null);
  };

  const handleTabDrop = (e: React.DragEvent, targetTabId: string) => {
    e.preventDefault();
    if (!draggedTab || draggedTab === targetTabId) return;

    // TODO: 实现标签重排序逻辑
  };

  const handleTabDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* 标签栏 */}
      <div className="flex items-center border-b bg-muted/20">
        <div className="flex flex-1 overflow-hidden">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={cn(
                'group relative flex items-center space-x-2 border-r px-3 py-2 text-sm cursor-pointer select-none min-w-0',
                'hover:bg-accent/50 transition-colors',
                tab.id === activeTabId
                  ? 'bg-background border-b-0 -mb-px z-10'
                  : 'bg-muted/20',
                draggedTab === tab.id && 'opacity-50'
              )}
              draggable
              onDragStart={(e) => handleTabDragStart(e, tab.id)}
              onDragEnd={handleTabDragEnd}
              onDrop={(e) => handleTabDrop(e, tab.id)}
              onDragOver={handleTabDragOver}
              onClick={() => onTabChange(tab.id)}
            >
              <span className="truncate flex-1 min-w-0">
                {tab.title}
                {tab.modified && <span className="ml-1 text-primary">•</span>}
              </span>

              {tab.closable !== false && onTabClose && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTabClose(tab.id);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* 新建标签按钮 */}
        {onNewTab && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 shrink-0"
            onClick={onNewTab}
          >
            <Plus className="h-4 w-4" />
            <span className="sr-only">新建标签</span>
          </Button>
        )}
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-hidden">
        {activeTab ? (
          <div className="h-full">{activeTab.content}</div>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            没有打开的标签
          </div>
        )}
      </div>
    </div>
  );
}
