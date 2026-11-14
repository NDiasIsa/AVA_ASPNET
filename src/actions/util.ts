export type EstadoForm = { erro?: string } | undefined;

export const texto = (fd: FormData, campo: string) => String(fd.get(campo) ?? "").trim();
export const textoOuNulo = (fd: FormData, campo: string) => texto(fd, campo) || null;
export const inteiro = (fd: FormData, campo: string) => {
  const n = Number(fd.get(campo));
  return Number.isInteger(n) ? n : NaN;
};
export const marcado = (fd: FormData, campo: string) => fd.get(campo) === "on";

export const emailValido = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/** Arredonda para uma casa decimal, como as notas são exibidas. */
export const umaCasa = (n: number) => Math.round(n * 10) / 10;
