"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, LoaderCircle, Lock, Mail, Ticket, User } from "lucide-react";
import { toast } from "react-hot-toast";

import { AuthShell } from "@/components/auth/authShell";
import { TermsModal } from "@/components/modals/termsModal";
import Button from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { register } from "@/lib/auth";

export default function Signup() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

    if (!nome.trim() || !email.trim() || !senha || !confirmarSenha) {
      toast.error("Preencha nome, e-mail e senha.");
      return;
    }
    if (senha !== confirmarSenha) {
      toast.error("As senhas não coincidem.");
      return;
    }
    if (senha.length < 8) {
      toast.error("Use uma senha com pelo menos 8 caracteres.");
      return;
    }
    if (!aceitouTermos) {
      toast.error("Aceite os Termos de Uso para continuar.");
      return;
    }

    setLoading(true);
    try {
      const response = await register({
        nome: nome.trim(),
        email: email.trim(),
        senha,
        inviteCode,
        aceitouTermos,
      });

      toast.success(
        response.message || "Conta criada. Confirme seu e-mail para continuar."
      );
      router.replace("/login");
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível criar o acesso. Tente novamente."
      );
      setLoading(false);
    }
  };

  const passwordToggle = (
    visible: boolean,
    setVisible: React.Dispatch<React.SetStateAction<boolean>>,
    label: string
  ) => (
    <button
      type="button"
      onClick={() => setVisible((value) => !value)}
      aria-label={visible ? `Ocultar ${label}` : `Mostrar ${label}`}
      aria-pressed={visible}
      className="absolute right-2.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-subtle transition-[background-color,color,transform] duration-200 hover:bg-white/[0.05] hover:text-fg active:scale-95"
    >
      {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );

  return (
    <AuthShell
      eyebrow="Acesso por convite"
      title="Crie seu acesso"
      description="A primeira conta inicia o espaço. Depois dela, cada nova pessoa entra com um convite."
      wide
    >
      <form onSubmit={handleSubmit} className="space-y-5" aria-busy={loading}>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="nome" className="text-sm font-semibold text-fg/78">
              Nome completo
            </Label>
            <div className="relative mt-2">
              <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" aria-hidden="true" />
              <Input
                id="nome"
                name="nome"
                autoComplete="name"
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                placeholder="Seu nome"
                className="pl-11"
                required
                autoFocus
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email" className="text-sm font-semibold text-fg/78">
              E-mail
            </Label>
            <div className="relative mt-2">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" aria-hidden="true" />
              <Input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="seu@email.com"
                className="pl-11"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="senha" className="text-sm font-semibold text-fg/78">
              Senha
            </Label>
            <div className="relative mt-2">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" aria-hidden="true" />
              <Input
                id="senha"
                name="senha"
                type={showSenha ? "text" : "password"}
                autoComplete="new-password"
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                placeholder="Mínimo de 8 caracteres"
                className="pl-11 pr-12"
                minLength={8}
                required
              />
              {passwordToggle(showSenha, setShowSenha, "senha")}
            </div>
          </div>

          <div>
            <Label htmlFor="confirmarSenha" className="text-sm font-semibold text-fg/78">
              Confirmar senha
            </Label>
            <div className="relative mt-2">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" aria-hidden="true" />
              <Input
                id="confirmarSenha"
                name="confirmarSenha"
                type={showConfirmar ? "text" : "password"}
                autoComplete="new-password"
                value={confirmarSenha}
                onChange={(event) => setConfirmarSenha(event.target.value)}
                placeholder="Repita sua senha"
                className="pl-11 pr-12"
                minLength={8}
                required
              />
              {passwordToggle(showConfirmar, setShowConfirmar, "confirmação de senha")}
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="inviteCode" className="text-sm font-semibold text-fg/78">
              Código de convite
            </Label>
            <span className="text-[.68rem] font-semibold uppercase tracking-[0.14em] text-subtle">
              Quando solicitado
            </span>
          </div>
          <div className="relative mt-2">
            <Ticket className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" aria-hidden="true" />
            <Input
              id="inviteCode"
              name="inviteCode"
              value={inviteCode}
              onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
              placeholder="Ex.: NEXUS-7K4P"
              className="pl-11 uppercase tracking-[0.08em]"
              maxLength={32}
              autoComplete="off"
            />
          </div>
          <p className="mt-2 text-xs leading-5 text-subtle">
            Não recebeu um código?{" "}
            <a
              href="https://wa.me/5571996601709?text=Olá! Gostaria de obter um código de convite para o Nexus"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-muted transition-colors hover:text-brand"
            >
              Solicitar convite
            </a>
          </p>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-[14px] border border-white/[0.055] bg-white/[0.025] p-4 text-sm leading-5 text-muted transition-colors hover:border-white/[0.1]">
          <input
            type="checkbox"
            checked={aceitouTermos}
            onChange={(event) => setAceitouTermos(event.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-line bg-elevated accent-[#D4FF00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/45"
          />
          <span>
            Li e aceito os{" "}
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                setShowTermsModal(true);
              }}
              className="font-semibold text-fg underline decoration-white/25 underline-offset-4 transition-colors hover:text-brand"
            >
              Termos de Uso
            </button>
            .
          </span>
        </label>

        <Button type="submit" className="mt-6" disabled={loading}>
          {loading ? (
            <>
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Criando acesso
            </>
          ) : (
            "Criar acesso"
          )}
        </Button>

        <p className="pt-1 text-center text-sm text-muted">
          Já tem acesso?{" "}
          <Link href="/login" className="font-semibold text-brand transition-opacity hover:opacity-80">
            Entrar
          </Link>
        </p>
      </form>

      <TermsModal open={showTermsModal} onOpenChange={setShowTermsModal} />
    </AuthShell>
  );
}
