"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, LoaderCircle, Lock, Mail } from "lucide-react";
import { toast } from "react-hot-toast";

import { AuthShell } from "@/components/auth/authShell";
import Button from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/lib/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") !== "auth_callback") return;

    toast.error("O link de acesso expirou ou já foi utilizado. Solicite um novo link.");
    window.history.replaceState({}, "", "/login");
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

    if (!email.trim() || !senha) {
      toast.error("Informe seu e-mail e sua senha.");
      return;
    }

    setLoading(true);
    try {
      const response = await login({ email, senha });
      toast.success(response.message);
      router.replace("/dashboard");
      router.refresh();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível entrar. Tente novamente."
      );
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Acesso privado"
      title="Entre no seu Nexus"
      description="Consulte sua vida financeira em um espaço pessoal, silencioso e seguro."
    >
      <form onSubmit={handleSubmit} className="space-y-5" aria-busy={loading}>
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
              autoFocus
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="senha" className="text-sm font-semibold text-fg/78">
              Senha
            </Label>
            <Link
              href="/forgot-password"
              className="rounded-md text-sm text-muted transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/45"
            >
              Esqueci a senha
            </Link>
          </div>
          <div className="relative mt-2">
            <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" aria-hidden="true" />
            <Input
              id="senha"
              name="senha"
              type={showSenha ? "text" : "password"}
              autoComplete="current-password"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              placeholder="Sua senha"
              className="pl-11 pr-12"
              required
            />
            <button
              type="button"
              onClick={() => setShowSenha((visible) => !visible)}
              aria-label={showSenha ? "Ocultar senha" : "Mostrar senha"}
              aria-pressed={showSenha}
              className="absolute right-2.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-subtle transition-[background-color,color,transform] duration-200 hover:bg-white/[0.05] hover:text-fg active:scale-95"
            >
              {showSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" className="mt-7" disabled={loading}>
          {loading ? (
            <>
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Entrando
            </>
          ) : (
            "Entrar"
          )}
        </Button>

        <p className="pt-2 text-center text-sm text-muted">
          Recebeu um convite?{" "}
          <Link
            href="/register"
            className="font-semibold text-brand transition-opacity hover:opacity-80"
          >
            Criar acesso
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
