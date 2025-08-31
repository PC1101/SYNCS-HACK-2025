// server/index.ts
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { getRainfallSummary } from './rainfall';

type ChatMessage = { role: 'user' | 'assistant' | 'system'; content: string };

const app = express();

/* ---------- middleware ---------- */
app.use(cors()); // If you prefer, lock this down: cors({ origin: 'http://localhost:5173' })
app.use(express.json({ limit: '1mb' }));

/* ---------- health ---------- */
app.get('/api/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

/* ---------- dataset helpers ---------- */
const DATA_DIR = path.join(process.cwd(), 'public', 'data');

function getDatasetMeta() {
    if (!fs.existsSync(DATA_DIR)) {
        return { stationCount: 0, stations: [], global: {} as any };
    }

    const files = fs
        .readdirSync(DATA_DIR)
        .filter((f) => f.startsWith('rain_json_') && f.endsWith('.json'));

    let minFrom: number | undefined;
    let maxTo: number | undefined;
    let lastModified = 0;

    const stations = files.map((file) => {
        const m = file.match(/rain_json_(\d{6})_(\d{4})_(\d{4})\.json$/);
        let stationNum = '';
        let fromYear: number | undefined;
        let toYear: number | undefined;

        if (m) {
            stationNum = m[1];
            fromYear = Number(m[2]);
            toYear = Number(m[3]);

            if (!isNaN(fromYear)) minFrom = Math.min(minFrom ?? fromYear, fromYear);
            if (!isNaN(toYear))   maxTo   = Math.max(maxTo   ?? toYear,   toYear);
        }

        const stat = fs.statSync(path.join(DATA_DIR, file));
        if (stat.mtimeMs > lastModified) lastModified = stat.mtimeMs;

        return { stationNum, fromYear, toYear, file: `/data/${file}` };
    });

    return {
        stationCount: stations.length,
        stations,
        global: {
            fromYear: minFrom,
            toYear: maxTo,
            lastModified,
        },
    };
}

/* ---------- rainfall routes ---------- */

// POST /api/rainfall  { stationNum, year?, month? }
app.post('/api/rainfall', (req, res) => {
    try {
        const { stationNum, year, month } = req.body ?? {};
        const result = getRainfallSummary({ stationNum, year, month });
        res.json(result);
    } catch (e: any) {
        res.status(400).json({ error: e?.message || 'Bad request' });
    }
});

// GET /api/rainfall/meta
app.get('/api/rainfall/meta', (_req, res) => {
    try {
        res.json(getDatasetMeta());
    } catch (e: any) {
        res.status(500).json({ error: e?.message || 'Failed to read dataset meta' });
    }
});

// (optional) GET /api/rainfall/file/:stationNum  (serves one matching file)
app.get('/api/rainfall/file/:stationNum', (req, res) => {
    const stationNum = req.params.stationNum;
    try {
        if (!fs.existsSync(DATA_DIR)) return res.status(404).end('No data dir');

        const files = fs
            .readdirSync(DATA_DIR)
            .filter((f) => f.startsWith(`rain_json_${stationNum}_`) && f.endsWith('.json'));

        if (!files.length) return res.status(404).end('Not found');

        const filePath = path.join(DATA_DIR, files[0]);
        const json = fs.readFileSync(filePath, 'utf8');
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(json);
    } catch (e: any) {
        res.status(500).json({ error: e?.message || 'Failed to read file' });
    }
});

/* ---------- ChatGPT fallback (with local-first answers) ---------- */

// quick parser for rainfall-type questions
const MONTHS = [
    'january','february','march','april','may','june',
    'july','august','september','october','november','december'
];

function parseRainfallAsk(text: string): null | {
    stationNum?: string; // make station optional for dataset-level answers
    year?: string;
    month?: string; // Capitalized month name
    want?: 'avg' | 'total' | 'month' | 'year';
    wantsDatasetMeta?: boolean;
} {
    const t = text.toLowerCase().trim();

    // dataset meta intent
    if (/(how many stations|station count|dataset|what data|years covered|year span)/i.test(t)) {
        return { wantsDatasetMeta: true };
    }

    // station
    const stMatch = t.match(/\b\d{6}\b/);
    const stationNum = stMatch?.[0];

    // year
    const yrMatch = t.match(/\b(19|20)\d{2}\b/);
    const year = yrMatch?.[0];

    // month
    const m = MONTHS.find((m) => t.includes(m));
    const month = m ? (m.charAt(0).toUpperCase() + m.slice(1)) : undefined;

    if (!stationNum && !year && !month) return null;

    // intent heuristic
    let want: 'avg' | 'total' | 'month' | 'year' | undefined = undefined;
    if (t.includes('total')) want = 'total';
    if (month) want = 'month';
    if (t.includes('average') || t.includes('avg') || t.includes('mean')) want = 'avg';
    if (!month && year && (t.includes('year') || t.includes('annual'))) want = 'year';

    return { stationNum, year, month, want };
}

function formatRainfallAnswer(ask: any, data: any): string {
    if (ask.wantsDatasetMeta) {
        const meta = getDatasetMeta();
        const last = meta.global?.lastModified
            ? new Date(meta.global.lastModified).toLocaleString()
            : 'N/A';
        return `We currently have ${meta.stationCount} station file(s) covering ${meta.global?.fromYear ?? '—'}–${meta.global?.toYear ?? '—'}. Last updated: ${last}.`;
    }

    if (!data || data.error) {
        return `Sorry — couldn’t find data for station ${ask.stationNum ?? '(unspecified)'}${ask.year ? `, ${ask.year}` : ''}${ask.month ? ` ${ask.month}` : ''}.`;
    }

    // perYear shape (no year in ask)
    if (data.perYear) {
        const lines = Object.entries<any>(data.perYear)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([y, v]) => `• ${y}: ${v.total_mm.toFixed(1)} mm`);
        return `Totals for station ${data.stationNum}${data.stationName ? ` (${data.stationName})` : ''}:\n` + lines.join('\n');
    }

    // year summary
    if (data.year && !data.month) {
        const monthly = Object.entries<number>(data.monthly_totals_mm)
            .map(([m, v]) => `${m.slice(0,3)} ${v.toFixed(1)}`)
            .join(', ');
        return `Station ${data.stationNum}${data.stationName ? ` (${data.stationName})` : ''} — ${data.year}\n` +
            `• Annual total: ${data.total_mm.toFixed(1)} mm\n` +
            `• Avg monthly: ${data.avg_monthly_mm.toFixed(1)} mm\n` +
            `• Monthly totals: ${monthly}`;
    }

    // month summary
    if (data.year && data.month) {
        return `Station ${data.stationNum}${data.stationName ? ` (${data.stationName})` : ''} — ${data.month} ${data.year}: ${data.total_mm.toFixed(1)} mm`;
    }

    return JSON.stringify(data);
}

