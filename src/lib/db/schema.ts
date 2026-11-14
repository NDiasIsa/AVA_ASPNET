import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

const momento = (nome: string) => timestamp(nome, { withTimezone: true, mode: "date" });

/**
 * Aluno entra com matrícula; professor e admin entram com e-mail.
 * O campo `login` guarda a matrícula ou o e-mail em minúsculas.
 */
export const usuarios = pgTable(
  "usuarios",
  {
    id: serial("id").primaryKey(),
    login: varchar("login", { length: 256 }).notNull(),
    email: varchar("email", { length: 256 }),
    senhaHash: text("senha_hash").notNull(),
    /** Incrementada ao trocar a senha, para encerrar sessões antigas. */
    sessaoVersao: integer("sessao_versao").notNull().default(0),
    tipo: varchar("tipo", { length: 20 }).$type<TipoUsuario>().notNull().default("Aluno"),
    nomeCompleto: varchar("nome_completo", { length: 150 }).notNull(),
    matricula: varchar("matricula", { length: 20 }),
    primeiroAcesso: boolean("primeiro_acesso").notNull().default(true),
    emailPessoal: varchar("email_pessoal", { length: 256 }),
    ativo: boolean("ativo").notNull().default(true),
    turmaId: integer("turma_id").references((): any => turmas.id, { onDelete: "set null" }),
  },
  (t) => [
    uniqueIndex("usuarios_login_idx").on(t.login),
    uniqueIndex("usuarios_email_idx").on(t.email).where(sql`${t.email} IS NOT NULL`),
    uniqueIndex("usuarios_matricula_idx").on(t.matricula).where(sql`${t.matricula} IS NOT NULL`),
    index("usuarios_turma_idx").on(t.turmaId),
  ],
);

export type TipoUsuario = "Aluno" | "Professor" | "Admin";

export const tokensSenha = pgTable("tokens_senha", {
  tokenHash: varchar("token_hash", { length: 64 }).primaryKey(),
  usuarioId: integer("usuario_id")
    .notNull()
    .references(() => usuarios.id, { onDelete: "cascade" }),
  expiraEm: momento("expira_em").notNull(),
});

export const anosLetivos = pgTable(
  "anos_letivos",
  {
    id: serial("id").primaryKey(),
    ano: integer("ano").notNull(),
    ativo: boolean("ativo").notNull().default(false),
    dataInicio: momento("data_inicio").notNull().defaultNow(),
  },
  (t) => [index("anos_letivos_ativo_idx").on(t.ativo)],
);

export const turmas = pgTable("turmas", {
  id: serial("id").primaryKey(),
  codigo: varchar("codigo", { length: 10 }).notNull(),
  descricao: varchar("descricao", { length: 100 }),
  ano: integer("ano").notNull(),
  anoLetivo: integer("ano_letivo").notNull(),
  professorId: integer("professor_id")
    .notNull()
    .references(() => usuarios.id, { onDelete: "restrict" }),
});

export const noticias = pgTable("noticias", {
  id: serial("id").primaryKey(),
  titulo: varchar("titulo", { length: 200 }).notNull(),
  resumo: varchar("resumo", { length: 300 }),
  conteudo: text("conteudo").notNull(),
  imagemCapa: text("imagem_capa"),
  imagemCard: text("imagem_card"),
  corTitulo: varchar("cor_titulo", { length: 7 }).notNull().default("#f2f1ec"),
  autorId: integer("autor_id")
    .notNull()
    .references(() => usuarios.id, { onDelete: "restrict" }),
  dataPublicacao: momento("data_publicacao").notNull().defaultNow(),
  publicada: boolean("publicada").notNull().default(false),
  destaque: boolean("destaque").notNull().default(false),
  card: boolean("card").notNull().default(false),
});

