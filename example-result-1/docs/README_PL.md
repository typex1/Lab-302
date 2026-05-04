# Aplikacja Pogodowa

Lekka aplikacja webowa, która wyświetla 5-dniową prognozę pogody dla miast w Stanach Zjednoczonych. Zbudowana w czystym HTML, CSS i zwykłym JavaScripcie — bez kroku budowania, bez frameworków, bez bundlerów.

## Opis

Użytkownik wpisuje nazwę miasta w USA w polu wyszukiwania, a aplikacja pobiera i wyświetla 5-dniową prognozę w tabeli, z ikonami emoji reprezentującymi warunki pogodowe każdego dnia.

- **Geokodowanie**: [Nominatim (OpenStreetMap)](https://nominatim.openstreetmap.org/) zamienia nazwy miast na współrzędne geograficzne, ograniczone do wyników z USA przez parametr `countrycodes=us`. Nominatim jest używany zamiast geokodera US Census Bureau, ponieważ obsługuje przeglądarkowy CORS bez dodatkowej konfiguracji.
- **Dane prognozy**: [National Weather Service API](https://api.weather.gov/) zwraca okresy prognozy dla podanych współrzędnych.
- **Serwer**: lokalny serwer HTTP w Pythonie na `localhost:8080`, uruchamiany skryptem powłoki (`0-server.sh`) lub skryptem wsadowym Windows (`server.bat`) jako wariant zapasowy.

## Funkcje

- Wyszukiwanie dowolnego miasta w USA po nazwie, bez zakodowanej na stałe listy miast.
- 5-dniowa prognoza w tabeli z datą, ikoną warunków, opisem, temperaturą maksymalną (°F) i minimalną (°F).
- Ikony emoji dla słonecznie, deszczowo, śnieżnie, pochmurno oraz domyślna.
- Komunikaty błędów inline dla pustego pola, nieznanych miast, lokalizacji poza zasięgiem i błędów sieci.
- Wskaźnik ładowania w trakcie zapytania.

## Szybki start

### Wymagania

- Python 3 (macOS i Linux mają `python3` w standardzie; w Windows zainstaluj `python`).
- Nowoczesna przeglądarka.

### Uruchomienie aplikacji

W systemie macOS lub Linux:

```bash
bash 0-server.sh
```

W systemie Windows:

```bat
server.bat
```

Następnie otwórz `http://localhost:8080` w przeglądarce.

Jeśli port 8080 jest już zajęty, oba skrypty wypisują komunikat błędu i kończą się niezerowym kodem wyjścia.

## Struktura projektu

```
/ (root repozytorium)
├── 0-server.sh            skrypt startowy POSIX (python3 -m http.server 8080)
├── server.bat             zapasowy skrypt Windows (python -m http.server 8080)
├── index.html             jednostronicowe UI: formularz, ładowanie, błąd, kontener tabeli
├── styles.css             minimalne style
├── js/
│   ├── ui.js              obsługa DOM, walidacja inline, renderowanie
│   ├── forecastClient.js  wywołania Nominatim + NWS z allowlistą hostów
│   ├── transform.js       collapseToFiveDays (funkcja czysta)
│   └── icons.js           iconFor (funkcja czysta)
├── test.html              ładuje moduły i uruchamia kilka sprawdzeń console.assert
├── docs/
│   ├── README.md          dokumentacja po angielsku
│   └── README_PL.md       ten plik
└── .kiro/specs/weather-app/
    ├── requirements.md
    ├── design.md
    └── tasks.md
```

## Jak to działa

1. Użytkownik wpisuje nazwę miasta w USA i zatwierdza formularz (Enter lub przycisk Search).
2. `ui.js` przycina wprowadzony tekst. Puste lub samo-białoznakowe dane wejściowe pokazują `Please enter a US city name` (Wpisz nazwę miasta w USA) i pomijają zapytanie sieciowe.
3. `forecastClient.js` wywołuje Nominatim z przyciętym tekstem jako parametrem `q` oraz `countrycodes=us&limit=1`. Nie istnieje lokalna lista miast.
4. Przy trafieniu wywołuje `api.weather.gov/points/{lat},{lon}`, aby uzyskać URL prognozy, a następnie pobiera ten URL.
5. `transform.js` składa około 14 okresów NWS w 5 dni kalendarzowych (okres dzienny = maksymalna, okres nocny = minimalna).
6. `ui.js` renderuje tabelę z 5 wierszami, a `icons.js` dobiera emoji dla każdego wiersza.

## Mapowanie ikon

Ikony wybierane są regułą pierwszego dopasowania (podciąg opisu warunków, bez rozróżniania wielkości liter):

| Pierwszeństwo | Dopasowanie                 | Znak  |
|---------------|-----------------------------|-------|
| 1             | `sun`, `clear`              | ☀️    |
| 2             | `rain`, `shower`, `thunder` | 🌧️    |
| 3             | `snow`, `sleet`             | ❄️    |
| 4             | `cloud`, `overcast`         | ☁️    |
| 5             | (żadne z powyższych)        | 🌤️    |

`Partly Sunny` (Częściowe słońce) daje ikonę słoneczną (reguła 1 ma pierwszeństwo przed regułą 4).

## Komunikaty błędów

| Sytuacja                                                   | Komunikat                                          |
|------------------------------------------------------------|----------------------------------------------------|
| Puste lub samo-białoznakowe dane wejściowe                 | `Please enter a US city name`                      |
| Nominatim nie zwrócił dopasowań                            | `No US city found matching '{input}'`              |
| NWS `/points` zwrócił 404 lub brak URL prognozy            | `Forecast data is not available for this location.`|
| Błąd sieci, odpowiedź spoza 2xx lub nieprawidłowy JSON     | `Unable to retrieve forecast. Please try again.`   |

## Założenia projektowe

To są jawne założenia projektu, odzwierciedlone w kodzie:

- Brak klas, brak interfejsów w stylu TypeScript. Tylko zwykłe funkcje i zwykłe obiekty. Kształt `Result` jest komentarzem JSDoc.
- Brak cache. Brak pamięci podręcznej w pamięci, brak `localStorage`, brak Service Workera. Każde wyszukiwanie wysyła świeże żądania HTTP.
- Brak zakodowanych na stałe lub zapisanych nazw miast. Przycięty tekst od użytkownika trafia wprost do Nominatim.
- Allowlista hostów wychodzących: tylko `nominatim.openstreetmap.org` i `api.weather.gov`. Inne hosty są odrzucane przed wywołaniem `fetch`.
- Brak kroku budowania. Cały JavaScript ładowany jako ES modules przez `<script type="module">`.

## Testowanie

Testowanie jest celowo minimalne, aby zmieścić się w ~20-minutowym budżecie implementacji.

Otwórz `test.html` w przeglądarce. W środku uruchamia się kilka sprawdzeń `console.assert`:

- `iconFor("Sunny")` to ☀️, `iconFor("Chance Rain Showers")` to 🌧️, `iconFor("Partly Sunny")` to ☀️.
- `collapseToFiveDays(fixture)` zwraca dokładnie 5 dni ze ściśle rosnącym `isoDate`.

Sprawdź w konsoli przeglądarki, czy nie ma nieudanych asercji.

## Zewnętrzne API

### Nominatim

```
GET https://nominatim.openstreetmap.org/search?q={city}&format=json&countrycodes=us&limit=1
User-Agent: weather-app/1.0 (localhost demo)
```

`lat` i `lon` wracają jako stringi i muszą być sparsowane przez `parseFloat`. Pusta tablica oznacza brak dopasowania.

### NWS `/points`

```
GET https://api.weather.gov/points/{lat},{lon}
Accept: application/geo+json
```

Status 404 oznacza, że współrzędne są poza zasięgiem NWS. W razie powodzenia zwracany jest `properties.forecast` — URL, który należy wywołać w następnym kroku.

### Prognoza NWS

```
GET {forecastUrl}
Accept: application/geo+json
```

Zwraca `properties.periods`, około 14 naprzemiennych okresów dzień/noc.

## Rozwiązywanie problemów

- **Port 8080 zajęty**: zatrzymaj drugi proces lub zwolnij port. Oba skrypty wykrywają tę sytuację i kończą się niezerowym statusem.
- **Problemy ze ścieżkami `0-server.sh`**: użyj `server.bat` w Windows lub uruchom Pythona bezpośrednio: `python3 -m http.server 8080`.
- **Błędy CORS**: aplikacja używa Nominatim właśnie po to, by ich uniknąć. Po podmianie na inny geokoder należy liczyć się z odrzuceniami CORS w przeglądarce.
- **Brak prognozy dla poprawnych współrzędnych**: NWS nie pokrywa obszarów poza 50 stanami USA, DC i terytoriami USA.

## Specyfikacja

Pełne wymagania, projekt techniczny i plan zadań znajdują się w `.kiro/specs/weather-app/`:

- `requirements.md` — kryteria akceptacyjne w formacie EARS.
- `design.md` — architektura, kształty danych, kontrakty API i skrypty serwera.
- `tasks.md` — inkrementalny plan wdrożenia.
