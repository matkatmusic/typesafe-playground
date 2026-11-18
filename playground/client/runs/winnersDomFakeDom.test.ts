import { test, expect } from 'bun:test';
import { graphState } from '../graphs/graphState';
import { FakeElement, buildNoulOutputs, buildVersion, getNoulQuestions, installFakeDocument, readLineText, removeFakeState } from './winnersDomFakeDom';

function validateAppendChildAddsChildInOrder() {
    const parent = new FakeElement();
    const first = new FakeElement();
    const second = new FakeElement();
    parent.appendChild(first);
    parent.appendChild(second);
    expect(parent.children).toEqual([first, second]);
}

function validateReplaceChildrenDropsOldChildren() {
    const parent = new FakeElement();
    const oldChild = new FakeElement();
    const newChild = new FakeElement();
    parent.appendChild(oldChild);
    parent.replaceChildren(newChild);
    expect(parent.children).toEqual([newChild]);
}

function validateAddEventListenerStoresListenerByType() {
    const element = new FakeElement();
    function readListener() {}
    element.addEventListener('click', readListener);
    expect(element.listeners.click).toBe(readListener);
}

function validateInstalledDocumentCreatesElementsAndTextNodes() {
    installFakeDocument();
    const element = document.createElement('div') as unknown as FakeElement;
    const textNode = document.createTextNode('hello') as unknown as FakeElement;
    removeFakeState();
    expect(element).toBeInstanceOf(FakeElement);
    expect(textNode.textContent).toBe('hello');
}

function validateRemoveFakeStateRemovesDocumentAndResetsReferences() {
    installFakeDocument();
    graphState.isReferencesReplaced = true;
    removeFakeState();
    expect('document' in globalThis).toBe(false);
    expect(graphState.isReferencesReplaced).toBe(false);
}

function validateReadLineTextJoinsChildText() {
    const line = new FakeElement();
    const first = new FakeElement();
    const second = new FakeElement();
    first.textContent = 'ab';
    second.textContent = 'cd';
    line.appendChild(first);
    line.appendChild(second);
    expect(readLineText(line)).toBe('abcd');
}

function validateBuildVersionCountsOutputsAsCalls() {
    const outputs = buildNoulOutputs(0.1, 0.2);
    const version = buildVersion(getNoulQuestions(), outputs);
    expect(version.calls).toBe(2);
    expect(version.outputs.length).toBe(2);
}

function validateGetNoulQuestionsHasOneNoulQuestion() {
    const questions = getNoulQuestions();
    expect(Object.keys(questions)).toEqual(['q']);
    expect(questions.q.type).toBe('noul');
}

function validateBuildNoulOutputsMakesOneOutputPerValue() {
    const outputs = buildNoulOutputs(0.3, 0.9);
    const noulValues: number[] = [];
    for (const output of outputs)
        noulValues.push(output.answers.q.noul);
    expect(noulValues).toEqual([0.3, 0.9]);
}

test('appendChild adds children in order', validateAppendChildAddsChildInOrder);
test('replaceChildren drops old children', validateReplaceChildrenDropsOldChildren);
test('addEventListener stores the listener by type', validateAddEventListenerStoresListenerByType);
test('installed document creates elements and text nodes', validateInstalledDocumentCreatesElementsAndTextNodes);
test('removeFakeState removes the document and resets references', validateRemoveFakeStateRemovesDocumentAndResetsReferences);
test('readLineText joins the text of the children', validateReadLineTextJoinsChildText);
test('buildVersion counts outputs as calls', validateBuildVersionCountsOutputsAsCalls);
test('getNoulQuestions has one noul question', validateGetNoulQuestionsHasOneNoulQuestion);
test('buildNoulOutputs makes one output per value', validateBuildNoulOutputsMakesOneOutputPerValue);
