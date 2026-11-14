import { describe, expect, it } from "vitest";
import { dataHora, embedYoutube, lerDataLocal, paraDataLocal, urlSegura } from "./formatos";

describe("datas no horário de Brasília", () => {
  it("interpreta o prazo digitado como horário local, não UTC", () => {
    expect(lerDataLocal("2026-11-12T20:53")?.toISOString()).toBe("2026-11-12T23:53:00.000Z");
    expect(lerDataLocal("")).toBeNull();
    expect(lerDataLocal("isso não é data")).toBeNull();
  });

  it("converte nos dois sentidos", () => {
    const d = new Date("2026-11-12T23:53:00.000Z");
    expect(paraDataLocal(d)).toBe("2026-11-12T20:53");
    expect(dataHora(d)).toBe("12/11/2026 20:53");
  });
});

describe("links", () => {
  it("só aceita http e https", () => {
    expect(urlSegura("https://ifrj.edu.br/")).toBe("https://ifrj.edu.br/");
    expect(urlSegura("javascript:alert(1)")).toBeNull();
    expect(urlSegura("data:text/html,x")).toBeNull();
    expect(urlSegura("sem protocolo")).toBeNull();
  });

  it("converte links do YouTube e recusa outros domínios", () => {
    const embed = "https://www.youtube-nocookie.com/embed/abc_123";
    expect(embedYoutube("https://youtube.com/watch?v=abc_123")).toBe(embed);
    expect(embedYoutube("https://www.youtube.com/watch?v=abc_123&t=9")).toBe(embed);
    expect(embedYoutube("https://youtu.be/abc_123")).toBe(embed);
    expect(embedYoutube("https://evil.com/watch?v=abc_123")).toBeNull();
  });
});
