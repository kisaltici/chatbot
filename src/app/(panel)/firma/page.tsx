import type { Metadata } from "next";
import { company } from "@/data/company";
import { Page } from "@/components/shell";
import { InstructionsPreview } from "@/components/instructions-preview";

export const metadata: Metadata = { title: "firma" };

const DAYS = [
  [1, "Pazartesi"],
  [2, "Salı"],
  [3, "Çarşamba"],
  [4, "Perşembe"],
  [5, "Cuma"],
  [6, "Cumartesi"],
  [0, "Pazar"],
] as const;

export default function FirmaPage() {
  const c = company;
  return (
    <Page>
      <p className="text-[13.5px] text-muted">botun tanıdığı firma</p>
      <h1 className="mt-2 font-display text-[56px] leading-none tracking-[-0.02em] sm:text-[80px]">{c.name}</h1>
      <p className="mt-4 text-[18px] text-ink-2">{c.tagline}</p>
      <p className="mt-8 max-w-2xl text-[16px] leading-[1.7] text-ink-2">{c.description}</p>

      <Section title="koleksiyonlar ve hizmetler">
        <ul className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
          {c.services.map((s) => (
            <li key={s.name}>
              <p className="text-[16px] font-medium">{s.name}</p>
              <p className="mt-1 text-[14.5px] leading-relaxed text-ink-2">{s.detail}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="fiyatlar">
        <dl className="divide-y divide-line">
          {c.pricing.map((p) => (
            <div key={p.item} className="flex items-baseline justify-between gap-6 py-3 text-[15px]">
              <dt className="text-ink-2">
                {p.item}
                {p.note && <span className="ml-2 text-[13px] text-muted">{p.note}</span>}
              </dt>
              <dd className="shrink-0 tabular-nums text-ink">{p.price}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <div className="grid gap-x-16 sm:grid-cols-2">
        <Section title="canlı destek saatleri">
          <dl className="divide-y divide-line text-[15px]">
            {DAYS.map(([d, name]) => {
              const h = c.hours.days[d];
              return (
                <div key={d} className="flex justify-between py-2.5">
                  <dt className="text-ink-2">{name}</dt>
                  <dd className={`tabular-nums ${h ? "text-ink" : "text-muted"}`}>{h ? `${h.open} – ${h.close}` : "kapalı"}</dd>
                </div>
              );
            })}
          </dl>
        </Section>
        <Section title="iletişim">
          <dl className="flex flex-col gap-4 text-[15px]">
            <Row label="telefon" value={c.contact.phone} />
            <Row label="whatsapp" value={c.contact.whatsapp} />
            <Row label="e-posta" value={c.contact.email} />
            <Row label="adres" value={c.contact.address} />
            <Row label="teslimat" value={c.serviceArea.join(", ")} />
          </dl>
        </Section>
      </div>

      <Section title="politikalar">
        <ul className="flex flex-col gap-3 text-[15px] leading-relaxed text-ink-2">
          {c.policies.map((p) => (
            <li key={p} className="flex gap-4">
              <span className="mt-[11px] h-px w-3 shrink-0 bg-line-strong" aria-hidden />
              {p}
            </li>
          ))}
        </ul>
      </Section>

      <div className="grid gap-x-16 sm:grid-cols-2">
        <Section title="konuşma tarzı">
          <p className="text-[15px] leading-relaxed text-ink-2">{c.tone}</p>
        </Section>
        <Section title="asla yapmayacakları">
          <ul className="flex flex-col gap-2.5 text-[15px] leading-relaxed text-ink-2">
            {c.guardrails.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </Section>
      </div>

      <InstructionsPreview />

      <p className="mt-10 text-[13.5px] text-muted">
        Bu bilgiler <code className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[12.5px] text-ink-2">src/data/company.ts</code> dosyasında; fiyat
        veya politika değişince oradan güncelleyin.
      </p>
    </Page>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-16">
      <h2 className="mb-5 font-display text-[26px] leading-tight">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[13px] text-muted">{label}</dt>
      <dd className="mt-0.5 text-ink">{value}</dd>
    </div>
  );
}
