import type { Question } from '@typesafe-ai/sdk';
import type { Answer } from './graphTypes';

export type InfoPart = [text: string, className: string];
export interface LabelPoint { x: number; y: number }
export interface InfoRow { label: string; parts: InfoPart[] }
// callIndex: null = nothing hovered (blank box), -1 = the average bar, 0..n-1 = a call bar
export interface BarInfoRequest { question: Question; answers: Answer[]; key: string; keys: string[]; callIndex: number | null }
export interface HoverTracker { block: HTMLElement; shownHit: Element | null }
export interface HoverContext {
  tracker: HoverTracker; svg: Element; hit: Element; request: BarInfoRequest;
  values: number[]; slotX: number; plotH: number; isAverageShown: boolean;
}
