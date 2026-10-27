import { test, expect, afterEach } from 'bun:test';
import { toggleResultJson } from './resultJsonToggle';

function removeFakeDocument() {
  Reflect.deleteProperty(globalThis, 'document');
}

function validateToggleFlipsTheHiddenFlag() {
  const editorBox = { hidden: true };
  function getElementById(id: string) {
    return id === 'resultJsonEditor' ? editorBox : null;
  }
  Object.assign(globalThis, { document: { getElementById } });
  toggleResultJson();
  expect(editorBox.hidden).toBe(false);
  toggleResultJson();
  expect(editorBox.hidden).toBe(true);
}

afterEach(removeFakeDocument);
test('test_toggle_flips_the_hidden_flag', validateToggleFlipsTheHiddenFlag);
