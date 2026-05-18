import { ALPHABET } from "../constants";

export function parseWordList(text, len) {
  const words = new Set();
  text.split(/\s+/).forEach((w) => {
    const clean = w.trim().toUpperCase().replace(/[^A-Z]/g, "");
    if (clean.length === len) words.add(clean);
  });
  return words;
}

export function findValidLetters(wordSet, word, blankPos) {
  const valid = [];
  for (const letter of ALPHABET) {
    const candidate = word.slice(0, blankPos) + letter + word.slice(blankPos + 1);
    if (wordSet.has(candidate)) valid.push(letter);
  }
  return valid;
}

export function getFrontHooks(word, fourSet) {
  return ALPHABET.filter((l) => fourSet.has(l + word)).join("");
}

export function getBackHooks(word, fourSet) {
  return ALPHABET.filter((l) => fourSet.has(word + l)).join("");
}

export function generateCard(wordSet, fourSet, usedKeys = new Set()) {
  const words = [...wordSet];
  let attempts = 0;

  while (attempts < 300) {
    const word = words[Math.floor(Math.random() * words.length)];
    const pos = Math.floor(Math.random() * word.length);
    const key = `${word}-${pos}`;

    if (usedKeys.has(key)) { attempts++; continue; }

    const valid = findValidLetters(wordSet, word, pos);

    if (valid.length >= 2) {
      const display = [...word].map((c, i) => (i === pos ? "_" : c)).join("");
      return {
        key,
        display,
        pos,
        baseWord: word,
        answers: valid,
        frontHooks: getFrontHooks(word, fourSet),
        backHooks: getBackHooks(word, fourSet),
      };
    }

    attempts++;
  }

  return null;
}

export function cardFromKey(key, wordSet, fourSet) {
  const [word, posText] = String(key).split("-");
  const pos = Number(posText);
  if (!wordSet.has(word) || !Number.isInteger(pos) || pos < 0 || pos >= word.length) return null;
  const valid = findValidLetters(wordSet, word, pos);
  if (valid.length < 2) return null;
  return {
    key,
    display: [...word].map((c, i) => (i === pos ? "_" : c)).join(""),
    pos,
    baseWord: word,
    answers: valid,
    frontHooks: getFrontHooks(word, fourSet),
    backHooks: getBackHooks(word, fourSet),
    source: "scheduled",
  };
}
