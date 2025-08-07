'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ResizablePanelProps {
  children: React.ReactNode;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  className?: string;
  resizeDirection?: 'left' | 'right';
  onResize?: (width: number) => void;
}

export function ResizablePanel({
  children,
  defaultWidth = 300,
  minWidth = 200,
  maxWidth = 600,
  className,
  resizeDirection = 'right',
  onResize,
}: ResizablePanelProps) {
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);
      startXRef.current = e.clientX;
      startWidthRef.current = width;

      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    },
    [width]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;

      const deltaX = e.clientX - startXRef.current;
      const newWidth =
        resizeDirection === 'right'
          ? startWidthRef.current + deltaX
          : startWidthRef.current - deltaX;

      const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      setWidth(constrainedWidth);
      onResize?.(constrainedWidth);
    },
    [isResizing, minWidth, maxWidth, resizeDirection, onResize]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={panelRef}
      className={cn('relative flex-shrink-0', className)}
      style={{ width }}
    >
      {children}

      {/* 调整手柄 */}
      <div
        className={cn(
          'absolute top-0 bottom-0 w-1 bg-transparent hover:bg-primary/20 cursor-ew-resize group',
          resizeDirection === 'right' ? 'right-0' : 'left-0',
          isResizing && 'bg-primary/30'
        )}
        onMouseDown={handleMouseDown}
      >
        <div
          className={cn(
            'absolute top-0 bottom-0 w-px bg-border transition-colors',
            'group-hover:bg-primary/50',
            isResizing && 'bg-primary',
            resizeDirection === 'right' ? 'right-0' : 'left-0'
          )}
        />
      </div>
    </div>
  );
}
