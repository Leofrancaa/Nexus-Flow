"use client";

import { useState } from "react";
import { apiRequest } from "@/lib/auth";
import { toast } from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Modal,
  ModalActions,
  ModalCancelButton,
  ModalSubmitButton,
} from "../ui/modal";

interface Goal {
  id: number;
  nome: string;
  valor_alvo: number;
  mes: number;
  ano: number;
}

interface EditGoalModalProps {
  goal: Goal | null;
  onClose: () => void;
  onUpdated?: () => void;
}

export function EditGoalModal({
  goal,
  onClose,
  onUpdated,
}: EditGoalModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: goal?.nome || "",
    valor_alvo: String(goal?.valor_alvo || ""),
    mes: String(goal?.mes || ""),
    ano: String(goal?.ano || ""),
  });

  if (!goal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await apiRequest(`/api/goals/${goal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: formData.nome,
          valor_alvo: Number(formData.valor_alvo),
          mes: Number(formData.mes),
          ano: Number(formData.ano),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(
          error.error || error.message || "Erro ao atualizar meta"
        );
      }

      toast.success("Meta atualizada com sucesso!");
      onClose();
      onUpdated?.();
    } catch (error) {
      toast.error((error as Error).message || "Erro ao atualizar meta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open onOpenChange={onClose} title="Editar Meta">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Nome da Meta</Label>
          <Input
            type="text"
            required
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            placeholder="Ex: Meta de Receita de Janeiro"
            className="mt-1"
          />
        </div>

        <div>
          <Label>Valor Alvo de Receita (R$)</Label>
          <Input
            type="number"
            step="0.01"
            required
            value={formData.valor_alvo}
            onChange={(e) =>
              setFormData({ ...formData, valor_alvo: e.target.value })
            }
            placeholder="0,00"
            className="mt-1"
          />
          <p className="mt-1 text-xs text-subtle">
            Total de receitas que você deseja atingir no mês
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Mês</Label>
            <Select
              value={formData.mes}
              onValueChange={(value) =>
                setFormData({ ...formData, mes: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <SelectItem key={m} value={m.toString()}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Ano</Label>
            <Select
              value={formData.ano}
              onValueChange={(value) =>
                setFormData({ ...formData, ano: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026].map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <ModalActions>
          <ModalCancelButton />
          <ModalSubmitButton disabled={loading}>
            {loading ? "Atualizando..." : "Atualizar Meta"}
          </ModalSubmitButton>
        </ModalActions>
      </form>
    </Modal>
  );
}
