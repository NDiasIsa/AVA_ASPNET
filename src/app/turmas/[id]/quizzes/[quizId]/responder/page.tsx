import { and, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Cabecalho } from "@/components/cabecalho";
import { ResponderQuiz } from "@/components/responder";
import { Tex } from "@/components/tex";
import { db, t } from "@/lib/db";
import { exigirUsuario } from "@/lib/sessao";

export const metadata: Metadata = { title: "Fazer quiz" };

export default async function Responder({ params }: { params: Promise<{ id: string; quizId: string }> }) {
  const { id, quizId } = await params;
  const turmaId = Number(id);
  const usuario = await exigirUsuario("Aluno");
  if (usuario.turmaId !== turmaId) redirect("/acesso-negado");

  const quiz = await db.query.quizzes.findFirst({
    where: and(eq(t.quizzes.id, Number(quizId)), eq(t.quizzes.ativo, true), eq(t.quizzes.turmaId, turmaId)),
    with: { questoes: { with: { alternativas: true }, orderBy: t.questoes.ordem } },
  });
  if (!quiz) notFound();

  return (
    <div className="pagina pagina-estreita pilha">
      <Cabecalho titulo={quiz.titulo} voltar={{ href: `/turmas/${turmaId}#quiz`, rotulo: "Voltar à turma" }} />
      {quiz.descricao && <Tex texto={quiz.descricao} />}
      {/* Só id e texto das alternativas chegam ao navegador; o gabarito fica no servidor. */}
      <ResponderQuiz
        quizId={quiz.id}
        turmaId={turmaId}
        questoes={quiz.questoes.map((q) => ({
          id: q.id,
          enunciado: q.enunciado,
          imagem: q.imagem ? `/api/arquivos/quiz-enunciado/${q.id}` : null,
          alternativas: q.alternativas.map((a) => ({ id: a.id, texto: a.texto })),
        }))}
      />
    </div>
  );
}
