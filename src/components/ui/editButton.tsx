import { Pencil } from "lucide-react";

interface EditButtonProps {
  onClick?: () => void;
  title?: string;
  size?: "sm" | "md" | "lg"; // tamanho do ícone
}

export default function EditButton({
  onClick,
  title = "Editar item",
  size = "md",
}: EditButtonProps) {
  const sizeClasses = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <button
      onClick={onClick}
      aria-label={title}
      title={title}
      className="group flex h-10 w-10 items-center justify-center rounded-full border border-line bg-elevated/70 text-muted transition-[background-color,color,transform] duration-200 hover:bg-line hover:text-fg active:scale-[.95]"
    >
      <Pencil className={sizeClasses[size]} aria-hidden="true" />
    </button>
  );
}
