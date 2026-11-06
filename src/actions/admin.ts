"use server";

import { and, asc, eq } from "drizzle-orm";
import { parse } from "csv-parse/sync";
import { redirect } from "next/navigation";
import { irPara } from "./navegar";
import sanitizeHtml from "sanitize-html";
import { db, ehErroEmUso, t } from "@/lib/db";
import { ErroArquivo, receberArquivo, removerArquivo } from "@/lib/arquivos/armazenamento";
import { flash } from "@/lib/flash";
import { gerarHash, SENHA_INICIAL_ALUNO, validarPoliticaSenha } from "@/lib/senha";
import { exigirGestao, exigirUsuario } from "@/lib/sessao";
import { emailValido, type EstadoForm, inteiro, marcado, texto, textoOuNulo } from "./util";

async function perfilAdmin() {
  const admin = await db.query.usuarios.findFirst({
    where: eq(t.usuarios.tipo, "Admin"),
    orderBy: asc(t.usuarios.id),
  });
  if (!admin) throw new Error("Nenhum administrador cadastrado.");
  return admin;
}

// ── Usuários ─────────────────────────────────────────────────

export async function excluirUsuario(fd: FormData) {
  const atual = await exigirUsuario("Admin");
  const id = inteiro(fd, "id");
  const alvo = await db.query.usuarios.findFirst({ where: eq(t.usuarios.id, id) });

  if (!alvo) redirect("/admin/usuarios");
  if (alvo.id === atual.id || alvo.tipo === "Admin") {
    await flash("erro", "Contas de administrador não podem ser excluídas aqui.");
    redirect("/admin/usuarios");
  }

  try {
    await db.transaction(async (tx) => {
      if (alvo.tipo === "Professor") {
        const admin = await perfilAdmin();
        await tx.update(t.turmas).set({ professorId: admin.id }).where(eq(t.turmas.professorId, alvo.id));
      }
      await tx.delete(t.usuarios).where(eq(t.usuarios.id, alvo.id));
    });
    await flash("sucesso", `${alvo.nomeCompleto} foi excluído(a).`);
  } catch (erro) {
    if (!ehErroEmUso(erro)) throw erro;
    await flash(
      "erro",
      `${alvo.nomeCompleto} tem entregas, resultados ou publicações registrados e não pode ser excluído(a).`,
    );
  }
  redirect("/admin/usuarios");
}

export async function criarProfessor(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  await exigirUsuario("Admin");

  const nomeCompleto = texto(fd, "nomeCompleto");
  const email = texto(fd, "email").toLowerCase();
  const matricula = textoOuNulo(fd, "matricula");
  const senha = String(fd.get("senha") ?? "");

  if (!nomeCompleto || nomeCompleto.length > 150) return { erro: "Informe o nome completo, com até 150 caracteres." };
  if (!emailValido(email)) return { erro: "Informe um e-mail válido." };
  if (matricula && matricula.length > 20) return { erro: "A matrícula funcional pode ter até 20 caracteres." };
  if (senha !== fd.get("confirmarSenha")) return { erro: "As senhas não coincidem." };
  const erroSenha = validarPoliticaSenha(senha);
  if (erroSenha) return { erro: erroSenha };

  const existente = await db.query.usuarios.findFirst({ where: eq(t.usuarios.login, email) });
  if (existente) return { erro: "Este e-mail já está cadastrado." };
  if (matricula) {
    const mesmaMatricula = await db.query.usuarios.findFirst({ where: eq(t.usuarios.matricula, matricula) });
    if (mesmaMatricula) return { erro: "Esta matrícula já está cadastrada." };
  }

  await db.insert(t.usuarios).values({
    login: email,
    email,
    matricula,
    senhaHash: await gerarHash(senha),
    tipo: "Professor",
    nomeCompleto,
  });

  await flash("sucesso", `Professor(a) ${nomeCompleto} cadastrado(a).`);
  redirect("/admin/usuarios");
}

// ── Turmas ───────────────────────────────────────────────────

function lerTurma(fd: FormData) {
  const codigo = texto(fd, "codigo").toUpperCase();
  const descricao = textoOuNulo(fd, "descricao");
  const ano = inteiro(fd, "ano");
  if (!codigo || codigo.length > 10) return { erro: "O código precisa ter de 1 a 10 caracteres." } as const;
  if (descricao && descricao.length > 100) return { erro: "A descrição pode ter até 100 caracteres." } as const;
  if (![1, 2, 3].includes(ano)) return { erro: "Escolha o 1º, 2º ou 3º ano." } as const;
  return { codigo, descricao, ano };
}

