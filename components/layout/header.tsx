import { Button } from '@/components/ui/button';
import { Navigation } from './navigation';
import { MobileNav } from './mobile-nav';
import { ThemeToggle } from './theme-toggle';
import { Settings, HelpCircle } from 'lucide-react';

export function Header() {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4 lg:px-6">
      {/* Logo and Brand */}
      <div className="flex items-center space-x-4">
        <MobileNav />
        <div className="flex items-center space-x-2">
          <div className="text-xl font-bold text-primary">ResumeXAgent</div>
        </div>
      </div>

      {/* Main Navigation Menu */}
      <Navigation className="hidden lg:flex" />

      {/* Action Buttons */}
      <div className="flex items-center space-x-2">
        <ThemeToggle />
        <Button variant="ghost" size="icon">
          <Settings className="h-4 w-4" />
          <span className="sr-only">设置</span>
        </Button>
        <Button variant="ghost" size="icon">
          <HelpCircle className="h-4 w-4" />
          <span className="sr-only">帮助</span>
        </Button>
      </div>
    </header>
  );
}
