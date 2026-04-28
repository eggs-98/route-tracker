let map;
let layers = [];

const colors = [
  "#e63946",
  "#457b9d",
  "#2a9d8f",
  "#f4a261",
  "#7b2cbf",
  "#ffb703"
];

export function initMap() {
  map = L.map("map").setView([50.8503, 4.3517], 8);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);
}

export function clearMap() {
  layers.forEach(layer => map.removeLayer(layer));
  layers = [];
}

export async function showRide(ride, color = "#e63946") {
  const response = await fetch(ride.geojson);
  const geojson = await response.json();

  const layer = L.geoJSON(geojson, {
    style: {
      color,
      weight: 5
    }
  }).addTo(map);

  layers.push(layer);
  map.fitBounds(layer.getBounds());
}

export async function showTrip(rides) {
  clearMap();

  for (let i = 0; i < rides.length; i++) {
    await showRide(rides[i], colors[i % colors.length]);
  }
}

export function showLocations(locations) {
  locations.forEach(location => {
    const marker = L.marker([location.lat, location.lng])
      .bindPopup(location.name)
      .addTo(map);

    layers.push(marker);
  });
}

export function focusLocation(location) {
  map.setView([location.lat, location.lng], 13);
}