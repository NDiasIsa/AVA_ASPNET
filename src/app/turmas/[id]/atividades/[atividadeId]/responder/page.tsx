import { and, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Cabecalho } from "@/components/cabecalho";
import { ResponderAtividade } from "@/components/responder";
import { Tex } from "@/components/tex";
import { db, t } from "@/lib/db";
import { dataHora, numero } from "@/lib/formatos";
import { exigirUsuario } from "@/lib/sessao";

export const metadata: Metadata = { title: "Responder atividade" };

export default async function Responder({ params }: { params: Promise<{ id: string; atividadeId: string }> }) {
  const { id, atividadeId } = await params;
  const turmaId = Number(id);
  const usuario = await exigirUsuario("Aluno");
  if (usuario.turmaId !== turmaId) redirect("/acesso-negado");

  const atividade = await db.query.atividades.findFirst({
    where: and(eq(t.atividades.id, Number(atividadeId)), eq(t.atividades.tipo, "Avaliativa")),
    with: { secao: true, questoes: { with: { alternativas: true }, orderBy: t.questoesAtividade.ordem } },
  });
  if (!atividade || atividade.secao.turmaId !== turmaId) notFound();

  const respondida = await db.query.respostasAtividade.findFirst({
    where: and(eq(t.respostasAtividade.atividadeId, atividade.id), eq(t.respostasAtividade.alunoId, usuario.id)),
  });
  if (respondida) redirect(`/turmas/${turmaId}#conteudo`);

  return (
    <div className="pagina pagina-estreita pilha">
      <Cabecalho
        titulo={atividade.titulo}
        voltar={{ href: `/turmas/${turmaId}#conteudo`, rotulo: "Voltar à turma" }}
        sub={`Vale ${numero(atividade.valorMaximo)} pts${atividade.prazo ? `, prazo ${dataHora(atividade.prazo)}` : ""}`}
      />
      {atividade.descricao && <Tex texto={atividade.descricao} />}
      {/* Só id e texto das alternativas chegam ao navegador; o gabarito fica no servidor. */}
      <ResponderAtividade
        atividadeId={atividade.id}
        turmaId={turmaId}
        questoes={atividade.questoes.map((q) => ({
          id: q.id,
          enunciado: q.enunciado,
          imagem: q.imagem ? `/api/arquivos/questao-atividade/${q.id}` : null,
          alternativas: q.alternativas.map((a) => ({ id: a.id, texto: a.texto })),
        }))}
      />
    </div>
  );
}
