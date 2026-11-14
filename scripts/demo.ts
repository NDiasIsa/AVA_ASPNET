import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { Pool } from "pg";
import * as t from "../src/lib/db/schema";
import { gerarHash } from "../src/lib/senha";

/** Preenche o banco local com conteúdo de exemplo. Todos os usuários usam ADMIN_SENHA. */
const connectionString = process.env.DATABASE_URL;
const senha = process.env.ADMIN_SENHA;
if (!connectionString || !senha) throw new Error("Configure DATABASE_URL e ADMIN_SENHA em .env.local.");
if (!/@(localhost|127\.0\.0\.1)[:/]/.test(connectionString)) {
  throw new Error("Os dados de demonstração só podem ser criados em um banco local.");
}

const pool = new Pool({ connectionString, max: 1 });
const db = drizzle(pool, { schema: t });

if (await db.query.turmas.findFirst()) {
  console.log("O banco já tem turmas; nada foi alterado.");
  await pool.end();
  process.exit(0);
}

const admin = await db.query.usuarios.findFirst({ where: eq(t.usuarios.tipo, "Admin") });
if (!admin) throw new Error('Rode "npm run db:setup" antes.');

const senhaHash = await gerarHash(senha);
const conta = { senhaHash, primeiroAcesso: false };
const emDias = (dias: number) => new Date(Date.now() + dias * 24 * 60 * 60 * 1000);

const [professor] = await db
  .insert(t.usuarios)
  .values({ ...conta, login: "professor@demo.local", email: "professor@demo.local", tipo: "Professor", nomeCompleto: "Marie Curie" })
  .returning();

const [turma] = await db
  .insert(t.turmas)
  .values({ codigo: "2B", ano: 2, anoLetivo: new Date().getFullYear(), descricao: "Eletromagnetismo", professorId: professor.id })
  .returning();

const [aluno] = await db
  .insert(t.usuarios)
  .values([
    { ...conta, login: "20260001", matricula: "20260001", nomeCompleto: "Ana Física", turmaId: turma.id },
    { ...conta, login: "20260002", matricula: "20260002", nomeCompleto: "Bruno Otávio", turmaId: turma.id },
    { login: "20260003", matricula: "20260003", senhaHash, nomeCompleto: "Carla Newton", turmaId: turma.id },
  ])
  .returning();

const [bim1, bim2] = await db
  .insert(t.secoes)
  .values(["1º Bimestre", "2º Bimestre", "3º Bimestre", "4º Bimestre"].map((nome, ordem) => ({ nome, ordem, turmaId: turma.id })))
  .returning();

await db.insert(t.avisos).values([
  {
    turmaId: turma.id,
    autorId: professor.id,
    texto: "Prova na próxima semana. Revisem a lei de Gauss:\n$$\\oint \\vec{E} \\cdot d\\vec{A} = \\frac{Q}{\\varepsilon_0}$$",
  },
  { turmaId: turma.id, autorId: professor.id, texto: "A lista de exercícios já está na aba Conteúdo." },
]);

await db.insert(t.publicacoes).values({
  titulo: "Videoaula: campo elétrico $\\vec{E}$",
  descricao: "Assista antes da aula. Vamos partir de $F = qE$.",
  tipo: "Link",
  url: "https://www.youtube.com/",
  secaoId: bim1.id,
  autorId: professor.id,
});

const [relatorio, teste] = await db
  .insert(t.atividades)
  .values([
    {
      titulo: "Relatório sobre a força de Lorentz",
      descricao: "Explique cada termo de $\\vec{F} = q(\\vec{E} + \\vec{v} \\times \\vec{B})$.",
      prazo: emDias(7),
      secaoId: bim1.id,
      autorId: professor.id,
    },
    {
      titulo: "Teste de energia cinética",
      descricao: "Responda com atenção: só há uma tentativa.",
      tipo: "Avaliativa" as const,
      prazo: emDias(3),
      secaoId: bim2.id,
      autorId: professor.id,
    },
  ])
  .returning();

await db.insert(t.entregas).values({
  atividadeId: relatorio.id,
  alunoId: aluno.id,
  textoResposta: "O termo magnético é sempre perpendicular a $\\vec{v}$.",
  nota: 8.5,
  feedback: "Muito bom. Faltou citar que a força magnética não realiza trabalho: $W = 0$.",
  corrigida: true,
});

const [questaoAtividade] = await db
  .insert(t.questoesAtividade)
  .values({ enunciado: "Qual a energia cinética de um corpo com $m = 2\\,kg$ e $v = 3\\,m/s$?", atividadeId: teste.id })
  .returning();
await db.insert(t.alternativasAtividade).values(
  [["$9\\,J$", true], ["$6\\,J$", false], ["$18\\,J$", false], ["$3\\,J$", false]].map(([texto, correta]) => ({
    texto: texto as string,
    correta: correta as boolean,
    questaoId: questaoAtividade.id,
  })),
);

const [quiz] = await db
  .insert(t.quizzes)
  .values({ titulo: "Ondas: $c = \\lambda f$", descricao: "Tentativas ilimitadas.", turmaId: turma.id, autorId: professor.id })
  .returning();
const [questaoQuiz] = await db
  .insert(t.questoes)
  .values({
    enunciado: "Se a frequência de uma onda dobra no mesmo meio, o que acontece com $\\lambda$?",
    explicacao: "No mesmo meio, $v$ é constante. Como $v = \\lambda f$, $\\lambda$ cai pela metade.",
    quizId: quiz.id,
  })
  .returning();
await db.insert(t.alternativas).values(
  [["Cai pela metade", true], ["Dobra", false], ["Não muda", false], ["Quadruplica", false]].map(([texto, correta]) => ({
    texto: texto as string,
    correta: correta as boolean,
    questaoId: questaoQuiz.id,
  })),
);

await db.insert(t.noticias).values([
  {
    titulo: "Semana de $\\pi$ no campus",
    resumo: "Oficinas e experimentos abertos a todas as turmas.",
    conteudo: "<p>A semana traz oficinas sobre $e^{i\\pi} + 1 = 0$ e experimentos de óptica.</p>",
    autorId: admin.id,
    publicada: true,
    destaque: true,
    card: true,
  },
  {
    titulo: "Olimpíada de Física: inscrições abertas",
    resumo: "Procure seu professor para participar.",
    conteudo: "<p>As inscrições vão até o fim do mês.</p>",
    autorId: admin.id,
    publicada: true,
    card: true,
  },
]);

await pool.end();
console.log("Dados de demonstração criados.");
