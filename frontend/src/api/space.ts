import { apiClient } from "./client";

export type ApodEntry = {
  title?: string;
  explanation?: string;
  date?: string;
  media_type?: string;
  url?: string;
  hdurl?: string;
  thumbnail_url?: string;
  copyright?: string;
  ai_summary?: string | null;
};

export type AsteroidSummary = {
  total: number;
  hazardous: number;
  non_hazardous: number;
  closest?: {
    name?: string;
    miss_distance_km?: number;
    close_approach_date?: string;
  } | null;
  largest?: {
    name?: string;
    estimated_diameter_max_m?: number;
  } | null;
};

export type MarsPhoto = {
  id?: string;
  photo_id?: string;
  source?: string;
  title?: string;
  img_src?: string;
  earth_date?: string;
  rover?: string;
  camera?: string;
};

export type SpaceWeatherEvent = {
  flrID?: string;
  activityID?: string;
  startTime?: string;
  peakTime?: string;
  sourceLocation?: string;
  classType?: string;
};

export type Asteroid = {
  id?: string;
  name?: string;
  is_potentially_hazardous?: boolean;
  close_approach_date?: string;
  miss_distance_km?: number;
  relative_velocity_kph?: number;
  estimated_diameter_max_m?: number;
  nasa_jpl_url?: string;
};

// Additional caches
let apodCache: ApodEntry | null = null;
let asteroidStatsCache: AsteroidSummary | null = null;
let asteroidsCache: Asteroid[] | null = null;
let hazardousAsteroidsCache: Asteroid[] | null = null;
let solarFlaresCache: SpaceWeatherEvent[] | null = null;
let marsPhotosCache: MarsPhoto[] | null = null;

export function getCachedApod(): ApodEntry | null {
  return apodCache;
}

export function getCachedAsteroidStats(): AsteroidSummary | null {
  return asteroidStatsCache;
}

export function getCachedAsteroids(): Asteroid[] | null {
  return asteroidsCache;
}

export function getCachedHazardousAsteroids(): Asteroid[] | null {
  return hazardousAsteroidsCache;
}

export function getCachedSolarFlares(): SpaceWeatherEvent[] | null {
  return solarFlaresCache;
}

export function getCachedMarsPhotos(): MarsPhoto[] | null {
  return marsPhotosCache;
}

export function getApodToday() {
  const promise = apiClient.get<{ data: ApodEntry }>("/apod/today");
  promise.then((res) => {
    apodCache = res.data;
  }).catch(() => {});
  return promise;
}

export function getAsteroidStats() {
  const promise = apiClient.get<{ data: AsteroidSummary }>("/asteroids/stats");
  promise.then((res) => {
    asteroidStatsCache = res.data;
  }).catch(() => {});
  return promise;
}

export function getAsteroids() {
  const promise = apiClient.get<{ data: Asteroid[] }>("/asteroids");
  promise.then((res) => {
    asteroidsCache = res.data;
  }).catch(() => {});
  return promise;
}

export function getHazardousAsteroids() {
  const promise = apiClient.get<{ data: Asteroid[] }>("/asteroids/hazardous");
  promise.then((res) => {
    hazardousAsteroidsCache = res.data;
  }).catch(() => {});
  return promise;
}

export function getSolarFlares() {
  const promise = apiClient.get<{ data: SpaceWeatherEvent[] }>("/weather/solar-flares");
  promise.then((res) => {
    solarFlaresCache = res.data;
  }).catch(() => {});
  return promise;
}

export function getCmeEvents() {
  return apiClient.get<{ data: SpaceWeatherEvent[] }>("/weather/cme");
}

export function getGeomagneticStorms() {
  return apiClient.get<{ data: SpaceWeatherEvent[] }>("/weather/storms");
}

export function getMarsPhotos(params?: {
  rover?: string;
  camera?: string;
  sol?: number;
  earth_date?: string;
  page?: number;
}) {
  const query = new URLSearchParams();
  let isDefault = true;
  if (params) {
    if (params.rover) { query.set("rover", params.rover); isDefault = false; }
    if (params.camera) { query.set("camera", params.camera); isDefault = false; }
    if (params.sol !== undefined && params.sol !== null) { query.set("sol", String(params.sol)); isDefault = false; }
    if (params.earth_date) { query.set("earth_date", params.earth_date); isDefault = false; }
    if (params.page !== undefined) { query.set("page", String(params.page)); isDefault = false; }
  }
  const queryString = query.toString();
  const promise = apiClient.get<{ data: MarsPhoto[] }>(`/mars/photos${queryString ? `?${queryString}` : ""}`);
  if (isDefault) {
    promise.then((res) => {
      marsPhotosCache = res.data;
    }).catch(() => {});
  }
  return promise;
}

