import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

/**
 * Envio pelo Gmail (SMTP) com uma senha de app da conta Google.
 * Sem GMAIL_USER e GMAIL_APP_PASSWORD, nada é enviado; em desenvolvimento
 * o conteúdo aparece no terminal para permitir testar o fluxo.
 */
let transporter: Transporter | null = null;

function obterTransporter(): Transporter | null {
  const user = process.env.GMAIL_USER;
  // O Google mostra a senha de app em blocos com espaços; eles não fazem parte dela.
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");
  if (!user || !pass) return null;

  transporter ??= nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });
  return transporter;
}

export async function enviarEmail(destinatario: string, assunto: string, html: string): Promise<boolean> {
  const transporte = obterTransporter();

  if (!transporte) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[e-mail não enviado] Para: ${destinatario}\nAssunto: ${assunto}\n${html}`);
    } else {
      console.warn("E-mail não enviado: defina GMAIL_USER e GMAIL_APP_PASSWORD.");
    }
    return false;
  }

  const nome = process.env.EMAIL_REMETENTE_NOME ?? "QuantumPinheiral";
  try {
    await transporte.sendMail({
      from: { name: nome, address: process.env.GMAIL_USER! },
      to: destinatario,
      subject: assunto,
      html,
    });
    return true;
  } catch (erro) {
    console.error("Falha ao enviar e-mail pelo Gmail:", erro);
    return false;
  }
}
