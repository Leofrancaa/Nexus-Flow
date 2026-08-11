"use client";

import { useState } from "react";
import { NewPlanForm } from "../forms/newPlanForm";
import AddButton from "../ui/addButton";
import { Modal } from "../ui/modal";

export function NewPlanModal({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <Modal
      open={open}
      onOpenChange={setOpen}
      title="Novo Plano"
      size="lg"
      trigger={
        <AddButton variant="primary" className="h-10">
          Novo Plano
        </AddButton>
      }
    >
      <NewPlanForm onClose={() => setOpen(false)} onCreated={onCreated} />
    </Modal>
  );
}
