"use client";
import React, { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/Toast";

type Version = { ts: string; sha256: string; size: number };

export default function DashboardClient({ token }: { token: string }) {
  const rawUrl = `/${token}/api/raw`;
  const installUrl = `surge:///install-config?url=${encodeURIComponent(
    (typeof window !== "undefined" ? window.location.origin : "") + rawUrl
  )}`;

  const toast = useToast();

  const [content, setContent] = useState("");
  const [versions, setVersions] = useState<Version[]>([]);
  const [currentSha, setCurrentSha] = useState<string>("");
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
    } catch (e: any) {
      toast(e?.message || "加载失败", "error");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { loadFile(); }, [token]);

  // === 上传 ===
  async function uploadFile(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/${token}/api/file`, { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text());
      toast("上传成功，已成为最新版本", "success");
      await loadFile();
    } catch (e: any) {
      toast(e?.message || "上传失败", "error");
    } finally {
      setUploading(false);
    }
  }

  function onFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) uploadFile(f);
    e.currentTarget.value = "";
  }

  // === 拖拽上传 ===
  const [dragActive, setDragActive] = useState(false);
  const dzRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = dzRef.current;
    if (!el) return;

    function prevent(e: DragEvent) { e.preventDefault(); e.stopPropagation(); }
    function onEnter(e: DragEvent) { prevent(e); setDragActive(true); }
    function onLeave(e: DragEvent) { prevent(e); setDragActive(false); }
    function onDrop(e: DragEvent) {
      prevent(e); setDragActive(false);
      const f = e.dataTransfer?.files?.[0];
      if (f) uploadFile(f);
    }

    ["dragenter","dragover"].forEach(ev => el.addEventListener(ev, onEnter));
    ["dragleave"].forEach(ev => el.addEventListener(ev, onLeave));
    el.addEventListener("drop", onDrop);
    ["dragenter","dragover","dragleave","drop"].forEach(ev => document.addEventListener(ev, prevent));

    return () => {
      ["dragenter","dragover"].forEach(ev => el.removeEventListener(ev, onEnter));
      ["dragleave"].forEach(ev => el.removeEventListener(ev, onLeave));
      el.removeEventListener("drop", onDrop);
      ["dragenter","dragover","dragleave","drop"].forEach(ev => document.removeEventListener(ev, prevent));
    };
  }, []);

  // === 保存 / 回滚 / 删除 / 复制 / 退出 ===
  async function saveText() {
    setLoading(true);
    try {
      const res = await fetch(`/${token}/api/file`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast("已保存为新版本", "success");
      await loadFile();
    } catch (e: any) {
      toast(e?.message || "保存失败", "error");
    } finally {
      setLoading(false);
    }
  }

  async function rollback(sha: string) {
    if (!confirm(`确认回滚到版本 ${sha.slice(0, 12)}… 吗？`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/${token}/api/file`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rollbackTo: sha }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast("已回滚并生成新版本", "success");
      await loadFile();
    } catch (e: any) {
      toast(e?.message || "回滚失败", "error");
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
      toast("已删除版本", "success");
      await loadFile();
    } catch (e: any) {
      toast(e?.message || "删除失败", "error");
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
    toast("已复制配置地址", "success");
  }

  return (
    <div className="space-y-6">
      {/* 顶部操作 */}
      <div className="card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold">Surge 配置管理</h1>
            <p className="text-sm text-base-subtle mt-1">以最新版直链进行导入，不在页面展示 token。</p>
          </div>
          <div className="flex items-center gap-2">
            <a href={rawUrl} className="btn-ghost">下载</a>
            <button onClick={copyRaw} className="btn-ghost">复制配置地址</button>
            <a href={installUrl} className="btn-primary">一键导入到 Surge</a>
            <button onClick={logout} className="btn-ghost">退出</button>
          </div>
        </div>
      </div>

      {/* 拖拽上传 + 文件选择（移动端优先） */}
      <div className="card p-5">
        <h2 className="text-lg font-semibold mb-3">上传 .conf 为最新版本</h2>
        <div ref={dzRef} className={`dropzone ${dragActive ? "dropzone--active" : ""}`}>
          <p className="text-sm text-base-subtle mb-3">拖拽 .conf 文件到此处，或点击选择文件</p>
          <label className="btn-ghost cursor-pointer">
            <input type="file" className="hidden" accept=".conf,text/plain" onChange={onFileInput} />
            选择文件
          </label>
          {uploading && <div className="mt-3 badge">正在上传…</div>}
        </div>
        <p className="text-xs text-base-subtle mt-2">建议小于 1MB。上传成功后，可立即在 Surge 中导入。</p>
      </div>

      {/* 在线编辑（可选） */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">在线编辑（可选）</h3>
          <div className="flex items-center gap-2">
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
      </div>

      {/* 版本历史 */}
      <div className="card p-5">
        <h3 className="text-lg font-semibold mb-3">版本历史（最多 5 条）</h3>
        <ul className="space-y-2">
          {versions.length === 0 && <li className="text-base-subtle">暂无版本</li>}
          {versions.map((v) => {
            const isCurrent = v.sha256 === currentSha;
            return (
              <li key={v.sha256} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border rounded-xl p-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono">{v.sha256.slice(0, 12)}</span>
                    {isCurrent && <span className="badge bg-neutral-900 text-white">当前使用</span>}
                  </div>
                  <div className="text-base-subtle">{new Date(v.ts).toLocaleString()} · {v.size} bytes</div>
                </div>
                <div className="flex items-center gap-2">
                  {!isCurrent && <button onClick={() => rollback(v.sha256)} className="btn-ghost">回滚</button>}
                  {!isCurrent && <button onClick={() => remove(v.sha256)} className="btn-danger">删除</button>}
                  {isCurrent && <span className="text-xs text-neutral-400">当前版本不可删除</span>}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
