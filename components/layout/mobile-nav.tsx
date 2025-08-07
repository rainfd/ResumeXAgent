'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Menu,
  X,
  FileText,
  Briefcase,
  BarChart3,
  Bot,
  Settings,
  HelpCircle,
} from 'lucide-react';

interface MobileNavProps {
  className?: string;
}

export function MobileNav({ className }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { icon: FileText, label: '我的简历', href: '/resumes' },
    { icon: Briefcase, label: '目标岗位', href: '/jobs' },
    { icon: BarChart3, label: '匹配分析', href: '/analysis' },
    { icon: Bot, label: 'AI助手', href: '/ai-assistant' },
    { icon: Settings, label: '设置', href: '/settings' },
    { icon: HelpCircle, label: '帮助', href: '/help' },
  ];

  const toggleNav = () => {
    setIsOpen(!isOpen);
  };

  const closeNav = () => {
    setIsOpen(false);
  };

  return (
    <div className={cn('lg:hidden', className)}>
      {/* 汉堡菜单按钮 */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleNav}
        className="relative z-50"
        aria-label={isOpen ? '关闭菜单' : '打开菜单'}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* 遮罩层 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeNav}
        />
      )}

      {/* 抽屉式导航 */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 transform bg-background shadow-lg transition-transform duration-300 ease-in-out lg:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* 头部 */}
          <div className="flex h-14 items-center justify-between border-b px-4">
            <h2 className="text-lg font-semibold">ResumeXAgent</h2>
            <Button variant="ghost" size="icon" onClick={closeNav}>
              <X className="h-5 w-5" />
              <span className="sr-only">关闭菜单</span>
            </Button>
          </div>

          {/* 导航项 */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-1">
              {navItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={index}
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={closeNav}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.label}
                  </Button>
                );
              })}
            </div>
          </nav>

          {/* 底部标签导航 */}
          <div className="border-t bg-muted/20">
            <div className="grid grid-cols-4 gap-1 p-2">
              {navItems.slice(0, 4).map((item, index) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="flex flex-col items-center space-y-1 text-xs"
                    onClick={closeNav}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="truncate">{item.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
