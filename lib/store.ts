import crypto from "node:crypto";
import { redis } from "./redis";

const KEY_CURRENT = "surge:current";
const KEY_VERSIONS = "surge:versions";
export const MAX_VERSIONS = 5;

export type Version = { ts: string; sha256: string; size: number };

function verKey(sha: string) {
  return `surge:version:${sha}`;
}

export async function readCurrent(): Promise<string> {
  if (!redis) throw new Error("Upstash Redis 未配置");
  return (await redis.get<string>(KEY_CURRENT)) || "";
}

export async function readVersions(): Promise<Version[]> {
  if (!redis) throw new Error("Upstash Redis 未配置");
  return (await redis.get<Version[]>(KEY_VERSIONS)) || [];
}

export async function writeCurrent(content: string) {
  if (!redis) throw new Error("Upstash Redis 未配置");
  const sha256 = crypto.createHash("sha256").update(content).digest("hex");
  const ts = new Date().toISOString();
  const size = Buffer.byteLength(content, "utf-8");
  const entry: Version = { ts, sha256, size };

  const prev = (await readVersions()) || [];
  const updated = [entry, ...prev];

  await redis.set(KEY_CURRENT, content);
  await redis.set(verKey(sha256), content);

  const trimmed = updated.slice(0, MAX_VERSIONS);
  await redis.set(KEY_VERSIONS, trimmed);

  const extras = updated.slice(MAX_VERSIONS);
  if (extras.length) {
    await Promise.all(extras.map(v => redis.del(verKey(v.sha256))));
  }
}

export async function readVersionContent(sha256: string): Promise<string | null> {
  if (!redis) throw new Error("Upstash Redis 未配置");
  return (await redis.get<string>(verKey(sha256))) ?? null;
}

export async function rollbackTo(sha256: string) {
  const content = await readVersionContent(sha256);
  if (content == null) throw new Error("目标版本内容不存在");
  await writeCurrent(content);
}
