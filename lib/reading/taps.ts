import { normalize } from "./normalize";

// A missed word. `spoken` null means the learner skipped it.
// A string is what the learner said instead, before tokenization.
export type TapMark = {
  index: number;
  spoken: string | null;
};

// Builds the spoken transcript from the passage plus the words the teacher marked.
// Unmarked words are counted as read. The reading engine scores this text later.
export function transcriptFromTaps(expectedText: string, marks: TapMark[]): string {
  const expected = normalize(expectedText);
  const byIndex = new Map<number, TapMark>();
  for (const mark of marks) {
    if (!Number.isInteger(mark.index) || mark.index < 0 || mark.index >= expected.length) {
      continue;
    }
    byIndex.set(mark.index, mark);
  }

  const spoken: string[] = [];
  expected.forEach((token, index) => {
    const mark = byIndex.get(index);
    if (!mark) {
      spoken.push(token);
      return;
    }
    if (mark.spoken === null || mark.spoken.trim() === "") return;
    spoken.push(...normalize(mark.spoken));
  });

  return spoken.join(" ");
}
