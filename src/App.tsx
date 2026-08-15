import React, { useState, useEffect, useRef } from 'react';
import { Project, Page, CanvasElement, ToolType, Point } from './types';
import { loadTemplate } from './templates';
import {
  groupElements,
  ungroupElements,
  toggleGroupLock,
  toggleGroupHide,
  renameGroup,
  setGroupOpacity,
} from './utils/groupUtils';
import Header from './components/Header';
import Toolbar from './components/Toolbar';
import SidebarLeft from './components/SidebarLeft';
import SidebarRight from './components/SidebarRight';
import Canvas from './components/Canvas';
import StatusBar from './components/StatusBar';
import PreviewPlayer from './components/PreviewPlayer';

const LOCAL_STORAGE_KEY = 'mockup_creator_project_draft';

export default function App() {
  // Theme state
  const [isDark, setIsDark] = useState<boolean>(false);

  // Core project state
  const [project, setProject] = useState<Project>(() => {
    // Attempt local storage restore
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.pages && parsed.pages.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not restore project draft', e);
    }
    // Fallback to onboarding template
    return loadTemplate('onboarding');
  });

  const [activePageId, setActivePageId] = useState<string>(() => {
    return project.pages[0]?.id || 'page-1';
  });

  // Editor states
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  const [unsavedChanges, setUnsavedChanges] = useState<boolean>(false);

  // Canvas status report states
  const [cursorPos, setCursorPos] = useState<Point>({ x: 0, y: 0 });
  const [zoomPercent, setZoomPercent] = useState<number>(80);

  // Undo/Redo history stacks
  const [undoStack, setUndoStack] = useState<Project[]>([]);
  const [redoStack, setRedoStack] = useState<Project[]>([]);

  // Toast notifications state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Trigger toast
  const triggerToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Synchronize theme on load
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  // Project state mutation helper (for Undo / Redo registration)
  const pushState = (newProject: Project) => {
    setUndoStack((prev) => [...prev, project]);
    setRedoStack([]); // Clear redo
    setProject(newProject);
    setUnsavedChanges(true);
  };

  // Undo action trigger
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, project]);
    setProject(previous);
    triggerToast('Undo action', 'info');
  };

  // Redo action trigger
  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, project]);
    setProject(next);
    triggerToast('Redo action', 'info');
  };

  // Auto-Save background worker (every 30 seconds as per spec)
  useEffect(() => {
    const interval = setInterval(() => {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(project));
      setUnsavedChanges(false);
    }, 30000);
    return () => clearInterval(interval);
  }, [project]);

  // Manual save trigger
  const handleSaveProject = () => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(project));
    setUnsavedChanges(false);
    triggerToast('Project draft saved successfully!');
  };

  // Page level updates
  const handleUpdatePage = (updates: Partial<Page>) => {
    const updatedPages = project.pages.map((p) => {
      if (p.id === activePageId) {
        return { ...p, ...updates };
      }
      return p;
    });
    pushState({
      ...project,
      pages: updatedPages,
      updatedAt: new Date().toISOString(),
    });
  };

  // Create page
  const handleAddPage = () => {
    const newPageId = `page-${Date.now()}`;
    const newPage: Page = {
      id: newPageId,
      name: `Page ${project.pages.length + 1}`,
      width: 1200,
      height: 800,
      backgroundColor: '#FFFFFF',
      elements: [],
    };
    pushState({
      ...project,
      pages: [...project.pages, newPage],
      updatedAt: new Date().toISOString(),
    });
    setActivePageId(newPageId);
    setSelectedElementIds([]);
    triggerToast('Created blank page');
  };

  // Duplicate page
  const handleDuplicatePage = (id: string) => {
    const original = project.pages.find((p) => p.id === id);
    if (!original) return;

    const dupPageId = `page-${Date.now()}`;
    const duplicate: Page = {
      ...original,
      id: dupPageId,
      name: `${original.name} Copy`,
      isCover: false,
      elements: original.elements.map((el) => ({
        ...el,
        id: `el-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      })),
    };

    pushState({
      ...project,
      pages: [...project.pages, duplicate],
      updatedAt: new Date().toISOString(),
    });
    setActivePageId(dupPageId);
    triggerToast('Duplicated page layout');
  };

  // Delete page
  const handleDeletePage = (id: string) => {
    if (project.pages.length <= 1) return;
    const updatedPages = project.pages.filter((p) => p.id !== id);
    
    pushState({
      ...project,
      pages: updatedPages,
      updatedAt: new Date().toISOString(),
    });

    // Reset focus to the first available page
    setActivePageId(updatedPages[0].id);
    setSelectedElementIds([]);
    triggerToast('Deleted page', 'info');
  };

  // Rename page
  const handleRenamePage = (id: string, name: string) => {
    const updatedPages = project.pages.map((p) => {
      if (p.id === id) {
        return { ...p, name };
      }
      return p;
    });
    pushState({
      ...project,
      pages: updatedPages,
      updatedAt: new Date().toISOString(),
    });
  };

  // Set page as project cover
  const handleSetAsCover = (id: string) => {
    const updatedPages = project.pages.map((p) => ({
      ...p,
      isCover: p.id === id,
    }));
    pushState({
      ...project,
      pages: updatedPages,
      updatedAt: new Date().toISOString(),
    });
    triggerToast('Cover thumbnail updated', 'info');
  };

  // Shift page ordering index
  const handleReorderPages = (fromIndex: number, toIndex: number) => {
    const nextPages = [...project.pages];
    const [moved] = nextPages.splice(fromIndex, 1);
    nextPages.splice(toIndex, 0, moved);

    pushState({
      ...project,
      pages: nextPages,
      updatedAt: new Date().toISOString(),
    });
  };

  // Rename Project & description metadata
  const handleRenameProject = (name: string, description: string) => {
    pushState({
      ...project,
      name,
      description,
      updatedAt: new Date().toISOString(),
    });
    triggerToast('Project details updated');
  };

  // Canvas element update handler
  const handleUpdateElement = (id: string, updates: Partial<CanvasElement>) => {
    const activePage = project.pages.find((p) => p.id === activePageId);
    if (!activePage) return;

    const updatedElements = activePage.elements.map((el) => {
      if (el.id === id) {
        return { ...el, ...updates } as CanvasElement;
      }
      return el;
    });

    const updatedPages = project.pages.map((p) => {
      if (p.id === activePageId) {
        return { ...p, elements: updatedElements };
      }
      return p;
    });

    setProject({
      ...project,
      pages: updatedPages,
      updatedAt: new Date().toISOString(),
    });
    setUnsavedChanges(true);
  };

  // Canvas element add handler
  const handleAddElement = (element: CanvasElement) => {
    const activePage = project.pages.find((p) => p.id === activePageId);
    if (!activePage) return;

    const updatedPages = project.pages.map((p) => {
      if (p.id === activePageId) {
        return { ...p, elements: [...p.elements, element] };
      }
      return p;
    });

    pushState({
      ...project,
      pages: updatedPages,
      updatedAt: new Date().toISOString(),
    });
  };

  // Canvas element delete handler
  const handleDeleteElement = (id: string) => {
    const activePage = project.pages.find((p) => p.id === activePageId);
    if (!activePage) return;

    const updatedElements = activePage.elements.filter((el) => el.id !== id);
    const updatedPages = project.pages.map((p) => {
      if (p.id === activePageId) {
        return { ...p, elements: updatedElements };
      }
      return p;
    });

    pushState({
      ...project,
      pages: updatedPages,
      updatedAt: new Date().toISOString(),
    });
    setSelectedElementIds((prev) => prev.filter((item) => item !== id));
  };

  // Group operations
  const handleGroupElements = () => {
    const activePage = project.pages.find((p) => p.id === activePageId);
    if (!activePage || selectedElementIds.length <= 1) return;

    const updatedElements = groupElements(activePage.elements, selectedElementIds);
    const updatedPages = project.pages.map((p) => {
      if (p.id === activePageId) {
        return { ...p, elements: updatedElements };
      }
      return p;
    });

    pushState({
      ...project,
      pages: updatedPages,
      updatedAt: new Date().toISOString(),
    });
    triggerToast(`Grouped ${selectedElementIds.length} elements`);
  };

  const handleUngroupElements = () => {
    const activePage = project.pages.find((p) => p.id === activePageId);
    if (!activePage || selectedElementIds.length === 0) return;

    const updatedElements = ungroupElements(activePage.elements, selectedElementIds);
    const updatedPages = project.pages.map((p) => {
      if (p.id === activePageId) {
        return { ...p, elements: updatedElements };
      }
      return p;
    });

    pushState({
      ...project,
      pages: updatedPages,
      updatedAt: new Date().toISOString(),
    });
    triggerToast('Ungrouped elements');
  };

  const handleToggleGroupLock = (groupId: string) => {
    const activePage = project.pages.find((p) => p.id === activePageId);
    if (!activePage) return;

    const updatedElements = toggleGroupLock(activePage.elements, groupId);
    const updatedPages = project.pages.map((p) => {
      if (p.id === activePageId) {
        return { ...p, elements: updatedElements };
      }
      return p;
    });

    pushState({
      ...project,
      pages: updatedPages,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleToggleGroupHide = (groupId: string) => {
    const activePage = project.pages.find((p) => p.id === activePageId);
    if (!activePage) return;

    const updatedElements = toggleGroupHide(activePage.elements, groupId);
    const updatedPages = project.pages.map((p) => {
      if (p.id === activePageId) {
        return { ...p, elements: updatedElements };
      }
      return p;
    });

    pushState({
      ...project,
      pages: updatedPages,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleRenameGroup = (groupId: string, name: string) => {
    const activePage = project.pages.find((p) => p.id === activePageId);
    if (!activePage) return;

    const updatedElements = renameGroup(activePage.elements, groupId, name);
    const updatedPages = project.pages.map((p) => {
      if (p.id === activePageId) {
        return { ...p, elements: updatedElements };
      }
      return p;
    });

    setProject({
      ...project,
      pages: updatedPages,
      updatedAt: new Date().toISOString(),
    });
    setUnsavedChanges(true);
  };

  const handleSetGroupOpacity = (groupId: string, opacity: number) => {
    const activePage = project.pages.find((p) => p.id === activePageId);
    if (!activePage) return;

    const updatedElements = setGroupOpacity(activePage.elements, groupId, opacity);
    const updatedPages = project.pages.map((p) => {
      if (p.id === activePageId) {
        return { ...p, elements: updatedElements };
      }
      return p;
    });

    setProject({
      ...project,
      pages: updatedPages,
      updatedAt: new Date().toISOString(),
    });
    setUnsavedChanges(true);
  };

  const handleSelectGroup = (groupId: string, shiftKey: boolean) => {
    const activePage = project.pages.find((p) => p.id === activePageId);
    if (!activePage) return;

    const groupElementIds = activePage.elements
      .filter((el) => el.groupId === groupId)
      .map((el) => el.id);

    if (shiftKey) {
      const allSelected = groupElementIds.every((id) => selectedElementIds.includes(id));
      if (allSelected) {
        setSelectedElementIds(selectedElementIds.filter((id) => !groupElementIds.includes(id)));
      } else {
        setSelectedElementIds(Array.from(new Set([...selectedElementIds, ...groupElementIds])));
      }
    } else {
      setSelectedElementIds(groupElementIds);
    }
  };

  const handleDeleteGroup = (groupId: string) => {
    const activePage = project.pages.find((p) => p.id === activePageId);
    if (!activePage) return;

    const updatedElements = activePage.elements.filter((el) => el.groupId !== groupId);
    const updatedPages = project.pages.map((p) => {
      if (p.id === activePageId) {
        return { ...p, elements: updatedElements };
      }
      return p;
    });

    pushState({
      ...project,
      pages: updatedPages,
      updatedAt: new Date().toISOString(),
    });
    setSelectedElementIds((prev) =>
      prev.filter((id) => {
        const el = activePage.elements.find((e) => e.id === id);
        return el?.groupId !== groupId;
      })
    );
    triggerToast('Deleted group');
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      // 1. Delete element hotkey
      if (e.key === 'Delete' || e.key === 'Backspace') {
        selectedElementIds.forEach((id) => handleDeleteElement(id));
      }

      // 2. Duplicate element: Ctrl+D
      if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        const activePage = project.pages.find((p) => p.id === activePageId);
        if (!activePage) return;

        const newDups: CanvasElement[] = [];
        selectedElementIds.forEach((id) => {
          const match = activePage.elements.find((el) => el.id === id);
          if (match) {
            const copyId = `el-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
            newDups.push({
              ...match,
              id: copyId,
              name: `${match.name} Copy`,
              x: match.x + 20, // Offset duplicates by 20px as per spec
              y: match.y + 20,
              zIndex: activePage.elements.length + newDups.length + 1,
            } as CanvasElement);
          }
        });

        if (newDups.length > 0) {
          const updatedPages = project.pages.map((p) => {
            if (p.id === activePageId) {
              return { ...p, elements: [...p.elements, ...newDups] };
            }
            return p;
          });
          pushState({ ...project, pages: updatedPages });
          setSelectedElementIds(newDups.map((d) => d.id));
          triggerToast(`Duplicated ${newDups.length} item(s)`);
        }
      }

      // 3. Group: Ctrl+G / Ungroup: Ctrl+Shift+G
      if ((e.ctrlKey || e.metaKey) && (e.key === 'g' || e.key === 'G')) {
        e.preventDefault();
        if (e.shiftKey) {
          handleUngroupElements();
        } else {
          handleGroupElements();
        }
      }

      // 4. Save: Ctrl+S
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        handleSaveProject();
      }

      // 5. Undo: Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }

      // 6. Redo: Ctrl+Shift+Z or Ctrl+Y
      if (((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) || ((e.ctrlKey || e.metaKey) && e.key === 'y')) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementIds, project, activePageId]);

  // Select layer list element trigger
  const handleSelectElement = (id: string, shiftKey: boolean) => {
    if (shiftKey) {
      if (selectedElementIds.includes(id)) {
        setSelectedElementIds(selectedElementIds.filter((item) => item !== id));
      } else {
        setSelectedElementIds([...selectedElementIds, id]);
      }
    } else {
      setSelectedElementIds([id]);
    }
  };

  // Lock layer toggle
  const handleToggleLock = (id: string) => {
    const activePage = project.pages.find((p) => p.id === activePageId);
    const match = activePage?.elements.find((el) => el.id === id);
    if (match) {
      handleUpdateElement(id, { locked: !match.locked });
      triggerToast(match.locked ? 'Layer unlocked' : 'Layer locked', 'info');
    }
  };

  // Hide layer toggle
  const handleToggleHide = (id: string) => {
    const activePage = project.pages.find((p) => p.id === activePageId);
    const match = activePage?.elements.find((el) => el.id === id);
    if (match) {
      handleUpdateElement(id, { hidden: !match.hidden });
    }
  };

  // Shift layer index bounds
  const handleReorderElements = (id: string, direction: 'up' | 'down' | 'front' | 'back') => {
    const activePage = project.pages.find((p) => p.id === activePageId);
    if (!activePage) return;

    const elements = [...activePage.elements];
    const index = elements.findIndex((el) => el.id === id);
    if (index === -1) return;

    if (direction === 'up' && index < elements.length - 1) {
      const temp = elements[index].zIndex;
      elements[index].zIndex = elements[index + 1].zIndex;
      elements[index + 1].zIndex = temp;
    } else if (direction === 'down' && index > 0) {
      const temp = elements[index].zIndex;
      elements[index].zIndex = elements[index - 1].zIndex;
      elements[index - 1].zIndex = temp;
    }

    const sorted = elements.sort((a, b) => a.zIndex - b.zIndex);
    const reindexed = sorted.map((el, i) => ({ ...el, zIndex: i + 1 }));

    const updatedPages = project.pages.map((p) => {
      if (p.id === activePageId) {
        return { ...p, elements: reindexed as CanvasElement[] };
      }
      return p;
    });

    pushState({
      ...project,
      pages: updatedPages,
      updatedAt: new Date().toISOString(),
    });
  };

  // Alignment & Distribution handler
  const handleAlignElements = (type: any) => {
    const activePage = project.pages.find((p) => p.id === activePageId);
    if (!activePage || selectedElementIds.length === 0) return;

    const targets = activePage.elements.filter((el) => selectedElementIds.includes(el.id));
    if (targets.length === 0) return;

    let updatedElements = [...activePage.elements];

    if (targets.length === 1) {
      // Align relative to page canvas bounds
      const el = targets[0];
      let nx = el.x;
      let ny = el.y;
      if (type === 'left') nx = 0;
      if (type === 'center') nx = (activePage.width - el.width) / 2;
      if (type === 'right') nx = activePage.width - el.width;
      if (type === 'top') ny = 0;
      if (type === 'middle') ny = (activePage.height - el.height) / 2;
      if (type === 'bottom') ny = activePage.height - el.height;

      updatedElements = updatedElements.map((item) => (item.id === el.id ? { ...item, x: nx, y: ny } : item));
    } else {
      // Multi-element alignment relative to selection bounding box
      const minX = Math.min(...targets.map((t) => t.x));
      const maxX = Math.max(...targets.map((t) => t.x + t.width));
      const minY = Math.min(...targets.map((t) => t.y));
      const maxY = Math.max(...targets.map((t) => t.y + t.height));

      if (type === 'left') {
        updatedElements = updatedElements.map((item) => (selectedElementIds.includes(item.id) ? { ...item, x: minX } : item));
      } else if (type === 'right') {
        updatedElements = updatedElements.map((item) => (selectedElementIds.includes(item.id) ? { ...item, x: maxX - item.width } : item));
      } else if (type === 'center') {
        const midX = minX + (maxX - minX) / 2;
        updatedElements = updatedElements.map((item) => (selectedElementIds.includes(item.id) ? { ...item, x: midX - item.width / 2 } : item));
      } else if (type === 'top') {
        updatedElements = updatedElements.map((item) => (selectedElementIds.includes(item.id) ? { ...item, y: minY } : item));
      } else if (type === 'bottom') {
        updatedElements = updatedElements.map((item) => (selectedElementIds.includes(item.id) ? { ...item, y: maxY - item.height } : item));
      } else if (type === 'middle') {
        const midY = minY + (maxY - minY) / 2;
        updatedElements = updatedElements.map((item) => (selectedElementIds.includes(item.id) ? { ...item, y: midY - item.height / 2 } : item));
      } else if (type === 'distribute-h') {
        const sorted = [...targets].sort((a, b) => a.x - b.x);
        const totalW = sorted.reduce((sum, el) => sum + el.width, 0);
        const gap = (maxX - minX - totalW) / (sorted.length - 1 || 1);
        let currX = minX;
        const newPos: { [id: string]: number } = {};
        sorted.forEach((item) => {
          newPos[item.id] = currX;
          currX += item.width + gap;
        });
        updatedElements = updatedElements.map((item) => (newPos[item.id] !== undefined ? { ...item, x: newPos[item.id] } : item));
      } else if (type === 'distribute-v') {
        const sorted = [...targets].sort((a, b) => a.y - b.y);
        const totalH = sorted.reduce((sum, el) => sum + el.height, 0);
        const gap = (maxY - minY - totalH) / (sorted.length - 1 || 1);
        let currY = minY;
        const newPos: { [id: string]: number } = {};
        sorted.forEach((item) => {
          newPos[item.id] = currY;
          currY += item.height + gap;
        });
        updatedElements = updatedElements.map((item) => (newPos[item.id] !== undefined ? { ...item, y: newPos[item.id] } : item));
      }
    }

    const updatedPages = project.pages.map((p) => {
      if (p.id === activePageId) {
        return { ...p, elements: updatedElements as CanvasElement[] };
      }
      return p;
    });

    pushState({
      ...project,
      pages: updatedPages,
      updatedAt: new Date().toISOString(),
    });
    triggerToast(`Aligned elements (${type})`);
  };

  // Load predefined system templates
  const handleLoadTemplate = (id: any) => {
    const loaded = loadTemplate(id);
    pushState(loaded);
    setActivePageId(loaded.pages[0].id);
    setSelectedElementIds([]);
    triggerToast(`Loaded "${loaded.name}" preset`);
  };

  // Asset custom media upload trigger placement
  const handleUploadImage = (base64Url: string) => {
    const imageId = `img-${Date.now()}`;
    const newImage: CanvasElement = {
      id: imageId,
      type: 'image',
      name: 'Custom Asset Image',
      x: 100,
      y: 100,
      width: 400,
      height: 250,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
      zIndex: (project.pages.find((p) => p.id === activePageId)?.elements.length || 0) + 1,
      url: base64Url,
      brightness: 100,
      contrast: 100,
      saturation: 100,
      blur: 0,
      grayscale: 0,
    };
    handleAddElement(newImage);
    setSelectedElementIds([imageId]);
    triggerToast('Custom image placed on canvas');
  };

  // Download project guide file serialization (.guide JSON)
  const handleExportProject = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(project));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `${project.name.toLowerCase().replace(/\s+/g, '_')}.guide`);
    dlAnchorElem.click();
    triggerToast('Exported .guide project file');
  };

  // Import JSON project payload
  const handleImportProject = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed && parsed.name && parsed.pages) {
        pushState(parsed);
        setActivePageId(parsed.pages[0].id);
        setSelectedElementIds([]);
        triggerToast('Guide project imported successfully!');
      } else {
        triggerToast('Invalid file scheme. Must match .guide standard.', 'error');
      }
    } catch (e) {
      triggerToast('Error reading file payload.', 'error');
    }
  };

  // Client-Side Export drivers: SVG markup generator
  const handleExportSVG = () => {
    const activePage = project.pages.find((p) => p.id === activePageId);
    if (!activePage) return;

    // Build vector shapes elements lists
    let svgContent = '';
    activePage.elements.forEach((el) => {
      if (el.hidden) return;
      if (el.type === 'rectangle') {
        svgContent += `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" fill="${(el as any).fillColor}" stroke="${(el as any).strokeColor}" stroke-width="${(el as any).strokeWidth}" rx="${(el as any).cornerRadius || 0}" />\n`;
      } else if (el.type === 'circle') {
        svgContent += `<ellipse cx="${el.x + el.width / 2}" cy="${el.y + el.height / 2}" rx="${el.width / 2}" ry="${el.height / 2}" fill="${(el as any).fillColor}" stroke="${(el as any).strokeColor}" stroke-width="${(el as any).strokeWidth}" />\n`;
      } else if (el.type === 'text') {
        svgContent += `<text x="${el.x}" y="${el.y + 15}" font-family="${(el as any).fontFamily || 'Inter'}" font-size="${(el as any).fontSize || 14}px" fill="${(el as any).fontColor || '#000000'}">${el.text}</text>\n`;
      } else if (el.type === 'image') {
        svgContent += `<image href="${(el as any).url}" x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" />\n`;
      } else if (el.type === 'sticky') {
        svgContent += `<g><rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" fill="#FEF08A" stroke="#FDE047" /><text x="${el.x + 10}" y="${el.y + 20}" font-family="monospace" font-size="12px">${el.text}</text></g>\n`;
      }
    });

    const fullSVG = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${activePage.width} ${activePage.height}" width="${activePage.width}" height="${activePage.height}">
        <rect width="${activePage.width}" height="${activePage.height}" fill="${activePage.backgroundColor}" />
        ${svgContent}
      </svg>
    `;

    const blob = new Blob([fullSVG], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activePage.name.toLowerCase().replace(/\s+/g, '_')}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    triggerToast('Vector exported (SVG)');
  };

  // Client-Side Export drivers: Draw elements to high-res canvas scaling
  const handleExportPNG = (scale: number, transparent: boolean) => {
    const activePage = project.pages.find((p) => p.id === activePageId);
    if (!activePage) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = activePage.width * scale;
    tempCanvas.height = activePage.height * scale;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return;

    // Set scale factors
    ctx.scale(scale, scale);

    // Canvas background fill
    if (!transparent) {
      ctx.fillStyle = activePage.backgroundColor;
      ctx.fillRect(0, 0, activePage.width, activePage.height);
    }

    // Render layers sequentially (zIndex sorted)
    const elementsToDraw = [...activePage.elements].sort((a, b) => a.zIndex - b.zIndex);

    elementsToDraw.forEach((el) => {
      if (el.hidden) return;

      ctx.save();
      ctx.globalAlpha = el.opacity ?? 1;

      // Handle rotation offsets
      if (el.rotation) {
        ctx.translate(el.x + el.width / 2, el.y + el.height / 2);
        ctx.rotate((el.rotation * Math.PI) / 180);
        ctx.translate(-(el.x + el.width / 2), -(el.y + el.height / 2));
      }

      if (el.type === 'rectangle') {
        ctx.fillStyle = (el as any).fillColor;
        ctx.strokeStyle = (el as any).strokeColor;
        ctx.lineWidth = (el as any).strokeWidth;
        
        // draw rounded rectangle
        const r = (el as any).cornerRadius || 0;
        if (r > 0) {
          ctx.beginPath();
          ctx.roundRect(el.x, el.y, el.width, el.height, r);
          ctx.fill();
          if ((el as any).strokeWidth > 0) ctx.stroke();
        } else {
          ctx.fillRect(el.x, el.y, el.width, el.height);
          if ((el as any).strokeWidth > 0) ctx.strokeRect(el.x, el.y, el.width, el.height);
        }
      } else if (el.type === 'circle') {
        ctx.fillStyle = (el as any).fillColor;
        ctx.strokeStyle = (el as any).strokeColor;
        ctx.lineWidth = (el as any).strokeWidth;

        ctx.beginPath();
        ctx.ellipse(
          el.x + el.width / 2,
          el.y + el.height / 2,
          el.width / 2,
          el.height / 2,
          0,
          0,
          2 * Math.PI
        );
        ctx.fill();
        if ((el as any).strokeWidth > 0) ctx.stroke();
      } else if (el.type === 'text') {
        ctx.fillStyle = (el as any).fontColor;
        ctx.font = `${(el as any).fontWeight || 'normal'} ${(el as any).fontSize}px ${(el as any).fontFamily || 'sans-serif'}`;
        ctx.textBaseline = 'top';
        ctx.fillText(el.text, el.x, el.y);
      } else if (el.type === 'image') {
        const imgObj = new Image();
        imgObj.crossOrigin = 'anonymous';
        imgObj.src = (el as any).url;
        // Synchronous draw since images might not have loaded locally, drawing a wireframe container instead to prevent missing assets
        ctx.fillStyle = '#CBD5E1';
        ctx.fillRect(el.x, el.y, el.width, el.height);
        ctx.fillStyle = '#334155';
        ctx.font = '10px sans-serif';
        ctx.fillText('[Raster Asset Overlay]', el.x + 10, el.y + 10);
      } else if (el.type === 'sticky') {
        ctx.fillStyle =
          (el as any).color === 'yellow'
            ? '#FEF08A'
            : (el as any).color === 'blue'
            ? '#BFDBFE'
            : (el as any).color === 'pink'
            ? '#FBCFE8'
            : '#BBF7D0';
        ctx.fillRect(el.x, el.y, el.width, el.height);
        ctx.fillStyle = '#1E293B';
        ctx.font = '11px sans-serif';
        ctx.fillText(el.text, el.x + 8, el.y + 8);
      } else if (el.type === 'callout') {
        ctx.fillStyle = (el as any).backgroundColor || '#4F46E5';
        ctx.fillRect(el.x, el.y, el.width, el.height);
        ctx.fillStyle = (el as any).textColor || '#FFFFFF';
        ctx.font = '11px sans-serif';
        ctx.fillText(el.text, el.x + 8, el.y + 8);
      }

      ctx.restore();
    });

    // Trigger PNG download file blob
    try {
      tempCanvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${activePage.name.toLowerCase().replace(/\s+/g, '_')}_${scale}x.png`;
          a.click();
          URL.revokeObjectURL(url);
          triggerToast(`Mockup page exported (${scale}x PNG)`);
        }
      }, 'image/png');
    } catch (e) {
      // CORS fallback trigger
      const dataUrl = tempCanvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${activePage.name.toLowerCase().replace(/\s+/g, '_')}_${scale}x.png`;
      a.click();
      triggerToast('Exported page snapshot');
    }
  };

  const activePage = project.pages.find((p) => p.id === activePageId) || project.pages[0];
  const selectedElements = activePage.elements.filter((el) => selectedElementIds.includes(el.id));

  return (
    <div className={`flex flex-col h-screen overflow-hidden ${isDark ? 'dark' : ''} bg-zinc-50 dark:bg-zinc-950 font-sans`}>
      {/* Toast alert overlay panel */}
      {toast && (
        <div className="fixed top-18 right-6 z-55 bg-zinc-900 border border-zinc-800 text-white rounded-md px-4 py-3 shadow-2xl flex items-center gap-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Primary header bar */}
      <Header
        project={project}
        onRenameProject={handleRenameProject}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onSave={handleSaveProject}
        onExportProject={handleExportProject}
        onImportProject={handleImportProject}
        onLoadTemplate={handleLoadTemplate}
        previewMode={previewMode}
        setPreviewMode={setPreviewMode}
        isDark={isDark}
        setIsDark={setIsDark}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
      />

      {/* Main interface body panels */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        <Toolbar
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          onAddSampleImage={() => handleUploadImage('https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80')}
          onAddDeviceFrame={(type) => {
            const elId = `df-${Date.now()}`;
            handleAddElement({
              id: elId,
              type: 'device-frame',
              name: `${type.toUpperCase()} frame`,
              x: 100,
              y: 100,
              width: type === 'iphone' ? 320 : type === 'ipad' ? 580 : 800,
              height: type === 'iphone' ? 650 : type === 'ipad' ? 440 : 500,
              rotation: 0,
              opacity: 1,
              locked: false,
              hidden: false,
              zIndex: activePage.elements.length + 1,
              deviceType: type,
              backgroundColor: '#FFFFFF',
              orientation: 'portrait',
            });
            setSelectedElementIds([elId]);
          }}
        />

        {/* Left Navigator (Pages & Stack outline list) */}
        <SidebarLeft
          project={project}
          activePageId={activePageId}
          setActivePageId={setActivePageId}
          onAddPage={handleAddPage}
          onDuplicatePage={handleDuplicatePage}
          onDeletePage={handleDeletePage}
          onRenamePage={handleRenamePage}
          onReorderPages={handleReorderPages}
          onSetAsCover={handleSetAsCover}
          elements={activePage.elements}
          selectedElementIds={selectedElementIds}
          onSelectElement={handleSelectElement}
          onToggleLock={handleToggleLock}
          onToggleHide={handleToggleHide}
          onDeleteElement={handleDeleteElement}
          onReorderElements={handleReorderElements}
          onGroupElements={handleGroupElements}
          onUngroupElements={handleUngroupElements}
          onToggleGroupLock={handleToggleGroupLock}
          onToggleGroupHide={handleToggleGroupHide}
          onRenameGroup={handleRenameGroup}
          onSelectGroup={handleSelectGroup}
          onDeleteGroup={handleDeleteGroup}
          onUploadImage={handleUploadImage}
          onAddElement={handleAddElement}
        />

        {/* Center Designer Arena stage canvas */}
        <Canvas
          page={activePage}
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          selectedElementIds={selectedElementIds}
          setSelectedElementIds={setSelectedElementIds}
          onUpdateElement={handleUpdateElement}
          onAddElement={handleAddElement}
          onDeleteElement={handleDeleteElement}
          onGroupElements={handleGroupElements}
          onUngroupElements={handleUngroupElements}
          onToggleLock={handleToggleLock}
          onToggleHide={handleToggleHide}
          setCursorPos={setCursorPos}
          setZoomPercent={setZoomPercent}
          zoomPercent={zoomPercent}
        />

        {/* Right contextual properties inspector */}
        <SidebarRight
          selectedElements={selectedElements}
          activePage={activePage}
          project={project}
          onUpdateElement={handleUpdateElement}
          onUpdatePage={handleUpdatePage}
          onAlignElements={handleAlignElements}
          onGroupElements={handleGroupElements}
          onUngroupElements={handleUngroupElements}
          onToggleGroupLock={handleToggleGroupLock}
          onToggleGroupHide={handleToggleGroupHide}
          onRenameGroup={handleRenameGroup}
          onSetGroupOpacity={handleSetGroupOpacity}
          onExportPNG={handleExportPNG}
          onExportSVG={handleExportSVG}
        />
      </div>

      {/* Footer bar statistics */}
      <StatusBar
        currentPageIndex={project.pages.findIndex((p) => p.id === activePageId)}
        totalPagesCount={project.pages.length}
        cursorPos={cursorPos}
        selectedCount={selectedElementIds.length}
        zoomPercent={zoomPercent}
        unsavedChanges={unsavedChanges}
      />

      {/* Presentation slide overlays */}
      {previewMode && (
        <PreviewPlayer
          project={project}
          activePageId={activePageId}
          setActivePageId={setActivePageId}
          onClose={() => setPreviewMode(false)}
        />
      )}
    </div>
  );
}
