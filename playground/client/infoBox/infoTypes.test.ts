import { test, expect } from 'bun:test';
import type { InfoRow } from './infoTypes';

function validateInfoRowHoldsLabelAndParts() {
  const row: InfoRow = { label: 'Score:', parts: [['0.500', 'info-value']] };
  expect(row.parts[0][0]).toBe('0.500');
}

test('test_info_row_holds_label_and_parts', validateInfoRowHoldsLabelAndParts);
