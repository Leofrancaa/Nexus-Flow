"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "react-hot-toast";

import Button from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, LoginError } from "@/lib/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !senha) {
      toast.error("Por favor, preencha seu email e senha");
      return;
    }

    setLoading(true);
    try {
      const response = await login({ email, senha });

      if (response.success) {
        toast.success("Login realizado com sucesso!");
        // Pequeno atraso para o cookie de sessão assentar antes da navegação.
        setTimeout(() => {
          router.push("/dashboard");
        }, 500);
      } else {
        toast.error(
          response.message ||
            "Não foi possível fazer login. Verifique suas credenciais"
        );
      }
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível completar a ação. Tente novamente"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-bg">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[380px] bg-[url('/aurora.svg')] bg-cover bg-top bg-no-repeat"
      />

      <div className="relative mx-auto flex w-full max-w-[430px] flex-1 flex-col justify-center px-6 py-12">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-8 w-[130px]">
            <Image
              src="/logo-nexus.png"
              alt="Nexus"
              width={0}
              height={0}
              sizes="130px"
              style={{ width: "100%", height: "auto" }}
              priority
            />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-fg">
            Entrar na conta
          </h1>
          <p className="mt-2 text-sm text-muted">
            Suas finanças, num lugar só.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <Label htmlFor="email">Email</Label>
            <div className="relative mt-1.5">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="pl-11"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="senha">Senha</Label>
              <Link
                href="/forgot-password"
                className="text-sm text-muted transition-colors hover:text-brand"
              >
                Esqueci minha senha
              </Link>
            </div>
            <div className="relative mt-1.5">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
              <Input
                id="senha"
                type={showSenha ? "text" : "password"}
                autoComplete="current-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Sua senha"
                className="pl-11 pr-11"
              />
              <button
                type="button"
                onClick={() => setShowSenha(!showSenha)}
                aria-label={showSenha ? "Ocultar senha" : "Mostrar senha"}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-subtle transition-colors hover:text-fg"
              >
                {showSenha ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <Button type="submit" className="mt-2" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>

          <p className="mt-2 text-center text-sm text-muted">
            Não tem uma conta?{" "}
            <Link
              href="/register"
              className="font-semibold text-brand hover:underline"
            >
              Crie agora
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
