"use client";

import { useId } from "react";

import { cn } from "@/lib/utils";

interface SpendTrendChartProps {
  /** Série na ordem cronológica. Menos de dois pontos não vira curva. */
  values: number[];
  className?: string;
}

const W = 100;
const H = 100;
/**
 * Respiro vertical, descontado nas duas pontas.
 *
 * O acumulado só sobe, então o último ponto é sempre o máximo da série: sem
 * essa folga ele cairia exatamente em y=0 e o círculo ficaria metade para
 * fora do card.
 */
const PAD = 10;

/**
 * Curva do gasto acumulado.
 *
 * SVG à mão em vez de recharts: são pontos sem eixo, tooltip ou legenda, e a
 * biblioteca custaria mais peso do que o desenho inteiro.
 *
 * O caminho estica com `preserveAspectRatio="none"`, o que deformaria um
 * círculo — por isso o ponto final é um elemento posicionado por cima, em
 * porcentagem, e não um <circle> dentro do SVG.
 */
export function SpendTrendChart({ values, className }: SpendTrendChartProps) {
  // Um id por instância: dois gráficos na mesma tela não podem disputar o
  // mesmo gradiente, senão o segundo herda o do primeiro.
  const gradId = useId();

  if (values.length < 2) return null;

  const max = Math.max(...values);
  const min = Math.min(...values, 0);
  // Série constante tem amplitude zero — sem o piso, a divisão explodiria.
  const span = max - min || 1;

  const y = (v: number) => PAD + (1 - (v - min) / span) * (H - 2 * PAD);

  const pontos = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W;
    return `${x.toFixed(2)} ${y(v).toFixed(2)}`;
  });

  const linha = `M${pontos.join(" L")}`;
  const area = `${linha} L${W} ${H} L0 ${H} Z`;

  const ultimoY = y(values[values.length - 1]);

  return (
    <div className={cn("relative", className)}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="h-full w-full"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--color-brand)"
              stopOpacity="0.32"
            />
            <stop
              offset="100%"
              stopColor="var(--color-brand)"
              stopOpacity="0"
            />
          </linearGradient>
        </defs>

        <path d={area} fill={`url(#${gradId})`} />
        <path
          d={linha}
          fill="none"
          stroke="var(--color-brand)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          // Mantém a espessura uniforme apesar do esticamento do viewBox.
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* Ponta da curva: é o "você está aqui" do gráfico. O halo vem do
          utilitário de marca, para o verde emitir luz em vez de só preencher. */}
      <span
        aria-hidden="true"
        className="glow-sm absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand"
        style={{ left: "100%", top: `${ultimoY}%` }}
      />
    </div>
  );
}
