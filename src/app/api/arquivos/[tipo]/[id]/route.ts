import { eq } from "drizzle-orm";
import { abreNoNavegador, tipoDoConteudo } from "@/lib/arquivos/regras";
import { lerArquivo } from "@/lib/arquivos/armazenamento";
import { db, t } from "@/lib/db";
import { obterUsuario, podeGerir, podeVer, type TurmaDono, type Usuario } from "@/lib/sessao";

type Localizado = { caminho: string | null; nome: string; publico?: boolean; permitido: (u: Usuario) => boolean };

const nomeDoCaminho = (caminho: string | null) => caminho?.split("/").pop() ?? "arquivo";

async function turmaDaSecao(secaoId: number): Promise<TurmaDono | null> {
  const secao = await db.query.secoes.findFirst({ where: eq(t.secoes.id, secaoId), with: { turma: true } });
  return secao?.turma ?? null;
}

/** Cada tipo de arquivo busca o registro dono e define quem pode acessá-lo. */
const localizadores: Record<string, (id: number) => Promise<Localizado | null>> = {
  material: async (id) => {
    const r = await db.query.publicacoes.findFirst({ where: eq(t.publicacoes.id, id) });
    const turma = r && (await turmaDaSecao(r.secaoId));
    if (!r || !turma || r.tipo !== "Arquivo") return null;
    return { caminho: r.url, nome: r.nomeArquivo ?? nomeDoCaminho(r.url), permitido: (u) => podeVer(u, turma) };
  },
  atividade: async (id) => {
    const r = await db.query.atividades.findFirst({ where: eq(t.atividades.id, id) });
    const turma = r && (await turmaDaSecao(r.secaoId));
    if (!r || !turma) return null;
    return { caminho: r.arquivo, nome: r.nomeArquivo ?? nomeDoCaminho(r.arquivo), permitido: (u) => podeVer(u, turma) };
  },
  entrega: async (id) => {
    const r = await db.query.entregas.findFirst({ where: eq(t.entregas.id, id), with: { atividade: true } });
    const turma = r && (await turmaDaSecao(r.atividade.secaoId));
    if (!r || !turma) return null;
    return {
      caminho: r.arquivo,
      nome: r.nomeArquivo ?? nomeDoCaminho(r.arquivo),
      permitido: (u) => podeGerir(u, turma) || r.alunoId === u.id,
    };
  },
  "questao-atividade": async (id) => {
    const r = await db.query.questoesAtividade.findFirst({ where: eq(t.questoesAtividade.id, id), with: { atividade: true } });
    const turma = r && (await turmaDaSecao(r.atividade.secaoId));
    if (!r || !turma) return null;
    return { caminho: r.imagem, nome: nomeDoCaminho(r.imagem), permitido: (u) => podeVer(u, turma) };
  },
  "quiz-enunciado": async (id) => {
    const r = await db.query.questoes.findFirst({ where: eq(t.questoes.id, id), with: { quiz: { with: { turma: true } } } });
    if (!r) return null;
    return { caminho: r.imagem, nome: nomeDoCaminho(r.imagem), permitido: (u) => podeVer(u, r.quiz.turma) };
  },
  "quiz-explicacao": async (id) => {
    const r = await db.query.questoes.findFirst({ where: eq(t.questoes.id, id), with: { quiz: { with: { turma: true } } } });
    if (!r || r.tipoExplicacao !== "Imagem") return null;
    return { caminho: r.explicacaoMidia, nome: nomeDoCaminho(r.explicacaoMidia), permitido: (u) => podeVer(u, r.quiz.turma) };
  },
  "noticia-capa": async (id) => {
    const r = await db.query.noticias.findFirst({ where: eq(t.noticias.id, id) });
    if (!r) return null;
    return { caminho: r.imagemCapa, nome: nomeDoCaminho(r.imagemCapa), publico: r.publicada, permitido: (u) => u.tipo === "Admin" };
  },
  "noticia-card": async (id) => {
    const r = await db.query.noticias.findFirst({ where: eq(t.noticias.id, id) });
    if (!r) return null;
    return { caminho: r.imagemCard, nome: nomeDoCaminho(r.imagemCard), publico: r.publicada, permitido: (u) => u.tipo === "Admin" };
  },
};

export async function GET(request: Request, ctx: { params: Promise<{ tipo: string; id: string }> }) {
  const { tipo, id } = await ctx.params;
  const localizar = Object.hasOwn(localizadores, tipo) ? localizadores[tipo] : null;
  const numero = Number(id);
  if (!localizar || !Number.isInteger(numero)) return new Response("Não encontrado.", { status: 404 });

  const alvo = await localizar(numero);
  if (!alvo?.caminho) return new Response("Não encontrado.", { status: 404 });

  if (!alvo.publico) {
    const usuario = await obterUsuario();
    if (!usuario) return new Response("Entre na sua conta para acessar este arquivo.", { status: 401 });
    if (!alvo.permitido(usuario)) return new Response("Você não tem acesso a este arquivo.", { status: 403 });
  }

  const leitura = await lerArquivo(alvo.caminho, request.headers.get("if-none-match") ?? undefined);
  if (!leitura) return new Response("Arquivo não encontrado.", { status: 404 });

  const cacheControl = alvo.publico ? "public, max-age=3600" : "private, no-cache";
  if ("naoModificado" in leitura) {
    return new Response(null, { status: 304, headers: { ETag: leitura.etag, "Cache-Control": cacheControl } });
  }

  // O tipo vem da extensão validada, nunca do que foi declarado no envio.
  const disposicao = abreNoNavegador(alvo.nome) ? "inline" : "attachment";
  const headers = new Headers({
    "Content-Type": tipoDoConteudo(alvo.nome),
    "Content-Disposition": `${disposicao}; filename*=UTF-8''${encodeURIComponent(alvo.nome)}`,
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": cacheControl,
  });
  if (leitura.etag) headers.set("ETag", leitura.etag);

  return new Response(leitura.corpo as BodyInit, { headers });
}
