import { desc } from "drizzle-orm";
import { Pencil, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { excluirNoticia } from "@/actions/admin";
import { Cabecalho, Vazio } from "@/components/cabecalho";
import { BotaoConfirmar } from "@/components/confirmar";
import { Ket } from "@/components/ket";
import { Tex } from "@/components/tex";
import { db, t } from "@/lib/db";
import { dataHora } from "@/lib/formatos";
import { exigirUsuario } from "@/lib/sessao";

export const metadata: Metadata = { title: "Notícias" };

export default async function Noticias() {
  await exigirUsuario("Admin");
  const noticias = await db.query.noticias.findMany({ orderBy: desc(t.noticias.dataPublicacao) });

  return (
    <div className="pagina">
      <Cabecalho
        titulo="Notícias"
        voltar={{ href: "/admin", rotulo: "Administração" }}
        acoes={
          <Link href="/admin/noticias/nova" className="botao botao-principal">
            <Plus size={16} aria-hidden="true" /> Criar notícia
          </Link>
        }
      />
      {noticias.length === 0 ? (
        <Vazio>Nenhuma notícia ainda. A página inicial mostra as notícias publicadas aqui.</Vazio>
      ) : (
        <ul className="linhas">
          {noticias.map((n) => (
            <li key={n.id} className="linha">
              <div className="linha-corpo">
                <span className="linha-titulo">
                  <Tex texto={n.titulo} />
                </span>
                <span className="linha-meta">
                  {dataHora(n.dataPublicacao)}
                  {n.destaque ? ", no carrossel" : ""}
                  {n.card ? ", na lista de notícias" : ""}
                </span>
              </div>
              <div className="linha-acoes">
                {n.publicada ? <Ket estado="corrigida">publicada</Ket> : <Ket estado="neutro">rascunho</Ket>}
                <Link href={`/admin/noticias/${n.id}/editar`} className="botao-icone" aria-label={`Editar ${n.titulo}`} title="Editar">
                  <Pencil size={16} aria-hidden="true" />
                </Link>
                <form action={excluirNoticia}>
                  <input type="hidden" name="id" value={n.id} />
                  <BotaoConfirmar mensagem="Excluir esta notícia?" rotulo={`Excluir ${n.titulo}`} />
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
