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
    statusEl.textContent = `ID: ${park.id}`;

    visitedToggle.checked = state.visited;
    favoriteToggle.checked = state.favorite;
    noteInput.value = state.note;

    updateCount(state.note.length, maxNoteLength);
    saveIndicator.textContent = "Saved";

    isHydrating = false;
  }

  function setMessage(message) {
    messageEl.textContent = message;
  }

  function flashSaved() {
    saveIndicator.textContent = "Saved";
  }

  return {
    setSelectedPark,
    setMessage,
    flashSaved,
  };
}

function updateCount(length, max) {
  const countEl = document.getElementById("note-count");
  countEl.textContent = `${length} / ${max}`;
}
