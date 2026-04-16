import { createParkStorage, MAX_NOTE_LENGTH } from "./storage.js";
import { createMapView } from "./map.js";
import { createDetailsUI } from "./ui.js";

const VANCOUVER_CENTER = [49.2827, -123.1207];
const DATA_URL = "./data/parks.geojson";

const storage = createParkStorage();
const ui = createDetailsUI({
  maxNoteLength: MAX_NOTE_LENGTH,
  onVisitedChange: handleVisitedChange,
  onFavoriteChange: handleFavoriteChange,
  onNoteChange: handleNoteChange,
});

const mapView = createMapView({
  containerId: "map",
  center: VANCOUVER_CENTER,
  zoom: 12,
  getParkState: (parkId) => storage.getParkState(parkId),
  onParkSelect: handleParkSelect,
  onParkDeselect: handleParkDeselect,
});

let selectedPark = null;

void loadParks();

async function loadParks() {
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) {
      throw new Error(`Failed to load data: ${response.status}`);
    }

    const geojson = await response.json();
    const normalized = normalizeFeatureCollection(geojson);

    const nonPoints = normalized.features.filter(
      (f) => f.geometry?.type !== "Point",
    );
    if (nonPoints.length > 0) {
      const types = [...new Set(nonPoints.map((f) => f.geometry?.type ?? "unknown"))].join(", ");
      throw new Error(
        `All park features must be Point geometries, but found: ${types}. ` +
          `Re-export your shapefile with point centroids (e.g. ogr2ogr with -nlt POINT).`,
      );
    }

    mapView.setParks(normalized.features);

    ui.setMessage(
      normalized.features.length > 0
        ? ""
        : "No parks found in data file. Replace data/parks.geojson with your Vancouver dataset.",
    );
  } catch (error) {
    ui.setMessage(
      "Unable to load parks data. Check that data/parks.geojson exists and is valid GeoJSON.",
    );
    console.error(error);
  }
}

function handleParkSelect(park) {
  selectedPark = park;
  const state = storage.getParkState(park.id);
  ui.setSelectedPark({ park, state });
}

function handleParkDeselect() {
  selectedPark = null;
  ui.clearSelectedPark();
}

function handleVisitedChange(value) {
  if (!selectedPark) {
    return;
  }

  const nextState = storage.updatePark(selectedPark.id, { visited: value });
  ui.setSelectedPark({ park: selectedPark, state: nextState });
  mapView.refreshStyles();
}

function handleFavoriteChange(value) {
  if (!selectedPark) {
    return;
  }

  const nextState = storage.updatePark(selectedPark.id, { favorite: value });
  ui.setSelectedPark({ park: selectedPark, state: nextState });
  mapView.refreshStyles();
}

function handleNoteChange(note) {
  if (!selectedPark) {
    return;
  }

  storage.updatePark(selectedPark.id, { note });
  ui.flashSaved();
}

function normalizeFeatureCollection(geojson) {
  if (!geojson || geojson.type !== "FeatureCollection" || !Array.isArray(geojson.features)) {
    throw new Error("Data must be a GeoJSON FeatureCollection.");
  }

  const usedIds = new Set();
  const features = geojson.features
    .map((feature, index) => normalizeFeature(feature, index))
    .filter(Boolean)
    .map((feature) => {
      if (usedIds.has(feature.id)) {
        throw new Error(`Duplicate park id detected: ${feature.id}`);
      }
      usedIds.add(feature.id);
      return feature;
    });

  return { type: "FeatureCollection", features };
}

function normalizeFeature(feature, index) {
  if (!feature || feature.type !== "Feature" || !feature.geometry) {
    return null;
  }

  const props = feature.properties ?? {};
  const name =
    toNonEmptyString(props.name) ||
    toNonEmptyString(props.PARK_NAME) ||
    toNonEmptyString(props.park_name) ||
    `Park ${index + 1}`;

  const sourceId =
    toNonEmptyString(props.parkId) ||
    toNonEmptyString(props.PARK_ID) ||
    toNonEmptyString(props.OBJECTID) ||
    toNonEmptyString(props.id);

  const stableId = sourceId ? `park-${sourceId}` : `park-${slugify(name)}-${index}`;

  return {
    type: "Feature",
    geometry: feature.geometry,
    properties: { ...props, name },
    id: stableId,
  };
}

function toNonEmptyString(value) {
  if (value === null || value === undefined) {
    return "";
  }
  const text = String(value).trim();
  return text.length > 0 ? text : "";
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 42);
}
