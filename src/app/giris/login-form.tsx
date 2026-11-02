"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    }).catch(() => null);
    setPending(false);
    if (res?.ok) {
      const next = params.get("next");
      router.replace(next && next.startsWith("/") && !next.startsWith("//") ? next : "/");
      router.refresh();
      return;
    }
    const data = (await res?.json().catch(() => null)) as { error?: string } | null;
    setError(data?.error ?? "Bağlantı kurulamadı. İnternetinizi kontrol edip tekrar deneyin.");
  }

  return (
    <form onSubmit={onSubmit} className="mt-10 flex flex-col gap-3">
      <label htmlFor="password" className="text-[13.5px] text-muted">
        Şifre
      </label>
      <input
        id="password"
        type="password"
        autoComplete="current-password"
        autoFocus
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? "login-error" : undefined}
        className="h-13 rounded-2xl bg-surface px-4 text-[16px] shadow-sm outline-none ring-1 ring-line transition-shadow focus:shadow-[var(--ring)] aria-[invalid=true]:ring-danger-dot"
      />
      {error && (
        <p id="login-error" role="alert" className="text-[14px] text-danger">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending || !password}
        className="mt-3 h-13 rounded-2xl bg-ink text-[15.5px] font-medium text-bg transition-[opacity,transform] duration-200 active:scale-[0.98] disabled:opacity-40"
      >
        {pending ? "Giriş yapılıyor…" : "Giriş yap"}
      </button>
    </form>
  );
}
