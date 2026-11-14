import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Cabecalho } from "@/components/cabecalho";
import { FormPublicacao } from "@/components/form-publicacao";
import { db, t } from "@/lib/db";
import { exigirGestao } from "@/lib/sessao";

export const metadata: Metadata = { title: "Editar material" };

export default async function EditarMaterial({ params }: { params: Promise<{ id: string; publicacaoId: string }> }) {
  const { id, publicacaoId } = await params;
  const turmaId = Number(id);
  const { usuario } = await exigirGestao(turmaId);
  const pub = await db.query.publicacoes.findFirst({
    where: eq(t.publicacoes.id, Number(publicacaoId)),
    with: { secao: true },
  });
  if (!pub || pub.secao.turmaId !== turmaId) notFound();

  return (
    <div className="pagina pagina-estreita">
      <Cabecalho titulo="Editar material" sub={pub.secao.nome} voltar={{ href: `/turmas/${turmaId}#conteudo`, rotulo: "Voltar à turma" }} />
      <FormPublicacao
        secaoId={pub.secaoId}
        turmaId={turmaId}
        usuarioId={usuario.id}
        publicacao={{ id: pub.id, titulo: pub.titulo, descricao: pub.descricao, tipo: pub.tipo, url: pub.url, nomeArquivo: pub.nomeArquivo }}
      />
    </div>
  );
}
