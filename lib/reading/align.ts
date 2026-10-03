import type { WordEvent } from "@/lib/types";

// Owner: Member 3. Deterministic token alignment. Pure: no auth, database or
// model imports.
//
// Token edit distance (docs/04-tech-stack.md) with a fixed tie-break order:
// match, substitution, omission, insertion.
//
// Agreed tie-break, applied in this order:
//   1. Fewest edits (substitutions + omissions + insertions).
//   2. Among equally short alignments, the most matches. Without this, a
//      skipped word followed later by an added word ("a b c" read "a c d")
//      would be reported as two substitutions even though "c" was read.
//   3. Remaining ties are resolved left to right in reading order, preferring
//      match, then substitution, then omission, then insertion at the first
//      position where the candidates differ.
//
// Both inputs must already be normalized with normalize(). Events come back in
// reading order. A synonym is still a text substitution, not a diagnosis.

export function align(
  expected: readonly string[],
  spoken: readonly string[],
): WordEvent[] {
  const n = expected.length;
  const m = spoken.length;
  const width = m + 1;

  // One number per cell encodes (edits, matches) lexicographically:
  // cost = edits * EDIT_WEIGHT - matches. EDIT_WEIGHT exceeds the largest
  // possible match count, so one extra edit always outweighs any match gain.
  const EDIT_WEIGHT = Math.min(n, m) + 1;

  // cost[i * width + j] = best cost of aligning expected[i..] with spoken[j..].
  // Float64Array keeps every value an exact integer for any realistic length.
  const cost = new Float64Array((n + 1) * width);
  const at = (i: number, j: number) => cost[i * width + j];

  for (let i = n; i >= 0; i--) {
    for (let j = m; j >= 0; j--) {
      if (i === n) {
        cost[i * width + j] = (m - j) * EDIT_WEIGHT;
      } else if (j === m) {
        cost[i * width + j] = (n - i) * EDIT_WEIGHT;
      } else {
        const diagonal =
          expected[i] === spoken[j]
            ? at(i + 1, j + 1) - 1
            : at(i + 1, j + 1) + EDIT_WEIGHT;
        const omission = at(i + 1, j) + EDIT_WEIGHT;
        const insertion = at(i, j + 1) + EDIT_WEIGHT;
        cost[i * width + j] = Math.min(diagonal, omission, insertion);
      }
    }
  }

  const events: WordEvent[] = [];
  let i = 0;
  let j = 0;

  while (i < n || j < m) {
    const here = at(i, j);

    if (i < n && j < m) {
      const same = expected[i] === spoken[j];

      if (same && here === at(i + 1, j + 1) - 1) {
        events.push({ type: "match", expected: expected[i], spoken: spoken[j] });
        i++;
        j++;
        continue;
      }

      if (!same && here === at(i + 1, j + 1) + EDIT_WEIGHT) {
        events.push({
          type: "substitution",
          expected: expected[i],
          spoken: spoken[j],
        });
        i++;
        j++;
        continue;
      }
    }

    if (i < n && here === at(i + 1, j) + EDIT_WEIGHT) {
      events.push({ type: "omission", expected: expected[i] });
      i++;
      continue;
    }

    if (j < m && here === at(i, j + 1) + EDIT_WEIGHT) {
      events.push({ type: "insertion", spoken: spoken[j] });
      j++;
      continue;
    }

    // Unreachable: every cell's cost comes from one of the steps above.
    throw new Error("align: no valid step from the cost table.");
  }

  return events;
}
