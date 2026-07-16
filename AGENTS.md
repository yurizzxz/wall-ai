# AGENTS.md

## Objetivo

Este projeto utiliza Next.js (App Router) com TypeScript.

Sempre priorize:
- código limpo
- simplicidade
- performance
- tipagem forte
- componentes reutilizáveis

---

## Stack

- Next.js
- TypeScript
- React
- Tailwind CSS
- Prisma
- PostgreSQL
- Zod

---

## Estrutura

app/
components/
lib/
services/
hooks/
types/
prisma/

Nunca criar arquivos fora dessa estrutura sem necessidade.

---

## Componentes

- Componentes devem ser pequenos.
- Evite componentes acima de 200 linhas.
- Extraia lógica para hooks quando fizer sentido.
- Evite duplicação.

---

## Tipagem

Nunca utilizar:

```ts
any
```

Prefira:

```ts
unknown
```

ou criar interfaces.

---

## Imports

Sempre utilizar aliases.

Exemplo:

```ts
import Button from "@/components/Button";
```

Evitar:

```ts
../../../components/Button
```

---

## Server Components

Sempre que possível utilizar Server Components.

Adicionar:

```ts
"use client"
```

apenas quando necessário.

---

## Banco de dados

Toda consulta deve ficar em:

```
services/
```

Nunca acessar Prisma diretamente dentro de páginas.

---

## API

Validar entradas usando Zod.

Nunca confiar nos dados enviados pelo cliente.

---

## Estilo

Utilizar Tailwind.

Evitar CSS separado.

---

## Código

Preferir:

- early return
- funções pequenas
- nomes claros
- evitar comentários desnecessários

---

## Antes de finalizar

Sempre verificar:

- TypeScript
- ESLint
- imports não utilizados
- código morto
- possíveis bugs

---

## Ao gerar código

Sempre retornar código pronto para produção.

Nunca criar código apenas ilustrativo.

Nunca deixar TODOs.

Nunca deixar funções vazias.

Nunca utilizar mocks, exceto quando solicitado.