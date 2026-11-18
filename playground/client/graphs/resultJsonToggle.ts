import { getElement } from '../page/dom';

export function toggleResultJson(): void {
    const editorBox = getElement('resultJsonEditor');
    const graphBox = getElement('graphContainerBox');
    editorBox.hidden = !editorBox.hidden;
    graphBox.hidden = !editorBox.hidden;
}
