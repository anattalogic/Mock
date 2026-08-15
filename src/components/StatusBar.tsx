import React from 'react';
import { MousePointer, LayoutGrid, CheckCircle2, AlertCircle } from 'lucide-react';
import { Point } from '../types';

interface StatusBarProps {
  currentPageIndex: number;
  totalPagesCount: number;
  cursorPos: Point;
  selectedCount: number;
  zoomPercent: number;
  unsavedChanges: boolean;
}

export default function StatusBar({
  currentPageIndex,
  totalPagesCount,
  cursorPos,
  selectedCount,
  zoomPercent,
  unsavedChanges,
}: StatusBarProps) {
  return (
    <div className="h-8 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 select-none z-30 shrink-0">
      {/* Page indicator & zoom */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <LayoutGrid size={12} className="text-zinc-400" />
          <span>
            Page <strong className="text-zinc-800 dark:text-zinc-200">{currentPageIndex + 1}</strong> of{' '}
            <strong className="text-zinc-800 dark:text-zinc-200">{totalPagesCount}</strong>
          </span>
        </div>
        <div className="w-px h-3 bg-zinc-200 dark:bg-zinc-800" />
        <span>Zoom: <strong className="text-zinc-800 dark:text-zinc-200">{zoomPercent}%</strong></span>
      </div>

      {/* Mouse cursor coords & selection count */}
      <div className="flex items-center gap-4">
        {/* Selection status */}
        {selectedCount > 0 ? (
          <span className="bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded text-[10px] font-bold">
            {selectedCount} item{selectedCount > 1 ? 's' : ''} selected
          </span>
        ) : (
          <span className="text-zinc-400">No selection</span>
        )}

        <div className="w-px h-3 bg-zinc-200 dark:bg-zinc-800" />

        {/* Live coordinate tracking */}
        <div className="flex items-center gap-1.5 font-mono">
          <MousePointer size={11} className="text-zinc-400" />
          <span>
            X: <strong className="text-zinc-800 dark:text-zinc-200">{cursorPos.x}px</strong>, Y:{' '}
            <strong className="text-zinc-800 dark:text-zinc-200">{cursorPos.y}px</strong>
          </span>
        </div>
      </div>

      {/* Auto-save & Snapping alerts */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
          <CheckCircle2 size={12} />
          <span>Smart Snapping Active</span>
        </div>
        
        <div className="w-px h-3 bg-zinc-200 dark:bg-zinc-800" />

        <div className="flex items-center gap-1">
          {unsavedChanges ? (
            <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span>Unsaved Draft</span>
            </div>
          ) : (
            <span className="text-zinc-400 font-semibold">Saved Locally</span>
          )}
        </div>
      </div>
    </div>
  );
}
