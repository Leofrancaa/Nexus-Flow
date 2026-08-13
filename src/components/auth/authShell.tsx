import Image from "next/image";
import { ShieldCheck } from "lucide-react";

import { NexusLogo } from "@/components/brand/nexusLogo";
import { cn } from "@/lib/utils";

interface AuthShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  wide?: boolean;
}

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  wide = false,
}: AuthShellProps) {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-bg text-fg lg:grid lg:grid-cols-[minmax(0,1.08fr)_minmax(30rem,.92fr)]">
      <aside className="relative hidden min-h-dvh overflow-hidden lg:flex lg:flex-col lg:justify-between">
        <Image
          src="/nexus-observatory.png"
          alt="Observatório de concreto iluminado em uma montanha à noite"
          fill
          priority
          sizes="55vw"
          className="nx-auth-image object-cover object-[58%_center]"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,10,13,.14),rgba(8,10,13,.08)_55%,rgba(8,10,13,.72)),linear-gradient(180deg,rgba(8,10,13,.2),rgba(8,10,13,.12)_45%,rgba(8,10,13,.88))]" />

        <NexusLogo className="relative z-10 m-10" />

        <div className="relative z-10 max-w-xl p-10 pb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">
            Observatório financeiro
          </p>
          <h2 className="mt-4 max-w-lg font-display text-[3.25rem] font-bold leading-[.98] tracking-[-0.045em]">
            Seu mês,<br />em foco.
          </h2>
          <p className="mt-5 max-w-md text-base leading-7 text-fg/66">
            Uma visão privada e precisa para você e as pessoas que escolher convidar.
          </p>

          <div className="relative mt-8 h-8 max-w-md" aria-hidden="true">
            <div className="nx-signal-reveal absolute inset-0">
              <svg viewBox="0 0 420 32" preserveAspectRatio="none" className="h-full w-full overflow-visible">
                <path
                  d="M0 22 C70 22 104 22 146 22 C183 22 192 7 224 10 C257 13 270 25 302 17 C339 8 371 8 420 7"
                  fill="none"
                  stroke="var(--color-brand)"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>
            <span className="nx-signal-node glow-sm absolute right-0 top-[3px] h-2.5 w-2.5 rounded-full bg-brand motion-safe:animate-[nx-signal-breathe_2.8s_ease-in-out_infinite]" />
          </div>
        </div>
      </aside>

      <section className="relative flex min-h-dvh overflow-y-auto px-5 py-[max(2rem,env(safe-area-inset-top))] sm:px-10 lg:px-12 lg:py-12">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(212,255,0,.055),transparent_28%),linear-gradient(145deg,#0d0f12_0%,#080a0d_68%)]" />
        <div className={cn("nx-auth-form relative m-auto w-full", wide ? "max-w-[36rem]" : "max-w-[28rem]") }>
          <NexusLogo className="mb-12 lg:hidden" />

          <header className="mb-8">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brand shadow-[0_0_12px_rgba(212,255,0,.55)]" />
              {eyebrow}
            </div>
            <h1 className="mt-4 font-display text-[2.45rem] font-bold leading-none tracking-[-0.045em] text-fg">
              {title}
            </h1>
            <p className="mt-3 max-w-md text-sm leading-6 text-muted">
              {description}
            </p>
          </header>

          {children}

          <div className="mt-9 flex items-center gap-2 border-t border-white/[0.06] pt-5 text-xs text-subtle">
            <ShieldCheck className="h-3.5 w-3.5 text-brand/75" aria-hidden="true" />
            Sessão protegida e acesso restrito.
          </div>
        </div>
      </section>
    </main>
  );
}
