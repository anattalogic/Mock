import { CanvasElement } from '../types';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  minX?: number;
  minY?: number;
  maxX?: number;
  maxY?: number;
}

export interface GroupMeta {
  id: string;
  name: string;
  elementIds: string[];
  elements: CanvasElement[];
  elementsCount: number;
  bbox: BoundingBox;
  locked: boolean;
  isLocked: boolean;
  hidden: boolean;
  isHidden: boolean;
  opacity: number;
}

/**
 * Calculates the bounding box enclosing a list of elements
 */
export function getBoundingBox(elements: CanvasElement[]): BoundingBox {
  if (elements.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0, minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }

  const minX = Math.min(...elements.map((el) => el.x));
  const minY = Math.min(...elements.map((el) => el.y));
  const maxX = Math.max(...elements.map((el) => el.x + el.width));
  const maxY = Math.max(...elements.map((el) => el.y + el.height));

  return {
    x: minX,
    y: minY,
    minX,
    minY,
    maxX,
    maxY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY),
  };
}

/**
 * Merge multiple elements into a single group entity
 */
export function groupSelectedElements(
  elements: CanvasElement[],
  selectedIds: string[],
  customName?: string
): { updatedElements: CanvasElement[]; groupId: string; groupName: string } {
  if (selectedIds.length <= 1) {
    return { updatedElements: elements, groupId: '', groupName: '' };
  }

  const groupId = `group-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const groupName = customName || `Group (${selectedIds.length} items)`;

  const updatedElements = elements.map((el) => {
    if (selectedIds.includes(el.id)) {
      return {
        ...el,
        groupId,
        groupName,
      };
    }
    return el;
  });

  return { updatedElements, groupId, groupName };
}

export function groupElements(
  elements: CanvasElement[],
  selectedIds: string[],
  customName?: string
): CanvasElement[] {
  return groupSelectedElements(elements, selectedIds, customName).updatedElements;
}

/**
 * Ungroup elements belonging to target group(s) or selected element IDs
 */
export function ungroupSelectedElements(
  elements: CanvasElement[],
  targetIds: string[]
): { updatedElements: CanvasElement[]; ungroupedCount: number } {
  // Find which groupIds are represented among the targets
  const targetGroupIds = new Set<string>();
  elements.forEach((el) => {
    if (targetIds.includes(el.id) && el.groupId) {
      targetGroupIds.add(el.groupId);
    }
  });

  if (targetGroupIds.size === 0) {
    return { updatedElements: elements, ungroupedCount: 0 };
  }

  let count = 0;
  const updatedElements = elements.map((el) => {
    if (el.groupId && targetGroupIds.has(el.groupId)) {
      count++;
      const { groupId, groupName, ...rest } = el;
      return rest as CanvasElement;
    }
    return el;
  });

  return { updatedElements, ungroupedCount: count };
}

export function ungroupElements(
  elements: CanvasElement[],
  targetIds: string[]
): CanvasElement[] {
  return ungroupSelectedElements(elements, targetIds).updatedElements;
}

/**
 * Collect all active groups with their metadata from a list of elements
 */
export function getGroupsInPage(elements: CanvasElement[]): GroupMeta[] {
  const groupMap = new Map<string, CanvasElement[]>();

  elements.forEach((el) => {
    if (el.groupId) {
      const list = groupMap.get(el.groupId) || [];
      list.push(el);
      groupMap.set(el.groupId, list);
    }
  });

  const groups: GroupMeta[] = [];
  groupMap.forEach((groupEls, id) => {
    const bbox = getBoundingBox(groupEls);
    const allLocked = groupEls.every((el) => el.locked);
    const allHidden = groupEls.every((el) => el.hidden);
    const avgOpacity = groupEls.reduce((sum, el) => sum + (el.opacity ?? 1), 0) / groupEls.length;
    const name = groupEls[0]?.groupName || `Group (${groupEls.length} items)`;

    groups.push({
      id,
      name,
      elementIds: groupEls.map((el) => el.id),
      elements: groupEls,
      elementsCount: groupEls.length,
      bbox,
      locked: allLocked,
      isLocked: allLocked,
      hidden: allHidden,
      isHidden: allHidden,
      opacity: avgOpacity,
    });
  });

  return groups;
}

/**
 * Scale and reposition a collection of elements proportionally when resizing a group / multi-selection
 */
export function scaleElementsProportionally(
  elements: CanvasElement[],
  origBBox: BoundingBox,
  newBBox: BoundingBox
): CanvasElement[] {
  if (origBBox.width <= 0 || origBBox.height <= 0 || newBBox.width <= 0 || newBBox.height <= 0) {
    return elements;
  }

  const scaleX = newBBox.width / origBBox.width;
  const scaleY = newBBox.height / origBBox.height;

  return elements.map((el) => {
    const relX = (el.x - origBBox.x) / origBBox.width;
    const relY = (el.y - origBBox.y) / origBBox.height;

    const newX = newBBox.x + relX * newBBox.width;
    const newY = newBBox.y + relY * newBBox.height;
    const newW = Math.max(4, el.width * scaleX);
    const newH = Math.max(4, el.height * scaleY);

    const updated = {
      ...el,
      x: newX,
      y: newY,
      width: newW,
      height: newH,
    };

    // Scale font size proportionally for text elements
    if (el.type === 'text') {
      const fontScale = Math.min(scaleX, scaleY);
      const newFontSize = Math.max(6, Math.round(el.fontSize * fontScale));
      (updated as any).fontSize = newFontSize;
    }

    // Scale stroke points proportionally for drawing elements
    if (el.type === 'drawing' && el.points) {
      (updated as any).points = el.points.map((pt) => ({
        x: pt.x * scaleX,
        y: pt.y * scaleY,
      }));
    }

    return updated as CanvasElement;
  });
}

/**
 * Toggles visibility for all elements in a group
 */
export function toggleGroupVisibility(
  elements: CanvasElement[],
  groupId: string,
  targetHiddenState?: boolean
): CanvasElement[] {
  const currentGroup = elements.filter((el) => el.groupId === groupId);
  const shouldHide = targetHiddenState !== undefined ? targetHiddenState : !currentGroup.every((el) => el.hidden);

  return elements.map((el) => {
    if (el.groupId === groupId) {
      return { ...el, hidden: shouldHide };
    }
    return el;
  });
}

export const toggleGroupHide = toggleGroupVisibility;

/**
 * Toggles lock state for all elements in a group
 */
export function toggleGroupLock(
  elements: CanvasElement[],
  groupId: string,
  targetLockState?: boolean
): CanvasElement[] {
  const currentGroup = elements.filter((el) => el.groupId === groupId);
  const shouldLock = targetLockState !== undefined ? targetLockState : !currentGroup.every((el) => el.locked);

  return elements.map((el) => {
    if (el.groupId === groupId) {
      return { ...el, locked: shouldLock };
    }
    return el;
  });
}

/**
 * Sets uniform opacity for all elements in a group
 */
export function setGroupOpacity(
  elements: CanvasElement[],
  groupId: string,
  opacity: number
): CanvasElement[] {
  return elements.map((el) => {
    if (el.groupId === groupId) {
      return { ...el, opacity };
    }
    return el;
  });
}

/**
 * Renames a group entity
 */
export function renameGroup(
  elements: CanvasElement[],
  groupId: string,
  newName: string
): CanvasElement[] {
  return elements.map((el) => {
    if (el.groupId === groupId) {
      return { ...el, groupName: newName };
    }
    return el;
  });
}
