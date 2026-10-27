import type { Version } from '../playgroundHistory';
import type { ChartLayout, ChartsHook, GraphBlock, RenderCallback } from './graphTypes';
import { renderChart } from './graphChart';
import { createGraphBlock } from './graphBlock';
import { computePlotHeight } from './graphGeometry';
import { graphState } from './graphState';
import { listAnswers, readQuestions } from './graphValues';
import { findPinned, readPinnedData } from './pinned';
import { pageState } from './state';

export const EMPTY_MESSAGE = 'Submit a run to generate a graph';

export function isRunDataPresent(version: Version, name: string): boolean {
  const hasOutputs = version.outputs.length > 0;
  if (!hasOutputs)
    return false;
  return version.outputs[0].answers[name] !== undefined;
}

function fillEmptyMessage(box: HTMLElement): void {
  box.classList.add('empty');
  box.textContent = EMPTY_MESSAGE;
}

// The InfoBox can make a block taller after the chart was measured, so draw those charts again.
export function renderStaleCharts(charts: ChartLayout[], onRendered?: ChartsHook): void {
  const redrawn: ChartLayout[] = [];
  for (const chart of charts) {
    const isStale = computePlotHeight(chart.box.clientHeight) !== chart.plotH;
    if (isStale)
      redrawn.push(renderChart({ block: chart.block as HTMLDivElement, box: chart.box as HTMLDivElement }, chart.name, chart.question, chart.answers, chart.pinned));
  }
  const hasRedrawn = redrawn.length > 0;
  if (!hasRedrawn)
    return;
  if (onRendered !== undefined)
    onRendered(redrawn);
}

export function renderGraphs(version: Version, container: HTMLElement, onRendered?: ChartsHook): void {
  const questions = readQuestions(version);
  function renderAgain(): void {
    renderGraphs(version, container, onRendered);
  }
  container.replaceChildren();
  const names = Object.keys(questions);
  const blocks: GraphBlock[] = [];
  for (let i = 0; i < names.length; i++) {
    const graphBlock = createGraphBlock(i + 1, names[i], questions[names[i]], renderAgain, version);
    container.appendChild(graphBlock.block);
    blocks.push(graphBlock);
  }
  const charts: ChartLayout[] = [];
  const pinnedVersion = findPinned(pageState.versions, pageState.pinnedId);
  for (let i = 0; i < names.length; i++) {
    const isDataPresent = isRunDataPresent(version, names[i]);
    const isCollapsed = graphState.collapsedByName[names[i]] === true;
    if (!isDataPresent)
      fillEmptyMessage(blocks[i].box);
    else if (!isCollapsed)
      charts.push(renderChart(blocks[i], names[i], questions[names[i]], listAnswers(version, names[i]), readPinnedData(pinnedVersion, names[i])));
  }
  if (onRendered !== undefined)
    onRendered(charts);
  renderStaleCharts(charts, onRendered);
}

export function initGraphs(container: HTMLElement, renderShownGraphs: RenderCallback): void {
  const observer = new ResizeObserver(renderShownGraphs);
  observer.observe(container);
}
