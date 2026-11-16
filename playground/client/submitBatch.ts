import { executeBatch } from './batchExecute';
import { parseBatchInput } from './batchInput';
import { formatBatchFailures } from './batchPlan';
import { getElement } from './dom';
import { pageState } from './state';
import { executeSubmit } from './submit';

export async function executeSubmitBatch(): Promise<void> {
  const errorLine = getElement('errorLine');
  errorLine.textContent = '';
  const input = parseBatchInput();
  if (!input.isValid) {
    errorLine.textContent = input.errorMessage;
    return;
  }
  const failures = await executeBatch(input.states, input.questions);
  if (failures.length > 0)
    alert(formatBatchFailures(failures));
}

export function executeSubmitForMode(): Promise<void> {
  if (pageState.isBatchOn)
    return executeSubmitBatch();
  return executeSubmit();
}
