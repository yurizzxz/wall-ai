import { redis } from "@/services/security/redis";
import { Ratelimit } from "@upstash/ratelimit";

export const assistantRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  timeout: 1_000,
  analytics: false,
  prefix: "wallai:assistant",
});