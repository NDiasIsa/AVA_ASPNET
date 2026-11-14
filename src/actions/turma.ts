"use server";

import { and, eq, max, ne } from "drizzle-orm";
import { redirect } from "next/navigation";
import { irPara } from "./navegar";
import { db, t } from "@/lib/db";
import { ErroArquivo, receberArquivo, removerArquivo } from "@/lib/arquivos/armazenamento";
import { flash } from "@/lib/flash";
import { lerDataLocal, urlSegura } from "@/lib/formatos";
import { exigirGestao, exigirUsuario } from "@/lib/sessao";
import { processarQuestoes } from "./questoes";
import { type EstadoForm, inteiro, texto, textoOuNulo, umaCasa } from "./util";

const paginaTurma = (turmaId: number, aba = "mural") => `/turmas/${turmaId}#${aba}`;

/** Localiza a seção e confere se o usuário gere a turma dela. */
async function gestaoDaSecao(secaoId: number) {
  const secao = await db.query.secoes.findFirst({ where: eq(t.secoes.id, secaoId) });
  if (!secao) redirect("/acesso-negado");
  const { usuario, turma } = await exigirGestao(secao.turmaId);
  return { usuario, turma, secao };
}

// ── Avisos ───────────────────────────────────────────────────

export async function postarAviso(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const turmaId = inteiro(fd, "turmaId");
  const { usuario } = await exigirGestao(turmaId);
  const conteudo = texto(fd, "texto");
  if (!conteudo) return { erro: "Escreva o aviso antes de postar." };

  await db.insert(t.avisos).values({ texto: conteudo, turmaId, autorId: usuario.id });
  irPara(paginaTurma(turmaId));
}

export async function excluirAviso(fd: FormData) {
  const aviso = await db.query.avisos.findFirst({ where: eq(t.avisos.id, inteiro(fd, "id")) });
  if (!aviso) redirect("/turmas");
  await exigirGestao(aviso.turmaId);
  await db.delete(t.avisos).where(eq(t.avisos.id, aviso.id));
  irPara(paginaTurma(aviso.turmaId));
}

// ── Seções ───────────────────────────────────────────────────

export async function criarSecao(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const turmaId = inteiro(fd, "turmaId");
  await exigirGestao(turmaId);
  const nome = texto(fd, "nome");
  if (!nome || nome.length > 100) return { erro: "O nome da seção precisa ter de 1 a 100 caracteres." };

  const [{ ultima }] = await db.select({ ultima: max(t.secoes.ordem) }).from(t.secoes).where(eq(t.secoes.turmaId, turmaId));
  await db.insert(t.secoes).values({
    nome,
    turmaId,
    ordem: (ultima ?? -1) + 1,
    tipo: fd.get("tipo") === "SoAtividade" ? "SoAtividade" : "Completa",
  });

  await flash("sucesso", `Seção "${nome}" criada.`);
  irPara(paginaTurma(turmaId, "conteudo"));
}

export async function excluirSecao(fd: FormData) {
  const { secao } = await gestaoDaSecao(inteiro(fd, "id"));
  await db.delete(t.secoes).where(eq(t.secoes.id, secao.id));
  await flash("sucesso", "Seção excluída.");
  irPara(paginaTurma(secao.turmaId, "conteudo"));
}

// ── Publicações ──────────────────────────────────────────────

