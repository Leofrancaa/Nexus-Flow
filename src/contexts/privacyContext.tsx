"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "nexus:valores-ocultos";

interface PrivacyValue {
  oculto: boolean;
  alternar: () => void;
}

const PrivacyContext = createContext<PrivacyValue | null>(null);

/**
 * Esconde os valores em dinheiro da tela sem sair da conta.
 *
 * É um app que se abre no ônibus e na fila do caixa: a pessoa ao lado não
 * precisa ver o saldo. A preferência sobrevive ao reload porque quem liga isso
 * uma vez normalmente quer o app sempre assim.
 */
export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  // Começa visível no servidor e no primeiro render do cliente: ler o
  // localStorage durante a renderização divergiria do HTML e quebraria a
  // hidratação. O ajuste vem logo depois, no efeito.
  const [oculto, setOculto] = useState(false);

  useEffect(() => {
    try {
      setOculto(window.localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      // Modo privativo pode bloquear o storage — visível é o padrão seguro.
    }
  }, []);

  const alternar = useCallback(() => {
    setOculto((atual) => {
      const proximo = !atual;
      try {
        window.localStorage.setItem(STORAGE_KEY, proximo ? "1" : "0");
      } catch {
        // Sem storage a preferência só não sobrevive ao reload.
      }
      return proximo;
    });
  }, []);

  const valor = useMemo(() => ({ oculto, alternar }), [oculto, alternar]);

  return (
    <PrivacyContext.Provider value={valor}>{children}</PrivacyContext.Provider>
  );
}

export function usePrivacy(): PrivacyValue {
  const ctx = useContext(PrivacyContext);
  if (!ctx) {
    throw new Error("usePrivacy precisa estar dentro de <PrivacyProvider>.");
  }
  return ctx;
}
