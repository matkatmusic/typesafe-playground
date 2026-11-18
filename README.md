# TypeSafe playground

A local web page for trying TypeSafe questions.

![The playground page with graphs, Winners, notes buttons, and the Report button](docs/playground-graphs.png)

## Run it

```
cd playground
bun install
bun run start
```

`bun run start` runs `bun --watch server/playground.ts`. The server prints its address. Open that address in a browser.

### Options

- `--port <number>`: use this port. The number must be from 1 to 65535. Without `--port`, the server picks a free port.
- `--lan`: also serve the page on your local network. The server prints one more address for each network address of the computer. Other devices on the same network can open the page at those addresses. They can also press Submit, and those runs use your API key.

Example, from the `playground` folder: `bun server/playground.ts --port 4318 --lan`

## API key

Submit sends paid requests to TypeSafe or to SubQ, so it needs an API key for that provider. The server gets the key from one of two places:

1. The **API key** box at the top of the page. The label shows the provider that is on. A key in this box is used first. The page sends it to the local server with each Submit. The server does not write it to disk.
2. An environment variable in `playground/.env`. Bun reads this file when the server starts. TypeSafe uses `TYPESAFE_API_KEY`. SubQ uses `SUBQ_AI_API_KEY`. When the key for the provider that is on is set, the box shows "Using key from .env".

Without a key, the Submit button is disabled. `.env` is in `playground/.gitignore`.

### TypeSafe or SubQ

The switch in the header picks the provider for the next Submit. Off is TypeSafe. On is SubQ. The page starts on TypeSafe.

- You can turn the switch on only when `SUBQ_AI_API_KEY` is set in `playground/.env`.
- When SubQ is on, the key in the box is used first. If the box is empty, the server uses `SUBQ_AI_API_KEY`.
- When you move the switch, the page clears the key in the box.
- SubQ queries go to `https://api.subq.ai/v1/systemone` with the model `subq-snap-1.2`. The state and the questions have the same format as for TypeSafe.

## Graphs

Each question has a graph. Each call has one bar. The color of a call bar shows the provider that made the call:

- SubQ is sky blue (`#56B4E9`).
- TypeSafe is blue-green (`#009E73`).

Pinned bars use the same colors, but faded.

Each saved output stores its `provider`. An old output without a `provider` counts as TypeSafe.

The cost uses $0.042 per 1M input tokens for TypeSafe and $0.04 per 1M input tokens for SubQ.

A `noul` question (yes or no) has a graph with one bar per call, above or below the middle line.

![A noul graph with its result box](docs/graph-noul.png)

A `score` question has a graph with one group of bars for each criterion.
This graph shows the results for 3 separate API calls each to Typesafe and SubQ. 

![A score graph with its result box](docs/graph-score.png)

A `choice` question has a graph with one group of bars for each choice.

![A choice graph with its result box](docs/graph-choice.png)

## Data on disk

- `playground/results/playground-history.json` holds every version: its state, its questions, the output of each run, and its notes. The server makes this file when it first starts. It writes the file again after each Submit, New, Open, note change, and **Reset this version's runs**. `results/` is in `playground/.gitignore`.
- **Save** writes the same versions to a JSON file that you choose. The default name is `playground-versions.json`.
- **Open** reads a file like that and replaces the history file with it.
- **New** replaces the history file with one blank version.
- Before New or Open, the page asks you to save if you have unsaved changes.
- Save and Open use the browser's file picker. It works only in Chromium browsers, such as Chrome and Edge.
- The browser's local storage keeps your light or dark theme choice.

## Auto-save

The page saves your State and Questions text on its own, so a reload does not lose your edits.

- Each browser tab gets its own id. The tab keeps the id in sessionStorage, so the id survives a reload of that tab.
- Every 2 seconds, the page checks the State and Questions editors. If the text of either editor changed, the page writes both texts to `playground/results/.currentSession-<id>.json`.
- When you reload the same tab, the page restores the text of that tab. Other tabs do not overwrite it, because each tab writes only its own file.
- When you close a tab, it loses its id. The file stays on disk, but a new tab does not restore it. A tab that you reopen, for example with Cmd+Shift+T, may not bring back the same unsaved session.
- Auto-save does not replace **Save**. Only **Save** writes a versions file.

## Versions

A version is one state and one set of questions, plus all the runs made with them. Use versions to compare how a change to the state or the questions changes the answers.

- `<` and `>` show the previous and the next version. The left and right arrow keys do the same when you are not typing in a box or an editor. After the last version, `>` goes back to the first one.
- The arrows are disabled when there is only one version.
- The label shows the version number, the time of the version, and the number of calls.
- When you edit the state or the questions, the label shows the next version number and "not run yet". Submit makes that new version.
- When you press Submit with no edits, the new runs go into the version that the page shows.

## Placeholders in the questions editor

