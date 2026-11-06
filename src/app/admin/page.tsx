import { and, count, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { Cabecalho } from "@/components/cabecalho";
import { db, t } from "@/lib/db";
import { exigirUsuario } from "@/lib/sessao";

export const metadata: Metadata = { title: "Administração" };

const contarPerfis = (tipo: "Aluno" | "Professor", ativo?: boolean) =>
  db
    .select({ n: count() })
    .from(t.usuarios)
    .where(ativo === undefined ? eq(t.usuarios.tipo, tipo) : and(eq(t.usuarios.tipo, tipo), eq(t.usuarios.ativo, ativo)))
    .then((r) => r[0].n);

export default async function Admin() {
  await exigirUsuario("Admin");

  const [ativos, inativos, professores, turmas, anoAtivo] = await Promise.all([
    contarPerfis("Aluno", true),
    contarPerfis("Aluno", false),
    contarPerfis("Professor"),
    db.select({ n: count() }).from(t.turmas).then((r) => r[0].n),
    db.query.anosLetivos.findFirst({ where: eq(t.anosLetivos.ativo, true) }),
  ]);

  return (
    <div className="pagina">
      <Cabecalho
        titulo="Administração"
        sub={anoAtivo ? `Ano letivo ${anoAtivo.ano}` : "Nenhum ano letivo ativo"}
      />
      <div className="medidas">
        <div className="medida">
          <strong>{ativos}</strong>
          <span>alunos ativos</span>
        </div>
        <div className="medida">
          <strong>{inativos}</strong>
          <span>alunos inativos</span>
        </div>
        <div className="medida">
          <strong>{professores}</strong>
          <span>professores</span>
        </div>
        <div className="medida">
          <strong>{turmas}</strong>
          <span>turmas</span>
        </div>
      </div>
      <nav className="atalhos" aria-label="Áreas da administração">
        <Link className="atalho" href="/admin/usuarios">
          <strong>Usuários</strong>
          <span>Ver contas e cadastrar professores</span>
        </Link>
        <Link className="atalho" href="/admin/turmas">
          <strong>Turmas</strong>
          <span>Criar turmas, associar professor e importar alunos</span>
        </Link>
        <Link className="atalho" href="/admin/noticias">
          <strong>Notícias</strong>
          <span>Publicar na página inicial</span>
        </Link>
        <Link className="atalho atalho-perigo" href="/admin/ano-letivo">
          <strong>Iniciar novo ano letivo</strong>
          <span>Desvincula todos os alunos das turmas</span>
        </Link>
      </nav>
    </div>
  );
}
