import { asc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { Cabecalho, Vazio } from "@/components/cabecalho";
import { db, t } from "@/lib/db";
import { nomeTurma } from "@/lib/formatos";
import { exigirUsuario } from "@/lib/sessao";

export const metadata: Metadata = { title: "Visão geral" };

export default async function VisaoGeral() {
  const usuario = await exigirUsuario("Admin", "Professor");
  const turmas = await db.query.turmas.findMany({
    where: usuario.tipo === "Admin" ? undefined : eq(t.turmas.professorId, usuario.id),
    with: {
      alunos: { columns: { id: true }, where: eq(t.usuarios.ativo, true) },
      quizzes: { columns: { id: true }, where: eq(t.quizzes.ativo, true) },
      secoes: {
        columns: { id: true },
        with: { atividades: { columns: { id: true, prazo: true }, with: { entregas: { columns: { corrigida: true } } } } },
      },
    },
    orderBy: [asc(t.turmas.ano), asc(t.turmas.codigo)],
  });
  const agora = new Date();

  return (
    <div className="pagina">
      <Cabecalho titulo="Visão geral das turmas" voltar={{ href: "/turmas", rotulo: "Turmas" }} />
      {turmas.length === 0 ? (
        <Vazio>Nenhuma turma associada a você.</Vazio>
      ) : (
        <div className="tabela-rolagem">
          <table>
            <thead>
              <tr>
                <th>Turma</th>
                <th>Alunos</th>
                <th>Atividades abertas</th>
                <th>Entregas para corrigir</th>
                <th>Quizzes ativos</th>
              </tr>
            </thead>
            <tbody>
              {turmas.map((turma) => {
                const atividades = turma.secoes.flatMap((s) => s.atividades);
                const abertas = atividades.filter((a) => a.prazo && a.prazo > agora).length;
                const corrigir = atividades.flatMap((a) => a.entregas).filter((e) => !e.corrigida).length;
                return (
                  <tr key={turma.id}>
                    <td>
                      <Link href={`/turmas/${turma.id}/painel`}>{nomeTurma(turma)}</Link>
                    </td>
                    <td>{turma.alunos.length}</td>
                    <td>{abertas}</td>
                    <td style={corrigir > 0 ? { color: "var(--foton)", fontWeight: 700 } : undefined}>{corrigir}</td>
                    <td>{turma.quizzes.length}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
