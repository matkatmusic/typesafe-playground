import type { Answer } from '../graphs/graphTypes';
import type { BarInfoRequest, InfoPart, InfoRow } from './infoTypes';
import { computeSummary, listValues } from '../graphs/graphValues';
import { readConfidence, readDescription, readTopKey } from './infoValues';
import { getShownVersion, pageState } from '../page/state';
import { buildTextFormatter } from '../runs/winnersDom';

const LABEL = 'info-label';
const VALUE = 'info-value';
const MESSAGE = 'info-value info-message';
const NUMBER ='info-value info-num';

function formatThreeDecimals(value: number): string {
  return value.toFixed(3);
}

function listRangeParts(lowText: string, highText: string, averageText: string): InfoPart[] {
  return [['min: ', LABEL], [lowText, NUMBER], ['  max: ', LABEL], [highText, NUMBER], ['  avg: ', LABEL], [averageText, NUMBER]];
}

function listScoreParts(scoreText: string, confidenceText: string | null): InfoPart[] {
  if (confidenceText === null)
    return [[scoreText, NUMBER]];
  return [[scoreText, NUMBER], ['  Confidence: ', LABEL], [confidenceText, NUMBER]];
}

function computeAverageConfidence(answers: Answer[]): number {
  let confidenceSum = 0;
  for (const answer of answers)
    confidenceSum += readConfidence(answer);
  return confidenceSum / answers.length;
}

function formatConfidenceText(answers: Answer[], callIndex: number): string | null {
  if (answers[0].type === 'noul')
    return null;
  if (callIndex === -1)
    return formatThreeDecimals(computeAverageConfidence(answers));
  return formatThreeDecimals(readConfidence(answers[callIndex]));
}

function countTopRuns(answers: Answer[], keys: string[], key: string): number {
  let topCount = 0;
  for (const answer of answers) {
    const topKey = readTopKey(answer, keys);
    if (topKey === key)
      topCount++;
  }
  return topCount;
}

interface BarTexts {
  shownKey: string;
  messageText: string;
  scoreText: string;
  confidenceText: string | null;
  lowText: string;
  highText: string;
  averageText: string;
  topCountText: string;
}

function buildHiddenBarTexts(answers: Answer[]): BarTexts {
  const confidenceText = answers[0].type === 'noul' ? null : '';
  return { shownKey: '', messageText: '', scoreText: '', confidenceText, lowText: '', highText: '', averageText: '', topCountText: '' };
}

function buildShownBarTexts(request: BarInfoRequest, callIndex: number): BarTexts {
  const { question, answers, key, keys } = request;
  const values = listValues(answers, key);
  const stat = computeSummary(values);
  const scoreValue = callIndex === -1 ? stat.average : values[callIndex];
  const shownKey = answers[0].type === 'noul' ? readTopKey({ type: 'noul', noul: scoreValue }, keys) : key;
  const messageText = buildTextFormatter(getShownVersion(), question)(readDescription(question, shownKey));
  const scoreText = formatThreeDecimals(scoreValue);
  const confidenceText = formatConfidenceText(answers, callIndex);
  const topCountText = String(countTopRuns(answers, keys, shownKey));
  const lowText = formatThreeDecimals(stat.low);
  const highText = formatThreeDecimals(stat.high);
  const averageText = formatThreeDecimals(stat.average);
  return { shownKey, messageText, scoreText, confidenceText, lowText, highText, averageText, topCountText };
}

function buildPinnedRow(pinned: NonNullable<BarInfoRequest['pinned']>): InfoRow {
  const pinnedStat = computeSummary(pinned.values);
  const pinnedParts = listRangeParts(formatThreeDecimals(pinnedStat.low), formatThreeDecimals(pinnedStat.high), formatThreeDecimals(pinnedStat.average));
  if (pageState.pinnedIndex === null)
    throw new Error('a pinned row needs a pinned version');
  return { label: `Pinned v${pageState.pinnedIndex + 1}:`, parts: pinnedParts };
}

function buildShownOnlyRows(request: BarInfoRequest, texts: BarTexts): InfoRow[] {
  const { answers, pinned } = request;
  const rows: InfoRow[] = [];
  rows.push({ label: 'Top choice in', parts: [[texts.topCountText, VALUE], [' of ', LABEL], [String(answers.length), VALUE], [' runs', LABEL]] });
  if (pinned !== null)
    rows.push(buildPinnedRow(pinned));
  return rows;
}

export function buildBarInfoRows(request: BarInfoRequest): InfoRow[] {
  const { answers, callIndex } = request;
  const isBarShown = callIndex !== null;
  const texts = isBarShown ? buildShownBarTexts(request, callIndex) : buildHiddenBarTexts(answers);
  const rows: InfoRow[] = [];
  rows.push({ label: 'Choice:', parts: [[texts.shownKey, VALUE]] });
  rows.push({ label: 'Score:', parts: listScoreParts(texts.scoreText, texts.confidenceText) });
  rows.push({ label: 'Range:', parts: listRangeParts(texts.lowText, texts.highText, texts.averageText) });
  if (isBarShown)
    rows.push(...buildShownOnlyRows(request, texts));
  rows.push({ label: 'Message:', parts: [[texts.messageText, MESSAGE]] });
  return rows;
}
