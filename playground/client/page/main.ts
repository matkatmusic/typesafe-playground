import { clearTypedKey, refreshKeyTexts, refreshProviderSwitch, refreshSubmitAvailability, setTypedKeyToVisible, updateShowKeyButton } from '../keys/apiKey';
import { getButton, getElement, getInput } from './dom';
import { launchDraftSession } from '../versions/draftSync';
import { createHeaderAddQuestion } from '../questions/addQuestionHeader';
import { createQuestionQuickNav } from '../questions/questionQuickNav';
import { setAllGraphsToCollapsed, setAllGraphsToExpanded } from '../graphs/collapseActions';
import { createQuestionsEditor, createResultEditor, createStateEditor } from '../editors/editors';
import { refreshFileView } from './fileView';
import { updateReferencesReplaced } from '../backticks/referenceToggle';
import { formatQuestionsJson, formatStateJson } from '../editors/formatJson';
import { initGraphs, renderGraphs } from '../graphs/graphs';
import { attachInfoBox } from '../infoBox/infoBox';
import { saveNote } from '../notes/noteActions';
import { createNotesButton } from '../notes/notesButton';
import { removeShownVersion } from '../versions/deleteVersion';
import { readPageData } from './pageData';
import { clearPinned, setPinnedToShown } from '../pins/pinActions';
import { applyPinInfo } from '../pins/pinInfo';
import { resetVersionRuns } from '../runs/resetRuns';
import { closeReportDialog, copyReport, openReportDialog, saveReportFile } from '../report/reportDialog';
import { closeSessionPathDialog, copySessionPath, openSessionPathDialog } from './sessionPathDialog';
import { toggleResultJson } from '../graphs/resultJsonToggle';
import { attachResizer } from './resizer';
import { getShownVersion, pageState } from './state';
import { toggleBatchMode } from '../batch/batchControls';
import { executeSubmitForMode } from '../batch/submitBatch';
import { notifyOnUnsavedClose } from './unsavedClose';
import { attachUndoRedoButtons } from '../editors/undoRedoButtons';
import { applyQuestionsRedo, applyQuestionsUndo, applyStateRedo, applyStateUndo } from '../editors/undoRedo';
import { readThemeName, setTheme, toggleTheme } from './theme';
import { createNewDocument, openVersionsFile, resetToSavedFile, writeVersionsFile } from '../versions/versionActions';
import { moveOnArrowKey, moveToNextVersion, moveToPreviousVersion, renderLastVersion, updateOnEditorChange } from '../versions/versionBox';

function attachFileAndReportListeners(): void {
    getButton('newButton').addEventListener('click', createNewDocument);
    getButton('openButton').addEventListener('click', openVersionsFile);
    getButton('saveButton').addEventListener('click', writeVersionsFile);
    getButton('resetButton').addEventListener('click', resetToSavedFile);
    getButton('reportButton').addEventListener('click', openReportDialog);
    getButton('reportCloseButton').addEventListener('click', closeReportDialog);
    getButton('reportCopyButton').addEventListener('click', copyReport);
    getButton('reportDownloadButton').addEventListener('click', saveReportFile);
}

function attachSessionAndSubmitListeners(): void {
    getButton('copyPathButton').addEventListener('click', openSessionPathDialog);
    getButton('sessionPathCopyButton').addEventListener('click', copySessionPath);
    getButton('sessionPathCloseButton').addEventListener('click', closeSessionPathDialog);
    getButton('showKeyButton').addEventListener('click', setTypedKeyToVisible);
    getButton('lightDarkModeButton').addEventListener('click', toggleTheme);
    getButton('submitButton').addEventListener('click', executeSubmitForMode);
    getInput('batchCheckbox').addEventListener('change', toggleBatchMode);
    getButton('jsonToggleButton').addEventListener('click', toggleResultJson);
}

