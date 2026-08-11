"use client";

import { useState } from "react";
import { ContributeForm } from "../forms/contributeForm";
import { TrendingUp } from "lucide-react";
import { Modal } from "../ui/modal";

interface Props {
  planId: number;
  onContributed?: () => void;
}

export function ContributeModal({ planId, onContributed }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Modal
      open={open}
      onOpenChange={setOpen}
      title="Contribuir com o plano"
      trigger={
        <button className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-bg transition-opacity glow-sm hover:opacity-90">
          Contribuir
          <TrendingUp className="h-4 w-4" />
        </button>
      }
    >
      <ContributeForm
        planId={planId}
        onClose={() => setOpen(false)}
        onContributed={onContributed}
      />
    </Modal>
  );
}
