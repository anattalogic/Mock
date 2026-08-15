import React, { useState } from 'react';
import {
  Maximize2,
  Sliders,
  Type,
  Download,
  Unlock,
  Lock,
  Eye,
  EyeOff,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link,
  Sparkles,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  FileCode,
  FileDown,
  Printer,
  Copy,
  Boxes,
  Ungroup,
  Group as GroupIcon,
} from 'lucide-react';
import { CanvasElement, Page, AlignmentType, Project } from '../types';
import { getBoundingBox } from '../utils/groupUtils';

interface SidebarRightProps {
  selectedElements: CanvasElement[];
  activePage: Page;
  project?: Project;
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  onUpdatePage: (updates: Partial<Page>) => void;
  onAlignElements?: (type: AlignmentType) => void;
  onGroupElements?: () => void;
  onUngroupElements?: () => void;
  onToggleGroupLock?: (groupId: string) => void;
  onToggleGroupHide?: (groupId: string) => void;
  onRenameGroup?: (groupId: string, name: string) => void;
  onSetGroupOpacity?: (groupId: string, opacity: number) => void;
  onExportPNG: (scale: number, transparent: boolean) => void;
  onExportSVG: () => void;
}

export default function SidebarRight({
  selectedElements,
  activePage,
  project,
  onUpdateElement,
  onUpdatePage,
  onAlignElements,
  onGroupElements,
  onUngroupElements,
  onToggleGroupLock,
  onToggleGroupHide,
  onRenameGroup,
  onSetGroupOpacity,
  onExportPNG,
  onExportSVG,
}: SidebarRightProps) {
  const [activeTab, setActiveTab] = useState<'layout' | 'appearance' | 'text' | 'component' | 'export'>('layout');
  const [exportScale, setExportScale] = useState<number>(1);
  const [excludeBg, setExcludeBg] = useState<boolean>(false);
  const [copiedEmbed, setCopiedEmbed] = useState<boolean>(false);

  // Determine group status of selection
  const isMultiSelection = selectedElements.length > 1;
  const isSingleGroup =
    isMultiSelection &&
    selectedElements.every(
      (el) => el.groupId && el.groupId === selectedElements[0].groupId
    );
  const activeGroupId = isSingleGroup ? selectedElements[0].groupId : null;
  const activeGroupName = isSingleGroup ? selectedElements[0].groupName || 'Group Entity' : '';
  const groupBBox = isMultiSelection ? getBoundingBox(selectedElements) : null;
  const isGroupAllLocked = isMultiSelection && selectedElements.every((el) => el.locked);
  const isGroupAllHidden = isMultiSelection && selectedElements.every((el) => el.hidden);

  // If multiple elements selected, inspect the first one for generic styles
  const element = selectedElements[0];

  const handleLayoutChange = (field: string, value: any) => {
    if (!element) return;
    onUpdateElement(element.id, { [field]: value });
  };

  const handlePropChange = (key: string, val: any) => {
    if (!element || element.type !== 'ui-component') return;
    onUpdateElement(element.id, {
      props: {
        ...(element as any).props,
        [key]: val,
      },
    });
  };

  const fonts = ['Inter', 'Playfair Display', 'Space Mono', 'system-ui', 'Georgia', 'sans-serif'];

  const premiumPalette = [
    '#0F172A', '#1E293B', '#2563EB', '#10B981', '#F59E0B', '#EF4444', 
    '#8B5CF6', '#EC4899', '#14B8A6', '#06B6D4', '#FFFFFF', '#F1F5F9'
  ];

  const handleCopyMarkdownEmbed = () => {
    const md = `![${activePage.name} Guide](https://mockup-guide.app/view/${activePage.id}.png)\n\n*Interactive User Guide & Mockup created with Clean Minimalism Studio*`;
    navigator.clipboard.writeText(md);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2500);
  };

  return (
    <div className="w-80 bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 flex flex-col h-full shrink-0 select-none overflow-hidden">
      {/* Tab navigation for properties */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-1">
        <button
          onClick={() => setActiveTab('layout')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTab === 'layout'
              ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <Maximize2 size={12} />
          Layout
        </button>
        <button
          onClick={() => setActiveTab('appearance')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTab === 'appearance'
              ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <Sliders size={12} />
          Style
        </button>
        {element?.type === 'text' && (
          <button
            onClick={() => setActiveTab('text')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'text'
                ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Type size={12} />
            Text
          </button>
        )}
        {element?.type === 'ui-component' && (
          <button
            onClick={() => setActiveTab('component')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'component'
                ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Sparkles size={12} />
            Props
          </button>
        )}
        <button
          onClick={() => setActiveTab('export')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTab === 'export'
              ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <Download size={12} />
          Export
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* CASE 1: NO ELEMENT SELECTED - SHOW PAGE PROPERTIES */}
        {!element ? (
          <div className="space-y-4">
            <div className="text-xs font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-wider">
              Canvas Properties
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-zinc-500 block mb-1">Page Title</label>
                <input
                  type="text"
                  value={activePage.name}
                  onChange={(e) => onUpdatePage({ name: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-zinc-500 block mb-1">Width (px)</label>
                  <input
                    type="number"
                    value={activePage.width}
                    onChange={(e) => onUpdatePage({ width: Math.max(100, Number(e.target.value)) })}
                    className="w-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-500 block mb-1">Height (px)</label>
                  <input
                    type="number"
                    value={activePage.height}
                    onChange={(e) => onUpdatePage({ height: Math.max(100, Number(e.target.value)) })}
                    className="w-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-500 block mb-1.5">Canvas Background</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={activePage.backgroundColor}
                    onChange={(e) => onUpdatePage({ backgroundColor: e.target.value })}
                    className="w-8 h-8 rounded-md overflow-hidden cursor-pointer border border-zinc-200 shrink-0"
                  />
                  <input
                    type="text"
                    value={activePage.backgroundColor}
                    onChange={(e) => onUpdatePage({ backgroundColor: e.target.value })}
                    className="flex-1 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 font-mono outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <div className="text-[10px] text-zinc-400">
                  Select an object or multi-select items to inspect layout coordinates, alignment guides, gradients, shadows, text styles, or interactive hotspots.
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* CASE 2: ELEMENT SELECTED - PROPERTIES INSPECTOR */
          <>
            {/* ALIGNMENT & DISTRIBUTION TOOLS (WHEN ELEMENT(S) SELECTED) */}
            {onAlignElements && (
              <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-wider block mb-1.5">
                  Alignment & Distribution
                </span>
                <div className="grid grid-cols-8 gap-1 bg-zinc-50 dark:bg-zinc-850 p-1 rounded-md border border-zinc-200 dark:border-zinc-800">
                  <button
                    onClick={() => onAlignElements('left')}
                    className="p-1 rounded hover:bg-white dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center cursor-pointer"
                    title="Align Left"
                  >
                    <AlignStartVertical size={13} />
                  </button>
                  <button
                    onClick={() => onAlignElements('center')}
                    className="p-1 rounded hover:bg-white dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center cursor-pointer"
                    title="Align Center Horizontally"
                  >
                    <AlignCenterVertical size={13} />
                  </button>
                  <button
                    onClick={() => onAlignElements('right')}
                    className="p-1 rounded hover:bg-white dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center cursor-pointer"
                    title="Align Right"
                  >
                    <AlignEndVertical size={13} />
                  </button>
                  <button
                    onClick={() => onAlignElements('top')}
                    className="p-1 rounded hover:bg-white dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center cursor-pointer"
                    title="Align Top"
                  >
                    <AlignStartHorizontal size={13} />
                  </button>
                  <button
                    onClick={() => onAlignElements('middle')}
                    className="p-1 rounded hover:bg-white dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center cursor-pointer"
                    title="Align Middle Vertically"
                  >
                    <AlignCenterHorizontal size={13} />
                  </button>
                  <button
                    onClick={() => onAlignElements('bottom')}
                    className="p-1 rounded hover:bg-white dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center cursor-pointer"
                    title="Align Bottom"
                  >
                    <AlignEndHorizontal size={13} />
                  </button>
                  <button
                    onClick={() => onAlignElements('distribute-h')}
                    className="p-1 rounded hover:bg-white dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center cursor-pointer col-span-1"
                    title="Distribute Horizontally"
                  >
                    <span className="text-[10px] font-bold">H↔</span>
                  </button>
                  <button
                    onClick={() => onAlignElements('distribute-v')}
                    className="p-1 rounded hover:bg-white dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center cursor-pointer col-span-1"
                    title="Distribute Vertically"
                  >
                    <span className="text-[10px] font-bold">V↕</span>
                  </button>
                </div>
              </div>
            )}

            {/* LAYOUT TAB */}
            {activeTab === 'layout' && (
              <div className="space-y-4">
                {/* CASE: GROUP OR MULTI-SELECTION */}
                {isMultiSelection ? (
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Boxes size={15} className="text-blue-500 shrink-0" />
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider truncate">
                          {isSingleGroup ? activeGroupName : `Multiple Elements (${selectedElements.length})`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {isSingleGroup && activeGroupId && onToggleGroupLock && (
                          <button
                            onClick={() => onToggleGroupLock(activeGroupId)}
                            className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 cursor-pointer"
                            title={isGroupAllLocked ? 'Unlock Group' : 'Lock Group'}
                          >
                            {isGroupAllLocked ? <Lock size={13} className="text-amber-500" /> : <Unlock size={13} />}
                          </button>
                        )}
                        {isSingleGroup && activeGroupId && onToggleGroupHide && (
                          <button
                            onClick={() => onToggleGroupHide(activeGroupId)}
                            className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 cursor-pointer"
                            title={isGroupAllHidden ? 'Show Group' : 'Hide Group'}
                          >
                            {isGroupAllHidden ? <EyeOff size={13} className="text-red-500" /> : <Eye size={13} />}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Group Name Editing (if single group) */}
                    {isSingleGroup && activeGroupId && (
                      <div>
                        <label className="text-xs font-medium text-zinc-500 block mb-1">Group Label</label>
                        <input
                          type="text"
                          value={activeGroupName}
                          onChange={(e) => onRenameGroup && onRenameGroup(activeGroupId, e.target.value)}
                          className="w-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 outline-none focus:border-blue-500"
                        />
                      </div>
                    )}

                    {/* Group Action Buttons */}
                    <div className="p-2 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-medium text-blue-900 dark:text-blue-200">
                          {isSingleGroup ? 'Merged Group Entity' : 'Multi-element Selection'}
                        </span>
                        <span className="text-[10px] text-blue-700 dark:text-blue-300 font-mono">
                          {selectedElements.length} items
                        </span>
                      </div>

                      {isSingleGroup ? (
                        <button
                          onClick={() => onUngroupElements && onUngroupElements()}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 rounded text-xs font-medium text-zinc-700 dark:text-zinc-200 shadow-xs transition-all cursor-pointer"
                        >
                          <Ungroup size={13} className="text-zinc-500" />
                          <span>Ungroup Elements (Ctrl+Shift+G)</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onGroupElements && onGroupElements()}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium shadow-xs transition-all cursor-pointer"
                        >
                          <GroupIcon size={13} />
                          <span>Merge into Group (Ctrl+G)</span>
                        </button>
                      )}
                    </div>

                    {/* Group Bounding Coordinates */}
                    {groupBBox && (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs font-medium text-zinc-500 block mb-1">Bounds X</label>
                            <input
                              type="number"
                              disabled
                              value={Math.round(groupBBox.x)}
                              className="w-full bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-zinc-500 outline-none cursor-not-allowed"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-zinc-500 block mb-1">Bounds Y</label>
                            <input
                              type="number"
                              disabled
                              value={Math.round(groupBBox.y)}
                              className="w-full bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-zinc-500 outline-none cursor-not-allowed"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs font-medium text-zinc-500 block mb-1">Group Width (px)</label>
                            <input
                              type="number"
                              disabled
                              value={Math.round(groupBBox.width)}
                              className="w-full bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-zinc-500 outline-none cursor-not-allowed"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-zinc-500 block mb-1">Group Height (px)</label>
                            <input
                              type="number"
                              disabled
                              value={Math.round(groupBBox.height)}
                              className="w-full bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-zinc-500 outline-none cursor-not-allowed"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {/* Shared Group Opacity */}
                    <div>
                      <div className="flex justify-between text-xs font-medium text-zinc-500 mb-1">
                        <span>Shared Group Opacity</span>
                        <span>{Math.round((element.opacity ?? 1) * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={element.opacity ?? 1}
                        onChange={(e) => {
                          const newOp = Number(e.target.value);
                          if (isSingleGroup && activeGroupId && onSetGroupOpacity) {
                            onSetGroupOpacity(activeGroupId, newOp);
                          } else {
                            selectedElements.forEach((el) => {
                              onUpdateElement(el.id, { opacity: newOp });
                            });
                          }
                        }}
                        className="w-full accent-blue-600"
                      />
                    </div>
                  </div>
                ) : (
                  /* SINGLE ELEMENT LAYOUT */
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-wider">
                        {element.name || element.type.toUpperCase()}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleLayoutChange('locked', !element.locked)}
                          className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 cursor-pointer"
                          title={element.locked ? 'Unlock' : 'Lock'}
                        >
                          {element.locked ? <Lock size={13} className="text-amber-500" /> : <Unlock size={13} />}
                        </button>
                        <button
                          onClick={() => handleLayoutChange('hidden', !element.hidden)}
                          className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 cursor-pointer"
                          title={element.hidden ? 'Unhide' : 'Hide'}
                        >
                          {element.hidden ? <EyeOff size={13} className="text-red-500" /> : <Eye size={13} />}
                        </button>
                      </div>
                    </div>

                    {/* Name tag */}
                    <div>
                      <label className="text-xs font-medium text-zinc-500 block mb-1">Element Label</label>
                      <input
                        type="text"
                        value={element.name || ''}
                        onChange={(e) => handleLayoutChange('name', e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 outline-none"
                      />
                    </div>

                    {/* X & Y Coords */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-medium text-zinc-500 block mb-1">X Position</label>
                        <input
                          type="number"
                          value={Math.round(element.x)}
                          onChange={(e) => handleLayoutChange('x', Number(e.target.value))}
                          className="w-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-zinc-500 block mb-1">Y Position</label>
                        <input
                          type="number"
                          value={Math.round(element.y)}
                          onChange={(e) => handleLayoutChange('y', Number(e.target.value))}
                          className="w-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 outline-none"
                        />
                      </div>
                    </div>

                    {/* Width & Height */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-medium text-zinc-500 block mb-1">Width (px)</label>
                        <input
                          type="number"
                          value={Math.round(element.width)}
                          onChange={(e) => handleLayoutChange('width', Math.max(10, Number(e.target.value)))}
                          className="w-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-zinc-500 block mb-1">Height (px)</label>
                        <input
                          type="number"
                          value={Math.round(element.height)}
                          onChange={(e) => handleLayoutChange('height', Math.max(10, Number(e.target.value)))}
                          className="w-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 outline-none"
                        />
                      </div>
                    </div>

                    {/* Opacity */}
                    <div>
                      <div className="flex justify-between text-xs font-medium text-zinc-500 mb-1">
                        <span>Opacity</span>
                        <span>{Math.round(element.opacity * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={element.opacity}
                        onChange={(e) => handleLayoutChange('opacity', Number(e.target.value))}
                        className="w-full accent-blue-600"
                      />
                    </div>

                    {/* Interactive Hotspot Link to Page */}
                    <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                      <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 mb-1.5">
                        <Link size={13} className="text-blue-500" />
                        Interactive Hotspot Link
                      </label>
                      <select
                        value={element.linkToPageId || ''}
                        onChange={(e) => handleLayoutChange('linkToPageId', e.target.value || undefined)}
                        className="w-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 outline-none cursor-pointer"
                      >
                        <option value="">None (Static element)</option>
                        {project?.pages.map((p) => (
                          <option key={p.id} value={p.id}>
                            Go to Page: {p.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-zinc-400 mt-1">
                        Clicking this element in Preview Mode will navigate instantly to the linked page.
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* STYLE / APPEARANCE TAB */}
            {activeTab === 'appearance' && (
              <div className="space-y-4">
                <span className="text-xs font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-wider block">
                  Fill & Stroke Styling
                </span>

                {/* SHAPE FILL */}
                {('fillColor' in element) && (
                  <div>
                    <label className="text-xs font-medium text-zinc-500 block mb-1.5">Fill Color</label>
                    <div className="flex gap-2 items-center mb-2">
                      <input
                        type="color"
                        value={(element as any).fillColor || '#FFFFFF'}
                        onChange={(e) => handleLayoutChange('fillColor', e.target.value)}
                        className="w-8 h-8 rounded-md overflow-hidden cursor-pointer border border-zinc-200 shrink-0"
                      />
                      <input
                        type="text"
                        value={(element as any).fillColor || '#FFFFFF'}
                        onChange={(e) => handleLayoutChange('fillColor', e.target.value)}
                        className="flex-1 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 font-mono outline-none"
                      />
                    </div>
                    {/* Swatches */}
                    <div className="grid grid-cols-6 gap-1.5">
                      {premiumPalette.map((c) => (
                        <button
                          key={c}
                          onClick={() => handleLayoutChange('fillColor', c)}
                          className="w-full h-6 rounded border border-zinc-200 dark:border-zinc-700 transition-transform hover:scale-105 cursor-pointer"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* STROKE COLOR & WIDTH */}
                {('strokeColor' in element) && (
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="text-xs font-medium text-zinc-500 block mb-1.5">Stroke Color</label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={(element as any).strokeColor || '#2563EB'}
                          onChange={(e) => handleLayoutChange('strokeColor', e.target.value)}
                          className="w-8 h-8 rounded-md overflow-hidden cursor-pointer border border-zinc-200 shrink-0"
                        />
                        <input
                          type="text"
                          value={(element as any).strokeColor || '#2563EB'}
                          onChange={(e) => handleLayoutChange('strokeColor', e.target.value)}
                          className="flex-1 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 font-mono outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-medium text-zinc-500 mb-1">
                        <span>Stroke Width</span>
                        <span>{(element as any).strokeWidth || 0}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="20"
                        step="1"
                        value={(element as any).strokeWidth || 0}
                        onChange={(e) => handleLayoutChange('strokeWidth', Number(e.target.value))}
                        className="w-full accent-blue-600"
                      />
                    </div>
                  </div>
                )}

                {/* CORNER RADIUS */}
                {('cornerRadius' in element) && (
                  <div>
                    <div className="flex justify-between text-xs font-medium text-zinc-500 mb-1">
                      <span>Corner Radius</span>
                      <span>{(element as any).cornerRadius || 0}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="40"
                      step="2"
                      value={(element as any).cornerRadius || 0}
                      onChange={(e) => handleLayoutChange('cornerRadius', Number(e.target.value))}
                      className="w-full accent-blue-600"
                    />
                  </div>
                )}
              </div>
            )}

            {/* TEXT TAB */}
            {activeTab === 'text' && element?.type === 'text' && (
              <div className="space-y-4">
                <span className="text-xs font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-wider block">
                  Typography & Formatting
                </span>

                <div>
                  <label className="text-xs font-medium text-zinc-500 block mb-1">Text Content</label>
                  <textarea
                    rows={3}
                    value={(element as any).text}
                    onChange={(e) => handleLayoutChange('text', e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-md p-2 text-xs text-zinc-800 dark:text-zinc-200 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-500 block mb-1">Font Family</label>
                  <select
                    value={(element as any).fontFamily}
                    onChange={(e) => handleLayoutChange('fontFamily', e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 outline-none"
                  >
                    {fonts.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-zinc-500 block mb-1">Font Size</label>
                    <input
                      type="number"
                      value={(element as any).fontSize}
                      onChange={(e) => handleLayoutChange('fontSize', Number(e.target.value))}
                      className="w-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-500 block mb-1">Weight</label>
                    <select
                      value={(element as any).fontWeight}
                      onChange={(e) => handleLayoutChange('fontWeight', e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 outline-none"
                    >
                      <option value="normal">Regular (400)</option>
                      <option value="medium">Medium (500)</option>
                      <option value="semibold">Semibold (600)</option>
                      <option value="bold">Bold (700)</option>
                    </select>
                  </div>
                </div>

                {/* Alignment */}
                <div>
                  <label className="text-xs font-medium text-zinc-500 block mb-1">Alignment</label>
                  <div className="flex bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-md p-0.5">
                    {(['left', 'center', 'right', 'justify'] as const).map((a) => (
                      <button
                        key={a}
                        onClick={() => handleLayoutChange('align', a)}
                        className={`flex-1 py-1 flex items-center justify-center rounded cursor-pointer ${
                          (element as any).align === a ? 'bg-white dark:bg-zinc-700 shadow-xs' : 'text-zinc-400'
                        }`}
                      >
                        {a === 'left' && <AlignLeft size={13} />}
                        {a === 'center' && <AlignCenter size={13} />}
                        {a === 'right' && <AlignRight size={13} />}
                        {a === 'justify' && <AlignJustify size={13} />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* COMPONENT PROPS TAB (FOR UI-COMPONENT) */}
            {activeTab === 'component' && element?.type === 'ui-component' && (
              <div className="space-y-4">
                <span className="text-xs font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-wider block">
                  {(element as any).componentType.replace('-', ' ').toUpperCase()} Props
                </span>

                <div>
                  <label className="text-xs font-medium text-zinc-500 block mb-1">Main Label</label>
                  <input
                    type="text"
                    value={(element as any).props?.label || ''}
                    onChange={(e) => handlePropChange('label', e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 outline-none"
                  />
                </div>

                {('sublabel' in ((element as any).props || {})) && (
                  <div>
                    <label className="text-xs font-medium text-zinc-500 block mb-1">Sublabel / Description</label>
                    <input
                      type="text"
                      value={(element as any).props?.sublabel || ''}
                      onChange={(e) => handlePropChange('sublabel', e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 outline-none"
                    />
                  </div>
                )}

                {('value' in ((element as any).props || {})) && (
                  <div>
                    <label className="text-xs font-medium text-zinc-500 block mb-1">Metric Value</label>
                    <input
                      type="text"
                      value={(element as any).props?.value || ''}
                      onChange={(e) => handlePropChange('value', e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 outline-none"
                    />
                  </div>
                )}

                {('placeholder' in ((element as any).props || {})) && (
                  <div>
                    <label className="text-xs font-medium text-zinc-500 block mb-1">Placeholder</label>
                    <input
                      type="text"
                      value={(element as any).props?.placeholder || ''}
                      onChange={(e) => handlePropChange('placeholder', e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 outline-none"
                    />
                  </div>
                )}

                {('color' in ((element as any).props || {})) && (
                  <div>
                    <label className="text-xs font-medium text-zinc-500 block mb-1">Accent Theme Color</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={(element as any).props?.color || '#2563EB'}
                        onChange={(e) => handlePropChange('color', e.target.value)}
                        className="w-8 h-8 rounded-md overflow-hidden cursor-pointer border border-zinc-200 shrink-0"
                      />
                      <input
                        type="text"
                        value={(element as any).props?.color || '#2563EB'}
                        onChange={(e) => handlePropChange('color', e.target.value)}
                        className="flex-1 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 font-mono outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* EXPORT TAB */}
            {activeTab === 'export' && (
              <div className="space-y-4">
                <span className="text-xs font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-wider block">
                  Export Document & Images
                </span>

                {/* Resolution scale */}
                <div>
                  <label className="text-xs font-medium text-zinc-500 block mb-1.5">Image Resolution</label>
                  <div className="grid grid-cols-3 gap-1.5 bg-zinc-50 dark:bg-zinc-850 p-1 rounded-md border border-zinc-200 dark:border-zinc-800">
                    {[1, 2, 3].map((s) => (
                      <button
                        key={s}
                        onClick={() => setExportScale(s)}
                        className={`py-1 text-xs font-bold rounded cursor-pointer ${
                          exportScale === s
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                        }`}
                      >
                        {s}x {s === 1 ? 'Standard' : s === 2 ? 'Retina' : '3x HD'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Transparent toggle */}
                <label className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={excludeBg}
                    onChange={(e) => setExcludeBg(e.target.checked)}
                    className="rounded accent-blue-600"
                  />
                  <span>Transparent Background</span>
                </label>

                {/* Export Buttons */}
                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => onExportPNG(exportScale, excludeBg)}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Download size={13} />
                    Download PNG ({exportScale}x)
                  </button>

                  <button
                    onClick={onExportSVG}
                    className="w-full py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-800 dark:text-zinc-200 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 border border-zinc-200 dark:border-zinc-700 cursor-pointer"
                  >
                    <FileCode size={13} />
                    Download Scalable SVG
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="w-full py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-800 dark:text-zinc-200 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 border border-zinc-200 dark:border-zinc-700 cursor-pointer"
                  >
                    <Printer size={13} />
                    Print / Export PDF Guide
                  </button>

                  <button
                    onClick={handleCopyMarkdownEmbed}
                    className="w-full py-2 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 border border-zinc-200 dark:border-zinc-800 cursor-pointer"
                  >
                    <Copy size={13} />
                    {copiedEmbed ? 'Markdown Snippet Copied!' : 'Copy Markdown Embed'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
