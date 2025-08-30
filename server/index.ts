// server/index.ts
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

type ChatMessage = { role: 'user' | 'assistant' | 'system'; content: string };

const app = express();

// middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// health check (handy for tunnels)
app.get('/api/health', (_req, res) => {
    res.json({ ok: true, ts: Date.now() });
});

if (!process.env.OPENAI_API_KEY) {
    console.warn('[warn] OPENAI_API_KEY is not set. /api/chat will fail until you add it to .env');
}

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// stream ChatGPT-style responses
app.post('/api/chat', async (req, res) => {
    try {
        const { messages = [] } = req.body ?? {};
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Transfer-Encoding', 'chunked');
        res.setHeader('Cache-Control', 'no-cache');

        const stream = await client.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
            temperature: 0.7,
            stream: true,
        });

        for await (const part of stream) {
            const delta = part?.choices?.[0]?.delta?.content;
            if (delta) res.write(delta);
        }
        res.end();
    } catch (err: any) {
        // Map OpenAI error → proper HTTP code and readable message
        const status =
            err?.status ??
            err?.statusCode ??
            err?.response?.status ??
            500;

        const msg =
            err?.response?.data?.error?.message ||
            err?.message ||
            'Server error';

        // Send JSON for errors (easier for the client to parse)
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.status(status).end(JSON.stringify({
            error: msg,
            code: err?.code || 'server_error'
        }));
    }
});


// (optional) serve the built frontend in prod
// import path from 'path';
// app.use(express.static(path.join(process.cwd(), 'dist')));
// app.get('*', (_req, res) => res.sendFile(path.join(process.cwd(), 'dist', 'index.html')));

const PORT = Number(process.env.PORT || 8787);
app.listen(PORT, () => {
    console.log(`Chat server on http://localhost:${PORT}`);
});
