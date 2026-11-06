import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Cabecalho } from "@/components/cabecalho";
import { FormPublicacao } from "@/components/form-publicacao";
import { db, t } from "@/lib/db";
import { exigirGestao } from "@/lib/sessao";

export const metadata: Metadata = { title: "Adicionar material" };

export default async function NovoMaterial({ params }: { params: Promise<{ id: string; secaoId: string }> }) {
  const { id, secaoId } = await params;
  const turmaId = Number(id);
  const { usuario } = await exigirGestao(turmaId);
  const secao = await db.query.secoes.findFirst({ where: eq(t.secoes.id, Number(secaoId)) });
  if (!secao || secao.turmaId !== turmaId) notFound();

  return (
    <div className="pagina pagina-estreita">
      <Cabecalho titulo="Adicionar material" sub={secao.nome} voltar={{ href: `/turmas/${turmaId}#conteudo`, rotulo: "Voltar à turma" }} />
      <FormPublicacao secaoId={secao.id} turmaId={turmaId} usuarioId={usuario.id} />
    </div>
  );
}
