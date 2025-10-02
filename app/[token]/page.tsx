// app/[token]/page.tsx
"use client";
import React, { useState } from "react";

export default function LoginPage({ params }: { params: { token: string } }) {
  const token = params.token;
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
      location.assign(`/${token}/dashboard`);
    } catch (err: any) {
      setError(err?.message || "登录失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-6">
      <h1 className="text-2xl font-semibold mb-4">请输入密码</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <input
          type="password"
          className="input"
          placeholder="密码"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button disabled={loading} className="btn-primary w-full">
          {loading ? "正在验证…" : "登录"}
        </button>
      </form>
    </div>
  );
}
