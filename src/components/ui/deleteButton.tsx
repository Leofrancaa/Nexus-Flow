import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";

interface DeleteButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export default function DeleteButton({ onClick, disabled }: DeleteButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label="Excluir"
      title="Excluir"
      className={cn(
        "group flex h-10 w-10 items-center justify-center rounded-full border border-negative/15 bg-negative/[0.07] text-negative transition-[background-color,transform] duration-200 hover:bg-negative/[0.12] active:scale-[.95]",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <Trash2 className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