export async function criarTurma(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  await exigirUsuario("Admin");
  const dados = lerTurma(fd);
  if ("erro" in dados) return dados;

  const anoAtivo = await db.query.anosLetivos.findFirst({ where: eq(t.anosLetivos.ativo, true) });
  const admin = await perfilAdmin();

  await db.transaction(async (tx) => {
    const [turma] = await tx
      .insert(t.turmas)
      .values({ ...dados, anoLetivo: anoAtivo?.ano ?? new Date().getFullYear(), professorId: admin.id })
      .returning();
    await tx.insert(t.secoes).values(
      ["1º Bimestre", "2º Bimestre", "3º Bimestre", "4º Bimestre"].map((nome, ordem) => ({
        nome,
        ordem,
        turmaId: turma.id,
      })),
    );
  });

  await flash("sucesso", `Turma ${dados.codigo} criada.`);
  redirect("/admin/turmas");
}

export async function editarTurma(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  await exigirUsuario("Admin");
  const dados = lerTurma(fd);
  if ("erro" in dados) return dados;

  await db.update(t.turmas).set(dados).where(eq(t.turmas.id, inteiro(fd, "id")));
  await flash("sucesso", "Turma atualizada.");
  redirect("/admin/turmas");
}

export async function excluirTurma(fd: FormData) {
  await exigirUsuario("Admin");
  const id = inteiro(fd, "id");
  const turma = await db.query.turmas.findFirst({ where: eq(t.turmas.id, id) });
  if (turma) {
    await db.transaction(async (tx) => {
      await tx.update(t.usuarios).set({ turmaId: null, ativo: false }).where(eq(t.usuarios.turmaId, id));
      await tx.delete(t.turmas).where(eq(t.turmas.id, id));
    });
    await flash("sucesso", `Turma ${turma.codigo} excluída.`);
  }
  redirect("/admin/turmas");
}

export async function associarProfessor(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  await exigirUsuario("Admin");
  const professorId = inteiro(fd, "professorId");
  const professor = await db.query.usuarios.findFirst({
    where: and(eq(t.usuarios.id, professorId), eq(t.usuarios.tipo, "Professor")),
  });
  if (!professor) return { erro: "Escolha um professor." };

  await db.update(t.turmas).set({ professorId }).where(eq(t.turmas.id, inteiro(fd, "turmaId")));
  await flash("sucesso", `${professor.nomeCompleto} agora é responsável pela turma.`);
  redirect("/admin/turmas");
}

// ── Importação de alunos ─────────────────────────────────────

/** Planilhas exportadas pelo Excel costumam vir em windows-1252, e não em UTF-8. */
function decodificarCsv(bytes: Uint8Array): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder("windows-1252").decode(bytes);
  }
}

export async function importarAlunos(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const turmaId = inteiro(fd, "turmaId");
  const { usuario } = await exigirGestao(turmaId);

  const arquivo = fd.get("arquivo");
  if (!(arquivo instanceof File) || arquivo.size === 0) return { erro: "Escolha um arquivo .csv." };
  if (!arquivo.name.toLowerCase().endsWith(".csv")) return { erro: "Apenas arquivos .csv são aceitos." };

  let linhas: Record<string, string>[];
  try {
    linhas = parse(decodificarCsv(new Uint8Array(await arquivo.arrayBuffer())), {
      columns: true,
      delimiter: ";",
      bom: true,
      trim: true,
      skip_empty_lines: true,
      relax_column_count: true,
    });
  } catch {
    return { erro: "Não foi possível ler o arquivo. Confira se o separador é ponto e vírgula." };
  }

  if (linhas.length > 0 && !("Matrícula" in linhas[0] && "Aluno" in linhas[0])) {
    return { erro: "O arquivo precisa ter as colunas Matrícula e Aluno." };
  }

  // Todos os novos alunos começam com a mesma senha temporária; basta calcular o hash uma vez.
  const senhaHash = await gerarHash(SENHA_INICIAL_ALUNO);
  let criados = 0;
  let reativados = 0;
  let ignorados = 0;

  await db.transaction(async (tx) => {
    for (const linha of linhas) {
      const matricula = linha["Matrícula"]?.trim();
      const nome = linha["Aluno"]?.trim();
      if (!matricula || !nome || matricula.length > 20 || nome.length > 150) {
        ignorados += 1;
        continue;
      }

      const login = matricula.toLowerCase();
      const existente = await tx.query.usuarios.findFirst({ where: eq(t.usuarios.login, login) });
      if (existente) {
        if (existente.tipo !== "Aluno") {
          ignorados += 1;
          continue;
        }
        await tx
          .update(t.usuarios)
          .set({ turmaId, ativo: true, nomeCompleto: nome })
          .where(eq(t.usuarios.id, existente.id));
        reativados += 1;
      } else {
        await tx.insert(t.usuarios).values({ login, matricula, nomeCompleto: nome, senhaHash, tipo: "Aluno", turmaId });
        criados += 1;
      }
    }
  });

  await flash("sucesso", `${criados} novo(s), ${reativados} reativado(s), ${ignorados} ignorado(s).`);
  irPara(usuario.tipo === "Admin" ? "/admin/turmas" : `/turmas/${turmaId}#pessoas`);
}