**Add Question** opens a menu with three question types: Noul, Score, and Choice. Choose one to add a new question to the questions editor.

- The new question has placeholder values for its name, its instructions, and its criteria.
- Placeholders show in grey. The selected placeholder has a highlight.
- Press Tab to select the next placeholder, and Shift+Tab to select the previous one. Type to replace the selected text.
- When you change a placeholder, it becomes regular text, and Tab skips it.

## Backtick key names

In the state editor or the questions editor, type a backtick (`` ` ``). A list shows the key names from both editors.

- Use the arrow keys to select a name, then press Tab or Enter. The editor adds the name and a closing backtick.
- After a key name and a dot, for example `` `message. ``, the list shows only the keys inside that object.
- Use this to write references such as `` `message.text` `` in question instructions.

## Back-ticked name checks

A back-ticked name that no editor defines gets a red squiggle. The message says `` `<name>` is not in state or in this question ``.
- The squiggles update when the other editor changes. For example, rename a key in the state editor. The old name gets a squiggle in the questions editor.
- To point at an item in an array, write the index in square brackets, for example `` `userMessageArray[0]` ``. A name like `` `userMessageArray.0` `` is not an index, so it gets a squiggle.

![A red squiggle under a name that the state editor no longer defines](docs/undefined-name-squiggle.png)

## Back-ticked name tooltips

Put the pointer on a back-ticked name. A box shows the value of that name. The value comes from the state or the questions.

- This works in the state editor, the questions editor, the Winners box, the graph titles, and the Message line of the InfoBox.
- Only one box shows at a time.
- The box does not show when the state or the questions have a JSON error.

![The tooltip box on a back-ticked name in the questions editor](docs/backtick-tooltip.png)

### Replace references

The **replace references** box above the graphs replaces each back-ticked name with its value. This changes the Winners box, the graph titles, and the Message line of the InfoBox. It also reads names with an index, such as `` `userMessageArray[0]` ``.

## Notes

Notes help you remember why you made a change. Each note belongs to one version.

- **Run comments** is the box under the version label. It is for the runs of the version. It is off until the version has a run. It is also off while the editors show edits that you did not run.
- The **notes** button next to **state** and next to **questions** opens a notes dialog. Press OK to keep the text.
- Each graph has its own **notes** button for that question's result. A result note needs a run.
- A state note or a questions note on unsaved edits waits. The page keeps it until you press Save or Submit. Then it goes into the new version.
- When you do not change the state, the new version gets the state note of the version before it. The questions note works the same way.

![The notes dialog](docs/notes-dialog.png)

## Report

The **Report** button at the top opens a report of every version that has notes or runs. The report is markdown. For each version it shows:

- **Changes**: what changed in the state and in the questions since the version before it.
- The state notes, the questions notes, and the run comments. A state note or a questions note shows only in the version where it is new.
- **Results**: the winner of each question, its average, and the result note. A line ends with ▲ or ▼ and the size of the change in the average, when an earlier version has a run for that question. If the winner changed, the line ends with "winner was" and the old winner. If the average did not change, it ends with "no change".

**Copy** puts the markdown on the clipboard. **Download .md** saves it as `<open file>-notes.md`. For example, if the open file is `playground-versions.json`, the report file is `playground-versions-notes.md`. Without an open file, the name is `notes.md`.

![The Report with Changes, notes, and results](docs/report.png)

## Code layout

All code is in the `playground` folder.

- `server/`: the local server, its request handlers, the request guard, and the error messages.
- `providers/`: the SubQ client and the starting state and questions for TypeSafe.
- `history/`: the history file, the version step rules, and the "not run" time.
- `startup/`: the `--port` and `--lan` options and the network addresses.
- `shared/`: small helpers that other folders use.
- `page/`: the page as `.tsx` components (`renderPage.tsx` and its `renderXxx.tsx` parts), `renderHtml.ts` (turns the `.tsx` markup into HTML text), and the CSS files.
- `client/`: the code that runs in the browser, in these folders:
  - `keys/`: the API key box and the provider switch.
  - `questions/`: the Add Question menu, question names, and the key and value lists.
  - `backticks/`: back-ticked names: the lists, the checks, the tooltips, and the placeholders.
  - `editors/`: the State and Questions editors, formatting, highlights, and undo and redo.
  - `runs/`: Submit, the Winners box, the cost and tokens, and Reset runs.
  - `batch/`: batch input and batch runs.
  - `graphs/`: the graphs, their bars, and their collapse and result buttons.
  - `infoBox/`: the InfoBox.
  - `notes/`: the notes buttons and dialogs.
  - `pins/`: the pin buttons and the pinned bars.
  - `versions/`: the version label and arrows, Save, Open, New, and auto-save.
  - `report/`: the Report dialog and its markdown.
  - `page/`: the page start, the page data, the theme, the dialogs, and the resizer.
