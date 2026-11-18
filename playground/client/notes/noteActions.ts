import type { Version } from '../../history/playgroundHistory';
import { getNoteText } from './noteBox';
import { markPageChanged } from '../page/pageChanged';
import { getShownVersion, pageState } from '../page/state';
import { sendJson } from '../versions/versionActions';

export async function saveNote(): Promise<void> {
  const version = getShownVersion();
  const response = await sendJson('/note', { index: pageState.index, note: getNoteText().value });
  const saved: Version = await response.json();
  version.note = saved.note;
  markPageChanged('last edited');
}
