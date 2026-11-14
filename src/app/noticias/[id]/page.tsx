import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Cabecalho } from "@/components/cabecalho";
import { Tex } from "@/components/tex";
import { db, t } from "@/lib/db";
import { dataHora } from "@/lib/formatos";
import { renderizarTexEmHtml } from "@/lib/tex";

export default async function Noticia({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();

  const noticia = await db.query.noticias.findFirst({
    where: and(eq(t.noticias.id, id), eq(t.noticias.publicada, true)),
    with: { autor: { columns: { nomeCompleto: true } } },
  });
  if (!noticia) notFound();

  return (
    <div className="pagina pagina-estreita">
      <Cabecalho
        titulo={noticia.titulo}
        voltar={{ href: "/", rotulo: "Voltar ao início" }}
        sub={`${dataHora(noticia.dataPublicacao)}, por ${noticia.autor.nomeCompleto}`}
      />
      {noticia.imagemCapa && <img className="noticia-capa" src={`/api/arquivos/noticia-capa/${noticia.id}`} alt="" />}
      {noticia.resumo && (
        <p style={{ fontSize: "1.2rem", marginBottom: "1.5rem" }}>
          <Tex texto={noticia.resumo} />
        </p>
      )}
      {/* O conteúdo é sanitizado ao salvar; aqui só as fórmulas são renderizadas. */}
      <div className="conteudo-rico" dangerouslySetInnerHTML={{ __html: renderizarTexEmHtml(noticia.conteudo) }} />
    </div>
  );
}
