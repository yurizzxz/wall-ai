import "server-only";

import { Ratelimit } from "@upstash/ratelimit";

import { redis } from "@/services/security/redis";

export const mutationRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "1 m"),
  analytics: false,
  prefix: "wallai:actions",
});