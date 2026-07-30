import "server-only";

import { Redis } from "@upstash/redis";

const url = process.env.KV_REST_API_URL;
const token = process.env.KV_REST_API_TOKEN;

if (!url || !token) {
  throw new Error("Variáveis do Redis não configuradas.");
}

export const redis = new Redis({
  url,
  token,
});