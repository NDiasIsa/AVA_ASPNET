import { asc, eq } from "drizzle-orm";
import { BarChart3 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Cabecalho, Vazio } from "@/components/cabecalho";
import { db, t } from "@/lib/db";
import { nomeTurma } from "@/lib/formatos";
import { exigirUsuario } from "@/lib/sessao";

export const metadata: Metadata = { title: "Turmas" };

export default async function MinhasTurmas() {
  const usuario = await exigirUsuario("Admin", "Professor");
  const turmas = await db.query.turmas.findMany({
    where: usuario.tipo === "Admin" ? undefined : eq(t.turmas.professorId, usuario.id),
    with: {
      professor: { columns: { nomeCompleto: true } },
      alunos: { columns: { id: true }, where: eq(t.usuarios.ativo, true) },
    },
    orderBy: [asc(t.turmas.ano), asc(t.turmas.codigo)],
  });

  return (
    <div className="pagina">
      <Cabecalho
        titulo={usuario.tipo === "Admin" ? "Todas as turmas" : "Minhas turmas"}
        acoes={
          <Link href="/turmas/visao-geral" className="botao botao-secundario">
            <BarChart3 size={16} aria-hidden="true" /> Visão geral
          </Link>
        }
      />
      {turmas.length === 0 ? (
        <Vazio>Nenhuma turma associada a você. O administrador faz essa associação.</Vazio>
      ) : (
        <ul className="linhas">
          {turmas.map((turma) => (
            <li key={turma.id} className="linha">
              <div className="linha-corpo">
                <Link href={`/turmas/${turma.id}`} className="linha-titulo">
                  {nomeTurma(turma)}
                </Link>
                <span className="linha-meta">
                  {turma.alunos.length} aluno(s)
                  {usuario.tipo === "Admin" ? `, ${turma.professor.nomeCompleto}` : ""}
                  {turma.descricao ? `, ${turma.descricao}` : ""}
                </span>
              </div>
              <div className="linha-acoes">
                <Link href={`/turmas/${turma.id}/painel`} className="botao botao-secundario botao-pequeno">
                  Painel
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
