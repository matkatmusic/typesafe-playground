import { getButton } from './dom';
import { triggerNotImplementedError } from './notImplemented';
import { readThemeName, setTheme, toggleTheme } from './theme';

getButton('newButton').addEventListener('click', triggerNotImplementedError);
getButton('openButton').addEventListener('click', triggerNotImplementedError);
getButton('saveButton').addEventListener('click', triggerNotImplementedError);
getButton('resetButton').addEventListener('click', triggerNotImplementedError);
getButton('lightDarkModeButton').addEventListener('click', toggleTheme);
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
setTheme(readThemeName(localStorage.getItem('theme'), prefersDark));
