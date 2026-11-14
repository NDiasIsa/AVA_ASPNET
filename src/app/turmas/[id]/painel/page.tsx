import { and, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Cabecalho, Vazio } from "@/components/cabecalho";
import { Tex } from "@/components/tex";
import { db, t } from "@/lib/db";
import { dataHora, nomeTurma, numero } from "@/lib/formatos";
import { exigirGestao } from "@/lib/sessao";

export const metadata: Metadata = { title: "Painel da turma" };

/** Melhor pontuação de cada aluno: o quiz tem tentativas ilimitadas. */
function melhoresPorAluno(resultados: { alunoId: number; pontuacao: number }[]) {
  const melhores = new Map<number, number>();
  for (const r of resultados) melhores.set(r.alunoId, Math.max(melhores.get(r.alunoId) ?? 0, r.pontuacao));
  return [...melhores.values()];
}

export default async function Painel({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const { turma: base } = await exigirGestao(id);

  const turma = await db.query.turmas.findFirst({
    where: eq(t.turmas.id, id),
    with: {
      alunos: { columns: { id: true }, where: and(eq(t.usuarios.ativo, true)) },
      secoes: { with: { atividades: { with: { entregas: true, respostas: { columns: { id: true } } } } } },
      quizzes: { where: eq(t.quizzes.ativo, true), with: { resultados: true } },
    },
  });
  if (!turma) notFound();

  const totalAlunos = turma.alunos.length;
  const agora = new Date();

  const atividades = turma.secoes
    .flatMap((s) => s.atividades)
    .map((a) => {
      const entregaram = a.tipo === "Avaliativa" ? a.respostas.length : a.entregas.length;
      return {
        ...a,
        entregaram,
        faltam: Math.max(0, totalAlunos - entregaram),
        pendentes: a.tipo === "Avaliativa" ? 0 : a.entregas.filter((e) => !e.corrigida).length,
        atrasados: a.prazo && a.prazo < agora ? Math.max(0, totalAlunos - entregaram) : 0,
      };
    });

  const quizzes = turma.quizzes.map((q) => {
    const melhores = melhoresPorAluno(q.resultados);
    return {
      ...q,
      fizeram: melhores.length,
      faltam: Math.max(0, totalAlunos - melhores.length),
      media: melhores.length ? Math.round((melhores.reduce((a, b) => a + b, 0) / melhores.length) * 10) / 10 : null,
      melhor: melhores.length ? Math.max(...melhores) : null,
      pior: melhores.length ? Math.min(...melhores) : null,
    };
  });

  const pct = (n: number | null) => (n === null ? "Sem dados" : `${numero(n)}%`);

  return (
    <div className="pagina pilha">
      <Cabecalho
        titulo={`Painel da turma ${base.codigo}`}
        sub={nomeTurma(base)}
        voltar={{ href: `/turmas/${id}`, rotulo: "Voltar à turma" }}
      />

      <h2>Atividades</h2>
      {atividades.length === 0 ? (
        <Vazio>Nenhuma atividade criada ainda.</Vazio>
      ) : (
        <div className="tabela-rolagem">
          <table>
            <thead>
              <tr>
                <th>Atividade</th>
                <th>Prazo</th>
                <th>Entregaram</th>
                <th>Faltam</th>
                <th>Para corrigir</th>
                <th>Em atraso</th>
              </tr>
            </thead>
            <tbody>
              {atividades.map((a) => (
                <tr key={a.id}>
                  <td>
                    <Link href={`/turmas/${id}/atividades/${a.id}`}>
                      <Tex texto={a.titulo} />
                    </Link>
                  </td>
                  <td className="linha-meta" style={a.prazo && a.prazo < agora ? { color: "var(--erro)" } : undefined}>
                    {a.prazo ? dataHora(a.prazo) : "Sem prazo"}
                  </td>
                  <td>{a.entregaram}</td>
                  <td>{a.faltam}</td>
                  <td style={a.pendentes > 0 ? { color: "var(--foton)", fontWeight: 700 } : undefined}>{a.pendentes}</td>
                  <td style={a.atrasados > 0 ? { color: "var(--erro)", fontWeight: 700 } : undefined}>{a.atrasados}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 style={{ marginTop: "1.5rem" }}>Quizzes</h2>
      {quizzes.length === 0 ? (
        <Vazio>Nenhum quiz ativo.</Vazio>
      ) : (
        <div className="tabela-rolagem">
          <table>
            <thead>
              <tr>
                <th>Quiz</th>
                <th>Fizeram</th>
                <th>Faltam</th>
                <th>Média</th>
                <th>Melhor nota</th>
                <th>Pior nota</th>
              </tr>
            </thead>
            <tbody>
              {quizzes.map((q) => (
                <tr key={q.id}>
                  <td>
                    <Link href={`/turmas/${id}/quizzes/${q.id}/resultados`}>
                      <Tex texto={q.titulo} />
                    </Link>
                  </td>
                  <td>{q.fizeram}</td>
                  <td>{q.faltam}</td>
                  <td>{pct(q.media)}</td>
                  <td>{pct(q.melhor)}</td>
                  <td>{pct(q.pior)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
