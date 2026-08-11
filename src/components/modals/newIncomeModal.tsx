"use client";

import { useState } from "react";
import { NewIncomeForm } from "../forms/newIncomeForm";
import AddButton from "../ui/addButton";
import { Modal } from "../ui/modal";

export function NewIncomeModal({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <Modal
      open={open}
      onOpenChange={setOpen}
      title="Nova Receita"
      size="lg"
      trigger={
        <AddButton variant="primary" className="h-10">
          Nova Receita
        </AddButton>
      }
    >
      <NewIncomeForm onClose={() => setOpen(false)} onCreated={onCreated} />
    </Modal>
  );
}
