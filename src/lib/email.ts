import "server-only";

/**
 * Envio de e-mail ainda sem serviço definido. Para ativar, implemente o envio aqui.
 * Enquanto isso, a recuperação de senha não entrega mensagens; em desenvolvimento
 * o conteúdo aparece no terminal para permitir testar o fluxo.
 */
export async function enviarEmail(destinatario: string, assunto: string, html: string): Promise<boolean> {
  if (process.env.NODE_ENV !== "production") {
    console.info(`[e-mail não enviado] Para: ${destinatario}\nAssunto: ${assunto}\n${html}`);
  } else {
    console.warn("Recuperação de senha solicitada, mas nenhum serviço de e-mail está configurado.");
  }
  return false;
}