export const secoes = pgTable(
  "secoes",
  {
    id: serial("id").primaryKey(),
    nome: varchar("nome", { length: 100 }).notNull(),
    ordem: integer("ordem").notNull().default(0),
    /** "Completa" = material e atividade; "SoAtividade" = só atividade. */
    tipo: varchar("tipo", { length: 20 }).$type<"Completa" | "SoAtividade">().notNull().default("Completa"),
    turmaId: integer("turma_id")
      .notNull()
      .references(() => turmas.id, { onDelete: "cascade" }),
  },
  (t) => [index("secoes_turma_idx").on(t.turmaId)],
);

export const avisos = pgTable(
  "avisos",
  {
    id: serial("id").primaryKey(),
    texto: text("texto").notNull(),
    turmaId: integer("turma_id")
      .notNull()
      .references(() => turmas.id, { onDelete: "cascade" }),
    autorId: integer("autor_id")
      .notNull()
      .references(() => usuarios.id, { onDelete: "restrict" }),
    dataPublicacao: momento("data_publicacao").notNull().defaultNow(),
  },
  (t) => [index("avisos_turma_idx").on(t.turmaId)],
);

export const publicacoes = pgTable(
  "publicacoes",
  {
    id: serial("id").primaryKey(),
    titulo: varchar("titulo", { length: 200 }).notNull(),
    descricao: text("descricao"),
    tipo: varchar("tipo", { length: 20 }).$type<"Arquivo" | "Link">().notNull().default("Arquivo"),
    /** Caminho no armazenamento (Arquivo) ou endereço externo (Link). */
    url: text("url"),
    nomeArquivo: text("nome_arquivo"),
    secaoId: integer("secao_id")
      .notNull()
      .references(() => secoes.id, { onDelete: "cascade" }),
    autorId: integer("autor_id")
      .notNull()
      .references(() => usuarios.id, { onDelete: "restrict" }),
    dataPublicacao: momento("data_publicacao").notNull().defaultNow(),
  },
  (t) => [index("publicacoes_secao_idx").on(t.secaoId)],
);

export const atividades = pgTable(
  "atividades",
  {
    id: serial("id").primaryKey(),
    titulo: varchar("titulo", { length: 200 }).notNull(),
    descricao: text("descricao"),
    arquivo: text("arquivo"),
    nomeArquivo: text("nome_arquivo"),
    prazo: momento("prazo"),
    valorMaximo: numeric("valor_maximo", { precision: 4, scale: 1, mode: "number" }).notNull().default(10),
    tipo: varchar("tipo", { length: 20 }).$type<"Entrega" | "Avaliativa">().notNull().default("Entrega"),
    secaoId: integer("secao_id")
      .notNull()
      .references(() => secoes.id, { onDelete: "cascade" }),
    autorId: integer("autor_id")
      .notNull()
      .references(() => usuarios.id, { onDelete: "restrict" }),
    dataPublicacao: momento("data_publicacao").notNull().defaultNow(),
  },
  (t) => [index("atividades_secao_idx").on(t.secaoId)],
);

export const entregas = pgTable(
  "entregas_atividade",
  {
    id: serial("id").primaryKey(),
    atividadeId: integer("atividade_id")
      .notNull()
      .references(() => atividades.id, { onDelete: "cascade" }),
    alunoId: integer("aluno_id")
      .notNull()
      .references(() => usuarios.id, { onDelete: "restrict" }),
    arquivo: text("arquivo"),
    nomeArquivo: text("nome_arquivo"),
    textoResposta: text("texto_resposta"),
    dataEntrega: momento("data_entrega").notNull().defaultNow(),
    nota: numeric("nota", { precision: 4, scale: 1, mode: "number" }),
    feedback: text("feedback"),
    corrigida: boolean("corrigida").notNull().default(false),
  },
  (t) => [uniqueIndex("entregas_atividade_aluno_idx").on(t.atividadeId, t.alunoId)],
);

export const questoesAtividade = pgTable(
  "questoes_atividade",
  {
    id: serial("id").primaryKey(),
    enunciado: text("enunciado").notNull(),
    imagem: text("imagem"),
    ordem: integer("ordem").notNull().default(0),
    atividadeId: integer("atividade_id")
      .notNull()
      .references(() => atividades.id, { onDelete: "cascade" }),
  },
  (t) => [index("questoes_atividade_idx").on(t.atividadeId)],
);

