"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Send, Sparkles } from "lucide-react";
import { apiRequest, hasActiveSession } from "@/lib/auth";
import { toast } from "react-hot-toast";

interface Message {
  id?: number;
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Qual foi meu maior gasto este mês?",
  "Quanto posso gastar por dia até o fim do mês?",
  "Onde consigo economizar sem comprometer o essencial?",
  "Compare este mês com o anterior.",
];

// Deve casar com MAX_MESSAGE_LENGTH no chatService (servidor).
const MAX_LEN = 2000;

export default function AssistantPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void hasActiveSession().then((authenticated) => {
      if (!authenticated) router.push("/login");
    });
  }, [router]);

  const fetchChat = useCallback(async () => {
    try {
      const res = await apiRequest("/api/chat");
      if (res.ok) {
        const data = await res.json();
        setMessages(data.data?.messages ?? []);
      }
    } catch {
      /* silencioso */
    }
  }, []);

  useEffect(() => {
    fetchChat();
  }, [fetchChat]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || sending) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setSending(true);
    try {
      const res = await apiRequest("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error || "Erro ao falar com o assistente.");
        setMessages((prev) => prev.slice(0, -1)); // remove a mensagem otimista
        return;
      }
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.data.reply },
      ]);
    } catch {
      toast.error("Erro ao enviar mensagem.");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setSending(false);
    }
  };

  return (
    // Altura da janela menos a bottom nav: o campo de mensagem precisa parar
    // logo acima da barra, e não atrás dela.
    <main className="relative flex h-[calc(100dvh-var(--spacing-nav))] flex-col overflow-hidden bg-bg">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[220px] bg-[url('/aurora.svg')] bg-cover bg-top bg-no-repeat"
      />

      <div className="relative mx-auto flex w-full max-w-[430px] flex-1 flex-col overflow-hidden px-5">
        <header className="flex shrink-0 items-center justify-between gap-3 pb-4 pt-8">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-fg">
              Assistente
            </h1>
            <p className="mt-0.5 text-sm text-muted">
              Pergunte sobre suas finanças
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-brand/15 px-3 py-1.5 text-xs font-semibold text-brand">
            Sem limite interno
          </span>
        </header>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain py-2">
          {messages.length === 0 && (
            <div className="mt-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/12">
                <Sparkles className="h-6 w-6 text-brand" />
              </div>
              <p className="text-sm text-muted">
                Pergunte algo sobre suas finanças para começar.
              </p>
              <div className="mt-5 flex flex-col gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    disabled={sending}
                    className="rounded-2xl bg-surface px-4 py-3 text-left text-sm text-muted transition-colors hover:bg-elevated hover:text-fg disabled:opacity-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={m.id ?? i}
              className={`flex ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "rounded-br-md bg-brand font-medium text-bg"
                    : "rounded-bl-md bg-surface text-fg"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex justify-start">
              <div className="flex gap-1.5 rounded-2xl rounded-bl-md bg-surface px-4 py-3.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted"
                    style={{ animationDelay: `${i * 160}ms` }}
                  />
                ))}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="shrink-0 pb-3 pt-3"
        >
          <div className="flex items-end gap-2 rounded-2xl bg-surface p-2">
            <div className="min-w-0 flex-1">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value.slice(0, MAX_LEN))}
                maxLength={MAX_LEN}
                placeholder="Pergunte ou registre um lançamento..."
                disabled={sending}
                className="w-full bg-transparent px-3 py-2.5 text-base text-fg outline-none placeholder:text-subtle disabled:opacity-50"
              />
              {input.length > MAX_LEN * 0.8 && (
                <div
                  className={`px-3 pb-1 text-right text-[10px] ${
                    input.length >= MAX_LEN ? "text-negative" : "text-subtle"
                  }`}
                >
                  {input.length}/{MAX_LEN}
                </div>
              )}
            </div>
            <button
              type="submit"
              aria-label="Enviar"
              disabled={sending || !input.trim()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand text-bg transition-opacity glow-sm hover:opacity-90 disabled:opacity-40 disabled:shadow-none"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
