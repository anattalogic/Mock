export type ElementType =
  | 'text'
  | 'rectangle'
  | 'circle'
  | 'triangle'
  | 'star'
  | 'line'
  | 'arrow'
  | 'frame'
  | 'device-frame'
  | 'drawing'
  | 'sticky'
  | 'callout'
  | 'step-indicator'
  | 'connector'
  | 'image'
  | 'ui-component'
  | 'hotspot'
  | 'keycap';

export interface Point {
  x: number;
  y: number;
}

export type DeviceType = 'iphone' | 'ipad' | 'desktop' | 'browser' | 'android' | 'watch' | 'terminal';

export interface BaseElement {
  id: string;
  type: ElementType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  locked: boolean;
  hidden: boolean;
  zIndex: number;
  groupId?: string;
  groupName?: string;
  linkToPageId?: string; // Interactive hotspot link in presentation mode
}

export interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  fontColor: string;
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline' | 'line-through';
  align: 'left' | 'center' | 'right' | 'justify';
  backgroundColor?: string;
  lineHeight: number;
  letterSpacing: number;
}

export interface ShapeElement extends BaseElement {
  type: 'rectangle' | 'circle' | 'triangle' | 'star' | 'line' | 'arrow';
  fillColor: string;
  fillGradient?: {
    type: 'linear' | 'radial';
    colors: { offset: number; color: string }[];
  };
  strokeColor: string;
  strokeWidth: number;
  strokeDasharray?: string;
  cornerRadius?: number; // for rounded rectangles
  starPoints?: number; // for stars (e.g. 5)
  arrowEnd?: 'none' | 'single' | 'double';
}

export interface FrameElement extends BaseElement {
  type: 'frame';
  backgroundColor: string;
  cornerRadius: number;
  borderWidth: number;
  borderStyle: 'solid' | 'dashed' | 'dotted';
  borderColor: string;
  shadowEnabled: boolean;
  shadowX: number;
  shadowY: number;
  shadowBlur: number;
  shadowColor: string;
  clipContent: boolean;
}

export interface DeviceFrameElement extends BaseElement {
  type: 'device-frame';
  deviceType: DeviceType;
  backgroundColor: string;
  orientation: 'portrait' | 'landscape';
}

export interface DrawingElement extends BaseElement {
  type: 'drawing';
  points: Point[];
  strokeColor: string;
  strokeWidth: number;
  isHighlighter?: boolean;
}

export interface StickyElement extends BaseElement {
  type: 'sticky';
  text: string;
  color: 'yellow' | 'blue' | 'pink' | 'green' | 'purple';
  author?: string;
}

export interface CalloutElement extends BaseElement {
  type: 'callout';
  text: string;
  pointerDirection: 'top' | 'right' | 'bottom' | 'left';
  backgroundColor: string;
  textColor: string;
}

export interface StepIndicatorElement extends BaseElement {
  type: 'step-indicator';
  stepNumber: number;
  title: string;
  description: string;
  status: 'completed' | 'active' | 'inactive';
}

export interface ConnectorElement extends BaseElement {
  type: 'connector';
  startElementId: string;
  endElementId: string;
  lineStyle: 'straight' | 'curved' | 'orthogonal';
  strokeColor: string;
  strokeWidth: number;
  strokeDasharray?: string;
}

export interface ImageElement extends BaseElement {
  type: 'image';
  url: string;
  brightness: number; // 0-200
  contrast: number; // 0-200
  saturation: number; // 0-200
  blur: number; // 0-20
  grayscale: number; // 0-100
}

export type UIComponentVariant =
  | 'button-primary'
  | 'button-secondary'
  | 'input-text'
  | 'input-search'
  | 'toggle-switch'
  | 'checkbox'
  | 'metric-card'
  | 'user-card'
  | 'navbar'
  | 'tabbar'
  | 'alert-banner'
  | 'badge-pill'
  | 'breadcrumb';

export interface UIComponentElement extends BaseElement {
  type: 'ui-component';
  componentType: UIComponentVariant;
  props: {
    label?: string;
    sublabel?: string;
    value?: string | number;
    placeholder?: string;
    isActive?: boolean;
    color?: string;
    icon?: string;
    badgeText?: string;
  };
}

export interface HotspotElement extends BaseElement {
  type: 'hotspot';
  label: string;
  pulseColor: string;
}

export interface KeycapElement extends BaseElement {
  type: 'keycap';
  keys: string[]; // e.g. ['Ctrl', 'Shift', 'P']
  label?: string;
}

export type CanvasElement =
  | TextElement
  | ShapeElement
  | FrameElement
  | DeviceFrameElement
  | DrawingElement
  | StickyElement
  | CalloutElement
  | StepIndicatorElement
  | ConnectorElement
  | ImageElement
  | UIComponentElement
  | HotspotElement
  | KeycapElement;

export interface Page {
  id: string;
  name: string;
  width: number;
  height: number;
  backgroundColor: string;
  elements: CanvasElement[];
  isCover?: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  pages: Page[];
  createdAt: string;
  updatedAt: string;
}

export type ToolType =
  | 'select'
  | 'text'
  | 'rectangle'
  | 'circle'
  | 'triangle'
  | 'star'
  | 'line'
  | 'arrow'
  | 'pen'
  | 'highlighter'
  | 'sticky'
  | 'callout'
  | 'step-indicator'
  | 'connector'
  | 'image'
  | 'frame'
  | 'device-frame'
  | 'hotspot'
  | 'keycap'
  | 'ui-component';

export interface Guide {
  id: string;
  type: 'horizontal' | 'vertical';
  position: number; // position in pixels
}

export type AlignmentType =
  | 'left'
  | 'center'
  | 'right'
  | 'top'
  | 'middle'
  | 'bottom'
  | 'distribute-h'
  | 'distribute-v';

