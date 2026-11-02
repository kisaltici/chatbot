import { normalize } from "@/lib/match";

/**
 * Müşterinin yazdığı metinden sipariş/abonelik niyetini çıkarır.
 * Bilerek dar tutuldu: "siparişimi nasıl iptal ederim?" gibi bir SORU iptal sayılmaz,
 * yalnızca açık bir komut ("İptal etmek istiyorum") sayılır. Asıl yol şablondaki butonlardır.
 */
export type OrderIntent = "confirm" | "cancel" | "optout";

const CONFIRM = /^(evet\s+)?(onayliyorum|onayliyoruz|onayladim|onaylarim|onay veriyorum|onayliyorum tesekkurler|tamam onayliyorum|evet onay)\b/;
const CANCEL = /^(iptal|iptal et|iptal edin|iptal etmek istiyorum|siparisi iptal et(in)?|siparisimi iptal et(mek istiyorum|in)?|vazgectim|istemiyorum)$/;
const OPTOUT = /^(durdur|stop|dur|abonelikten cik|mesaj istemiyorum|mesaj gondermeyin)$/;

export function detectOrderIntent(text: string): OrderIntent | null {
  const n = normalize(text);
  if (!n || n.length > 60) return null;
  if (OPTOUT.test(n)) return "optout";
  if (CONFIRM.test(n)) return "confirm";
  if (CANCEL.test(n)) return "cancel";
  return null;
}
