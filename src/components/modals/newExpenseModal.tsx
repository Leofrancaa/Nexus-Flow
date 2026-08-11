"use client";

import { useState } from "react";
import { NewExpenseForm } from "../forms/newExpenseForm";
import AddButton from "../ui/addButton";
import { Modal } from "../ui/modal";

export function NewExpenseModal({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <Modal
      open={open}
      onOpenChange={setOpen}
      title="Nova Despesa"
      size="lg"
      trigger={
        <AddButton variant="primary" className="h-10">
          Nova Despesa
        </AddButton>
      }
    >
      <NewExpenseForm onClose={() => setOpen(false)} onCreated={onCreated} />
    </Modal>
  );
}
