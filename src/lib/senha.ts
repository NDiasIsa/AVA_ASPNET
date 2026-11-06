import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (senha: string, sal: Buffer, tamanho: number) => Promise<Buffer>;

export async function gerarHash(senha: string): Promise<string> {
  const sal = randomBytes(16);
  const hash = await scryptAsync(senha, sal, 64);
  return `scrypt$${sal.toString("base64")}$${hash.toString("base64")}`;
}

export async function conferirSenha(senha: string, armazenado: string): Promise<boolean> {
  const [algoritmo, salB64, hashB64] = armazenado.split("$");
  if (algoritmo !== "scrypt" || !salB64 || !hashB64) return false;
  const esperado = Buffer.from(hashB64, "base64");
  const obtido = await scryptAsync(senha, Buffer.from(salB64, "base64"), esperado.length);
  return timingSafeEqual(esperado, obtido);
}

/** Mesma política de senha do sistema anterior. Retorna a mensagem de erro, se houver. */
export function validarPoliticaSenha(senha: string): string | null {
  if (senha.length < 8) return "A senha precisa ter pelo menos 8 caracteres.";
  if (!/[a-z]/.test(senha)) return "A senha precisa ter uma letra minúscula.";
  if (!/[A-Z]/.test(senha)) return "A senha precisa ter uma letra maiúscula.";
  if (!/[0-9]/.test(senha)) return "A senha precisa ter um número.";
  if (!/[^a-zA-Z0-9]/.test(senha)) return "A senha precisa ter um caractere especial, como @, # ou !.";
  return null;
}

/** Senha temporária dos alunos importados, trocada obrigatoriamente no primeiro acesso. */
export const SENHA_INICIAL_ALUNO = process.env.SENHA_INICIAL_ALUNO || "[Aluno@123]";
