import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { corrigirEntrega } from "@/actions/turma";
import { Cabecalho } from "@/components/cabecalho";
import { CampoTex } from "@/components/campo-tex";
import { BotaoEnviar, Formulario } from "@/components/formulario";
import { Tex } from "@/components/tex";
import { db, t } from "@/lib/db";
import { dataHora, numero } from "@/lib/formatos";
import { exigirGestao } from "@/lib/sessao";

export const metadata: Metadata = { title: "Corrigir entrega" };

export default async function Corrigir({ params }: { params: Promise<{ id: string; entregaId: string }> }) {
  const { id, entregaId } = await params;
  const turmaId = Number(id);
  await exigirGestao(turmaId);

  const entrega = await db.query.entregas.findFirst({
    where: eq(t.entregas.id, Number(entregaId)),
    with: { aluno: { columns: { nomeCompleto: true } }, atividade: { with: { secao: true } } },
  });
  if (!entrega || entrega.atividade.secao.turmaId !== turmaId) notFound();

  const voltar = `/turmas/${turmaId}/atividades/${entrega.atividadeId}`;
  const maximo = entrega.atividade.valorMaximo;

  return (
    <div className="pagina pagina-estreita pilha">
      <Cabecalho
        titulo={`Corrigir entrega de ${entrega.aluno.nomeCompleto}`}
        sub={<Tex texto={entrega.atividade.titulo} />}
        voltar={{ href: voltar, rotulo: "Voltar às entregas" }}
      />

      <section className="pilha" aria-label="Entrega do aluno">
        <p className="ajuda">Enviada em {dataHora(entrega.dataEntrega)}</p>
        {entrega.arquivo && (
          <p>
            <a href={`/api/arquivos/entrega/${entrega.id}`} target="_blank" rel="noopener noreferrer">
              {entrega.nomeArquivo}
            </a>
          </p>
        )}
        {entrega.textoResposta && (
          <div className="resposta-aluno">
            <Tex texto={entrega.textoResposta} />
          </div>
        )}
        {!entrega.arquivo && !entrega.textoResposta && <p className="ajuda">Nenhum conteúdo enviado.</p>}
      </section>

      <div className="vidro">
        <Formulario action={corrigirEntrega}>
          <input type="hidden" name="id" value={entrega.id} />
          <div className="campo" style={{ maxWidth: "14rem" }}>
            <label htmlFor="nota">Nota (de 0 a {numero(maximo)})</label>
            <input id="nota" name="nota" type="number" min="0" max={maximo} step="0.1" required defaultValue={entrega.nota ?? ""} />
          </div>
          <CampoTex nome="feedback" rotulo="Feedback" linhas={4} valorInicial={entrega.feedback ?? ""} placeholder="Comentários para o aluno" />
          <div className="acoes">
            <BotaoEnviar>Salvar correção</BotaoEnviar>
            <Link href={voltar} className="botao botao-secundario">
              Cancelar
            </Link>
          </div>
        </Formulario>
      </div>
    </div>
  );
}
