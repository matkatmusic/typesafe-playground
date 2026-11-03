# State and questions for the TypeSafe playground

Read this file to make data that you can test in the playground. The source of truth is the code in `playground/` and the `@typesafe-ai/sdk` types (version 0.6.0).

The playground has two JSON editors: **state** and **questions**. Each Submit sends both objects to TypeSafe, without changes.

## Quick example

State:

```json
{
  "message": { "text": "Please send me the report by Friday." }
}
```

Questions:

```json
{
  "requestsAction": {
    "type": "noul",
    "instructions": "Does `message.text` ask the reader to do something?",
    "criteria": {
      "true": "The message asks the reader to take an action.",
      "false": "The message does not ask the reader to take an action."
    }
  }
}
```

## The `state` object

`state` holds the data that the questions are about.

- It must be a JSON object. The server rejects a string, an array, or `null` with status 400, although the SDK accepts them.
- With the **batch** checkbox on, the `state` editor holds an array of these objects. See [Batch: an array of states](#batch-an-array-of-states).
- Values can be any JSON value: text, number, boolean, `null`, array, or object. They can be nested.
- There are no required keys.
- To refer to a key from a question, do not use spaces or dots in the key name. See [Back-ticked names](#back-ticked-names).

## The `questions` object

`questions` maps a question name to a question.

- It must be a JSON object with at least one question.
- The question name is the key of the answer in the output.
- Each question has a `type`: `noul`, `score`, or `choice`.
- `instructions` is optional in all three types. It can be text, a JSON object, a JSON array, or `null`.
- Each criterion description can also be text, a JSON object, a JSON array, or `null`. `null` means no description.

### `noul`: a yes or no question

`criteria` is optional. It can have the keys `true` and `false`, and both keys are optional.

```json
{
  "isUrgent": {
    "type": "noul",
    "instructions": "Is `message.text` urgent?",
    "criteria": {
      "true": "The reader must act today.",
      "false": "The reader can act later."
    }
  }
}
```

Answer:

```json
{ "type": "noul", "noul": 0.82 }
```

`noul` is the probability of yes, from 0 to 1.

### `score`: a score on an ordered scale

`criteria` is required. It must be an array with at least two items. The position of an item is its score, and the first position is 0.

```json
{
  "politeness": {
    "type": "score",
    "instructions": "How polite is `message.text`?",
    "criteria": ["Rude", "Neutral", "Very polite"]
  }
}
```

Answer:

```json
{
  "type": "score",
  "score": 1.4,
  "confidence": 0.7,
  "legend": { "0": "Rude", "1": "Neutral", "2": "Very polite" },
  "probabilities": { "0": 0.05, "1": 0.5, "2": 0.45 }
}
```

`score` is the expected score. It can be between two positions.

### `choice`: one label from a set

`criteria` is required. It must be an object that maps each label to its description.

```json
{
  "topic": {
    "type": "choice",
    "instructions": "Which topic best fits `message.text`?",
    "criteria": {
      "work": "The message is about a job or a task at a job.",
      "family": "The message is about family members.",
      "other": "The message is about a different topic."
    }
  }
}
```

Answer:

```json
{
  "type": "choice",
  "choice": "work",
  "confidence": 0.9,
  "probabilities": { "work": 0.9, "family": 0.02, "other": 0.08 }
}
```

## Back-ticked names

In any text, a name between back-ticks points at a value in the state or the questions. The page looks in the state first, then in the questions.

- Use a dot for a key inside an object: `` `message.text` ``.
- Use square brackets for an array item: `` `messages[0]` `` or `` `thread.messages[0].text` ``.
- `` `messages.0` `` is not an array index, so the page cannot find it.
- A key name that has a space or a dot cannot be found.

Back-ticked names are a feature of the page only. The page shows their values in tooltips, and **replace references** changes only the text that the page shows. TypeSafe gets the text as you wrote it, with the back-ticks. So write instructions that also make sense in that form.

A name that the page cannot find gets a red squiggle. The squiggle does not stop Submit.

## Batch: an array of states

Use batch to run the same questions on many states. Turn on the **batch** checkbox beside the state title. Then write the `state` editor as an array, where each item is one state.

State:

```json
[
  { "message": { "text": "Please send me the report by Friday." } },
  { "message": { "text": "I enjoyed the party last night." } }
]
```

Questions:

```json
{
  "requestsAction": {
    "type": "noul",
    "instructions": "Does `message.text` ask the reader to do something?"
  }
}
```

### Rules for the array

- The array must have at least one item.
- Each item must be a JSON object. An item cannot be text, a number, a boolean, `null`, or an array.
- An item can hold an array as a value: `{ "messages": ["Hello", "Goodbye"] }`.
- The `questions` editor holds one object, and all items use it.
- Write a back-ticked name as a path inside one item: `` `message.text` ``, not `` `[0].message.text` ``.
- Each item must have the back-ticked name, or the questions must define it. If not, the name gets a red squiggle. The squiggle does not stop Submit.
- While batch is on, a back-ticked name does not show its value in a tooltip.
- The array works only in the editor. In a versions file, `state` must be an object, so write one version for each state.

### What Submit does

- The button text changes to **Submit Batch (paid)**.
- Each item gets one run, in array order. The total number of calls is the number of items multiplied by the calls value. For example, 5 items with 3 calls make 15 calls.
- Each item gets its own version:
  - The first item uses the normal rule for the shown version. If the state and questions are the same, the page keeps that version. If that version has no results and has the default state or the default questions, the page overwrites it. In all other cases, the page makes a new version.
  - Each other item gets a new version at the end of the list.
- When the run starts, the batch checkbox turns off and the page shows the version of the first item. To run a different batch, turn the checkbox on again and write the array again.
- If one run fails, the other runs continue. At the end, an alert that starts with `Some runs failed:` lists the versions that failed.
- While batch is on, the buttons for new, open, save, report, reset runs, and notes do not work.

## Load the data into the playground

Use one of these two methods.

### Method 1: paste into the editors

Paste the state object into the **state** editor. Paste the questions object into the **questions** editor. Then press Submit. Each Submit is paid and makes 1 to 10 calls.

### Method 2: make a versions file

Use this method to load more than one version. Write a JSON file with an array of versions, then press **Open** in the page and select the file. Open needs a Chromium browser, such as Chrome or Edge.

```json
[
  {
    "id": 1,
    "time": "2026-11-02T00:00:00.000Z",
    "state": { "message": { "text": "Please send me the report by Friday." } },
    "questions": {
      "requestsAction": {
        "type": "noul",
        "instructions": "Does `message.text` ask the reader to do something?"
      }
    },
    "calls": 0,
    "outputs": []
  }
]
```

- The array must not be empty.
- `id` values must be 1, 2, 3, and so on, in order. The page uses `id` to find the position of a version in the array.
- `state` and `questions` must be objects.
- `calls` must be an integer and `outputs` must be an array. For a version that has no runs, use `0` and `[]`.
- `time` is the time of the version in ISO 8601 format. The page shows it in the version label.
- Open replaces the playground history file with this file. The page asks you to save first if you have unsaved changes.

## Errors

| Message | Cause |
|---|---|
| `state must be a JSON object` | `state` is not an object. |
| `questions must be a JSON object` | `questions` is not an object. |
| `state is not valid JSON` or `questions is not valid JSON` | The editor text does not parse. |
| `TypeSafeError`: at least one question | `questions` is empty. |
| `TypeSafeError`: score criteria | The `criteria` of a `score` question is not an array with at least two items. |
| `state must be an array of objects while batch is on` | Batch is on and `state` is not an array. |
| `the state array is empty: add at least one object` | Batch is on and the array is empty. |
| `item N of the state array must be a JSON object` | Batch is on and item N is not an object. |
| `state must be one JSON object: turn on batch to submit an array` | Batch is off and `state` is an array. |
