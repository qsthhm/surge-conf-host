"use client";
import React, { useEffect, useMemo, useState } from "react";

type Version = { ts: string; sha256: string; size: number };

function useTokenFromPath() {
  return useMemo(() => {
    if (typeof window === "undefined") return "";
    const seg = window.location.pathname.split("/").filter(Boolean);
    return seg[0] || "";
  }, []);
}

export default function DashboardPage() {
  const token = useTokenFromPath();
  const rawUrl = `/${token}/api/raw`;
  const installUrl = `surge:///install-config?url=${encodeURIComponent(
    (typeof window !== "undefined" ? window.location.origin : "") + rawUrl
  )}`;

  const [content, setContent] = useState("");
  const [versions, setVersions] = useState<Version[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function loadFile() {
    setLoading(true);
    try {
      const res = await fetch(`/${token}/api/file`);
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setContent(json.content || "");
      setVersions(json.versions || []);
      setMsg("已加载最新内容");
    } catch (e: any) {
      setMsg(e?.message || "加载失败");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { loadFile(); }, [token]);

  // 上传 .conf 即覆盖为最新版本
  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/${token}/api/file`, { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text());
      setMsg("上传成功，已写入为最新版本");
      await loadFile();
    } catch (e: any) {
      setMsg(e?.message || "上传失败");
    } finally {
      setUploading(false);
      e.currentTarget.value = "";
    }
  }

  // 在线编辑保存（可选）
  async function saveText() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`/${token}/api/file`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error(await res.text());
      setMsg("已保存文本并记录为新版本");
      await loadFile();
    } catch (e: any) {
      setMsg(e?.message || "保存失败");
    } finally {
      setLoading(false);
    }
  }

  async function rollback(sha: string) {
    if (!confirm(`确认回滚到版本 ${sha.slice(0, 12)}… 吗？`)) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`/${token}/api/file`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rollbackTo: sha }),
      });
      if (!res.ok) throw new Error(await res.text());
      setMsg("已回滚到所选版本（并记录为一个新版本）");
      await loadFile();
    } catch (e: any) {
      setMsg(e?.message || "回滚失败");
    } finally {
      setLoading(false);
    }
  }

  function copyRaw() {
    navigator.clipboard.writeText((window.location.origin || "") + rawUrl);
    setMsg("已复制配置地址");
  }

  return (
    <div className="space-y-6">
      {/* 顶部卡片：主要动作 */}
      <div className="card p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold">Surge 配置管理</h1>
            <p className="text-sm text-gray-500 mt-1">
              最新版本直链：<code className="text-gray-700">{rawUrl}</code>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a href={rawUrl} className="btn-ghost">下载</a>
            <button onClick={copyRaw} className="btn-ghost">复制配置地址</button>
            <a href={installUrl} className="btn-primary">一键导入到 Surge</a>
          </div>
        </div>
      </div>

      {/* 上传卡片 */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-3">上传本地 .conf（会覆盖为最新版本）</h2>
        <div className="flex items-center gap-3">
          <input type="file" accept=".conf,text/plain" onChange={onUpload} className="file:btn-ghost file:mr-4" />
          {uploading && <span className="badge">正在上传…</span>}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          支持纯文本 .conf（建议 &lt; 1MB）。上传成功后，Surge 可直接用上面的“一键导入”或“下载”。
        </p>
      </div>

      {/* 在线编辑（可选） */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">在线编辑（可选）</h3>
          <div className="flex items-center gap-3">
            <button onClick={saveText} className="btn-primary" disabled={loading}>保存为新版本</button>
            <button onClick={loadFile} className="btn-ghost" disabled={loading}>刷新</button>
          </div>
        </div>
        <textarea
          className="input"
          placeholder="在此粘贴或编辑你的 surge.conf 内容"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        {msg && <p className="mt-3 text-sm text-gray-600">{msg}</p>}
      </div>

      {/* 版本历史 */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-3">版本历史（最多 5 条）</h3>
        <ul className="space-y-2">
          {versions.length === 0 && <li className="text-gray-500">暂无版本</li>}
          {versions.map((v) => (
            <li key={v.sha256} className="flex items-center justify-between border rounded-xl p-3 text-sm">
              <div className="space-y-1">
                <div>
                  <span className="font-mono">{v.sha256.slice(0, 12)}</span>
                  <span className="mx-2 text-gray-400">•</span>
                  {new Date(v.ts).toLocaleString()}
                </div>
                <div className="text-gray-500">{v.size} bytes</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => rollback(v.sha256)} className="btn-ghost">回滚到此版本</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
