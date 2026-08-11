"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-2xl",
} as const;

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Texto auxiliar sob o título. Também serve de descrição acessível. */
  description?: string;
  size?: keyof typeof SIZES;
  /** Elemento que abre o modal. Omita para controlar de fora. */
  trigger?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Modal padrão do app.
 *
 * No celular sobe de baixo ocupando a largura toda — um app de finanças abre
 * modal o tempo todo para lançar despesa, e no rodapé o alcance do polegar é
 * melhor. De `sm` para cima vira card centralizado.
 *
 * O corpo sempre rola por dentro, com o cabeçalho fixo: antes só alguns
 * modais faziam isso, e os demais estouravam a tela em formulários longos.
 */
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  size = "md",
  trigger,
  children,
  className,
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger ? <Dialog.Trigger asChild>{trigger}</Dialog.Trigger> : null}

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in" />

        <Dialog.Content
          // Sem <Dialog.Description>, o Radix avisa em dev. O escape oficial é
          // a chave `aria-describedby` existir com valor undefined — por isso o
          // spread condicional, e não um ternário (que passaria a chave sempre).
          {...(description ? {} : { "aria-describedby": undefined })}
          className={cn(
            "fixed z-50 flex min-h-0 flex-col bg-surface shadow-2xl focus:outline-none",
            // celular: folha ancorada embaixo
            "inset-x-0 bottom-0 max-h-[92dvh] rounded-t-3xl",
            // sm+: card centralizado
            "sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[calc(100%-2rem)]",
            "sm:max-h-[88dvh] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl",
            SIZES[size],
            className
          )}
        >
          {/* Alça: afirma que dá para arrastar/fechar. Só no celular. */}
          <div
            aria-hidden="true"
            className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-line sm:hidden"
          />

          <div className="flex shrink-0 items-start justify-between gap-4 px-6 pb-4 pt-5">
            <div className="min-w-0">
              <Dialog.Title className="font-display text-xl font-bold tracking-tight text-fg">
                {title}
              </Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-1 text-sm text-muted">
                  {description}
                </Dialog.Description>
              ) : null}
            </div>

            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Fechar"
                data-radix-dialog-close
                className="-mr-1 -mt-1 shrink-0 rounded-xl p-2 text-muted transition-colors hover:bg-elevated hover:text-fg"
              >
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <div
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Rodapé de ações padronizado — Cancelar à esquerda, ação primária à direita. */
export function ModalActions({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-3 pt-5", className)}>{children}</div>
  );
}

export function ModalCancelButton({ children = "Cancelar" }: { children?: React.ReactNode }) {
  return (
    <Dialog.Close asChild>
      <button
        type="button"
        className="flex-1 rounded-xl border border-line px-4 py-3 font-medium text-muted transition-colors hover:bg-elevated hover:text-fg"
      >
        {children}
      </button>
    </Dialog.Close>
  );
}

/** Ação primária do modal — a cor de marca, com brilho. */
export function ModalSubmitButton({
  children,
  disabled,
  type = "submit",
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  type?: "submit" | "button";
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className="flex-1 rounded-xl bg-brand px-4 py-3 font-semibold text-bg transition-opacity glow-sm hover:opacity-90 disabled:opacity-50 disabled:shadow-none"
    >
      {children}
    </button>
  );
}
