import type { Metadata } from "next";
import { criarTurma } from "@/actions/admin";
import { Cabecalho } from "@/components/cabecalho";
import { FormTurma } from "@/components/form-turma";
import { exigirUsuario } from "@/lib/sessao";

export const metadata: Metadata = { title: "Criar turma" };

export default async function NovaTurma() {
  await exigirUsuario("Admin");
  return (
    <div className="pagina pagina-estreita">
      <Cabecalho
        titulo="Criar turma"
        voltar={{ href: "/admin/turmas", rotulo: "Turmas" }}
        sub="A turma começa com uma seção para cada bimestre."
      />
      <FormTurma action={criarTurma} />
    </div>
  );
}
