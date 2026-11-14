import type { Metadata } from "next";
import { Cabecalho } from "@/components/cabecalho";
import { FormNoticia } from "@/components/form-noticia";
import { exigirUsuario } from "@/lib/sessao";

export const metadata: Metadata = { title: "Criar notícia" };

export default async function NovaNoticia() {
  const usuario = await exigirUsuario("Admin");
  return (
    <div className="pagina pagina-estreita">
      <Cabecalho titulo="Criar notícia" voltar={{ href: "/admin/noticias", rotulo: "Notícias" }} />
      <FormNoticia usuarioId={usuario.id} />
    </div>
  );
}
