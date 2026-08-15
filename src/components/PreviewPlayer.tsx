import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  X,
  Play,
  RotateCcw,
  Sparkles,
  Link,
} from 'lucide-react';
import { Project, Page, CanvasElement, Point } from '../types';

interface PreviewPlayerProps {
  project: Project;
  activePageId: string;
  setActivePageId: (id: string) => void;
  onClose: () => void;
}

export default function PreviewPlayer({
  project,
  activePageId,
  setActivePageId,
  onClose,
}: PreviewPlayerProps) {
  const activePageIndex = project.pages.findIndex((p) => p.id === activePageId);
  const page = project.pages[activePageIndex] || project.pages[0];
  const [transitionNotification, setTransitionNotification] = useState<string | null>(null);

  const handleNextPage = () => {
    if (activePageIndex < project.pages.length - 1) {
      setActivePageId(project.pages[activePageIndex + 1].id);
    }
  };

  const handlePrevPage = () => {
    if (activePageIndex > 0) {
      setActivePageId(project.pages[activePageIndex - 1].id);
    }
  };

  const handleElementClick = (el: CanvasElement) => {
    // 1. If element has linkToPageId, navigate to that page
    if (el.linkToPageId) {
      const targetPage = project.pages.find((p) => p.id === el.linkToPageId);
      if (targetPage) {
        setActivePageId(targetPage.id);
        setTransitionNotification(`Navigated to "${targetPage.name}"`);
        setTimeout(() => setTransitionNotification(null), 2000);
        return;
      }
    }

    // 2. Interactive action feedback for specific types
    if (el.type === 'step-indicator') {
      setTransitionNotification(`Step ${(el as any).stepNumber}: ${(el as any).title}`);
      setTimeout(() => setTransitionNotification(null), 2500);
    } else if (el.type === 'sticky') {
      setTransitionNotification(`Memo: "${el.text}"`);
      setTimeout(() => setTransitionNotification(null), 2500);
    } else if (el.type === 'ui-component' && (el as any).componentType?.startsWith('button')) {
      setTransitionNotification(`Clicked "${(el as any).props?.label || 'Button'}"`);
      setTimeout(() => setTransitionNotification(null), 1800);
    }
  };

  return (
    <div className="fixed inset-0 bg-zinc-950 text-white z-50 flex flex-col items-center justify-center select-none overflow-hidden animate-fade-in">
      {/* Notification Toast */}
      {transitionNotification && (
        <div className="absolute top-20 z-60 bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
          <Link size={14} />
          {transitionNotification}
        </div>
      )}

      {/* Top Floating Remote Header bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-zinc-900/95 border border-zinc-800 rounded-2xl px-5 py-2 flex items-center gap-5 shadow-2xl backdrop-blur-md z-55">
        <div className="flex flex-col">
          <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Interactive Mockup Preview</span>
          <span className="text-xs font-bold text-zinc-100">{project.name}</span>
        </div>

        <div className="w-px h-6 bg-zinc-800" />

        {/* Navigation buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevPage}
            disabled={activePageIndex === 0}
            className="p-1.5 hover:bg-zinc-800 rounded-md disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
            title="Previous Page"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-semibold font-mono text-zinc-400 min-w-16 text-center">
            {activePageIndex + 1} / {project.pages.length}
          </span>
          <button
            onClick={handleNextPage}
            disabled={activePageIndex === project.pages.length - 1}
            className="p-1.5 hover:bg-zinc-800 rounded-md disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
            title="Next Page"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="w-px h-6 bg-zinc-800" />

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-blue-400 bg-blue-950/60 border border-blue-800/60 px-2.5 py-0.5 rounded-full font-semibold">
            {page.name}
          </span>
          <button
            onClick={onClose}
            className="p-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 rounded-md transition-colors cursor-pointer"
            title="Exit Presentation"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Main presentation canvas board container */}
      <div className="flex-1 w-full max-w-7xl max-h-[85vh] flex items-center justify-center overflow-hidden relative p-8">
        <div
          className="shadow-2xl rounded-xl relative transition-all duration-300 overflow-hidden"
          style={{
            width: `${page.width}px`,
            height: `${page.height}px`,
            backgroundColor: page.backgroundColor,
            transform: 'scale(0.85)',
          }}
        >
          {/* Vector layer for connectors */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
            <defs>
              <marker id="arrowhead-p" markerWidth="10" markerHeight="7" refX="8" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#2563EB" />
              </marker>
            </defs>

            {page.elements
              .filter((el) => el.type === 'connector')
              .map((conn) => {
                const startEl = page.elements.find((el) => el.id === conn.startElementId);
                const endEl = page.elements.find((el) => el.id === conn.endElementId);
                if (!startEl || !endEl) return null;

                const p1 = { x: startEl.x + startEl.width / 2, y: startEl.y + startEl.height / 2 };
                const p2 = { x: endEl.x + endEl.width / 2, y: endEl.y + endEl.height / 2 };
                const cp1x = p1.x + (p2.x - p1.x) / 2;
                const pathD = `M ${p1.x} ${p1.y} C ${cp1x} ${p1.y}, ${cp1x} ${p2.y}, ${p2.x} ${p2.y}`;

                return (
                  <path
                    key={conn.id}
                    d={pathD}
                    fill="none"
                    stroke={conn.strokeColor || '#2563EB'}
                    strokeWidth={conn.strokeWidth || 2}
                    markerEnd="url(#arrowhead-p)"
                  />
                );
              })}
          </svg>

          {/* Render Elements */}
          {page.elements
            .filter((el) => el.type !== 'connector' && !el.hidden)
            .map((el) => {
              const hasLink = Boolean(el.linkToPageId);

              return (
                <div
                  key={el.id}
                  onClick={() => handleElementClick(el)}
                  className={`absolute transition-all ${
                    hasLink
                      ? 'cursor-pointer hover:ring-2 hover:ring-blue-500 hover:scale-[1.01]'
                      : 'cursor-default'
                  }`}
                  style={{
                    left: `${el.x}px`,
                    top: `${el.y}px`,
                    width: `${el.width}px`,
                    height: `${el.height}px`,
                    transform: `rotate(${el.rotation || 0}deg)`,
                    opacity: el.opacity ?? 1,
                    zIndex: el.zIndex,
                  }}
                >
                  {/* TEXT */}
                  {el.type === 'text' && (
                    <div
                      className="w-full h-full p-1 text-zinc-900"
                      style={{
                        fontFamily: (el as any).fontFamily,
                        fontSize: `${(el as any).fontSize}px`,
                        fontWeight: (el as any).fontWeight,
                        color: (el as any).fontColor,
                        textAlign: (el as any).align,
                        fontStyle: (el as any).fontStyle,
                        textDecoration: (el as any).textDecoration,
                        lineHeight: (el as any).lineHeight,
                        letterSpacing: `${(el as any).letterSpacing}px`,
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {el.text}
                    </div>
                  )}

                  {/* RECTANGLE */}
                  {el.type === 'rectangle' && (
                    <div
                      className="w-full h-full"
                      style={{
                        backgroundColor: (el as any).fillColor,
                        borderColor: (el as any).strokeColor,
                        borderWidth: `${(el as any).strokeWidth}px`,
                        borderRadius: `${(el as any).cornerRadius || 0}px`,
                      }}
                    />
                  )}

                  {/* CIRCLE */}
                  {el.type === 'circle' && (
                    <div
                      className="w-full h-full"
                      style={{
                        backgroundColor: (el as any).fillColor,
                        borderColor: (el as any).strokeColor,
                        borderWidth: `${(el as any).strokeWidth}px`,
                        borderRadius: '50%',
                      }}
                    />
                  )}

                  {/* TRIANGLE */}
                  {el.type === 'triangle' && (
                    <svg className="w-full h-full overflow-visible">
                      <polygon
                        points={`0,${el.height} ${el.width / 2},0 ${el.width},${el.height}`}
                        fill={(el as any).fillColor}
                        stroke={(el as any).strokeColor}
                        strokeWidth={(el as any).strokeWidth}
                      />
                    </svg>
                  )}

                  {/* PEN DRAW */}
                  {el.type === 'drawing' && (
                    <svg className="w-full h-full overflow-visible">
                      <polyline
                        points={(el as any).points.map((p: Point) => `${p.x},${p.y}`).join(' ')}
                        fill="none"
                        stroke={(el as any).strokeColor}
                        strokeWidth={(el as any).strokeWidth}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}

                  {/* STICKY */}
                  {el.type === 'sticky' && (
                    <div
                      className="w-full h-full p-3 shadow-md flex flex-col text-[11px] font-mono text-zinc-800"
                      style={{
                        backgroundColor:
                          (el as any).color === 'yellow'
                            ? '#FEF08A'
                            : (el as any).color === 'blue'
                            ? '#BFDBFE'
                            : (el as any).color === 'pink'
                            ? '#FBCFE8'
                            : '#BBF7D0',
                      }}
                    >
                      <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-500 mb-1">
                        Memo
                      </span>
                      <div className="flex-1 whitespace-pre-wrap">{el.text}</div>
                    </div>
                  )}

                  {/* CALLOUT */}
                  {el.type === 'callout' && (
                    <div
                      className="w-full h-full p-2.5 rounded-md text-[11px] flex items-center justify-center font-semibold text-center shadow-md"
                      style={{
                        backgroundColor: (el as any).backgroundColor || '#2563EB',
                        color: (el as any).textColor || '#FFFFFF',
                      }}
                    >
                      {el.text}
                    </div>
                  )}

                  {/* STEP INDICATOR */}
                  {el.type === 'step-indicator' && (
                    <div className="w-full h-full p-3 bg-white border border-zinc-200 rounded-md shadow-md flex gap-2 items-start text-zinc-800">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                        {(el as any).stepNumber}
                      </span>
                      <div>
                        <div className="text-[11px] font-bold">{(el as any).title}</div>
                        <div className="text-[9px] text-zinc-500 mt-0.5 font-medium leading-normal">
                          {(el as any).description}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* UI COMPONENT */}
                  {el.type === 'ui-component' && (
                    <div className="w-full h-full select-none overflow-hidden">
                      {(el as any).componentType === 'button-primary' && (
                        <button
                          className="w-full h-full rounded-md font-semibold text-xs text-white flex items-center justify-center shadow-sm cursor-pointer active:scale-98 transition-transform"
                          style={{ backgroundColor: (el as any).props?.color || '#2563EB' }}
                        >
                          {(el as any).props?.label || 'Primary Button'}
                        </button>
                      )}

                      {(el as any).componentType === 'button-secondary' && (
                        <button className="w-full h-full rounded-md font-semibold text-xs border border-zinc-300 bg-white text-zinc-800 flex items-center justify-center shadow-xs cursor-pointer active:scale-98 transition-transform">
                          {(el as any).props?.label || 'Secondary Button'}
                        </button>
                      )}

                      {(el as any).componentType === 'input-search' && (
                        <div className="w-full h-full bg-zinc-50 border border-zinc-200 rounded-md px-3 flex items-center gap-2 text-xs text-zinc-400">
                          <span>🔍</span>
                          <span className="truncate">{(el as any).props?.placeholder || 'Search anything...'}</span>
                        </div>
                      )}

                      {(el as any).componentType === 'input-text' && (
                        <div className="w-full h-full flex flex-col justify-center">
                          <label className="text-[11px] font-semibold text-zinc-600 mb-1">
                            {(el as any).props?.label || 'Input Field'}
                          </label>
                          <div className="w-full h-8 bg-zinc-50 border border-zinc-200 rounded-md px-2.5 flex items-center text-xs text-zinc-800">
                            {(el as any).props?.value || (el as any).props?.placeholder || 'Value...'}
                          </div>
                        </div>
                      )}

                      {(el as any).componentType === 'metric-card' && (
                        <div className="w-full h-full bg-white border border-zinc-200 rounded-md p-3.5 flex flex-col justify-between shadow-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-zinc-500">{(el as any).props?.label || 'Metric Stat'}</span>
                            {(el as any).props?.badgeText && (
                              <span
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                style={{
                                  backgroundColor: '#DCFCE7',
                                  color: (el as any).props?.color || '#059669',
                                }}
                              >
                                {(el as any).props?.badgeText}
                              </span>
                            )}
                          </div>
                          <div className="text-2xl font-extrabold text-zinc-900 tracking-tight">
                            {(el as any).props?.value || '$0.00'}
                          </div>
                          <div className="text-[10px] text-zinc-400 font-medium truncate">
                            {(el as any).props?.sublabel || 'Compared to previous cycle'}
                          </div>
                        </div>
                      )}

                      {(el as any).componentType === 'user-card' && (
                        <div className="w-full h-full bg-white border border-zinc-200 rounded-md p-3 flex items-center gap-3 shadow-xs">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold flex items-center justify-center text-sm shrink-0">
                            {((el as any).props?.label || 'User').charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-zinc-900 truncate">
                                {(el as any).props?.label || 'User Name'}
                              </span>
                              {(el as any).props?.badgeText && (
                                <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded-full">
                                  {(el as any).props?.badgeText}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-zinc-400 truncate">
                              {(el as any).props?.sublabel || 'user@example.com'}
                            </div>
                          </div>
                        </div>
                      )}

                      {(el as any).componentType === 'alert-banner' && (
                        <div
                          className="w-full h-full rounded-md px-3.5 py-2 flex items-center gap-2.5 border text-xs shadow-xs"
                          style={{
                            backgroundColor: '#EFF6FF',
                            borderColor: '#BFDBFE',
                            color: '#1E40AF',
                          }}
                        >
                          <span className="font-bold">ℹ️</span>
                          <div className="min-w-0 flex-1 truncate">
                            <span className="font-bold mr-1.5">{(el as any).props?.label || 'Alert'}:</span>
                            <span>{(el as any).props?.sublabel || 'System announcement'}</span>
                          </div>
                        </div>
                      )}

                      {(el as any).componentType === 'navbar' && (
                        <div className="w-full h-full bg-white border-b border-zinc-200 px-4 flex items-center justify-between shadow-xs">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-white text-xs font-black">
                              {(el as any).props?.label?.charAt(0) || 'A'}
                            </div>
                            <span className="text-xs font-bold text-zinc-900">
                              {(el as any).props?.label || 'Platform'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs font-medium text-zinc-500">
                            <span>Dashboard</span>
                            <span>Guides</span>
                            <span>Settings</span>
                          </div>
                        </div>
                      )}

                      {(el as any).componentType === 'tabbar' && (
                        <div className="w-full h-full bg-white border-t border-zinc-200 px-6 flex items-center justify-around text-zinc-400">
                          <div className="flex flex-col items-center gap-0.5 text-blue-600">
                            <span className="text-xs">🏠</span>
                            <span className="text-[9px] font-bold">Home</span>
                          </div>
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-xs">🔍</span>
                            <span className="text-[9px]">Search</span>
                          </div>
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-xs">🛍️</span>
                            <span className="text-[9px]">Cart</span>
                          </div>
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-xs">👤</span>
                            <span className="text-[9px]">Profile</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* HOTSPOT */}
                  {el.type === 'hotspot' && (
                    <div className="w-full h-full relative flex items-center justify-center cursor-pointer">
                      <div
                        className="absolute inset-0 rounded-full animate-ping opacity-75"
                        style={{ backgroundColor: (el as any).pulseColor || '#2563EB' }}
                      />
                      <div
                        className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-lg text-[10px] text-white font-bold"
                        style={{ backgroundColor: (el as any).pulseColor || '#2563EB' }}
                      >
                        ●
                      </div>
                    </div>
                  )}

                  {/* KEYCAP */}
                  {el.type === 'keycap' && (
                    <div className="w-full h-full bg-zinc-900 text-white rounded-md px-3 py-1.5 flex items-center justify-between border border-zinc-700 shadow-md">
                      <div className="flex items-center gap-1">
                        {((el as any).keys || ['⌘', 'K']).map((k: string, idx: number) => (
                          <span
                            key={idx}
                            className="bg-zinc-800 border border-zinc-600 rounded px-1.5 py-0.5 text-xs font-mono font-bold text-zinc-100 shadow-xs"
                          >
                            {k}
                          </span>
                        ))}
                      </div>
                      {(el as any).label && (
                        <span className="text-[10px] text-zinc-300 font-medium truncate ml-2">
                          {(el as any).label}
                        </span>
                      )}
                    </div>
                  )}

                  {/* DEVICE BEZELS */}
                  {el.type === 'device-frame' && (
                    <div
                      className="w-full h-full border-4 border-zinc-900 rounded-3xl relative flex flex-col overflow-hidden bg-white shadow-xl"
                      style={{
                        borderRadius:
                          (el as any).deviceType === 'iphone'
                            ? '40px'
                            : (el as any).deviceType === 'browser'
                            ? '12px'
                            : (el as any).deviceType === 'terminal'
                            ? '10px'
                            : '24px',
                      }}
                    >
                      {(el as any).deviceType === 'browser' && (
                        <div className="h-10 border-b border-zinc-200 bg-zinc-100 px-3 flex items-center gap-3 shrink-0">
                          <div className="flex gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          </div>
                          <div className="flex-1 max-w-sm h-6 bg-white border border-zinc-200 rounded px-2 flex items-center text-[10px] text-zinc-500 font-mono">
                            🔒 https://app.acme.com/portal
                          </div>
                        </div>
                      )}

                      {(el as any).deviceType === 'iphone' && (
                        <div className="h-8 border-b border-zinc-100 shrink-0 bg-zinc-50 flex items-center justify-between px-5 text-[9px] font-bold text-zinc-400">
                          <span>9:41</span>
                          <span>🔋</span>
                        </div>
                      )}

                      <div className="flex-1 relative" style={{ backgroundColor: (el as any).backgroundColor || '#FFFFFF' }} />
                    </div>
                  )}

                  {/* IMAGE */}
                  {el.type === 'image' && (
                    <img
                      src={(el as any).url}
                      alt={el.name}
                      className="w-full h-full object-cover rounded-md"
                      referrerPolicy="no-referrer"
                    />
                  )}

                  {/* FRAME */}
                  {el.type === 'frame' && (
                    <div
                      className="w-full h-full"
                      style={{
                        backgroundColor: (el as any).backgroundColor,
                        borderRadius: `${(el as any).cornerRadius}px`,
                        borderWidth: `${(el as any).borderWidth}px`,
                        borderStyle: (el as any).borderStyle,
                        borderColor: (el as any).borderColor,
                        boxShadow: (el as any).shadowEnabled
                          ? `${(el as any).shadowX}px ${(el as any).shadowY}px ${(el as any).shadowBlur}px ${(el as any).shadowColor}`
                          : 'none',
                      }}
                    />
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* Floating hints footer info */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[11px] text-zinc-400 font-medium bg-zinc-900 border border-zinc-800 rounded-full px-4 py-1.5 shadow-md flex items-center gap-2">
        <span>💡 Click any hotspot, button, or linked component to trigger interactive flow navigation</span>
      </div>
    </div>
  );
}
