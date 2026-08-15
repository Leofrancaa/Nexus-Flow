"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textArea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "react-hot-toast";
import { Income } from "@/types/income";
import { apiRequest } from "@/lib/auth";
import { DatePicker } from "@/components/ui/datePicker";

interface Categoria {
  id: number;
  nome: string;
}

interface Props {
  income: Income;
  onClose: () => void;
  onUpdated?: () => void;
}

export function EditIncomeForm({ income, onClose, onUpdated }: Props) {
  const isSynced = income.origem === "pluggy";
  const [tipo, setTipo] = useState(income.tipo || "");
  const [quantidade, setQuantidade] = useState(String(income.quantidade || ""));
  const [fonte, setFonte] = useState(income.fonte || "");
  const [nota, setNota] = useState(income.nota || income.observacoes || "");
  const [data, setData] = useState(
    income.data ? income.data.split("T")[0] : ""
  );
  const [categoriaId, setCategoriaId] = useState(
    String(income.category_id || "")
  );
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const res = await apiRequest("/api/categories?tipo=receita");
        const data = await res.json();
        setCategorias(data.data || []);
      } catch (error) {
        console.error("Erro ao carregar categorias:", error);
      }
    };

    fetchCategorias();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSynced && !categoriaId) {
      toast.error("Escolha uma categoria para organizar este movimento.");
      return;
    }

    const toastId = toast.loading("Atualizando receita...");

    try {
      const res = await apiRequest(`/api/incomes/${income.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          isSynced
            ? { nota, category_id: parseInt(categoriaId) }
            : {
                tipo,
                quantidade: parseFloat(quantidade),
                fonte,
                nota,
                data,
                category_id: parseInt(categoriaId),
              }
        ),
      });

      if (!res.ok) {
        const errorData = await res.json();
        const message = errorData.error || "Não foi possível atualizar a receita. Verifique os dados";
        toast.error(message, { id: toastId });
        return;
      }

      toast.success("Receita atualizada com sucesso!", { id: toastId });
      onUpdated?.();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      toast.error("Não foi possível conectar ao servidor. Verifique sua internet", { id: toastId });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isSynced ? (
        <div className="rounded-2xl border border-sky-400/20 bg-sky-400/[0.07] px-4 py-3">
          <p className="text-sm font-semibold text-fg">Movimento sincronizado</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            O banco mantém descrição, valor e data. Sua categoria e nota continuarão iguais após sincronizar.
          </p>
          <p className="num mt-2 text-sm font-bold text-sky-300">
            {tipo} · R$ {Number(quantidade).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label>Descrição</Label>
              <Input
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                required
              />
            </div>

            <div>
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label>Fonte</Label>
            <Input
              value={fonte}
              onChange={(e) => setFonte(e.target.value)}
              required
            />
          </div>

          <div>
            <Label>Data</Label>
            <DatePicker
              value={data}
              onChange={setData}
              placeholder="Selecione a data"
            />
          </div>
        </>
      )}

      <div>
        <Label>Categoria</Label>
        <Select value={categoriaId} onValueChange={setCategoriaId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione uma categoria" />
          </SelectTrigger>
          <SelectContent>
            {categorias.map((categoria) => (
              <SelectItem key={categoria.id} value={String(categoria.id)}>
                {categoria.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Nota</Label>
        <Textarea
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          placeholder="Observações adicionais..."
        />
      </div>

      <div className="flex flex-col-reverse gap-3 pt-2 min-[360px]:flex-row">
        <button
          type="button"
          onClick={onClose}
          className="min-h-12 min-w-0 flex-1 rounded-[14px] border border-line px-4 py-3 font-semibold text-muted transition-[background-color,color,transform] hover:bg-elevated hover:text-fg active:scale-[.98]"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="min-h-12 min-w-0 flex-1 rounded-[14px] bg-brand px-4 py-3 font-semibold text-bg transition-[opacity,transform,box-shadow] glow-sm hover:opacity-90 active:scale-[.98]"
        >
          Salvar Alterações
        </button>
      </div>
    </form>
  );
}
