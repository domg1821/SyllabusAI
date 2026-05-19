"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { SavedClass } from "@/lib/types";

interface Message {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

type TutorMode = "free" | "quiz" | "plan" | "explain";

interface Props {
  cls: SavedClass;
  onClose: () => void;
}

const MODES: { id: TutorMode; label: string; emoji: string; description: string }[] = [
  { id: "free",    label: "Ask Anything",  emoji: "💬", description: "Open conversation" },
  { id: "quiz",    label: "Quiz Me",       emoji: "🧠", description: "Active recall session" },
  { id: "plan",    label: "Study Plan",    emoji: "📅", description: "Personalised schedule" },
  { id: "explain", label: "Deep Explain",  emoji: "🔍", description: "Master any concept" },
];

const MODE_STARTERS: Record<TutorMode, string[]> = {
  free: [
    "What topics will definitely be on the exam?",
    "What should I focus on to get an A?",
    "Explain the hardest concept in plain English.",
    "What are the biggest mistakes students make in this course?",
  ],
  quiz: [
    "Quiz me on the most important concepts.",
    "Give me exam-level questions on this course.",
    "Start with easy questions and get harder.",
    "Focus the quiz on the upcoming exam topics.",
  ],
  plan: [
    "Build me a study plan for the next 2 weeks.",
    "I have a week until the exam — what's the plan?",
    "How should I spread out studying across all my courses?",
    "What should I study today and tomorrow?",
  ],
  explain: [
    "Explain the core concept of this course like I'm new to it.",
    "What's the most confusing topic, and how do I understand it?",
    "Break down the relationship between the main ideas.",
    "Give me a mental model for this subject.",
  ],
};

// ── Markdown renderer ──────────────────────────────────────────────────────────

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;

  function parseInline(str: string): React.ReactNode {
    // Handle **bold**, *italic*, `code` inline
    const parts = str.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
    return parts.map((part, j) => {
      if (part.startsWith("**") && part.endsWith("**"))
        return <strong key={j}>{part.slice(2, -2)}</strong>;
      if (part.startsWith("*") && part.endsWith("*"))
        return <em key={j}>{part.slice(1, -1)}</em>;
      if (part.startsWith("`") && part.endsWith("`"))
        return <code key={j} className="rounded bg-black/10 px-1 py-0.5 font-mono text-[11px]">{part.slice(1, -1)}</code>;
      return part;
    });
  }

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      nodes.push(
        <pre key={i} className="my-2 overflow-x-auto rounded-lg bg-gray-900 p-3 text-[11px] text-green-300 font-mono">
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      i++;
      continue;
    }

    // ## Header
    if (line.startsWith("## ")) {
      nodes.push(<h3 key={i} className="mt-3 mb-1 text-sm font-bold text-gray-900">{parseInline(line.slice(3))}</h3>);
      i++; continue;
    }
    if (line.startsWith("# ")) {
      nodes.push(<h2 key={i} className="mt-3 mb-1 text-base font-extrabold text-gray-900">{parseInline(line.slice(2))}</h2>);
      i++; continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      nodes.push(
        <blockquote key={i} className="my-1 border-l-2 border-indigo-300 pl-3 text-sm italic text-gray-500">
          {parseInline(line.slice(2))}
        </blockquote>
      );
      i++; continue;
    }

