CREATE TABLE "alternativas" (
	"id" serial PRIMARY KEY NOT NULL,
	"texto" varchar(500) NOT NULL,
	"correta" boolean DEFAULT false NOT NULL,
	"questao_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alternativas_atividade" (
	"id" serial PRIMARY KEY NOT NULL,
	"texto" varchar(500) NOT NULL,
	"correta" boolean DEFAULT false NOT NULL,
	"questao_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "anos_letivos" (
	"id" serial PRIMARY KEY NOT NULL,
	"ano" integer NOT NULL,
	"ativo" boolean DEFAULT false NOT NULL,
	"data_inicio" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "atividades" (
	"id" serial PRIMARY KEY NOT NULL,
	"titulo" varchar(200) NOT NULL,
	"descricao" text,
	"arquivo" text,
	"nome_arquivo" text,
	"prazo" timestamp with time zone,
	"valor_maximo" numeric(4, 1) DEFAULT 10 NOT NULL,
	"tipo" varchar(20) DEFAULT 'Entrega' NOT NULL,
	"secao_id" integer NOT NULL,
	"autor_id" integer NOT NULL,
	"data_publicacao" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "avisos" (
	"id" serial PRIMARY KEY NOT NULL,
	"texto" text NOT NULL,
	"turma_id" integer NOT NULL,
	"autor_id" integer NOT NULL,
	"data_publicacao" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entregas_atividade" (
	"id" serial PRIMARY KEY NOT NULL,
	"atividade_id" integer NOT NULL,
	"aluno_id" integer NOT NULL,
	"arquivo" text,
	"nome_arquivo" text,
	"texto_resposta" text,
	"data_entrega" timestamp with time zone DEFAULT now() NOT NULL,
	"nota" numeric(4, 1),
	"feedback" text,
	"corrigida" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "noticias" (
	"id" serial PRIMARY KEY NOT NULL,
	"titulo" varchar(200) NOT NULL,
	"resumo" varchar(300),
	"conteudo" text NOT NULL,
	"imagem_capa" text,
	"imagem_card" text,
	"cor_titulo" varchar(7) DEFAULT '#f2f1ec' NOT NULL,
	"autor_id" integer NOT NULL,
	"data_publicacao" timestamp with time zone DEFAULT now() NOT NULL,
	"publicada" boolean DEFAULT false NOT NULL,
	"destaque" boolean DEFAULT false NOT NULL,
	"card" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "publicacoes" (
	"id" serial PRIMARY KEY NOT NULL,
	"titulo" varchar(200) NOT NULL,
	"descricao" text,
	"tipo" varchar(20) DEFAULT 'Arquivo' NOT NULL,
	"url" text,
	"nome_arquivo" text,
	"secao_id" integer NOT NULL,
	"autor_id" integer NOT NULL,
	"data_publicacao" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questoes" (
	"id" serial PRIMARY KEY NOT NULL,
	"enunciado" text NOT NULL,
	"explicacao" text,
	"tipo_explicacao" varchar(10) DEFAULT 'Texto' NOT NULL,
	"explicacao_midia" text,
	"imagem" text,
	"ordem" integer DEFAULT 0 NOT NULL,
	"quiz_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questoes_atividade" (
	"id" serial PRIMARY KEY NOT NULL,
	"enunciado" text NOT NULL,
	"imagem" text,
	"ordem" integer DEFAULT 0 NOT NULL,
	"atividade_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quizzes" (
	"id" serial PRIMARY KEY NOT NULL,
	"titulo" varchar(200) NOT NULL,
	"descricao" text,
	"turma_id" integer NOT NULL,
	"autor_id" integer NOT NULL,
	"data_publicacao" timestamp with time zone DEFAULT now() NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "respostas_atividade" (
	"id" serial PRIMARY KEY NOT NULL,
	"atividade_id" integer NOT NULL,
	"aluno_id" integer NOT NULL,
	"total_questoes" integer NOT NULL,
	"total_acertos" integer NOT NULL,
	"nota" numeric(4, 1) NOT NULL,
	"data_resposta" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resultados_quiz" (
	"id" serial PRIMARY KEY NOT NULL,
	"quiz_id" integer NOT NULL,
	"aluno_id" integer NOT NULL,
	"total_questoes" integer NOT NULL,
	"total_acertos" integer NOT NULL,
	"pontuacao" numeric(5, 2) NOT NULL,
	"data_realizacao" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "secoes" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" varchar(100) NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL,
	"tipo" varchar(20) DEFAULT 'Completa' NOT NULL,
	"turma_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tokens_senha" (
	"token_hash" varchar(64) PRIMARY KEY NOT NULL,
	"usuario_id" integer NOT NULL,
	"expira_em" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "turmas" (
	"id" serial PRIMARY KEY NOT NULL,
	"codigo" varchar(10) NOT NULL,
	"descricao" varchar(100),
	"ano" integer NOT NULL,
	"ano_letivo" integer NOT NULL,
	"professor_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usuarios" (
	"id" serial PRIMARY KEY NOT NULL,
	"login" varchar(256) NOT NULL,
	"email" varchar(256),
	"senha_hash" text NOT NULL,
	"sessao_versao" integer DEFAULT 0 NOT NULL,
	"tipo" varchar(20) DEFAULT 'Aluno' NOT NULL,
	"nome_completo" varchar(150) NOT NULL,
	"matricula" varchar(20),
	"primeiro_acesso" boolean DEFAULT true NOT NULL,
	"email_pessoal" varchar(256),
	"ativo" boolean DEFAULT true NOT NULL,
	"turma_id" integer
);
--> statement-breakpoint
ALTER TABLE "alternativas" ADD CONSTRAINT "alternativas_questao_id_questoes_id_fk" FOREIGN KEY ("questao_id") REFERENCES "public"."questoes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alternativas_atividade" ADD CONSTRAINT "alternativas_atividade_questao_id_questoes_atividade_id_fk" FOREIGN KEY ("questao_id") REFERENCES "public"."questoes_atividade"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atividades" ADD CONSTRAINT "atividades_secao_id_secoes_id_fk" FOREIGN KEY ("secao_id") REFERENCES "public"."secoes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atividades" ADD CONSTRAINT "atividades_autor_id_usuarios_id_fk" FOREIGN KEY ("autor_id") REFERENCES "public"."usuarios"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "avisos" ADD CONSTRAINT "avisos_turma_id_turmas_id_fk" FOREIGN KEY ("turma_id") REFERENCES "public"."turmas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "avisos" ADD CONSTRAINT "avisos_autor_id_usuarios_id_fk" FOREIGN KEY ("autor_id") REFERENCES "public"."usuarios"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entregas_atividade" ADD CONSTRAINT "entregas_atividade_atividade_id_atividades_id_fk" FOREIGN KEY ("atividade_id") REFERENCES "public"."atividades"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entregas_atividade" ADD CONSTRAINT "entregas_atividade_aluno_id_usuarios_id_fk" FOREIGN KEY ("aluno_id") REFERENCES "public"."usuarios"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "noticias" ADD CONSTRAINT "noticias_autor_id_usuarios_id_fk" FOREIGN KEY ("autor_id") REFERENCES "public"."usuarios"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publicacoes" ADD CONSTRAINT "publicacoes_secao_id_secoes_id_fk" FOREIGN KEY ("secao_id") REFERENCES "public"."secoes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publicacoes" ADD CONSTRAINT "publicacoes_autor_id_usuarios_id_fk" FOREIGN KEY ("autor_id") REFERENCES "public"."usuarios"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questoes" ADD CONSTRAINT "questoes_quiz_id_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questoes_atividade" ADD CONSTRAINT "questoes_atividade_atividade_id_atividades_id_fk" FOREIGN KEY ("atividade_id") REFERENCES "public"."atividades"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_turma_id_turmas_id_fk" FOREIGN KEY ("turma_id") REFERENCES "public"."turmas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_autor_id_usuarios_id_fk" FOREIGN KEY ("autor_id") REFERENCES "public"."usuarios"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "respostas_atividade" ADD CONSTRAINT "respostas_atividade_atividade_id_atividades_id_fk" FOREIGN KEY ("atividade_id") REFERENCES "public"."atividades"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "respostas_atividade" ADD CONSTRAINT "respostas_atividade_aluno_id_usuarios_id_fk" FOREIGN KEY ("aluno_id") REFERENCES "public"."usuarios"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resultados_quiz" ADD CONSTRAINT "resultados_quiz_quiz_id_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resultados_quiz" ADD CONSTRAINT "resultados_quiz_aluno_id_usuarios_id_fk" FOREIGN KEY ("aluno_id") REFERENCES "public"."usuarios"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "secoes" ADD CONSTRAINT "secoes_turma_id_turmas_id_fk" FOREIGN KEY ("turma_id") REFERENCES "public"."turmas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tokens_senha" ADD CONSTRAINT "tokens_senha_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "turmas" ADD CONSTRAINT "turmas_professor_id_usuarios_id_fk" FOREIGN KEY ("professor_id") REFERENCES "public"."usuarios"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_turma_id_turmas_id_fk" FOREIGN KEY ("turma_id") REFERENCES "public"."turmas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "alternativas_questao_idx" ON "alternativas" USING btree ("questao_id");--> statement-breakpoint
CREATE INDEX "alternativas_atividade_idx" ON "alternativas_atividade" USING btree ("questao_id");--> statement-breakpoint
CREATE INDEX "anos_letivos_ativo_idx" ON "anos_letivos" USING btree ("ativo");--> statement-breakpoint
CREATE INDEX "atividades_secao_idx" ON "atividades" USING btree ("secao_id");--> statement-breakpoint
CREATE INDEX "avisos_turma_idx" ON "avisos" USING btree ("turma_id");--> statement-breakpoint
CREATE UNIQUE INDEX "entregas_atividade_aluno_idx" ON "entregas_atividade" USING btree ("atividade_id","aluno_id");--> statement-breakpoint
CREATE INDEX "publicacoes_secao_idx" ON "publicacoes" USING btree ("secao_id");--> statement-breakpoint
CREATE INDEX "questoes_quiz_idx" ON "questoes" USING btree ("quiz_id");--> statement-breakpoint
CREATE INDEX "questoes_atividade_idx" ON "questoes_atividade" USING btree ("atividade_id");--> statement-breakpoint
CREATE INDEX "quizzes_turma_idx" ON "quizzes" USING btree ("turma_id");--> statement-breakpoint
CREATE UNIQUE INDEX "respostas_atividade_aluno_idx" ON "respostas_atividade" USING btree ("atividade_id","aluno_id");--> statement-breakpoint
CREATE INDEX "resultados_quiz_idx" ON "resultados_quiz" USING btree ("quiz_id");--> statement-breakpoint
CREATE INDEX "secoes_turma_idx" ON "secoes" USING btree ("turma_id");--> statement-breakpoint
CREATE UNIQUE INDEX "usuarios_login_idx" ON "usuarios" USING btree ("login");--> statement-breakpoint
CREATE UNIQUE INDEX "usuarios_email_idx" ON "usuarios" USING btree ("email") WHERE "usuarios"."email" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "usuarios_matricula_idx" ON "usuarios" USING btree ("matricula") WHERE "usuarios"."matricula" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "usuarios_turma_idx" ON "usuarios" USING btree ("turma_id");