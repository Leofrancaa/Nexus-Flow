import { cn } from "@/lib/utils";

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Coluna padrão de conteúdo.
 *
 * 430px é a largura do maior celular comum; no desktop o app não estica —
 * vira a mesma coluna centralizada, porque as telas foram desenhadas para a
 * densidade do celular e esticá-las só produziria linhas longas e vazias.
 *
 * A folga do rodapé vem do `pb-nav` aplicado no wrapper de layout; aqui só
 * entram largura e respiro lateral.
 *
 * É ele quem emite o `<main>` da página — o wrapper de layout usa uma `div`
 * justamente para as telas ainda não migradas, que trazem o próprio `<main>`,
 * não acabarem com dois aninhados.
 */
export function PageWrapper({ children, className }: PageWrapperProps) {
  return (
    <main className={cn("mx-auto w-full max-w-[430px] px-5", className)}>
      {children}
    </main>
  );
}
