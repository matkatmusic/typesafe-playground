import { syntaxTree } from '@codemirror/language';
import type { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { getElement } from './dom';
import { getQuestionsEditor } from './editors';
import { findTopLevelObject, listTopLevelKeys, listTopLevelProperties, readPropertyName } from './questionNames';

export function listQuestionNames(state: EditorState): string[] {
  const rootNode = findTopLevelObject(syntaxTree(state));
  if (rootNode === null)
    return [];
  return listTopLevelKeys(rootNode, state.doc.toString());
}

export function findQuestionPosition(state: EditorState, name: string): number | null {
  const rootNode = findTopLevelObject(syntaxTree(state));
  if (rootNode === null)
    return null;
  const text = state.doc.toString();
  const properties = listTopLevelProperties(rootNode);
  for (let i = 0; i < properties.length; i++) {
    const nameNode = properties[i].firstChild;
    if (nameNode === null)
      throw new Error('property has no name node');
    if (readPropertyName(text, nameNode) === name)
      return properties[i].from;
  }
  return null;
}

const MISSING_QUESTION_SUFFIX = ' is not in the questions editor';

export function moveQuestionIntoView(name: string): void {
  const view = getQuestionsEditor();
  const position = findQuestionPosition(view.state, name);
  const errorLine = getElement('errorLine');
  if (position === null) {
    errorLine.textContent = `question ${name}${MISSING_QUESTION_SUFFIX}`;
    return;
  }
  const isMissingQuestionMessageShown = (errorLine.textContent ?? '').endsWith(MISSING_QUESTION_SUFFIX);
  if (isMissingQuestionMessageShown)
    errorLine.textContent = '';
  view.dispatch({ effects: EditorView.scrollIntoView(position, { y: 'start' }) });
}

export function createQuestionQuickNav(): HTMLSelectElement {
  const select = document.createElement('select');
  select.className = 'question-quick-nav';
  select.setAttribute('aria-label', 'Go to question');
  function refreshOptions(): void {
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Go to question';
    placeholder.hidden = true;
    const options = [placeholder];
    const names = listQuestionNames(getQuestionsEditor().state);
    for (let i = 0; i < names.length; i++) {
      const option = document.createElement('option');
      option.value = names[i];
      option.textContent = names[i];
      options.push(option);
    }
    select.replaceChildren(...options);
  }
  function moveToPickedQuestion(): void {
    moveQuestionIntoView(select.value);
    select.value = '';
  }
  // ponytail: options are read when the list opens, so typing costs nothing and the parse is complete.
  select.addEventListener('mousedown', refreshOptions);
  select.addEventListener('focus', refreshOptions);
  select.addEventListener('change', moveToPickedQuestion);
  refreshOptions();
  return select;
}
