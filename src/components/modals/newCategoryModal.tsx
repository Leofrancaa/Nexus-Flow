"use client";

import { useState } from "react";
import { NewCategoryForm } from "../forms/newCategoryForm";
import AddButton from "@/components/ui/addButton";
import { Categoria } from "@/types/category";
import { Modal } from "../ui/modal";

interface NewCategoryModalProps {
  onCreated?: (categoria: Categoria) => void;
}

export function NewCategoryModal({ onCreated }: NewCategoryModalProps) {
  // Ver nota em newCardModal: o fechamento por querySelector era frágil.
  const [open, setOpen] = useState(false);

  return (
    <Modal
      open={open}
      onOpenChange={setOpen}
      title="Nova Categoria"
      trigger={
        <AddButton variant="primary" className="h-10">
          Nova Categoria
        </AddButton>
      }
    >
      <NewCategoryForm onClose={() => setOpen(false)} onCreated={onCreated} />
    </Modal>
  );
}
