"use client";

import { useState } from "react";
import { apiRequest } from "@/lib/auth";
import { toast } from "react-hot-toast";
import AddButton from "@/components/ui/addButton";
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

interface Props {
  onCreated: () => void;
}

export function NewGoalModal({ onCreated }: Props) {
  const [loading, setLoading] = useState(false);
  // Estado próprio: antes o modal fechava clicando no primeiro
  // [data-radix-dialog-close] do documento, que podia ser de outro modal.
  const [open, setOpen] = useState(false);

  const now = new Date();
  const inicial = {
    nome: "Meta de Receita",
    valor_alvo: "",
    mes: String(now.getMonth() + 1),
    ano: String(now.getFullYear()),
  };
  const [formData, setFormData] = useState(inicial);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await apiRequest("/api/goals", {
        method: "POST",
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
        throw new Error(error.error || error.message || "Erro ao criar meta");
      }

      toast.success("Meta criada com sucesso!");
      setOpen(false);
      setFormData(inicial);
      onCreated();
    } catch (error) {
      toast.error((error as Error).message || "Erro ao criar meta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={setOpen}
      title="Nova Meta"
      trigger={
        <AddButton variant="primary" className="h-10">
          Nova Meta
        </AddButton>
      }
    >
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
            {loading ? "Criando..." : "Criar Meta"}
          </ModalSubmitButton>
        </ModalActions>
      </form>
    </Modal>
  );
}
