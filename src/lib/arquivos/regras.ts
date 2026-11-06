/** Regras de arquivo sem dependência de servidor, usadas também nos testes e no navegador. */

export const TAMANHO_MAXIMO = 50 * 1024 * 1024;

export type Pasta = "materiais" | "atividades" | "entregas" | "quiz" | "noticias";

const ASSINATURAS: Record<string, number[][]> = {
  ".pdf": [[0x25, 0x50, 0x44, 0x46]],
  ".png": [[0x89, 0x50, 0x4e, 0x47]],
  ".jpg": [[0xff, 0xd8, 0xff]],
  ".jpeg": [[0xff, 0xd8, 0xff]],
  ".gif": [[0x47, 0x49, 0x46, 0x38]],
  ".webp": [[0x52, 0x49, 0x46, 0x46]],
  ".docx": [[0x50, 0x4b, 0x03, 0x04]],
  ".xlsx": [[0x50, 0x4b, 0x03, 0x04]],
  ".pptx": [[0x50, 0x4b, 0x03, 0x04]],
  ".zip": [[0x50, 0x4b, 0x03, 0x04]],
  ".mp4": [[0x00, 0x00, 0x00]],
};

const IMAGENS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp"]);

const TIPOS: Record<string, string> = {
  ".pdf": "application/pdf",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".zip": "application/zip",
};

/** Só estes tipos abrem no navegador; o restante (HTML, SVG...) sempre é baixado. */
const ABRE_NO_NAVEGADOR = new Set([".pdf", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".mp4"]);

export function extensao(nome: string): string {
  const i = nome.lastIndexOf(".");
  return i === -1 ? "" : nome.slice(i).toLowerCase();
}

/** Confere se o início do arquivo corresponde à extensão. Extensões desconhecidas são aceitas. */
export function assinaturaValida(nome: string, inicio: Uint8Array, somenteImagem = false): boolean {
  const ext = extensao(nome);
  if (somenteImagem && !IMAGENS.has(ext)) return false;
  const assinaturas = ASSINATURAS[ext];
  if (!assinaturas) return true;
  return assinaturas.some((a) => a.every((byte, i) => inicio[i] === byte));
}

export const tipoDoConteudo = (nome: string) => TIPOS[extensao(nome)] ?? "application/octet-stream";

export const abreNoNavegador = (nome: string) => ABRE_NO_NAVEGADOR.has(extensao(nome));

/** Nome seguro para o caminho no armazenamento. */
export function nomeSeguro(nome: string): string {
  const limpo = nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/^[._]+/, "");
  return limpo.slice(-100) || "arquivo";
}

/** Pastas em que cada perfil pode enviar arquivos. */
export function pastasPermitidas(tipo: "Aluno" | "Professor" | "Admin"): Pasta[] {
  if (tipo === "Aluno") return ["entregas"];
  if (tipo === "Professor") return ["materiais", "atividades", "quiz"];
  return ["materiais", "atividades", "quiz", "noticias"];
}

/**
 * Confere se o caminho é um upload do próprio usuário nessa pasta. Sem isso, um aluno
 * poderia anexar o caminho do arquivo de outra pessoa à sua entrega e ganhar acesso a ele.
 */
export function caminhoPertenceAo(caminho: string, pasta: Pasta, usuarioId: number): boolean {
  return (
    caminho.startsWith(`${pasta}/${usuarioId}/`) &&
    !caminho.includes("..") &&
    caminho.split("/").length === 3
  );
}
