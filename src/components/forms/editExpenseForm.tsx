"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "react-hot-toast";
import { Expense } from "@/types/expense";
import { apiRequest } from "@/lib/auth";
import { DatePicker } from "@/components/ui/datePicker";
import {
  getApiErrorMessage,
  getContextualErrorMessage,
  generateToastId,
  validateRequiredFields,
  validatePositiveNumber,
} from "@/utils/errorUtils";

interface Categoria {
  id: number;
  nome: string;
}

interface Props {
  expense: Expense;
  onClose: () => void;
  onUpdated?: () => void;
}

export function EditExpenseForm({ expense, onClose, onUpdated }: Props) {
  const isSynced = expense.origem === "pluggy";
  const [tipo, setTipo] = useState(expense.tipo || "");
  const [quantidade, setQuantidade] = useState(
    String(expense.quantidade || "")
  );
  const [metodoPagamento, setMetodoPagamento] = useState(
    expense.metodo_pagamento || ""
  );
  const [data, setData] = useState(
    expense.data ? expense.data.split("T")[0] : ""
  );
  const [categoriaId, setCategoriaId] = useState(
    String(expense.category_id || "")
  );
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const res = await apiRequest("/api/categories?tipo=despesa");
        const data = await res.json();
        setCategorias(data.data || []);
      } catch (error) {
        console.error("Erro ao carregar categorias:", error);
        toast.error("Erro ao carregar categorias", {
          id: "load-expense-categories-edit",
        });
      }
    };

    fetchCategorias();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação dos campos obrigatórios
    const requiredFieldsValidation = validateRequiredFields(
      isSynced
        ? { Categoria: categoriaId }
        : {
            Descrição: tipo,
            Valor: quantidade,
            "Método de pagamento": metodoPagamento,
            Data: data,
            Categoria: categoriaId,
          }
    );

    if (requiredFieldsValidation) {
      toast.error(requiredFieldsValidation, {
        id: "expense-edit-validation",
      });
      return;
    }

    // Validação do valor
    const valueValidation = isSynced
      ? null
      : validatePositiveNumber(quantidade, "O valor");
    if (valueValidation) {
      toast.error(valueValidation, {
        id: "expense-edit-value-validation",
      });
      return;
    }

    const toastId = generateToastId("update", "expense", expense.id);

    try {
      toast.loading("Atualizando despesa...", { id: toastId });

      const res = await apiRequest(`/api/expenses/${expense.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          isSynced
            ? { category_id: parseInt(categoriaId) }
            : {
                tipo,
                quantidade: parseFloat(quantidade),
                metodo_pagamento: metodoPagamento,
                data,
                category_id: parseInt(categoriaId),
              }
        ),
      });

      if (!res.ok) {
        const errorMessage = await getApiErrorMessage(
          res,
          "Erro ao atualizar despesa. Verifique os dados informados"
        );
        toast.error(errorMessage, { id: toastId });
        return;
      }

      toast.success("Despesa atualizada com sucesso!", { id: toastId });
      onUpdated?.();
      onClose();
    } catch (error) {
      const errorMessage = getContextualErrorMessage(
        error,
        "update",
        "despesa"
      );
      toast.error(errorMessage, { id: toastId });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isSynced ? (
        <div className="rounded-2xl border border-sky-400/20 bg-sky-400/[0.07] px-4 py-3">
          <p className="text-sm font-semibold text-fg">Movimento sincronizado</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            O banco mantém descrição, valor e data. A categoria escolhida aqui será preservada nas próximas sincronizações.
          </p>
          <p className="num mt-2 text-sm font-bold text-sky-300">
            {tipo} · R$ {Number(quantidade).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>
      ) : (
        <>
          <div>
            <Label>Descrição *</Label>
            <Input
              placeholder="Ex: Almoço, Gasolina..."
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              required
            />
          </div>

          <div>
            <Label>Valor (R$) *</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="Ex: 50.00"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              required
            />
          </div>

          <div>
            <Label>Método de Pagamento *</Label>
            <Select value={metodoPagamento} onValueChange={setMetodoPagamento}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dinheiro">Dinheiro</SelectItem>
                <SelectItem value="cartao de credito">Cartão de Crédito</SelectItem>
                <SelectItem value="debito">Débito</SelectItem>
                <SelectItem value="pix">Pix</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      <div>
        <Label>Categoria *</Label>
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

      {!isSynced ? (
        <div>
          <Label>Data *</Label>
          <DatePicker
            value={data}
            onChange={setData}
            placeholder="Selecione a data"
          />
        </div>
      ) : null}

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
