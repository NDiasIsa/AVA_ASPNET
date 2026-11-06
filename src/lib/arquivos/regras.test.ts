import { describe, expect, it } from "vitest";
import { abreNoNavegador, assinaturaValida, caminhoPertenceAo, nomeSeguro, pastasPermitidas } from "./regras";

const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);

describe("assinaturaValida", () => {
  it("compara o conteúdo com a extensão", () => {
    expect(assinaturaValida("a.pdf", PDF)).toBe(true);
    expect(assinaturaValida("a.PDF", PDF)).toBe(true);
    expect(assinaturaValida("a.pdf", PNG)).toBe(false);
  });

  it("aceita extensões desconhecidas, como antes", () => {
    expect(assinaturaValida("a.odt", PDF)).toBe(true);
  });

  it("recusa não imagens em campos de imagem", () => {
    expect(assinaturaValida("a.png", PNG, true)).toBe(true);
    expect(assinaturaValida("a.pdf", PDF, true)).toBe(false);
    expect(assinaturaValida("a.svg", PDF, true)).toBe(false);
  });
});

describe("caminhoPertenceAo", () => {
  it("aceita apenas uploads do próprio usuário", () => {
    expect(caminhoPertenceAo("entregas/7/abc-a.pdf", "entregas", 7)).toBe(true);
    expect(caminhoPertenceAo("entregas/8/abc-a.pdf", "entregas", 7)).toBe(false);
    expect(caminhoPertenceAo("materiais/7/abc-a.pdf", "entregas", 7)).toBe(false);
    expect(caminhoPertenceAo("entregas/7/../8/a.pdf", "entregas", 7)).toBe(false);
    expect(caminhoPertenceAo("entregas/7/x/a.pdf", "entregas", 7)).toBe(false);
  });
});

describe("demais regras", () => {
  it("HTML e SVG nunca abrem no navegador", () => {
    expect(abreNoNavegador("a.html")).toBe(false);
    expect(abreNoNavegador("a.svg")).toBe(false);
    expect(abreNoNavegador("a.pdf")).toBe(true);
  });

  it("aluno só envia em entregas", () => {
    expect(pastasPermitidas("Aluno")).toEqual(["entregas"]);
    expect(pastasPermitidas("Professor")).not.toContain("noticias");
  });

  it("limpa nomes de arquivo", () => {
    expect(nomeSeguro("Física aula 2.pdf")).toBe("Fisica_aula_2.pdf");
    expect(nomeSeguro("../../etc/passwd")).toBe("etc_passwd");
  });
});
