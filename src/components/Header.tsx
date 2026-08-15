import React, { useState } from 'react';
import {
  FileCode,
  Play,
  RotateCcw,
  RotateCw,
  Save,
  FilePlus,
  Moon,
  Sun,
  Download,
  FolderOpen,
  Layout,
  BookOpen,
} from 'lucide-react';
import { Project } from '../types';

interface HeaderProps {
  project: Project;
  onRenameProject: (name: string, description: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onExportProject: () => void;
  onImportProject: (jsonStr: string) => void;
  onLoadTemplate: (id: 'onboarding' | 'dashboard' | 'blank') => void;
  previewMode: boolean;
  setPreviewMode: (val: boolean) => void;
  isDark: boolean;
  setIsDark: (val: boolean) => void;
  canUndo: boolean;
  canRedo: boolean;
}

export default function Header({
  project,
  onRenameProject,
  onUndo,
  onRedo,
  onSave,
  onExportProject,
  onImportProject,
  onLoadTemplate,
  previewMode,
  setPreviewMode,
  isDark,
  setIsDark,
  canUndo,
  canRedo,
}: HeaderProps) {
  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [projName, setProjName] = useState(project.name);
  const [projDesc, setProjDesc] = useState(project.description);

  const triggerImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.guide,.json';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          if (evt.target?.result && typeof evt.target.result === 'string') {
            onImportProject(evt.target.result);
          }
        };
        reader.readAsText(file);
      };
    };
    input.click();
  };

  const handleSaveMeta = () => {
    onRenameProject(projName, projDesc);
    setIsEditingMeta(false);
  };

  return (
    <header className="h-14 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 shrink-0 select-none z-30 shadow-sm">
      {/* Brand & Project metadata */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-xs">
          A
        </div>

        <div className="flex flex-col">
          {isEditingMeta ? (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={projName}
                onChange={(e) => setProjName(e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-800 border border-blue-500 rounded px-1.5 py-0.5 text-xs font-bold outline-none"
                autoFocus
              />
              <button
                onClick={handleSaveMeta}
                className="bg-blue-600 text-white rounded px-2 py-0.5 text-[10px] font-bold cursor-pointer"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-bold text-zinc-800 dark:text-white hover:underline cursor-pointer"
                onClick={() => setIsEditingMeta(true)}
              >
                {project.name}
              </span>
              <span className="text-[10px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.2 rounded font-semibold font-mono">
                v1.2
              </span>
            </div>
          )}
          <span className="text-[10px] text-zinc-400 truncate max-w-64">
            {project.description || 'Double click title to edit description.'}
          </span>
        </div>
      </div>

      {/* Preset template loaders */}
      <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-950 p-1 rounded-md">
        <button
          onClick={() => onLoadTemplate('onboarding')}
          className="px-2.5 py-1 text-[10px] font-bold text-zinc-600 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-all flex items-center gap-1.5 cursor-pointer"
          title="Load Onboarding Preset"
        >
          <BookOpen size={11} />
          Onboarding
        </button>
        <button
          onClick={() => onLoadTemplate('dashboard')}
          className="px-2.5 py-1 text-[10px] font-bold text-zinc-600 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-all flex items-center gap-1.5 cursor-pointer"
          title="Load Analytics Dashboard"
        >
          <Layout size={11} />
          Dashboard
        </button>
        <button
          onClick={() => onLoadTemplate('blank')}
          className="px-2.5 py-1 text-[10px] font-bold text-zinc-600 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-all flex items-center gap-1.5 cursor-pointer"
          title="Load Blank Board"
        >
          <FilePlus size={11} />
          Blank
        </button>
      </div>

      {/* Operations Toolbar actions */}
      <div className="flex items-center gap-3">
        {/* Undo / Redo */}
        <div className="flex items-center border border-zinc-200 dark:border-zinc-800 rounded-md p-0.5 bg-zinc-50 dark:bg-zinc-900/60">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1 text-zinc-500 hover:text-zinc-800 dark:hover:text-white hover:bg-zinc-150 dark:hover:bg-zinc-800 rounded disabled:opacity-30 cursor-pointer"
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw size={14} />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1 text-zinc-500 hover:text-zinc-800 dark:hover:text-white hover:bg-zinc-150 dark:hover:bg-zinc-800 rounded disabled:opacity-30 cursor-pointer"
            title="Redo (Ctrl+Shift+Z)"
          >
            <RotateCw size={14} />
          </button>
        </div>

        {/* Project saves */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onSave}
            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 font-bold text-xs rounded-md transition-all flex items-center gap-1.5 border border-blue-100 dark:border-blue-900/30 cursor-pointer"
            title="Save to local storage (Ctrl+S)"
          >
            <Save size={13} />
            Save Project
          </button>
          <button
            onClick={onExportProject}
            className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-800 dark:text-zinc-200 font-bold text-xs rounded-md transition-all flex items-center gap-1.5 border border-zinc-200 dark:border-zinc-850 cursor-pointer"
            title="Download .guide file"
          >
            <Download size={13} />
            Export Guide
          </button>
          <button
            onClick={triggerImport}
            className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md border border-zinc-200 dark:border-zinc-850 cursor-pointer"
            title="Import .guide File"
          >
            <FolderOpen size={14} />
          </button>
        </div>

        <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800" />

        {/* Presentation mode & Dark toggle */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              previewMode
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
            }`}
            title="Toggle presentation view"
          >
            <Play size={13} />
            {previewMode ? 'Editing Mode' : 'Preview Mode'}
          </button>

          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2 rounded-md text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border border-zinc-200 dark:border-zinc-850 cursor-pointer"
            title="Toggle theme appearance"
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
      </div>
    </header>
  );
}
