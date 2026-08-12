interface LimitRingProps {
  /** Fração consumida, de 0 a 1. Valores fora da faixa são aparados. */
  ratio: number;
  size?: number;
}

const STROKE = 4;

/**
 * Anel de limite consumido.
 *
 * A cor conta o estado antes do número ser lido: marca até 70%, âmbar de 70 a
 * 90, vermelho acima disso. O arco começa às 12 horas — daí a rotação de -90°,
 * já que o SVG começaria às 3.
 */
export function LimitRing({ ratio, size = 44 }: LimitRingProps) {
  const seguro = Math.min(Math.max(ratio, 0), 1);
  const raio = (size - STROKE) / 2;
  const volta = 2 * Math.PI * raio;

  const cor =
    seguro >= 0.9
      ? "var(--color-negative)"
      : seguro >= 0.7
        ? "var(--color-warning)"
        : "var(--color-brand)";

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="-rotate-90"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={raio}
        fill="none"
        stroke="var(--color-line)"
        strokeWidth={STROKE}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={raio}
        fill="none"
        stroke={cor}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeDasharray={volta}
        strokeDashoffset={volta * (1 - seguro)}
      />
    </svg>
  );
}
