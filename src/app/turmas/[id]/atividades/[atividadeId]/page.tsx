import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Cabecalho, Vazio } from "@/components/cabecalho";
import { Ket } from "@/components/ket";
import { Tex } from "@/components/tex";
import { db, t } from "@/lib/db";
import { dataHora, numero } from "@/lib/formatos";
import { exigirGestao } from "@/lib/sessao";

export const metadata: Metadata = { title: "Entregas" };

export default async function VerAtividade({ params }: { params: Promise<{ id: string; atividadeId: string }> }) {
  const { id, atividadeId } = await params;
  const turmaId = Number(id);
  await exigirGestao(turmaId);

  const aluno = { columns: { nomeCompleto: true } } as const;
  const atividade = await db.query.atividades.findFirst({
    where: eq(t.atividades.id, Number(atividadeId)),
    with: {
      secao: true,
      entregas: { with: { aluno } },
      respostas: { with: { aluno }, orderBy: desc(t.respostasAtividade.nota) },
    },
  });
  if (!atividade || atividade.secao.turmaId !== turmaId) notFound();

  const agora = new Date();
  const entregas = [...atividade.entregas].sort((a, b) => a.aluno.nomeCompleto.localeCompare(b.aluno.nomeCompleto, "pt-BR"));

  return (
    <div className="pagina pilha">
      <Cabecalho
        titulo={atividade.titulo}
        voltar={{ href: `/turmas/${turmaId}#conteudo`, rotulo: "Voltar à turma" }}
        sub={
          <>
            {atividade.tipo === "Avaliativa" ? "Com alternativas, " : ""}
            vale {numero(atividade.valorMaximo)} pts
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
            {atividade.nomeArquivo}
          </a>
        </p>
      )}

      {atividade.tipo === "Avaliativa" ? (
        <>
          <h2>Respostas ({atividade.respostas.length})</h2>
          {atividade.respostas.length === 0 ? (
            <Vazio>Nenhuma resposta ainda.</Vazio>
          ) : (
            <div className="tabela-rolagem">
              <table>
                <thead>
                  <tr>
                    <th>Aluno</th>
                    <th>Data</th>
                    <th>Acertos</th>
                    <th>Nota</th>
                  </tr>
                </thead>
                <tbody>
                  {atividade.respostas.map((r) => (
                    <tr key={r.id}>
                      <td>{r.aluno.nomeCompleto}</td>
                      <td className="linha-meta">{dataHora(r.dataResposta)}</td>
                      <td>
                        {r.totalAcertos} de {r.totalQuestoes}
                      </td>
                      <td style={{ color: r.nota >= atividade.valorMaximo * 0.6 ? "var(--certo)" : "var(--erro)", fontWeight: 700 }}>
                        {numero(r.nota)} de {numero(atividade.valorMaximo)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <>
          <h2>Entregas ({entregas.length})</h2>
          {entregas.length === 0 ? (
            <Vazio>Nenhuma entrega ainda.</Vazio>
          ) : (
            <div className="tabela-rolagem">
              <table>
                <thead>
                  <tr>
                    <th>Aluno</th>
                    <th>Entregue em</th>
                    <th>Nota</th>
                    <th>Situação</th>
                    <th>
                      <span className="sr">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {entregas.map((e) => (
                    <tr key={e.id}>
                      <td>{e.aluno.nomeCompleto}</td>
                      <td className="linha-meta">{dataHora(e.dataEntrega)}</td>
                      <td>{e.corrigida && e.nota !== null ? `${numero(e.nota)} de ${numero(atividade.valorMaximo)}` : "Sem nota"}</td>
                      <td>{e.corrigida ? <Ket estado="corrigida">corrigida</Ket> : <Ket estado="pendente">pendente</Ket>}</td>
                      <td>
                        <Link href={`/turmas/${turmaId}/entregas/${e.id}`} className="botao botao-secundario botao-pequeno">
                          {e.corrigida ? "Ver ou editar" : "Corrigir"}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
