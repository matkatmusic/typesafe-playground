import { test, expect } from 'bun:test';
import type { Answer, Summary } from './graphTypes';

function validateTypesDescribeAnswersAndSummaries() {
  const noulAnswer: Answer = { type: 'noul', noul: 0.5 };
  const summary: Summary = { low: 0, high: 1, average: 0.5 };
  expect(noulAnswer.type).toBe('noul');
  expect(summary.average).toBe(0.5);
}

test('test_graph_types_describe_answers_and_summaries', validateTypesDescribeAnswersAndSummaries);
