"use client";

import { CardType } from "@/types/card";
import { EditCardForm } from "../forms/editCardForm";
import { Modal } from "../ui/modal";

interface Props {
  card: CardType;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export function EditCardModal({ card, open, onClose, onUpdated }: Props) {
  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title="Editar Cartão"
    >
      <EditCardForm card={card} onClose={onClose} onUpdated={onUpdated} />
    </Modal>
  );
}
