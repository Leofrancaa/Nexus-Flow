"use client";

import { useEffect, useState } from "react";
import { getUserData } from "@/lib/auth";

/** Saudação pelo horário local do usuário. */
function saudacao(hora: number): string {
  if (hora < 5) return "Boa madrugada";
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

interface GreetingHeaderProps {
  /** Ação à direita — normalmente o FAB de novo lançamento. */
  action?: React.ReactNode;
}

/**
 * Topo do dashboard: aurora de fundo, saudação e ação.
 *
 * A aurora sangra além do padding da página (`-mx-5`) e dissolve no fundo do
 * app pelo próprio gradiente do SVG, para não haver borda visível.
 */
export function GreetingHeader({ action }: GreetingHeaderProps) {
  const [nome, setNome] = useState("");
  // Renderizado só no cliente: no servidor não há fuso do usuário, e fixar uma
  // saudação no HTML causaria troca visível na hidratação.
  const [hora, setHora] = useState<number | null>(null);

  useEffect(() => {
    setHora(new Date().getHours());
    getUserData()
      .then((user) => {
        if (user?.nome) setNome(user.nome.split(" ")[0]);
      })
      .catch(() => {
        /* sem nome é um estado aceitável; a saudação sozinha basta */
      });
  }, []);

  return (
    <header className="relative -mx-5 mb-2 px-5 pt-8 pb-6">
      {/* Camada decorativa: fora do fluxo, invisível para leitores de tela. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[260px] bg-[url('/aurora.svg')] bg-cover bg-top bg-no-repeat"
      />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-muted">
            {hora === null ? "Olá" : saudacao(hora)}
          </p>
          <h1 className="mt-0.5 truncate font-display text-2xl font-bold tracking-tight text-fg">
            {nome || "Bem-vindo"}
          </h1>
        </div>

        {action}
      </div>
    </header>
  );
}
