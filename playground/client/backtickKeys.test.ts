import { test, expect } from 'bun:test';
import { json } from '@codemirror/lang-json';
import { EditorState } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import { findBacktickedKeys } from './backtickKeys';

const CHOICE_TEST_QUESTIONS = '{"choicetest":{"type":"choice","instructions":"what kind of fruit is `fruit`?","criteria":{"`fruit`":"`fruit`","apple":"`fruit`","banana":"banana","peach":"peach","other":"something else"}}}';

function createView(text: string): EditorView {
  return { state: EditorState.create({ doc: text, extensions: [json()] }) } as unknown as EditorView;
}

function validateBacktickedKeyGetsOneErrorOnTheKey() {
  // Step: the choice criteria use "`fruit`" as a key and as values.
  const diagnostics = findBacktickedKeys(createView(CHOICE_TEST_QUESTIONS));
  // Step: only the key gets an error; the range covers the quoted key.
  const keyFrom = CHOICE_TEST_QUESTIONS.indexOf('"`fruit`":');
  expect(diagnostics).toEqual([
    { from: keyFrom, to: keyFrom + '"`fruit`"'.length, severity: 'error', message: 'backticked names cannot be keys' },
  ]);
}

test('test_backticked_key_gets_one_error_on_the_key', validateBacktickedKeyGetsOneErrorOnTheKey);
