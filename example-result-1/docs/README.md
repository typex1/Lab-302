# Weather App

A lightweight web application that displays a 5-day weather forecast for cities in the United States. Built with plain HTML, CSS, and vanilla JavaScript — no build step, no frameworks, no bundlers.

## Overview

Users enter a US city name into a search field, and the app retrieves and displays a 5-day forecast in a table, with emoji icons representing each day's weather conditions.

- **Geocoding**: [Nominatim (OpenStreetMap)](https://nominatim.openstreetmap.org/) resolves city names to latitude/longitude, restricted to US results via `countrycodes=us`. Nominatim is used instead of the US Census Bureau Geocoder because it supports browser CORS out of the box.
- **Forecast data**: [National Weather Service API](https://api.weather.gov/) returns forecast periods for a given coordinate.
- **Server**: A local Python HTTP server on `localhost:8080`, started by a shell script (`0-server.sh`) or a Windows batch fallback (`server.bat`).

## Features

- Search any US city by name, no hardcoded city list.
- 5-day forecast shown in a table with date, condition icon, description, high (°F), and low (°F).
- Emoji icons for sunny, rainy, snowy, cloudy, and a default fallback.
- Inline error messages for empty input, unknown cities, out-of-coverage locations, and network failures.
- Loading indicator while a request is in flight.

## Quick Start

### Prerequisites

- Python 3 (macOS and Linux come with `python3`; on Windows install `python`).
- A modern browser.

### Run the App

On macOS or Linux:

```bash
bash 0-server.sh
```

On Windows:

```bat
server.bat
```

Then open `http://localhost:8080` in your browser.

If port 8080 is already in use, both scripts print an error and exit with a non-zero status code.

## Project Structure

```
/ (repo root)
├── 0-server.sh            POSIX start script (python3 -m http.server 8080)
├── server.bat             Windows fallback (python -m http.server 8080)
├── index.html             Single-page UI: form, loading, error, table container
├── styles.css             Minimal styling
├── js/
│   ├── ui.js              DOM wiring, inline input validation, rendering
│   ├── forecastClient.js  Nominatim + NWS calls with host allowlist
│   ├── transform.js       collapseToFiveDays (pure function)
│   └── icons.js           iconFor (pure function)
├── test.html              Loads modules and runs a few console.assert checks
├── docs/
│   └── README.md          This file
└── .kiro/specs/weather-app/
    ├── requirements.md
    ├── design.md
    └── tasks.md
```

## How It Works

1. The user enters a US city name and submits the form (Enter or Search button).
2. `ui.js` trims the input. Empty or whitespace-only input shows `Please enter a US city name` and skips the network call.
3. `forecastClient.js` calls Nominatim with the trimmed input as the `q` parameter and `countrycodes=us&limit=1`. No local city list exists.
4. On a match, it calls `api.weather.gov/points/{lat},{lon}` to get the forecast URL, then fetches that URL.
5. `transform.js` collapses the ~14 NWS periods into 5 calendar days (day period = high, night period = low).
6. `ui.js` renders the 5-row table, with `icons.js` selecting an emoji per row.

## Icon Mapping

Icons are chosen by the first-matching rule (case-insensitive substring of the conditions text):

| Precedence | Match                       | Glyph |
|------------|-----------------------------|-------|
| 1          | `sun`, `clear`              | ☀️    |
| 2          | `rain`, `shower`, `thunder` | 🌧️    |
| 3          | `snow`, `sleet`             | ❄️    |
| 4          | `cloud`, `overcast`         | ☁️    |
| 5          | (none of the above)         | 🌤️    |

`Partly Sunny` resolves to sunny (rule 1 beats rule 4).

## Error Messages

| Condition                                           | Message                                            |
|-----------------------------------------------------|----------------------------------------------------|
| Empty or whitespace-only input                      | `Please enter a US city name`                      |
| Nominatim returned no matches                       | `No US city found matching '{input}'`              |
| NWS `/points` returned 404 or no forecast URL       | `Forecast data is not available for this location.`|
| Network failure, non-2xx response, or malformed JSON| `Unable to retrieve forecast. Please try again.`   |

## Design Constraints

These are explicit project constraints reflected throughout the code:

- No classes, no TypeScript-style interfaces. Plain functions and plain objects only. The `Result` shape is a JSDoc comment.
- No caching. No in-memory cache, no `localStorage`, no Service Worker. Every search issues fresh HTTP requests.
- No hardcoded or stored city names. The user's trimmed input goes directly to Nominatim.
- Outbound host allowlist: only `nominatim.openstreetmap.org` and `api.weather.gov`. Any other host is rejected before `fetch` is called.
- No build step. All JavaScript is loaded as ES modules via `<script type="module">`.

## Testing

Testing is intentionally minimal to fit a ~20-minute implementation budget.

Open `test.html` in a browser. A few `console.assert` checks run inline:

- `iconFor("Sunny")` is ☀️, `iconFor("Chance Rain Showers")` is 🌧️, `iconFor("Partly Sunny")` is ☀️.
- `collapseToFiveDays(fixture)` returns exactly 5 days with strictly increasing `isoDate`.

Check the browser console for assertion failures.

## External APIs

### Nominatim

```
GET https://nominatim.openstreetmap.org/search?q={city}&format=json&countrycodes=us&limit=1
User-Agent: weather-app/1.0 (localhost demo)
```

`lat` and `lon` come back as strings and must be parsed with `parseFloat`. An empty array means no match.

### NWS `/points`

```
GET https://api.weather.gov/points/{lat},{lon}
Accept: application/geo+json
```

A 404 means the coordinate is outside NWS coverage. Success returns `properties.forecast` — the URL to call next.

### NWS forecast

```
GET {forecastUrl}
Accept: application/geo+json
```

Returns `properties.periods`, roughly 14 alternating day/night periods.

## Troubleshooting

- **Port 8080 in use**: stop the other process or free the port. Both scripts detect this and exit with a non-zero status.
- **`0-server.sh` path issues**: use `server.bat` on Windows, or invoke Python directly: `python3 -m http.server 8080`.
- **CORS errors**: the app uses Nominatim specifically to avoid CORS. If you swap in another geocoder, expect browser-side CORS rejections.
- **No forecast for a valid coordinate**: NWS does not cover areas outside the 50 US states, DC, and US territories.

## Specs

Full requirements, design, and task breakdown live in `.kiro/specs/weather-app/`:

- `requirements.md` — acceptance criteria in EARS format.
- `design.md` — architecture, data shapes, API contracts, and server scripts.
- `tasks.md` — incremental implementation plan.
