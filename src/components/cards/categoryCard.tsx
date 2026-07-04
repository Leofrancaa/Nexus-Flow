"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import DeleteButton from "@/components/ui/deleteButton";
import ConfirmDialog from "@/components/ui/confirmDialog";
import { Categoria } from "@/types/category";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/auth";
import {
  getApiErrorMessage,
  getContextualErrorMessage,
  generateToastId,
} from "@/utils/errorUtils";
import { FiCheck, FiX } from "react-icons/fi";
import EditButton from "@/components/ui/editButton";

interface CategoryCardProps {
  id: number;
  nome: string;
  cor: string;
  tipo: "despesa" | "receita";
  subcategorias: Categoria[];
  refreshTrigger?: number;
  onDelete: (id: number) => void;
}

export default function CategoryCard({
  id,
  nome,
  cor,
  tipo,
  subcategorias,
  refreshTrigger,
  onDelete,
}: CategoryCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [subToDelete, setSubToDelete] = useState<number | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    media: 0,
    percentual: 0,
    quantidade: 0,
  });
  const [deleteWarning, setDeleteWarning] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(nome);
  const [displayName, setDisplayName] = useState(nome);
  const [isSaving, setIsSaving] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const now = new Date();
        const res = await apiRequest(
          `/api/${
            tipo === "receita" ? "incomes" : "expenses"
          }/category-resume?mes=${now.getMonth() + 1}&ano=${now.getFullYear()}`
        );
        if (!res.ok) throw new Error("Erro ao buscar estatísticas");
        const data = await res.json();
        const categorias = data.data || [];
        const categoria = categorias.find((c: { id: number; nome: string; total: number; quantidade: number; percentual: number }) => c.id === id || c.nome === nome);

        if (categoria) {
          // Garantir que todos os valores sejam números válidos
          setStats({
            total: Number(categoria.total) || 0,
            media:
              categoria.quantidade > 0
                ? Number(categoria.total) / Number(categoria.quantidade)
                : 0,
            percentual: Number(categoria.percentual) || 0,
            quantidade: Number(categoria.quantidade) || 0,
          });
        } else {
          // Se a categoria não foi encontrada, manter valores zerados
          setStats({
            total: 0,
            media: 0,
            percentual: 0,
            quantidade: 0,
          });
        }
      } catch (error) {
        console.error("Erro ao carregar stats da categoria:", error);
        if (
          error instanceof Error &&
          error.message.includes("Sessão expirada")
        ) {
          router.push("/login");
        }
        // Em caso de erro, manter stats zeradas para evitar crashes
        setStats({
          total: 0,
          media: 0,
          percentual: 0,
          quantidade: 0,
        });
      }
    };

    fetchStats();
  }, [id, nome, tipo, router, refreshTrigger]);

  const handleEditClick = () => {
    setIsEditing(true);
    setEditedName(displayName);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedName(displayName);
  };

  const handleSaveEdit = async () => {
    if (!editedName.trim() || editedName.trim() === displayName) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    const toastId = generateToastId("update", "category", id);

    try {
      toast.loading("Atualizando categoria...", { id: toastId });

      const res = await apiRequest(`/api/categories/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nome: editedName.trim() }),
      });

      if (!res.ok) {
        const errorMessage = await getApiErrorMessage(
          res,
          "Não foi possível atualizar a categoria"
        );
        toast.error(errorMessage, { id: toastId });
        return;
      }

      toast.success("Categoria atualizada com sucesso!", { id: toastId });
      setIsEditing(false);
      // Atualiza o nome localmente — recarregar a página descartaria o toast.
      setDisplayName(editedName.trim());
    } catch (error) {
      if (error instanceof Error && error.message.includes("Sessão expirada")) {
        toast.error("Sessão expirada. Redirecionando para login...", {
          id: toastId,
        });
        router.push("/login");
      } else {
        const errorMessage = getContextualErrorMessage(
          error,
          "update",
          "categoria"
        );
        toast.error(errorMessage, { id: toastId });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = () => {
    // Preparar mensagem de aviso
    const transacoes = stats.quantidade;
    const subs = subcategorias.length;

    let warning = "Ao excluir esta categoria";
    const items = [];

    if (subs > 0) {
      items.push(`${subs} subcategoria${subs > 1 ? 's' : ''}`);
    }

    if (transacoes > 0) {
      items.push(`${transacoes} ${tipo === 'receita' ? 'receita' : 'despesa'}${transacoes > 1 ? 's' : ''}`);
    }

    if (items.length > 0) {
      warning += `, ${items.join(' e ')} vinculada${items.length > 1 || transacoes > 1 || subs > 1 ? 's' : ''} também será${items.length > 1 || transacoes > 1 || subs > 1 ? 'ão' : ''} excluída${items.length > 1 || transacoes > 1 || subs > 1 ? 's' : ''}.`;
    } else {
      warning = "Todas as subcategorias também serão removidas.";
    }

    setDeleteWarning(warning);
    setConfirmOpen(true);
  };

  const handleDelete = async (categoryId: number) => {
    if (isDeleting) return;

    setIsDeleting(true);
    const toastId = generateToastId("delete", "category", categoryId);

    try {
      toast.loading("Excluindo categoria...", { id: toastId });

      const res = await apiRequest(`/api/categories/${categoryId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorMessage = await getApiErrorMessage(
          res,
          "Não foi possível excluir a categoria"
        );
        toast.error(errorMessage, { id: toastId });
        return;
      }

      const data = await res.json();
      const deleted = data.data?.deletedItems;

      let successMessage = "Categoria excluída com sucesso!";
      if (deleted) {
        const deletedItems = [];
        if (deleted.subcategorias > 0) {
          deletedItems.push(`${deleted.subcategorias} subcategoria${deleted.subcategorias > 1 ? 's' : ''}`);
        }
        if (deleted.despesas > 0) {
          deletedItems.push(`${deleted.despesas} despesa${deleted.despesas > 1 ? 's' : ''}`);
        }
        if (deleted.receitas > 0) {
          deletedItems.push(`${deleted.receitas} receita${deleted.receitas > 1 ? 's' : ''}`);
        }
        if (deletedItems.length > 0) {
          successMessage += ` (${deletedItems.join(', ')} removida${deletedItems.length > 1 ? 's' : ''})`;
        }
      }

      toast.success(successMessage, { id: toastId });
      onDelete(categoryId);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Sessão expirada")) {
        toast.error("Sessão expirada. Redirecionando para login...", {
          id: toastId,
        });
        router.push("/login");
      } else {
        const errorMessage = getContextualErrorMessage(
          error,
          "delete",
          "categoria"
        );
        toast.error(errorMessage, { id: toastId });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Funções auxiliares para formatação segura
  const formatCurrency = (value: number): string => {
    const safeValue = Number(value) || 0;
    return safeValue.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const formatPercentage = (value: number): string => {
    const safeValue = Number(value) || 0;
    return safeValue.toFixed(1);
  };

  return (
    <div
      className="group flex flex-col gap-4 border rounded-lg p-5 shadow-md"
      style={{
        backgroundColor: "var(--card-bg)",
        borderColor: "var(--card-border)",
        color: "var(--card-text)",
      }}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3 flex-1">
          <div
            className="w-4 h-4 rounded-full flex-shrink-0"
            style={{ backgroundColor: cor }}
          />
          <div className="flex-1">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="text-lg font-bold px-2 py-1 rounded border"
                  style={{
                    color: cor,
                    borderColor: cor,
                    backgroundColor: "var(--card-bg)",
                  }}
                  disabled={isSaving}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveEdit();
                    if (e.key === "Escape") handleCancelEdit();
                  }}
                />
                <button
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  className="p-1 hover:bg-green-500/20 rounded transition"
                  title="Salvar"
                >
                  <FiCheck className="text-green-500" size={20} />
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="p-1 hover:bg-red-500/20 rounded transition"
                  title="Cancelar"
                >
                  <FiX className="text-red-500" size={20} />
                </button>
              </div>
            ) : (
              <>
                <p className="text-lg font-bold" style={{ color: cor }}>
                  {displayName}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                  {tipo}
                </p>
              </>
            )}
          </div>
        </div>

        {!isEditing && (
          <div className="flex items-center gap-2">
            <EditButton
              onClick={handleEditClick}
              title="Editar nome da categoria"
              size="sm"
            />
            <DeleteButton
              onClick={handleDeleteClick}
              disabled={isDeleting}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 text-sm text-muted-foreground">
        <div className="flex justify-between">
          <div className="flex flex-col">
            <span className="text-md">
              {tipo === "receita" ? "Receitas" : "Despesas"}
            </span>
            <span className="text-lg font-bold text-cyan-400">
              {stats.quantidade}
            </span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-md">Do total</span>
            <span className="text-lg font-bold text-purple-500">
              {formatPercentage(stats.percentual)}%
            </span>
          </div>
        </div>

        <div className="flex justify-between">
          <span className="text-md">
            {tipo === "receita" ? "Receita total" : "Gasto total"}
          </span>
          <span className="text-cyan-600 font-bold text-base">
            {formatCurrency(stats.total)}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-md">
            {tipo === "receita" ? "Média por receita" : "Média por despesa"}
          </span>
          <span className="text-green-400 font-bold text-base">
            {formatCurrency(stats.media)}
          </span>
        </div>
      </div>

      <div className="flex justify-between mt-3 items-center flex-wrap gap-2">
        <div className="flex flex-wrap gap-2">
          {subcategorias.map((sub) => (
            <span
              key={sub.id}
              className="text-xs px-3 py-1 rounded-full border"
              style={{
                color: cor,
                borderColor: cor,
                backgroundColor: "var(--card-list-bg)",
              }}
            >
              {sub.nome}
            </span>
          ))}
        </div>
        <button
          onClick={() =>
            router.push(tipo === "receita" ? "/receitas" : "/despesas")
          }
          className="text-sm px-4 py-2 rounded-md border hover:bg-white/10 transition cursor-pointer"
          style={{
            borderColor: "var(--card-border)",
            color: "var(--card-text)",
          }}
        >
          {tipo === "receita" ? "Ver Receitas" : "Ver Despesas"}
        </button>
      </div>

      {/* Confirmações */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Deseja excluir a categoria?"
        description={deleteWarning}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => handleDelete(id)}
      />
      <ConfirmDialog
        open={subToDelete !== null}
        onOpenChange={(open) => !open && setSubToDelete(null)}
        title="Deseja excluir a subcategoria?"
        description="Essa ação não poderá ser desfeita."
        onCancel={() => setSubToDelete(null)}
        onConfirm={() => {
          if (subToDelete !== null) {
            handleDelete(subToDelete);
            setSubToDelete(null);
          }
        }}
      />
    </div>
  );
}
