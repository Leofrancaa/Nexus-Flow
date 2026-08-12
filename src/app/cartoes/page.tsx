"use client";

import { useEffect, useState, useCallback } from "react";
import PageTitle from "@/components/pageTitle";
import { NewCardModal } from "@/components/modals/newCardModal";
import { EditCardModal } from "@/components/modals/editCardModal";
import { CardVisual } from "@/components/cards/cardVisual";
import { CardType } from "@/types/card";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { apiRequest, isAuthenticated } from "@/lib/auth";

export default function Cards() {
  const [cards, setCards] = useState<CardType[]>([]);
  const [editando, setEditando] = useState<CardType | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const router = useRouter();

  // auth guard
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
  }, [router]);

  const fetchCards = useCallback(async () => {
    try {
      const res = await apiRequest("/api/cards");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCards(data.data || []);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Sessão expirada")) {
        router.push("/login");
      } else {
        // Use ID único para evitar duplicação
        toast.error("Não foi possível carregar os cartões", {
          id: "fetch-cards-error",
        });
      }
    }
  }, [router]);

  // refetch quando refreshKey mudar
  useEffect(() => {
    fetchCards();
  }, [refreshKey, fetchCards]);

  // handlers de refresh
  const handleRefresh = () => setRefreshKey((k) => k + 1);

  return (
    <main
      className="flex flex-col min-h-screen px-8 py-8 lg:py-4"
      style={{ background: "var(--page-bg)" }}
    >
      <div className="flex flex-col lg:flex-row lg:justify-between gap-4">
        <PageTitle
          title="Cartões"
          subTitle="Gerencie e acompanhe seus cartões"
        />
        <NewCardModal onCreated={handleRefresh} />
      </div>

      <section className="mt-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {cards.map((card) => (
          <CardVisual
            key={card.id}
            card={card}
            onEdit={() => setEditando(card)}
            onDelete={(cardId: number) => {
              setCards((prev) => prev.filter((c) => c.id !== cardId));
              handleRefresh(); // garante sync com backend
            }}
            onRefresh={handleRefresh} // pagar fatura/editar etc.
          />
        ))}
      </section>

      {editando && (
        <EditCardModal
          card={editando}
          open={!!editando}
          onClose={() => setEditando(null)}
          onUpdated={() => {
            handleRefresh();
            setEditando(null);
          }}
        />
      )}
    </main>
  );
}
