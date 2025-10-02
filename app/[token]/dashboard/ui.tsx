"use client";
import React, { useEffect, useState } from "react";

type Version = { ts: string; sha256: string; size: number };

export default function DashboardClient({ token }: { token: string }) {
  const rawUrl = `/${token}/api/raw`;
  const installUrl = `surge:///install-config?url=${encodeURIComponent(
    (typeof window !== "undefined" ? window.location.origin : "") + rawUrl
  )}`;

  const [content, setContent] = useState("");
  const [versions, setVersions] = useState<Version[]>([]);
  const [currentSha, setCurrentSha] = useState<string>("");
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
      setCurrentSha(json.currentSha || "");
      setMsg("已加载最新内容");
    } catch (e: any) {
      setMsg(e?.message || "加载失败");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { loadFile(); }, [token]);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setMsg(null);
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

  async function saveText() {
    setLoading(true); setMsg(null);
    try {
      const res = await fetch(`/${token}/api/file`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error(await res.text());
      setMsg("已保存为新版本");
      await loadFile();
    } catch (e: any) {
      setMsg(e?.message || "保存失败");
    } finally {
      setLoading(false);
    }
  }

  async function rollback(sha: string) {
    if (!confirm(`确认回滚到版本 ${sha.slice(0, 12)}… 吗？`)) return;
    setLoading(true); setMsg(null);
    try {
      const res = await fetch(`/${token}/api/file`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rollbackTo: sha }),
      });
      if (!res.ok) throw new Error(await res.text());
      setMsg("已回滚到所选版本（并记录为新版本）");
      await loadFile();
    } catch (e: any) {
      setMsg(e?.message || "回滚失败");
    } finally {
      setLoading(false);
    }
  }

  async function remove(sha: string) {
    if (!confirm("确认删除该版本？此操作不可恢复")) return;
    setLoading(true);
    try {
      const res = await fetch(`/${token}/api/file?sha=${encodeURIComponent(sha)}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      setMsg("已删除版本");
      await loadFile();
    } catch (e: any) {
      setMsg(e?.message || "删除失败");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await fetch(`/${token}/api/logout`, { method: "POST" });
    location.assign(`/${token}`);
  }

  function copyRaw() {
    navigator.clipboard.writeText((window.location.origin || "") + rawUrl);
    setMsg("已复制配置地址");
  }

  return (
    <div className="space-y-6">
      {/* 顶部操作 */}
      <div className="card p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold">Surge 配置管理</h1>
            <p className="text-sm text-gray-500 mt-1">最新版本直链仅在操作中使用，不在页面展示。</p>
          </div>
          <div className="flex items-center gap-3">
            <a href={rawUrl} className="btn-ghost">下载</a>
            <button onClick={copyRaw} className="btn-ghost">复制配置地址</button>
            <a href={installUrl} className="btn-primary">一键导入到 Surge</a>
            <button onClick={logout} className="btn-ghost">退出登录</button>
          </div>
        </div>
      </div>

      {/* 上传 */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-3">上传 .conf 为最新版本</h2>
        <div className="flex items-center gap-3">
          <input type="file" accept=".conf,text/plain" onChange={onUpload} className="file:btn-ghost file:mr-4" />
          {uploading && <span className="badge">正在上传…</span>}
        </div>
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
          className="input h-80 font-mono"
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
          {versions.map((v) => {
            const isCurrent = v.sha256 === currentSha;
            return (
              <li key={v.sha256} className="flex items-center justify-between border rounded-xl p-3 text-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono">{v.sha256.slice(0, 12)}</span>
                    {isCurrent && <span className="badge bg-emerald-100 text-emerald-700">当前使用</span>}
                  </div>
                  <div className="text-gray-500">{new Date(v.ts).toLocaleString()} · {v.size} bytes</div>
                </div>
                <div className="flex items-center gap-2">
                  {!isCurrent && <button onClick={() => rollback(v.sha256)} className="btn-ghost">回滚到此版本</button>}
                  {!isCurrent && <button onClick={() => remove(v.sha256)} className="btn-ghost">删除</button>}
                  {isCurrent && <span className="text-gray-400 text-xs">当前版本不可删除</span>}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
