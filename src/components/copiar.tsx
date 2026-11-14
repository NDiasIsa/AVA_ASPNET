"use client";

import { Copy } from "lucide-react";
import { useRef } from "react";
import type { EstadoForm } from "@/actions/util";
import { BotaoEnviar, Formulario } from "./formulario";

export type DestinoCopia = { id: number; nome: string; secoes: { id: number; nome: string }[] };

/** Diálogo para copiar um material, atividade ou quiz para outra turma. */
export function BotaoCopiar({
  action,
  id,
  titulo,
  destinos,
  por,
}: {
  action: (estado: EstadoForm, dados: FormData) => Promise<EstadoForm>;
  id: number;
  titulo: string;
  destinos: DestinoCopia[];
  por: "secao" | "turma";
}) {
  const dialogo = useRef<HTMLDialogElement>(null);
  if (destinos.length === 0) return null;

  return (
    <>
      <button
        type="button"
        className="botao-icone"
        aria-label={`Copiar ${titulo} para outra turma`}
        title="Copiar para outra turma"
        onClick={() => dialogo.current?.showModal()}
      >
        <Copy size={16} aria-hidden="true" />
      </button>
      <dialog ref={dialogo} className="dialogo">
        <h2>Copiar para outra turma</h2>
        <p className="ajuda">{titulo}</p>
        <Formulario action={action}>
          <input type="hidden" name="id" value={id} />
          <div className="campo">
            <label htmlFor={`destino-${por}-${id}`}>{por === "secao" ? "Seção de destino" : "Turma de destino"}</label>
            {por === "secao" ? (
              <select id={`destino-${por}-${id}`} name="secaoDestinoId" required defaultValue="">
                <option value="" disabled>
                  Escolha uma seção
                </option>
                {destinos.map((t) => (
                  <optgroup key={t.id} label={t.nome}>
                    {t.secoes.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nome}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            ) : (
              <select id={`destino-${por}-${id}`} name="turmaDestinoId" required defaultValue="">
                <option value="" disabled>
                  Escolha uma turma
                </option>
                {destinos.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="acoes">
            <BotaoEnviar enviando="Copiando…">Copiar</BotaoEnviar>
            <button type="button" className="botao botao-secundario" onClick={() => dialogo.current?.close()}>
              Cancelar
            </button>
          </div>
        </Formulario>
      </dialog>
    </>
  );
}