    // Bullet list
    if (line.match(/^[-•*]\s/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^[-•*]\s/)) {
        items.push(lines[i].replace(/^[-•*]\s/, ""));
        i++;
      }
      nodes.push(
        <ul key={i} className="my-1 space-y-0.5">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-2 text-sm">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
              <span>{parseInline(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered list
    if (line.match(/^\d+\.\s/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^\d+\.\s/)) {
        items.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
      }
      nodes.push(
        <ol key={i} className="my-1 space-y-0.5">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-2 text-sm">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-600">{j + 1}</span>
              <span>{parseInline(item)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Follow-up question (special formatting)
    if (line.startsWith("💬 Follow-up:")) {
      nodes.push(
        <div key={i} className="mt-3 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-700">
          {parseInline(line)}
        </div>
      );
      i++; continue;
    }

    // Empty line
    if (line.trim() === "") {
      nodes.push(<div key={i} className="h-1.5" />);
      i++; continue;
    }

    // Normal paragraph
    nodes.push(
      <p key={i} className="text-sm leading-relaxed">{parseInline(line)}</p>
    );
    i++;
  }

  return nodes;
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function TutorChatMode({ cls, onClose }: Props) {
  const [mode, setMode] = useState<TutorMode>("free");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModePanel, setShowModePanel] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Build welcome message when mode changes (before any messages)
  const welcomeForMode = useCallback((m: TutorMode): Message => {
    const greetings: Record<TutorMode, string> = {
      free: `Hey! I'm your AI tutor for **${cls.name}**. I've studied your full syllabus, know your deadlines, and I'm ready to help with anything. What do you need?`,
      quiz: `Quiz mode activated for **${cls.name}**! I'll ask you questions one at a time, give instant feedback, and track what you know. Ready? Tell me which topics to focus on, or I'll start with the most important ones.`,
      plan: `Let's build you a smart study plan for **${cls.name}**. I can see your upcoming deadlines. Tell me: when's your next exam or major deadline, and how many hours a day can you study?`,
      explain: `Deep Explain mode for **${cls.name}**. I'll break down any concept until it clicks — analogies, examples, step-by-step. What do you want to truly understand?`,
    };
    return { role: "assistant", content: greetings[m] };
  }, [cls.name]);

  useEffect(() => {
    setMessages([welcomeForMode(mode)]);
    setError(null);
  }, [mode, welcomeForMode]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        abortRef.current?.abort();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Build deadline payload
  const upcomingDeadlines = cls.items
    .filter(item => !item.completed && item.dueDate && item.dueDate !== "TBD")
    .map(item => {
      const due = new Date(item.dueDate);
      const today = new Date(); today.setHours(0,0,0,0);
      const daysUntil = isNaN(due.getTime()) ? 999 : Math.round((due.getTime() - today.getTime()) / 86400000);
      return { title: item.title, type: item.type, dueDate: item.dueDate, daysUntil };
    })
    .filter(d => d.daysUntil >= 0 && d.daysUntil <= 60)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 10);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    setShowModePanel(false);
    const userMsg: Message = { role: "user", content: trimmed };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setStreaming(true);
    setError(null);

    // Add empty assistant placeholder
    setMessages(prev => [...prev, { role: "assistant", content: "", streaming: true }]);

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          messages: next,
          courseContext: cls.rawText ?? "",
          courseInfo: {
            name: cls.courseInfo?.name ?? cls.name,
            code: cls.courseInfo?.code ?? cls.code,
            instructor: cls.courseInfo?.instructor,
            schedule: cls.courseInfo?.schedule,
            officeHours: cls.courseInfo?.officeHours,
            semester: cls.courseInfo?.semester,
          },
          upcomingDeadlines,
          weeklyTopics: cls.weeklyTopics ?? [],
          tutorMode: mode,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        setError(errText || "Something went wrong.");
        setMessages(prev => prev.slice(0, -1)); // remove empty placeholder
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages(prev => {
          const msgs = [...prev];
          const last = msgs[msgs.length - 1];
          if (last?.role === "assistant") {
            msgs[msgs.length - 1] = { ...last, content: last.content + chunk, streaming: true };
          }
          return msgs;
        });
      }

      // Mark streaming done
      setMessages(prev => {
        const msgs = [...prev];
        const last = msgs[msgs.length - 1];
        if (last?.role === "assistant") msgs[msgs.length - 1] = { ...last, streaming: false };
        return msgs;
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError("Network error. Check your connection.");
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setStreaming(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  const currentMode = MODES.find(m => m.id === mode)!;
  const starters = MODE_STARTERS[mode];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => { abortRef.current?.abort(); onClose(); }} />

      <div
        className="relative flex w-full max-w-2xl flex-col rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200 overflow-hidden"
        style={{ height: "min(92dvh, 760px)" }}
      >
        {/* ── Header ── */}
        <div className="flex shrink-0 items-center gap-3 border-b border-gray-100 bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 text-xl shadow-sm">
            {currentMode.emoji}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-white truncate">AI Tutor — {currentMode.label}</p>
              <span className="inline-flex items-center rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                ⚡ Pro
              </span>
            </div>
            <p className="truncate text-xs text-indigo-200">{cls.code ? `${cls.code} · ` : ""}{cls.name}</p>
          </div>

          {/* Mode switcher button */}
          <button
            onClick={() => setShowModePanel(v => !v)}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-white/25 transition-colors"
            title="Switch tutor mode"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
            </svg>
            Mode
          </button>

          <button
            onClick={() => { abortRef.current?.abort(); onClose(); }}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/70 hover:bg-white/20 hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Mode panel (overlay) ── */}
        {showModePanel && (
          <div className="shrink-0 border-b border-gray-100 bg-gray-50 px-4 py-3">
            <p className="mb-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">Choose tutor mode</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {MODES.map(m => (
                <button
                  key={m.id}
                  onClick={() => { setMode(m.id); setShowModePanel(false); }}
                  className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition-all ${
                    mode === m.id
                      ? "border-indigo-400 bg-indigo-50 ring-1 ring-indigo-300"
                      : "border-gray-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/50"
                  }`}
                >
                  <span className="text-xl">{m.emoji}</span>
                  <span className={`text-xs font-bold ${mode === m.id ? "text-indigo-700" : "text-gray-700"}`}>{m.label}</span>
                  <span className="text-[10px] text-gray-400 leading-tight">{m.description}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Messages ── */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm mt-0.5 shadow-sm">
                  {currentMode.emoji}
                </div>
              )}
              <div
                className={`max-w-[88%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-br-sm"
                    : "bg-gray-50 border border-gray-100 text-gray-800 rounded-bl-sm"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="min-w-0">
                    {renderMarkdown(msg.content)}
                    {msg.streaming && msg.content && (
                      <span className="inline-block h-4 w-0.5 animate-pulse bg-indigo-500 ml-0.5 align-middle" />
                    )}
                    {msg.streaming && !msg.content && (
                      <div className="flex items-center gap-1.5 py-1">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-400 [animation-delay:-0.3s]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-400 [animation-delay:-0.15s]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-400" />
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                )}
              </div>
            </div>
          ))}

          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-600 flex items-center gap-2">
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
              {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* ── Suggested starters (only when on first message) ── */}
        {messages.length <= 1 && !streaming && (
          <div className="shrink-0 border-t border-gray-100 px-4 py-2.5">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Quick start</p>
            <div className="flex flex-wrap gap-1.5">
              {starters.map(q => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="rounded-full border border-indigo-100 bg-white px-3 py-1.5 text-xs font-medium text-indigo-700 hover:border-indigo-300 hover:bg-indigo-50 transition-colors shadow-sm"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Input ── */}
        <div className="shrink-0 border-t border-gray-100 bg-white p-3">
          <div className="flex items-end gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 focus-within:border-indigo-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
              onKeyDown={handleKeyDown}
              placeholder={streaming ? "Tutor is responding…" : `Ask your ${currentMode.label.toLowerCase()} tutor…`}
              rows={1}
              disabled={streaming}
              className="flex-1 resize-none bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none disabled:opacity-40"
              style={{ maxHeight: "120px" }}
            />
            {streaming ? (
              <button
                onClick={() => abortRef.current?.abort()}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                title="Stop generating"
              >
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="1" />
                </svg>
              </button>
            ) : (
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim()}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white disabled:opacity-30 hover:bg-indigo-500 transition-colors shadow-sm"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                </svg>
              </button>
            )}
          </div>
          <p className="mt-1.5 text-center text-[10px] text-gray-400">
            Enter to send · Shift+Enter for new line · Esc to close
          </p>
        </div>
      </div>
    </div>
  );
}
