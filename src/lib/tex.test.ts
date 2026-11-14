import { describe, expect, it } from "vitest";
import { renderizarFormula, renderizarTexEmHtml, separarTrechos } from "./tex";

const formulas = (s: string) => separarTrechos(s).filter((t) => t.tipo === "formula").map((t) => t.valor);

describe("separarTrechos", () => {
  it("reconhece os quatro delimitadores", () => {
    expect(separarTrechos("a $x^2$ b")).toEqual([
      { tipo: "texto", valor: "a " },
      { tipo: "formula", valor: "x^2", bloco: false },
      { tipo: "texto", valor: " b" },
    ]);
    expect(separarTrechos("$$E=mc^2$$")[0]).toMatchObject({ valor: "E=mc^2", bloco: true });
    expect(separarTrechos("\\(a\\)")[0]).toMatchObject({ valor: "a", bloco: false });
    expect(separarTrechos("\\[b\\]")[0]).toMatchObject({ valor: "b", bloco: true });
  });

  it("não confunde preços com fórmulas", () => {
    expect(formulas("custa R$ 10 ou R$ 20")).toEqual([]);
    expect(formulas("custa R$10 ou R$20")).toEqual([]);
    expect(formulas("só um $ aqui")).toEqual([]);
  });

  it("aceita cifrão escapado", () => {
    expect(separarTrechos("R\\$ 10 e $x$")[0]).toEqual({ tipo: "texto", valor: "R$ 10 e " });
  });

  it("mantém um delimitador sem fechamento como texto", () => {
    expect(formulas("$$ aberto")).toEqual([]);
    expect(formulas("\\( aberto")).toEqual([]);
  });

  it("não atravessa parágrafos com $", () => {
    expect(formulas("$a\n\nb$")).toEqual([]);
  });
});

describe("renderizarFormula", () => {
  it("gera HTML do KaTeX e não lança em LaTeX inválido", () => {
    expect(renderizarFormula("\\frac{1}{2}", false)).toContain("katex");
    expect(renderizarFormula("\\comandoinexistente{", false)).toContain("katex");
  });

  it("bloqueia comandos que geram links", () => {
    expect(renderizarFormula("\\href{javascript:alert(1)}{x}", false)).not.toContain("javascript:alert(1)\"");
  });
});

describe("renderizarTexEmHtml", () => {
  it("processa o texto e preserva as tags", () => {
    const html = renderizarTexEmHtml("<p>Energia: $E=mc^2$ &amp; mais</p>");
    expect(html.startsWith("<p>Energia: ")).toBe(true);
    expect(html).toContain("katex");
    expect(html).toContain("&amp; mais</p>");
  });

  it("não interpreta atributos", () => {
    const html = '<a href="https://x.dev/$a$">link</a>';
    expect(renderizarTexEmHtml(html)).toBe(html);
  });

  it("não reintroduz HTML escapado", () => {
    expect(renderizarTexEmHtml("<p>&lt;script&gt; $x$</p>")).toContain("&lt;script&gt; ");
  });
});
