import { redis } from "./redis";

const WINDOW = 10 * 60; // seconds
const LIMIT = 10;       // attempts

export async function limitLogin(ip: string): Promise<{ ok: boolean; message?: string }> {
  if (!redis) return { ok: true };
  const key = `rl:login:${ip}`;
  const count = (await redis.incr(key)) || 0;
  if (count === 1) {
    await redis.expire(key, WINDOW);
  }
  if (count > LIMIT) {
    return { ok: false, message: `尝试过多，请稍后再试` };
  }
  return { ok: true };
}
