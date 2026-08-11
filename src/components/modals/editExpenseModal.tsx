"use client";

import { EditExpenseForm } from "../forms/editExpenseForm";
import { Expense } from "@/types/expense";
import { Modal } from "../ui/modal";

interface Props {
  expense: Expense | null;
  onClose: () => void;
  onUpdated?: () => void;
}

export function EditExpenseModal({ expense, onClose, onUpdated }: Props) {
  if (!expense) return null;

  return (
    <Modal open onOpenChange={onClose} title="Editar Despesa">
      <EditExpenseForm
        expense={expense}
        onClose={onClose}
        onUpdated={onUpdated}
      />
    </Modal>
  );
}
