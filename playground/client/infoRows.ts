import type { Answer } from './graphTypes';
import type { BarInfoRequest, InfoPart, InfoRow } from './infoTypes';
import { computeSummary, listValues } from './graphValues';
import { readConfidence, readDescription, readTopKey } from './infoValues';

const LABEL = 'info-label';
const VALUE = 'info-value';
const NUMBER = 'info-value info-num';

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

export function buildBarInfoRows(request: BarInfoRequest): InfoRow[] {
  const { question, answers, key, keys, callIndex } = request;
  const isBarShown = callIndex !== null;
  let messageText = '';
  let scoreText = '';
  let confidenceText: string | null = answers[0].type === 'noul' ? null : '';
  let lowText = '';
  let highText = '';
  let averageText = '';
  let topCountText = '';
  if (isBarShown) {
    const values = listValues(answers, key);
    const stat = computeSummary(values);
    messageText = readDescription(question, key);
    lowText = formatThreeDecimals(stat.low);
    highText = formatThreeDecimals(stat.high);
    averageText = formatThreeDecimals(stat.average);
    scoreText = formatThreeDecimals(callIndex === -1 ? stat.average : values[callIndex]);
    confidenceText = formatConfidenceText(answers, callIndex);
    topCountText = String(countTopRuns(answers, keys, key));
  }
  const rows: InfoRow[] = [];
  rows.push({ label: 'Choice:', parts: [[isBarShown ? key : '', VALUE]] });
  rows.push({ label: 'Score:', parts: listScoreParts(scoreText, confidenceText) });
  rows.push({ label: 'Range:', parts: listRangeParts(lowText, highText, averageText) });
  if (isBarShown)
    rows.push({ label: 'Top choice in', parts: [[topCountText, VALUE], [' of ', LABEL], [String(answers.length), VALUE], [' runs', LABEL]] });
  rows.push({ label: 'Message:', parts: [[messageText, VALUE]] });
  return rows;
}
