import fs from "fs/promises";

const {
  STRAVA_CLIENT_ID,
  STRAVA_CLIENT_SECRET,
  STRAVA_REFRESH_TOKEN
} = process.env;

const ridesPath = "data/rides.json";

async function refreshAccessToken() {
  const response = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      refresh_token: STRAVA_REFRESH_TOKEN,
      grant_type: "refresh_token"
    })
  });

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

async function getActivities(accessToken) {
  const response = await fetch(
    "https://www.strava.com/api/v3/athlete/activities?per_page=30",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Activity fetch failed: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

function detectTrip(activityName) {
  const match = activityName.match(/#rideto([a-zA-Z0-9_-]+)/i);
  if (!match) return null;

  const destination = match[1];

  return {
    id: `ride-to-${destination.toLowerCase()}`,
    name: `Ride to ${destination}`,
    tag: `#rideto${destination}`
  };
}

async function readJson(path, fallback) {
  try {
    return JSON.parse(await fs.readFile(path, "utf8"));
  } catch {
    return fallback;
  }
}

async function main() {
  const tokenData = await refreshAccessToken();
  const activities = await getActivities(tokenData.access_token);

  const rides = await readJson(ridesPath, []);

  for (const activity of activities) {
    if (activity.type !== "Ride") continue;

    const id = String(activity.id);
    const existing = rides.find(ride => ride.id === id);
    if (existing) continue;

    const trip = detectTrip(activity.name);

    rides.push({
      id,
      name: activity.name,
      date: activity.start_date,
      distanceKm: Math.round((activity.distance / 1000) * 10) / 10,
      movingTimeSeconds: activity.moving_time,
      tripId: trip ? trip.id : null,
      source: "strava"
    });
  }

  rides.sort((a, b) => new Date(b.date) - new Date(a.date));

  await fs.mkdir("data", { recursive: true });
  await fs.writeFile(ridesPath, JSON.stringify(rides, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});