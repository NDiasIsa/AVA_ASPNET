# QuantumPinheiral

Ambiente virtual de aprendizagem do IFRJ, Campus Pinheiral.

Feito com Next.js e TypeScript, Drizzle ORM sobre PostgreSQL (Neon), Vercel Blob privado para arquivos e KaTeX para fórmulas.

## Publicar pela primeira vez

1. **Banco:** crie um projeto no [Neon](https://neon.tech), de preferência na região de São Paulo se estiver disponível, e copie as duas conexões, com e sem pooler.
2. **Projeto:** importe este repositório na [Vercel](https://vercel.com). A Vercel detecta o Next.js sozinha.
3. **Arquivos:** em **Storage > Create > Blob**, crie um store com acesso **Private** e conecte ao projeto. A variável `BLOB_READ_WRITE_TOKEN` é criada automaticamente. O store precisa ser privado; num store público, as entregas dos alunos ficariam acessíveis por link.
4. **Variáveis:** cadastre `DATABASE_URL` e `AUTH_SECRET` na Vercel, conforme o [.env.example](.env.example).
5. **Tabelas e administrador:** na sua máquina, crie um `.env.local` com `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `ADMIN_EMAIL` e `ADMIN_SENHA`, e rode:

   ```bash
   npm install
   ```

   ```bash
   npm run db:setup
   ```

6. Faça um novo deploy e entre com o e-mail e a senha do administrador.

Sempre que o esquema do banco mudar, rode `npm run db:generate` e depois `npm run db:migrate`.

## Desenvolver localmente

```bash
cp .env.example .env.local
```

Preencha o arquivo. Para dispensar a conta na Vercel durante o desenvolvimento, deixe `BLOB_READ_WRITE_TOKEN` vazio e defina `NEXT_PUBLIC_UPLOAD_LOCAL=1`: os arquivos vão para a pasta `.data/`.

```bash
npm run db:setup
```

```bash
npm run dev
```

Verificações:

```bash
npm run typecheck
```

```bash
npm test
```

## Fórmulas em LaTeX

Títulos, avisos, descrições, enunciados, alternativas, explicações, feedbacks, respostas de alunos e notícias aceitam fórmulas:

| Escrita | Resultado |
| --- | --- |
| `$E = mc^2$` | Fórmula na linha |
| `$$\int_a^b f(x)\,dx$$` | Fórmula em destaque |
| `\(a\)` e `\[b\]` | Delimitadores alternativos |
| `\$` | Cifrão literal |

Preços como `R$ 10` continuam sendo texto. Os campos mostram uma pré-visualização enquanto a pessoa digita.

## Recuperação de senha

O fluxo está pronto, mas ainda não há serviço de e-mail. Para ativar, implemente o envio em [src/lib/email.ts](src/lib/email.ts). Até lá, nenhuma mensagem é entregue em produção.

## Organização

- `src/app`: páginas e rotas
- `src/actions`: ações do servidor, com as regras de negócio e de permissão
- `src/components`: componentes da interface
- `src/lib`: banco, sessão, armazenamento, LaTeX e utilitários
- `drizzle`: migrations do banco
- `scripts`: migrations e criação do administrador
