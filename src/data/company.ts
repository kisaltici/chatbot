/**
 * FİRMA PROFİLİ — zuulab
 * ----------------------
 * Botun firmayı tanıması için gereken her şey burada (kaynak: zuulab.com).
 * AI cevapları bu bilgiye dayanır; burada olmayan bir bilgiyi uydurmaz.
 * Fiyat veya politika değişince burayı güncelleyin.
 */

export type DayHours = { open: string; close: string } | null;
export type PriceItem = { item: string; price: string; note?: string };

export const company = {
  name: "zuulab",
  shortName: "zuulab",
  botName: "zuu asistan",
  tagline: "üç boyutlu tasarım ve hassas katman üretimi.",
  description:
    "zuulab, Bolu'daki atölyesinde 3D baskıyla tasarım objeleri, parametrik masa lambaları, çocuklar için eğitici oyuncaklar ve kişiye özel ürünler üreten bir tasarım markasıdır. 2026'da tek bir yazıcıyla başladı; bugün 4 Bambu Lab yazıcıyla, 1–3 kişilik bir ekip tarafından tasarlanıp, basılıp, temizlenip paketleniyor. Ürünlerin çoğu sipariş geldiğinde üretilir; depodan değil, doğrudan atölyeden gönderilir.",

  services: [
    { name: "zuulight — aydınlatma", detail: "Parametrik desenli masa lambaları. Açıkken duvara desen düşürür, kapalıyken dekoratif obje olarak durur." },
    { name: "zuukids — çocuk ve eğitim", detail: "Bitki kaynaklı, kokusuz bio-PLA'dan şekil, renk ve sayı öğreten eğitici oyuncaklar ve tekerlekli arabalar. Çapaksız, ele rahat formlar." },
    { name: "zuulife — yaşam ve masaüstü", detail: "Masaüstü organizerler, takı ağaçları ve sade formlu ev objeleri." },
    { name: "zuucharm — kişiye özel", detail: "İsimli plaka anahtarlık gibi kişiselleştirilmiş hediyelikler." },
    { name: "zuutoptan — kurumsal ve butik", detail: "Kafe, restoran, ofis, mağaza, etkinlik ve kurumsal hediye için toplu, logolu veya özel renkli üretim." },
    { name: "Özel üretim", detail: "Müşterinin STL/3MF dosyasından ya da çizim ve ölçüden kişiye özel 3D baskı." },
  ],

  pricing: [
    { item: "zuulight muse / lumea / brilla masa lambası", price: "999 TL", note: "Liste fiyatı 1.199 TL" },
    { item: "zuulight öfkeli masa lambası", price: "1.500 TL" },
    { item: "zuukids vidalı şekil eşleştirme ve sıralama seti", price: "699 TL" },
    { item: "zuukids kesir öğretici yapboz", price: "699 TL" },
    { item: "zuukids hafıza geliştirici eşleştirme oyunu", price: "699 TL" },
    { item: "zuukids sayıları öğrenme seti", price: "699 TL" },
    { item: "zuukids şekil eşleştirme oyunu", price: "499 TL" },
    { item: "zuukids şekil yerleştirme oyunu", price: "199 TL" },
    { item: "zuukids tekerlekli oyuncak araba", price: "99 TL" },
    { item: "zuukids tekerlekli oyuncak araba 3'lü set", price: "249 TL" },
    { item: "zuukids tekerlekli tavşan / kaz araba", price: "149 TL" },
    { item: "zuukids tekerlekli şirin arabalar 3'lü set", price: "399 TL" },
    { item: "zuucharm kişiye özel araba plaka anahtarlık", price: "149 TL" },
    { item: "Kargo", price: "110 TL", note: "699 TL ve üzeri siparişlerde ücretsiz" },
    { item: "Özel üretim ve toptan", price: "Teklife göre", note: "Dosya incelendikten sonra fiyat ve süre bildirilir" },
  ] as PriceItem[],

  serviceArea: ["Türkiye'nin her yerine kargo (yurt dışına gönderim şu an yok)"],

  hours: {
    timezone: "Europe/Istanbul",
    // 0 = Pazar, 1 = Pazartesi ... 6 = Cumartesi — telefon ve WhatsApp canlı destek saatleri
    days: {
      0: null,
      1: { open: "09:00", close: "18:00" },
      2: { open: "09:00", close: "18:00" },
      3: { open: "09:00", close: "18:00" },
      4: { open: "09:00", close: "18:00" },
      5: { open: "09:00", close: "18:00" },
      6: null,
    } as Record<number, DayHours>,
  },

  contact: {
    phone: "0 533 425 14 95",
    whatsapp: "+90 533 425 14 95",
    email: "zuulab.co@gmail.com",
    website: "https://www.zuulab.com",
    address: "Merkez, Bolu (atölye ziyaretçi kabul etmiyor)",
    instagram: "https://instagram.com/zuu.lab",
    youtube: "https://youtube.com/@Zuulab",
  },

  policies: [
    "Ödeme: PayTR ile kredi/banka kartı (3D Secure, kart bilgisi saklanmaz), havale/EFT (ödeme 48 saat içinde hesaba ulaşınca sipariş onaylanır) veya kapıda ödeme (PTT Kargo ile gönderilir, tutar teslimatta kargo görevlisine ödenir, ek ücret yok).",
    "Kapıda ödeme siparişlerinde kargoya vermeden önce müşteriden WhatsApp'tan onay istenir; 7 gün içinde onay gelmezse sipariş iptal edilir.",
    "Kartla ve havaleyle ödenen siparişler Sürat Kargo, kapıda ödemeli siparişler PTT Kargo ile gönderilir.",
    "Müşteri sipariş durumunu sorarsa sipariş numarasını (ör. ZUU-20260142) yazmasını iste; asistan durumu ve kargo takip linkini zuulab.com'dan getirir.",
    "Üye olmadan sipariş verilebilir; e-posta ve adres yeterli.",
    "Kurumsal fatura kesilir (e-Fatura / e-Arşiv); ödeme adımında firma bilgileri girilir.",
    "Stoktaki ürünler ödeme onayından sonra 1–3 iş gününde, sipariş üzerine/kişiye özel ürünler 2–5 iş gününde kargoya verilir. Teslimat genelde 2–3 iş günü sürer.",
    "Kargo Sürat Kargo veya PTT Kargo ile; 110 TL, 699 TL ve üzeri ücretsiz. Takip numarası e-postayla gelir, üyeler Hesabım → Siparişlerim'den görebilir.",
    "Teslimden itibaren 14 gün içinde gerekçesiz iade; iade kargosu zuulab'dan, ilk kargo ücreti dahil 14 gün içinde iade edilir.",
    "Kişiye özel ürünlerde (isim, yazı, plaka, logo, müşteri dosyası, özel renk/ölçü) cayma hakkı yoktur; ancak kusurlu, hasarlı veya yanlış ürün ücretsiz yeniden basılır, değiştirilir ya da iade edilir.",
    "Hasarlı paket: mümkünse kuryeye hasar tutanağı tutturun; 7 gün içinde fotoğrafla e-posta veya WhatsApp'tan bildirin.",
    "Malzeme: PLA (dekor ve masaüstü) ve PETG (ısıya, neme, darbeye daha dayanıklı). Hangi malzeme olduğu ürün sayfasında yazar.",
    "İnce katman çizgileri 3D baskının doğal sonucudur, kusur değildir.",
    "Bakım: nemli yumuşak bezle silin. PLA ürünleri bulaşık makinesinden, sıcak sudan ve uzun süre doğrudan güneşten uzak tutun (yaklaşık 50 °C üstünde yumuşar).",
    "Lambalarda yalnızca LED ampul kullanın; duy tipi ve önerilen watt ürün sayfasında yazar.",
    "zuukids ürünlerinde yaş önerisi ve küçük parça uyarısı ürün sayfasında yer alır; küçük çocuklarda gözetim önerilir.",
    "Bültene abone olanlara %10 indirim kodu verilir; ayda en fazla iki bülten gönderilir.",
  ],

  /** AI'nin konuşma tarzı */
  tone:
    "Sıcak, sade ve samimi; tasarım atölyesi havasında. 'Siz' diye hitap et. Marka adını her zaman küçük harfle yaz: zuulab, zuukids, zuulight. Emoji en fazla bir tane.",

  /** AI'nin asla yapmaması gerekenler */
  guardrails: [
    "Listede olmayan bir fiyat, stok durumu veya teslim tarihi uydurma; ürün sayfasına (zuulab.com) veya ekibe yönlendir.",
    "Özel üretim ve toptan siparişlerde fiyat verme; dosya/ölçü/adet/renk bilgisiyle zuulab.co@gmail.com adresine veya WhatsApp'a yönlendir.",
    "Sipariş durumu soran müşteriden sipariş numarasını iste; durumu bilemeyeceğini, ekibin kontrol edeceğini söyle.",
    "Atölyenin ziyaretçi kabul etmediğini unutma; yerinde teslim veya ziyaret sözü verme.",
    "Rakip markalar hakkında yorum yapma.",
  ],
} as const;

export type Company = typeof company;
