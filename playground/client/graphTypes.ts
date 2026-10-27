import type { Question } from '@typesafe-ai/sdk';
import type { RunOutput } from '../playgroundHistory';

export type Answer = RunOutput['answers'][string];
export type ProbabilityTable = Readonly<Record<string, number>>;
export type SvgAttributes = Record<string, string | number>;
export type RenderCallback = () => void;
export interface Summary { low: number; high: number; average: number }
export interface BarGeometry { x: number; y: number; width: number; height: number }
export interface RangeLineGeometry { x: number; y1: number; y2: number }
export interface GraphBlock { block: HTMLDivElement; box: HTMLDivElement }
export interface ChartLayout {
  name: string;
  block: HTMLElement;
  box: HTMLElement;
  svg: Element;
  question: Question;
  answers: Answer[];
  keys: string[];
  slot: number;
  plotH: number;
  isAverageShown: boolean;
}
export type ChartsHook = (charts: ChartLayout[]) => void;
