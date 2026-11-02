/**
 * WHATSAPP ŞABLON MESAJLARI
 * -------------------------
 * Müşteriye ilk mesajı işletme attığında (ya da son mesajdan 24 saat geçtiyse) WhatsApp yalnızca
 * Meta'nın önceden onayladığı şablonları kabul eder. Aşağıdaki şablonları WhatsApp Manager →
 * Message templates bölümünde AYNI ADLA ve AYNI METİNLE oluşturup onaya gönderin.
 *
 * Panelde "otomatik mesajlar" sayfası bu metinleri kopyalanabilir şekilde gösterir.
 * {{1}} = sipariş numarası
 */

export type TemplateEvent = "cod.request" | "cod.reminder" | "cod.cancelled";

export type TemplateDef = {
  event: TemplateEvent;
  /** Meta'daki şablon adı (küçük harf, alt çizgi) */
  name: string;
  /** Meta'da seçilecek kategori */
  category: "UTILITY";
  language: "tr";
  /** Panelde gösterilen kısa açıklama */
  when: string;
  /** Şablon gövdesi; {{1}} = sipariş numarası */
  body: string;
  /** Hızlı cevap butonları (en fazla 3, her biri en fazla 25 karakter) */
  buttons: { text: string; action: "confirm" | "cancel" }[];
  /** Panel önizlemesinde {{1}} yerine yazılacak örnek */
  example: string;
};

export const TEMPLATES: TemplateDef[] = [
  {
    event: "cod.request",
    name: process.env.WA_TEMPLATE_COD_REQUEST || "zuulab_kapida_odeme_onay",
    category: "UTILITY",
    language: "tr",
    when: "Kapıda ödeme siparişi gelince hemen (21:00–09:00 arasıysa sabah 9'da)",
    body:
      "Merhabalar,\n\nZuulab üzerinden oluşturduğunuz *{{1}}* numaralı kapıda ödeme siparişiniz ile ilgili sizlere ulaşmaktayız. 😊\n\nSiparişiniz hazırlık aşamasındadır. Kargoya teslim etmeden önce siparişinizi hâlâ teslim almak istediğinizi teyit etmek isteriz.\n\nSiparişinizin gönderimini onaylıyorsanız aşağıdaki *\"Onaylıyorum\"* butonuna basmanız ya da bu mesaja *\"Onaylıyorum\"* şeklinde yanıt vermeniz yeterlidir. Onayınızın ardından siparişiniz en kısa sürede kargoya teslim edilecektir.\n\nİlginiz için teşekkür eder, iyi günler dileriz.",
    buttons: [
      { text: "Onaylıyorum", action: "confirm" },
      { text: "İptal etmek istiyorum", action: "cancel" },
    ],
    example: "ZUU-20260142",
  },
  {
    event: "cod.reminder",
    name: process.env.WA_TEMPLATE_COD_REMINDER || "zuulab_kapida_odeme_hatirlatma",
    category: "UTILITY",
    language: "tr",
    when: "2 gün içinde cevap gelmezse bir kez",
    body:
      "Merhabalar,\n\n*{{1}}* numaralı kapıda ödeme siparişiniz için onayınızı bekliyoruz. Siparişinizi teslim almak istiyorsanız *\"Onaylıyorum\"* butonuna basmanız yeterlidir.\n\nSipariş tarihinden itibaren 7 gün içinde onay alamazsak siparişiniz otomatik olarak iptal edilecektir.\n\nİyi günler dileriz.",
    buttons: [
      { text: "Onaylıyorum", action: "confirm" },
      { text: "İptal etmek istiyorum", action: "cancel" },
    ],
    example: "ZUU-20260142",
  },
  {
    event: "cod.cancelled",
    name: process.env.WA_TEMPLATE_COD_CANCELLED || "zuulab_kapida_odeme_iptal",
    category: "UTILITY",
    language: "tr",
    when: "7 günün sonunda hâlâ onay yoksa, sipariş iptal edilirken",
    body:
      "Merhabalar,\n\n*{{1}}* numaralı kapıda ödeme siparişiniz 7 gün içinde onaylanmadığı için iptal edilmiştir.\n\nÜrünü hâlâ almak isterseniz zuulab.com üzerinden dilediğiniz zaman yeniden sipariş oluşturabilirsiniz.\n\nİyi günler dileriz.",
    buttons: [],
    example: "ZUU-20260142",
  },
];

export const templateByEvent = new Map(TEMPLATES.map((t) => [t.event, t]));

/** Müşteri onaylayınca / iptal edince gönderilen serbest metinler (24 saatlik pencere içinde, şablon gerekmez) */
export const REPLIES = {
  confirmed: "Teşekkür ederiz. Onayınız alınmıştır, siparişiniz en kısa sürede kargoya teslim edilecektir. 😊",
  alreadyConfirmed: "Siparişiniz zaten onaylanmış durumda, en kısa sürede kargoya teslim edilecektir. 😊",
  cancelled:
    "Siparişiniz iptal edilmiştir. Ürünü almak isterseniz zuulab.com üzerinden dilediğiniz zaman yeniden sipariş oluşturabilirsiniz. İyi günler dileriz.",
  cancelRequested:
    "İptal talebinizi aldık. Siparişiniz kargo hazırlığına alındığı için ekibimiz en kısa sürede sizinle iletişime geçecektir.",
  notFound:
    "Şu an onay bekleyen bir kapıda ödeme siparişiniz görünmüyor. Bir sorun olduğunu düşünüyorsanız sipariş numaranızı yazın, ekibimiz kontrol etsin.",
  optedOut:
    "Otomatik bilgilendirme mesajlarını durdurduk. Siparişinizle ilgili zorunlu bilgilendirmeler yine bu sohbetten gelebilir. Dilediğiniz zaman WhatsApp'ta bu sohbeti engelleyebilir ya da şikâyet edebilirsiniz.",
  siteUnavailable:
    "Şu an siparişinizi kontrol edemiyoruz. Birazdan tekrar yazabilir ya da 0 533 425 14 95 numarasından bize ulaşabilirsiniz.",
} as const;

/** Butonun payload'ı: "cod:confirm:ZUU-20260142" */
export const codPayload = (action: "confirm" | "cancel", orderNumber: string) => `cod:${action}:${orderNumber}`;

export function parseCodPayload(id: string): { action: "confirm" | "cancel"; orderNumber: string } | null {
  const m = /^cod:(confirm|cancel):([A-Za-z0-9-]{3,40})$/.exec(id);
  return m ? { action: m[1] as "confirm" | "cancel", orderNumber: m[2] } : null;
}
