import type { Question } from '@typesafe-ai/sdk';
import type { Answer } from '../graphs/graphTypes';
import { listOptionKeys } from '../graphs/graphValues';
import { readDescription, readTopKey } from '../infoBox/infoValues';

export interface WinnerGroup { key: string; runs: number[] }

function findWinnerGroup(groups: WinnerGroup[], key: string): WinnerGroup | undefined {
    let group: WinnerGroup | undefined = undefined;
    for (const candidate of groups) {
        const isSameKey = candidate.key === key;
        if (isSameKey)
            group = candidate;
    }
    return group;
}

export function listWinnerGroups(answers: Answer[]): WinnerGroup[] {
    const groups: WinnerGroup[] = [];
    for (let i = 0; i < answers.length; i++) {
        const topKey = readTopKey(answers[i], listOptionKeys(answers[i]));
        const group = findWinnerGroup(groups, topKey);
        if (group === undefined)
            groups.push({ key: topKey, runs: [i + 1] });
        else
            group.runs.push(i + 1);
    }
    return groups;
}

export function formatWinnerLine(question: Question, group: WinnerGroup): string {
    return readDescription(question, group.key) + ' (' + group.runs.join(',') + ')';
}
