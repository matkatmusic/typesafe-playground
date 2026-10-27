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

export function attachResizer(handle: HTMLElement, firstBox: HTMLElement, container: HTMLElement): void {
  let isDragging = false;
  let startPointer = 0;
  let startSize = 0;
  function initDrag(event: PointerEvent): void {
    handle.setPointerCapture(event.pointerId);
    isDragging = true;
    startPointer = event.clientX;
    startSize = firstBox.getBoundingClientRect().width;
  }
  function moveDrag(event: PointerEvent): void {
    if (!isDragging)
      return;
    const containerWidth = container.getBoundingClientRect().width;
    const handleWidth = handle.getBoundingClientRect().width;
    const width = computeDraggedSize(startSize, event.clientX - startPointer, containerWidth, handleWidth, MIN_COLUMN_WIDTH);
    firstBox.style.width = width + 'px';
  }
  function closeDrag(event: PointerEvent): void {
    isDragging = false;
    handle.releasePointerCapture(event.pointerId);
  }
  handle.addEventListener('pointerdown', initDrag);
  handle.addEventListener('pointermove', moveDrag);
  handle.addEventListener('pointerup', closeDrag);
}
