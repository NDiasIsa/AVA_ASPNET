import Link from "next/link";

export default function NaoEncontrado() {
  return (
    <div className="pagina pagina-estreita pilha">
      <h1>Página não encontrada</h1>
      <p>O endereço pode estar errado, ou o conteúdo foi removido.</p>
      <div>
        <Link href="/" className="botao botao-secundario">
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
