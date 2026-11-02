import type { Metadata } from "next";
import { Page, PageHeader } from "@/components/shell";
import { BridgeStatus, FlowTimeline, TemplateCard } from "@/components/automation";
import { TEMPLATES } from "@/data/templates";

export const metadata: Metadata = { title: "sipariş onayı" };

export default function OtomasyonPage() {
  return (
    <Page>
      <PageHeader
        title="sipariş onayı."
        description="Kapıda ödeme siparişleri zuulab.com'a düştüğü anda müşteriye WhatsApp'tan onay mesajı gider; cevabı da siparişe kendiliğinden işlenir."
      />

      <section className="mt-14">
        <FlowTimeline />
      </section>

      <section className="mt-20">
        <h2 className="font-display text-[28px] leading-tight">WhatsApp şablonları</h2>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-2">
          Müşteriye ilk mesajı siz attığınızda WhatsApp yalnızca Meta&apos;nın onayladığı şablonları kabul eder. Aşağıdaki üç şablonu{" "}
          <b className="font-medium text-ink">WhatsApp Manager → Message templates → Create template</b> ekranında aynı adla, <b className="font-medium text-ink">Utility</b>{" "}
          kategorisinde ve <b className="font-medium text-ink">Turkish</b> diliyle oluşturun. Onay genelde birkaç dakika ile birkaç saat sürer.
        </p>
        <div className="mt-8">
          {TEMPLATES.map((t, i) => (
            <TemplateCard key={t.name} t={t} index={i} />
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-12 border-t border-line pt-12 md:grid-cols-2">
        <div>
          <h2 className="font-display text-[28px] leading-tight">bağlantı</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
            Bu panel ile zuulab.com birbirine imzalı isteklerle konuşur. İki tarafta da aynı gizli anahtar tanımlı olmalı.
          </p>
          <div className="mt-6">
            <BridgeStatus />
          </div>
        </div>
        <div>
          <h2 className="font-display text-[28px] leading-tight">zuulab.com tarafı</h2>
          <ol className="mt-4 flex flex-col gap-3 text-[15px] leading-relaxed text-ink-2">
            <li>
              <span className="text-muted">1.</span> Fly.io&apos;da gizli değişkenleri ekleyin:{" "}
              <code className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[13px] text-ink">WHATSAPP_BRIDGE_URL</code>,{" "}
              <code className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[13px] text-ink">WHATSAPP_BRIDGE_SECRET</code>,{" "}
              <code className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[13px] text-ink">WHATSAPP_COD_ENABLED=true</code>
            </li>
            <li>
              <span className="text-muted">2.</span> cron-job.org&apos;da her 15 dakikada bir{" "}
              <code className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[13px] text-ink">/api/cron/whatsapp-cod</code> çağrısı (diğer işlerle aynı{" "}
              <code className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[13px] text-ink">CRON_SECRET</code>)
            </li>
            <li>
              <span className="text-muted">3.</span> Admin → Kapıda ödeme listesinde yeni <b className="font-medium text-ink">WhatsApp onayı</b> sütunu ve{" "}
              <b className="font-medium text-ink">Müşteri onayı bekleyen</b> filtresi görünür.
            </li>
          </ol>
          <h3 className="mt-10 text-[16px] font-medium">müşterinin elinde olanlar</h3>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
            Müşteri <b className="font-medium text-ink">DURDUR</b> yazarsa otomatik bilgilendirmeler durdurulur ve kaydı tutulur. Ayrıca WhatsApp her
            işletme sohbetinde engelleme ve şikâyet seçeneğini zaten sunar.
          </p>
        </div>
      </section>
    </Page>
  );
}
