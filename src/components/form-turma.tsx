import Link from "next/link";
import type { EstadoForm } from "@/actions/util";
import { BotaoEnviar, Formulario } from "./formulario";

export function FormTurma({
  action,
  turma,
}: {
  action: (estado: EstadoForm, dados: FormData) => Promise<EstadoForm>;
  turma?: { id: number; codigo: string; descricao: string | null; ano: number };
}) {
  return (
    <div className="vidro">
      <Formulario action={action}>
        {turma && <input type="hidden" name="id" value={turma.id} />}
        <div className="grade-2">
          <div className="campo">
            <label htmlFor="codigo">Código da turma</label>
            <input id="codigo" name="codigo" required maxLength={10} defaultValue={turma?.codigo} placeholder="Ex.: 2B" />
          </div>
          <div className="campo">
            <label htmlFor="ano">Ano do ensino médio</label>
            <select id="ano" name="ano" required defaultValue={turma?.ano ?? 1}>
              <option value="1">1º ano</option>
              <option value="2">2º ano</option>
              <option value="3">3º ano</option>
            </select>
          </div>
        </div>
        <div className="campo">
          <label htmlFor="descricao">Descrição (opcional)</label>
          <input id="descricao" name="descricao" maxLength={100} defaultValue={turma?.descricao ?? ""} />
        </div>
        <div className="acoes">
          <BotaoEnviar>{turma ? "Salvar turma" : "Criar turma"}</BotaoEnviar>
          <Link href="/admin/turmas" className="botao botao-secundario">
            Cancelar
          </Link>
        </div>
      </Formulario>
    </div>
  );
}
