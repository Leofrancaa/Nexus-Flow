"use client";

import { useState } from "react";
import AddButton from "@/components/ui/addButton";
import { NewCardForm } from "../forms/newCardForm";
import { Modal } from "../ui/modal";

interface NewCardModalProps {
  onCreated?: () => void;
}

export function NewCardModal({ onCreated }: NewCardModalProps) {
  // Estado próprio em vez de clicar no botão de fechar via querySelector: aquele
  // seletor pegava o primeiro [data-radix-dialog-close] do documento, que podia
  // ser o de outro modal aberto.
  const [open, setOpen] = useState(false);

  return (
    <Modal
      open={open}
      onOpenChange={setOpen}
      title="Novo Cartão"
      trigger={
        <AddButton variant="primary" className="h-10">
          Novo Cartão
        </AddButton>
      }
    >
      <NewCardForm onClose={() => setOpen(false)} onCreated={onCreated} />
    </Modal>
  );
}
