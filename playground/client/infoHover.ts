import type { HoverContext, HoverTracker } from './infoTypes';
import { createBarInfoBox } from './infoDom';
import { removeValueLabels, renderValueLabels } from './infoLabels';
import { buildBarInfoRows } from './infoRows';

export const HIT_STROKE_COLOR = 'hotpink';

export function updateShownInfo(tracker: HoverTracker, info: HTMLElement, hit: Element | null): void {
  const shown = tracker.block.querySelector('.bar-info');
  if (shown !== null)
    shown.remove();
  tracker.block.appendChild(info);
  if (tracker.shownHit !== null)
    tracker.shownHit.removeAttribute('stroke');
  tracker.shownHit = hit;
  if (hit !== null)
    hit.setAttribute('stroke', HIT_STROKE_COLOR);
}

export function attachHover(context: HoverContext): void {
  const { tracker, svg, hit, request, values, slotX, plotH, isAverageShown } = context;
  function updateOnEnter(): void {
    const info = createBarInfoBox(buildBarInfoRows(request));
    updateShownInfo(tracker, info, hit);
    renderValueLabels(svg, values, slotX, plotH, isAverageShown);
  }
  function removeOnLeave(): void {
    removeValueLabels(svg);
  }
  hit.addEventListener('mouseenter', updateOnEnter);
  hit.addEventListener('mouseleave', removeOnLeave);
}
