// lib/store.ts
import crypto from "node:crypto";
import { redis } from "./redis";

const KEY_CURRENT = "surge:current";
const KEY_VERSIONS = "surge:versions";
export const MAX_VERSIONS = 5;

export type Version = { ts: string; sha256: string; size: number };

function verKey(sha: string) { return `surge:version:${sha}`; }
export function sha256Of(text: string) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

export async function readCurrent(): Promise<string> {
  if (!redis) throw new Error("Upstash Redis 未配置");
  return (await redis.get<string>(KEY_CURRENT)) || "";
}

export async function readVersions(): Promise<Version[]> {
  if (!redis) throw new Error("Upstash Redis 未配置");
  return (await redis.get<Version[]>(KEY_VERSIONS)) || [];
}

export async function readVersionContent(sha: string): Promise<string | null> {
  if (!redis) throw new Error("Upstash Redis 未配置");
  return (await redis.get<string>(verKey(sha))) ?? null;
}

/** 写入当前内容：若与最新版本 SHA 相同，则只更新 current，不追加版本条目 */
export async function writeCurrent(content: string) {
  if (!redis) throw new Error("Upstash Redis 未配置");
  const sha256 = sha256Of(content);
  const ts = new Date().toISOString();
  const size = Buffer.byteLength(content, "utf-8");
  const entry: Version = { ts, sha256, size };

  const prev = (await readVersions()) || [];
  const latestSame = prev[0]?.sha256 === sha256;

  // 始终更新 current & 版本正文
  await redis.set(KEY_CURRENT, content);
  await redis.set(verKey(sha256), content);

  // 若内容未变，不追加新版本
  if (latestSame) return;

  const trimmed = [entry, ...prev].slice(0, MAX_VERSIONS);
  await redis.set(KEY_VERSIONS, trimmed);

  // 清理超限的旧版本正文
  const extras = [entry, ...prev].slice(MAX_VERSIONS);
  if (extras.length) await Promise.all(extras.map(v => redis.del(verKey(v.sha256))));
}

/** 回滚到指定版本（并按当前逻辑生成一条新版本记录） */
export async function rollbackTo(sha: string) {
  const content = await readVersionContent(sha);
  if (content == null) throw new Error("目标版本内容不存在");
  await writeCurrent(content);
}

/** 删除指定版本；禁止删除当前版本 */
export async function deleteVersion(sha: string) {
  if (!redis) throw new Error("Upstash Redis 未配置");
  const cur = await readCurrent();
  const curSha = sha256Of(cur);
  if (sha === curSha) throw new Error("不能删除当前正在使用的版本");

  const list = await readVersions();
  const next = list.filter(v => v.sha256 !== sha);
  if (next.length === list.length) return; // 不存在

  await redis.set(KEY_VERSIONS, next);
  await redis.del(verKey(sha));
}
