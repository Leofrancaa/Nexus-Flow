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
        <Dialog.Overlay className="nx-dialog-overlay fixed inset-0 z-[80] bg-[#030406]/82 backdrop-blur-[6px]" />

        <Dialog.Content
          // Sem <Dialog.Description>, o Radix avisa em dev. O escape oficial é
          // a chave `aria-describedby` existir com valor undefined — por isso o
          // spread condicional, e não um ternário (que passaria a chave sempre).
          {...(description ? {} : { "aria-describedby": undefined })}
          className={cn(
            "nx-dialog-content fixed z-[80] flex min-h-0 flex-col border border-white/[0.08] bg-[radial-gradient(circle_at_16%_0%,rgba(212,255,0,.055),transparent_32%),linear-gradient(160deg,#181b1f_0%,#111316_62%)] shadow-[0_28px_80px_rgba(0,0,0,.62)] focus:outline-none",
            // celular: folha ancorada embaixo
            "inset-x-0 bottom-0 w-full max-h-[calc(100dvh-max(.75rem,env(safe-area-inset-top)))] rounded-t-[1.75rem]",
            // sm+: card centralizado
            "sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[calc(100%-2rem)]",
            "sm:max-h-[88dvh] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[1.75rem]",
            SIZES[size],
            className
          )}
        >
          {/* Alça: afirma que dá para arrastar/fechar. Só no celular. */}
          <div
            aria-hidden="true"
            className="mx-auto mt-3 h-[3px] w-10 shrink-0 rounded-full bg-brand/80 shadow-[0_0_14px_rgba(212,255,0,.3)] sm:hidden"
          />

          <div className="nx-dialog-header relative flex shrink-0 items-start justify-between gap-4 px-6 pb-4 pt-5">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand shadow-[0_0_12px_rgba(212,255,0,.55)]" />
                <Dialog.Title className="text-lg font-bold tracking-[-0.02em] text-fg">
                  {title}
                </Dialog.Title>
              </div>
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
                className="-mr-1 -mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.06] bg-elevated/70 text-muted transition-[background-color,color,transform] duration-200 hover:bg-line hover:text-fg active:scale-95"
              >
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <div
            className="nx-dialog-body min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
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
    <div className={cn("sticky bottom-0 -mx-1 flex flex-col-reverse gap-3 bg-gradient-to-t from-[#111316] via-[#111316] to-transparent px-1 pt-6 min-[360px]:flex-row", className)}>{children}</div>
  );
}

export function ModalCancelButton({ children = "Cancelar" }: { children?: React.ReactNode }) {
  return (
    <Dialog.Close asChild>
      <button
        type="button"
        className="min-h-12 min-w-0 flex-1 rounded-[14px] border border-line bg-transparent px-4 py-3 font-semibold text-muted transition-[background-color,color,transform] duration-200 hover:bg-elevated hover:text-fg active:scale-[.98]"
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
      className="min-h-12 min-w-0 flex-1 rounded-[14px] bg-brand px-4 py-3 font-semibold text-bg transition-[opacity,transform,box-shadow] duration-200 glow-sm hover:opacity-90 active:scale-[.98] disabled:opacity-50 disabled:shadow-none"
    >
      {children}
    </button>
  );
}
