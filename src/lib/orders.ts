import "server-only";
import { bridgeConfigured, callSite } from "@/lib/bridge";
import { normalize } from "@/lib/match";

/**
 * Sipariş / kargo durumu sorgusu ("kargom nerede?", "siparişim ne durumda", "ZUU-20260142").
 * Veri zuulab.com'dan imzalı istekle gelir; sipariş yalnızca siparişteki telefondan soruluyorsa gösterilir.
 */

export type OrderInfo = {
  orderNumber: string;
  status: string;
  statusLabel: string;
  createdAt: string;
  paymentMethod: string;
  total: number;
  items: { name: string; quantity: number }[];
  shipment: {
    carrier: string;
    trackingNumber: string | null;
    trackingUrl: string | null;
    statusText: string | null;
    shippedAt: string | null;
    deliveredAt: string | null;
  } | null;
};

export type RecentOrder = { orderNumber: string; status: string; statusLabel: string; createdAt: string };

/** Mesaj sipariş/kargo durumu mu soruyor? (soru kalıpları; "kargo ücreti" gibi genel sorular hariç) */
const TRACK = [
  /\bkargo(m|mu|muz|nuz|n)?\b.*\b(nerede|nerde|durum|durumu|ne zaman|nezaman|gelmedi|gelmed|takip|ulasmadi|ulasti mi|cikti mi|verildi mi|yolda)/,
  /\bsiparis(im|imi|imiz|iniz|imin|imizin)?\b.*\b(nerede|nerde|durum|durumu|ne durumda|ne zaman|gelmedi|takip|ulasmadi|kargoya|hazirlandi|cikti)/,
  /\b(kargo|siparis) (durumu|takibi|takip|sorgu|sorgulama|nerede)\b/,
  /\btakip (no|numara|numarasi|numaram|kodu|linki)\b/,
  /\b(kargom|siparisim|paketim|urunum)\b.*\b(gelmedi|nerede|nerde|ne zaman|ulasmadi|hala)\b/,
  /^(kargom|siparisim|kargo durumu|siparis durumu|kargo takip|siparis takip|paketim nerede)$/,
];

export function isTrackingQuestion(text: string): boolean {
  const n = normalize(text);
  if (!n || n.length > 140) return false;
  return TRACK.some((r) => r.test(n));
}

