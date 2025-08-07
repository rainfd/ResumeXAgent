'use client';

import { useState } from 'react';
import { Header } from './header';
import { Sidebar } from './sidebar';
import { Footer } from './footer';
import { Breadcrumb } from './breadcrumb';
import { ResizablePanel } from './resizable-panel';
import { CollapsiblePanel } from './collapsible-panel';
import { TabContainer, type Tab } from './tab-container';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [tabs, setTabs] = useState<Tab[]>([
    {
      id: 'welcome',
      title: '欢迎页面',
      content: children,
      closable: false,
    },
  ]);
  const [activeTabId, setActiveTabId] = useState('welcome');

  const handleTabChange = (tabId: string) => {
    setActiveTabId(tabId);
  };

  const handleTabClose = (tabId: string) => {
    const newTabs = tabs.filter((tab) => tab.id !== tabId);
    setTabs(newTabs);

    if (activeTabId === tabId && newTabs.length > 0) {
      setActiveTabId(newTabs[0].id);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <Header />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Collapsible */}
        <CollapsiblePanel
          title="资源管理器"
          persistKey="sidebar"
          side="left"
          width={280}
        >
          <Sidebar />
        </CollapsiblePanel>

        {/* Main Workspace */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Breadcrumb */}
          <div className="border-b bg-muted/20 px-4 py-2">
            <Breadcrumb
              items={[
                { label: '首页', href: '/' },
                { label: '欢迎页面', isActive: true },
              ]}
            />
          </div>

          {/* Tab Container */}
          <TabContainer
            tabs={tabs}
            activeTabId={activeTabId}
            onTabChange={handleTabChange}
            onTabClose={handleTabClose}
            className="flex-1"
          />
        </main>

        {/* Right Panel - Resizable and Collapsible */}
        <ResizablePanel
          defaultWidth={320}
          minWidth={250}
          maxWidth={500}
          resizeDirection="left"
        >
          <CollapsiblePanel
            title="问题面板"
            persistKey="problems-panel"
            side="right"
            width={320}
          >
            <div className="p-4">
              <div className="text-sm text-muted-foreground">暂无问题</div>
            </div>
          </CollapsiblePanel>
        </ResizablePanel>
      </div>

      {/* Footer */}
      <Footer
        currentFile="欢迎页面"
        aiModelStatus="idle"
        taskProgress={0}
        statusMessage="准备就绪"
      />
    </div>
  );
}
