import { syntaxTree } from '@codemirror/language';
import type { Diagnostic } from '@codemirror/lint';
import type { EditorView } from '@codemirror/view';
import { getReferencePattern } from '../../typesafe-checks/typesafeChecks';
import { readPropertyName } from '../questions/questionNames';

export function findBacktickedKeys(view: EditorView): Diagnostic[] {
    const text = view.state.doc.toString();
    const diagnostics: Diagnostic[] = [];
    const cursor = syntaxTree(view.state).cursor();
    do {
        if (cursor.name === 'PropertyName') {
            // search() ignores lastIndex, so the global reference pattern is safe here.
            const hasBacktickedName = readPropertyName(text, cursor.node).search(getReferencePattern()) !== -1;
            if (hasBacktickedName)
                diagnostics.push({ from: cursor.from, to: cursor.to, severity: 'error', message: 'backticked names cannot be keys' });
        }
    } while (cursor.next());
    return diagnostics;
}
