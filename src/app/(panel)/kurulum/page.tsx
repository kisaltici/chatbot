import type { Metadata } from "next";
import { Page, PageHeader } from "@/components/shell";
import { Setup } from "@/components/setup";
import { Diagnostics } from "@/components/diagnostics";

export const metadata: Metadata = { title: "bağlantı" };

export default function KurulumPage() {
  return (
    <Page>
      <PageHeader title="whatsapp bağlantısı." description="Botu numaranıza bağlamak için dört adım. Tamamlananlar kendiliğinden işaretlenir." />
      <div className="mt-12">
        <Diagnostics />
        <Setup />
      </div>
    </Page>
  );
}
