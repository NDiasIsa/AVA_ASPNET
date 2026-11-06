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
          <div className="grade-2">
            <div className="campo">
              <label htmlFor="email">E-mail</label>
              <input id="email" name="email" type="email" required />
            </div>
            <div className="campo">
              <label htmlFor="matricula">Matrícula funcional (opcional)</label>
              <input id="matricula" name="matricula" maxLength={20} />
            </div>
          </div>
          <div className="grade-2">
            <div className="campo">
              <label htmlFor="senha">Senha inicial</label>
              <input id="senha" name="senha" type="password" required minLength={8} autoComplete="new-password" />
            </div>
            <div className="campo">
              <label htmlFor="confirmarSenha">Confirmar senha</label>
              <input id="confirmarSenha" name="confirmarSenha" type="password" required autoComplete="new-password" />
            </div>
          </div>
          <p className="ajuda">O professor troca esta senha no primeiro acesso.</p>
          <div className="acoes">
            <BotaoEnviar>Cadastrar professor</BotaoEnviar>
            <Link href="/admin/usuarios" className="botao botao-secundario">
              Cancelar
            </Link>
          </div>
        </Formulario>
      </div>
    </div>
  );
}
