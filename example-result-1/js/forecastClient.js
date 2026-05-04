/**
 * Forecast client for the Weather App.
 *
 * Owns all network I/O: Nominatim geocoding plus the two-step NWS
 * forecast fetch (`/points/{lat},{lon}` then the returned forecast
 * URL). Enforces a host allowlist and surfaces domain errors as a
 * tagged Result object (documented via JSDoc, not a TS interface).
 * No caching — every call issues fresh HTTP requests.
 *
 * Result shape (documentation only — not a TS interface):
 *
 *   { ok: true,  forecast: Five_Day_Forecast }
 * | { ok: false, kind: "not_found",       input: string }
 * | { ok: false, kind: "out_of_coverage"                 }
 * | { ok: false, kind: "network"                         }
 */

import { collapseToFiveDays } from './transform.js';

const ALLOWED_HOSTS = new Set([
  'nominatim.openstreetmap.org',
  'api.weather.gov',
]);

const NOMINATIM_USER_AGENT = 'weather-app/1.0 (localhost demo)';

/**
 * Parse a URL and return true only if its host is in the allowlist
 * (`nominatim.openstreetmap.org` or `api.weather.gov`). A malformed
 * URL returns false.
 *
 * @param {string} url
 * @returns {boolean}
 */
function isAllowedUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch (_err) {
    return false;
  }
  return ALLOWED_HOSTS.has(parsed.host);
}

/**
 * Guarded `fetch` wrapper. Rejects URLs whose host is not in the
 * allowlist without issuing a request. Returns the `Response` on
 * success, or `null` on any allowlist rejection, fetch rejection, or
 * non-OK status the caller has not opted into handling. Callers that
 * need to distinguish specific statuses (e.g. 404 for `/points`) can
 * pass `allowStatuses`.
 *
 * @param {string} url
 * @param {RequestInit} [init]
 * @param {number[]} [allowStatuses] non-2xx statuses to still return
 * @returns {Promise<Response|null>}
 */
async function guardedFetch(url, init, allowStatuses = []) {
  if (!isAllowedUrl(url)) {
    return null;
  }
  try {
    const response = await fetch(url, init);
    if (response.ok || allowStatuses.includes(response.status)) {
      return response;
    }
    return null;
  } catch (_err) {
    return null;
  }
}

/**
 * Resolve a US city name to a { lat, lon } pair via Nominatim.
 *
 * Returns one of:
 *   { ok: true,  lat: number, lon: number }
 *   { ok: false, kind: "not_found", input: string }
 *   { ok: false, kind: "network" }
 *
 * @param {string} city
 */
async function geocode(city) {
  const url =
    'https://nominatim.openstreetmap.org/search' +
    `?q=${encodeURIComponent(city)}` +
    '&format=json' +
    '&countrycodes=us' +
    '&limit=1';

  const response = await guardedFetch(url, {
    headers: {
      'User-Agent': NOMINATIM_USER_AGENT,
      Accept: 'application/json',
    },
  });
  if (response === null) {
    return { ok: false, kind: 'network' };
  }

  let results;
  try {
    results = await response.json();
  } catch (_err) {
    return { ok: false, kind: 'network' };
  }

  if (!Array.isArray(results) || results.length === 0) {
    return { ok: false, kind: 'not_found', input: city };
  }

  const first = results[0];
  const lat = parseFloat(first.lat);
  const lon = parseFloat(first.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return { ok: false, kind: 'network' };
  }

  return { ok: true, lat, lon };
}

/**
 * Hit NWS `/points/{lat},{lon}` and return the forecast URL.
 *
 * Returns one of:
 *   { ok: true,  forecastUrl: string }
 *   { ok: false, kind: "out_of_coverage" }
 *   { ok: false, kind: "network" }
 *
 * @param {number} lat
 * @param {number} lon
 */
async function getPoints(lat, lon) {
  const url = `https://api.weather.gov/points/${lat},${lon}`;

  // Need to distinguish 404 (out-of-coverage) from other failures, so
  // allow status 404 through the guard and inspect it here.
  if (!isAllowedUrl(url)) {
    return { ok: false, kind: 'network' };
  }

  let response;
  try {
    response = await fetch(url, {
      headers: { Accept: 'application/geo+json' },
    });
  } catch (_err) {
    return { ok: false, kind: 'network' };
  }

  if (response.status === 404) {
    return { ok: false, kind: 'out_of_coverage' };
  }
  if (!response.ok) {
    return { ok: false, kind: 'network' };
  }

  let body;
  try {
    body = await response.json();
  } catch (_err) {
    return { ok: false, kind: 'network' };
  }

  const forecastUrl = body && body.properties && body.properties.forecast;
  if (typeof forecastUrl !== 'string' || forecastUrl.length === 0) {
    return { ok: false, kind: 'out_of_coverage' };
  }

  return { ok: true, forecastUrl };
}

/**
 * Fetch the NWS forecast URL and return its `properties.periods` array.
 *
 * Returns one of:
 *   { ok: true,  periods: Array }
 *   { ok: false, kind: "network" }
 *
 * @param {string} forecastUrl
 */
async function getForecast(forecastUrl) {
  const response = await guardedFetch(forecastUrl, {
    headers: { Accept: 'application/geo+json' },
  });
  if (response === null) {
    return { ok: false, kind: 'network' };
  }

  let body;
  try {
    body = await response.json();
  } catch (_err) {
    return { ok: false, kind: 'network' };
  }

  const periods = body && body.properties && body.properties.periods;
  if (!Array.isArray(periods)) {
    return { ok: false, kind: 'network' };
  }

  return { ok: true, periods };
}

/**
 * Orchestrate geocode → points → forecast → collapseToFiveDays.
 *
 * Returns a tagged Result object:
 *   { ok: true,  forecast: Five_Day_Forecast }
 * | { ok: false, kind: "not_found", input: string }
 * | { ok: false, kind: "out_of_coverage" }
 * | { ok: false, kind: "network" }
 *
 * No caching: every call issues fresh HTTP requests.
 *
 * @param {string} city
 */
export async function getFiveDayForecast(city) {
  const geo = await geocode(city);
  if (!geo.ok) {
    return geo;
  }

  const points = await getPoints(geo.lat, geo.lon);
  if (!points.ok) {
    return points;
  }

  const forecast = await getForecast(points.forecastUrl);
  if (!forecast.ok) {
    return forecast;
  }

  const days = collapseToFiveDays(forecast.periods);
  return { ok: true, forecast: days };
}
