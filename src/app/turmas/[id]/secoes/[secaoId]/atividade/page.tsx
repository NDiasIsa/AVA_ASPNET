import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Cabecalho } from "@/components/cabecalho";
import { FormAtividade } from "@/components/form-atividade";
import { db, t } from "@/lib/db";
import { paraDataLocal } from "@/lib/formatos";
import { exigirGestao } from "@/lib/sessao";

export const metadata: Metadata = { title: "Criar atividade" };

export default async function NovaAtividade({ params }: { params: Promise<{ id: string; secaoId: string }> }) {
  const { id, secaoId } = await params;
  const turmaId = Number(id);
  const { usuario } = await exigirGestao(turmaId);
  const secao = await db.query.secoes.findFirst({ where: eq(t.secoes.id, Number(secaoId)) });
  if (!secao || secao.turmaId !== turmaId) notFound();

  const emUmaSemana = paraDataLocal(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

  return (
    <div className="pagina pagina-estreita">
      <Cabecalho titulo="Criar atividade" sub={secao.nome} voltar={{ href: `/turmas/${turmaId}#conteudo`, rotulo: "Voltar à turma" }} />
      <FormAtividade secaoId={secao.id} turmaId={turmaId} usuarioId={usuario.id} prazoPadrao={emUmaSemana} />
    </div>
  );
}
