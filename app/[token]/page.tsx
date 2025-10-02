"use client";
import React, { useState, useMemo } from "react";

function useTokenFromPath() {
  return useMemo(() => {
    if (typeof window === "undefined") return "";
    const seg = window.location.pathname.split("/").filter(Boolean);
    return seg[0] || "";
  }, []);
}

export default function LoginPage() {
  const token = useTokenFromPath();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/${token}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) throw new Error(await res.text());
      window.location.assign(`/${token}/dashboard`);
    } catch (err: any) {
      setError(err?.message || "登录失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white shadow rounded-2xl p-6">
      <h1 className="text-2xl font-semibold mb-4">请输入密码</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <input
          type="password"
          className="w-full border rounded-xl p-3"
          placeholder="密码"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          disabled={loading}
          className="w-full rounded-xl p-3 border bg-gray-900 text-white disabled:opacity-60"
        >
          {loading ? "正在验证…" : "登录"}
        </button>
        <p className="text-xs text-gray-500 mt-1">URL 令牌路径：/{token}</p>
      </form>
    </div>
  );
}