// ── Ano letivo ───────────────────────────────────────────────

export async function iniciarAnoLetivo(fd: FormData) {
  await exigirUsuario("Admin");
  const anoNovo = inteiro(fd, "anoNovo");
  if (!anoNovo) redirect("/admin/ano-letivo");

  await db.transaction(async (tx) => {
    await tx.update(t.usuarios).set({ turmaId: null, ativo: false }).where(eq(t.usuarios.tipo, "Aluno"));
    await tx.update(t.anosLetivos).set({ ativo: false }).where(eq(t.anosLetivos.ativo, true));
    await tx.insert(t.anosLetivos).values({ ano: anoNovo, ativo: true });
  });

  await flash("sucesso", `Ano letivo ${anoNovo} iniciado.`);
  redirect("/admin");
}

// ── Notícias ─────────────────────────────────────────────────

const limparConteudo = (html: string) =>
  sanitizeHtml(html.replace(/&nbsp;/g, " "), {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["h1", "h2", "img", "s", "u"]),
    allowedAttributes: { a: ["href", "target", "rel"], img: ["src", "alt"], "*": ["class"] },
    allowedClasses: { "*": ["ql-align-center", "ql-align-right", "ql-align-justify"] },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: { a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" }) },
  });

export async function salvarNoticia(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const usuario = await exigirUsuario("Admin");

  const id = inteiro(fd, "id") || null;
  const titulo = texto(fd, "titulo");
  const resumo = textoOuNulo(fd, "resumo");
  const conteudo = limparConteudo(String(fd.get("conteudo") ?? ""));
  const corInformada = texto(fd, "corTitulo");
  const corTitulo = /^#[0-9a-fA-F]{6}$/.test(corInformada) ? corInformada : "#f2f1ec";

  if (!titulo || titulo.length > 200) return { erro: "Informe um título com até 200 caracteres." };
  if (resumo && resumo.length > 300) return { erro: "O resumo pode ter até 300 caracteres." };
  if (!sanitizeHtml(conteudo, { allowedTags: ["img"] }).trim()) return { erro: "Escreva o conteúdo da notícia." };

  let capa, card;
  try {
    capa = await receberArquivo(fd, "imagemCapa", "noticias", usuario, { somenteImagem: true });
    card = await receberArquivo(fd, "imagemCard", "noticias", usuario, { somenteImagem: true });
  } catch (erro) {
    if (erro instanceof ErroArquivo) return { erro: erro.message };
    throw erro;
  }

  const dados = {
    titulo,
    resumo,
    conteudo,
    corTitulo,
    publicada: marcado(fd, "publicada"),
    destaque: marcado(fd, "destaque"),
    card: marcado(fd, "card"),
  };

  if (id) {
    const anterior = await db.query.noticias.findFirst({ where: eq(t.noticias.id, id) });
    if (!anterior) redirect("/admin/noticias");
    await db
      .update(t.noticias)
      .set({
        ...dados,
        ...(capa ? { imagemCapa: capa.caminho } : {}),
        ...(card ? { imagemCard: card.caminho } : {}),
      })
      .where(eq(t.noticias.id, id));
    if (capa) await removerArquivo(anterior.imagemCapa);
    if (card) await removerArquivo(anterior.imagemCard);
    await flash("sucesso", "Notícia atualizada.");
  } else {
    await db.insert(t.noticias).values({
      ...dados,
      imagemCapa: capa?.caminho,
      imagemCard: card?.caminho,
      autorId: usuario.id,
    });
    await flash("sucesso", dados.publicada ? "Notícia publicada." : "Rascunho salvo.");
  }
  redirect("/admin/noticias");
}

export async function excluirNoticia(fd: FormData) {
  await exigirUsuario("Admin");
  const id = inteiro(fd, "id");
  const noticia = await db.query.noticias.findFirst({ where: eq(t.noticias.id, id) });
  if (noticia) {
    await db.delete(t.noticias).where(eq(t.noticias.id, id));
    await removerArquivo(noticia.imagemCapa);
    await removerArquivo(noticia.imagemCard);
    await flash("sucesso", "Notícia excluída.");
  }
  redirect("/admin/noticias");
}
