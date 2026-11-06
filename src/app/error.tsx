"use client";

export default function Erro({ reset }: { reset: () => void }) {
  return (
    <div className="pagina pagina-estreita pilha">
      <h1>Não foi possível carregar esta página</h1>
      <p>Tente de novo. Se o problema continuar, avise o administrador.</p>
      <div>
        <button type="button" className="botao botao-secundario" onClick={reset}>
          Tentar de novo
        </button>
      </div>
    </div>
  );
}
