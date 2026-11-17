export type ResizerDirection = 'rows' | 'columns';

export const MIN_ROW_HEIGHT = 80;
export const MIN_COLUMN_WIDTH = 240;

export function computeDraggedSize(startSize: number, pointerDelta: number, containerSize: number, handleSize: number, minimumSize: number): number {
  const largestSize = Math.max(containerSize - handleSize - minimumSize, minimumSize);
  const draggedSize = startSize + pointerDelta;
  if (draggedSize > largestSize)
    return largestSize;
  if (draggedSize < minimumSize)
    return minimumSize;
  return draggedSize;
}

interface ResizerState {
  handle: HTMLElement;
  firstBox: HTMLElement;
  container: HTMLElement;
  isColumns: boolean;
  minimumSize: number;
  isDragging: boolean;
  startPointer: number;
  startSize: number;
}

function readPointer(state: ResizerState, event: PointerEvent): number {
  return state.isColumns ? event.clientX : event.clientY;
}

function readSize(state: ResizerState, element: HTMLElement): number {
  const rect = element.getBoundingClientRect();
  return state.isColumns ? rect.width : rect.height;
}

function initDrag(state: ResizerState, event: PointerEvent): void {
  state.handle.setPointerCapture(event.pointerId);
  state.isDragging = true;
  state.startPointer = readPointer(state, event);
  state.startSize = readSize(state, state.firstBox);
}

function moveDrag(state: ResizerState, event: PointerEvent): void {
  if (!state.isDragging)
    return;
  const pointerDelta = readPointer(state, event) - state.startPointer;
  const size = computeDraggedSize(state.startSize, pointerDelta, readSize(state, state.container), readSize(state, state.handle), state.minimumSize);
  if (state.isColumns)
    state.firstBox.style.width = size + 'px';
  else
    state.firstBox.style.height = size + 'px';
}

function closeDrag(state: ResizerState, event: PointerEvent): void {
  state.isDragging = false;
  state.handle.releasePointerCapture(event.pointerId);
}

export function attachResizer(handle: HTMLElement, firstBox: HTMLElement, container: HTMLElement, direction: ResizerDirection): void {
  const isColumns = direction === 'columns';
  const minimumSize = isColumns ? MIN_COLUMN_WIDTH : MIN_ROW_HEIGHT;
  const state: ResizerState = { handle, firstBox, container, isColumns, minimumSize, isDragging: false, startPointer: 0, startSize: 0 };
  handle.addEventListener('pointerdown', initDrag.bind(null, state));
  handle.addEventListener('pointermove', moveDrag.bind(null, state));
  handle.addEventListener('pointerup', closeDrag.bind(null, state));
}
