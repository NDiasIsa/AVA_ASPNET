export type Estado = "aberto" | "pendente" | "entregue" | "corrigida" | "atrasado" | "neutro";

/** Status na notação de Dirac, a assinatura visual do sistema: |entregue⟩. */
export function Ket({ estado, children }: { estado: Estado; children: string }) {
  return (
    <span className={`ket ket-${estado}`}>
      <span aria-hidden="true">|</span>
      {children}
      <span aria-hidden="true">⟩</span>
    </span>
  );
}
