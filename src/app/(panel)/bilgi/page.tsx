import type { Metadata } from "next";
import { Page, PageHeader } from "@/components/shell";
import { Knowledge } from "@/components/knowledge";

export const metadata: Metadata = { title: "hazır cevaplar" };

export default function BilgiPage() {
  return (
    <Page>
      <PageHeader
        title="hazır cevaplar."
        description="Buradaki sorular AI'ye hiç gitmeden, anında ve ücretsiz cevaplanır. Soruları düzenleyin, yenilerini ekleyin; bir soru yazarak botun hangisini seçeceğini görün."
      />
      <div className="mt-10">
        <Knowledge />
      </div>
    </Page>
  );
}
