import Link from "next/link";

/** Átomo do logotipo redesenhado para fundo escuro. */
export function Atomo({ tamanho = 34 }: { tamanho?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <g stroke="var(--psi)" strokeWidth="1.8" opacity=".75">
        <ellipse cx="32" cy="32" rx="29" ry="11" />
        <ellipse cx="32" cy="32" rx="29" ry="11" transform="rotate(60 32 32)" />
        <ellipse cx="32" cy="32" rx="29" ry="11" transform="rotate(120 32 32)" />
      </g>
      <circle cx="32" cy="32" r="20" stroke="var(--luz)" strokeWidth="3.4" />
      <path d="M46 46l9 8" stroke="var(--luz)" strokeWidth="3.4" strokeLinecap="round" />
      <circle cx="32" cy="32" r="5" fill="var(--foton)" />
    </svg>
  );
}

export function Marca() {
  return (
    <Link href="/" className="marca" aria-label="QuantumPinheiral, página inicial">
      <Atomo />
      <span className="marca-nome">
        Quantum<span>Pinheiral</span>
      </span>
    </Link>
  );
}
