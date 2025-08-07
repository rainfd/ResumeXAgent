'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  FileText,
  Edit,
  BarChart3,
  Eye,
  Settings,
  HelpCircle,
  ChevronDown,
} from 'lucide-react';

interface NavigationProps {
  className?: string;
}

export function Navigation({ className }: NavigationProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const menuItems = [
    {
      id: 'file',
      label: '文件',
      icon: FileText,
      items: [
        { label: '新建简历', shortcut: 'Ctrl+N' },
        { label: '打开', shortcut: 'Ctrl+O' },
        { label: '保存', shortcut: 'Ctrl+S' },
        { label: '导出PDF', shortcut: 'Ctrl+E' },
        { label: '打印', shortcut: 'Ctrl+P' },
      ],
    },
    {
      id: 'edit',
      label: '编辑',
      icon: Edit,
      items: [
        { label: '撤销', shortcut: 'Ctrl+Z' },
        { label: '重做', shortcut: 'Ctrl+Y' },
        { label: '复制', shortcut: 'Ctrl+C' },
        { label: '粘贴', shortcut: 'Ctrl+V' },
        { label: '查找', shortcut: 'Ctrl+F' },
      ],
    },
    {
      id: 'analysis',
      label: '分析',
      icon: BarChart3,
      items: [
        { label: '简历分析' },
        { label: '岗位匹配' },
        { label: '关键词优化' },
        { label: '技能评估' },
      ],
    },
    {
      id: 'view',
      label: '视图',
      icon: Eye,
      items: [
        { label: '切换侧边栏', shortcut: 'Ctrl+B' },
        { label: '切换问题面板', shortcut: 'Ctrl+Shift+M' },
        { label: '全屏模式', shortcut: 'F11' },
        { label: '缩放', shortcut: 'Ctrl++/-' },
      ],
    },
    {
      id: 'tools',
      label: '工具',
      icon: Settings,
      items: [
        { label: 'AI助手' },
        { label: '模板库' },
        { label: '批量处理' },
        { label: '设置', shortcut: 'Ctrl+,' },
      ],
    },
    {
      id: 'help',
      label: '帮助',
      icon: HelpCircle,
      items: [
        { label: '用户手册' },
        { label: '键盘快捷键' },
        { label: '反馈建议' },
        { label: '关于' },
      ],
    },
  ];

  const handleMenuClick = (menuId: string) => {
    setActiveMenu(activeMenu === menuId ? null : menuId);
  };

  const handleMenuLeave = () => {
    // 延迟关闭菜单，允许鼠标移动到下拉菜单
    setTimeout(() => setActiveMenu(null), 100);
  };

  return (
    <nav className={cn('flex items-center space-x-1', className)}>
      {menuItems.map((menu) => {
        const Icon = menu.icon;
        const isActive = activeMenu === menu.id;

        return (
          <div key={menu.id} className="relative">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'flex items-center space-x-2 text-sm',
                isActive && 'bg-accent'
              )}
              onClick={() => handleMenuClick(menu.id)}
              onMouseEnter={() => setActiveMenu(menu.id)}
              onMouseLeave={handleMenuLeave}
            >
              <Icon className="h-4 w-4" />
              <span>{menu.label}</span>
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>

            {/* 下拉菜单 */}
            {isActive && (
              <div
                className="absolute top-full left-0 z-50 mt-1 w-56 rounded-md border bg-popover p-1 shadow-md"
                onMouseEnter={() => setActiveMenu(menu.id)}
                onMouseLeave={() => setActiveMenu(null)}
              >
                {menu.items.map((item, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between text-sm font-normal"
                  >
                    <span>{item.label}</span>
                    {item.shortcut && (
                      <kbd className="ml-auto text-xs text-muted-foreground">
                        {item.shortcut}
                      </kbd>
                    )}
                  </Button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
