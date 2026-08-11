"use client";

import { EditPlanForm } from "../forms/editPlanForm";
import { Modal } from "../ui/modal";

interface Plano {
  id: number;
  nome: string;
  descricao?: string;
  meta: number;
  prazo: string;
}

interface EditPlanModalProps {
  plano: Plano | null;
  onClose: () => void;
  onUpdated?: () => void;
}

export function EditPlanModal({
  plano,
  onClose,
  onUpdated,
}: EditPlanModalProps) {
  if (!plano) return null;

  return (
    <Modal open onOpenChange={onClose} title="Editar Plano" size="lg">
      <EditPlanForm plano={plano} onClose={onClose} onUpdated={onUpdated} />
    </Modal>
  );
}
