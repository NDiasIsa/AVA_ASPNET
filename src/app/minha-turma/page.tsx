import { redirect } from "next/navigation";
import { Cabecalho, Vazio } from "@/components/cabecalho";
import { exigirUsuario } from "@/lib/sessao";

export default async function MinhaTurma() {
  const usuario = await exigirUsuario("Aluno");
  if (usuario.turmaId) redirect(`/turmas/${usuario.turmaId}`);

  return (
    <div className="pagina">
      <Cabecalho titulo="Minha turma" />
      <Vazio>Você ainda não está em uma turma. Procure a coordenação ou seu professor.</Vazio>
    </div>
  );
}
