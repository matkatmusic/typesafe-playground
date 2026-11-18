import { spyOn, mock } from 'bun:test';
import type { EditorView } from '@codemirror/view';
import type { Questions } from '@typesafe-ai/sdk';
import type { Version } from '../../history/playgroundHistory';
import * as editors from '../editors/editors';
import * as graphs from '../graphs/graphs';
import * as winnersDom from '../runs/winnersDom';
import { LOCKED_BUTTON_IDS } from './batchControls';
import { pageState } from '../page/state';
import { SUBMIT_TEXT } from '../runs/submit';

class FakeButton {
  disabled = false; textContent = SUBMIT_TEXT;
}
class FakeInput {
  value = ''; type = 'password'; checked = false; disabled = false; placeholder = '';
}
class FakeBox {
  textContent = '';
}

const realFetch = globalThis.fetch;
const OUTPUT = { answers: {}, usage: { input_tokens: 1000000, output_tokens: 1 } };
export const QUESTIONS = { q: { type: 'noul', instructions: 'x' } } as unknown as Questions;

type RunSnapshot = { index: number; calls: number; state: unknown; questions: unknown; buttonText: string; isButtonDisabled: boolean; isToggleDisabled: boolean; isNewDisabled: boolean; areEditorsLocked: boolean; shownIndex: number };
export type Harness = { elements: Record<string, FakeButton & FakeInput & FakeBox>; history: Version[]; runs: RunSnapshot[]; notes: { index: number; body: Record<string, unknown> }[]; drafts: Record<string, unknown>[]; alerts: string[]; openBodies: Version[][]; locks: boolean[]; stateText: { value: string }; questionsText: { value: string }; fetchOrder: string[] };

export function buildVersion(state: unknown, questions: unknown, outputCount: number, time: string): Version {
  const outputs = [];
  for (let i = 0; i < outputCount; i++)
    outputs.push(OUTPUT);
  return { time, state, questions, calls: outputCount, outputs } as unknown as Version;
}

export function installHarness(initial: Version[], shownIndex: number, stateText: string, questionsText: string, failingIndexes: number[], hasEnvKey = true): Harness {
  const elements: Record<string, unknown> = {
    data: new FakeBox(), errorLine: new FakeBox(), versionLabel: new FakeBox(), costLabel: new FakeBox(), totalCostLabel: new FakeBox(), tokensLabel: new FakeBox(), lastEditedLabel: new FakeBox(),
    graphContainerBox: new FakeBox(), winnerBox: new FakeBox(), batchCheckbox: new FakeInput(), typeSafeKeyEditor: new FakeInput(), providerSwitch: new FakeInput(), noteText: new FakeInput(), callsPicker: new FakeInput(),
  };
  const buttonIds = [...LOCKED_BUTTON_IDS, 'resetButton', 'submitButton', 'prevVersionButton', 'nextVersionButton', 'deleteVersionButton', 'pinButton', 'unpinButton'];
  for (const id of buttonIds)
    elements[id] = new FakeButton();
  const typedElements = elements as Harness['elements'];
  typedElements.data.textContent = JSON.stringify({ versions: [], hasEnvKey });
  typedElements.callsPicker.value = '3';
  typedElements.batchCheckbox.checked = true;
  Object.assign(globalThis, { document: { getElementById: (id: string) => elements[id] ?? null }, HTMLButtonElement: FakeButton, HTMLInputElement: FakeInput, HTMLTextAreaElement: FakeInput });
  const harness: Harness = { elements: typedElements, history: [], runs: [], notes: [], drafts: [], alerts: [], openBodies: [], locks: [], stateText: { value: stateText }, questionsText: { value: questionsText }, fetchOrder: [] };
  function buildStubEditor(text: { value: string }) {
    return { state: { doc: { toString: () => text.value } }, dispatch: () => {} } as unknown as EditorView;
  }
  spyOn(editors, 'getStateEditor').mockReturnValue(buildStubEditor(harness.stateText));
  spyOn(editors, 'getQuestionsEditor').mockReturnValue(buildStubEditor(harness.questionsText));
  spyOn(editors, 'renderStateJson').mockImplementation((value: unknown) => {
    harness.stateText.value = JSON.stringify(value);
  });
  spyOn(editors, 'renderQuestionsJson').mockImplementation((value: unknown) => {
    harness.questionsText.value = JSON.stringify(value);
  });
  spyOn(editors, 'renderResultJson').mockImplementation(() => {});
  spyOn(editors, 'setEditorLocked').mockImplementation((_editor: EditorView, isLocked: boolean) => {
    harness.locks.push(isLocked);
  });
  spyOn(graphs, 'renderGraphs').mockImplementation(() => {});
  spyOn(winnersDom, 'renderWinners').mockImplementation(() => {});
  Object.assign(globalThis, { alert: (message: string) => harness.alerts.push(message) });
  harness.history = JSON.parse(JSON.stringify(initial));
  pageState.versions = initial;
  pageState.index = shownIndex;
  async function stubFetch(path: string | URL | Request, init?: RequestInit) {
    const route = String(path);
    harness.fetchOrder.push(route);
    const body = JSON.parse(String(init?.body));
    if (route === '/open') {
      harness.openBodies.push(body.versions);
      harness.history = JSON.parse(JSON.stringify(body.versions));
      return Response.json({ versions: harness.history });
    }
    if (route === '/note') {
      harness.notes.push({ index: body.index, body });
      harness.history[body.index].questionsNote = body.questionsNote;
      return Response.json(harness.history[body.index]);
    }
    if (route === '/draft') {
      harness.drafts.push(body);
      return new Response('ok');
    }
    const snapshot: RunSnapshot = {
      index: body.index, calls: body.calls, state: body.state, questions: body.questions,
      buttonText: typedElements.submitButton.textContent, isButtonDisabled: typedElements.submitButton.disabled,
      isToggleDisabled: typedElements.batchCheckbox.disabled, isNewDisabled: typedElements.newButton.disabled,
      areEditorsLocked: harness.locks[harness.locks.length - 1] === true, shownIndex: pageState.index,
    };
    harness.runs.push(snapshot);
    if (failingIndexes.includes(body.index))
      return new Response('boom', { status: 500 });
    const version = harness.history[body.index];
    for (let i = 0; i < body.calls; i++)
      version.outputs.push(OUTPUT as never);
    version.calls += body.calls;
    version.time = new Date().toISOString();
    return Response.json({ outputs: [], version, index: body.index });
  }
  globalThis.fetch = stubFetch as unknown as typeof fetch;
  return harness;
}

export function restoreHarness() {
  mock.restore();
  for (const name of ['document', 'HTMLButtonElement', 'HTMLInputElement', 'HTMLTextAreaElement', 'alert'])
    Reflect.deleteProperty(globalThis, name);
  globalThis.fetch = realFetch;
  pageState.versions = [];
  pageState.index = 0;
  pageState.isDirty = false;
  pageState.isBatchOn = false;
  pageState.batchRun = null;
  pageState.editedDraft = null;
  pageState.pendingNotes = { state: null, questions: null };
}

export function startBatchOn() {
  pageState.isBatchOn = true;
}