export async function salvarPublicacao(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const id = inteiro(fd, "id") || null;
  const { usuario, secao } = await gestaoDaSecao(inteiro(fd, "secaoId"));

  const titulo = texto(fd, "titulo");
  const descricao = textoOuNulo(fd, "descricao");
  const tipo = fd.get("tipo") === "Link" ? "Link" : "Arquivo";
  if (!titulo || titulo.length > 200) return { erro: "Informe um título com até 200 caracteres." };

  let url: string | null = null;
  let nomeArquivo: string | null = null;

  if (tipo === "Link") {
    url = urlSegura(texto(fd, "link"));
    if (!url) return { erro: "Informe um link completo, começando com https://." };
  } else {
    try {
      const arquivo = await receberArquivo(fd, "arquivo", "materiais", usuario);
      if (arquivo) {
        url = arquivo.caminho;
        nomeArquivo = arquivo.nome;
      }
    } catch (erro) {
      if (erro instanceof ErroArquivo) return { erro: erro.message };
      throw erro;
    }
  }

  if (id) {
    const anterior = await db.query.publicacoes.findFirst({ where: eq(t.publicacoes.id, id) });
    if (!anterior || anterior.secaoId !== secao.id) redirect("/acesso-negado");

    // Sem novo arquivo, um material que já era arquivo mantém o anexo atual.
    const manterAnexo = tipo === "Arquivo" && !url && anterior.tipo === "Arquivo";
    await db
      .update(t.publicacoes)
      .set({ titulo, descricao, tipo, ...(manterAnexo ? {} : { url, nomeArquivo }) })
      .where(eq(t.publicacoes.id, id));

    if (!manterAnexo && anterior.tipo === "Arquivo") await removerSeSemUso(anterior.url, id);
    await flash("sucesso", "Material atualizado.");
  } else {
    if (tipo === "Arquivo" && !url) return { erro: "Escolha o arquivo do material." };
    await db.insert(t.publicacoes).values({ titulo, descricao, tipo, url, nomeArquivo, secaoId: secao.id, autorId: usuario.id });
    await flash("sucesso", "Material publicado.");
  }
  irPara(paginaTurma(secao.turmaId, "conteudo"));
}

/** Cópias de um material compartilham o arquivo: só remove quando ninguém mais o usa. */
async function removerSeSemUso(caminho: string | null, exceto: number) {
  if (!caminho) return;
  const outro = await db.query.publicacoes.findFirst({
    where: and(eq(t.publicacoes.url, caminho), ne(t.publicacoes.id, exceto)),
  });
  if (!outro) await removerArquivo(caminho);
}

export async function excluirPublicacao(fd: FormData) {
  const id = inteiro(fd, "id");
  const pub = await db.query.publicacoes.findFirst({ where: eq(t.publicacoes.id, id) });
  if (!pub) redirect("/turmas");
  const { secao } = await gestaoDaSecao(pub.secaoId);

  await db.delete(t.publicacoes).where(eq(t.publicacoes.id, id));
  if (pub.tipo === "Arquivo") await removerSeSemUso(pub.url, id);

  await flash("sucesso", "Material excluído.");
  irPara(paginaTurma(secao.turmaId, "conteudo"));
}

export async function copiarPublicacao(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const pub = await db.query.publicacoes.findFirst({ where: eq(t.publicacoes.id, inteiro(fd, "id")) });
  if (!pub) return { erro: "Este material não existe mais." };
  const origem = await gestaoDaSecao(pub.secaoId);
  const destino = await gestaoDaSecao(inteiro(fd, "secaoDestinoId"));

  await db.insert(t.publicacoes).values({
    titulo: pub.titulo,
    descricao: pub.descricao,
    tipo: pub.tipo,
    url: pub.url,
    nomeArquivo: pub.nomeArquivo,
    secaoId: destino.secao.id,
    autorId: pub.autorId,
  });
  await flash("sucesso", "Material copiado.");
  irPara(paginaTurma(origem.secao.turmaId, "conteudo"));
}

// ── Atividades ───────────────────────────────────────────────

