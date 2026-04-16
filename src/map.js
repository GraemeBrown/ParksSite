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
      style: (feature) => styleFor(feature.id),
      pointToLayer: (feature, latlng) =>
        L.circleMarker(latlng, pointStyleFor(feature.id)),
      onEachFeature: (feature, layer) => {
        layer.on("click", (event) => {
          L.DomEvent.stopPropagation(event);
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
      if (layer instanceof L.CircleMarker) {
        const pointStyle = pointStyleFor(feature.id);
        layer.setStyle(pointStyle);
        layer.setRadius(pointStyle.radius);
      } else {
        layer.setStyle(styleFor(feature.id));
      }

      if (feature.id === selectedParkId) {
        layer.bringToFront();
      }
    });
  }

  function pointStyleFor(parkId) {
    const selected = parkId === selectedParkId;
    const dimmed = selectedParkId !== null && !selected;

    return {
      radius: selected ? 8 : 6,
      color: "#406140",
      weight: selected ? 3 : 2,
      opacity: dimmed ? 0.25 : 0.95,
      fillColor: "#70a870",
      fillOpacity: dimmed ? 0.2 : 0.9,
    };
  }

  function styleFor(parkId) {
    const state = getParkState(parkId);
    const selected = parkId === selectedParkId;
    const dimmed = selectedParkId !== null && !selected;

    const color = state.favorite ? "#cb7a10" : state.visited ? "#0a8c64" : "#3a6c5d";
    const fillColor = state.visited ? "#73d1b3" : "#b7d8c8";

    return {
      color,
      weight: selected ? 4 : dimmed ? 1 : 2,
      opacity: dimmed ? 0.25 : 0.95,
      fillColor,
      fillOpacity: selected ? 0.7 : dimmed ? 0.12 : 0.4,
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
