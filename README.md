# 🌱 UrbanOasis — Sydney 2050
*All-in-one rainfall analytics + drought‑risk demo*

> Frontend: **Vite + React + TypeScript + Tailwind + Recharts**  
> Backend: **Express (Node 18+)**, optional **OpenAI GPT** fallback for chat

---

## Table of Contents
- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Data & File Format](#data--file-format)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Install](#install)
  - [Run Dev (frontend + server)](#run-dev-frontend--server)
  - [Environment Variables](#environment-variables)
- [APIs](#apis)
  - [`GET /api/health`](#get-apihealth)
  - [`POST /api/rainfall`](#post-apirainfall)
  - [`GET /api/rainfall/meta`](#get-apirainfallmeta)
  - [`POST /api/chat`](#post-apichat)
- [Frontend Notes](#frontend-notes)
- [Tunneling / Remote Demo](#tunneling--remote-demo)
- [Build & Preview](#build--preview)
- [Troubleshooting](#troubleshooting)
- [Attribution](#attribution)

---

## Overview
UrbanOasis turns NSW rainfall station data into quick, actionable insights.  
It loads **prepared BoM station JSON** files, computes **monthly/annual averages**, shows a **multi‑station bar chart**, and renders a **drought‑risk heatmap**.  
The **Chat assistant** answers rainfall questions from local JSON first, and (optionally) falls back to the **OpenAI API**.

---

## Problem Statement
Even though Sydney receives regular rainfall, only ~1/3 of suitable homes use rainwater tanks, and those that do save ~21% of household demand. Tanks are often oversized, under‑utilised, or installed by default rather than optimised. Sydney is sitting on a hidden water reserve, but decision‑makers lack tools to allocate resources proactively. UrbanOasis provides a **risk scoring system** that:
- Streams/aggregates rainfall from NSW BoM stations.
- Predicts **drought risk probability** using historical rainfall and population density.
- Converts probabilities into **1–5 risk classes** for easy visualisation.

---

## Features
- 🌧 **Rainfall analytics**: toggle stations, compare monthly averages, see wettest months & average annual totals.
- 🗺️ **Drought‑risk heatmap**: PNG visualisation indicating relative drought risk (model output).
- 💬 **Chat assistant**: local JSON Q&A → OpenAI fallback (streaming).
- 📌 **Sticky navigation + dashboard**: clean sectioned UI (Dashboard, Resources, Climate, Planning, Rainfall).

---

## Tech Stack
- **Frontend**: Vite, React, TypeScript, TailwindCSS, Recharts
- **Backend**: Express, TypeScript, OpenAI SDK (optional)
- **Dev tooling**: tsx, concurrently, ESLint

---

## Project Structure
```
server/
  index.ts          # Express server (health, rainfall, meta, chat)
  rainfall.ts       # Reads /public/data, aggregates & summarizes station JSON
src/
  App.tsx
  components/
    AverageRainfall.tsx
    Header.tsx
    Hero.tsx
    DashboardOverview.tsx
    ClimateAction.tsx
    SmartMobility.tsx
    UrbanPlanning.tsx
    ResourceManagement.tsx
    FutureWork.tsx
    Footer.tsx
  assets/
    heatmap.png     # (optional) if you import the PNG via bundler
public/
  data/
    rain_json_<STATION>_<FROM>_<TO>.json
    heatmap.png     # (recommended) if you prefer static path /data/heatmap.png
vite.config.ts
package.json
```

---

## Data & File Format

Place station files in: **`public/data/`**

**Filename pattern**
```
rain_json_<STATION_NUMBER>_<FROM_YEAR>_<TO_YEAR>.json
# e.g. rain_json_066214_2015_2025.json
```

**JSON schema**
```json
{
  "stationNum": "066214",
  "stationName": "Sydney (Observatory Hill) NSW",
  "years": {
    "2019": {
      "January": { "1": 12.4, "2": 0, "3": 5.0 },
      "February": { "1": 3.2 }
    },
    "2020": {}
  }
}
```

> `AverageRainfall.tsx` defaults to `FROM_YEAR = 2015` and `TO_YEAR = <current year>`.  
> Keep filenames consistent with these constants or update the constants to match your files.

**Heatmap image**
- If using **public**: put `public/data/heatmap.png` and reference `/data/heatmap.png`.
- If using **bundled asset**: put `src/assets/heatmap.png` and `import heatmapPng from "../assets/heatmap.png"`.

---

## Getting Started

### Prerequisites
- **Node 18+**
- npm (or pnpm/yarn)

### Install
```bash
npm i
```

### Run Dev (frontend + server)
```bash
# runs Express on :8787 and Vite on :5173 with proxy /api → :8787
npm run dev:local
```
Open: <http://localhost:5173>

**Key scripts (from `package.json`)**
```json
{
  "dev": "vite",
  "dev:server": "tsx server/index.ts",
  "dev:web": "vite",
  "dev:all": "concurrently -k -n server,web \"npm:dev:server\" \"npm:dev:web\"",
  "build": "vite build",
  "lint": "eslint .",
  "preview": "vite preview",
  "dev:local": "npm run dev:all",
  "dev:tunnel": "VITE_TUNNEL_HOST=urbanoasis.apdcrew.com npm run dev:all"
}
```

### Environment Variables
Create a **`.env`** in project root for OpenAI fallback:
```
OPENAI_API_KEY=sk-your-key
PORT=8787
```
> Without a key, chat still answers structured rainfall questions from local JSON; general GPT prompts will be unavailable.

---

## APIs

### `GET /api/health`
```json
{ "ok": true, "ts": 1712345678901 }
```

### `POST /api/rainfall`
Summarize from local JSON.

**Body**
```json
{ "stationNum": "066214", "year": "2023", "month": "March" }
```

**Responses**
- **No `year`** → totals per year:
```json
{
  "stationNum":"066214",
  "stationName":"Sydney (Observatory Hill) NSW",
  "perYear": { "2019": { "total_mm": 820.3 }, "2020": { "total_mm": 905.1 } }
}
```
- **Year only** → annual summary:
```json
{
  "stationNum":"066214",
  "stationName":"Sydney (Observatory Hill) NSW",
  "year":"2023",
  "total_mm":965.2,
  "avg_monthly_mm":80.4,
  "monthly_totals_mm":{"January":50.0,"February":72.3,"...":90.1}
}
```
- **Year + Month** → monthly total:
```json
{ "stationNum":"066214","stationName":"Sydney (Observatory Hill) NSW","year":"2023","month":"March","total_mm":85.7 }
```

### `GET /api/rainfall/meta`
Returns dataset coverage:
```json
{
  "stationCount": 9,
  "stations": [
    { "stationNum":"066214","fromYear":2015,"toYear":2025,"file":"/data/rain_json_066214_2015_2025.json" }
  ],
  "global": { "fromYear":2015,"toYear":2025,"lastModified": 1712345678901 }
}
```

### `POST /api/chat`
- Parses rainfall questions locally first (e.g. “066214 2023 total”, “066214 March 2023”).  
- If unknown, **streams** GPT replies (requires `OPENAI_API_KEY`).

**cURL**
```bash
curl -N -X POST http://localhost:8787/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"066214 March 2023?"}]}'
```

---

## Frontend Notes
- `AverageRainfall.tsx`
  - Fetches `/public/data/rain_json_*.json`, computes **monthly averages** by station across available years, renders a **multi‑series bar chart** (Recharts).
  - Station chips let you toggle series.
  - Below chart, station cards show **avg annual rainfall** and **wettest month**.
  - Heatmap:
    - Public file: `<img src="/data/heatmap.png" />`
    - Bundled asset:
      ```tsx
      import heatmapPng from "../assets/heatmap.png";
      <img src={heatmapPng} alt="Rainfall heatmap" />
      ```

- `vite.config.ts` proxies `/api/*` → `http://localhost:8787`.

---

## Tunneling / Remote Demo
If you expose your dev box via a tunnel (Cloudflare/Ngrok), run:
```bash
npm run dev:tunnel
# uses VITE_TUNNEL_HOST=urbanoasis.apdcrew.com for HMR over WSS
```
Ensure your tunnel forwards **5173** (frontend) and **8787** (API), or host the API separately.

---

## Build & Preview
```bash
npm run build
npm run preview   # serves dist/ on http://localhost:4173
```
For production, serve `dist/` statically and run the Express API (`server/index.ts`) on a server or serverless platform. If you want a single host, proxy `/api/*` to the API from your web server.

---

## Troubleshooting
- **/api/chat 404**: Run `npm run dev:local` so both server and web start; confirm Vite proxy for `/api` points to `:8787`.
- **429 from OpenAI**: Quota exhausted or wrong project; add credit or select correct project.
- **Heatmap missing on prod**: Use `/data/heatmap.png` (file in `public/data/`) or `import heatmapPng` (file in `src/assets/`).  
- **JSON not loading**: Check filename pattern & `FROM_YEAR`/`TO_YEAR` constants in `AverageRainfall.tsx`.
- **Tunnels 502**: Lock ports (`strictPort: true`) and set `VITE_TUNNEL_HOST` correctly.

---

## Attribution
- **Rainfall data**: Bureau of Meteorology (BoM), NSW.  
- **Population data**: Australian Bureau of Statistics (ABS).  
- Demo for research/education; respect source terms/licences.
