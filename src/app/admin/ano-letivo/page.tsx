import { and, count, eq } from "drizzle-orm";
import { TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { iniciarAnoLetivo } from "@/actions/admin";
import { Cabecalho } from "@/components/cabecalho";
import { BotaoConfirmar } from "@/components/confirmar";
import { db, t } from "@/lib/db";
import { exigirUsuario } from "@/lib/sessao";

export const metadata: Metadata = { title: "Novo ano letivo" };

export default async function AnoLetivo() {
  await exigirUsuario("Admin");

  const [ativo, [{ alunos }], [{ turmas }]] = await Promise.all([
    db.query.anosLetivos.findFirst({ where: eq(t.anosLetivos.ativo, true) }),
    db.select({ alunos: count() }).from(t.usuarios).where(and(eq(t.usuarios.tipo, "Aluno"), eq(t.usuarios.ativo, true))),
    db.select({ turmas: count() }).from(t.turmas),
  ]);
  const anoAtual = ativo?.ano ?? new Date().getFullYear();
  const anoNovo = anoAtual + 1;

  return (
    <div className="pagina pagina-estreita pilha">
      <Cabecalho titulo={`Iniciar o ano letivo de ${anoNovo}`} voltar={{ href: "/admin", rotulo: "Administração" }} />
      <div className="aviso aviso-atencao">
        <TriangleAlert size={18} aria-hidden="true" />
        <div>
          <p>Ao confirmar:</p>
          <ul style={{ margin: "0.4rem 0 0", paddingLeft: "1.2rem" }}>
            <li>o ano letivo de {anoAtual} é encerrado;</li>
            <li>{alunos} aluno(s) ficam sem turma e inativos;</li>
            <li>as {turmas} turma(s) continuam, com o conteúdo atual;</li>
            <li>cada turma precisa reimportar o CSV para reativar os alunos.</li>
          </ul>
        </div>
      </div>
      <form action={iniciarAnoLetivo} className="acoes">
        <input type="hidden" name="anoNovo" value={anoNovo} />
        <BotaoConfirmar
          className="botao botao-principal"
          mensagem={`Iniciar o ano letivo de ${anoNovo}? Todos os alunos serão desvinculados das turmas.`}
          rotulo={`Iniciar ${anoNovo}`}
        >
          Iniciar {anoNovo}
        </BotaoConfirmar>
        <Link href="/admin" className="botao botao-secundario">
          Cancelar
        </Link>
      </form>
    </div>
  );
}
