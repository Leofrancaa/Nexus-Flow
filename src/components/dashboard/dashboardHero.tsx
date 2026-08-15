"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Eye, EyeOff, RefreshCw } from "lucide-react";

import { Money } from "@/components/ui/money";
import { UserAvatar } from "@/components/profile/userAvatar";
import { usePrivacy } from "@/contexts/privacyContext";
import { getUserData } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface DashboardHeroProps {
  saldo: number;
  saldoOrigem: "contas" | "lancamentos";
  entradas: number;
  saidas: number;
  carregando: boolean;
  sincronizando: boolean;
  progressoSincronizacao: { atual: number; total: number } | null;
  onAbrirSincronizacao: () => void;
}

function saudacao(hora: number): string {
  if (hora < 5) return "Boa madrugada";
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

/**
 * A abertura cinematográfica do painel.
 *
 * A fotografia estabelece a atmosfera apenas nesta superfície. O saldo fica
 * ancorado no trecho mais escuro e o Pulso Nexus nasce dele, portanto o efeito
 * continua legível mesmo quando a imagem recebe crops diferentes no celular.
 */
export function DashboardHero({
  saldo,
  saldoOrigem,
  entradas,
  saidas,
  carregando,
  sincronizando,
  progressoSincronizacao,
  onAbrirSincronizacao,
}: DashboardHeroProps) {
  const [nome, setNome] = useState("");
  const [avatar, setAvatar] = useState("panther");
  const [hora, setHora] = useState<number | null>(null);
  const [headerSolid, setHeaderSolid] = useState(false);
  const { oculto, alternar } = usePrivacy();

  useEffect(() => {
    setHora(new Date().getHours());
    getUserData()
      .then((user) => {
        if (user?.nome) setNome(user.nome.trim().split(/\s+/)[0]);
        if (user?.avatar) setAvatar(user.avatar);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const updateHeader = () => setHeaderSolid(window.scrollY > 28);
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    return () => window.removeEventListener("scroll", updateHeader);
  }, []);

  return (
    <section className="relative -mx-5 min-h-[28.5rem] overflow-hidden bg-bg">
      <Image
        src="/nexus-observatory.png"
        alt="Observatório de concreto iluminado em uma montanha durante a noite"
        fill
        priority
        sizes="(max-width: 430px) 100vw, 430px"
        className="object-cover object-[61%_center] scale-[1.02] motion-safe:animate-[nx-hero-settle_1.4s_cubic-bezier(0.16,1,0.3,1)_both]"
      />

      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,10,13,.02)_0%,rgba(8,10,13,.07)_34%,rgba(8,10,13,.38)_72%,rgba(8,10,13,.9)_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,10,13,.56)_0%,rgba(8,10,13,.18)_54%,rgba(8,10,13,.08)_100%)]"
      />

      <div className="fixed inset-x-0 top-0 z-50 mx-auto w-full max-w-[430px] px-5 pb-3 pt-[max(.75rem,env(safe-area-inset-top))]">
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-0 border-b border-white/[0.07] bg-bg/95 shadow-[0_12px_32px_rgba(0,0,0,.22)] backdrop-blur-xl transition-opacity duration-300",
            headerSolid ? "opacity-100" : "opacity-0"
          )}
        />
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <UserAvatar avatar={avatar} size="md" />
            <span className="truncate font-display text-base font-bold text-fg">
              {nome || "Olá"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onAbrirSincronizacao}
              aria-label="Abrir sincronização das contas"
              className="flex h-12 touch-manipulation items-center justify-center gap-2 rounded-full border border-white/15 bg-bg/55 px-3.5 text-xs font-bold text-fg backdrop-blur-md transition-[background-color,transform,border-color,opacity] duration-200 hover:border-brand/35 hover:bg-bg/75 active:scale-[.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/70"
            >
              <RefreshCw
                className={`h-4 w-4 text-brand ${sincronizando ? "animate-spin" : ""}`}
                aria-hidden="true"
              />
              {sincronizando && progressoSincronizacao
                ? `${progressoSincronizacao.atual}/${progressoSincronizacao.total}`
                : "Sincronizar"}
            </button>

            <button
              type="button"
              onClick={alternar}
              aria-pressed={oculto}
              aria-label={oculto ? "Mostrar valores" : "Ocultar valores"}
              className="flex h-12 w-12 touch-manipulation items-center justify-center rounded-full border border-white/15 bg-bg/55 text-fg backdrop-blur-md transition-[background-color,transform,border-color] duration-200 hover:border-brand/35 hover:bg-bg/75 active:scale-[.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/70"
            >
              {oculto ? (
                <EyeOff className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Eye className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex min-h-[28.5rem] flex-col px-5 pb-7 pt-[max(2rem,env(safe-area-inset-top))]">
        <div className="h-12" aria-hidden="true" />

        <div className="mt-12 rise">
          <p className="text-base text-fg/65">
            {hora === null ? "Olá" : saudacao(hora)},
          </p>
          <h1 className="mt-1 truncate font-display text-[2.65rem] font-bold leading-none tracking-[-0.045em] text-fg">
            {nome || "Bem-vindo"}
          </h1>
        </div>

        <div className="mt-10 rise [animation-delay:110ms]">
          <p className="text-sm text-fg/70">
            {saldoOrigem === "contas" ? "Saldo conectado" : "Saldo pelos lançamentos"}
          </p>
          {carregando ? (
            <div className="mt-2 h-12 w-56 animate-pulse rounded-xl bg-white/10" />
          ) : (
            <Money
              value={saldo}
              className="mt-1 block text-[2.75rem] font-bold leading-none tracking-[-0.05em] text-fg"
            />
          )}

          <div className="relative mt-5 h-8" aria-hidden="true">
            <div className="nx-signal-reveal absolute inset-0">
              <svg
                viewBox="0 0 390 32"
                preserveAspectRatio="none"
                className="h-full w-full overflow-visible"
              >
                <path
                  d="M0 21 C54 21 94 21 132 21 C167 21 172 5 205 9 C235 13 237 25 269 18 C303 10 326 8 390 7"
                  fill="none"
                  stroke="var(--color-brand)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>
            <span className="nx-signal-node glow-sm absolute right-0 top-[3px] h-2.5 w-2.5 rounded-full bg-brand motion-safe:animate-[nx-signal-breathe_2.8s_ease-in-out_infinite]" />
          </div>

          <div className="mt-1 flex items-center gap-5 text-xs">
            <span className="flex min-w-0 items-center gap-1.5 text-fg/65">
              <ArrowDownLeft className="h-3.5 w-3.5 text-positive" />
              Entradas <Money value={entradas} className="font-semibold text-fg" />
            </span>
            <span className="flex min-w-0 items-center gap-1.5 text-fg/65">
              <ArrowUpRight className="h-3.5 w-3.5 text-negative" />
              Saídas <Money value={saidas} className="font-semibold text-fg" />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
