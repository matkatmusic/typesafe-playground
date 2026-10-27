import type { Version } from '../playgroundHistory';
import { getNoteText } from './noteBox';
import { markPageChanged } from './pageChanged';
import { getShownVersion } from './state';
import { sendJson } from './versionActions';

export async function saveNote(): Promise<void> {
  const version = getShownVersion();
  const response = await sendJson('/note', { id: version.id, note: getNoteText().value });
  const saved: Version = await response.json();
  version.note = saved.note;
  markPageChanged('last edited');
}
