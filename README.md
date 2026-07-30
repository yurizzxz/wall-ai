# Wallai

Aplicação web para organização de finanças pessoais. Centraliza contas,
lançamentos, cartões, faturas, dívidas, cofrinhos e recorrências em uma
interface simples e responsiva.

## Funcionalidades

- autenticação por e-mail/senha e Google;
- contas financeiras e acompanhamento de saldo;
- categorias de receitas, despesas ou uso misto;
- lançamentos pendentes, liquidados e cancelados;
- compras no cartão em até 48 parcelas;
- geração e pagamento de faturas;
- controle e pagamento parcial de dívidas;
- cofrinhos com aportes vinculados a contas;
- recorrências semanais, mensais ou anuais;
- dashboard com indicadores, gráficos e carregamento progressivo;
- tabelas paginadas e estados de carregamento por rota.

## Stack

- Next.js 16 com App Router;
- React 19 e TypeScript;
- PostgreSQL;
- Drizzle ORM e Drizzle Kit;
- Better Auth;
- Next Safe Action e Zod;
- React Hook Form;
- Tailwind CSS, Base UI e componentes shadcn;
- TanStack Table;
- Recharts;
- Vercel Cron.

## Requisitos

- Node.js 20 ou superior;
- pnpm;
- banco PostgreSQL;
- credenciais OAuth do Google, caso o login social seja utilizado.

## Configuração local

Instale as dependências:

```bash
pnpm install
```

Crie um arquivo `.env` na raiz:

```dotenv
DATABASE_URL=postgresql://usuario:senha@host/banco
BETTER_AUTH_SECRET=gere-uma-chave-aleatoria-com-pelo-menos-32-caracteres
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
CRON_SECRET=gere-uma-chave-aleatoria
```

Não versione arquivos `.env`. Em ambientes serverless, prefira uma URL
PostgreSQL com pool de conexões.

Sincronize o schema em um banco de desenvolvimento:

```bash
pnpm exec drizzle-kit push
```

Inicie a aplicação:

```bash
pnpm dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Scripts

| Comando | Finalidade |
| --- | --- |
| `pnpm dev` | inicia o servidor de desenvolvimento |
| `pnpm build` | gera o build de produção |
| `pnpm start` | executa o build de produção |
| `pnpm lint` | executa o ESLint |
| `pnpm test` | compila e executa os testes com Node Test Runner |

## Rotas

| Rota | Finalidade |
| --- | --- |
| `/sign-in` | acesso por e-mail ou Google |
| `/sign-up` | criação de conta |
| `/dashboard` | visão geral financeira |
| `/dashboard/accounts` | contas e saldos |
| `/dashboard/categories` | categorias |
| `/dashboard/credit-cards` | cartões e limites |
| `/dashboard/invoices` | faturas |
| `/dashboard/debts` | dívidas |
| `/dashboard/savings-goals` | cofrinhos |
| `/dashboard/recurrences` | lançamentos recorrentes |
| `/dashboard/transactions` | histórico de lançamentos |
| `/api/auth/[...all]` | endpoints do Better Auth |
| `/api/jobs/process-recurrences` | processamento protegido de recorrências |

## Estrutura

```text
src/
├── actions/       # Server Actions, schemas Zod e tratamento de erros
├── app/           # rotas, layouts, páginas e loading states
├── components/    # componentes comuns e primitives de UI
├── db/            # conexão, schemas e relações Drizzle
├── lib/           # autenticação, formatadores e utilitários
├── modules/       # domínio e casos de uso
└── services/      # repositórios e integrações de infraestrutura
```

O projeto segue um monólito modular:

```text
UI → Server Action/Page → Application → Domain
                             ↓
                         Repository → PostgreSQL
```

## Documentação técnica

- [Arquitetura](docs/ARCHITECTURE.md)
- [Regras de domínio](docs/DOMAIN.md)
- [Banco de dados](docs/DATABASE.md)
- [Operação e deploy](docs/OPERATIONS.md)

## Estado atual

O projeto está funcional, mas ainda possui itens planejados:

- edição de cartões e categorias;
- pular uma ocorrência sem desativar a recorrência;
- paginação server-side nas listagens além de lançamentos;
- observabilidade e rate limiting;
- integração com IA e canais externos.

