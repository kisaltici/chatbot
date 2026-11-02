"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { BookOpen, LogOut, MessageCircle, PackageCheck, PlugZap, Store } from "lucide-react";
import { company } from "@/data/company";

type NavItem = { href: string; label: string; short: string; icon: typeof MessageCircle };

const GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "asistan",
    items: [
      { href: "/", label: "Simülatör", short: "simülatör", icon: MessageCircle },
      { href: "/bilgi", label: "Hazır cevaplar", short: "cevaplar", icon: BookOpen },
      { href: "/firma", label: "Firma bilgisi", short: "firma", icon: Store },
    ],
  },
  {
    title: "otomasyon",
    items: [{ href: "/otomasyon", label: "Sipariş onayı", short: "onay", icon: PackageCheck }],
  },
  {
    title: "ayarlar",
    items: [{ href: "/kurulum", label: "WhatsApp bağlantısı", short: "bağlantı", icon: PlugZap }],
  },
];

const ALL = GROUPS.flatMap((g) => g.items);

type Status = { whatsappReady: boolean; ai: { available: boolean }; bridge: { configured: boolean } };

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [status, setStatus] = useState<Status | null>(null);
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  useEffect(() => {
    fetch("/api/status")
      .then((r) => (r.ok ? r.json() : null))
      .then(setStatus)
      .catch(() => {});
  }, []);

  async function logout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.replace("/giris");
  }

  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-[272px] shrink-0 p-3 lg:block">
        <div className="flex h-full flex-col rounded-[28px] bg-surface px-3 pb-3 pt-6 shadow-sm ring-1 ring-line">
          <Link href="/" className="mx-3 flex items-baseline gap-2 rounded-lg">
            <span className="font-display text-[26px] leading-none tracking-tight">{company.shortName}</span>
            <span className="text-[13px] text-muted">asistan</span>
          </Link>

          <nav aria-label="Ana menü" className="mt-9 flex flex-col gap-6">
            {GROUPS.map((g) => (
              <div key={g.title}>
                <p className="mb-1.5 px-3 text-[12px] text-muted">{g.title}</p>
                <ul className="flex flex-col gap-0.5">
                  {g.items.map(({ href, label, icon: Icon }) => {
                    const active = isActive(href);
                    return (
                      <li key={href} className="relative">
                        {active && (
                          <motion.span
                            layoutId="side-pill"
                            className="absolute inset-0 rounded-[14px] bg-surface-2"
                            transition={{ type: "spring", stiffness: 500, damping: 40 }}
                            aria-hidden
                          />
                        )}
                        <Link
                          href={href}
                          aria-current={active ? "page" : undefined}
                          className={`group relative flex h-11 items-center gap-3 rounded-[14px] px-3 text-[15px] transition-colors duration-200 ${
                            active ? "text-ink" : "text-ink-2 hover:text-ink"
                          }`}
                        >
                          <Icon
                            className={`size-[18px] transition-colors duration-200 ${active ? "text-ink" : "text-muted group-hover:text-ink-2"}`}
                            strokeWidth={1.8}
                            aria-hidden
                          />
                          {label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          <div className="mt-auto flex flex-col gap-1">
            <div className="mb-2 rounded-[18px] bg-surface-2 px-4 py-3.5">
              <StatusRow label="WhatsApp" ok={status?.whatsappReady} />
              <StatusRow label="Yapay zekâ" ok={status?.ai.available} />
              <StatusRow label="zuulab.com" ok={status?.bridge.configured} />
            </div>
            <button
              onClick={logout}
              className="flex h-11 items-center gap-3 rounded-[14px] px-3 text-[15px] text-muted transition-colors hover:bg-surface-2 hover:text-ink"
            >
              <LogOut className="size-[18px]" strokeWidth={1.8} aria-hidden />
              Çıkış yap
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line/70 bg-bg/80 px-4 backdrop-blur-xl lg:hidden">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="font-display text-[22px] leading-none">{company.shortName}</span>
            <span className="text-[12.5px] text-muted">asistan</span>
          </Link>
          <button onClick={logout} className="rounded-full p-2 text-muted hover:text-ink" aria-label="Çıkış yap">
            <LogOut className="size-[18px]" strokeWidth={1.8} />
          </button>
        </header>

        <main className="flex-1 pb-28 lg:pb-16">{children}</main>

        <nav aria-label="Ana menü" className="fixed inset-x-3 bottom-3 z-30 lg:hidden" style={{ marginBottom: "env(safe-area-inset-bottom)" }}>
          <ul className="grid grid-cols-5 rounded-[22px] border border-line bg-surface/90 p-1.5 shadow-xl backdrop-blur-xl">
            {ALL.map(({ href, short, icon: Icon }) => {
              const active = isActive(href);
              return (
                <li key={href} className="relative">
                  {active && <motion.span layoutId="nav-pill-m" className="absolute inset-0 rounded-[16px] bg-surface-2" aria-hidden />}
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`relative flex flex-col items-center gap-0.5 py-2 text-[10.5px] ${active ? "text-ink" : "text-muted"}`}
                  >
                    <Icon className="size-[19px]" strokeWidth={1.8} aria-hidden />
                    {short}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}

function StatusRow({ label, ok }: { label: string; ok?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1 text-[13px]">
      <span className="text-ink-2">{label}</span>
      <span className="flex items-center gap-1.5 text-muted">
        <motion.span
          className={`size-1.5 rounded-full ${ok === undefined ? "bg-line-strong" : ok ? "bg-faq-dot" : "bg-warn-dot"}`}
          initial={false}
          animate={{ scale: ok === undefined ? 1 : [1, 1.6, 1] }}
          transition={{ duration: 0.5 }}
          aria-hidden
        />
        {ok === undefined ? "…" : ok ? "bağlı" : "kurulmadı"}
      </span>
    </div>
  );
}

export function PageHeader({ title, description, children }: { title: string; description?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-xl">
        <h1 className="font-display text-[34px] leading-[1.05] tracking-[-0.01em] sm:text-[44px]">{title}</h1>
        {description && <p className="mt-3 text-[15.5px] leading-relaxed text-ink-2">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export function Page({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return <div className={`mx-auto w-full px-4 pt-8 sm:px-8 sm:pt-12 lg:px-12 ${wide ? "max-w-6xl" : "max-w-5xl"}`}>{children}</div>;
}
