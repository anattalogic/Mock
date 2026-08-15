import React, { useState } from 'react';
import {
  FileText,
  Layers,
  Image as ImageIcon,
  Plus,
  Copy,
  Trash2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Upload,
  Component,
  Smartphone,
  Tablet,
  Monitor,
  Globe,
  Terminal,
  Watch,
  ToggleLeft,
  Search,
  CreditCard,
  User,
  AlertTriangle,
  MessageSquare,
  StickyNote,
  ListOrdered,
  Radio,
  Command,
  Boxes,
  Ungroup,
  Group as GroupIcon,
  ChevronRight,
  ChevronDown,
  Edit3,
} from 'lucide-react';
import { Page, CanvasElement, Project, DeviceType, UIComponentVariant } from '../types';
import { getGroupsInPage } from '../utils/groupUtils';

interface SidebarLeftProps {
  project: Project;
  activePageId: string;
  setActivePageId: (id: string) => void;
  onAddPage: () => void;
  onDuplicatePage: (id: string) => void;
  onDeletePage: (id: string) => void;
  onRenamePage: (id: string, name: string) => void;
  onReorderPages: (fromIndex: number, toIndex: number) => void;
  onSetAsCover: (id: string) => void;
  
  // Layers & Elements management
  elements: CanvasElement[];
  selectedElementIds: string[];
  onSelectElement: (id: string, shiftKey: boolean) => void;
  onToggleLock: (id: string) => void;
  onToggleHide: (id: string) => void;
  onDeleteElement: (id: string) => void;
  onReorderElements: (id: string, direction: 'up' | 'down' | 'front' | 'back') => void;

  // Group Operations
  onGroupElements?: () => void;
  onUngroupElements?: () => void;
  onToggleGroupLock?: (groupId: string) => void;
  onToggleGroupHide?: (groupId: string) => void;
  onRenameGroup?: (groupId: string, name: string) => void;
  onSelectGroup?: (groupId: string, shiftKey: boolean) => void;
  onDeleteGroup?: (groupId: string) => void;

  // Add Component / Frame Helper
  onAddElement: (element: CanvasElement) => void;

  // Assets Upload
  onUploadImage: (base64Url: string) => void;
}

