"use client";

import { usePrivacy } from "@/contexts/privacyContext";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/format";

interface MoneyProps {
  value: number;
  className?: string;
  /** Sinal explícito para listas em que entrada e saída convivem. */
  sign?: "+" | "−" | "↔";
}

/**
 * Valor monetário — o único lugar que decide como o dinheiro aparece.
 *
 * Centralizar aqui é o que faz o olho de privacidade valer para a tela toda:
 * nenhuma tela precisa saber que existe um modo oculto.
 */
export function Money({ value, className, sign }: MoneyProps) {
  const { oculto } = usePrivacy();

  if (oculto) {
    // O tracking largo mantém a massa visual do número, para o layout não
    // pular quando alguém liga e desliga o modo.
    return (
      <span
        className={cn("num tracking-[0.15em]", className)}
        aria-label="Valor oculto"
      >
        R$ ••••
      </span>
    );
  }

  return (
    <span className={cn("num", className)}>
      {sign}
      {formatCurrency(value)}
    </span>
  );
}
