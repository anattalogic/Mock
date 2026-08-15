import React from 'react';
import {
  MousePointer,
  Type,
  Square,
  Circle,
  Triangle,
  Star,
  Minus,
  MoveRight,
  PenTool,
  Highlighter,
  StickyNote,
  MessageSquare,
  PlusCircle,
  Link2,
  Image,
  Layers,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { ToolType } from '../types';

interface ToolbarProps {
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
  onAddSampleImage: () => void;
  onAddDeviceFrame: (type: 'iphone' | 'ipad' | 'desktop') => void;
  onClearDrawingHistory?: () => void;
}

export default function Toolbar({
  activeTool,
  setActiveTool,
  onAddSampleImage,
  onAddDeviceFrame,
}: ToolbarProps) {
  const tools: { id: ToolType; label: string; icon: React.ReactNode; category: 'select' | 'shape' | 'draw' | 'annotation' | 'container' }[] = [
    { id: 'select', label: 'Select (V)', icon: <MousePointer size={18} />, category: 'select' },
    { id: 'text', label: 'Text Box (T)', icon: <Type size={18} />, category: 'shape' },
    { id: 'rectangle', label: 'Rectangle (R)', icon: <Square size={18} />, category: 'shape' },
    { id: 'circle', label: 'Circle (O)', icon: <Circle size={18} />, category: 'shape' },
    { id: 'triangle', label: 'Triangle', icon: <Triangle size={18} />, category: 'shape' },
    { id: 'star', label: 'Star', icon: <Star size={18} />, category: 'shape' },
    { id: 'line', label: 'Line (L)', icon: <Minus size={18} />, category: 'shape' },
    { id: 'arrow', label: 'Arrow (A)', icon: <MoveRight size={18} />, category: 'shape' },
    { id: 'pen', label: 'Pen Draw (P)', icon: <PenTool size={18} />, category: 'draw' },
    { id: 'highlighter', label: 'Highlighter', icon: <Highlighter size={18} />, category: 'draw' },
    { id: 'sticky', label: 'Sticky Note (S)', icon: <StickyNote size={18} />, category: 'annotation' },
    { id: 'callout', label: 'Callout Bubble', icon: <MessageSquare size={18} />, category: 'annotation' },
    { id: 'step-indicator', label: 'Step Counter', icon: <PlusCircle size={18} />, category: 'annotation' },
    { id: 'connector', label: 'Connector Line', icon: <Link2 size={18} />, category: 'annotation' },
    { id: 'frame', label: 'Frame Panel', icon: <Layers size={18} />, category: 'container' },
  ];

  return (
    <div className="flex flex-col items-center bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 w-16 py-4 gap-4 shrink-0 shadow-sm z-30 select-none">
      <div className="text-zinc-400 dark:text-zinc-600 font-bold text-xs tracking-wider uppercase">Tools</div>
      
      {/* Selection Category */}
      <div className="flex flex-col gap-1 w-full px-2">
        {tools
          .filter((t) => t.category === 'select')
          .map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`p-2.5 rounded-md flex items-center justify-center transition-all cursor-pointer ${
                activeTool === tool.id
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 font-semibold shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
              title={tool.label}
            >
              {tool.icon}
            </button>
          ))}
      </div>

      <div className="w-8 border-t border-zinc-200 dark:border-zinc-800" />

      {/* Shapes & Text Category */}
      <div className="flex flex-col gap-1 w-full px-2">
        <div className="text-[10px] text-zinc-400 dark:text-zinc-600 text-center mb-1 font-semibold">Shape</div>
        {tools
          .filter((t) => t.category === 'shape')
          .map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`p-2.5 rounded-md flex items-center justify-center transition-all cursor-pointer ${
                activeTool === tool.id
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
              title={tool.label}
            >
              {tool.icon}
            </button>
          ))}
      </div>

      <div className="w-8 border-t border-zinc-200 dark:border-zinc-800" />

      {/* Drawing Category */}
      <div className="flex flex-col gap-1 w-full px-2">
        <div className="text-[10px] text-zinc-400 dark:text-zinc-600 text-center mb-1 font-semibold">Draw</div>
        {tools
          .filter((t) => t.category === 'draw')
          .map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`p-2.5 rounded-md flex items-center justify-center transition-all cursor-pointer ${
                activeTool === tool.id
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
              title={tool.label}
            >
              {tool.icon}
            </button>
          ))}
      </div>

      <div className="w-8 border-t border-zinc-200 dark:border-zinc-800" />

      {/* Guides/Steps/Annotations */}
      <div className="flex flex-col gap-1 w-full px-2">
        <div className="text-[10px] text-zinc-400 dark:text-zinc-600 text-center mb-1 font-semibold">Guide</div>
        {tools
          .filter((t) => t.category === 'annotation' || t.category === 'container')
          .map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`p-2.5 rounded-md flex items-center justify-center transition-all cursor-pointer ${
                activeTool === tool.id
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
              title={tool.label}
            >
              {tool.icon}
            </button>
          ))}
      </div>

      <div className="w-8 border-t border-zinc-200 dark:border-zinc-800 mt-auto" />

      {/* Quick Action Preset Buttons */}
      <div className="flex flex-col gap-1 w-full px-2 mt-auto">
        <button
          onClick={() => onAddDeviceFrame('iphone')}
          className="p-2 rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800 flex items-center justify-center cursor-pointer"
          title="Add Device Frame"
        >
          <Smartphone size={18} />
        </button>
        <button
          onClick={onAddSampleImage}
          className="p-2 rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800 flex items-center justify-center cursor-pointer"
          title="Add Sample Mockup Screen"
        >
          <Image size={18} />
        </button>
      </div>
    </div>
  );
}
