/**
 * UI layer for the Weather App.
 *
 * Owns DOM wiring for the search form, inline input validation (trim +
 * empty check), loading indicator, error messages, and forecast table
 * rendering. Dispatches on the tagged Result returned by
 * `forecastClient.getFiveDayForecast(city)`.
 *
 * Plain functions only — no classes, no interfaces, no caching. The
 * `Result` shape is documented in `forecastClient.js`.
 */

import { getFiveDayForecast } from './forecastClient.js';
import { iconFor } from './icons.js';

// ---------------------------------------------------------------------------
// DOM lookups
// ---------------------------------------------------------------------------

const form = document.getElementById('search-form');
const input = document.getElementById('city-input');
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const containerEl = document.getElementById('forecast-container');

// ---------------------------------------------------------------------------
// Small DOM helpers
// ---------------------------------------------------------------------------

/**
 * Show the error element with the given message text. Uses
 * `textContent` so user-provided input cannot inject HTML.
 *
 * @param {string} message
 */
function showError(message) {
  errorEl.textContent = message;
  errorEl.hidden = false;
}

/** Hide and clear the error element. */
function hideError() {
  errorEl.textContent = '';
  errorEl.hidden = true;
}

/** Show the loading indicator. */
function showLoading() {
  loadingEl.hidden = false;
}

/** Hide the loading indicator. */
function hideLoading() {
  loadingEl.hidden = true;
}

/** Remove any previously rendered forecast table. */
function clearTable() {
  containerEl.textContent = '';
}

// ---------------------------------------------------------------------------
// Table rendering (task 4.4)
// ---------------------------------------------------------------------------

/**
 * Render the Five_Day_Forecast as a table in `#forecast-container`,
 * replacing any previously rendered table. Columns in order:
 * Date, Icon, Conditions, High (°F), Low (°F). Uses `textContent` to
 * avoid HTML injection from any user-derived strings.
 *
 * @param {Array<{date: string, isoDate: string, conditions: string, highF: number, lowF: number}>} forecast
 */
export function renderTable(forecast) {
  clearTable();

  const table = document.createElement('table');
  table.className = 'forecast-table';

  // Header row
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  const headers = ['Date', 'Icon', 'Conditions', 'High (\u00B0F)', 'Low (\u00B0F)'];
  for (const label of headers) {
    const th = document.createElement('th');
    th.textContent = label;
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Body rows (one per Forecast_Day, chronological order as given)
  const tbody = document.createElement('tbody');
  for (const day of forecast) {
    const row = document.createElement('tr');

    const dateCell = document.createElement('td');
    dateCell.textContent = day.date;
    row.appendChild(dateCell);

    const iconCell = document.createElement('td');
    iconCell.className = 'icon-cell';
    iconCell.textContent = iconFor(day.conditions);
    row.appendChild(iconCell);

    const conditionsCell = document.createElement('td');
    conditionsCell.textContent = day.conditions;
    row.appendChild(conditionsCell);

    const highCell = document.createElement('td');
    highCell.textContent = String(day.highF);
    row.appendChild(highCell);

    const lowCell = document.createElement('td');
    lowCell.textContent = String(day.lowF);
    row.appendChild(lowCell);

    tbody.appendChild(row);
  }
  table.appendChild(tbody);

  containerEl.appendChild(table);
}

// ---------------------------------------------------------------------------
// Result dispatch (task 4.3)
// ---------------------------------------------------------------------------

/**
 * Dispatch on the tagged Result from `getFiveDayForecast` and render
 * the appropriate UI: either the forecast table or one of the three
 * error messages.
 *
 * @param {{ok: true, forecast: Array}
 *        | {ok: false, kind: "not_found", input: string}
 *        | {ok: false, kind: "out_of_coverage"}
 *        | {ok: false, kind: "network"}} result
 */
function handleResult(result) {
  if (result.ok) {
    renderTable(result.forecast);
    return;
  }

  if (result.kind === 'not_found') {
    showError(`No US city found matching '${result.input}'`);
    return;
  }

  if (result.kind === 'out_of_coverage') {
    showError('Forecast data is not available for this location.');
    return;
  }

  // kind === 'network' (and any unexpected fallthrough)
  showError('Unable to retrieve forecast. Please try again.');
}

// ---------------------------------------------------------------------------
// Form submit handler (tasks 4.1 and 4.2)
// ---------------------------------------------------------------------------

/**
 * Handle the form `submit` event. Covers both Enter key and button
 * click because `<button type="submit">` inside a `<form>` fires this
 * event for both interactions.
 *
 * Inline validation: trim the input and reject empty/whitespace-only
 * without making a network call. On valid input, show the loading
 * indicator, clear prior error/table, then dispatch on the Result.
 *
 * @param {SubmitEvent} event
 */
async function onSubmit(event) {
  event.preventDefault();

  const raw = input.value;
  const city = typeof raw === 'string' ? raw.trim() : '';

  if (city === '') {
    // Task 4.1: empty/whitespace-only input short-circuits with the
    // required message and no network call.
    hideLoading();
    clearTable();
    showError('Please enter a US city name');
    return;
  }

  // Task 4.2: before dispatching, show loading and reset prior state.
  hideError();
  clearTable();
  showLoading();

  let result;
  try {
    result = await getFiveDayForecast(city);
  } catch (_err) {
    // Defensive: the client is documented to always return a Result,
    // but surface any unexpected throw as a network error.
    result = { ok: false, kind: 'network' };
  } finally {
    hideLoading();
  }

  handleResult(result);
}

// ---------------------------------------------------------------------------
// Wiring
// ---------------------------------------------------------------------------

form.addEventListener('submit', onSubmit);
