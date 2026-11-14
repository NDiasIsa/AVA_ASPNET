import "server-only";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/**
 * Redireciona refazendo a renderização. Um redirect que muda só o #aba da mesma página
 * é tratado como navegação interna e, sem isto, a tela continuaria com os dados antigos.
 */
export function irPara(url: string): never {
  revalidatePath("/", "layout");
  redirect(url);
}
