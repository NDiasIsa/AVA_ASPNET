import { asc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { associarProfessor } from "@/actions/admin";
import { Cabecalho, Vazio } from "@/components/cabecalho";
import { BotaoEnviar, Formulario } from "@/components/formulario";
import { db, t } from "@/lib/db";
import { nomeTurma } from "@/lib/formatos";
import { exigirUsuario } from "@/lib/sessao";

export const metadata: Metadata = { title: "Associar professor" };

export default async function AssociarProfessor({ params }: { params: Promise<{ id: string }> }) {
  await exigirUsuario("Admin");
  const turma = await db.query.turmas.findFirst({ where: eq(t.turmas.id, Number((await params).id)) });
  if (!turma) notFound();

  const professores = await db.query.usuarios.findMany({
    where: eq(t.usuarios.tipo, "Professor"),
    columns: { id: true, nomeCompleto: true },
    orderBy: asc(t.usuarios.nomeCompleto),
  });

  return (
    <div className="pagina pagina-estreita">
      <Cabecalho titulo="Associar professor" sub={nomeTurma(turma)} voltar={{ href: "/admin/turmas", rotulo: "Turmas" }} />
      {professores.length === 0 ? (
        <Vazio
          acao={
            <Link href="/admin/professores/novo" className="botao botao-principal">
              Cadastrar professor
            </Link>
          }
        >
          Nenhum professor cadastrado ainda.
        </Vazio>
      ) : (
        <div className="vidro">
          <Formulario action={associarProfessor}>
            <input type="hidden" name="turmaId" value={turma.id} />
            <div className="campo">
              <label htmlFor="professorId">Professor</label>
              <select id="professorId" name="professorId" required defaultValue={turma.professorId}>
                {professores.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nomeCompleto}
                  </option>
                ))}
              </select>
            </div>
            <div className="acoes">
              <BotaoEnviar>Associar professor</BotaoEnviar>
              <Link href="/admin/turmas" className="botao botao-secundario">
                Cancelar
              </Link>
            </div>
          </Formulario>
        </div>
      )}
    </div>
  );
}
