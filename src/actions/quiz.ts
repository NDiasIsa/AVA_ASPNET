"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { irPara } from "./navegar";
import { ErroArquivo } from "@/lib/arquivos/armazenamento";
import { db, t } from "@/lib/db";
import { flash } from "@/lib/flash";
import { embedYoutube } from "@/lib/formatos";
import { exigirGestao, exigirUsuario } from "@/lib/sessao";
import { processarQuestoes } from "./questoes";
import { type EstadoForm, inteiro, marcado, texto, textoOuNulo } from "./util";

export async function criarQuiz(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const turmaId = inteiro(fd, "turmaId");
  const { usuario } = await exigirGestao(turmaId);

  const titulo = texto(fd, "titulo");
  if (!titulo || titulo.length > 200) return { erro: "Informe um título com até 200 caracteres." };

  let questoes;
  try {
    questoes = await processarQuestoes(String(fd.get("questoes") ?? ""), "quiz", usuario);
  } catch (erro) {
    if (erro instanceof ErroArquivo) return { erro: erro.message };
    throw erro;
  }

  await db.transaction(async (tx) => {
    const [quiz] = await tx
      .insert(t.quizzes)
      .values({ titulo, descricao: textoOuNulo(fd, "descricao"), ativo: marcado(fd, "ativo"), turmaId, autorId: usuario.id })
      .returning();

    for (const { alternativas, ...q } of questoes) {
      const [questao] = await tx.insert(t.questoes).values({ ...q, quizId: quiz.id }).returning();
      await tx.insert(t.alternativas).values(alternativas.map((a) => ({ ...a, questaoId: questao.id })));
    }
  });

  await flash("sucesso", "Quiz criado.");
  irPara(`/turmas/${turmaId}#quiz`);
}

export type QuestaoQuizCorrigida = {
  id: number;
  enunciado: string;
  escolhida: string;
  correta: string;
  acertou: boolean;
  tipoExplicacao: "Texto" | "Imagem" | "Video";
  explicacao: string | null;
  midia: string | null;
};

export type EstadoQuiz =
  | { erro: string; resultado?: undefined }
  | { erro?: undefined; resultado: { total: number; acertos: number; pontuacao: number; questoes: QuestaoQuizCorrigida[] } }
  | undefined;

export async function responderQuiz(_: EstadoQuiz, fd: FormData): Promise<EstadoQuiz> {
  const usuario = await exigirUsuario("Aluno");
  const quiz = await db.query.quizzes.findFirst({
    where: eq(t.quizzes.id, inteiro(fd, "quizId")),
    with: { questoes: { with: { alternativas: true } } },
  });
  if (!quiz || !quiz.ativo || quiz.turmaId !== usuario.turmaId) redirect("/acesso-negado");

  const questoes = [...quiz.questoes].sort((a, b) => a.ordem - b.ordem);
  const corrigidas: QuestaoQuizCorrigida[] = questoes.map((q) => {
    const escolhidaId = Number(fd.get(`q${q.id}`));
    const escolhida = q.alternativas.find((a) => a.id === escolhidaId);
    let midia: string | null = null;
    if (q.tipoExplicacao === "Imagem" && q.explicacaoMidia) midia = `/api/arquivos/quiz-explicacao/${q.id}`;
    if (q.tipoExplicacao === "Video") midia = embedYoutube(q.explicacaoMidia);
    return {
      id: q.id,
      enunciado: q.enunciado,
      escolhida: escolhida?.texto ?? "Não respondida",
      correta: q.alternativas.find((a) => a.correta)?.texto ?? "",
      acertou: escolhida?.correta === true,
      tipoExplicacao: q.tipoExplicacao,
      explicacao: q.explicacao,
      midia,
    };
  });

  const acertos = corrigidas.filter((q) => q.acertou).length;
  const pontuacao = questoes.length > 0 ? Math.round((acertos / questoes.length) * 10000) / 100 : 0;

  // Tentativas ilimitadas: todo envio gera um novo resultado.
  await db.insert(t.resultadosQuiz).values({
    quizId: quiz.id,
    alunoId: usuario.id,
    totalQuestoes: questoes.length,
    totalAcertos: acertos,
    pontuacao,
  });

  return { resultado: { total: questoes.length, acertos, pontuacao, questoes: corrigidas } };
}

export async function excluirQuiz(fd: FormData) {
  const quiz = await db.query.quizzes.findFirst({ where: eq(t.quizzes.id, inteiro(fd, "id")) });
  if (!quiz) redirect("/turmas");
  await exigirGestao(quiz.turmaId);
  await db.delete(t.quizzes).where(eq(t.quizzes.id, quiz.id));
  await flash("sucesso", "Quiz excluído.");
  irPara(`/turmas/${quiz.turmaId}#quiz`);
}

export async function copiarQuiz(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const quiz = await db.query.quizzes.findFirst({
    where: eq(t.quizzes.id, inteiro(fd, "id")),
    with: { questoes: { with: { alternativas: true } } },
  });
  if (!quiz) return { erro: "Este quiz não existe mais." };
  const { usuario } = await exigirGestao(quiz.turmaId);
  const destinoId = inteiro(fd, "turmaDestinoId");
  await exigirGestao(destinoId);

  await db.transaction(async (tx) => {
    const [copia] = await tx
      .insert(t.quizzes)
      .values({ titulo: quiz.titulo, descricao: quiz.descricao, ativo: quiz.ativo, turmaId: destinoId, autorId: usuario.id })
      .returning();

    for (const q of quiz.questoes) {
      const [questao] = await tx
        .insert(t.questoes)
        .values({
          enunciado: q.enunciado,
          explicacao: q.explicacao,
          tipoExplicacao: q.tipoExplicacao,
          explicacaoMidia: q.explicacaoMidia,
          imagem: q.imagem,
          ordem: q.ordem,
          quizId: copia.id,
        })
        .returning();
      if (q.alternativas.length > 0) {
        await tx.insert(t.alternativas).values(q.alternativas.map((a) => ({ texto: a.texto, correta: a.correta, questaoId: questao.id })));
      }
    }
  });

  await flash("sucesso", "Quiz copiado.");
  irPara(`/turmas/${quiz.turmaId}#quiz`);
}