export const alternativasAtividade = pgTable(
  "alternativas_atividade",
  {
    id: serial("id").primaryKey(),
    texto: varchar("texto", { length: 500 }).notNull(),
    correta: boolean("correta").notNull().default(false),
    questaoId: integer("questao_id")
      .notNull()
      .references(() => questoesAtividade.id, { onDelete: "cascade" }),
  },
  (t) => [index("alternativas_atividade_idx").on(t.questaoId)],
);

export const respostasAtividade = pgTable(
  "respostas_atividade",
  {
    id: serial("id").primaryKey(),
    atividadeId: integer("atividade_id")
      .notNull()
      .references(() => atividades.id, { onDelete: "cascade" }),
    alunoId: integer("aluno_id")
      .notNull()
      .references(() => usuarios.id, { onDelete: "restrict" }),
    totalQuestoes: integer("total_questoes").notNull(),
    totalAcertos: integer("total_acertos").notNull(),
    nota: numeric("nota", { precision: 4, scale: 1, mode: "number" }).notNull(),
    dataResposta: momento("data_resposta").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("respostas_atividade_aluno_idx").on(t.atividadeId, t.alunoId)],
);

export const quizzes = pgTable(
  "quizzes",
  {
    id: serial("id").primaryKey(),
    titulo: varchar("titulo", { length: 200 }).notNull(),
    descricao: text("descricao"),
    turmaId: integer("turma_id")
      .notNull()
      .references(() => turmas.id, { onDelete: "cascade" }),
    autorId: integer("autor_id")
      .notNull()
      .references(() => usuarios.id, { onDelete: "restrict" }),
    dataPublicacao: momento("data_publicacao").notNull().defaultNow(),
    ativo: boolean("ativo").notNull().default(true),
  },
  (t) => [index("quizzes_turma_idx").on(t.turmaId)],
);

export const questoes = pgTable(
  "questoes",
  {
    id: serial("id").primaryKey(),
    enunciado: text("enunciado").notNull(),
    explicacao: text("explicacao"),
    tipoExplicacao: varchar("tipo_explicacao", { length: 10 })
      .$type<"Texto" | "Imagem" | "Video">()
      .notNull()
      .default("Texto"),
    /** Caminho da imagem no armazenamento ou link do YouTube. */
    explicacaoMidia: text("explicacao_midia"),
    imagem: text("imagem"),
    ordem: integer("ordem").notNull().default(0),
    quizId: integer("quiz_id")
      .notNull()
      .references(() => quizzes.id, { onDelete: "cascade" }),
  },
  (t) => [index("questoes_quiz_idx").on(t.quizId)],
);

export const alternativas = pgTable(
  "alternativas",
  {
    id: serial("id").primaryKey(),
    texto: varchar("texto", { length: 500 }).notNull(),
    correta: boolean("correta").notNull().default(false),
    questaoId: integer("questao_id")
      .notNull()
      .references(() => questoes.id, { onDelete: "cascade" }),
  },
  (t) => [index("alternativas_questao_idx").on(t.questaoId)],
);

export const resultadosQuiz = pgTable(
  "resultados_quiz",
  {
    id: serial("id").primaryKey(),
    quizId: integer("quiz_id")
      .notNull()
      .references(() => quizzes.id, { onDelete: "cascade" }),
    alunoId: integer("aluno_id")
      .notNull()
      .references(() => usuarios.id, { onDelete: "restrict" }),
    totalQuestoes: integer("total_questoes").notNull(),
    totalAcertos: integer("total_acertos").notNull(),
    pontuacao: numeric("pontuacao", { precision: 5, scale: 2, mode: "number" }).notNull(),
    dataRealizacao: momento("data_realizacao").notNull().defaultNow(),
  },
  (t) => [index("resultados_quiz_idx").on(t.quizId)],
);

