import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { editarTurma } from "@/actions/admin";
import { Cabecalho } from "@/components/cabecalho";
import { FormTurma } from "@/components/form-turma";
import { db, t } from "@/lib/db";
import { exigirUsuario } from "@/lib/sessao";

export const metadata: Metadata = { title: "Editar turma" };

export default async function EditarTurma({ params }: { params: Promise<{ id: string }> }) {
  await exigirUsuario("Admin");
  const turma = await db.query.turmas.findFirst({ where: eq(t.turmas.id, Number((await params).id)) });
  if (!turma) notFound();

  return (
    <div className="pagina pagina-estreita">
      <Cabecalho titulo={`Editar turma ${turma.codigo}`} voltar={{ href: "/admin/turmas", rotulo: "Turmas" }} />
      <FormTurma action={editarTurma} turma={turma} />
    </div>
  );
}
