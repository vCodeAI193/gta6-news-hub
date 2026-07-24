# Self-hosted article translation

The News Hub can translate article titles and bodies into the current UI language
(currently EN ⇄ DE, extensible). Translation runs against a **self-hosted,
LibreTranslate-compatible** engine that **you** run — typically on your own server
in Germany. No third-party service, **no API costs**, and no article text ever
leaves your infrastructure (GDPR / data sovereignty).

The website itself stays a static site. It only needs the **URL** of your engine,
which you enter in **Preferences (⚙️) → Translation server**. If the field is empty
or the server is unreachable, the translate button simply doesn't appear / falls back
to the original text — the site never breaks.

---

## 1. Recommended engine: LibreTranslate (start here)

[LibreTranslate](https://github.com/LibreTranslate/LibreTranslate) uses Opus-MT /
Argos models via CTranslate2. It runs on **CPU only**, needs ~200–300 MB per language
pair, and exposes the simple HTTP API this site expects.

```bash
# Run on your German server (Docker). Only load the languages you need.
docker run -d --restart unless-stopped \
  -p 5000:5000 \
  -e LT_LOAD_ONLY=en,de,fr,ja \
  --name libretranslate \
  libretranslate/libretranslate
```

- `LT_LOAD_ONLY` keeps the footprint small (only EN/DE/FR/JA models download).
- The API endpoint is then `http://YOUR_SERVER:5000`. Enter that URL in Preferences.

### Hardware guide

| Engine | Hardware | Quality | Setup effort |
|---|---|---|---|
| **LibreTranslate (Opus-MT)** ← recommended start | CPU, ~1–2 GB RAM | good | minimal (one Docker command) |
| NLLB-200 distilled (600M / 1.3B) | CPU or small GPU, more RAM | better, 200 languages | medium |
| LLM via LTEngine (Gemma 2 9B / Qwen2.5 7B) | GPU | best / most natural | higher |

All three speak the same LibreTranslate `/translate` API, so you can upgrade later
**without changing the website** — just point the same URL at the new engine.

---

## 2. Upgrade paths (optional, same API)

- **NLLB-200**: broader language coverage and better quality than Opus-MT. Serve it
  behind a LibreTranslate-compatible wrapper.
- **LLM quality** via [LTEngine](https://github.com/LibreTranslate/LTEngine): a
  LibreTranslate-compatible server backed by a local instruct LLM (e.g. Gemma 2 9B or
  Qwen2.5 7B). Best nuance; needs a GPU. Drop-in API replacement.

---

## 3. Required server configuration (CORS + HTTPS)

Because the browser calls your engine directly (cross-origin `POST`), the engine must
allow it:

- **CORS**: the engine must return `Access-Control-Allow-Origin` for the site's origin
  and allow `POST` + `Content-Type: application/json`. LibreTranslate enables permissive
  CORS by default; behind a reverse proxy (nginx/Caddy), add the headers there.
- **HTTPS**: if the website is served over HTTPS, the translation endpoint **must also
  be HTTPS** (browsers block mixed content). Put the engine behind a TLS reverse proxy
  (e.g. Caddy auto-HTTPS) with a domain like `https://translate.your-server.de`.

Use the **"Test"** button next to the URL field in Preferences to verify reachability
and CORS in one click.

---

## 4. How the website uses it

- Implemented in [`js/translate.js`](js/translate.js). Sends
  `POST {endpoint}/translate` with `{ q, source, target, format }` and reads
  `{ translatedText }` (string or array — both handled).
- Title + excerpt + body paragraphs are sent as **one batched array request**.
- Results are **cached in `localStorage`** (per text segment, FIFO-capped at ~300),
  so re-opening an article is instant and offline-friendly, with **no repeat requests**.
- Articles already in the UI language are skipped (no button, no request).
- Every failure path resolves to the **original text** — translation is strictly
  additive and never blocks reading.

See [`DECISIONS.md`](DECISIONS.md) → ADR-011 for the rationale.
