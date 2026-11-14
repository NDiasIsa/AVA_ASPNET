import { renderizarFormula, separarTrechos } from "@/lib/tex";

/**
 * Exibe texto com fórmulas LaTeX. O texto comum passa pelo escape do React;
 * apenas a saída do KaTeX é inserida como HTML.
 */
export function Tex({ texto, className }: { texto: string; className?: string }) {
  return (
    <span className={className ? `tex ${className}` : "tex"}>
      {separarTrechos(texto).map((trecho, i) =>
        trecho.tipo === "texto" ? (
          trecho.valor
        ) : (
          <span
            key={i}
            className={trecho.bloco ? "tex-bloco" : undefined}
            dangerouslySetInnerHTML={{ __html: renderizarFormula(trecho.valor, trecho.bloco) }}
          />
        ),
      )}
    </span>
  );
}
