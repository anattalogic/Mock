import React, { useRef, useState, useEffect } from 'react';
import { Page, CanvasElement, ToolType, Point, DeviceType } from '../types';

interface CanvasProps {
  page: Page;
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
  selectedElementIds: string[];
  setSelectedElementIds: (ids: string[]) => void;
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  onAddElement: (element: CanvasElement) => void;
  onDeleteElement: (id: string) => void;
  
  // Status reporting
  setCursorPos: (pos: Point) => void;
  setZoomPercent: (zoom: number) => void;
  zoomPercent: number;
}

interface DragState {
  type: 'none' | 'drag-element' | 'resize' | 'pan' | 'draw' | 'lasso' | 'connector-draw';
  startX: number;
  startY: number;
  startPanX: number;
  startPanY: number;
  elementStarts: { [id: string]: { x: number; y: number; width: number; height: number } };
  resizeHandle?: 'tl' | 'tr' | 'bl' | 'br' | 'n' | 's' | 'e' | 'w';
  connectorStartId?: string;
}

export default function Canvas({
  page,
  activeTool,
  setActiveTool,
  selectedElementIds,
  setSelectedElementIds,
  onUpdateElement,
  onAddElement,
  onDeleteElement,
  setCursorPos,
  setZoomPercent,
  zoomPercent,
}: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Navigation state (zoom and pan)
  const [zoom, setZoom] = useState<number>(0.8);
  const [pan, setPan] = useState<Point>({ x: 80, y: 60 });
  const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);

  // Drawing state
  const [drawPoints, setDrawPoints] = useState<Point[]>([]);
  const [lassoBox, setLassoBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // Interactive connector source element
  const [connectingSourceId, setConnectingSourceId] = useState<string | null>(null);

  // Smart snapping guides
  const [smartGuides, setSmartGuides] = useState<{ x?: number; y?: number } | null>(null);

  // Track drag states
  const dragRef = useRef<DragState>({
    type: 'none',
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0,
    elementStarts: {},
  });

  // Keep parent zoom percent state in sync
  useEffect(() => {
    setZoomPercent(Math.round(zoom * 100));
  }, [zoom]);

  // Keyboard listeners for space bar panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(true);
        if (e.target === document.body) {
          e.preventDefault();
        }
      }
      
      // Global hotkeys
      if (e.key === 'v' || e.key === 'V') {
        if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          setActiveTool('select');
        }
      }
      if (e.key === 't' || e.key === 'T') {
        if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          setActiveTool('text');
        }
      }
      if (e.key === 'r' || e.key === 'R') {
        if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          setActiveTool('rectangle');
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [setActiveTool]);

  // Coordinate conversion: screen space (mouse event) -> canvas relative space
  const screenToCanvasCoords = (clientX: number, clientY: number): Point => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const x = (clientX - rect.left - pan.x) / zoom;
    const y = (clientY - rect.top - pan.y) / zoom;
    return { x, y };
  };

  // Zoom slider helper
  const handleZoomIn = () => setZoom((z) => Math.min(4, z + 0.1));
  const handleZoomOut = () => setZoom((z) => Math.max(0.1, z - 0.1));
  const handleZoomReset = () => {
    setZoom(1.0);
    setPan({ x: 120, y: 80 });
  };

  // Click handler on empty canvas space
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || isSpacePressed) {
      // Middle click or space + left click initiates Panning
      dragRef.current = {
        type: 'pan',
        startX: e.clientX,
        startY: e.clientY,
        startPanX: pan.x,
        startPanY: pan.y,
        elementStarts: {},
      };
      return;
    }

    const coords = screenToCanvasCoords(e.clientX, e.clientY);

    // If a design/creation tool is selected, click adds that element
    if (activeTool !== 'select') {
      if (activeTool === 'pen' || activeTool === 'highlighter') {
        dragRef.current = {
          type: 'draw',
          startX: e.clientX,
          startY: e.clientY,
          startPanX: pan.x,
          startPanY: pan.y,
          elementStarts: {},
        };
        setDrawPoints([coords]);
        return;
      }

      // Add regular element based on tool
      const newElId = `el-${Date.now()}`;
      let newEl: CanvasElement;

      const base = {
        id: newElId,
        name: `${activeTool.toUpperCase()} Layer`,
        x: coords.x - 50,
        y: coords.y - 40,
        width: 100,
        height: 80,
        rotation: 0,
        opacity: 1,
        locked: false,
        hidden: false,
        zIndex: page.elements.length + 1,
      };

      if (activeTool === 'text') {
        newEl = {
          ...base,
          type: 'text',
          name: 'Text Layer',
          text: 'Double click to edit text...',
          fontFamily: 'Inter',
          fontSize: 16,
          fontWeight: 'normal',
          fontColor: '#0F172A',
          fontStyle: 'normal',
          textDecoration: 'none',
          align: 'left',
          lineHeight: 1.5,
          letterSpacing: 0,
          width: 200,
          height: 60,
        };
      } else if (activeTool === 'sticky') {
        newEl = {
          ...base,
          type: 'sticky',
          name: 'Sticky Note',
          text: 'New Sticky Note\n\nLeave feedback here!',
          color: 'yellow',
          width: 150,
          height: 150,
        };
      } else if (activeTool === 'callout') {
        newEl = {
          ...base,
          type: 'callout',
          name: 'Callout Annotation',
          text: '💡 Pointing to a focal area',
          pointerDirection: 'bottom',
          backgroundColor: '#2563EB',
          textColor: '#FFFFFF',
          width: 180,
          height: 90,
        };
      } else if (activeTool === 'step-indicator') {
        // Calculate auto step number based on existing step indicator elements
        const stepsCount = page.elements.filter((el) => el.type === 'step-indicator').length;
        newEl = {
          ...base,
          type: 'step-indicator',
          name: `Step Indicator ${stepsCount + 1}`,
          stepNumber: stepsCount + 1,
          title: `Step ${stepsCount + 1}`,
          description: 'Explain what the user needs to achieve in this step.',
          status: 'active',
          width: 220,
          height: 100,
        };
      } else if (activeTool === 'frame') {
        newEl = {
          ...base,
          type: 'frame',
          name: 'Custom Box Container',
          backgroundColor: '#FFFFFF',
          cornerRadius: 8,
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: '#E2E8F0',
          shadowEnabled: true,
          shadowX: 0,
          shadowY: 2,
          shadowBlur: 8,
          shadowColor: 'rgba(0,0,0,0.05)',
          clipContent: false,
          width: 300,
          height: 200,
        };
      } else if (activeTool === 'device-frame') {
        newEl = {
          ...base,
          type: 'device-frame',
          name: 'iPhone Bezel',
          deviceType: 'iphone',
          backgroundColor: '#FFFFFF',
          orientation: 'portrait',
          width: 320,
          height: 650,
        };
      } else {
        // Shapes
        newEl = {
          ...base,
          type: activeTool as any,
          fillColor: '#F1F5F9',
          strokeColor: '#2563EB',
          strokeWidth: 2,
          arrowEnd: activeTool === 'arrow' ? 'single' : undefined,
          starPoints: activeTool === 'star' ? 5 : undefined,
        };
      }

      onAddElement(newEl);
      setSelectedElementIds([newElId]);
      setActiveTool('select');
      return;
    }

    // Default select tool - Click blank area: clear selection and start lasso selection
    setSelectedElementIds([]);
    dragRef.current = {
      type: 'lasso',
      startX: e.clientX,
      startY: e.clientY,
      startPanX: pan.x,
      startPanY: pan.y,
      elementStarts: {},
    };
    setLassoBox({ x: coords.x, y: coords.y, w: 0, h: 0 });
  };

  // Mouse move handler
  const handleMouseMove = (e: React.MouseEvent) => {
    const coords = screenToCanvasCoords(e.clientX, e.clientY);
    setCursorPos({ x: Math.round(coords.x), y: Math.round(coords.y) });

    const state = dragRef.current;
    if (state.type === 'none') return;

    if (state.type === 'pan') {
      const dx = e.clientX - state.startX;
      const dy = e.clientY - state.startY;
      setPan({ x: state.startPanX + dx, y: state.startPanY + dy });
      return;
    }

    if (state.type === 'draw') {
      setDrawPoints((pts) => [...pts, coords]);
      return;
    }

    if (state.type === 'lasso' && lassoBox) {
      const w = coords.x - lassoBox.x;
      const h = coords.y - lassoBox.y;
      setLassoBox((prev) => prev ? { ...prev, w, h } : null);
      
      // Compute what elements fall inside lasso bounding box
      const minX = Math.min(lassoBox.x, coords.x);
      const maxX = Math.max(lassoBox.x, coords.x);
      const minY = Math.min(lassoBox.y, coords.y);
      const maxY = Math.max(lassoBox.y, coords.y);

      const insideIds = page.elements
        .filter((el) => {
          if (el.hidden || el.locked) return false;
          return el.x >= minX && el.x + el.width <= maxX && el.y >= minY && el.y + el.height <= maxY;
        })
        .map((el) => el.id);

      setSelectedElementIds(insideIds);
      return;
    }

    const dx = coords.x - screenToCanvasCoords(state.startX, state.startY).x;
    const dy = coords.y - screenToCanvasCoords(state.startX, state.startY).y;

    if (state.type === 'drag-element') {
      // Loop selected elements and update positions with smart snapping
      let snapX: number | undefined;
      let snapY: number | undefined;

      selectedElementIds.forEach((id) => {
        const start = state.elementStarts[id];
        if (!start) return;

        let targetX = start.x + dx;
        let targetY = start.y + dy;

        // Smart Snapping Logic: Check proximity to grid nodes or other elements
        const gridSize = 20;
        
        // 1. Grid snap (closes 20px intervals)
        if (Math.abs(targetX % gridSize) < 8) {
          targetX = Math.round(targetX / gridSize) * gridSize;
          snapX = targetX;
        }
        if (Math.abs(targetY % gridSize) < 8) {
          targetY = Math.round(targetY / gridSize) * gridSize;
          snapY = targetY;
        }

        // 2. Proximity snap to other static elements on canvas (boundaries align)
        page.elements.forEach((other) => {
          if (selectedElementIds.includes(other.id) || other.hidden) return;
          // horizontal alignments
          if (Math.abs(targetX - other.x) < 10) {
            targetX = other.x;
            snapX = other.x;
          }
          if (Math.abs((targetX + start.width) - (other.x + other.width)) < 10) {
            targetX = other.x + other.width - start.width;
            snapX = other.x + other.width;
          }
          // vertical alignments
          if (Math.abs(targetY - other.y) < 10) {
            targetY = other.y;
            snapY = other.y;
          }
          if (Math.abs((targetY + start.height) - (other.y + other.height)) < 10) {
            targetY = other.y + other.height - start.height;
            snapY = other.y + other.height;
          }
        });

        onUpdateElement(id, { x: targetX, y: targetY });
      });

      // Show snap guide line traces
      if (snapX || snapY) {
        setSmartGuides({ x: snapX, y: snapY });
      } else {
        setSmartGuides(null);
      }
      return;
    }

    if (state.type === 'resize' && state.resizeHandle) {
      // Resizing logic per handle
      selectedElementIds.forEach((id) => {
        const start = state.elementStarts[id];
        if (!start) return;

        let newX = start.x;
        let newY = start.y;
        let newW = start.width;
        let newH = start.height;

        const h = state.resizeHandle;

        if (h.includes('e')) newW = Math.max(10, start.width + dx);
        if (h.includes('w')) {
          newW = Math.max(10, start.width - dx);
          newX = start.x + (start.width - newW);
        }
        if (h.includes('s')) newH = Math.max(10, start.height + dy);
        if (h.includes('n')) {
          newH = Math.max(10, start.height - dy);
          newY = start.y + (start.height - newH);
        }

        onUpdateElement(id, { x: newX, y: newY, width: newW, height: newH });
      });
    }
  };

  // Mouse up handler
  const handleMouseUp = (e: React.MouseEvent) => {
    const state = dragRef.current;
    if (state.type === 'none') return;

    if (state.type === 'draw' && drawPoints.length > 1) {
      // Create drawing pen strokes
      const minX = Math.min(...drawPoints.map((p) => p.x));
      const minY = Math.min(...drawPoints.map((p) => p.y));
      const maxX = Math.max(...drawPoints.map((p) => p.x));
      const maxY = Math.max(...drawPoints.map((p) => p.y));

      const newId = `draw-${Date.now()}`;
      onAddElement({
        id: newId,
        type: 'drawing',
        name: activeTool === 'highlighter' ? 'Highlighter Stroke' : 'Pen Drawing',
        x: minX,
        y: minY,
        width: Math.max(5, maxX - minX),
        height: Math.max(5, maxY - minY),
        rotation: 0,
        opacity: activeTool === 'highlighter' ? 0.4 : 1,
        locked: false,
        hidden: false,
        zIndex: page.elements.length + 1,
        points: drawPoints.map((p) => ({ x: p.x - minX, y: p.y - minY })),
        strokeColor: activeTool === 'highlighter' ? '#FEE2E2' : '#3B82F6',
        strokeWidth: activeTool === 'highlighter' ? 12 : 3,
        isHighlighter: activeTool === 'highlighter',
      });

      setDrawPoints([]);
    }

    setLassoBox(null);
    setSmartGuides(null);
    dragRef.current = { type: 'none', startX: 0, startY: 0, startPanX: 0, startPanY: 0, elementStarts: {} };
  };

  // Start dragging a specific element
  const handleElementMouseDown = (e: React.MouseEvent, el: CanvasElement) => {
    e.stopPropagation();

    if (activeTool === 'connector') {
      // Connect two objects
      if (!connectingSourceId) {
        setConnectingSourceId(el.id);
      } else if (connectingSourceId !== el.id) {
        // Complete connector creation
        const connId = `conn-${Date.now()}`;
        onAddElement({
          id: connId,
          type: 'connector',
          name: 'Flow Connector',
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          rotation: 0,
          opacity: 1,
          locked: true,
          hidden: false,
          zIndex: page.elements.length + 1,
          startElementId: connectingSourceId,
          endElementId: el.id,
          lineStyle: 'curved',
          strokeColor: '#2563EB',
          strokeWidth: 2,
        });
        setConnectingSourceId(null);
        setActiveTool('select');
      }
      return;
    }

    if (el.locked || activeTool !== 'select') return;

    if (!selectedElementIds.includes(el.id)) {
      if (e.shiftKey) {
        setSelectedElementIds([...selectedElementIds, el.id]);
      } else {
        setSelectedElementIds([el.id]);
      }
    }

    const starts: { [id: string]: { x: number; y: number; width: number; height: number } } = {};
    const targets = e.shiftKey ? [...selectedElementIds, el.id] : [el.id];

    targets.forEach((id) => {
      const match = page.elements.find((item) => item.id === id);
      if (match) {
        starts[id] = { x: match.x, y: match.y, width: match.width, height: match.height };
      }
    });

    dragRef.current = {
      type: 'drag-element',
      startX: e.clientX,
      startY: e.clientY,
      startPanX: pan.x,
      startPanY: pan.y,
      elementStarts: starts,
    };
  };

  // Start resizing an element from a specific handle
  const handleResizeMouseDown = (e: React.MouseEvent, el: CanvasElement, handle: any) => {
    e.stopPropagation();
    e.preventDefault();

    const starts: { [id: string]: { x: number; y: number; width: number; height: number } } = {};
    starts[el.id] = { x: el.x, y: el.y, width: el.width, height: el.height };

    dragRef.current = {
      type: 'resize',
      startX: e.clientX,
      startY: e.clientY,
      startPanX: pan.x,
      startPanY: pan.y,
      elementStarts: starts,
      resizeHandle: handle,
    };
  };

  // Render connector line paths mathematically
  const renderConnector = (conn: any) => {
    const startEl = page.elements.find((el) => el.id === conn.startElementId);
    const endEl = page.elements.find((el) => el.id === conn.endElementId);

    if (!startEl || !endEl) return null;

    // Anchor points (Centers of elements)
    const p1 = { x: startEl.x + startEl.width / 2, y: startEl.y + startEl.height / 2 };
    const p2 = { x: endEl.x + endEl.width / 2, y: endEl.y + endEl.height / 2 };

    let pathD = '';
    if (conn.lineStyle === 'straight') {
      pathD = `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;
    } else if (conn.lineStyle === 'orthogonal') {
      const midX = p1.x + (p2.x - p1.x) / 2;
      pathD = `M ${p1.x} ${p1.y} L ${midX} ${p1.y} L ${midX} ${p2.y} L ${p2.x} ${p2.y}`;
    } else {
      // Curved Spline (default)
      const cp1x = p1.x + (p2.x - p1.x) / 2;
      const cp1y = p1.y;
      const cp2x = p1.x + (p2.x - p1.x) / 2;
      const cp2y = p2.y;
      pathD = `M ${p1.x} ${p1.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    return (
      <g key={conn.id}>
        <path
          d={pathD}
          fill="none"
          stroke={conn.strokeColor || '#2563EB'}
          strokeWidth={conn.strokeWidth || 2}
          strokeDasharray={conn.strokeDasharray}
          markerEnd="url(#arrowhead)"
        />
      </g>
    );
  };

  return (
    <div className="flex-1 bg-zinc-100 dark:bg-zinc-950 flex flex-col relative overflow-hidden select-none">
      {/* Top action/zoom panel */}
      <div className="absolute top-4 left-4 z-20 flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-1.5 shadow-sm gap-1.5 text-xs font-semibold">
        <button
          onClick={handleZoomOut}
          className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-md"
          title="Zoom Out"
        >
          -
        </button>
        <span className="min-w-12 text-center text-zinc-850 dark:text-zinc-200 font-mono">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={handleZoomIn}
          className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-md"
          title="Zoom In"
        >
          +
        </button>
        <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800" />
        <button
          onClick={handleZoomReset}
          className="px-2 py-0.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/20 rounded text-[10px] cursor-pointer"
          title="Reset View Fit"
        >
          Reset View
        </button>
      </div>

      {/* Grid status toggles / hints */}
      <div className="absolute top-4 right-4 z-20 flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 shadow-sm gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Smart Snapping On</span>
        </div>
        {connectingSourceId && (
          <div className="text-blue-600 dark:text-blue-400">
            Connecting: select target element...
          </div>
        )}
      </div>

      {/* Rulers Container wrapper */}
      <div
        ref={containerRef}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="flex-1 w-full h-full relative outline-none overflow-hidden cursor-crosshair"
        style={{ cursor: isSpacePressed ? 'grab' : activeTool === 'select' ? 'default' : 'crosshair' }}
      >
        {/* Actual transforming Canvas board */}
        <div
          ref={canvasRef}
          className="absolute origin-top-left transition-transform duration-75 shadow-xs"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            width: `${page.width}px`,
            height: `${page.height}px`,
            backgroundColor: page.backgroundColor,
          }}
        >
          {/* Subtle dots grid pattern background overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20"
            style={{
              backgroundImage: 'radial-gradient(circle, #94A3B8 1px, transparent 1.5px)',
              backgroundSize: '20px 20px',
            }}
          />

          {/* SVG canvas layer for vector elements (Connectors, Draw Paths, Guides) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="8"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#2563EB" />
              </marker>
            </defs>

            {/* Smart Guides tracer lines */}
            {smartGuides?.x && (
              <line
                x1={smartGuides.x}
                y1={0}
                x2={smartGuides.x}
                y2={page.height}
                stroke="#EF4444"
                strokeWidth={1}
                strokeDasharray="4 2"
              />
            )}
            {smartGuides?.y && (
              <line
                x1={0}
                y1={smartGuides.y}
                x2={page.width}
                y2={smartGuides.y}
                stroke="#EF4444"
                strokeWidth={1}
                strokeDasharray="4 2"
              />
            )}

            {/* Dynamic rendering of connector paths */}
            {page.elements.filter((el) => el.type === 'connector').map(renderConnector)}
          </svg>

          {/* RENDER ALL CANVAS OBJECTS */}
          {page.elements
            .filter((el) => el.type !== 'connector')
            .map((el) => {
              const isSelected = selectedElementIds.includes(el.id);
              const isEditing = false; // double click sets edit state (simple contenteditable toggle)

              // CSS Filters string computed from custom image settings
              const imageFilterString =
                el.type === 'image'
                  ? `brightness(${(el as any).brightness ?? 100}%) contrast(${(el as any).contrast ?? 100}%) saturate(${(el as any).saturation ?? 100}%) blur(${(el as any).blur ?? 0}px)`
                  : 'none';

              return (
                <div
                  key={el.id}
                  onMouseDown={(e) => handleElementMouseDown(e, el)}
                  className={`absolute group select-none transition-shadow ${
                    el.hidden ? 'hidden' : ''
                  } ${
                    isSelected ? 'ring-2 ring-blue-500/80 z-20 shadow-md' : 'hover:ring-1 hover:ring-blue-300'
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
                  {/* TEXT ELEMENT */}
                  {el.type === 'text' && (
                    <div
                      className="w-full h-full p-1 overflow-hidden"
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
                      contentEditable={!el.locked}
                      suppressContentEditableWarning
                      onBlur={(e) => {
                        const targetText = e.target.innerText;
                        onUpdateElement(el.id, { text: targetText });
                      }}
                    >
                      {el.text}
                    </div>
                  )}

                  {/* SHAPE: RECTANGLE */}
                  {el.type === 'rectangle' && (
                    <div
                      className="w-full h-full"
                      style={{
                        backgroundColor: (el as any).fillColor,
                        borderColor: (el as any).strokeColor,
                        borderWidth: `${(el as any).strokeWidth}px`,
                        borderStyle: (el as any).strokeDasharray ? 'dashed' : 'solid',
                        borderRadius: `${(el as any).cornerRadius || 0}px`,
                      }}
                    />
                  )}

                  {/* SHAPE: CIRCLE */}
                  {el.type === 'circle' && (
                    <div
                      className="w-full h-full"
                      style={{
                        backgroundColor: (el as any).fillColor,
                        borderColor: (el as any).strokeColor,
                        borderWidth: `${(el as any).strokeWidth}px`,
                        borderStyle: (el as any).strokeDasharray ? 'dashed' : 'solid',
                        borderRadius: '50%',
                      }}
                    />
                  )}

                  {/* SHAPE: TRIANGLE */}
                  {el.type === 'triangle' && (
                    <svg className="w-full h-full overflow-visible">
                      <polygon
                        points={`0,${el.height} ${el.width / 2},0 ${el.width},${el.height}`}
                        fill={(el as any).fillColor}
                        stroke={(el as any).strokeColor}
                        strokeWidth={(el as any).strokeWidth}
                        strokeDasharray={(el as any).strokeDasharray}
                      />
                    </svg>
                  )}

                  {/* SHAPE: STAR */}
                  {el.type === 'star' && (
                    <svg className="w-full h-full overflow-visible">
                      {/* Generates mathematical coordinates of a 5-point star */}
                      <polygon
                        points="50,5 64,36 98,36 70,57 81,91 50,70 19,91 30,57 2,36 36,36"
                        fill={(el as any).fillColor}
                        stroke={(el as any).strokeColor}
                        strokeWidth={(el as any).strokeWidth}
                        transform={`scale(${el.width / 100}, ${el.height / 100})`}
                      />
                    </svg>
                  )}

                  {/* SHAPE: LINE OR ARROW */}
                  {(el.type === 'line' || el.type === 'arrow') && (
                    <svg className="w-full h-full overflow-visible">
                      <line
                        x1={0}
                        y1={el.height / 2}
                        x2={el.width}
                        y2={el.height / 2}
                        stroke={(el as any).strokeColor}
                        strokeWidth={(el as any).strokeWidth || 2}
                        strokeDasharray={(el as any).strokeDasharray}
                        markerEnd={el.type === 'arrow' ? 'url(#arrowhead)' : undefined}
                      />
                    </svg>
                  )}

                  {/* CUSTOM DRAWING LINE */}
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

                  {/* ANNOTATIVE: STICKY NOTE */}
                  {el.type === 'sticky' && (
                    <div
                      className="w-full h-full p-4 flex flex-col font-mono shadow-md text-xs border border-yellow-300"
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
                      contentEditable={!el.locked}
                      suppressContentEditableWarning
                      onBlur={(e) => onUpdateElement(el.id, { text: e.target.innerText })}
                    >
                      <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-1">
                        Sticky Note
                      </span>
                      <div className="flex-1 whitespace-pre-wrap outline-none">{el.text}</div>
                    </div>
                  )}

                  {/* ANNOTATIVE: CALLOUT SPEECH BUBBLE */}
                  {el.type === 'callout' && (
                    <div
                      className="w-full h-full p-3 rounded-md shadow-md text-xs relative flex items-center justify-center font-medium"
                      style={{
                        backgroundColor: (el as any).backgroundColor || '#2563EB',
                        color: (el as any).textColor || '#FFFFFF',
                      }}
                      contentEditable={!el.locked}
                      suppressContentEditableWarning
                      onBlur={(e) => onUpdateElement(el.id, { text: e.target.innerText })}
                    >
                      {el.text}
                      {/* Little triangle arrow point */}
                      <div
                        className="absolute w-3 h-3 rotate-45"
                        style={{
                          backgroundColor: (el as any).backgroundColor || '#2563EB',
                          bottom: '-6px',
                          left: 'calc(50% - 6px)',
                        }}
                      />
                    </div>
                  )}

                  {/* ANNOTATIVE: STEP INDICATOR */}
                  {el.type === 'step-indicator' && (
                    <div className="w-full h-full p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md shadow-xs flex gap-2.5 items-start">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          (el as any).status === 'completed'
                            ? 'bg-emerald-500 text-white'
                            : (el as any).status === 'active'
                            ? 'bg-blue-600 text-white animate-pulse'
                            : 'bg-zinc-200 text-zinc-600'
                        }`}
                      >
                        {(el as any).stepNumber}
                      </span>
                      <div className="min-w-0">
                        <div
                          className="text-xs font-bold text-zinc-800 dark:text-zinc-100 outline-none"
                          contentEditable={!el.locked}
                          suppressContentEditableWarning
                          onBlur={(e) => onUpdateElement(el.id, { title: e.target.innerText })}
                        >
                          {(el as any).title}
                        </div>
                        <div
                          className="text-[10px] text-zinc-400 mt-0.5 outline-none"
                          contentEditable={!el.locked}
                          suppressContentEditableWarning
                          onBlur={(e) => onUpdateElement(el.id, { description: e.target.innerText })}
                        >
                          {(el as any).description}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* UI MOCKUP COMPONENTS */}
                  {el.type === 'ui-component' && (
                    <div className="w-full h-full select-none overflow-hidden">
                      {(el as any).componentType === 'button-primary' && (
                        <button
                          className="w-full h-full rounded-md font-semibold text-xs text-white flex items-center justify-center gap-1.5 shadow-sm transition-all"
                          style={{ backgroundColor: (el as any).props?.color || '#2563EB' }}
                        >
                          {(el as any).props?.label || 'Primary Button'}
                        </button>
                      )}

                      {(el as any).componentType === 'button-secondary' && (
                        <button
                          className="w-full h-full rounded-md font-semibold text-xs border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          {(el as any).props?.label || 'Secondary Button'}
                        </button>
                      )}

                      {(el as any).componentType === 'input-search' && (
                        <div className="w-full h-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700 rounded-md px-3 flex items-center gap-2 text-xs text-zinc-400">
                          <span className="text-zinc-400">🔍</span>
                          <span className="truncate">{(el as any).props?.placeholder || 'Search anything...'}</span>
                        </div>
                      )}

                      {(el as any).componentType === 'input-text' && (
                        <div className="w-full h-full flex flex-col justify-center">
                          <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                            {(el as any).props?.label || 'Input Field'}
                          </label>
                          <div className="w-full h-8 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700 rounded-md px-2.5 flex items-center text-xs text-zinc-800 dark:text-zinc-200">
                            {(el as any).props?.value || (el as any).props?.placeholder || 'Value...'}
                          </div>
                        </div>
                      )}

                      {(el as any).componentType === 'toggle-switch' && (
                        <div className="w-full h-full bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700 rounded-md px-3 flex items-center justify-between shadow-xs">
                          <div>
                            <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                              {(el as any).props?.label || 'Option Label'}
                            </div>
                            <div className="text-[10px] text-zinc-400">
                              {(el as any).props?.sublabel || 'Description text'}
                            </div>
                          </div>
                          <div className="w-9 h-5 bg-blue-600 rounded-full p-0.5 flex items-center justify-end">
                            <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                          </div>
                        </div>
                      )}

                      {(el as any).componentType === 'metric-card' && (
                        <div className="w-full h-full bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-md p-3.5 flex flex-col justify-between shadow-xs">
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
                          <div className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                            {(el as any).props?.value || '$0.00'}
                          </div>
                          <div className="text-[10px] text-zinc-400 font-medium truncate">
                            {(el as any).props?.sublabel || 'Compared to previous cycle'}
                          </div>
                        </div>
                      )}

                      {(el as any).componentType === 'user-card' && (
                        <div className="w-full h-full bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-md p-3 flex items-center gap-3 shadow-xs">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold flex items-center justify-center text-sm shrink-0">
                            {((el as any).props?.label || 'User').charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                                {(el as any).props?.label || 'User Name'}
                              </span>
                              {(el as any).props?.badgeText && (
                                <span className="text-[9px] bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-bold px-1.5 py-0.2 rounded-full">
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
                        <div className="w-full h-full bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 flex items-center justify-between shadow-xs">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-white text-xs font-black">
                              {(el as any).props?.label?.charAt(0) || 'A'}
                            </div>
                            <span className="text-xs font-bold text-zinc-900 dark:text-white">
                              {(el as any).props?.label || 'Platform'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs font-medium text-zinc-500">
                            <span className="hover:text-blue-600 cursor-pointer">Dashboard</span>
                            <span className="hover:text-blue-600 cursor-pointer">Guides</span>
                            <span className="hover:text-blue-600 cursor-pointer">Settings</span>
                          </div>
                        </div>
                      )}

                      {(el as any).componentType === 'tabbar' && (
                        <div className="w-full h-full bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 px-6 flex items-center justify-around text-zinc-400">
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

                  {/* HOTSPOT PULSING BEACON */}
                  {el.type === 'hotspot' && (
                    <div className="w-full h-full relative flex items-center justify-center">
                      <div
                        className="absolute inset-0 rounded-full animate-ping opacity-75"
                        style={{ backgroundColor: (el as any).pulseColor || '#2563EB' }}
                      />
                      <div
                        className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-md text-[10px] text-white font-bold"
                        style={{ backgroundColor: (el as any).pulseColor || '#2563EB' }}
                      >
                        ●
                      </div>
                    </div>
                  )}

                  {/* SHORTCUT KEYCAP */}
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

                  {/* DEVICE BEZEL FRAMES */}
                  {el.type === 'device-frame' && (
                    <div
                      className="w-full h-full border-4 border-zinc-900 dark:border-zinc-800 relative flex flex-col overflow-hidden bg-white shadow-xl"
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
                      {/* BROWSER TOP BAR */}
                      {(el as any).deviceType === 'browser' && (
                        <div className="h-10 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-850 px-3 flex items-center gap-3 shrink-0">
                          <div className="flex gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          </div>
                          <div className="flex-1 max-w-sm h-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2 flex items-center text-[10px] text-zinc-500 font-mono">
                            🔒 https://app.acme.com/portal
                          </div>
                        </div>
                      )}

                      {/* TERMINAL TOP BAR */}
                      {(el as any).deviceType === 'terminal' && (
                        <div className="h-8 bg-zinc-950 px-3 flex items-center justify-between text-[10px] text-zinc-400 font-mono border-b border-zinc-800 shrink-0">
                          <div className="flex gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          </div>
                          <span className="text-zinc-500">bash — 80×24</span>
                          <span className="w-6" />
                        </div>
                      )}

                      {/* PHONE TOP BAR & NOTCH */}
                      {(el as any).deviceType === 'iphone' && (
                        <>
                          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-6 bg-zinc-950 rounded-full z-20 flex items-center justify-center">
                            <span className="w-2.5 h-2.5 rounded-full bg-zinc-900 mr-2" />
                            <span className="w-2 h-2 rounded-full bg-blue-950" />
                          </div>
                          <div className="h-10 border-b border-zinc-100 shrink-0 bg-zinc-50 flex items-center justify-between px-6 text-[10px] font-bold text-zinc-500">
                            <span>9:41</span>
                            <div className="flex gap-1.5">
                              <span>📶</span>
                              <span>🔋</span>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Frame inner content pane */}
                      <div className="flex-1 overflow-hidden relative" style={{ backgroundColor: (el as any).backgroundColor || '#FFFFFF' }}>
                        {/* Interactive hotspot link indicator in corner if configured */}
                        {el.linkToPageId && (
                          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-blue-600 text-white text-[9px] rounded font-bold uppercase shadow-sm">
                            🔗 Flow Link
                          </div>
                        )}
                      </div>
                    </div>
                  )}


                  {/* IMAGE PLACEMENT */}
                  {el.type === 'image' && (
                    <img
                      src={(el as any).url}
                      alt={el.name}
                      className="w-full h-full object-cover select-none pointer-events-none rounded-md"
                      style={{ filter: imageFilterString }}
                      referrerPolicy="no-referrer"
                    />
                  )}

                  {/* CONTAINER / FRAME PANEL */}
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

                  {/* RESIZE INTERACTIVE HANDLES ON SELECTED ELEMENT */}
                  {isSelected && !el.locked && (
                    <>
                      {/* Corner anchor node buttons */}
                      <div
                        onMouseDown={(e) => handleResizeMouseDown(e, el, 'tl')}
                        className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-blue-600 rounded-sm cursor-nwse-resize z-30 shadow-xs"
                      />
                      <div
                        onMouseDown={(e) => handleResizeMouseDown(e, el, 'tr')}
                        className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-blue-600 rounded-sm cursor-nesw-resize z-30 shadow-xs"
                      />
                      <div
                        onMouseDown={(e) => handleResizeMouseDown(e, el, 'bl')}
                        className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-blue-600 rounded-sm cursor-nesw-resize z-30 shadow-xs"
                      />
                      <div
                        onMouseDown={(e) => handleResizeMouseDown(e, el, 'br')}
                        className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-blue-600 rounded-sm cursor-nwse-resize z-30 shadow-xs"
                      />
                      {/* Lateral edges anchor nodes */}
                      <div
                        onMouseDown={(e) => handleResizeMouseDown(e, el, 'n')}
                        className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-1.5 bg-white border-2 border-blue-600 rounded-sm cursor-ns-resize z-30 shadow-xs"
                      />
                      <div
                        onMouseDown={(e) => handleResizeMouseDown(e, el, 's')}
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1.5 bg-white border-2 border-blue-600 rounded-sm cursor-ns-resize z-30 shadow-xs"
                      />
                      <div
                        onMouseDown={(e) => handleResizeMouseDown(e, el, 'e')}
                        className="absolute top-1/2 -translate-y-1/2 -right-1 w-1.5 h-4 bg-white border-2 border-blue-600 rounded-sm cursor-ew-resize z-30 shadow-xs"
                      />
                      <div
                        onMouseDown={(e) => handleResizeMouseDown(e, el, 'w')}
                        className="absolute top-1/2 -translate-y-1/2 -left-1 w-1.5 h-4 bg-white border-2 border-blue-600 rounded-sm cursor-ew-resize z-30 shadow-xs"
                      />
                    </>
                  )}
                </div>
              );
            })}

          {/* Render ongoing Lasso Selection box */}
          {lassoBox && lassoBox.w !== 0 && lassoBox.h !== 0 && (
            <div
              className="absolute border border-blue-500 bg-blue-500/10 z-30 pointer-events-none rounded-xs"
              style={{
                left: `${Math.min(lassoBox.x, lassoBox.x + lassoBox.w)}px`,
                top: `${Math.min(lassoBox.y, lassoBox.y + lassoBox.h)}px`,
                width: `${Math.abs(lassoBox.w)}px`,
                height: `${Math.abs(lassoBox.h)}px`,
              }}
            />
          )}

          {/* Render ongoing Pen strokes path visualization */}
          {drawPoints.length > 0 && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-30">
              <polyline
                points={drawPoints.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke={activeTool === 'highlighter' ? '#FEE2E2' : '#3B82F6'}
                strokeWidth={activeTool === 'highlighter' ? 12 : 3}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={activeTool === 'highlighter' ? 0.5 : 1}
              />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}
