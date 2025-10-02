"use client";
import React, { useState } from "react";

export default function LoginPage({ params }: { params: { token: string } }) {
  const token = params.token;
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr(null);
    try {
      const res = await fetch(`/${token}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) throw new Error(await res.text());
      location.assign(`/${token}/dashboard`);
    } catch (e: any) {
      setErr(e?.message || "登录失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card p-6">
        <h1 className="text-2xl font-semibold mb-4">登录</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="password"
            className="input"
            placeholder="输入密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {err && <p className="text-error-600 text-sm">{err}</p>}
          <button disabled={loading} className="btn-primary w-full">
            {loading ? "正在验证…" : "登录"}
          </button>
        </form>
      </div>
    </div>
  );
}
