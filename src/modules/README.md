# Módulos do domínio financeiro

Este diretório concentra regras de negócio que não dependem de React, Next.js,
Prisma ou de uma interface específica. Isso permite reutilizar as mesmas regras
em páginas, Server Actions, webhooks e, futuramente, no bot e no assistente de IA.

## Limites dos módulos

- `accounts`: contas e cálculo de saldo a partir de movimentações liquidadas.
- `categories`: classificação de receitas e despesas.
- `transactions`: receitas, despesas e lançamentos pendentes.
- `credit-cards`: limite, compras e parcelamento.
- `invoices`: fechamento, vencimento e pagamento de faturas.
- `debts`: valores devidos e amortizações.
- `savings-goals`: cofrinhos, metas e aportes.
- `recurrences`: salário, assinaturas e outros lançamentos recorrentes.
- `shared`: valores e validações compartilhados por todos os módulos.

## Regras de arquitetura

1. Arquivos em `domain` não importam Next.js, Prisma ou componentes.
2. Valores monetários são inteiros em centavos; nunca `number` decimal.
3. Server Actions autenticam, validam a entrada e chamam um caso de uso.
4. O acesso ao banco fica na infraestrutura e sempre restringe dados ao usuário.
5. Compras no cartão afetam a fatura e o limite, não o saldo da conta.
6. O saldo da conta muda quando uma movimentação é liquidada.
7. Operações compostas, como pagar uma fatura, devem usar transação no banco.
8. A IA pode analisar e sugerir, mas alterações financeiras exigem confirmação.

Quando um módulo ganhar persistência ou interface, sua evolução natural será:

```text
modulo/
├── domain/          # entidades e regras puras
├── application/     # casos de uso
├── infrastructure/  # Prisma e integrações
├── presentation/    # componentes do módulo
├── actions.ts       # Server Actions finas
└── schemas.ts       # validação da entrada externa
```
