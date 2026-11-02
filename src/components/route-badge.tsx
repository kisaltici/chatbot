import type { Route } from "@/lib/engine";

type Tone = "faq" | "ai" | "warn" | "danger" | "neutral";

export const ROUTE_META: Record<Route, { label: string; hint: string; tone: Tone }> = {
  faq: { label: "hazır cevap", hint: "Bilgi bankasından anında ve ücretsiz", tone: "faq" },
  intent: { label: "karşılama", hint: "Selam, teşekkür gibi bir kalıp", tone: "faq" },
  menu: { label: "menü", hint: "Menü veya kategori listesi", tone: "faq" },
  ai: { label: "AI", hint: "Firma bilgisiyle AI yazdı", tone: "ai" },
  suggest: { label: "öneri", hint: "Emin olamadı, seçenek sundu", tone: "warn" },
  handoff: { label: "yetkili", hint: "Talep ekibe iletildi", tone: "warn" },
  fallback: { label: "cevapsız", hint: "Uygun cevap bulunamadı", tone: "danger" },
  command: { label: "komut", hint: "Özel komut", tone: "neutral" },
  order: { label: "sipariş sorgusu", hint: "zuulab.com'dan canlı sipariş bilgisi", tone: "faq" },
};

const DOT: Record<Tone, string> = {
  faq: "bg-faq-dot",
  ai: "bg-ai-dot",
  warn: "bg-warn-dot",
  danger: "bg-danger-dot",
  neutral: "bg-muted",
};

const PILL: Record<Tone, string> = {
  faq: "bg-faq-soft text-faq",
  ai: "bg-ai-soft text-ai",
  warn: "bg-warn-soft text-warn",
  danger: "bg-danger-soft text-danger",
  neutral: "bg-surface-2 text-ink-2",
};

export function RouteDot({ route, className = "" }: { route: Route; className?: string }) {
  return <span className={`inline-block size-2 shrink-0 rounded-full ${DOT[ROUTE_META[route].tone]} ${className}`} aria-hidden />;
}

export function RouteBadge({ route }: { route: Route }) {
  const m = ROUTE_META[route];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12.5px] font-medium ${PILL[m.tone]}`}>
      <span className={`size-1.5 rounded-full ${DOT[m.tone]}`} aria-hidden />
      {m.label}
    </span>
  );
}
