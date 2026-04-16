export function createDetailsUI({
  maxNoteLength,
  onVisitedChange,
  onFavoriteChange,
  onNoteChange,
}) {
  const nameEl = document.getElementById("park-name");
  const statusEl = document.getElementById("status-text");
  const messageEl = document.getElementById("app-message");
  const controlsEl = document.getElementById("form-controls");

  const visitedToggle = document.getElementById("visited-toggle");
  const favoriteToggle = document.getElementById("favorite-toggle");
  const favoriteRow = favoriteToggle.closest(".toggle-row");
  const noteInput = document.getElementById("note-input");
  const noteCount = document.getElementById("note-count");
  const saveIndicator = document.getElementById("save-indicator");

  let isHydrating = false;

  visitedToggle.addEventListener("change", () => {
    if (!isHydrating) {
      onVisitedChange(visitedToggle.checked);
    }
  });

  favoriteToggle.addEventListener("change", () => {
    if (!isHydrating) {
      onFavoriteChange(favoriteToggle.checked);
    }
  });

  noteInput.addEventListener("input", () => {
    if (isHydrating) {
      return;
    }

    if (noteInput.value.length > maxNoteLength) {
      noteInput.value = noteInput.value.slice(0, maxNoteLength);
    }

    updateCount(noteInput.value.length, maxNoteLength);
    onNoteChange(noteInput.value);
  });

  function setSelectedPark({ park, state }) {
    isHydrating = true;
    controlsEl.classList.remove("controls-disabled");

    nameEl.textContent = park.name;

    visitedToggle.checked = state.visited;
    favoriteToggle.checked = state.favorite;
    syncFavoriteAvailability(state.visited);
    noteInput.value = state.note;

    updateCount(state.note.length, maxNoteLength);
    saveIndicator.textContent = "Saved";

    isHydrating = false;
  }

  function clearSelectedPark() {
    isHydrating = true;

    controlsEl.classList.add("controls-disabled");
    nameEl.textContent = "Select a park";
    statusEl.textContent = "Click a park boundary to add your tracker details.";

    visitedToggle.checked = false;
    favoriteToggle.checked = false;
    syncFavoriteAvailability(false);
    noteInput.value = "";
    updateCount(0, maxNoteLength);
    saveIndicator.textContent = "Saved";

    isHydrating = false;
  }

  function setMessage(message) {
    messageEl.textContent = message;
  }

  function flashSaved() {
    saveIndicator.textContent = "Saved";
  }

  function syncFavoriteAvailability(isVisited) {
    favoriteToggle.disabled = !isVisited;
    favoriteToggle.checked = isVisited ? favoriteToggle.checked : false;
    favoriteRow?.classList.toggle("toggle-row-disabled", !isVisited);
  }

  return {
    setSelectedPark,
    clearSelectedPark,
    setMessage,
    flashSaved,
  };
}

function updateCount(length, max) {
  const countEl = document.getElementById("note-count");
  countEl.textContent = `${length} / ${max}`;
}
