const STORAGE_KEY = "vancouverParksState.v1";
export const STORAGE_SCHEMA_VERSION = 1;
export const MAX_NOTE_LENGTH = 220;

export function createParkStorage() {
  let state = loadState();

  function getParkState(parkId) {
    const record = state.parks[parkId] ?? {};
    return {
      visited: !!record.v,
      favorite: !!record.f,
      note: typeof record.n === "string" ? record.n : "",
    };
  }

  function updatePark(parkId, patch) {
    const current = getParkState(parkId);
    const next = {
      visited: patch.visited ?? current.visited,
      favorite: patch.favorite ?? current.favorite,
      note: sanitizeNote(patch.note ?? current.note),
    };

    if (!next.visited) {
      next.favorite = false;
    }

    const compact = {};
    if (next.visited) {
      compact.v = 1;
    }
    if (next.favorite) {
      compact.f = 1;
    }
    if (next.note.length > 0) {
      compact.n = next.note;
    }

    if (Object.keys(compact).length === 0) {
      delete state.parks[parkId];
    } else {
      state.parks[parkId] = compact;
    }

    persist();
    return next;
  }

  function clearAll() {
    state = emptyState();
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Unable to clear park data.", error);
    }
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Unable to persist park data.", error);
    }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return emptyState();
      }

      const parsed = JSON.parse(raw);
      if (
        parsed &&
        parsed.version === STORAGE_SCHEMA_VERSION &&
        parsed.parks &&
        typeof parsed.parks === "object"
      ) {
        return parsed;
      }

      return emptyState();
    } catch {
      return emptyState();
    }
  }

  return {
    getParkState,
    updatePark,
    clearAll,
  };
}

function sanitizeNote(input) {
  if (typeof input !== "string") {
    return "";
  }

  return input.replace(/\r\n/g, "\n").trim().slice(0, MAX_NOTE_LENGTH);
}

function emptyState() {
  return {
    version: STORAGE_SCHEMA_VERSION,
    parks: {},
  };
}
