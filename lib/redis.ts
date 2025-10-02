// lib/redis.ts
import { Redis } from "@upstash/redis";

// 兼容两套命名：优先用 UPSTASH_*，否则回退到 KV_REST_*
const url =
  process.env.UPSTASH_REDIS_REST_URL ||
  process.env.KV_REST_API_URL ||
  "";
const token =
  process.env.UPSTASH_REDIS_REST_TOKEN ||
  process.env.KV_REST_API_TOKEN ||
  "";

if (!url || !token) {
  console.warn(
    "[redis] Missing Upstash REST envs: (UPSTASH_REDIS_REST_URL|KV_REST_API_URL) / (UPSTASH_REDIS_REST_TOKEN|KV_REST_API_TOKEN)"
  );
}

export const redis =
  url && token ? new Redis({ url, token }) : (null as unknown as Redis);
