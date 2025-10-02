import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!url || !token) {
  console.warn("[redis] UPSTASH_REDIS_REST_URL/TOKEN not set. API calls will fail.");
}

export const redis = url && token ? new Redis({ url, token }) : (null as unknown as Redis);
