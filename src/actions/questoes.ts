import "server-only";
import { z } from "zod";
import { ErroArquivo, validarEnvio } from "@/lib/arquivos/armazenamento";
import type { Pasta } from "@/lib/arquivos/regras";
import { embedYoutube } from "@/lib/formatos";
import type { Usuario } from "@/lib/sessao";

const esquemaQuestao = z.object({
  enunciado: z.string(),
  imagemCaminho: z.string().default(""),
  imagemNome: z.string().default(""),
  alternativas: z.array(z.string()).max(10),
  correta: z.number().int().nullable(),
  tipoExplicacao: z.enum(["Texto", "Imagem", "Video"]).default("Texto"),
  explicacao: z.string().default(""),
  explicacaoImagemCaminho: z.string().default(""),
  explicacaoImagemNome: z.string().default(""),
  explicacaoVideo: z.string().default(""),
});

export type QuestaoProcessada = {
  enunciado: string;
  imagem: string | null;
  ordem: number;
  alternativas: { texto: string; correta: boolean }[];
  tipoExplicacao: "Texto" | "Imagem" | "Video";
  explicacao: string | null;
  explicacaoMidia: string | null;
};

/** Valida as questões enviadas pelo EditorQuestoes. Lança ErroArquivo com a mensagem para o formulário. */
export async function processarQuestoes(json: string, pasta: Pasta, usuario: Usuario): Promise<QuestaoProcessada[]> {
  const lido = z.array(esquemaQuestao).max(200).safeParse(JSON.parse(json || "[]"));
  if (!lido.success) throw new ErroArquivo("Não foi possível ler as questões. Recarregue a página e tente de novo.");

  const preenchidas = lido.data.filter((q) => q.enunciado.trim());
  if (preenchidas.length === 0) throw new ErroArquivo("Adicione pelo menos uma questão com enunciado.");

  const resultado: QuestaoProcessada[] = [];
  for (const [ordem, q] of preenchidas.entries()) {
    const rotulo = `Questão ${ordem + 1}`;
    const alternativas = q.alternativas
      .map((texto, i) => ({ texto: texto.trim(), correta: q.correta === i }))
      .filter((a) => a.texto);

    if (alternativas.length < 2) throw new ErroArquivo(`${rotulo}: preencha pelo menos duas alternativas.`);
    if (alternativas.some((a) => a.texto.length > 500)) throw new ErroArquivo(`${rotulo}: cada alternativa pode ter até 500 caracteres.`);
    if (!alternativas.some((a) => a.correta)) throw new ErroArquivo(`${rotulo}: marque a alternativa correta.`);

    const imagem = await validarEnvio(q.imagemCaminho, q.imagemNome, pasta, usuario, { somenteImagem: true });

    let explicacaoMidia: string | null = null;
    if (q.tipoExplicacao === "Imagem") {
      const arquivo = await validarEnvio(q.explicacaoImagemCaminho, q.explicacaoImagemNome, pasta, usuario, { somenteImagem: true });
      explicacaoMidia = arquivo?.caminho ?? null;
    } else if (q.tipoExplicacao === "Video" && q.explicacaoVideo.trim()) {
      if (!embedYoutube(q.explicacaoVideo)) throw new ErroArquivo(`${rotulo}: o link da explicação precisa ser do YouTube.`);
      explicacaoMidia = q.explicacaoVideo.trim();
    }

    resultado.push({
      enunciado: q.enunciado.trim(),
      imagem: imagem?.caminho ?? null,
      ordem,
      alternativas,
      tipoExplicacao: q.tipoExplicacao,
      explicacao: q.tipoExplicacao === "Texto" ? q.explicacao.trim() || null : null,
      explicacaoMidia,
    });
  }
  return resultado;
}
