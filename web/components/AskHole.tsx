"use client";

import { useRef, useState } from "react";
import type { RabbitHole } from "@/lib/types";
import { faviconFor } from "@/lib/ui";
import { askHole, type ChatTurn } from "@/lib/api";

interface Message extends ChatTurn {
  citations?: string[];
}

export function AskHole({ hole }: { hole: RabbitHole }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const suggestions = [
    `What did the sources actually conclude about ${hole.summary.topics[0] ?? hole.title}?`,
    "Where did these sources disagree?",
    hole.summary.questions[0] ?? "What's still unanswered here?",
  ];

  async function send(question: string) {
    const q = question.trim();
    if (!q || loading) return;
    setError(null);
    setInput("");
    const history: ChatTurn[] = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((m) => [...m, { role: "user", content: q }]);
    setLoading(true);
    try {
      const res = await askHole(hole, q, history);
      setMessages((m) => [...m, { role: "assistant", content: res.answer, citations: res.citations }]);
    } catch {
      setError("Couldn't reach the backend. Start the FastAPI server (cd backend → uvicorn app.main:app) to ask questions grounded in these pages.");
    } finally {
      setLoading(false);
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }));
    }
  }

  function citedPages(ids: string[]) {
    return ids.map((id) => hole.pages.find((p) => p.id === id)).filter(Boolean) as RabbitHole["pages"];
  }

  return (
    <div className="rh-surface overflow-hidden rounded-[18px] border shadow-[0_2px_16px_rgba(70,45,20,.06)]">
      <div className="border-b border-[var(--rh-line)] px-5 py-4">
        <h2 className="rh-display rh-ink text-[21px] font-semibold">Ask this rabbit hole</h2>
        <p className="rh-muted mt-0.5 text-[13.5px]">Answers grounded only in the {hole.pages.length} pages you actually read, with sources.</p>
      </div>

      <div ref={scrollRef} className="max-h-[420px] space-y-4 overflow-y-auto px-5 py-5">
        {messages.length === 0 && !loading && (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rh-surface-2 max-w-full rounded-full border px-3.5 py-2 text-left text-[13.5px] transition hover:border-[var(--rh-line-strong)]"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
            <div
              className={
                m.role === "user"
                  ? "max-w-[85%] rounded-[14px] rounded-br-[4px] bg-[var(--rh-primary)] px-4 py-2.5 text-[15px] leading-[1.5] text-[var(--rh-primary-text)]"
                  : "max-w-[92%] rounded-[14px] rounded-bl-[4px] border border-[var(--rh-line)] bg-[var(--rh-surface-2)] px-4 py-3 text-[15px] leading-[1.55] text-[var(--rh-ink-soft)]"
              }
            >
              <p className="whitespace-pre-wrap break-words">{m.content}</p>
              {m.role === "assistant" && m.citations && m.citations.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5 border-t border-[var(--rh-line)] pt-3">
                  {citedPages(m.citations).map((p) => (
                    <a
                      key={p.id}
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex max-w-[220px] items-center gap-1.5 rounded-full border border-[var(--rh-line)] bg-[var(--rh-surface-3)] px-2.5 py-1 text-[12px] text-[var(--rh-muted)] transition hover:border-[var(--rh-line-strong)]"
                    >
                      {p.domain && <img src={faviconFor(p.domain)} alt="" className="h-3.5 w-3.5 rounded" />}
                      <span className="truncate">{p.title}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && <div className="rh-muted text-[14px] italic">Reading your sources…</div>}
        {error && <div className="rounded-[12px] border border-[#b8795f3d] bg-[#b8795f14] px-4 py-3 text-[13.5px] leading-snug text-[#8a4f34]">{error}</div>}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2 border-t border-[var(--rh-line)] bg-[var(--rh-surface-2)] px-4 py-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about this investigation…"
          className="min-w-0 flex-1 rounded-[12px] border border-[var(--rh-line)] bg-[var(--rh-surface-3)] px-3.5 py-2.5 text-[15px] text-[var(--rh-ink)] outline-none placeholder:text-[var(--rh-faint)] focus:border-[var(--rh-line-strong)]"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rh-primary shrink-0 rounded-[12px] px-4 py-2.5 text-[14.5px] font-semibold transition hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0"
        >
          Ask
        </button>
      </form>
    </div>
  );
}
