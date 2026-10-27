# Earth Live — Żywa planeta

Interaktywny globus 3D z danymi NASA EONET i USGS, przygotowany przez **impuls. Digital Studio**.

## Status gałęzi

- `main`: gałąź docelowej produkcji. Na razie zawiera jedynie README; nie publikujemy wersji bez akceptacji QA.
- `QA`: rozwijana aplikacja i jej konfiguracja do testowych wdrożeń (Cloudflare Workers Previews).

## Funkcje

- Interaktywny globus 3D (Globe.GL / Three.js), obracanie, zoom i oznaczenia.
- Trzęsienia ziemi M2.5+ (USGS) i zjawiska naturalne (NASA EONET).
- Filtry czasu 24h / 7d / 30d, kategorie, wyszukiwanie, szczegóły, linki do źródeł.
- Języki PL/EN, układ desktop/mobile, odświeżanie co 5 minut.
- Bez kluczy API. Aplikacja może działać bez własnego backendu.

Nie jest to system ostrzegania kryzysowego. Źródła nie gwarantują danych w czasie rzeczywistym.

## Struktura QA

```
public/
  index.html    # statyczna aplikacja
  _headers      # nagłówki bezpieczeństwa Cloudflare
wrangler.jsonc   # deklaruje katalog statycznych zasobów ./public
README.md
```

## Uruchamianie lokalne

W katalogu repozytorium, na gałęzi `QA`:

```bash
python3 -m http.server 4173 --directory public
```

Otwórz `http://localhost:4173`. Nie uruchamiaj bezpośrednio przez `file://`.

## Cloudflare Workers Builds (już wybrany w Cloudflare)

- Root directory: `/`
- Build command: *brak*
- Deploy command (produkcja): `npx wrangler deploy`
- Preview command (gałęzie testowe): `npx wrangler preview`
- Konfiguracja statycznych plików: `wrangler.jsonc`, `assets.directory = "./public"`

**Ważne:** obecny branch produkcyjny w Cloudflare to `main`. Ponieważ `main` nie zawiera aplikacji, jego build nie ma czego wdrażać. Włącz **preview builds** i otwieraj podglądy `QA`. Zmiana produkcyjnej gałęzi na `QA` nie jest potrzebna.

Po zaakceptowaniu QA zmerguj `QA` do `main` i dopiero wtedy skonfiguruj domenę produkcyjną.

## Zewnętrzne źródła

- NASA EONET v3: https://eonet.gsfc.nasa.gov/docs/v3
- USGS GeoJSON: https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php
- Globe.GL: https://globe.gl/

Aplikacja ładuje też zależności JS, fonty i teksturę globusa z zewnętrznych CDN. Nie zawiera skryptów analitycznych ani cookies.
