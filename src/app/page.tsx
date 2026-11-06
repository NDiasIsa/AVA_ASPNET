import { and, desc, eq } from "drizzle-orm";
import Link from "next/link";
import { Destaques } from "@/components/destaques";
import { FuncaoOnda } from "@/components/funcao-onda";
import { Tex } from "@/components/tex";
import { db, t } from "@/lib/db";
import { dataCurta } from "@/lib/formatos";
import { obterUsuario } from "@/lib/sessao";

export default async function Inicio() {
  const [usuario, noticias] = await Promise.all([
    obterUsuario(),
    db.query.noticias.findMany({ where: and(eq(t.noticias.publicada, true)), orderBy: desc(t.noticias.dataPublicacao) }),
  ]);
  const destaques = noticias.filter((n) => n.destaque);
  const cards = noticias.filter((n) => n.card);

  const destino = !usuario
    ? { href: "/login", rotulo: "Entrar" }
    : usuario.tipo === "Aluno"
      ? { href: "/minha-turma", rotulo: "Ir para minha turma" }
      : { href: "/turmas", rotulo: "Ir para as turmas" };

  return (
    <>
      <section className="abertura">
        <h1 className="abertura-titulo">
          Quantum<span>Pinheiral</span>
        </h1>
        <div className="abertura-texto">
          <p>Materiais, atividades e quizzes das turmas do IFRJ, Campus Pinheiral.</p>
          <Link href={destino.href} className="botao botao-principal">
            {destino.rotulo}
          </Link>
        </div>
        <FuncaoOnda />
      </section>

      {destaques.length > 0 && (
        <section className="secao-home" aria-labelledby="titulo-destaques">
          <h2 id="titulo-destaques">Destaques</h2>
          <Destaques
            itens={destaques.map((n) => ({
              id: n.id,
              titulo: n.titulo,
              corTitulo: n.corTitulo,
              temImagem: Boolean(n.imagemCapa),
            }))}
          />
        </section>
      )}

      {cards.length > 0 && (
        <section className="secao-home" aria-labelledby="titulo-noticias" style={{ paddingBottom: "4rem" }}>
          <h2 id="titulo-noticias">Notícias</h2>
          <div className="noticias-lista">
            {cards.map((n) => (
              <Link key={n.id} href={`/noticias/${n.id}`} className="noticia-item">
                {n.imagemCard && <img src={`/api/arquivos/noticia-card/${n.id}`} alt="" loading="lazy" />}
                <h3>
                  <Tex texto={n.titulo} />
                </h3>
                {n.resumo && (
                  <p>
                    <Tex texto={n.resumo} />
                  </p>
                )}
                <time dateTime={n.dataPublicacao.toISOString()}>{dataCurta(n.dataPublicacao)}</time>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
