/**
 * Icon mapping for the Weather App.
 *
 * Exports a pure `iconFor(conditions)` function that maps an NWS
 * `shortForecast` string (e.g. "Sunny", "Partly Sunny", "Chance Rain
 * Showers", "Snow", "Cloudy") to a single emoji glyph.
 *
 * Matching rules (first match wins; all matches are case-insensitive):
 *
 *   1. Sunny   — matches /sun|clear/        → ☀️
 *   2. Rainy   — matches /rain|shower|thunder/ → 🌧️
 *   3. Snowy   — matches /snow|sleet/       → ❄️
 *   4. Cloudy  — matches /cloud|overcast/   → ☁️
 *   5. Default — (none of the above)        → 🌤️
 *
 * Precedence note: "Partly Sunny" contains both "sun" and (arguably via
 * phrasing) a cloud-leaning feel, but the sunny rule is listed first and
 * therefore wins, returning ☀️. This matches the clause ordering in
 * Requirements 3.3–3.7.
 *
 * This function is pure: no caching, no I/O, no mutation of inputs. A
 * non-string or empty input falls through to the default glyph.
 *
 * @param {string} conditions NWS shortForecast text.
 * @returns {string} An emoji glyph representing the conditions.
 */
export function iconFor(conditions) {
  const text = typeof conditions === 'string' ? conditions : '';

  // Ordered list; first match wins.
  const rules = [
    { regex: /sun|clear/i,           glyph: '\u2600\uFE0F'        }, // ☀️
    { regex: /rain|shower|thunder/i, glyph: '\uD83C\uDF27\uFE0F' }, // 🌧️
    { regex: /snow|sleet/i,          glyph: '\u2744\uFE0F'        }, // ❄️
    { regex: /cloud|overcast/i,      glyph: '\u2601\uFE0F'        }, // ☁️
  ];

  for (const { regex, glyph } of rules) {
    if (regex.test(text)) return glyph;
  }

  return '\uD83C\uDF24\uFE0F'; // 🌤️ default
}
