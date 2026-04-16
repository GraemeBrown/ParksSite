export function createMapView({
  containerId,
  center,
  zoom,
  getParkState,
  onParkSelect,
}) {
  const map = L.map(containerId, {
    center,
    zoom,
    minZoom: 10,
    maxZoom: 18,
    zoomControl: true,
  });

  L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
    subdomains: "abcd",
    maxZoom: 20,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  }).addTo(map);

  let selectedParkId = null;
  let geoLayer = null;

  function setParks(features) {
    if (geoLayer) {
      geoLayer.remove();
    }

    geoLayer = L.geoJSON(features, {
      style: (feature) => styleFor(feature.id),
      onEachFeature: (feature, layer) => {
        layer.on("click", () => {
          selectedParkId = feature.id;
          onParkSelect(toPark(feature));
          refreshStyles();
        });

        layer.on("mouseover", () => {
          layer.setStyle({ fillOpacity: 0.6 });
        });

        layer.on("mouseout", () => {
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
      layer.setStyle(styleFor(feature.id));
      if (feature.id === selectedParkId) {
        layer.bringToFront();
      }
    });
  }

  function styleFor(parkId) {
    const state = getParkState(parkId);
    const selected = parkId === selectedParkId;

    const color = state.favorite ? "#cb7a10" : state.visited ? "#0a8c64" : "#3a6c5d";
    const fillColor = state.visited ? "#73d1b3" : "#b7d8c8";

    return {
      color,
      weight: selected ? 4 : 2,
      opacity: 0.95,
      fillColor,
      fillOpacity: selected ? 0.7 : 0.4,
      dashArray: state.favorite ? "8 4" : "",
    };
  }

  function toPark(feature) {
    return {
      id: feature.id,
      name: feature.properties?.name || "Unnamed park",
    };
  }

  return { setParks, refreshStyles };
}