export async function criarAtividade(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const { usuario, secao } = await gestaoDaSecao(inteiro(fd, "secaoId"));

  const titulo = texto(fd, "titulo");
  const descricao = textoOuNulo(fd, "descricao");
  const tipo = fd.get("tipo") === "Avaliativa" ? "Avaliativa" : "Entrega";
  const valorMaximo = Number(fd.get("valorMaximo"));

  if (!titulo || titulo.length > 200) return { erro: "Informe um título com até 200 caracteres." };
  if (!Number.isFinite(valorMaximo) || valorMaximo < 0 || valorMaximo > 10) return { erro: "O valor máximo precisa estar entre 0 e 10." };

  let arquivo, questoes;
  try {
    arquivo = tipo === "Entrega" ? await receberArquivo(fd, "arquivo", "atividades", usuario) : null;
    questoes = tipo === "Avaliativa" ? await processarQuestoes(String(fd.get("questoes") ?? ""), "atividades", usuario) : [];
  } catch (erro) {
    if (erro instanceof ErroArquivo) return { erro: erro.message };
    throw erro;
  }

  await db.transaction(async (tx) => {
    const [atividade] = await tx
      .insert(t.atividades)
      .values({
        titulo,
        descricao,
        tipo,
        valorMaximo,
        prazo: lerDataLocal(texto(fd, "prazo")),
        arquivo: arquivo?.caminho,
        nomeArquivo: arquivo?.nome,
        secaoId: secao.id,
        autorId: usuario.id,
      })
      .returning();

    for (const q of questoes) {
      const [questao] = await tx
        .insert(t.questoesAtividade)
        .values({ enunciado: q.enunciado, imagem: q.imagem, ordem: q.ordem, atividadeId: atividade.id })
        .returning();
      await tx.insert(t.alternativasAtividade).values(q.alternativas.map((a) => ({ ...a, questaoId: questao.id })));
    }
  });

  await flash("sucesso", "Atividade publicada.");
  irPara(paginaTurma(secao.turmaId, "conteudo"));
}

export async function copiarAtividade(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const atividade = await db.query.atividades.findFirst({
    where: eq(t.atividades.id, inteiro(fd, "id")),
    with: { questoes: { with: { alternativas: true } } },
  });
  if (!atividade) return { erro: "Esta atividade não existe mais." };
  const origem = await gestaoDaSecao(atividade.secaoId);
  const destino = await gestaoDaSecao(inteiro(fd, "secaoDestinoId"));

  await db.transaction(async (tx) => {
    const [copia] = await tx
      .insert(t.atividades)
      .values({
        titulo: atividade.titulo,
        descricao: atividade.descricao,
        arquivo: atividade.arquivo,
        nomeArquivo: atividade.nomeArquivo,
        prazo: atividade.prazo,
        valorMaximo: atividade.valorMaximo,
        tipo: atividade.tipo,
        secaoId: destino.secao.id,
        autorId: atividade.autorId,
      })
      .returning();

    for (const q of atividade.questoes) {
      const [questao] = await tx
        .insert(t.questoesAtividade)
        .values({ enunciado: q.enunciado, imagem: q.imagem, ordem: q.ordem, atividadeId: copia.id })
        .returning();
      if (q.alternativas.length > 0) {
        await tx
          .insert(t.alternativasAtividade)
          .values(q.alternativas.map((a) => ({ texto: a.texto, correta: a.correta, questaoId: questao.id })));
      }
    }
  });

  await flash("sucesso", "Atividade copiada.");
  irPara(paginaTurma(origem.secao.turmaId, "conteudo"));
}

// ── Entregas ─────────────────────────────────────────────────

/** Atividade da turma do aluno logado; outras turmas são recusadas. */
async function atividadeDoAluno(atividadeId: number) {
  const usuario = await exigirUsuario("Aluno");
  const atividade = await db.query.atividades.findFirst({
    where: eq(t.atividades.id, atividadeId),
    with: { secao: true, questoes: { with: { alternativas: true } } },
  });
  if (!atividade || atividade.secao.turmaId !== usuario.turmaId) redirect("/acesso-negado");
  return { usuario, atividade };
}

