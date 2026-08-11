"use client";

import { useState } from "react";
import { NewThresholdForm } from "../forms/newThresholdForm";
import AddButton from "@/components/ui/addButton";
import { Threshold } from "@/types/threshold";
import { Modal } from "../ui/modal";

interface NewThresholdModalProps {
  onCreated?: (limite: Threshold) => void;
}

export function NewThresholdModal({ onCreated }: NewThresholdModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <Modal
      open={open}
      onOpenChange={setOpen}
      title="Novo Limite"
      trigger={
        <AddButton variant="primary" className="h-10">
          Novo Limite
        </AddButton>
      }
    >
      <NewThresholdForm onClose={() => setOpen(false)} onCreated={onCreated} />
    </Modal>
  );
}
