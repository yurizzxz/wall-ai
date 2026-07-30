# Operação e deploy

## Variáveis de ambiente

| Variável | Obrigatória | Finalidade |
| --- | --- | --- |
| `DATABASE_URL` | sim | conexão PostgreSQL |
| `BETTER_AUTH_SECRET` | sim | assinatura e criptografia do Better Auth |
| `BETTER_AUTH_URL` | sim | URL pública da aplicação |
| `GOOGLE_CLIENT_ID` | para Google | cliente OAuth |
| `GOOGLE_CLIENT_SECRET` | para Google | segredo OAuth |
| `CRON_SECRET` | sim em produção | autenticação do job |

Use segredos diferentes por ambiente. Nunca copie credenciais de produção para
Preview ou desenvolvimento.

## Google OAuth

No Google Cloud Console, configure a origem e o callback do ambiente.

Exemplo local:

```text
Origem:   http://localhost:3000
Callback: http://localhost:3000/api/auth/callback/google
```

Em produção, substitua pela URL definida em `BETTER_AUTH_URL`.

## Vercel

1. configure todas as variáveis em Project Settings;
2. use uma conexão PostgreSQL com pooling;
3. mantenha Function e banco na mesma região;
4. faça um novo deploy após alterar variáveis;
5. confirme o cron em Settings → Cron Jobs.

O `vercel.json` agenda:

```text
GET /api/jobs/process-recurrences
0 6 * * *  → diariamente às 06:00 UTC
```

Quando `CRON_SECRET` existe, a Vercel envia automaticamente:

```http
Authorization: Bearer <CRON_SECRET>
```

O endpoint compara o segredo em tempo constante, processa as recorrências
vencidas e revalida as páginas afetadas.

## Execução manual do job

Para diagnóstico, envie uma requisição autenticada:

```bash
curl \
  -H "Authorization: Bearer SEU_CRON_SECRET" \
  http://localhost:3000/api/jobs/process-recurrences
```

Não exponha esse endpoint sem autenticação.

Resposta:

```json
{
  "processed": 0,
  "failed": 0
}
```

Falhas individuais são registradas no servidor e não interrompem todo o lote.

## Banco serverless

Para Neon ou provedor semelhante:

- selecione a mesma região da Vercel;
- utilize endpoint com pool;
- monitore conexões e queries lentas;
- considere manter o compute ativo se o despertar estiver afetando a primeira
  requisição;
- aumente compute somente depois de medir.

## Observabilidade recomendada

O projeto ainda usa logs padrão. Para produção com tráfego relevante, adicione:

- rastreamento de exceções;
- logs estruturados com request ID;
- duração das queries;
- métricas do cron;
- alertas para recorrências com falha;
- Core Web Vitals;
- auditoria de alterações financeiras.

## Checklist de release

```text
[ ] schema revisado e migration aplicada
[ ] variáveis configuradas no ambiente correto
[ ] build concluído
[ ] lint concluído
[ ] testes concluídos
[ ] login por e-mail validado
[ ] login Google validado
[ ] criação e cancelamento de lançamento validados
[ ] compra parcelada e fatura validadas
[ ] pagamento de fatura validado
[ ] cron executado com autenticação
[ ] logs e erros revisados
```

## Segurança operacional

- rotacione qualquer segredo exposto;
- não registre payloads contendo credenciais;
- mantenha `CRON_SECRET` aleatório;
- valide toda mutação no servidor;
- preserve o escopo por usuário em todas as consultas;
- não confie no status ou IDs enviados pelo cliente;
- aplique rate limiting antes de abrir integrações externas.

## Referências

- [Better Auth: instalação](https://better-auth.com/docs/installation)
- [Drizzle Kit: migrations](https://orm.drizzle.team/docs/migrations)
- [Vercel: gerenciamento de Cron Jobs](https://vercel.com/docs/cron-jobs/manage-cron-jobs)

