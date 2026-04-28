import { loadJson } from "./data-loader.js";
import {
  initMap,
  clearMap,
  showRide,
  showTrip,
  showLocations,
  focusLocation
} from "./map.js";

const listView = document.getElementById("listView");
const mapView = document.getElementById("mapView");
const listViewBtn = document.getElementById("listViewBtn");
const mapViewBtn = document.getElementById("mapViewBtn");

const tripSelect = document.getElementById("tripSelect");
const rideSelect = document.getElementById("rideSelect");
const locationSelect = document.getElementById("locationSelect");
const rideList = document.getElementById("rideList");

let trips = [];
let rides = [];

let locations = [];

init();

async function init() {
  // ALWAYS initialize map first
  initMap();

  try {
    trips = await loadJson("data/trips.json");
    rides = await loadJson("data/rides.json");
    locations = await loadJson("data/locations.json");

    populateControls();
    renderRideList();

    // Only overlay if data exists
    if (rides.length) {
      const latestRide = [...rides].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      )[0];

      await showRide(latestRide);
    }

  } catch (error) {
    console.error("Data failed to load:", error);
  }
}

function populateControls() {
  tripSelect.innerHTML = `<option value="">Select trip</option>`;
  rideSelect.innerHTML = `<option value="">Select ride</option>`;
  locationSelect.innerHTML = `<option value="">Select location</option>`;

  trips.forEach(trip => {
    tripSelect.innerHTML += `<option value="${trip.id}">${trip.name}</option>`;
  });

  rides.forEach(ride => {
    rideSelect.innerHTML += `<option value="${ride.id}">${ride.name}</option>`;
  });

  locations.forEach(location => {
    locationSelect.innerHTML += `<option value="${location.id}">${location.name}</option>`;
  });
}

function renderRideList() {
  rideList.innerHTML = "";

  rides.forEach(ride => {
    const card = document.createElement("div");
    card.className = "ride-card";

    card.innerHTML = `
      <h3>${ride.name}</h3>
      <p>${ride.date}</p>
      <p>${ride.distanceKm} km</p>
    `;

    card.addEventListener("click", async () => {
      switchToMap();
      clearMap();
      await showRide(ride);
    });

    rideList.appendChild(card);
  });
}

tripSelect.addEventListener("change", async () => {
  const tripId = tripSelect.value;
  if (!tripId) return;

  const tripRides = rides.filter(ride => ride.tripId === tripId);
  const tripLocations = locations.filter(location => location.tripId === tripId);

  await showTrip(tripRides);
  showLocations(tripLocations);
});

rideSelect.addEventListener("change", async () => {
  const ride = rides.find(r => r.id === rideSelect.value);
  if (!ride) return;

  clearMap();
  await showRide(ride);
});

locationSelect.addEventListener("change", () => {
  const location = locations.find(l => l.id === locationSelect.value);
  if (!location) return;

  focusLocation(location);
});

listViewBtn.addEventListener("click", () => {
  listView.classList.remove("hidden");
  mapView.classList.add("hidden");

  listViewBtn.classList.add("active");
  mapViewBtn.classList.remove("active");
});

mapViewBtn.addEventListener("click", switchToMap);

function switchToMap() {
  listView.classList.add("hidden");
  mapView.classList.remove("hidden");

  mapViewBtn.classList.add("active");
  listViewBtn.classList.remove("active");
}