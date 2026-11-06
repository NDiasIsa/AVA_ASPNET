import "server-only";
import { cookies } from "next/headers";

/** Mensagem exibida uma única vez após um redirecionamento. Lida por components/flash.tsx. */
export async function flash(tipo: "sucesso" | "erro", mensagem: string) {
  (await cookies()).set("qp_flash", JSON.stringify({ tipo, mensagem }), {
    path: "/",
    maxAge: 60,
    sameSite: "lax",
  });
}
