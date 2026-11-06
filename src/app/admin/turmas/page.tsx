import { asc } from "drizzle-orm";
import { Pencil, Plus, Upload, UserCog } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { excluirTurma } from "@/actions/admin";
import { Cabecalho, Vazio } from "@/components/cabecalho";
import { BotaoConfirmar } from "@/components/confirmar";
import { db, t } from "@/lib/db";
import { nomeTurma } from "@/lib/formatos";
import { exigirUsuario } from "@/lib/sessao";

export const metadata: Metadata = { title: "Turmas" };

export default async function Turmas() {
  await exigirUsuario("Admin");
  const turmas = await db.query.turmas.findMany({
    with: { professor: { columns: { nomeCompleto: true } }, alunos: { columns: { id: true } } },
    orderBy: [asc(t.turmas.ano), asc(t.turmas.codigo)],
  });

  return (
    <div className="pagina">
      <Cabecalho
        titulo="Turmas"
        voltar={{ href: "/admin", rotulo: "Administração" }}
        acoes={
          <Link href="/admin/turmas/nova" className="botao botao-principal">
            <Plus size={16} aria-hidden="true" /> Criar turma
          </Link>
        }
      />
      {turmas.length === 0 ? (
        <Vazio>Nenhuma turma criada. Crie a primeira para importar alunos.</Vazio>
      ) : (
        <ul className="linhas">
          {turmas.map((turma) => (
            <li key={turma.id} className="linha">
              <div className="linha-corpo">
                <Link href={`/turmas/${turma.id}`} className="linha-titulo">
                  {nomeTurma(turma)}
                </Link>
                <span className="linha-meta">
                  {turma.professor.nomeCompleto}, {turma.alunos.length} aluno(s)
                  {turma.descricao ? `, ${turma.descricao}` : ""}
                </span>
              </div>
              <div className="linha-acoes">
                <Link href={`/turmas/${turma.id}/importar`} className="botao-icone" aria-label={`Importar alunos para ${turma.codigo}`} title="Importar alunos">
                  <Upload size={16} aria-hidden="true" />
                </Link>
                <Link href={`/admin/turmas/${turma.id}/professor`} className="botao-icone" aria-label={`Trocar professor de ${turma.codigo}`} title="Trocar professor">
                  <UserCog size={16} aria-hidden="true" />
                </Link>
                <Link href={`/admin/turmas/${turma.id}/editar`} className="botao-icone" aria-label={`Editar ${turma.codigo}`} title="Editar turma">
                  <Pencil size={16} aria-hidden="true" />
                </Link>
                <form action={excluirTurma}>
                  <input type="hidden" name="id" value={turma.id} />
                  <BotaoConfirmar
                    mensagem={`Excluir a turma ${turma.codigo}? Todo o conteúdo será apagado e os alunos ficarão inativos.`}
                    rotulo={`Excluir ${turma.codigo}`}
                  />
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
