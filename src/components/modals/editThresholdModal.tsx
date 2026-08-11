"use client";

import { NewThresholdForm } from "../forms/newThresholdForm";
import { Threshold } from "@/types/threshold";
import { Modal } from "../ui/modal";

interface EditThresholdModalProps {
  threshold: Threshold | null;
  onClose: () => void;
  onUpdated?: () => void;
}

export function EditThresholdModal({
  threshold,
  onClose,
  onUpdated,
}: EditThresholdModalProps) {
  if (!threshold) return null;

  return (
    <Modal open onOpenChange={onClose} title="Editar Limite">
      <NewThresholdForm
        mode="edit"
        threshold={threshold}
        onClose={onClose}
        onUpdated={onUpdated}
      />
    </Modal>
  );
}
