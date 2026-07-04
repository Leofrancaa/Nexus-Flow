"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";
import { CardType } from "@/types/card";
import { apiRequest } from "@/lib/auth";

const cores = [
  "#6366f1",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#60a5fa",
  "#ec4899",
  "#06b6d4",
];

interface Props {
  card: CardType;
  onClose: () => void;
  onUpdated: () => void;
}

export function EditCardForm({ card, onClose, onUpdated }: Props) {
  const [nome, setNome] = useState(card.nome);
  const [numero, setNumero] = useState(card.numero);
  const [tipo, setTipo] = useState<"crédito" | "débito">(
    card.tipo as "crédito" | "débito"
  );
  const [limite, setLimite] = useState(card.limite.toString());
  const [corSelecionada, setCorSelecionada] = useState(card.cor);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (tipo === "crédito" && (!limite || parseFloat(limite) <= 0)) {
      toast.error("Informe um limite válido para cartão de crédito.");
      return;
    }

    try {
      // Limite só se aplica a crédito: enviá-lo para cartão de débito (limite 0)
      // faz a API rejeitar a edição inteira com "Limite deve ser positivo".
      const body: Record<string, unknown> = {
        nome,
        numero,
        tipo,
        cor: corSelecionada,
      };
      if (tipo === "crédito") {
        body.limite = parseFloat(limite);
      }

      const res = await apiRequest(`/api/cards/${card.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro");

      toast.success("Cartão atualizado!");
      onUpdated();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message || "Erro ao atualizar cartão.");
      } else {
        toast.error("Erro ao atualizar cartão.");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Nome</Label>
        <Input value={nome} onChange={(e) => setNome(e.target.value)} />
      </div>

      <div>
        <Label>Número (últimos 4 dígitos)</Label>
        <Input
          value={numero}
          maxLength={4}
          onChange={(e) => setNumero(e.target.value)}
        />
      </div>

      <div>
        <Label>Tipo</Label>
        <div className="flex gap-4 mt-2">
          {["crédito", "débito"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTipo(t as "crédito" | "débito")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition cursor-pointer ${
                tipo === t
                  ? "bg-[#2256FF] text-white"
                  : "bg-[#1B1B1B] text-white border border-[#2e2e2e]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>Limite</Label>
        <Input
          type="number"
          value={limite}
          onChange={(e) => setLimite(e.target.value)}
        />
      </div>

      <div>
        <Label>Cor</Label>
        <div className="grid grid-cols-4 gap-2 mt-2">
          {cores.map((cor) => (
            <button
              key={cor}
              type="button"
              className={`h-8 rounded-md border-2 transition-all ${
                corSelecionada === cor
                  ? "border-white ring-2 ring-[#00D4D4]"
                  : "border-transparent"
              }`}
              style={{ backgroundColor: cor }}
              onClick={() => setCorSelecionada(cor)}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-6">
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-3 w-full rounded-xl font-medium text-white bg-[#1F2937] hover:bg-[#374151] transition-all"
        >
          Cancelar
        </button>

        <button
          type="submit"
          className="px-6 py-3 w-full rounded-xl text-white font-semibold text-[16px] bg-[#00D4D4] hover:opacity-80 hover:text-black transition-all cursor-pointer"
        >
          Salvar
        </button>
      </div>
    </form>
  );
}
