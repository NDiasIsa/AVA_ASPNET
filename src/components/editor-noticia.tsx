"use client";

import "quill/dist/quill.snow.css";
import { useEffect, useRef, useState } from "react";
import { renderizarTexEmHtml } from "@/lib/tex";

/** Editor de texto das notícias. Fórmulas escritas com $...$ aparecem na pré-visualização. */
export function EditorNoticia({ inicial }: { inicial: string }) {
  const area = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState(inicial);

  useEffect(() => {
    const elemento = area.current;
    if (!elemento) return;
    let cancelado = false;

    void import("quill").then(({ default: Quill }) => {
      if (cancelado) return;
      const quill = new Quill(elemento, {
        theme: "snow",
        placeholder: "Escreva o conteúdo da notícia...",
        modules: {
          toolbar: [
            ["bold", "italic", "underline", "strike"],
            ["blockquote"],
            [{ header: 1 }, { header: 2 }],
            [{ list: "ordered" }, { list: "bullet" }],
            [{ align: [] }],
            ["link"],
            ["clean"],
          ],
        },
      });
      if (inicial) quill.clipboard.dangerouslyPasteHTML(inicial);
      const sincronizar = () => setHtml(quill.getLength() > 1 ? quill.getSemanticHTML() : "");
      quill.on("text-change", sincronizar);
    });

    return () => {
      cancelado = true;
      elemento.innerHTML = "";
      elemento.previousElementSibling?.classList.contains("ql-toolbar") && elemento.previousElementSibling.remove();
    };
    // O conteúdo inicial só é carregado uma vez; depois o editor é a fonte da verdade.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="campo">
      <span className="rotulo">Conteúdo</span>
      <div className="editor-noticia">
        <div ref={area} />
      </div>
      <input type="hidden" name="conteudo" value={html} />
      <p className="ajuda">Para fórmulas, escreva $E = mc^2$ na linha ou $$E = mc^2$$ em destaque.</p>
      {/[$\\]/.test(html) && (
        <div className="tex-previa" aria-live="polite">
          <span className="tex-previa-rotulo">Como vai aparecer</span>
          <div className="conteudo-rico" dangerouslySetInnerHTML={{ __html: renderizarTexEmHtml(html) }} />
        </div>
      )}
    </div>
  );
}