export async function entregarAtividade(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const { usuario, atividade } = await atividadeDoAluno(inteiro(fd, "atividadeId"));
  const turmaId = atividade.secao.turmaId;

  if (atividade.tipo !== "Entrega") return { erro: "Esta atividade é respondida com alternativas." };

  const existente = await db.query.entregas.findFirst({
    where: and(eq(t.entregas.atividadeId, atividade.id), eq(t.entregas.alunoId, usuario.id)),
  });
  if (existente?.corrigida) return { erro: "Esta atividade já foi corrigida e não pode ser reenviada." };

  let arquivo;
  try {
    arquivo = await receberArquivo(fd, "arquivo", "entregas", usuario);
  } catch (erro) {
    if (erro instanceof ErroArquivo) return { erro: erro.message };
    throw erro;
  }

  const textoResposta = textoOuNulo(fd, "textoResposta");
  if (!arquivo && !textoResposta && !existente) return { erro: "Envie um arquivo ou escreva sua resposta." };

  if (existente) {
    await db
      .update(t.entregas)
      .set({
        ...(arquivo ? { arquivo: arquivo.caminho, nomeArquivo: arquivo.nome } : {}),
        ...(textoResposta ? { textoResposta } : {}),
        dataEntrega: new Date(),
      })
      .where(eq(t.entregas.id, existente.id));
    if (arquivo) await removerArquivo(existente.arquivo);
  } else {
    await db.insert(t.entregas).values({
      atividadeId: atividade.id,
      alunoId: usuario.id,
      arquivo: arquivo?.caminho,
      nomeArquivo: arquivo?.nome,
      textoResposta,
    });
  }

  await flash("sucesso", "Atividade entregue.");
  irPara(paginaTurma(turmaId, "conteudo"));
}

export type QuestaoCorrigida = {
  id: number;
  enunciado: string;
  escolhida: string;
  correta: string;
  acertou: boolean;
};

export type EstadoAvaliativa =
  | { erro: string; resultado?: undefined }
  | { erro?: undefined; resultado: { total: number; acertos: number; nota: number; valorMaximo: number; questoes: QuestaoCorrigida[] } }
  | undefined;

export async function responderAtividade(_: EstadoAvaliativa, fd: FormData): Promise<EstadoAvaliativa> {
  const { usuario, atividade } = await atividadeDoAluno(inteiro(fd, "atividadeId"));
  if (atividade.tipo !== "Avaliativa") return { erro: "Esta atividade não tem alternativas." };

  const questoes = [...atividade.questoes].sort((a, b) => a.ordem - b.ordem);
  const corrigidas: QuestaoCorrigida[] = questoes.map((q) => {
    const escolhidaId = Number(fd.get(`q${q.id}`));
    const escolhida = q.alternativas.find((a) => a.id === escolhidaId);
    return {
      id: q.id,
      enunciado: q.enunciado,
      escolhida: escolhida?.texto ?? "Não respondida",
      correta: q.alternativas.find((a) => a.correta)?.texto ?? "",
      acertou: escolhida?.correta === true,
    };
  });

  const acertos = corrigidas.filter((q) => q.acertou).length;
  const nota = questoes.length > 0 ? umaCasa((acertos / questoes.length) * atividade.valorMaximo) : 0;

  const inseridas = await db
    .insert(t.respostasAtividade)
    .values({ atividadeId: atividade.id, alunoId: usuario.id, totalQuestoes: questoes.length, totalAcertos: acertos, nota })
    .onConflictDoNothing()
    .returning();
  if (inseridas.length === 0) return { erro: "Você já respondeu esta atividade." };

  return {
    resultado: { total: questoes.length, acertos, nota, valorMaximo: atividade.valorMaximo, questoes: corrigidas },
  };
}

export async function corrigirEntrega(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const entrega = await db.query.entregas.findFirst({
    where: eq(t.entregas.id, inteiro(fd, "id")),
    with: { atividade: true },
  });
  if (!entrega) return { erro: "Esta entrega não existe mais." };
  const { secao } = await gestaoDaSecao(entrega.atividade.secaoId);

  const nota = Number(fd.get("nota"));
  if (fd.get("nota") === "" || !Number.isFinite(nota) || nota < 0 || nota > entrega.atividade.valorMaximo) {
    return { erro: `A nota precisa estar entre 0 e ${entrega.atividade.valorMaximo}.` };
  }

  await db
    .update(t.entregas)
    .set({ nota: umaCasa(nota), feedback: textoOuNulo(fd, "feedback"), corrigida: true })
    .where(eq(t.entregas.id, entrega.id));

  await flash("sucesso", "Correção salva.");
  redirect(`/turmas/${secao.turmaId}/atividades/${entrega.atividadeId}`);
}
