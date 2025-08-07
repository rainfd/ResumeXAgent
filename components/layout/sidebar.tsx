'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  FileText,
  Briefcase,
  BarChart3,
  Bot,
  ChevronRight,
  ChevronDown,
  Home,
  Upload,
  Search,
  Zap,
} from 'lucide-react';

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar() {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<string[]>([
    'resumes',
    'jobs',
    'ai',
  ]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  const navigationItems = [
    {
      id: 'main',
      title: '主导航',
      items: [
        {
          name: '首页',
          icon: Home,
          href: '/',
          active: pathname === '/',
        },
        {
          name: '仪表板',
          icon: BarChart3,
          href: '/dashboard',
          active: pathname === '/dashboard',
        },
      ],
    },
    {
      id: 'resumes',
      title: '我的简历',
      icon: FileText,
      items: [
        {
          name: '简历管理',
          icon: FileText,
          href: '/resume',
          active: pathname.startsWith('/resume'),
        },
        {
          name: '上传简历',
          icon: Upload,
          href: '/resume/upload',
          active: pathname === '/resume/upload',
        },
      ],
    },
    {
      id: 'jobs',
      title: '目标岗位',
      icon: Briefcase,
      items: [
        {
          name: '岗位管理',
          icon: Briefcase,
          href: '/job',
          active: pathname.startsWith('/job') && pathname !== '/job/analyze',
        },
        {
          name: '岗位分析',
          icon: Search,
          href: '/job/analyze',
          active: pathname === '/job/analyze',
        },
      ],
    },
    {
      id: 'analysis',
      title: '分析工具',
      items: [
        {
          name: '匹配分析',
          icon: BarChart3,
          href: '/match',
          active: pathname === '/match',
        },
      ],
    },
    {
      id: 'ai',
      title: 'AI 工具',
      icon: Bot,
      items: [
        {
          name: 'STAR法则检测',
          icon: Zap,
          href: '/ai/star',
          active: pathname === '/ai/star',
        },
        {
          name: '自定义分析',
          icon: Bot,
          href: '/ai/custom',
          active: pathname === '/ai/custom',
        },
      ],
    },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto p-2">
        <nav className="space-y-1">
          {navigationItems.map((section) => {
            const isExpanded = expandedSections.includes(section.id);
            const Icon = section.icon;
            const hasIcon = !!section.icon;

            return (
              <div key={section.id} className="space-y-1">
                {/* Section Header */}
                {hasIcon ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => toggleSection(section.id)}
                  >
                    {Icon && <Icon className="mr-2 h-4 w-4" />}
                    <span className="flex-1 text-left">{section.title}</span>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                ) : (
                  <div className="px-3 py-1 text-xs font-medium text-muted-foreground">
                    {section.title}
                  </div>
                )}

                {/* Section Items */}
                {(isExpanded || !hasIcon) && (
                  <div className={cn('space-y-1', hasIcon && 'ml-4')}>
                    {section.items.map((item) => {
                      const ItemIcon = item.icon;
                      const isItemActive = item.active;

                      return (
                        <Button
                          key={item.href}
                          variant="ghost"
                          size="sm"
                          className={cn(
                            'w-full justify-start text-muted-foreground hover:text-foreground',
                            isItemActive && 'bg-accent text-accent-foreground'
                          )}
                          asChild
                        >
                          <Link href={item.href}>
                            <ItemIcon className="mr-2 h-3 w-3" />
                            <span className="truncate text-left text-xs">
                              {item.name}
                            </span>
                          </Link>
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
