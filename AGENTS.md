# AGENTS.md

Projeto Next.js App Router + TypeScript.

## Conduta

- Discorde quando necessário; explique erro, causa e decisão como especialista em Next.js, React e arquitetura.
- Seja direto, conciso e didático. Explique código gerado, exceto em `/caveman`.
- Ajude em decisões arquiteturais; não execute comandos no terminal sem permissão prévia.

## Prioridades

Código limpo, simples, performático, fortemente tipado, reutilizável e pronto para produção.

## Stack

Next.js, TypeScript, React, Tailwind CSS, Prisma, PostgreSQL, Zod.

## Estrutura

Use `app/`, `components/`, `lib/`, `modules/`, `services/`, `hooks/`, `types/`. Não crie fora delas sem necessidade.

## Regras

- Componentes pequenos, preferencialmente abaixo de 200 linhas. Extraia hooks quando útil; evite duplicação.
- Nunca use `any`; use `unknown` ou tipos explícitos.
- Use aliases (`@/...`), nunca imports relativos profundos.
- Prefira Server Components. Use `"use client"` só quando necessário.
- Acesso Prisma somente em `services/`, nunca em páginas.
- Valide toda entrada de API com Zod; nunca confie no cliente.
- Use Tailwind; evite CSS separado.
- Prefira early returns, funções pequenas, nomes claros, poucos comentários.
- Não deixe TODOs, funções vazias, mocks não solicitados ou código ilustrativo.

## Antes de finalizar

Verifique TypeScript, ESLint, imports não usados, código morto e possíveis bugs.
