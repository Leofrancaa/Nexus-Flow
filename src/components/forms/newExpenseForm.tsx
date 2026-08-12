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
import { apiRequest } from "@/lib/auth";
import { DatePicker } from "@/components/ui/datePicker";
import {
  getApiErrorMessage,
  getContextualErrorMessage,
  generateToastId,
} from "@/utils/errorUtils";
import { NewCategoryForm } from "./newCategoryForm";
import { Modal } from "@/components/ui/modal";

interface Card {
  id: number;
  nome: string;
  numero: string;
}

interface Categoria {
  id: number;
  nome: string;
}

interface Props {
  onClose: () => void;
  onCreated?: () => void;
}

export function NewExpenseForm({ onClose, onCreated }: Props) {
  const [descricao, setDescricao] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [metodoPagamento, setMetodoPagamento] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [cardId, setCardId] = useState("");
  const [parcelas, setParcelas] = useState("");
  const [fixo, setFixo] = useState(false);
  const [data, setData] = useState(new Date().toISOString().split("T")[0]);
  const [observacoes, setObservacoes] = useState("");

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cartoes, setCartoes] = useState<Card[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const fetchCategorias = async () => {
    try {
      const res = await apiRequest("/api/categories?tipo=despesa");
      const data = await res.json();
      setCategorias(data.data || []);
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
    }
  };

  useEffect(() => {

    const fetchCartoes = async () => {
      try {
        const res = await apiRequest("/api/cards");
        const data = await res.json();
        setCartoes(data.data || []);
      } catch (error) {
        console.error("Erro ao carregar cartões:", error);
      }
    };

    fetchCategorias();
    fetchCartoes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Criar ID único para evitar toasts duplicados
    const toastId = generateToastId("save", "expense");

    // Validação dos campos obrigatórios
    if (
      !descricao ||
      !quantidade ||
      !metodoPagamento ||
      !categoriaId ||
      !data
    ) {
      toast.error(
        "Os campos Descrição, Valor, Método de pagamento e Categoria são obrigatórios",
        {
          id: toastId,
        }
      );
      return;
    }

    // Validação do valor
    if (isNaN(parseFloat(quantidade)) || parseFloat(quantidade) <= 0) {
      toast.error("O valor deve ser um número positivo", {
        id: toastId,
      });
      return;
    }

    // Validação específica para cartão de crédito
    if (metodoPagamento === "cartao de credito" && !cardId) {
      toast.error("Selecione um cartão para pagamento no crédito", {
        id: toastId,
      });
      return;
    }

    // Validação de categoria
    if (isNaN(parseInt(categoriaId))) {
      toast.error("Selecione uma categoria válida", {
        id: toastId,
      });
      return;
    }

    try {
      toast.loading("Salvando despesa...", { id: toastId });

      const res = await apiRequest("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: descricao,
          quantidade: parseFloat(quantidade),
          metodo_pagamento: metodoPagamento,
          category_id: categoriaId ? parseInt(categoriaId) : null,
          card_id:
            metodoPagamento === "cartao de credito" ? parseInt(cardId) : null,
          parcelas: parseInt(parcelas) || 1,
          fixo,
          frequencia: null,
          data,
          observacoes,
        }),
      });

      if (!res.ok) {
        const errorMessage = await getApiErrorMessage(
          res,
          "Erro ao salvar despesa. Verifique os dados informados"
        );
        toast.error(errorMessage, { id: toastId });
        return;
      }

      toast.success("Despesa cadastrada com sucesso!", { id: toastId });
      onCreated?.();
      onClose();
    } catch (error) {
      const errorMessage = getContextualErrorMessage(error, "save", "despesa");
      toast.error(errorMessage, { id: toastId });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 text-white max-h-[100dvh] overflow-y-auto min-h-0"
    >
      {/* Descrição + Valor */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Descrição *</Label>
          <Input
            placeholder="Ex: Almoço, Gasolina..."
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
        </div>

        <div>
          <Label>Valor *</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="Ex: 50.00"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
          />
        </div>
      </div>

      {/* Categoria + Forma de Pagamento */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Categoria *</Label>
          <div className="flex gap-2">
            <div className="flex-1">
              <Select value={categoriaId} onValueChange={setCategoriaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <button
              type="button"
              onClick={() => setShowCategoryModal(true)}
              className="flex h-14 w-14 items-center justify-center rounded-[14px] border border-brand/30 bg-brand/10 text-xl font-semibold text-brand transition-[background-color,transform] hover:bg-brand/15 active:scale-[.97]"
              title="Criar nova categoria"
              aria-label="Criar nova categoria"
            >
              +
            </button>
            <Modal
              open={showCategoryModal}
              onOpenChange={setShowCategoryModal}
              title="Nova categoria"
              description="Crie uma categoria sem sair do lançamento."
            >
              <NewCategoryForm
                onClose={() => setShowCategoryModal(false)}
                onCreated={(newCategory) => {
                  fetchCategorias();
                  setCategoriaId(String(newCategory.id));
                  setShowCategoryModal(false);
                }}
              />
            </Modal>
          </div>
        </div>

        <div>
          <Label>Método de Pagamento *</Label>
          <Select value={metodoPagamento} onValueChange={setMetodoPagamento}>
            <SelectTrigger>
              <SelectValue placeholder="Como foi pago?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dinheiro">Dinheiro</SelectItem>
              <SelectItem value="cartao de credito">
                Cartão de Crédito
              </SelectItem>
              <SelectItem value="debito">Débito</SelectItem>
              <SelectItem value="pix">Pix</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cartão (se crédito) + Parcelas */}
      {metodoPagamento === "cartao de credito" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Cartão *</Label>
            <Select value={cardId} onValueChange={setCardId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o cartão" />
              </SelectTrigger>
              <SelectContent>
                {cartoes.map((card) => (
                  <SelectItem key={card.id} value={String(card.id)}>
                    {card.nome} - *{card.numero}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Parcelas</Label>
            <Input
              type="number"
              min="1"
              max="24"
              placeholder="1"
              value={parcelas}
              onChange={(e) => setParcelas(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Data */}
      <div>
        <Label>Data *</Label>
        <DatePicker
          value={data}
          onChange={setData}
          placeholder="Selecione a data"
        />
      </div>

      {/* Toggle Despesa Fixa */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setFixo(!fixo)}
          className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${
            fixo ? "bg-blue-600" : "bg-gray-400"
          }`}
        >
          <div
            className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
              fixo ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
        <span className="text-white text-sm">Despesa fixa</span>
      </div>

      {/* Observações */}
      <div>
        <Label>Observações</Label>
        <Textarea
          placeholder="Observações adicionais..."
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
        />
      </div>

      {/* Botões */}
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
          className="px-6 py-3 w-full rounded-xl text-white font-semibold text-[16px] bg-[#00D4D4] hover:opacity-80 hover:text-black transition-all"
        >
          Salvar
        </button>
      </div>
    </form>
  );
}
