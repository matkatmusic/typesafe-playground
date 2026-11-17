import { test, expect } from 'bun:test'
import { attachResizer, computeDraggedSize, MIN_COLUMN_WIDTH } from './resizer'

type Listener = (event: unknown) => void

function makeFakeElement(width: number, height: number) {
    const listeners: Record<string, Listener> = {}
    return {
        listeners,
        style: {} as Record<string, string>,
        addEventListener(type: string, listener: Listener) {
            listeners[type] = listener
        },
        setPointerCapture() {},
        releasePointerCapture() {},
        getBoundingClientRect() {
            return { width, height }
        },
    }
}

function asElement(fake: ReturnType<typeof makeFakeElement>) {
    return fake as unknown as HTMLElement
}

function validateColumnDragMovesAndClamps() {
    expect(computeDraggedSize(400, -100, 1000, 12, MIN_COLUMN_WIDTH)).toBe(300)
    expect(computeDraggedSize(400, -500, 1000, 12, MIN_COLUMN_WIDTH)).toBe(240)
    expect(computeDraggedSize(400, 900, 1000, 12, MIN_COLUMN_WIDTH)).toBe(748)
}

function validateTinyContainerKeepsMinimum() {
    expect(computeDraggedSize(100, 10, 100, 8, MIN_COLUMN_WIDTH)).toBe(240)
}

function validateColumnPointerDragSetsWidth() {
    const handle = makeFakeElement(12, 600)
    const firstBox = makeFakeElement(400, 600)
    const container = makeFakeElement(1000, 600)
    attachResizer(asElement(handle), asElement(firstBox), asElement(container), 'columns')
    handle.listeners.pointermove({ clientX: 50, clientY: 0 })
    expect(firstBox.style.width).toBeUndefined()
    handle.listeners.pointerdown({ pointerId: 1, clientX: 100, clientY: 0 })
    handle.listeners.pointermove({ clientX: 0, clientY: 0 })
    expect(firstBox.style.width).toBe('300px')
    handle.listeners.pointermove({ clientX: -900, clientY: 0 })
    expect(firstBox.style.width).toBe('240px')
    handle.listeners.pointerup({ pointerId: 1 })
    handle.listeners.pointermove({ clientX: 500, clientY: 0 })
    expect(firstBox.style.width).toBe('240px')
}

function validateRowPointerDragSetsHeightAndKeepsEightyPixels() {
    const handle = makeFakeElement(600, 8)
    const firstBox = makeFakeElement(600, 200)
    const container = makeFakeElement(600, 600)
    attachResizer(asElement(handle), asElement(firstBox), asElement(container), 'rows')
    handle.listeners.pointerdown({ pointerId: 1, clientX: 0, clientY: 300 })
    handle.listeners.pointermove({ clientX: 0, clientY: 350 })
    expect(firstBox.style.height).toBe('250px')
    expect(firstBox.style.width).toBeUndefined()
    handle.listeners.pointermove({ clientX: 0, clientY: -900 })
    expect(firstBox.style.height).toBe('80px')
    handle.listeners.pointermove({ clientX: 0, clientY: 5000 })
    expect(firstBox.style.height).toBe('512px')
}

test('test_column_drag_moves_and_clamps_to_240px', validateColumnDragMovesAndClamps)
test('test_tiny_container_keeps_the_minimum_size', validateTinyContainerKeepsMinimum)
test('test_column_pointer_drag_sets_width_and_stops_on_pointer_up', validateColumnPointerDragSetsWidth)
test('test_row_pointer_drag_sets_height_and_keeps_80px_each_side', validateRowPointerDragSetsHeightAndKeepsEightyPixels)
