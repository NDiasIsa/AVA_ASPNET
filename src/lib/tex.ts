import katex from "katex";

export type Trecho = { tipo: "texto"; valor: string } | { tipo: "formula"; valor: string; bloco: boolean };

/**
 * Separa um texto em trechos normais e fórmulas LaTeX.
 * Delimitadores: $...$ e \(...\) na linha; $$...$$ e \[...\] em bloco; \$ é um cifrão literal.
 *
 * Como em Pandoc, o $ de abertura precisa vir colado ao conteúdo e o de fechamento não pode
 * anteceder um dígito. Assim "custa R$ 10 ou R$20" continua sendo texto comum.
 */
export function separarTrechos(fonte: string): Trecho[] {
  const trechos: Trecho[] = [];
  let texto = "";
  let i = 0;

  const fecharTexto = () => {
    if (texto) trechos.push({ tipo: "texto", valor: texto });
    texto = "";
  };

  const formula = (conteudo: string, bloco: boolean, fim: number) => {
    fecharTexto();
    trechos.push({ tipo: "formula", valor: conteudo, bloco });
    i = fim;
  };

  while (i < fonte.length) {
    if (fonte.startsWith("\\$", i)) {
      texto += "$";
      i += 2;
      continue;
    }
    if (fonte.startsWith("\\(", i) || fonte.startsWith("\\[", i)) {
      const bloco = fonte[i + 1] === "[";
      const fim = fonte.indexOf(bloco ? "\\]" : "\\)", i + 2);
      if (fim !== -1) {
        formula(fonte.slice(i + 2, fim), bloco, fim + 2);
        continue;
      }
    }
    if (fonte.startsWith("$$", i)) {
      const fim = fonte.indexOf("$$", i + 2);
      if (fim > i + 2) {
        formula(fonte.slice(i + 2, fim), true, fim + 2);
        continue;
      }
    }
    if (fonte[i] === "$") {
      const fim = fechoCifrao(fonte, i + 1);
      if (fim !== -1) {
        formula(fonte.slice(i + 1, fim), false, fim + 1);
        continue;
      }
    }
    texto += fonte[i];
    i += 1;
  }
  fecharTexto();
  return trechos;
}

function fechoCifrao(fonte: string, inicio: number): number {
  const primeiro = fonte[inicio];
  if (primeiro === undefined || /\s|\$/.test(primeiro)) return -1;
  for (let j = inicio; j < fonte.length; j++) {
    const c = fonte[j];
    if (c === "\n" && fonte[j + 1] === "\n") return -1;
    if (c === "\\") {
      j += 1;
      continue;
    }
    if (c === "$") {
      if (/\s/.test(fonte[j - 1]) || /\d/.test(fonte[j + 1] ?? "")) continue;
      return j;
    }
  }
  return -1;
}

/** HTML gerado pelo KaTeX. Comandos inseguros (\href, \includegraphics...) ficam desativados. */
export function renderizarFormula(fonte: string, bloco: boolean): string {
  return katex.renderToString(fonte, {
    displayMode: bloco,
    throwOnError: false,
    trust: false,
    strict: false,
    maxExpand: 1000,
    output: "htmlAndMathml",
    errorColor: "#ff8397",
  });
}

const ENTIDADES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", nbsp: " ", "#160": " " };

const decodificar = (s: string) => s.replace(/&(amp|lt|gt|quot|#39|nbsp|#160);/g, (_, e: string) => ENTIDADES[e]);

const escapar = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Renderiza as fórmulas dentro de um HTML já sanitizado (conteúdo das notícias).
 * Só o texto entre as tags é analisado, então atributos como href nunca viram fórmula.
 */
export function renderizarTexEmHtml(html: string): string {
  return html
    .split(/(<[^>]*>)/)
    .map((parte, indice) => {
      if (indice % 2 === 1 || !/[$\\]/.test(parte)) return parte;
      return separarTrechos(decodificar(parte))
        .map((t) => (t.tipo === "formula" ? renderizarFormula(t.valor, t.bloco) : escapar(t.valor)))
        .join("");
    })
    .join("");
}