function attachEditorAndGraphListeners(): void {
    getButton('stateFormatJsonButton').addEventListener('click', formatStateJson);
    getButton('questionsFormatJsonButton').addEventListener('click', formatQuestionsJson);
    getButton('stateUndoButton').addEventListener('click', applyStateUndo);
    getButton('stateRedoButton').addEventListener('click', applyStateRedo);
    getButton('questionsUndoButton').addEventListener('click', applyQuestionsUndo);
    getButton('questionsRedoButton').addEventListener('click', applyQuestionsRedo);
    getInput('replaceReferencesCheckbox').addEventListener('change', updateReferencesReplaced);
    getButton('collapseAllButton').addEventListener('click', setAllGraphsToCollapsed);
    getButton('expandAllButton').addEventListener('click', setAllGraphsToExpanded);
}

function attachVersionListeners(): void {
    getButton('deleteVersionButton').addEventListener('click', removeShownVersion);
    getButton('prevVersionButton').addEventListener('click', moveToPreviousVersion);
    getButton('nextVersionButton').addEventListener('click', moveToNextVersion);
    getButton('pinButton').addEventListener('click', setPinnedToShown);
    getButton('unpinButton').addEventListener('click', clearPinned);
    getButton('resetRunsButton').addEventListener('click', resetVersionRuns);
    document.addEventListener('keydown', moveOnArrowKey);
    window.addEventListener('beforeunload', notifyOnUnsavedClose);
}

function attachNoteAndKeyListeners(): void {
    getElement('noteText').addEventListener('change', saveNote);
    getInput('typeSafeKeyEditor').addEventListener('input', updateShowKeyButton);
    getInput('typeSafeKeyEditor').addEventListener('input', refreshSubmitAvailability);
    getInput('providerSwitch').addEventListener('change', clearTypedKey);
    getInput('providerSwitch').addEventListener('change', refreshKeyTexts);
    getInput('providerSwitch').addEventListener('change', refreshSubmitAvailability);
}

function createEditorsAndHeaders(): void {
    attachResizer(getElement('columnResizer'), getElement('inputBox'), getElement('inputResultsBox'), 'columns');
    attachResizer(getElement('rowResizer'), getElement('stateJsonEditor'), getElement('stateAndQuestionsBox'), 'rows');
    updateShowKeyButton();
    createResultEditor();
    createStateEditor(updateOnEditorChange);
    createQuestionsEditor(updateOnEditorChange);
    createHeaderAddQuestion();
    getElement('questionsAddQuestion').after(createQuestionQuickNav());
    getElement('stateTitleRow').children[0].after(createNotesButton('stateNotesButton', 'State notes', { kind: 'state' }));
    getElement('questionsTitleRow').children[0].after(createNotesButton('questionsNotesButton', 'Questions notes', { kind: 'questions' }));
}

function renderShownGraphs(): void {
    renderGraphs(getShownVersion(), getElement('graphContainerBox'), attachInfoBox);
}

function renderPageFromData(): void {
    const pageData = readPageData();
    pageState.versions = pageData.versions;
    refreshFileView();
    renderLastVersion();
    applyPinInfo(pageState.pinnedIndex);
    initGraphs(getElement('graphContainerBox'), renderShownGraphs);
}

function applyStoredTheme(): void {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(readThemeName(localStorage.getItem('theme'), prefersDark));
}

// eslint-disable-next-line no-restricted-syntax
async function main(): Promise<void> {
    attachFileAndReportListeners();
    attachSessionAndSubmitListeners();
    attachEditorAndGraphListeners();
    attachVersionListeners();
    attachNoteAndKeyListeners();
    refreshProviderSwitch();
    createEditorsAndHeaders();
    refreshKeyTexts();
    refreshSubmitAvailability();
    renderPageFromData();
    applyStoredTheme();
    attachUndoRedoButtons();
    await launchDraftSession();
}

// `import.meta.main` is undefined in the browser module script, so the page start must not use the guard.
export default main();
