import { setKeyPlaceholder, setTypedKeyToVisible, updateShowKeyButton } from './apiKey';
import { getButton, getElement, getInput } from './dom';
import { triggerNotImplementedError } from './notImplemented';
import { readPageData } from './pageData';
import { attachResizer } from './resizer';
import { readThemeName, setTheme, toggleTheme } from './theme';

getButton('newButton').addEventListener('click', triggerNotImplementedError);
getButton('openButton').addEventListener('click', triggerNotImplementedError);
getButton('saveButton').addEventListener('click', triggerNotImplementedError);
getButton('resetButton').addEventListener('click', triggerNotImplementedError);
getButton('showKeyButton').addEventListener('click', setTypedKeyToVisible);
getButton('lightDarkModeButton').addEventListener('click', toggleTheme);
getInput('typeSafeKeyEditor').addEventListener('input', updateShowKeyButton);
attachResizer(getElement('columnResizer'), getElement('inputBox'), getElement('inputResultsBox'));
updateShowKeyButton();
setKeyPlaceholder(readPageData().hasEnvKey);
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
setTheme(readThemeName(localStorage.getItem('theme'), prefersDark));
