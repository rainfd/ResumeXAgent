'use client';

import { ChevronRight, Home } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
}

// 路径映射配置
const pathMap: Record<string, string> = {
  '': '首页',
  dashboard: '仪表板',
  resume: '简历管理',
  upload: '上传简历',
  job: '岗位管理',
  analyze: '岗位分析',
  match: '匹配分析',
  ai: 'AI 工具',
  star: 'STAR法则检测',
  custom: '自定义分析',
};

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  const pathname = usePathname();

  // 如果没有提供items，自动从路径生成
  const breadcrumbItems = items || generateBreadcrumbsFromPath(pathname);

  function generateBreadcrumbsFromPath(path: string): BreadcrumbItem[] {
    const segments = path.split('/').filter(Boolean);
    const items: BreadcrumbItem[] = [];

    let currentPath = '';

    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === segments.length - 1;

      items.push({
        label: pathMap[segment] || segment,
        href: isLast ? undefined : currentPath,
        isActive: isLast,
      });
    });

    return items;
  }
  // 如果在首页，不显示面包屑
  if (pathname === '/') {
    return null;
  }

  return (
    <nav
      className={cn(
        'flex items-center space-x-1 text-sm text-muted-foreground',
        className
      )}
      aria-label="面包屑导航"
    >
      <Button
        variant="ghost"
        size="sm"
        className="h-auto p-1 text-muted-foreground hover:text-foreground"
        asChild
      >
        <Link href="/">
          <Home className="h-4 w-4" />
          <span className="sr-only">首页</span>
        </Link>
      </Button>

      {breadcrumbItems.map((item, index) => (
        <div key={index} className="flex items-center space-x-1">
          <ChevronRight className="h-4 w-4" />
          {item.href && !item.isActive ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-muted-foreground hover:text-foreground"
              asChild
            >
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ) : (
            <span
              className={cn(
                'px-1',
                item.isActive && 'font-medium text-foreground'
              )}
            >
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
