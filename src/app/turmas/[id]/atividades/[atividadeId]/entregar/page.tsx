import { and, eq } from "drizzle-orm";
import { Lock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { entregarAtividade } from "@/actions/turma";
import { Cabecalho } from "@/components/cabecalho";
import { CampoArquivo } from "@/components/campo-arquivo";
import { CampoTex } from "@/components/campo-tex";
import { BotaoEnviar, Formulario } from "@/components/formulario";
import { Ket } from "@/components/ket";
import { Tex } from "@/components/tex";
import { db, t } from "@/lib/db";
import { dataHora, numero } from "@/lib/formatos";
import { exigirUsuario } from "@/lib/sessao";

export const metadata: Metadata = { title: "Entregar atividade" };

export default async function Entregar({ params }: { params: Promise<{ id: string; atividadeId: string }> }) {
  const { id, atividadeId } = await params;
  const turmaId = Number(id);
  const usuario = await exigirUsuario("Aluno");
  if (usuario.turmaId !== turmaId) redirect("/acesso-negado");

  const atividade = await db.query.atividades.findFirst({
    where: eq(t.atividades.id, Number(atividadeId)),
    with: { secao: true },
  });
  if (!atividade || atividade.secao.turmaId !== turmaId) notFound();
  if (atividade.tipo === "Avaliativa") redirect(`/turmas/${turmaId}/atividades/${atividade.id}/responder`);

  const entrega = await db.query.entregas.findFirst({
    where: and(eq(t.entregas.atividadeId, atividade.id), eq(t.entregas.alunoId, usuario.id)),
  });
  const voltar = `/turmas/${turmaId}#conteudo`;
  const agora = new Date();

  return (
    <div className="pagina pagina-estreita pilha">
      <Cabecalho
        titulo={atividade.titulo}
        voltar={{ href: voltar, rotulo: "Voltar à turma" }}
        sub={
          <>
            Vale {numero(atividade.valorMaximo)} pts
            {atividade.prazo && (
              <>
                {", prazo "}
                <span style={atividade.prazo < agora ? { color: "var(--erro)" } : undefined}>{dataHora(atividade.prazo)}</span>
              </>
            )}
          </>
        }
      />

      {atividade.descricao && <Tex texto={atividade.descricao} />}
      {atividade.arquivo && (
        <p>
          <a href={`/api/arquivos/atividade/${atividade.id}`} target="_blank" rel="noopener noreferrer">
            Abrir anexo: {atividade.nomeArquivo}
          </a>
        </p>
      )}

      {entrega && (
        <div className="vidro pilha">
          {entrega.corrigida ? (
            <>
              <Ket estado="corrigida">corrigida</Ket>
              <p>
                Nota: <strong>{numero(entrega.nota ?? 0)}</strong> de {numero(atividade.valorMaximo)}
              </p>
              {entrega.feedback && (
                <div>
                  <span className="rotulo">Feedback</span>
                  <div>
                    <Tex texto={entrega.feedback} />
                  </div>
                </div>
              )}
            </>
          ) : (
            <p>
              <Ket estado="entregue">entregue</Ket> em {dataHora(entrega.dataEntrega)}, aguardando correção.
            </p>
          )}
          {entrega.nomeArquivo && (
            <a href={`/api/arquivos/entrega/${entrega.id}`} target="_blank" rel="noopener noreferrer">
              {entrega.nomeArquivo}
            </a>
          )}
          {entrega.textoResposta && (
            <div>
              <span className="rotulo">Sua resposta</span>
              <div className="resposta-aluno">
                <Tex texto={entrega.textoResposta} />
              </div>
            </div>
          )}
        </div>
      )}

      {entrega?.corrigida ? (
        <div className="aviso">
          <Lock size={18} aria-hidden="true" />
          <span>Esta atividade já foi corrigida e não pode ser reenviada.</span>
        </div>
      ) : (
        <div className="vidro">
          <h2 style={{ marginBottom: "1rem" }}>{entrega ? "Reenviar entrega" : "Sua entrega"}</h2>
          <Formulario action={entregarAtividade}>
            <input type="hidden" name="atividadeId" value={atividade.id} />
            <CampoArquivo nome="arquivo" rotulo="Arquivo de resposta" pasta="entregas" usuarioId={usuario.id} ajuda="Até 50 MB." />
            <CampoTex
              nome="textoResposta"
              rotulo="Texto de resposta"
              linhas={5}
              placeholder="Opcional se enviar arquivo. Para fórmulas, use $v = \frac{d}{t}$"
            />
            <div className="acoes">
              <BotaoEnviar enviando="Entregando…">Entregar atividade</BotaoEnviar>
              <Link href={voltar} className="botao botao-secundario">
                Cancelar
              </Link>
            </div>
          </Formulario>
        </div>
      )}
    </div>
  );
}