/** Metindeki sipariş numarası. `loose`: numara beklenirken yalnızca rakam da kabul edilir (telefon numarası hariç) */
export function extractOrderNumber(text: string, loose = false): string | null {
  const strict = /\bzuu[\s-]*(\d{6,12})\b/i.exec(text);
  if (strict) return `ZUU-${strict[1]}`;
  if (!loose) return null;
  const digits = text.replace(/[\s#.-]/g, "");
  const m = /^(?:no:?)?(\d{6,12})$/i.exec(digits);
  if (!m) return null;
  // 05XXXXXXXXX / 5XXXXXXXXX telefon numarasına benziyorsa sipariş sayma
  if (/^0?5\d{9}$/.test(m[1])) return null;
  return `ZUU-${m[1]}`;
}

export function orderLookupAvailable(): boolean {
  return bridgeConfigured();
}

export async function lookupOrder(orderNumber: string, who: { phone?: string; trusted?: boolean }): Promise<{ found: true; order: OrderInfo } | { found: false } | null> {
  return callSite<{ found: true; order: OrderInfo } | { found: false }>("/api/integrations/whatsapp/orders", {
    mode: "lookup",
    orderNumber,
    phone: who.phone,
    trusted: who.trusted,
  });
}

export async function recentOrders(phone: string): Promise<RecentOrder[] | null> {
  const res = await callSite<{ orders: RecentOrder[] }>("/api/integrations/whatsapp/orders", { mode: "by_phone", phone });
  return res ? res.orders : null;
}

const dateTr = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", timeZone: "Europe/Istanbul" }).format(new Date(iso)) : "";

const ACTIVE = new Set(["PAYMENT_PENDING", "PAYMENT_RECEIVED", "CONFIRMED", "PREPARING", "IN_PRODUCTION", "PACKING", "SHIPPED"]);
export const isActive = (status: string) => ACTIVE.has(status);

/** Siteden gelen siparişi müşteriye gidecek WhatsApp metnine çevirir */
export function formatOrder(o: OrderInfo): string {
  const lines: string[] = [`📦 *${o.orderNumber}* numaralı siparişiniz`];
  const items = o.items.map((i) => `${i.name}${i.quantity > 1 ? ` ×${i.quantity}` : ""}`).join(", ");
  const s = o.shipment;

  switch (o.status) {
    case "PAYMENT_PENDING":
      lines.push(
        o.paymentMethod === "BANK_TRANSFER"
          ? "Durum: *Ödeme bekleniyor*\nHavale/EFT ödemeniz hesabımıza ulaştığında siparişiniz onaylanır (48 saat içinde). Ödemeyi yaptıysanız birkaç saat içinde güncellenir."
          : "Durum: *Ödeme bekleniyor*\nÖdeme tamamlanmamış görünüyor. Sorun yaşadıysanız yazın, yardımcı olalım.",
      );
      break;
    case "PAYMENT_RECEIVED":
    case "CONFIRMED":
    case "PREPARING":
    case "IN_PRODUCTION":
    case "PACKING":
      lines.push(`Durum: *${o.statusLabel}*`);
      if (s?.trackingNumber) {
        lines.push(`Kargo: ${s.carrier} · takip no *${s.trackingNumber}*`);
        if (s.trackingUrl) lines.push(`Takip: ${s.trackingUrl}`);
      } else {
        lines.push(
          "Siparişiniz atölyemizde hazırlanıyor. Stoktaki ürünler 1–3, kişiye özel ürünler 2–5 iş günü içinde kargoya verilir; kargoya verildiğinde takip numarası size iletilir.",
        );
      }
      break;
    case "SHIPPED":
      lines.push(`Durum: *Kargoda* 🚚${s?.statusText ? ` — ${s.statusText}` : ""}`);
      if (s) {
        lines.push(`Kargo firması: ${s.carrier}${s.trackingNumber ? `\nTakip numarası: *${s.trackingNumber}*` : ""}`);
        if (s.trackingUrl) lines.push(`Kargonuzu buradan takip edebilirsiniz:\n${s.trackingUrl}`);
        if (s.shippedAt) lines.push(`Kargoya veriliş: ${dateTr(s.shippedAt)}`);
      }
      lines.push("Teslimat genellikle kargoya verildikten sonra 2–3 iş günü sürer.");
      break;
    case "DELIVERED":
      lines.push(`Durum: *Teslim edildi* ✅${s?.deliveredAt ? ` (${dateTr(s.deliveredAt)})` : ""}`);
      lines.push("Ürününüzü beğendiyseniz çok sevinirsiniz; bir sorun varsa 7 gün içinde fotoğrafla yazmanız yeterli.");
      break;
    case "CANCELLED":
      lines.push("Durum: *İptal edildi*");
      break;
    case "RETURN_REQUESTED":
    case "RETURNED":
    case "PARTIALLY_REFUNDED":
      lines.push(`Durum: *${o.statusLabel}*\nİade süreciyle ilgili sorunuz varsa yazın, ekibimiz yardımcı olsun.`);
      break;
    default:
      lines.push(`Durum: *${o.statusLabel}*`);
  }
  if (items) lines.push(`Ürünler: ${items}`);
  return lines.join("\n");
}

export const ORDER_TEXT = {
  askNumber:
    "Siparişinizi kontrol edeyim 📦 Sipariş numaranızı yazar mısınız? (ör. *ZUU-20260142*)\n\nNumarayı sipariş onay e-postanızda ya da sitede *Hesabım → Siparişlerim* bölümünde bulabilirsiniz.",
  notFound:
    "Bu numarayla, bu telefon numarasına ait bir sipariş bulamadım. Numarayı kontrol edip tekrar yazabilir ya da sizi bir yetkiliye bağlayabilirim.",
  notFoundTrusted: "Bu numarayla bir sipariş bulunamadı. Numarayı kontrol edip tekrar deneyin.",
  unavailable:
    "Şu an sipariş bilgilerinize ulaşamıyorum. Biraz sonra tekrar deneyebilir ya da 0 533 425 14 95 numarasından bize ulaşabilirsiniz.",
  notConnected: "Sipariş sorgulama henüz zuulab.com'a bağlanmadı (ZUULAB_SITE_URL ve WHATSAPP_BRIDGE_SECRET gerekli).",
  pickOne: "Bu numaraya ait son siparişleriniz bunlar. Hangisini soruyorsunuz?",
} as const;
