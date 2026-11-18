import type { Answer } from '../graphs/graphTypes';
import { listWinnerGroups } from '../runs/winners';

function findWinningGroup(answers: Answer[]) {
    const groups = listWinnerGroups(answers);
    let winningGroup = groups[0];
    for (const group of groups) {
        const hasMoreRuns = group.runs.length > winningGroup.runs.length;
        if (hasMoreRuns)
            winningGroup = group;
    }
    return winningGroup;
}

export function readWinningKey(answers: Answer[], keys: string[]): string {
    const winningGroup = findWinningGroup(answers);
    let isKeyCharted = false;
    for (const key of keys) {
        const isWinningKey = key === winningGroup.key;
        if (isWinningKey)
            isKeyCharted = true;
    }
    if (!isKeyCharted)
        return keys[0];
    return winningGroup.key;
}
