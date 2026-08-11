"use client";

import { EditIncomeForm } from "../forms/editIncomeForm";
import { Income } from "@/types/income";
import { Modal } from "../ui/modal";

interface Props {
  income: Income | null;
  onClose: () => void;
  onUpdated?: () => void;
}

export function EditIncomeModal({ income, onClose, onUpdated }: Props) {
  if (!income) return null;

  return (
    <Modal open onOpenChange={onClose} title="Editar Receita">
      <EditIncomeForm income={income} onClose={onClose} onUpdated={onUpdated} />
    </Modal>
  );
}
