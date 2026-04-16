export function createMapView({
  containerId,
  center,
  zoom,
  getParkState,
  onParkSelect,
  onParkDeselect,
}) {
  const map = L.map(containerId, {
    center,
    zoom,
    minZoom: 10,
    maxZoom: 18,
    zoomControl: true,
    zoomSnap: 0.25,
    zoomDelta: 0.5,
  });

  L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
    subdomains: "abcd",
    maxZoom: 20,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  }).addTo(map);

  let selectedParkId = null;
  let geoLayer = null;

  map.on("click", () => {
    if (selectedParkId === null) {
      return;
    }

    selectedParkId = null;
    onParkDeselect();
    refreshStyles();
  });

  function setParks(features) {
    if (geoLayer) {
      geoLayer.remove();
    }

    geoLayer = L.geoJSON(features, {
      pointToLayer: (feature, latlng) =>
        L.marker(latlng, { icon: iconFor(feature.id) }),
      onEachFeature: (feature, layer) => {
        layer.on("click", (event) => {
          L.DomEvent.stopPropagation(event);
          selectedParkId = feature.id;
          onParkSelect(toPark(feature));
          refreshStyles();
        });
      },
    }).addTo(map);

    if (geoLayer.getLayers().length > 0) {
      map.fitBounds(geoLayer.getBounds(), { padding: [20, 20] });
    }
  }

  function refreshStyles() {
    if (!geoLayer) {
      return;
    }

    geoLayer.eachLayer((layer) => {
      const feature = layer.feature;
      layer.setIcon(iconFor(feature.id));
      layer.setZIndexOffset(feature.id === selectedParkId ? 1000 : 0);
    });
  }

  function iconFor(parkId) {
    const state = getParkState(parkId);
    const selected = parkId === selectedParkId;
    const dimmed = selectedParkId !== null && !selected;
    const opacity = dimmed ? 0.25 : 1;

    if (state.favorite && state.visited) {
      const size = selected ? 28 : 22;
      return L.divIcon({
        className: "",
        html: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" opacity="${opacity}"><path fill="#406140" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });
    }

    if (state.visited) {
      const r = selected ? 6 : 4;
      const pad = 4;
      const size = r * 2 + pad * 2;
      return L.divIcon({
        className: "",
        html: `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="none" fill="#70a870" fill-opacity="${dimmed ? 0.25 : 0.9}" opacity="${opacity}"/></svg>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });
    }

    const r = selected ? 8 : 6;
    const pad = 4;
    const size = r * 2 + pad * 2;
    return L.divIcon({
      className: "",
      html: `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="#406140" stroke-width="${selected ? 2.5 : 1.5}" fill="#70a870" fill-opacity="${dimmed ? 0.25 : 0.9}" opacity="${opacity}"/></svg>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }

  function toPark(feature) {
    return {
      id: feature.id,
      name: feature.properties?.name || "Unnamed park",
    };
  }

  return { setParks, refreshStyles };
}
