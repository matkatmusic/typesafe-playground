import { test, expect } from 'bun:test'
import { renderVersionBox } from './renderVersionBox'

function validateVersionBoxMarkup() {
    expect(renderVersionBox().toString()).toBe(
        '<div id="versionBox"><button id="deleteVersionButton">Delete Version</button>'
        + '<button id="prevVersionButton" aria-label="previous version">&lt;</button><span id="versionLabel"></span>'
        + '<button id="nextVersionButton" aria-label="next version">&gt;</button><div id="versionNoteDivider"></div>'
        + '<div id="noteBox"><label for="noteText">Run comments:</label>'
        + '<textarea id="noteText" rows="1" wrap="soft" disabled placeholder="Submit a run to add a note"></textarea></div>'
        + '<button id="resetRunsButton">Reset this version&#39;s runs</button></div>',
    )
}

test('test_version_box_markup', validateVersionBoxMarkup)
