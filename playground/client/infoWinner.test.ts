import { test, expect } from 'bun:test';
import type { Answer } from './graphTypes';
import { readWinningKey } from './infoWinner';

function buildChoice(choice: string): Answer {
  return { type: 'choice', choice: choice, confidence: 1, probabilities: { a: 0.5, b: 0.5 } };
}

function validateTheKeyWithTheMostTopRunsWins() {
  const answers = [buildChoice('a'), buildChoice('b'), buildChoice('b')];
  expect(readWinningKey(answers, ['a', 'b'])).toBe('b');
}

function validateATieGoesToTheFirstKeySeen() {
  const answers = [buildChoice('b'), buildChoice('a')];
  expect(readWinningKey(answers, ['a', 'b'])).toBe('b');
}

function validateAKeyWithoutABarFallsBackToTheFirstChartedKey() {
  const answers: Answer[] = [{ type: 'noul', noul: 0.2 }];
  expect(readWinningKey(answers, ['yes'])).toBe('yes');
}

test('test_the_key_with_the_most_top_runs_wins', validateTheKeyWithTheMostTopRunsWins);
test('test_a_tie_goes_to_the_first_key_seen', validateATieGoesToTheFirstKeySeen);
test('test_a_key_without_a_bar_falls_back_to_the_first_charted_key', validateAKeyWithoutABarFallsBackToTheFirstChartedKey);
