const STORAGE_PREFIX = "flashcards_scrabble_schedule";
const MINUTE = 60 * 1000;
const REVIEW_SPACING = [5 * MINUTE, 30 * MINUTE, 6 * 60 * MINUTE, 24 * 60 * MINUTE, 3 * 24 * 60 * MINUTE];

function storageKey(user, listId) {
  return `${STORAGE_PREFIX}_${user?.id || user?.email || "guest"}_${listId || "unsaved"}`;
}

function userKeyPrefix(user) {
  return `${STORAGE_PREFIX}_${user?.id || user?.email || "guest"}_`;
}

function readSchedule(user, listId) {
  try {
    const raw = localStorage.getItem(storageKey(user, listId));
    const records = raw ? JSON.parse(raw) : {};
    return records && typeof records === "object" ? records : {};
  } catch {
    return {};
  }
}

function writeSchedule(user, listId, records) {
  localStorage.setItem(storageKey(user, listId), JSON.stringify(records));
}

export function getDueCardKeys(user, listId) {
  const now = Date.now();
  return Object.values(readSchedule(user, listId))
    .filter((record) => record.dueAt <= now)
    .sort((a, b) => a.dueAt - b.dueAt)
    .map((record) => record.key);
}

export function gradeScheduledCard(user, listId, card, passed) {
  const records = readSchedule(user, listId);
  const existing = records[card.key] || {
    key: card.key,
    successes: 0,
    misses: 0,
    intervalIndex: 0,
  };

  const intervalIndex = passed
    ? Math.min(existing.intervalIndex + 1, REVIEW_SPACING.length - 1)
    : 0;

  records[card.key] = {
    ...existing,
    baseWord: card.baseWord,
    pos: card.pos,
    display: card.display,
    answers: card.answers,
    successes: passed ? existing.successes + 1 : existing.successes,
    misses: passed ? existing.misses : existing.misses + 1,
    intervalIndex,
    dueAt: Date.now() + REVIEW_SPACING[intervalIndex],
    lastGrade: passed ? "passed" : "missed",
    lastSeenAt: new Date().toISOString(),
  };

  writeSchedule(user, listId, records);
}

export function getScheduleStats(user, listId) {
  const records = Object.values(readSchedule(user, listId));
  const now = Date.now();
  return {
    total: records.length,
    due: records.filter((record) => record.dueAt <= now).length,
  };
}

export function clearSchedules(user) {
  const prefix = userKeyPrefix(user);
  Object.keys(localStorage)
    .filter((key) => key.startsWith(prefix))
    .forEach((key) => localStorage.removeItem(key));
}
