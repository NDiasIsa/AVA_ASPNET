/** O Brasil não tem horário de verão desde 2019, então o fuso de Pinheiral é sempre -03:00. */
const FUSO = "America/Sao_Paulo";
const DESLOCAMENTO = "-03:00";

const fmtDataHora = new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, dateStyle: "short", timeStyle: "short" });
const fmtData = new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, day: "2-digit", month: "2-digit", year: "numeric" });

export const dataHora = (d: Date) => fmtDataHora.format(d).replace(",", "");
export const dataCurta = (d: Date) => fmtData.format(d);

/** Valor de <input type="datetime-local"> no horário de Brasília → Date. */
export function lerDataLocal(valor: string | null | undefined): Date | null {
  if (!valor) return null;
  const d = new Date(`${valor}${valor.length === 16 ? ":00" : ""}${DESLOCAMENTO}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Date → valor de <input type="datetime-local"> no horário de Brasília. */
export function paraDataLocal(d: Date): string {
  const local = new Date(d.getTime() - 3 * 60 * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export const nomeTurma = (t: { ano: number; codigo: string; anoLetivo: number }) =>
  `${t.ano}º EM, Turma ${t.codigo} (${t.anoLetivo})`;

export const numero = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 2 });

/** Só http(s): impede links como javascript:alert(1) em publicações. */
export function urlSegura(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url.trim());
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

/** Converte um link do YouTube no endereço incorporável, ou null se não for do YouTube. */
export function embedYoutube(url: string | null | undefined): string | null {
  const segura = urlSegura(url);
  if (!segura) return null;
  const u = new URL(segura);
  const host = u.hostname.replace(/^www\.|^m\./, "");
  let id: string | null = null;
  if (host === "youtu.be") id = u.pathname.slice(1);
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    id = u.pathname.startsWith("/embed/") ? u.pathname.slice(7) : u.searchParams.get("v");
  }
  return id && /^[\w-]+$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}