const hasKey = !!process.env.OPENAI_API_KEY;
const openai = hasKey ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

// Chat route: try local answers first, else stream from OpenAI
app.post('/api/chat', async (req, res) => {
    try {
        const { messages = [] } = (req.body ?? {}) as { messages: ChatMessage[] };
        const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';

        // Try to answer from local rainfall data OR dataset meta
        const ask = parseRainfallAsk(lastUser);
        if (ask) {
            if (ask.wantsDatasetMeta) {
                const text = formatRainfallAnswer(ask, {});
                res.type('text/plain').end(text);
                return;
            }
            if (ask.stationNum) {
                const result = getRainfallSummary({
                    stationNum: ask.stationNum,
                    year: ask.year,
                    month: ask.month,
                });
                const text = formatRainfallAnswer(ask, result);
                res.type('text/plain').end(text);
                return;
            }
            // If we reach here, we parsed but missing a station; fall through to OpenAI to help clarify.
        }

        // Fall back to OpenAI
        if (!openai) {
            res.status(503).type('text/plain').end('AI fallback disabled or no OPENAI_API_KEY configured.');
            return;
        }

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Transfer-Encoding', 'chunked');
        res.setHeader('Cache-Control', 'no-cache');

        const stream = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: messages.map((m) => ({ role: m.role, content: m.content })),
            temperature: 0.7,
            stream: true,
        });

        for await (const part of stream) {
            const delta = part?.choices?.[0]?.delta?.content;
            if (delta) res.write(delta);
        }
        res.end();
    } catch (err: any) {
        const status = err?.status ?? err?.statusCode ?? err?.response?.status ?? 500;
        const msg = err?.response?.data?.error?.message || err?.message || 'Server error';
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.status(status).end(JSON.stringify({ error: msg, code: err?.code || 'server_error' }));
    }
});

/* ---------- (optional) serve built frontend in prod ----------
import path from 'path';
app.use(express.static(path.join(process.cwd(), 'dist')));
app.get('*', (_req, res) => res.sendFile(path.join(process.cwd(), 'dist', 'index.html')));
--------------------------------------------------------------- */

const PORT = Number(process.env.PORT || 8787);
app.listen(PORT, () => {
    console.log(`Server ready on http://localhost:${PORT}`);
    if (!hasKey) console.warn('[warn] OPENAI_API_KEY is not set. /api/chat will only give local answers.');
});
