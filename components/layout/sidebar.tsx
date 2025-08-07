'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  FileText,
  Briefcase,
  BarChart3,
  Bot,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
} from 'lucide-react';

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar() {
  const [expandedSections, setExpandedSections] = useState<string[]>([
    'resumes',
    'jobs',
    'reports',
  ]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  const sidebarItems = [
    {
      id: 'resumes',
      title: '我的简历',
      icon: FileText,
      items: [
        { name: '前端开发工程师_v1.pdf', type: 'file' },
        { name: '产品经理_v2.pdf', type: 'file' },
      ],
    },
    {
      id: 'jobs',
      title: '目标岗位',
      icon: Briefcase,
      items: [
        { name: '腾讯-前端开发工程师', type: 'file' },
        { name: '阿里巴巴-产品经理', type: 'file' },
      ],
    },
    {
      id: 'reports',
      title: '匹配报告',
      icon: BarChart3,
      items: [
        { name: '简历1-岗位1_匹配报告.pdf', type: 'file' },
        { name: '简历2-岗位2_匹配报告.pdf', type: 'file' },
      ],
    },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto p-2">
        <nav className="space-y-1">
          {sidebarItems.map((section) => {
            const isExpanded = expandedSections.includes(section.id);
            const Icon = section.icon;

            return (
              <div key={section.id} className="space-y-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => toggleSection(section.id)}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <span className="flex-1 text-left">{section.title}</span>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>

                {isExpanded && (
                  <div className="ml-4 space-y-1">
                    {section.items.map((item, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-muted-foreground hover:text-foreground"
                      >
                        <FileText className="mr-2 h-3 w-3" />
                        <span className="truncate text-left text-xs">
                          {item.name}
                        </span>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* AI Assistant Section */}
      <div className="border-t p-2">
        <Button variant="ghost" size="sm" className="w-full justify-start">
          <Bot className="mr-2 h-4 w-4" />
          AI助手
        </Button>
      </div>
    </div>
  );
}
