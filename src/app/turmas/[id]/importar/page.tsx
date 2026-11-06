import type { Metadata } from "next";
import Link from "next/link";
import { importarAlunos } from "@/actions/admin";
import { Cabecalho } from "@/components/cabecalho";
import { BotaoEnviar, Formulario } from "@/components/formulario";
import { nomeTurma } from "@/lib/formatos";
import { SENHA_INICIAL_ALUNO } from "@/lib/senha";
import { exigirGestao } from "@/lib/sessao";

export const metadata: Metadata = { title: "Importar alunos" };

export default async function Importar({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const { turma } = await exigirGestao(id);

  return (
    <div className="pagina pagina-estreita pilha">
      <Cabecalho titulo="Importar alunos" sub={nomeTurma(turma)} voltar={{ href: `/turmas/${id}#pessoas`, rotulo: "Voltar à turma" }} />
      <div className="vidro">
        <Formulario action={importarAlunos}>
          <input type="hidden" name="turmaId" value={id} />
          <div className="campo">
            <label htmlFor="arquivo">Arquivo CSV</label>
            <input id="arquivo" name="arquivo" type="file" accept=".csv" required />
            <p className="ajuda">Separado por ponto e vírgula, com as colunas Matrícula e Aluno.</p>
          </div>
          <div className="acoes">
            <BotaoEnviar enviando="Importando…">Importar alunos</BotaoEnviar>
            <Link href={`/turmas/${id}#pessoas`} className="botao botao-secundario">
              Cancelar
            </Link>
          </div>
        </Formulario>
      </div>
      <p className="ajuda">
        No primeiro acesso, o aluno entra com a matrícula e a senha temporária <strong>{SENHA_INICIAL_ALUNO}</strong> e define a própria senha.
      </p>
    </div>
  );
}
