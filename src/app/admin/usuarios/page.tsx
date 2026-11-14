import { asc } from "drizzle-orm";
import { UserPlus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { excluirUsuario, reenviarConvite } from "@/actions/admin";
import { Cabecalho } from "@/components/cabecalho";
import { BotaoConfirmar } from "@/components/confirmar";
import { Ket } from "@/components/ket";
import { db, t } from "@/lib/db";
import { nomeTurma } from "@/lib/formatos";
import { exigirUsuario } from "@/lib/sessao";

export const metadata: Metadata = { title: "Usuários" };

export default async function Usuarios() {
  await exigirUsuario("Admin");
  const usuarios = await db.query.usuarios.findMany({
    with: { turma: true },
    orderBy: [asc(t.usuarios.tipo), asc(t.usuarios.nomeCompleto)],
  });

  return (
    <div className="pagina">
      <Cabecalho
        titulo="Usuários"
        voltar={{ href: "/admin", rotulo: "Administração" }}
        acoes={
          <Link href="/admin/professores/novo" className="botao botao-principal">
            <UserPlus size={16} aria-hidden="true" /> Cadastrar professor
          </Link>
        }
      />
      <div className="tabela-rolagem">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Matrícula ou e-mail</th>
              <th>Perfil</th>
              <th>Turma</th>
              <th>Situação</th>
              <th>
                <span className="sr">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td>{u.nomeCompleto}</td>
                <td className="linha-meta">{u.matricula ?? u.email ?? "Sem registro"}</td>
                <td>{u.tipo}</td>
                <td className="linha-meta">{u.turma ? nomeTurma(u.turma) : "Sem turma"}</td>
                <td>
                  {u.tipo === "Professor" && u.primeiroAcesso ? (
                    <Ket estado="pendente">convite pendente</Ket>
                  ) : u.tipo === "Aluno" && u.primeiroAcesso ? (
                    <Ket estado="pendente">1º acesso</Ket>
                  ) : u.ativo ? (
                    <Ket estado="corrigida">ativo</Ket>
                  ) : (
                    <Ket estado="neutro">inativo</Ket>
                  )}
                </td>
                <td>
                  <div className="acoes" style={{ justifyContent: "flex-end", flexWrap: "nowrap" }}>
                    {u.tipo === "Professor" && u.primeiroAcesso && (
                      <form action={reenviarConvite}>
                        <input type="hidden" name="id" value={u.id} />
                        <button type="submit" className="botao botao-secundario botao-pequeno">
                          Reenviar convite
                        </button>
                      </form>
                    )}
                    {u.tipo !== "Admin" && (
                      <form action={excluirUsuario}>
                        <input type="hidden" name="id" value={u.id} />
                        <BotaoConfirmar mensagem={`Excluir ${u.nomeCompleto}?`} rotulo={`Excluir ${u.nomeCompleto}`} />
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
