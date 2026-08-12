"use client";

import { useEffect, useRef } from "react";

const EVENT = "nexus:data-changed";

/**
 * Aviso de "os dados mudaram" entre partes soltas da árvore.
 *
 * O FAB vive no wrapper de layout e a tela que precisa recarregar é filha do
 * `children` — não há ancestral comum onde pendurar estado sem envolver o app
 * inteiro num provider só para isto. Um evento no `window` resolve com o
 * mesmo efeito e sem re-render global.
 *
 * Cada tela continua dona do próprio `refreshKey`; isto só o incrementa.
 */
export function emitDataChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(EVENT));
}

export function useDataChanged(onChange: () => void) {
  // Guardado em ref para o listener não ser trocado a cada render quando a
  // tela passa uma arrow function inline — que é o caso de todas elas.
  const handler = useRef(onChange);
  handler.current = onChange;

  useEffect(() => {
    const listener = () => handler.current();
    window.addEventListener(EVENT, listener);
    return () => window.removeEventListener(EVENT, listener);
  }, []);
}
