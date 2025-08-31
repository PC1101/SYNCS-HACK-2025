import React, { useEffect, useMemo, useRef, useState } from "react";
import { Send, Loader2 } from "lucide-react";

// Drop-in chat component tailored to your existing Vite + Tailwind UI
// Usage: <Chatbot /> — place it in App.tsx under a section link in your Header (href="/#chat")

export type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

const bubble =
    "max-w-[80%] rounded-2xl px-4 py-3 shadow-sm text-[0.95rem] leading-relaxed whitespace-pre-wrap";

export default function Chatbot() {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            role: "system",
            content:
                "You are a helpful assistant for NSW rainfall and future-city planning. Keep answers concise and practical.",
        },
        {
            role: "assistant",
            content: "Hi! Ask me anything about rainfall data, stations, or city design ideas.",
        },
    ]);

    const [input, setInput] = useState("");
    const [streaming, setStreaming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Restore chat (except system prompt)
    useEffect(() => {
        const raw = localStorage.getItem("chat.messages");
        if (raw) {
            try {
                const parsed = JSON.parse(raw) as ChatMessage[];
                setMessages((prev) => [prev[0], ...parsed]);
            } catch {}
        }
    }, []);

    // Persist
    useEffect(() => {
        const stash = messages.filter((m) => m.role !== "system");
        localStorage.setItem("chat.messages", JSON.stringify(stash));
    }, [messages]);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, [messages, streaming]);

    const visible = useMemo(() => messages.filter((m) => m.role !== "system"), [messages]);

    async function send() {
        if (!input.trim() || streaming) return;
        setError(null);

        const next = [...messages, { role: "user" as const, content: input.trim() }];
        setMessages(next);
        setInput("");

        // Placeholder we will stream into
        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
        setStreaming(true);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: next.slice(-12).map(({ role, content }) => ({ role, content })) }),
            });

            if (!res.ok) {
                let detail = "";
                try { detail = await res.text(); } catch {}
                let friendly = `HTTP ${res.status}`;
                if (res.status === 429) {
                    friendly =
                        "Quota exceeded (429). Add credit or select the correct OpenAI project for your API key.";
                } else if (detail) {
                    friendly += ` – ${detail.slice(0, 300)}`;
                }
                throw new Error(friendly);
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let done = false;
            let acc = "";

            while (!done) {
                const chunk = await reader.read();
                done = chunk.done;
                if (chunk.value) {
                    const text = decoder.decode(chunk.value, { stream: true });
                    acc += text;
                    setMessages((prev) => {
                        const copy = [...prev];
                        copy[copy.length - 1] = { role: "assistant", content: acc };
                        return copy;
                    });
                }
            }
        } catch (e: any) {
            console.error(e);
            setError(e?.message || "Failed to reach /api/chat");
            setMessages((prev) => prev.slice(0, -1)); // drop placeholder
        } finally {
            setStreaming(false);
        }
    }

    function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            send();
        }
    }

    return (
        <section id="chat" className="py-16 bg-gradient-to-b from-slate-50 to-white">
            <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
                {/* Section header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-semibold tracking-tight">Chat Assistant</h2>
                        <p className="text-slate-600 text-sm">Ask about rainfall JSON, stations, or planning ideas.</p>
                    </div>
                </div>

                {/* Card */}
                <div className="rounded-3xl border bg-white shadow-sm p-4 md:p-6">
                    {/* Chat window */}
                    <div
                        ref={scrollRef}
                        className="h-[56vh] w-full rounded-2xl border bg-slate-50 p-4 overflow-y-auto"
                    >
                        {visible.map((m, i) => (
                            <div key={i} className="mb-3 flex w-full">
                                <div
                                    className={
                                        m.role === "assistant"
                                            ? `ml-0 mr-auto ${bubble} bg-white border`
                                            : `ml-auto mr-0 ${bubble} bg-blue-600 text-white`
                                    }
                                >
                                    {m.content}
                                </div>
                            </div>
                        ))}
                        {streaming && (
                            <div className="flex items-center gap-2 text-slate-500 text-sm">
                                <Loader2 className="h-4 w-4 animate-spin" /> generating…
                            </div>
                        )}
                    </div>

                    {/* Composer */}
                    <div className="mt-4 flex items-end gap-2">
            <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Ask about rainfall trends, stations, or city planning… (Ctrl/Cmd + Enter to send)"
                className="min-h-[60px] w-full resize-y rounded-xl border bg-white px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
                        <button
                            onClick={send}
                            disabled={streaming || !input.trim()}
                            className="inline-flex h-[44px] items-center gap-2 rounded-xl bg-blue-600 px-4 text-white shadow hover:bg-blue-700 disabled:opacity-50"
                        >
                            {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            <span className="hidden sm:inline">Send</span>
                        </button>
                    </div>

                    {error && (
                        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
                    )}


                </div>
            </div>
        </section>
    );
}
