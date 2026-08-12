"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  description?: string;
  onCancel: () => void;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
}

export default function ConfirmDialog({
  open,
  title = "Tem certeza?",
  description = "Essa ação não poderá ser desfeita.",
  onCancel,
  onConfirm,
  onOpenChange,
}: ConfirmDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="nx-dialog-overlay fixed inset-0 z-[100] bg-[#030406]/82 backdrop-blur-[6px]" />
        <Dialog.Content
          className="nx-dialog-content fixed left-1/2 top-1/2 z-[100] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-[1.75rem] border border-white/[0.07] bg-[linear-gradient(160deg,#181b1f_0%,#111316_70%)] p-6 shadow-[0_28px_80px_rgba(0,0,0,.62)] focus:outline-none"
        >
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-negative/20 bg-negative/10 text-negative">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>
          <Dialog.Title className="mb-2 font-display text-xl font-bold tracking-[-0.025em] text-fg">
            {title}
          </Dialog.Title>
          <Dialog.Description className="mb-6 text-sm leading-6 text-muted">
            {description}
          </Dialog.Description>
          <div className="flex gap-3">
            <button
              onClick={() => {
                onCancel();
                onOpenChange(false);
              }}
              className="min-h-12 flex-1 rounded-[14px] border border-line px-4 py-3 font-semibold text-muted transition-[background-color,color,transform] duration-200 hover:bg-elevated hover:text-fg active:scale-[.98]"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
              className="min-h-12 flex-1 rounded-[14px] bg-negative px-4 py-3 font-semibold text-[#160608] transition-[filter,transform] duration-200 hover:brightness-105 active:scale-[.98]"
            >
              Confirmar
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
