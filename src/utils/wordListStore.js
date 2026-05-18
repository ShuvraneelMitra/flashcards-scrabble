const STORAGE_PREFIX = "flashcards_scrabble_word_lists";

function storageKey(user) {
  return `${STORAGE_PREFIX}_${user?.id || user?.email || "guest"}`;
}

function readLists(user) {
  try {
    const raw = localStorage.getItem(storageKey(user));
    const lists = raw ? JSON.parse(raw) : [];
    return Array.isArray(lists) ? lists : [];
  } catch {
    return [];
  }
}

function writeLists(user, lists) {
  localStorage.setItem(storageKey(user), JSON.stringify(lists));
}

export function getWordLists(user) {
  return readLists(user).sort((a, b) => a.name.localeCompare(b.name));
}

export function saveWordList(user, list) {
  const nextList = {
    ...list,
    id: list.id || crypto.randomUUID(),
    createdAt: list.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const lists = readLists(user).filter((item) => item.id !== nextList.id);
  writeLists(user, [...lists, nextList]);
  return nextList;
}

export function removeWordList(user, id) {
  writeLists(user, readLists(user).filter((item) => item.id !== id));
}

export function clearWordLists(user) {
  localStorage.removeItem(storageKey(user));
}

export function wordListToGamePayload(list) {
  return {
    listId: list.id,
    threeSet: new Set(list.threeWords || []),
    fourSet: new Set(list.fourWords || []),
    threeName: list.threeName,
    fourName: list.fourName,
    listName: list.name,
  };
}
