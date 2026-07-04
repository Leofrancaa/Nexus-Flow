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

    const toastId = toast.loading("Atualizando receita...");

    try {
      const res = await apiRequest(`/api/incomes/${income.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tipo,
          quantidade: parseFloat(quantidade),
          fonte,
          nota,
          data,
          category_id: parseInt(categoriaId),
        }),
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
      {/* Descrição e Valor */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {/* Fonte e Categoria */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Fonte</Label>
          <Input
            value={fonte}
            onChange={(e) => setFonte(e.target.value)}
            required
          />
        </div>

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
      </div>

      {/* Data */}
      <div>
        <Label>Data</Label>
        <DatePicker
          value={data}
          onChange={setData}
          placeholder="Selecione a data"
        />
      </div>

      {/* Nota */}
      <div>
        <Label>Nota</Label>
        <Textarea
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          placeholder="Observações adicionais..."
        />
      </div>

      {/* Botões */}
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-md bg-[#1F2937] text-white hover:bg-[#374151] transition"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 rounded-md bg-cyan-600 text-white hover:bg-cyan-500 transition"
        >
          Salvar Alterações
        </button>
      </div>
    </form>
  );
}
