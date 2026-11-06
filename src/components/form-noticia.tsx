import Link from "next/link";
import { salvarNoticia } from "@/actions/admin";
import { CampoArquivo } from "./campo-arquivo";
import { CampoTitulo } from "./campo-tex";
import { EditorNoticia } from "./editor-noticia";
import { BotaoEnviar, Formulario } from "./formulario";

type Noticia = {
  id: number;
  titulo: string;
  resumo: string | null;
  conteudo: string;
  corTitulo: string;
  publicada: boolean;
  destaque: boolean;
  card: boolean;
  imagemCapa: string | null;
  imagemCard: string | null;
};

export function FormNoticia({ noticia, usuarioId }: { noticia?: Noticia; usuarioId: number }) {
  return (
    <div className="vidro">
      <Formulario action={salvarNoticia}>
        {noticia && <input type="hidden" name="id" value={noticia.id} />}
        <CampoTitulo valorInicial={noticia?.titulo} placeholder="Título da notícia" />
        <div className="campo">
          <label htmlFor="resumo">Resumo</label>
          <input id="resumo" name="resumo" maxLength={300} defaultValue={noticia?.resumo ?? ""} placeholder="Aparece na lista de notícias" />
        </div>
        <div className="grade-2">
          <CampoArquivo
            nome="imagemCapa"
            rotulo={noticia?.imagemCapa ? "Trocar imagem do carrossel" : "Imagem do carrossel"}
            pasta="noticias"
            usuarioId={usuarioId}
            somenteImagem
          />
          <CampoArquivo
            nome="imagemCard"
            rotulo={noticia?.imagemCard ? "Trocar imagem da lista" : "Imagem da lista de notícias"}
            pasta="noticias"
            usuarioId={usuarioId}
            somenteImagem
          />
        </div>
        <EditorNoticia inicial={noticia?.conteudo ?? ""} />
        <div className="campo">
          <label htmlFor="corTitulo">Cor do título no carrossel</label>
          <input id="corTitulo" name="corTitulo" type="color" defaultValue={noticia?.corTitulo ?? "#f2f1ec"} />
        </div>
        <div className="marcacoes">
          <label className="marcacao">
            <input type="checkbox" name="publicada" defaultChecked={noticia?.publicada} /> Publicar agora
          </label>
          <label className="marcacao">
            <input type="checkbox" name="destaque" defaultChecked={noticia?.destaque} /> Mostrar no carrossel
          </label>
          <label className="marcacao">
            <input type="checkbox" name="card" defaultChecked={noticia?.card} /> Mostrar na lista de notícias
          </label>
        </div>
        <div className="acoes">
          <BotaoEnviar>Salvar notícia</BotaoEnviar>
          <Link href="/admin/noticias" className="botao botao-secundario">
            Cancelar
          </Link>
        </div>
      </Formulario>
    </div>
  );
}
