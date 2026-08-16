"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Check,
  ChevronRight,
  FolderKanban,
  Gauge,
  Landmark,
  LogOut,
  Settings,
  ShieldCheck,
  Target,
  type LucideIcon,
} from "lucide-react";
import toast from "react-hot-toast";

import { PageWrapper } from "@/components/layout/pageWrapper";
import { UserAvatar } from "@/components/profile/userAvatar";
import { apiRequest, getUserData, logout } from "@/lib/auth";
import { AVATAR_OPTIONS, DEFAULT_AVATAR, type AvatarId } from "@/lib/avatars";

interface ItemHub {
  label: string;
  descricao: string;
  href: string;
  icon: LucideIcon;
}

const ITENS: ItemHub[] = [
  {
    label: "Open Finance",
    descricao: "Conecte bancos e sincronize transações",
    href: "/open-finance",
    icon: Landmark,
  },
  {
    label: "Categorias",
    descricao: "Organize entradas e saídas",
    href: "/categorias",
    icon: FolderKanban,
  },
  {
    label: "Limites e metas",
    descricao: "Tetos por categoria e objetivos",
    href: "/limites",
    icon: Gauge,
  },
  {
    label: "Planos",
    descricao: "Investimentos e reservas",
    href: "/planos",
    icon: Target,
  },
  {
    label: "Configurações",
    descricao: "Conta, moeda e preferências",
    href: "/configuracoes",
    icon: Settings,
  },
  {
    label: "Manual",
    descricao: "Como o app funciona",
    href: "/manual",
    icon: BookOpen,
  },
];

/**
 * Hub do perfil.
 *
 * As telas de configuração são as menos visitadas do app — em vez de gastar
 * uma aba com cada uma, elas entram aqui como lista. A quinta aba fica sendo
 * a porta de entrada de tudo que não é consulta do dia a dia.
 */
export default function PerfilPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState<AvatarId>(DEFAULT_AVATAR);
  const [salvandoAvatar, setSalvandoAvatar] = useState(false);

  useEffect(() => {
    getUserData()
      .then((user) => {
        if (user?.nome) setNome(user.nome);
        if (user?.email) setEmail(user.email);
        const avatarSalvo = AVATAR_OPTIONS.find((option) => option.id === user?.avatar);
        if (avatarSalvo) setAvatar(avatarSalvo.id);
      })
      .catch(() => {
        /* o hub continua útil sem os dados do usuário */
      });
  }, []);

  const sair = async () => {
    await logout();
    router.push("/login");
  };

  const escolherAvatar = async (novoAvatar: AvatarId) => {
    if (salvandoAvatar || novoAvatar === avatar) return;

    const avatarAnterior = avatar;
    setAvatar(novoAvatar);
    setSalvandoAvatar(true);

    try {
      const response = await apiRequest("/api/users/me", {
        method: "PATCH",
        body: JSON.stringify({ avatar: novoAvatar }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Não foi possível salvar o avatar.");
      toast.success("Avatar atualizado.");
    } catch (error) {
      setAvatar(avatarAnterior);
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o avatar.");
    } finally {
      setSalvandoAvatar(false);
    }
  };

  return (
    <PageWrapper className="pt-8">
      <header className="relative isolate mb-6 overflow-hidden rounded-[1.75rem] border border-white/[0.07] bg-surface px-5 py-5 shadow-[0_24px_70px_-42px_rgba(190,255,0,.4)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[url('/aurora.svg')] bg-cover bg-top bg-no-repeat opacity-80"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-16 -z-10 h-40 w-40 rounded-full bg-brand/15 blur-3xl"
        />
        <div className="flex items-center gap-4">
          <span className="relative shrink-0">
            <UserAvatar avatar={avatar} size="lg" />
            <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-[3px] border-surface bg-brand" />
          </span>
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-brand">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Conta pessoal
            </div>
            <h1 className="truncate font-display text-2xl font-bold tracking-tight text-fg">
              {nome || "Perfil"}
            </h1>
            {email && <p className="truncate text-sm text-muted">{email}</p>}
          </div>
        </div>
      </header>

      <section
        aria-labelledby="avatar-title"
        className="mb-6 rounded-[1.5rem] border border-white/[0.07] bg-surface p-4"
      >
        <div className="mb-4 px-1">
          <h2 id="avatar-title" className="font-display text-base font-bold text-fg">
            Escolha seu avatar
          </h2>
          <p className="mt-1 text-xs text-muted">
            Ele aparecerá ao lado do seu nome na tela principal.
          </p>
        </div>

        <div className="grid grid-cols-4 gap-2.5" aria-busy={salvandoAvatar}>
          {AVATAR_OPTIONS.map((option) => {
            const selecionado = option.id === avatar;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => escolherAvatar(option.id)}
                disabled={salvandoAvatar}
                aria-label={`Usar avatar ${option.label}`}
                aria-pressed={selecionado}
                title={option.label}
                className="relative flex min-h-[5.5rem] touch-manipulation flex-col items-center justify-center gap-1.5 rounded-2xl border border-transparent bg-elevated transition-[background-color,border-color,transform,opacity] hover:border-white/10 hover:bg-line active:scale-[.96] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/70 aria-pressed:border-brand/45 aria-pressed:bg-brand/[0.06]"
              >
                <UserAvatar avatar={option.id} size="md" />
                <span className="text-[10px] font-semibold text-muted">
                  {option.label}
                </span>
                {selecionado ? (
                  <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-bg shadow-sm">
                    <Check className="h-3 w-3" aria-hidden="true" />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      <nav aria-label="Ajustes" className="relative z-10">
        <div className="mb-3 flex items-center justify-between px-1">
          <h2 className="font-display text-base font-bold text-fg">Conta e preferências</h2>
          <span className="text-[10px] font-bold uppercase tracking-[.14em] text-subtle">Nexus</span>
        </div>
        <ul className="overflow-hidden rounded-[1.5rem] border border-white/[0.07] bg-surface">
          {ITENS.map(({ label, descricao, href, icon: Icon }, i) => (
            <li key={href}>
              <Link
                href={href}
                className="group flex min-h-[4.75rem] items-center gap-3 px-4 py-3.5 transition-colors hover:bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/70"
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${i === 0 ? "bg-brand/10 text-brand" : "bg-elevated text-muted group-hover:text-fg"}`}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-fg">{label}</span>
                  <span className="block truncate text-xs text-muted">
                    {descricao}
                  </span>
                </span>
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-subtle"
                  aria-hidden="true"
                />
              </Link>
              {i < ITENS.length - 1 && (
                <div className="ml-16 h-px bg-line" aria-hidden="true" />
              )}
            </li>
          ))}
        </ul>
      </nav>

      <button
        type="button"
        onClick={sair}
        className="mt-6 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border border-negative/10 bg-surface font-semibold text-negative transition-colors hover:bg-negative/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-negative/60"
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
        Sair da conta
      </button>
    </PageWrapper>
  );
}
