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
  const [content, setContent] = useState("");
  const [versions, setVersions] = useState<Version[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [importUrl, setImportUrl] = useState("");

  async function loadFile() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/${token}/api/file`);
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setContent(json.content || "");
      setVersions(json.versions || []);
      setMessage("已加载最新内容");
    } catch (e: any) {
      setMessage(e?.message || "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFile();
  }, [token]);

  async function saveFile() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/${token}/api/file`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error(await res.text());
      setMessage("已保存（并记录版本）");
      await loadFile();
    } catch (e: any) {
      setMessage(e?.message || "保存失败");
    } finally {
      setLoading(false);
    }
  }

  async function importFromUrl() {
    if (!importUrl) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(importUrl);
      if (!res.ok) throw new Error(`拉取失败: ${res.status}`);
      const text = await res.text();
      setContent(text);
      setMessage("已从 URL 导入内容（未保存）");
    } catch (e: any) {
      setMessage(e?.message || "导入失败");
    } finally {
      setLoading(false);
    }
  }

  async function rollback(sha: string) {
    if (!confirm(`确认回滚到版本 ${sha.slice(0,8)}... 吗？`)) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/${token}/api/file`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rollbackTo: sha }),
      });
      if (!res.ok) throw new Error(await res.text());
      setMessage("已回滚到所选版本（同时记录为一个新版本）");
      await loadFile();
    } catch (e: any) {
      setMessage(e?.message || "回滚失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-2xl p-6 space-y-4">
        <h2 className="text-xl font-semibold">Surge 配置管理（单文件）</h2>
        <div className="flex gap-3">
          <input
            className="flex-1 border rounded-xl p-2"
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
            placeholder="导入 URL（原始文件直链）"
          />
          <button onClick={importFromUrl} className="rounded-xl border px-4 py-2">导入</button>
          <a className="rounded-xl border px-4 py-2" href={`/${token}/api/raw`}>下载</a>
          <button onClick={saveFile} className="rounded-xl border px-4 py-2 bg-gray-900 text-white">保存</button>
          <button onClick={loadFile} className="rounded-xl border px-4 py-2">刷新</button>
        </div>

        <textarea
          className="w-full h-80 border rounded-xl p-3 font-mono text-sm"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="在此粘贴或编辑你的 surge.conf 内容"
        />
        {message && <p className="text-sm text-gray-600">{message}</p>}
      </div>

      <div className="bg-white shadow rounded-2xl p-6 space-y-3">
        <h3 className="text-lg font-semibold">版本历史（最多 5 条）</h3>
        <ul className="space-y-2">
          {versions.map((v) => (
            <li key={v.sha256} className="flex items-center justify-between border rounded-xl p-3 text-sm">
              <div className="space-y-1">
                <div><span className="font-mono">{v.sha256.slice(0,12)}</span> · {new Date(v.ts).toLocaleString()}</div>
                <div className="text-gray-500">{v.size} bytes</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => rollback(v.sha256)} className="rounded-xl border px-3 py-1">回滚到此版本</button>
              </div>
            </li>
          ))}
          {versions.length === 0 && <li className="text-gray-500">暂无版本</li>}
        </ul>
      </div>
    </div>
  );
}
