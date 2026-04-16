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
      if (feature.id === selectedParkId) {
        layer.bringToFront();
      }
    });
  }

  function iconFor(parkId) {
    const state = getParkState(parkId);
    const selected = parkId === selectedParkId;
    const dimmed = selectedParkId !== null && !selected;
    const opacity = dimmed ? 0.25 : 1;

    if (state.favorite && state.visited) {
      const fontSize = selected ? 50 : 39;
      const size = fontSize + 6;
      return L.divIcon({
        className: "",
        html: `<span style="font-size:${fontSize}px;color:#406140;opacity:${opacity};line-height:1;display:block;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.35));user-select:none">&#9829;</span>`,
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
