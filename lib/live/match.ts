// Live practice: matches words heard so far against the passage, left to right.
// Practice feedback only. It never scores or saves anything; scored checks still
// go through the confirmed transcript and lib/reading.

export type LiveStatus = "pending" | "correct" | "wrong";

export type LiveMatch = {
  status: LiveStatus[];
  // Index of the next passage word to read.
  next: number;
};

// How far ahead a heard word may jump when the learner skips words.
const LOOKAHEAD = 3;

function editDistance(a: string, b: string): number {
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = previous[0];
    previous[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const above = previous[j];
      previous[j] = Math.min(previous[j] + 1, previous[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return previous[b.length];
}

// Speech recognition often spells a correctly read word slightly differently,
// so longer words allow a small difference. Short words must match exactly.
export function wordsMatch(heard: string, expected: string): boolean {
  if (heard === expected) return true;
  const longest = Math.max(heard.length, expected.length);
  if (longest < 4) return false;
  return editDistance(heard, expected) <= (longest >= 8 ? 2 : 1);
}

// The start of the expected word on its own ("ma" for "maagang"): a stutter.
function isFragment(heard: string, expected: string): boolean {
  return heard.length < expected.length && expected.startsWith(heard);
}

// Most of the word heard so far ("kanya" for "kanyang") while the learner is
// still saying it. Turns the word green early; a final result can still undo it.
function isMostOf(heard: string, expected: string): boolean {
  return isFragment(heard, expected) && heard.length >= Math.max(3, Math.ceil(expected.length * 0.6));
}

// `expected` and `heard` are normalized tokens (lib/reading normalize). Words
// from index `settled` on are still being recognized, so they can only turn a
// word green, never red.
export function matchLive(expected: string[], heard: string[], settled = heard.length): LiveMatch {
  const status: LiveStatus[] = expected.map(() => "pending");
  let next = 0;
  // Heard words in a row that match nothing nearby.
  let misses = 0;

  heard.forEach((word, index) => {
    const final = index < settled;
    const last = index === heard.length - 1;
    const speaking = !final && last;
    if (next < expected.length && (wordsMatch(word, expected[next]) || (speaking && isMostOf(word, expected[next])))) {
      status[next] = "correct";
      next += 1;
      misses = 0;
      return;
    }
    // Repeating or fixing the word just read is a stutter or self-correction.
    if (next > 0 && wordsMatch(word, expected[next - 1])) {
      status[next - 1] = "correct";
      misses = 0;
      return;
    }
    if (next >= expected.length || isFragment(word, expected[next])) return;

    // The learner moved past words: they were read differently or skipped.
    for (let ahead = next + 1; ahead <= Math.min(next + LOOKAHEAD, expected.length - 1); ahead += 1) {
      if (wordsMatch(word, expected[ahead])) {
        for (let missed = next; missed < ahead; missed += 1) status[missed] = "wrong";
        status[ahead] = "correct";
        next = ahead + 1;
        misses = 0;
        return;
      }
    }

    // A different word. One alone may be a filler or the start of a fix, so
    // wait for the next word; two in a row, or a final last word, is a miss.
    misses += 1;
    if (misses >= 2 || (final && last)) {
      status[next] = "wrong";
      next += 1;
      misses = 0;
    }
  });

  return { status, next };
}