// ── Relações ─────────────────────────────────────────────────

export const usuariosRel = relations(usuarios, ({ one }) => ({
  turma: one(turmas, { fields: [usuarios.turmaId], references: [turmas.id], relationName: "alunos" }),
}));

export const turmasRel = relations(turmas, ({ one, many }) => ({
  professor: one(usuarios, { fields: [turmas.professorId], references: [usuarios.id] }),
  alunos: many(usuarios, { relationName: "alunos" }),
  secoes: many(secoes),
  avisos: many(avisos),
  quizzes: many(quizzes),
}));

export const noticiasRel = relations(noticias, ({ one }) => ({
  autor: one(usuarios, { fields: [noticias.autorId], references: [usuarios.id] }),
}));

export const secoesRel = relations(secoes, ({ one, many }) => ({
  turma: one(turmas, { fields: [secoes.turmaId], references: [turmas.id] }),
  publicacoes: many(publicacoes),
  atividades: many(atividades),
}));

export const avisosRel = relations(avisos, ({ one }) => ({
  turma: one(turmas, { fields: [avisos.turmaId], references: [turmas.id] }),
  autor: one(usuarios, { fields: [avisos.autorId], references: [usuarios.id] }),
}));

export const publicacoesRel = relations(publicacoes, ({ one }) => ({
  secao: one(secoes, { fields: [publicacoes.secaoId], references: [secoes.id] }),
  autor: one(usuarios, { fields: [publicacoes.autorId], references: [usuarios.id] }),
}));

export const atividadesRel = relations(atividades, ({ one, many }) => ({
  secao: one(secoes, { fields: [atividades.secaoId], references: [secoes.id] }),
  autor: one(usuarios, { fields: [atividades.autorId], references: [usuarios.id] }),
  entregas: many(entregas),
  questoes: many(questoesAtividade),
  respostas: many(respostasAtividade),
}));

export const entregasRel = relations(entregas, ({ one }) => ({
  atividade: one(atividades, { fields: [entregas.atividadeId], references: [atividades.id] }),
  aluno: one(usuarios, { fields: [entregas.alunoId], references: [usuarios.id] }),
}));

export const questoesAtividadeRel = relations(questoesAtividade, ({ one, many }) => ({
  atividade: one(atividades, { fields: [questoesAtividade.atividadeId], references: [atividades.id] }),
  alternativas: many(alternativasAtividade),
}));

export const alternativasAtividadeRel = relations(alternativasAtividade, ({ one }) => ({
  questao: one(questoesAtividade, { fields: [alternativasAtividade.questaoId], references: [questoesAtividade.id] }),
}));

export const respostasAtividadeRel = relations(respostasAtividade, ({ one }) => ({
  atividade: one(atividades, { fields: [respostasAtividade.atividadeId], references: [atividades.id] }),
  aluno: one(usuarios, { fields: [respostasAtividade.alunoId], references: [usuarios.id] }),
}));

export const quizzesRel = relations(quizzes, ({ one, many }) => ({
  turma: one(turmas, { fields: [quizzes.turmaId], references: [turmas.id] }),
  autor: one(usuarios, { fields: [quizzes.autorId], references: [usuarios.id] }),
  questoes: many(questoes),
  resultados: many(resultadosQuiz),
}));

export const questoesRel = relations(questoes, ({ one, many }) => ({
  quiz: one(quizzes, { fields: [questoes.quizId], references: [quizzes.id] }),
  alternativas: many(alternativas),
}));

export const alternativasRel = relations(alternativas, ({ one }) => ({
  questao: one(questoes, { fields: [alternativas.questaoId], references: [questoes.id] }),
}));

export const resultadosQuizRel = relations(resultadosQuiz, ({ one }) => ({
  quiz: one(quizzes, { fields: [resultadosQuiz.quizId], references: [quizzes.id] }),
  aluno: one(usuarios, { fields: [resultadosQuiz.alunoId], references: [usuarios.id] }),
}));
