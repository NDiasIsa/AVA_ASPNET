import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { FileText, Link2, Pencil, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { copiarQuiz, excluirQuiz } from "@/actions/quiz";
import {
  copiarAtividade,
  copiarPublicacao,
  criarSecao,
  excluirAviso,
  excluirPublicacao,
  excluirSecao,
  postarAviso,
} from "@/actions/turma";
import { Abas } from "@/components/abas";
import { Vazio } from "@/components/cabecalho";
import { CampoTex } from "@/components/campo-tex";
import { BotaoConfirmar } from "@/components/confirmar";
import { BotaoCopiar, type DestinoCopia } from "@/components/copiar";
import { BotaoEnviar, Formulario } from "@/components/formulario";
import { Ket } from "@/components/ket";
import { Tex } from "@/components/tex";
import { destinosDeCopia } from "@/lib/consultas";
import { db, t } from "@/lib/db";
import { dataHora, nomeTurma, numero, urlSegura } from "@/lib/formatos";
import { ehEquipe, exigirUsuario, podeGerir, podeVer } from "@/lib/sessao";

export const metadata: Metadata = { title: "Turma" };

export default async function PaginaTurma({ params }: { params: Promise<{ id: string }> }) {
  const usuario = await exigirUsuario();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();

  const autor = { columns: { nomeCompleto: true } } as const;
  const turma = await db.query.turmas.findFirst({
    where: eq(t.turmas.id, id),
    with: {
      professor: autor,
      alunos: { where: eq(t.usuarios.ativo, true), orderBy: asc(t.usuarios.nomeCompleto) },
      avisos: { with: { autor }, orderBy: desc(t.avisos.dataPublicacao) },
      secoes: {
        orderBy: asc(t.secoes.ordem),
        with: {
          publicacoes: { with: { autor }, orderBy: desc(t.publicacoes.dataPublicacao) },
          atividades: { with: { autor }, orderBy: desc(t.atividades.dataPublicacao) },
        },
      },
      quizzes: {
        where: eq(t.quizzes.ativo, true),
        with: { autor, questoes: { columns: { id: true } } },
        orderBy: desc(t.quizzes.dataPublicacao),
      },
    },
  });
  if (!turma) notFound();
  if (!podeVer(usuario, turma)) redirect("/acesso-negado");

  const gerir = podeGerir(usuario, turma);
  const atividadeIds = turma.secoes.flatMap((s) => s.atividades.map((a) => a.id));

  const [entregasDoAluno, respostasDoAluno, destinos] = await Promise.all([
    !ehEquipe(usuario) && atividadeIds.length > 0
      ? db.query.entregas.findMany({
          where: and(eq(t.entregas.alunoId, usuario.id), inArray(t.entregas.atividadeId, atividadeIds)),
          columns: { atividadeId: true, corrigida: true },
        })
      : [],
    !ehEquipe(usuario) && atividadeIds.length > 0
      ? db.query.respostasAtividade.findMany({
          where: and(eq(t.respostasAtividade.alunoId, usuario.id), inArray(t.respostasAtividade.atividadeId, atividadeIds)),
          columns: { atividadeId: true },
        })
      : [],
    gerir ? destinosDeCopia(id, usuario) : [],
  ]);

  const entregues = new Set([...entregasDoAluno.map((e) => e.atividadeId), ...respostasDoAluno.map((r) => r.atividadeId)]);
  const corrigidas = new Set(entregasDoAluno.filter((e) => e.corrigida).map((e) => e.atividadeId));
  const destinosCopia: DestinoCopia[] = destinos.map((d) => ({ id: d.id, nome: nomeTurma(d), secoes: d.secoes }));
  const agora = new Date();
  const base = `/turmas/${id}`;

  const acaoAluno = (a: { id: number; tipo: string }) => {
    if (corrigidas.has(a.id)) {
      return (
        <Link href={`${base}/atividades/${a.id}/entregar`}>
          <Ket estado="corrigida">corrigida</Ket>
        </Link>
      );
    }
    if (entregues.has(a.id)) {
      return a.tipo === "Avaliativa" ? (
        <Ket estado="entregue">entregue</Ket>
      ) : (
        <Link href={`${base}/atividades/${a.id}/entregar`}>
          <Ket estado="entregue">entregue</Ket>
        </Link>
      );
    }
    return (
      <Link
        href={`${base}/atividades/${a.id}/${a.tipo === "Avaliativa" ? "responder" : "entregar"}`}
        className="botao botao-principal botao-pequeno"
      >
        {a.tipo === "Avaliativa" ? "Responder" : "Entregar"}
      </Link>
    );
  };

  const mural = (
    <div className="pilha">
      {gerir && (
        <div className="vidro">
          <Formulario action={postarAviso} key={turma.avisos.length}>
            <input type="hidden" name="turmaId" value={id} />
            <CampoTex nome="texto" rotulo="Novo aviso" linhas={2} obrigatorio placeholder="Escreva um aviso para a turma" />
            <div className="acoes">
              <BotaoEnviar enviando="Postando…">Postar aviso</BotaoEnviar>
            </div>
          </Formulario>
        </div>
      )}
      {turma.avisos.length === 0 ? (
        <Vazio>Nenhum aviso ainda.</Vazio>
      ) : (
        <ul className="linhas">
          {turma.avisos.map((aviso) => (
            <li key={aviso.id} className="linha">
              <div className="linha-corpo">
                <Tex texto={aviso.texto} />
                <span className="linha-meta">
                  {aviso.autor.nomeCompleto}, {dataHora(aviso.dataPublicacao)}
                </span>
              </div>
              {gerir && (
                <form action={excluirAviso}>
                  <input type="hidden" name="id" value={aviso.id} />
                  <BotaoConfirmar mensagem="Excluir este aviso?" rotulo="Excluir aviso" />
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const conteudo = (
    <div className="niveis">
      {/* Mapa em forma de diagrama de níveis de energia: o primeiro nível fica embaixo. */}
      <ol className="niveis-mapa" aria-label="Seções da turma">
        {turma.secoes.map((secao, i) => (
          <li key={secao.id} style={{ "--salto": `${Math.max(0.15, 1.5 - i * 0.3)}rem` } as React.CSSProperties}>
            <a href={`#secao-${secao.id}`}>
              <span className="niveis-mapa-n">n = {i + 1}</span>
              {secao.nome}
            </a>
          </li>
        ))}
      </ol>

      <div className="niveis-lista">
        {turma.secoes.length === 0 && <Vazio>Nenhuma seção ainda.</Vazio>}

        {turma.secoes.map((secao, i) => (
          <section key={secao.id} id={`secao-${secao.id}`} aria-labelledby={`titulo-secao-${secao.id}`}>
            <div className="nivel-topo">
              <span className="nivel-n" aria-hidden="true">
                n = {i + 1}
              </span>
              <h3 id={`titulo-secao-${secao.id}`}>{secao.nome}</h3>
              {gerir && (
                <form action={excluirSecao}>
                  <input type="hidden" name="id" value={secao.id} />
                  <BotaoConfirmar
                    mensagem={`Excluir a seção ${secao.nome} e todo o seu conteúdo?`}
                    rotulo={`Excluir seção ${secao.nome}`}
                  />
                </form>
              )}
            </div>

            {secao.tipo === "Completa" && (
              <div className="grupo">
                <div className="grupo-titulo">
                  <span>Material</span>
                  {gerir && (
                    <Link href={`${base}/secoes/${secao.id}/material`} className="botao botao-secundario botao-pequeno">
                      <Plus size={14} aria-hidden="true" /> Adicionar material
                    </Link>
                  )}
                </div>
                {secao.publicacoes.length === 0 ? (
                  <Vazio>Nenhum material ainda.</Vazio>
                ) : (
                  <ul className="linhas">
                    {secao.publicacoes.map((pub) => {
                      const destino = pub.tipo === "Arquivo" ? `/api/arquivos/material/${pub.id}` : urlSegura(pub.url);
                      return (
                        <li key={pub.id} className="linha">
                          <div className="linha-corpo">
                            <span className="linha-titulo">
                              {pub.tipo === "Arquivo" ? (
                                <FileText size={15} aria-hidden="true" style={{ marginRight: 6, verticalAlign: -2 }} />
                              ) : (
                                <Link2 size={15} aria-hidden="true" style={{ marginRight: 6, verticalAlign: -2 }} />
                              )}
                              {destino ? (
                                <a href={destino} target="_blank" rel="noopener noreferrer">
                                  <Tex texto={pub.titulo} />
                                </a>
                              ) : (
                                <Tex texto={pub.titulo} />
                              )}
                            </span>
                            {pub.descricao && <Tex texto={pub.descricao} />}
                            <span className="linha-meta">
                              {pub.autor.nomeCompleto}, {dataHora(pub.dataPublicacao)}
                            </span>
                          </div>
                          {gerir && (
                            <div className="linha-acoes">
                              <Link href={`${base}/materiais/${pub.id}`} className="botao-icone" aria-label={`Editar ${pub.titulo}`} title="Editar">
                                <Pencil size={16} aria-hidden="true" />
                              </Link>
                              <BotaoCopiar action={copiarPublicacao} id={pub.id} titulo={pub.titulo} destinos={destinosCopia} por="secao" />
                              <form action={excluirPublicacao}>
                                <input type="hidden" name="id" value={pub.id} />
                                <BotaoConfirmar mensagem="Excluir este material?" rotulo={`Excluir ${pub.titulo}`} />
                              </form>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}

            <div className="grupo">
              <div className="grupo-titulo">
                <span>Atividades</span>
                {gerir && (
                  <Link href={`${base}/secoes/${secao.id}/atividade`} className="botao botao-secundario botao-pequeno">
                    <Plus size={14} aria-hidden="true" /> Criar atividade
                  </Link>
                )}
              </div>
              {secao.atividades.length === 0 ? (
                <Vazio>Nenhuma atividade ainda.</Vazio>
              ) : (
                <ul className="linhas">
                  {secao.atividades.map((a) => (
                    <li key={a.id} className="linha">
                      <div className="linha-corpo">
                        <span className="linha-titulo">
                          <Tex texto={a.titulo} />
                        </span>
                        {a.descricao && <Tex texto={a.descricao} />}
                        {a.arquivo && (
                          <a href={`/api/arquivos/atividade/${a.id}`} target="_blank" rel="noopener noreferrer">
                            {a.nomeArquivo}
                          </a>
                        )}
                        <span className="linha-meta">
                          {a.tipo === "Avaliativa" ? "Com alternativas, " : ""}
                          vale {numero(a.valorMaximo)} pts
                          {a.prazo && (
                            <>
                              {", prazo "}
                              <span style={a.prazo < agora ? { color: "var(--erro)" } : undefined}>{dataHora(a.prazo)}</span>
                            </>
                          )}
                        </span>
                      </div>
                      <div className="linha-acoes">
                        {gerir ? (
                          <>
                            <Link href={`${base}/atividades/${a.id}`} className="botao botao-secundario botao-pequeno">
                              Ver entregas
                            </Link>
                            <BotaoCopiar action={copiarAtividade} id={a.id} titulo={a.titulo} destinos={destinosCopia} por="secao" />
                          </>
                        ) : (
                          usuario.tipo === "Aluno" && acaoAluno(a)
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        ))}

        {gerir && (
          <details className="vidro">
            <summary style={{ cursor: "pointer", fontWeight: 650 }}>Criar seção</summary>
            <Formulario action={criarSecao} key={turma.secoes.length}>
              <input type="hidden" name="turmaId" value={id} />
              <div className="campo" style={{ marginTop: "1rem" }}>
                <label htmlFor="nome-secao">Nome da seção</label>
                <input id="nome-secao" name="nome" required maxLength={100} />
              </div>
              <div className="marcacoes" role="group" aria-label="Tipo da seção">
                <label className="marcacao">
                  <input type="radio" name="tipo" value="Completa" defaultChecked /> Material e atividades
                </label>
                <label className="marcacao">
                  <input type="radio" name="tipo" value="SoAtividade" /> Só atividades
                </label>
              </div>
              <div className="acoes">
                <BotaoEnviar enviando="Criando…">Criar seção</BotaoEnviar>
              </div>
            </Formulario>
          </details>
        )}
      </div>
    </div>
  );

  const pessoas =
    turma.alunos.length === 0 ? (
      <Vazio
        acao={
          gerir && (
            <Link href={`${base}/importar`} className="botao botao-principal">
              Importar alunos
            </Link>
          )
        }
      >
        Nenhum aluno matriculado ainda.
      </Vazio>
    ) : (
      <div className="pilha">
        {gerir && (
          <div className="acoes">
            <Link href={`${base}/importar`} className="botao botao-secundario botao-pequeno">
              Importar alunos
            </Link>
          </div>
        )}
        <div className="tabela-rolagem">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                {gerir && <th>Matrícula</th>}
                {gerir && <th>Situação</th>}
              </tr>
            </thead>
            <tbody>
              {turma.alunos.map((aluno) => (
                <tr key={aluno.id}>
                  <td>{aluno.nomeCompleto}</td>
                  {gerir && <td className="linha-meta">{aluno.matricula}</td>}
                  {gerir && (
                    <td>
                      {aluno.primeiroAcesso ? <Ket estado="pendente">1º acesso</Ket> : <Ket estado="corrigida">ativo</Ket>}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );

  const quiz = (
    <div className="pilha">
      {gerir && (
        <div className="acoes">
          <Link href={`${base}/quizzes/novo`} className="botao botao-principal">
            <Plus size={16} aria-hidden="true" /> Criar quiz
          </Link>
        </div>
      )}
      {turma.quizzes.length === 0 ? (
        <Vazio>Nenhum quiz disponível ainda.</Vazio>
      ) : (
        <ul className="linhas">
          {turma.quizzes.map((q) => (
            <li key={q.id} className="linha">
              <div className="linha-corpo">
                <span className="linha-titulo">
                  <Tex texto={q.titulo} />
                </span>
                {q.descricao && <Tex texto={q.descricao} />}
                <span className="linha-meta">
                  {q.autor.nomeCompleto}, {dataHora(q.dataPublicacao)}, {q.questoes.length} questão(ões)
                </span>
              </div>
              <div className="linha-acoes">
                {gerir ? (
                  <>
                    <Link href={`${base}/quizzes/${q.id}/resultados`} className="botao botao-secundario botao-pequeno">
                      Resultados
                    </Link>
                    <BotaoCopiar action={copiarQuiz} id={q.id} titulo={q.titulo} destinos={destinosCopia} por="turma" />
                    <form action={excluirQuiz}>
                      <input type="hidden" name="id" value={q.id} />
                      <BotaoConfirmar mensagem="Excluir este quiz?" rotulo={`Excluir ${q.titulo}`} />
                    </form>
                  </>
                ) : (
                  <Link href={`${base}/quizzes/${q.id}/responder`} className="botao botao-principal botao-pequeno">
                    Fazer quiz
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="pagina">
      <header className="cabecalho">
        {usuario.tipo !== "Aluno" && (
          <Link href="/turmas" className="voltar">
            Turmas
          </Link>
        )}
        <h1>Turma {turma.codigo}</h1>
        <p className="cabecalho-sub">
          {turma.ano}º ano do ensino médio em {turma.anoLetivo}, com {turma.professor.nomeCompleto}
        </p>
      </header>
      <Abas
        abas={[
          { id: "mural", rotulo: "Mural", conteudo: mural },
          { id: "conteudo", rotulo: "Conteúdo", conteudo },
          { id: "pessoas", rotulo: "Pessoas", contagem: turma.alunos.length, conteudo: pessoas },
          { id: "quiz", rotulo: "Quiz", contagem: turma.quizzes.length, conteudo: quiz },
        ]}
        extra={gerir ? <Link href={`${base}/painel`}>Painel</Link> : undefined}
      />
    </div>
  );
}
