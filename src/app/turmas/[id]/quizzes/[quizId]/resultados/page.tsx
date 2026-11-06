import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Cabecalho, Vazio } from "@/components/cabecalho";
import { db, t } from "@/lib/db";
import { dataHora, numero } from "@/lib/formatos";
import { exigirGestao } from "@/lib/sessao";

export const metadata: Metadata = { title: "Resultados do quiz" };

export default async function Resultados({ params }: { params: Promise<{ id: string; quizId: string }> }) {
  const { id, quizId } = await params;
  const turmaId = Number(id);
  await exigirGestao(turmaId);

  const quiz = await db.query.quizzes.findFirst({
    where: eq(t.quizzes.id, Number(quizId)),
    with: {
      questoes: { columns: { id: true } },
      resultados: { with: { aluno: { columns: { nomeCompleto: true } } } },
    },
  });
  if (!quiz || quiz.turmaId !== turmaId) notFound();

  const porAluno = new Map<number, { nome: string; tentativas: number; melhor: number; ultima: Date }>();
  for (const r of quiz.resultados) {
    const atual = porAluno.get(r.alunoId);
    porAluno.set(r.alunoId, {
      nome: r.aluno.nomeCompleto,
      tentativas: (atual?.tentativas ?? 0) + 1,
      melhor: Math.max(atual?.melhor ?? 0, r.pontuacao),
      ultima: atual && atual.ultima > r.dataRealizacao ? atual.ultima : r.dataRealizacao,
    });
  }
  const classificacao = [...porAluno.values()].sort((a, b) => b.melhor - a.melhor);

  return (
    <div className="pagina">
      <Cabecalho
        titulo={quiz.titulo}
        sub={`${quiz.questoes.length} questão(ões)`}
        voltar={{ href: `/turmas/${turmaId}#quiz`, rotulo: "Voltar à turma" }}
      />
      {classificacao.length === 0 ? (
        <Vazio>Nenhum aluno fez este quiz ainda.</Vazio>
      ) : (
        <div className="tabela-rolagem">
          <table>
            <thead>
              <tr>
                <th>Posição</th>
                <th>Aluno</th>
                <th>Tentativas</th>
                <th>Melhor nota</th>
                <th>Última tentativa</th>
              </tr>
            </thead>
            <tbody>
              {classificacao.map((a, i) => (
                <tr key={a.nome + i}>
                  <td>{i + 1}</td>
                  <td>{a.nome}</td>
                  <td>{a.tentativas}</td>
                  <td style={{ color: a.melhor >= 60 ? "var(--certo)" : "var(--erro)", fontWeight: 700 }}>{numero(a.melhor)}%</td>
                  <td className="linha-meta">{dataHora(a.ultima)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
