import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Cabecalho } from "@/components/cabecalho";
import { FormNoticia } from "@/components/form-noticia";
import { db, t } from "@/lib/db";
import { exigirUsuario } from "@/lib/sessao";

export const metadata: Metadata = { title: "Editar notícia" };

export default async function EditarNoticia({ params }: { params: Promise<{ id: string }> }) {
  const usuario = await exigirUsuario("Admin");
  const noticia = await db.query.noticias.findFirst({ where: eq(t.noticias.id, Number((await params).id)) });
  if (!noticia) notFound();

  return (
    <div className="pagina pagina-estreita">
      <Cabecalho titulo="Editar notícia" voltar={{ href: "/admin/noticias", rotulo: "Notícias" }} />
      <FormNoticia noticia={noticia} usuarioId={usuario.id} />
    </div>
  );
}
