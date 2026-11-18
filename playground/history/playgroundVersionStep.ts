import type { Version } from './playgroundHistory';
import { getHardCodedQuestions, getHardCodedState } from '../providers/typeSafeQuery';

export type VersionStep = 'keep' | 'overwrite' | 'create';

export function isInputUnchanged(version: Version, state: unknown, questions: unknown): boolean {
    const versionStateText = JSON.stringify(version.state);
    const stateText = JSON.stringify(state);
    const isStateSame = versionStateText === stateText;
    if (!isStateSame)
        return false;
    const versionQuestionsText = JSON.stringify(version.questions);
    const questionsText = JSON.stringify(questions);
    return versionQuestionsText === questionsText;
}

export function computeVersionStep(shownVersion: Version, state: unknown, questions: unknown): VersionStep {
    const isUnchanged = isInputUnchanged(shownVersion, state, questions);
    if (isUnchanged)
        return 'keep';

    const hasResults = shownVersion.outputs.length > 0;
    if (hasResults)
        return 'create';

    const isStateDefault = JSON.stringify(shownVersion.state) === JSON.stringify(getHardCodedState());
    const isQuestionsDefault = JSON.stringify(shownVersion.questions) === JSON.stringify(getHardCodedQuestions());
    const isStateOrQuestionsDefault = isStateDefault || isQuestionsDefault;
    if (isStateOrQuestionsDefault)
        return 'overwrite';

    return 'create';
}
