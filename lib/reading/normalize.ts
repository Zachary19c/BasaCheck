// Owner: Member 3. The one agreed tokenizer for scoring, fixtures and seeds.
// Pure: no auth, database or model imports.
//
// Rule (docs/04-tech-stack.md): lowercase, remove punctuation, split on
// whitespace. Punctuation is deleted, not replaced with a space, so "Leo's"
// becomes "leos" and "mag-aral" becomes "magaral". This mirrors the word
// count in supabase/seed.sql:
//
//   lower(regexp_replace(content, '[[:punct:]]', '', 'g')) split on '\s+'
//
// POSIX [[:punct:]] covers ASCII punctuation *and* symbols ($ + < = > ^ ` | ~),
// which Unicode splits into \p{P} and \p{S}, so both are removed here.
// NFC only unifies composed/decomposed accents; it never changes token count.

const PUNCTUATION_AND_SYMBOLS = /[\p{P}\p{S}]/gu;
const WHITESPACE = /\s+/u;

export function normalize(text: string): string[] {
  if (typeof text !== "string") {
    throw new TypeError("normalize expects a string.");
  }

  return text
    .normalize("NFC")
    .toLowerCase()
    .replace(PUNCTUATION_AND_SYMBOLS, "")
    .split(WHITESPACE)
    .filter((token) => token.length > 0);
}
