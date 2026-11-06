import type { Metadata } from "next";
import Link from "next/link";
import { criarQuiz } from "@/actions/quiz";
import { Cabecalho } from "@/components/cabecalho";
import { CampoTex, CampoTitulo } from "@/components/campo-tex";
import { EditorQuestoes } from "@/components/editor-questoes";
import { BotaoEnviar, Formulario } from "@/components/formulario";
import { exigirGestao } from "@/lib/sessao";

export const metadata: Metadata = { title: "Criar quiz" };

export default async function NovoQuiz({ params }: { params: Promise<{ id: string }> }) {
  const turmaId = Number((await params).id);
  const { usuario } = await exigirGestao(turmaId);
  const voltar = `/turmas/${turmaId}#quiz`;

  return (
    <div className="pagina pagina-estreita">
      <Cabecalho titulo="Criar quiz" voltar={{ href: voltar, rotulo: "Voltar à turma" }} />
      <div className="vidro">
        <Formulario action={criarQuiz}>
          <input type="hidden" name="turmaId" value={turmaId} />
          <CampoTitulo placeholder="Título do quiz" />
          <CampoTex nome="descricao" rotulo="Descrição (opcional)" linhas={2} />
          <label className="marcacao">
            <input type="checkbox" name="ativo" defaultChecked /> Visível para os alunos
          </label>
          <EditorQuestoes pasta="quiz" usuarioId={usuario.id} comExplicacao />
          <div className="acoes">
            <BotaoEnviar>Salvar quiz</BotaoEnviar>
            <Link href={voltar} className="botao botao-secundario">
              Cancelar
            </Link>
          </div>
        </Formulario>
      </div>
    </div>
  );
}
