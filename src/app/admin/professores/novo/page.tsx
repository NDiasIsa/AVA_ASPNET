import type { Metadata } from "next";
import Link from "next/link";
import { criarProfessor } from "@/actions/admin";
import { Cabecalho } from "@/components/cabecalho";
import { BotaoEnviar, Formulario } from "@/components/formulario";
import { exigirUsuario } from "@/lib/sessao";

export const metadata: Metadata = { title: "Cadastrar professor" };

export default async function NovoProfessor() {
  await exigirUsuario("Admin");
  return (
    <div className="pagina pagina-estreita">
      <Cabecalho titulo="Cadastrar professor" voltar={{ href: "/admin/usuarios", rotulo: "Usuários" }} />
      <div className="vidro">
        <Formulario action={criarProfessor}>
          <div className="campo">
            <label htmlFor="nomeCompleto">Nome completo</label>
            <input id="nomeCompleto" name="nomeCompleto" required maxLength={150} />
          </div>
          <div className="campo">
            <label htmlFor="email">E-mail</label>
            <input id="email" name="email" type="email" required maxLength={256} />
          </div>
          <p className="ajuda">
            O professor recebe neste e-mail um link para criar a senha. O link vale por 15 dias.
          </p>
          <div className="acoes">
            <BotaoEnviar>Cadastrar e enviar convite</BotaoEnviar>
            <Link href="/admin/usuarios" className="botao botao-secundario">
              Cancelar
            </Link>
          </div>
        </Formulario>
      </div>
    </div>
  );
}
