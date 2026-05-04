/**
 * Pure transform functions for the Weather App.
 *
 * Exports `collapseToFiveDays(periods)`, which collapses the raw
 * National Weather Service forecast periods (~14 alternating
 * day/night periods) into a chronological array of up to five
 * Forecast_Day objects of the shape:
 *
 *   {
 *     date:       string   // "Mon, Jun 3", for display
 *     isoDate:    string   // "YYYY-MM-DD", local-calendar key
 *     conditions: string   // NWS shortForecast (e.g. "Sunny")
 *     highF:      number   // integer °F
 *     lowF:       number   // integer °F
 *   }
 *
 * Grouping is by the local calendar date of each period's `startTime`.
 * For each date, the day period's `temperature` is the high and the
 * night period's `temperature` is the low; conditions come from the
 * day period's `shortForecast`, falling back to the night period's.
 * Leading groups that have only a night period are dropped, and only
 * groups with both a day and a night period are kept. The first five
 * such groups are returned in chronological order with strictly
 * increasing `isoDate`.
 *
 * Temperatures in Celsius (`temperatureUnit === "C"`) are converted
 * to Fahrenheit per-period via `round((c * 9/5) + 32)`.
 *
 * Pure: does not mutate `periods`, performs no I/O, and does no
 * caching.
 */

/**
 * Return the local-calendar "YYYY-MM-DD" key for an ISO 8601 timestamp
 * with an offset. `new Date(iso)` parses the offset correctly; then we
 * read the local year/month/day components via `getFullYear` etc., so
 * the key reflects the date as seen in the browser's local timezone.
 *
 * @param {string} iso
 * @returns {string}
 */
function localIsoDate(iso) {
  const d = new Date(iso);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Display-format an ISO 8601 timestamp as e.g. "Mon, Jun 3" using the
 * browser's local timezone.
 *
 * @param {string} iso
 * @returns {string}
 */
function displayDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Convert a temperature value from a period to integer °F, honoring
 * the period's `temperatureUnit` ("F" or "C").
 *
 * @param {number} temperature
 * @param {string} unit
 * @returns {number}
 */
function toFahrenheit(temperature, unit) {
  if (unit === 'C') {
    return Math.round((temperature * 9) / 5 + 32);
  }
  return temperature;
}

/**
 * Collapse NWS forecast periods into up to five chronological
 * Forecast_Day objects. See the module-level JSDoc for full behavior.
 *
 * @param {Array<Object>} periods
 * @returns {Array<{date: string, isoDate: string, conditions: string, highF: number, lowF: number}>}
 */
export function collapseToFiveDays(periods) {
  if (!Array.isArray(periods) || periods.length === 0) {
    return [];
  }

  // Group periods by local calendar date, preserving first-seen order.
  const order = [];
  const groups = new Map();
  for (const period of periods) {
    const isoDate = localIsoDate(period.startTime);
    if (!groups.has(isoDate)) {
      groups.set(isoDate, { isoDate, day: null, night: null });
      order.push(isoDate);
    }
    const group = groups.get(isoDate);
    if (period.isDaytime) {
      if (group.day === null) group.day = period;
    } else {
      if (group.night === null) group.night = period;
    }
  }

  // Drop leading groups until the first group has a day period (i.e.
  // discard a leading night-only group).
  let startIndex = 0;
  while (startIndex < order.length && groups.get(order[startIndex]).day === null) {
    startIndex += 1;
  }

  const days = [];
  for (let i = startIndex; i < order.length && days.length < 5; i += 1) {
    const group = groups.get(order[i]);
    if (group.day === null || group.night === null) continue;

    const dayPeriod = group.day;
    const nightPeriod = group.night;

    days.push({
      date: displayDate(dayPeriod.startTime),
      isoDate: group.isoDate,
      conditions: dayPeriod.shortForecast || nightPeriod.shortForecast || '',
      highF: toFahrenheit(dayPeriod.temperature, dayPeriod.temperatureUnit),
      lowF: toFahrenheit(nightPeriod.temperature, nightPeriod.temperatureUnit),
    });
  }

  return days;
}