export type SpaceWeatherAlert = {
  id: number;
  event_id: string;
  event_type: string;
  start_time: string;
  ai_explanation: string | null;
  details: string;
};

export function saveMarsPhoto(
  photo: {
    photo_id: string;
    title?: string;
    img_src: string;
    earth_date: string;
    rover: string;
    camera: string;
  },
  token: string,
) {
  return apiClient.post<{ data: MarsPhoto }, typeof photo>("/mars/saved", photo, { token });
}

export function getSavedMarsPhotos(token: string) {
  return apiClient.get<{ data: MarsPhoto[] }>("/mars/saved", { token });
}

export function deleteSavedMarsPhoto(photoId: string, token: string) {
  return apiClient.delete<void>(`/mars/saved/${photoId}`, { token });
}

// Client-side Caches
let weatherAlertsCache: SpaceWeatherAlert[] | null = null;
let launchesCache: { upcoming: LaunchItem[]; past: LaunchItem[] } | null = null;
const librarySearchCache: Record<string, LibraryImage[]> = {};

export function getCachedWeatherAlerts(): SpaceWeatherAlert[] | null {
  return weatherAlertsCache;
}

export function getCachedLaunches(): { upcoming: LaunchItem[]; past: LaunchItem[] } | null {
  return launchesCache;
}

export function getCachedLibrarySearch(q: string): LibraryImage[] | null {
  return librarySearchCache[q.toLowerCase().trim()] || null;
}

export function getWeatherAlerts() {
  const promise = apiClient.get<{ data: SpaceWeatherAlert[] }>("/weather/alerts");
  promise.then((res) => {
    weatherAlertsCache = res.data;
  }).catch(() => {});
  return promise;
}

export function getEarthEpic() {
  return apiClient.get<{ data: unknown[] }>("/explorer/earth-epic");
}

export function getIssPosition() {
  return apiClient.get<{ data: { latitude: number; longitude: number; timestamp: number } }>("/explorer/iss-position");
}

export function getSpaceCrew() {
  return apiClient.get<{ data: { name: string; craft: string }[] }>("/explorer/space-crew");
}

export function summarizeContent(content: string) {
  return apiClient.post<{ data: { summary: string } }, { content: string }>("/ai/summarize", {
    content,
  });
}

export function analyzeContent(content: string) {
  return apiClient.post<{ data: { analysis: string } }, { content: string }>("/ai/analyze", {
    content,
  });
}

export function analyzeWeatherAlert(alertId: number) {
  return apiClient.post<{ data: SpaceWeatherAlert }, Record<string, never>>(`/weather/alerts/${alertId}/analyze`, {});
}

export type ChatHistoryItem = {
  role: "user" | "assistant";
  content: string;
};

export function chatSpace(history: ChatHistoryItem[], message: string) {
  return apiClient.post<{ data: { reply: string } }, { history: ChatHistoryItem[]; message: string }>("/ai/chat", {
    history,
    message,
  });
}

export type LibraryImage = {
  title: string;
  description: string;
  nasa_id: string;
  date: string;
  thumbnail_url: string;
  high_res_url: string;
};

export type LaunchItem = {
  id: string;
  name: string;
  status: string;
  status_code: string;
  date: string;
  provider: string;
  rocket: string;
  location: string;
  image: string;
  description: string;
  orbit: string;
};

export function searchLibrary(q: string) {
  const promise = apiClient.get<{ data: LibraryImage[] }>(`/library/search?q=${encodeURIComponent(q)}`);
  promise.then((res) => {
    librarySearchCache[q.toLowerCase().trim()] = res.data;
  }).catch(() => {});
  return promise;
}

export function getLaunches() {
  const promise = apiClient.get<{ data: { upcoming: LaunchItem[]; past: LaunchItem[] } }>("/library/launches");
  promise.then((res) => {
    launchesCache = res.data;
  }).catch(() => {});
  return promise;
}