export default function SidebarLeft({
  project,
  activePageId,
  setActivePageId,
  onAddPage,
  onDuplicatePage,
  onDeletePage,
  onRenamePage,
  onReorderPages,
  onSetAsCover,
  elements,
  selectedElementIds,
  onSelectElement,
  onToggleLock,
  onToggleHide,
  onDeleteElement,
  onReorderElements,
  onGroupElements,
  onUngroupElements,
  onToggleGroupLock,
  onToggleGroupHide,
  onRenameGroup,
  onSelectGroup,
  onDeleteGroup,
  onAddElement,
  onUploadImage,
}: SidebarLeftProps) {
  const [activeTab, setActiveTab] = useState<'pages' | 'layers' | 'uikit' | 'assets'>('pages');
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingPageName, setEditingPageName] = useState('');
  const [collapsedGroupIds, setCollapsedGroupIds] = useState<string[]>([]);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState<string>('');

  const startEditingPage = (page: Page) => {
    setEditingPageId(page.id);
    setEditingPageName(page.name);
  };

  const savePageName = (id: string) => {
    if (editingPageName.trim()) {
      onRenamePage(id, editingPageName.trim());
    }
    setEditingPageId(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result && typeof event.target.result === 'string') {
          onUploadImage(event.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Helper to add premade UI components to canvas
  const handleAddUIComponent = (componentType: UIComponentVariant) => {
    const id = `ui-${Date.now()}`;
    let base: CanvasElement;

    switch (componentType) {
      case 'button-primary':
        base = {
          id,
          type: 'ui-component',
          componentType,
          name: 'Primary Button',
          x: 200,
          y: 200,
          width: 200,
          height: 44,
          rotation: 0,
          opacity: 1,
          locked: false,
          hidden: false,
          zIndex: elements.length + 1,
          props: { label: 'Click to Action', color: '#2563EB' },
        };
        break;
      case 'button-secondary':
        base = {
          id,
          type: 'ui-component',
          componentType,
          name: 'Secondary Button',
          x: 200,
          y: 200,
          width: 200,
          height: 44,
          rotation: 0,
          opacity: 1,
          locked: false,
          hidden: false,
          zIndex: elements.length + 1,
          props: { label: 'Cancel', color: '#64748B' },
        };
        break;
      case 'input-text':
        base = {
          id,
          type: 'ui-component',
          componentType,
          name: 'Text Input',
          x: 200,
          y: 200,
          width: 280,
          height: 56,
          rotation: 0,
          opacity: 1,
          locked: false,
          hidden: false,
          zIndex: elements.length + 1,
          props: { label: 'Full Name', placeholder: 'Enter your name...' },
        };
        break;
      case 'input-search':
        base = {
          id,
          type: 'ui-component',
          componentType,
          name: 'Search Bar',
          x: 200,
          y: 200,
          width: 300,
          height: 42,
          rotation: 0,
          opacity: 1,
          locked: false,
          hidden: false,
          zIndex: elements.length + 1,
          props: { placeholder: 'Search products, articles...' },
        };
        break;
      case 'toggle-switch':
        base = {
          id,
          type: 'ui-component',
          componentType,
          name: 'Toggle Switch',
          x: 200,
          y: 200,
          width: 320,
          height: 50,
          rotation: 0,
          opacity: 1,
          locked: false,
          hidden: false,
          zIndex: elements.length + 1,
          props: { label: 'Enable Notifications', sublabel: 'Receive instant push updates', isActive: true },
        };
        break;
      case 'metric-card':
        base = {
          id,
          type: 'ui-component',
          componentType,
          name: 'KPI Metric Card',
          x: 200,
          y: 200,
          width: 240,
          height: 120,
          rotation: 0,
          opacity: 1,
          locked: false,
          hidden: false,
          zIndex: elements.length + 1,
          props: { label: 'Total Revenue', value: '$84,230', sublabel: '+14.2% vs last month', badgeText: '+14.2%', color: '#10B981' },
        };
        break;
      case 'user-card':
        base = {
          id,
          type: 'ui-component',
          componentType,
          name: 'User Profile Card',
          x: 200,
          y: 200,
          width: 320,
          height: 80,
          rotation: 0,
          opacity: 1,
          locked: false,
          hidden: false,
          zIndex: elements.length + 1,
          props: { label: 'Sarah Connor', sublabel: 'Lead Product Manager', badgeText: 'Pro' },
        };
        break;
      case 'alert-banner':
        base = {
          id,
          type: 'ui-component',
          componentType,
          name: 'Alert Banner',
          x: 200,
          y: 200,
          width: 480,
          height: 48,
          rotation: 0,
          opacity: 1,
          locked: false,
          hidden: false,
          zIndex: elements.length + 1,
          props: { label: 'Notice', sublabel: 'Changes have been saved to your workspace.', color: '#2563EB' },
        };
        break;
      case 'navbar':
        base = {
          id,
          type: 'ui-component',
          componentType,
          name: 'Application Navbar',
          x: 100,
          y: 100,
          width: 800,
          height: 52,
          rotation: 0,
          opacity: 1,
          locked: false,
          hidden: false,
          zIndex: elements.length + 1,
          props: { label: 'Acme Cloud Studio', sublabel: 'Project v2' },
        };
        break;
      case 'tabbar':
        base = {
          id,
          type: 'ui-component',
          componentType,
          name: 'Mobile Tab Bar',
          x: 200,
          y: 400,
          width: 360,
          height: 60,
          rotation: 0,
          opacity: 1,
          locked: false,
          hidden: false,
          zIndex: elements.length + 1,
          props: { label: 'Explore', sublabel: 'Home' },
        };
        break;
      default:
        base = {
          id,
          type: 'ui-component',
          componentType: 'button-primary',
          name: 'UI Button',
          x: 200,
          y: 200,
          width: 160,
          height: 40,
          rotation: 0,
          opacity: 1,
          locked: false,
          hidden: false,
          zIndex: elements.length + 1,
          props: { label: 'Action Button' },
        };
    }

    onAddElement(base);
  };

  // Helper to add device frames
  const handleAddDevice = (deviceType: DeviceType) => {
    const id = `df-${Date.now()}`;
    let width = 360;
    let height = 720;

    if (deviceType === 'ipad') {
      width = 720;
      height = 540;
    } else if (deviceType === 'desktop' || deviceType === 'browser') {
      width = 860;
      height = 560;
    } else if (deviceType === 'watch') {
      width = 240;
      height = 300;
    } else if (deviceType === 'terminal') {
      width = 640;
      height = 420;
    }

    const frame: CanvasElement = {
      id,
      type: 'device-frame',
      name: `${deviceType.toUpperCase()} Mockup Frame`,
      x: 150,
      y: 100,
      width,
      height,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
      zIndex: elements.length + 1,
      deviceType,
      backgroundColor: deviceType === 'terminal' ? '#0F172A' : '#FFFFFF',
      orientation: deviceType === 'iphone' || deviceType === 'android' || deviceType === 'watch' ? 'portrait' : 'landscape',
    };

    onAddElement(frame);
  };

  // Helper to add annotations
  const handleAddAnnotation = (type: 'callout' | 'step' | 'sticky' | 'hotspot' | 'keycap') => {
    const id = `ann-${Date.now()}`;
    let element: CanvasElement;

    if (type === 'callout') {
      element = {
        id,
        type: 'callout',
        name: 'Callout Bubble',
        x: 200,
        y: 200,
        width: 220,
        height: 90,
        rotation: 0,
        opacity: 1,
        locked: false,
        hidden: false,
        zIndex: elements.length + 1,
        text: '💡 Pointing to essential feature or workflow.',
        pointerDirection: 'bottom',
        backgroundColor: '#2563EB',
        textColor: '#FFFFFF',
      };
    } else if (type === 'step') {
      element = {
        id,
        type: 'step-indicator',
        name: 'Step Marker',
        x: 200,
        y: 200,
        width: 240,
        height: 90,
        rotation: 0,
        opacity: 1,
        locked: false,
        hidden: false,
        zIndex: elements.length + 1,
        stepNumber: 1,
        title: 'Step Title',
        description: 'Provide clear instructions to guide the user through the process.',
        status: 'active',
      };
    } else if (type === 'sticky') {
      element = {
        id,
        type: 'sticky',
        name: 'Sticky Note',
        x: 200,
        y: 200,
        width: 180,
        height: 140,
        rotation: -2,
        opacity: 1,
        locked: false,
        hidden: false,
        zIndex: elements.length + 1,
        color: 'yellow',
        text: '📌 Review note:\nDouble-check alignment and responsive contrast.',
        author: 'Designer',
      };
    } else if (type === 'hotspot') {
      element = {
        id,
        type: 'hotspot',
        name: 'Pulsing Hotspot',
        x: 200,
        y: 200,
        width: 32,
        height: 32,
        rotation: 0,
        opacity: 1,
        locked: false,
        hidden: false,
        zIndex: elements.length + 1,
        label: 'Click Beacon',
        pulseColor: '#2563EB',
      };
    } else {
      element = {
        id,
        type: 'keycap',
        name: 'Shortcut Keycap',
        x: 200,
        y: 200,
        width: 260,
        height: 56,
        rotation: 0,
        opacity: 1,
        locked: false,
        hidden: false,
        zIndex: elements.length + 1,
        keys: ['⌘', 'K'],
        label: 'Open Command Menu',
      };
    }

    onAddElement(element);
  };

  const sampleLibrary = [
    {
      name: 'Mobile Sign In',
      url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80',
    },
    {
      name: 'Dashboard UI Mock',
      url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80',
    },
    {
      name: 'Analytics Wireframe',
      url: 'https://images.unsplash.com/photo-1508921912186-1d1a45ebb3c1?auto=format&fit=crop&w=400&q=80',
    },
  ];

  return (
    <div className="w-68 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col h-full shrink-0 select-none overflow-hidden">
      {/* Tabs list */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-1">
        <button
          onClick={() => setActiveTab('pages')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTab === 'pages'
              ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
          title="Manage Pages & Slides"
        >
          <FileText size={13} />
          Pages
        </button>
        <button
          onClick={() => setActiveTab('layers')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTab === 'layers'
              ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
          title="Manage Layer Stacking"
        >
          <Layers size={13} />
          Layers
        </button>
        <button
          onClick={() => setActiveTab('uikit')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTab === 'uikit'
              ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
          title="UI Kit Mockup Library"
        >
          <Component size={13} />
          UI Kit
        </button>
        <button
          onClick={() => setActiveTab('assets')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTab === 'assets'
              ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
          title="Assets & Media"
        >
          <ImageIcon size={13} />
          Assets
        </button>
      </div>

      {/* Tab content area */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* PAGES TAB */}
        {activeTab === 'pages' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-wider">
                Pages ({project.pages.length})
              </span>
              <button
                onClick={onAddPage}
                className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-blue-600 dark:text-blue-400 transition-colors cursor-pointer"
                title="Create Blank Page"
              >
                <Plus size={16} />
              </button>
            </div>

            <div className="space-y-1">
              {project.pages.map((page, index) => {
                const isActive = page.id === activePageId;
                return (
                  <div
                    key={page.id}
                    className={`group flex items-center justify-between p-2 rounded-md transition-all border ${
                      isActive
                        ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/40 text-blue-900 dark:text-blue-100'
                        : 'border-transparent text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <FileText size={14} className="text-zinc-400 shrink-0" />
                      {editingPageId === page.id ? (
                        <input
                          type="text"
                          value={editingPageName}
                          onChange={(e) => setEditingPageName(e.target.value)}
                          onBlur={() => savePageName(page.id)}
                          onKeyDown={(e) => e.key === 'Enter' && savePageName(page.id)}
                          className="w-full bg-white dark:bg-zinc-800 border border-blue-500 rounded px-1 py-0.5 text-xs outline-none"
                          autoFocus
                        />
                      ) : (
                        <span
                          className="text-xs font-medium truncate cursor-pointer hover:underline flex-1"
                          onClick={() => setActivePageId(page.id)}
                          onDoubleClick={() => startEditingPage(page)}
                        >
                          {page.name}
                          {page.isCover && (
                            <span className="ml-1.5 px-1 py-0.2 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[9px] rounded-sm font-semibold uppercase">
                              Cover
                            </span>
                          )}
                        </span>
                      )}
                    </div>

                    {/* Actions panel */}
                    <div className="hidden group-hover:flex items-center gap-0.5 shrink-0 pl-2">
                      <button
                        onClick={() => onDuplicatePage(page.id)}
                        className="p-1 rounded text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                        title="Duplicate Page"
                      >
                        <Copy size={12} />
                      </button>
                      <button
                        onClick={() => onSetAsCover(page.id)}
                        className="p-1 rounded text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                        title="Set as Cover Page"
                      >
                        <Sparkles size={12} />
                      </button>
                      <button
                        onClick={() => onDeletePage(page.id)}
                        className="p-1 rounded text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                        disabled={project.pages.length <= 1}
                        title="Delete Page"
                      >
                        <Trash2 size={12} />
                      </button>
                      <button
                        onClick={() => index > 0 && onReorderPages(index, index - 1)}
                        className="p-1 rounded text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 cursor-pointer"
                        disabled={index === 0}
                        title="Move Up"
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button
                        onClick={() => index < project.pages.length - 1 && onReorderPages(index, index + 1)}
                        className="p-1 rounded text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 cursor-pointer"
                        disabled={index === project.pages.length - 1}
                        title="Move Down"
                      >
                        <ArrowDown size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="text-[10px] text-zinc-400 dark:text-zinc-600 px-1 italic">
              Double-click page name to rename. Reorder by clicking up/down.
            </div>
          </div>
        )}

        {/* LAYERS TAB */}
        {activeTab === 'layers' && (() => {
          const groups = getGroupsInPage(elements);
          const groupedElementIds = new Set<string>();
          groups.forEach((g) => g.elementIds.forEach((id) => groupedElementIds.add(id)));

          const hasSelectedGroup = selectedElementIds.some((id) => {
            const el = elements.find((e) => e.id === id);
            return el && el.groupId;
          });
          const canGroup = selectedElementIds.length > 1;

          const toggleGroupCollapse = (groupId: string) => {
            setCollapsedGroupIds((prev) =>
              prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
            );
          };

          const handleSaveGroupName = (groupId: string) => {
            if (onRenameGroup && editingGroupName.trim()) {
              onRenameGroup(groupId, editingGroupName.trim());
            }
            setEditingGroupId(null);
            setEditingGroupName('');
          };

          return (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-wider">
                  Layers & Groups
                </span>
                <span className="text-[10px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-500 px-1.5 py-0.5 rounded font-mono">
                  {elements.length} items {groups.length > 0 && `• ${groups.length} groups`}
                </span>
              </div>

              {/* Quick Group / Ungroup Action Bar */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-850 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <button
                  onClick={() => onGroupElements && onGroupElements()}
                  disabled={!canGroup}
                  className={`flex items-center justify-center gap-1.5 py-1 px-2 rounded text-xs font-medium transition-all ${
                    canGroup
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-xs cursor-pointer'
                      : 'text-zinc-400 dark:text-zinc-600 opacity-50 cursor-not-allowed'
                  }`}
                  title="Group selected elements (Ctrl+G)"
                >
                  <GroupIcon size={13} />
                  <span>Group</span>
                </button>
                <button
                  onClick={() => onUngroupElements && onUngroupElements()}
                  disabled={!hasSelectedGroup}
                  className={`flex items-center justify-center gap-1.5 py-1 px-2 rounded text-xs font-medium transition-all ${
                    hasSelectedGroup
                      ? 'bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 shadow-xs cursor-pointer'
                      : 'text-zinc-400 dark:text-zinc-600 opacity-50 cursor-not-allowed'
                  }`}
                  title="Ungroup selected group (Ctrl+Shift+G)"
                >
                  <Ungroup size={13} />
                  <span>Ungroup</span>
                </button>
              </div>

              {elements.length === 0 ? (
                <div className="text-center py-8 text-xs text-zinc-400 dark:text-zinc-500 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-md">
                  No elements on canvas. Pick a component from the UI Kit tab!
                </div>
              ) : (
                <div className="space-y-1.5">
                  {/* Render Groups First (as collapsible folders) */}
                  {groups.map((group) => {
                    const isCollapsed = collapsedGroupIds.includes(group.id);
                    const groupElements = elements
                      .filter((el) => el.groupId === group.id)
                      .sort((a, b) => b.zIndex - a.zIndex);
                    const isGroupSelected =
                      groupElements.length > 0 &&
                      groupElements.every((el) => selectedElementIds.includes(el.id));

                    return (
                      <div
                        key={`group-card-${group.id}`}
                        className={`rounded-md border transition-all ${
                          isGroupSelected
                            ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/60'
                            : 'bg-zinc-50/50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800'
                        }`}
                      >
                        {/* Group Header Row */}
                        <div
                          onClick={(e) => {
                            if (onSelectGroup) {
                              onSelectGroup(group.id, e.shiftKey);
                            }
                          }}
                          className="group flex items-center justify-between p-1.5 cursor-pointer rounded-t-md hover:bg-zinc-100/70 dark:hover:bg-zinc-800/60"
                        >
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleGroupCollapse(group.id);
                              }}
                              className="p-0.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded cursor-pointer"
                            >
                              {isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                            </button>
                            <Boxes size={14} className="text-blue-500 shrink-0" />

                            {editingGroupId === group.id ? (
                              <input
                                autoFocus
                                type="text"
                                value={editingGroupName}
                                onChange={(e) => setEditingGroupName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveGroupName(group.id);
                                  if (e.key === 'Escape') setEditingGroupId(null);
                                }}
                                onBlur={() => handleSaveGroupName(group.id)}
                                onClick={(e) => e.stopPropagation()}
                                className="h-5 px-1 text-xs border border-blue-500 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 w-full"
                              />
                            ) : (
                              <span
                                onDoubleClick={(e) => {
                                  e.stopPropagation();
                                  setEditingGroupId(group.id);
                                  setEditingGroupName(group.name);
                                }}
                                className="text-xs font-semibold truncate text-zinc-800 dark:text-zinc-200 flex-1"
                                title="Double click to rename group"
                              >
                                {group.name}
                              </span>
                            )}

                            <span className="text-[9px] font-mono text-zinc-400 bg-zinc-200/60 dark:bg-zinc-800 px-1.5 py-0.2 rounded-full shrink-0">
                              {group.elementsCount}
                            </span>
                          </div>

                          {/* Group-level action buttons */}
                          <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 shrink-0">
                            {onToggleGroupLock && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleGroupLock(group.id);
                                }}
                                className="p-1 rounded text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                                title={group.isLocked ? 'Unlock Group' : 'Lock Group'}
                              >
                                {group.isLocked ? (
                                  <Lock size={12} className="text-amber-500" />
                                ) : (
                                  <Unlock size={12} />
                                )}
                              </button>
                            )}

                            {onToggleGroupHide && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleGroupHide(group.id);
                                }}
                                className="p-1 rounded text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                                title={group.isHidden ? 'Show Group' : 'Hide Group'}
                              >
                                {group.isHidden ? (
                                  <EyeOff size={12} className="text-red-500" />
                                ) : (
                                  <Eye size={12} />
                                )}
                              </button>
                            )}

                            {onUngroupElements && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onSelectGroup) onSelectGroup(group.id, false);
                                  setTimeout(() => onUngroupElements(), 50);
                                }}
                                className="p-1 rounded text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                                title="Ungroup"
                              >
                                <Ungroup size={12} />
                              </button>
                            )}

                            {onDeleteGroup && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteGroup(group.id);
                                }}
                                className="p-1 rounded text-zinc-400 hover:text-red-500 cursor-pointer"
                                title="Delete Group"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Indented Group Items */}
                        {!isCollapsed && (
                          <div className="pl-5 pr-1.5 pb-1 space-y-0.5 border-t border-zinc-100 dark:border-zinc-800/80 pt-1">
                            {groupElements.map((el) => {
                              const isChildSelected = selectedElementIds.includes(el.id);
                              return (
                                <div
                                  key={el.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectElement(el.id, e.shiftKey);
                                  }}
                                  className={`group/child flex items-center justify-between p-1.5 rounded cursor-pointer transition-all border ${
                                    isChildSelected
                                      ? 'bg-blue-100/50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100 font-medium'
                                      : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                    <span className="text-[9px] text-zinc-400 font-mono w-3 shrink-0">
                                      {el.zIndex}
                                    </span>
                                    <span className="text-xs truncate">
                                      {el.name || el.type.toUpperCase()}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-0.5 opacity-50 group-hover/child:opacity-100">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleLock(el.id);
                                      }}
                                      className="p-0.5 rounded text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                                      title={el.locked ? 'Unlock element' : 'Lock element'}
                                    >
                                      {el.locked ? (
                                        <Lock size={11} className="text-amber-500" />
                                      ) : (
                                        <Unlock size={11} />
                                      )}
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleHide(el.id);
                                      }}
                                      className="p-0.5 rounded text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                                      title={el.hidden ? 'Show element' : 'Hide element'}
                                    >
                                      {el.hidden ? (
                                        <EyeOff size={11} className="text-red-500" />
                                      ) : (
                                        <Eye size={11} />
                                      )}
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteElement(el.id);
                                      }}
                                      className="p-0.5 rounded text-zinc-400 hover:text-red-500"
                                      title="Delete Item"
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Render Ungrouped Elements */}
                  {elements
                    .filter((el) => !groupedElementIds.has(el.id))
                    .sort((a, b) => b.zIndex - a.zIndex)
                    .map((el) => {
                      const isSelected = selectedElementIds.includes(el.id);
                      return (
                        <div
                          key={el.id}
                          onClick={(e) => onSelectElement(el.id, e.shiftKey)}
                          className={`group flex items-center justify-between p-2 rounded-md cursor-pointer transition-all border ${
                            isSelected
                              ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/40 text-blue-900 dark:text-blue-100'
                              : 'border-transparent text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-[10px] text-zinc-400 font-mono w-4 shrink-0">
                              {el.zIndex}
                            </span>
                            <span className="text-xs truncate font-medium">
                              {el.name || el.type.toUpperCase()}
                            </span>
                          </div>

                          {/* Layer visibility & lock toggles */}
                          <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleLock(el.id);
                              }}
                              className="p-1 rounded text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                              title={el.locked ? 'Unlock element' : 'Lock element'}
                            >
                              {el.locked ? <Lock size={12} className="text-amber-500" /> : <Unlock size={12} />}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleHide(el.id);
                              }}
                              className="p-1 rounded text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                              title={el.hidden ? 'Show element' : 'Hide element'}
                            >
                              {el.hidden ? <EyeOff size={12} className="text-red-500" /> : <Eye size={12} />}
                            </button>
                            
                            {/* Stacking controls */}
                            <div className="hidden group-hover:flex items-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onReorderElements(el.id, 'up');
                                }}
                                className="p-0.5 rounded text-zinc-400 hover:text-blue-600 cursor-pointer"
                                title="Bring Forward"
                              >
                                <ArrowUp size={11} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onReorderElements(el.id, 'down');
                                }}
                                className="p-0.5 rounded text-zinc-400 hover:text-blue-600 cursor-pointer"
                                title="Send Backward"
                              >
                                <ArrowDown size={11} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteElement(el.id);
                                }}
                                className="p-1 rounded text-zinc-400 hover:text-red-500 cursor-pointer"
                                title="Delete Item"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          );
        })()}

        {/* UI KIT & COMPONENTS TAB */}
        {activeTab === 'uikit' && (
          <div className="space-y-4">
            {/* Device Frames */}
            <div>
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-2">
                Device Mockup Frames
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => handleAddDevice('iphone')}
                  className="p-2 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 rounded-md bg-zinc-50 dark:bg-zinc-850 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-left transition-all cursor-pointer flex items-center gap-2"
                >
                  <Smartphone size={15} className="text-blue-600 dark:text-blue-400 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">iPhone 15</div>
                    <div className="text-[9px] text-zinc-400">360 × 720</div>
                  </div>
                </button>

                <button
                  onClick={() => handleAddDevice('browser')}
                  className="p-2 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 rounded-md bg-zinc-50 dark:bg-zinc-850 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-left transition-all cursor-pointer flex items-center gap-2"
                >
                  <Globe size={15} className="text-blue-600 dark:text-blue-400 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Browser</div>
                    <div className="text-[9px] text-zinc-400">860 × 560</div>
                  </div>
                </button>

                <button
                  onClick={() => handleAddDevice('ipad')}
                  className="p-2 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 rounded-md bg-zinc-50 dark:bg-zinc-850 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-left transition-all cursor-pointer flex items-center gap-2"
                >
                  <Tablet size={15} className="text-blue-600 dark:text-blue-400 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">iPad Pro</div>
                    <div className="text-[9px] text-zinc-400">720 × 540</div>
                  </div>
                </button>

                <button
                  onClick={() => handleAddDevice('terminal')}
                  className="p-2 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 rounded-md bg-zinc-50 dark:bg-zinc-850 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-left transition-all cursor-pointer flex items-center gap-2"
                >
                  <Terminal size={15} className="text-blue-600 dark:text-blue-400 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Terminal</div>
                    <div className="text-[9px] text-zinc-400">640 × 420</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Form & Actions */}
            <div>
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-2">
                UI Mockup Elements
              </span>
              <div className="space-y-1.5">
                <button
                  onClick={() => handleAddUIComponent('button-primary')}
                  className="w-full px-2.5 py-1.5 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 rounded-md bg-zinc-50 dark:bg-zinc-850 text-left transition-all cursor-pointer flex items-center justify-between text-xs font-medium text-zinc-800 dark:text-zinc-200"
                >
                  <span>Primary CTA Button</span>
                  <span className="text-[9px] bg-blue-600 text-white px-2 py-0.5 rounded font-semibold">Button</span>
                </button>

                <button
                  onClick={() => handleAddUIComponent('input-search')}
                  className="w-full px-2.5 py-1.5 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 rounded-md bg-zinc-50 dark:bg-zinc-850 text-left transition-all cursor-pointer flex items-center justify-between text-xs font-medium text-zinc-800 dark:text-zinc-200"
                >
                  <span className="flex items-center gap-1.5">
                    <Search size={12} className="text-zinc-400" />
                    Search Bar
                  </span>
                  <span className="text-[9px] text-zinc-400 font-mono">Input</span>
                </button>

                <button
                  onClick={() => handleAddUIComponent('input-text')}
                  className="w-full px-2.5 py-1.5 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 rounded-md bg-zinc-50 dark:bg-zinc-850 text-left transition-all cursor-pointer flex items-center justify-between text-xs font-medium text-zinc-800 dark:text-zinc-200"
                >
                  <span>Labeled Text Field</span>
                  <span className="text-[9px] text-zinc-400 font-mono">Field</span>
                </button>

                <button
                  onClick={() => handleAddUIComponent('toggle-switch')}
                  className="w-full px-2.5 py-1.5 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 rounded-md bg-zinc-50 dark:bg-zinc-850 text-left transition-all cursor-pointer flex items-center justify-between text-xs font-medium text-zinc-800 dark:text-zinc-200"
                >
                  <span className="flex items-center gap-1.5">
                    <ToggleLeft size={13} className="text-blue-500" />
                    Toggle Switch Row
                  </span>
                  <span className="text-[9px] text-zinc-400 font-mono">Toggle</span>
                </button>

                <button
                  onClick={() => handleAddUIComponent('metric-card')}
                  className="w-full px-2.5 py-1.5 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 rounded-md bg-zinc-50 dark:bg-zinc-850 text-left transition-all cursor-pointer flex items-center justify-between text-xs font-medium text-zinc-800 dark:text-zinc-200"
                >
                  <span className="flex items-center gap-1.5">
                    <CreditCard size={12} className="text-emerald-500" />
                    KPI Metric Stat Card
                  </span>
                  <span className="text-[9px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1 rounded font-bold">+18%</span>
                </button>

                <button
                  onClick={() => handleAddUIComponent('user-card')}
                  className="w-full px-2.5 py-1.5 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 rounded-md bg-zinc-50 dark:bg-zinc-850 text-left transition-all cursor-pointer flex items-center justify-between text-xs font-medium text-zinc-800 dark:text-zinc-200"
                >
                  <span className="flex items-center gap-1.5">
                    <User size={12} className="text-blue-500" />
                    User Profile Card
                  </span>
                  <span className="text-[9px] text-zinc-400 font-mono">Card</span>
                </button>

                <button
                  onClick={() => handleAddUIComponent('alert-banner')}
                  className="w-full px-2.5 py-1.5 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 rounded-md bg-zinc-50 dark:bg-zinc-850 text-left transition-all cursor-pointer flex items-center justify-between text-xs font-medium text-zinc-800 dark:text-zinc-200"
                >
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle size={12} className="text-amber-500" />
                    Notification Alert Banner
                  </span>
                  <span className="text-[9px] text-zinc-400 font-mono">Banner</span>
                </button>
              </div>
            </div>

            {/* Guide & Annotations */}
            <div>
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-2">
                Guide & Annotations
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => handleAddAnnotation('step')}
                  className="p-2 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 rounded-md bg-zinc-50 dark:bg-zinc-850 text-left transition-all cursor-pointer flex items-center gap-2"
                >
                  <ListOrdered size={14} className="text-blue-600" />
                  <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">Step Marker</span>
                </button>

                <button
                  onClick={() => handleAddAnnotation('callout')}
                  className="p-2 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 rounded-md bg-zinc-50 dark:bg-zinc-850 text-left transition-all cursor-pointer flex items-center gap-2"
                >
                  <MessageSquare size={14} className="text-blue-600" />
                  <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">Callout Bubble</span>
                </button>

                <button
                  onClick={() => handleAddAnnotation('sticky')}
                  className="p-2 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 rounded-md bg-zinc-50 dark:bg-zinc-850 text-left transition-all cursor-pointer flex items-center gap-2"
                >
                  <StickyNote size={14} className="text-amber-500" />
                  <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">Sticky Note</span>
                </button>

                <button
                  onClick={() => handleAddAnnotation('hotspot')}
                  className="p-2 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 rounded-md bg-zinc-50 dark:bg-zinc-850 text-left transition-all cursor-pointer flex items-center gap-2"
                >
                  <Radio size={14} className="text-blue-600" />
                  <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">Pulse Hotspot</span>
                </button>

                <button
                  onClick={() => handleAddAnnotation('keycap')}
                  className="p-2 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 rounded-md bg-zinc-50 dark:bg-zinc-850 text-left transition-all cursor-pointer flex items-center gap-2 col-span-2"
                >
                  <Command size={14} className="text-zinc-600 dark:text-zinc-400" />
                  <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">Keyboard Shortcut Badge</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ASSETS TAB */}
        {activeTab === 'assets' && (
          <div className="space-y-4">
            <span className="text-xs font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-wider block">
              Asset Gallery & Upload
            </span>

            {/* Upload Zone */}
            <label className="flex flex-col items-center justify-center p-4 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800/30 cursor-pointer transition-all">
              <Upload size={20} className="text-zinc-400 dark:text-zinc-500 mb-1.5" />
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Upload Image File</span>
              <span className="text-[10px] text-zinc-400 mt-0.5">PNG, JPG, SVG up to 5MB</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {/* Library list */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-zinc-500">Preset Library</div>
              <div className="grid grid-cols-2 gap-2">
                {sampleLibrary.map((item, i) => (
                  <div
                    key={i}
                    onClick={() => onUploadImage(item.url)}
                    className="group relative cursor-pointer border border-zinc-100 dark:border-zinc-800 rounded-md overflow-hidden hover:border-blue-500 transition-all aspect-video bg-zinc-100"
                  >
                    <img
                      src={item.url}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="text-[10px] text-white font-semibold">Place to canvas</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
