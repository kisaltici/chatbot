/**
 * HAZIR SORU-CEVAPLAR — zuulab
 * ----------------------------
 * Bot önce burada eşleşme arar. Güçlü bir eşleşme bulursa AI'yi hiç çağırmaz:
 * cevap anında, ücretsiz ve her seferinde aynı gelir.
 *
 * Alanlar:
 *  - short:     WhatsApp menüsünde görünen başlık (en fazla 24 karakter)
 *  - question:  Sorunun tam hali
 *  - variants:  Müşterinin aynı şeyi sorabileceği farklı yollar (ne kadar çok, o kadar iyi)
 *  - keywords:  Tek başına bile bu soruyu işaret eden kelimeler
 *  - answer:    WhatsApp biçimiyle cevap: *kalın*, _italik_, ~üstü çizili~
 *  - related:   Cevabın altında buton olarak önerilecek diğer soruların id'leri (en fazla 2)
 */

export type Category = {
  id: string;
  title: string; // en fazla 24 karakter
  description: string; // en fazla 72 karakter
  emoji: string;
};

export type FaqEntry = {
  id: string;
  category: string;
  short: string;
  question: string;
  variants: string[];
  keywords: string[];
  answer: string;
  related?: string[];
};

export const categories: Category[] = [
  { id: "urun", title: "Ürünler", description: "Lambalar, zuukids oyuncakları, malzeme ve bakım", emoji: "💡" },
  { id: "siparis", title: "Sipariş ve ödeme", description: "Ödeme yöntemleri, sipariş takibi, fatura", emoji: "🛒" },
  { id: "kargo", title: "Kargo ve teslimat", description: "Hazırlık süresi, kargo ücreti, hasarlı paket", emoji: "📦" },
  { id: "iade", title: "İade ve değişim", description: "14 gün iade, kişiye özel ürünler", emoji: "↩️" },
  { id: "ozel", title: "Özel üretim", description: "Kendi tasarımınız, toptan ve kurumsal siparişler", emoji: "🛠️" },
  { id: "iletisim", title: "İletişim", description: "Telefon, e-posta, çalışma saatleri", emoji: "📍" },
];

const SITE = "https://www.zuulab.com";

export const faq: FaqEntry[] = [
  // ── Ürünler ─────────────────────────────────────────────
  {
    id: "urunler",
    category: "urun",
    short: "Neler üretiyorsunuz",
    question: "Hangi ürünleri satıyorsunuz?",
    variants: ["ne satıyorsunuz", "ürünleriniz neler", "koleksiyonlarınız neler", "neler yapıyorsunuz", "katalog"],
    keywords: ["ürün", "koleksiyon", "katalog"],
    answer:
      "Tüm ürünlerimizi Bolu'daki atölyemizde 3D baskıyla üretiyoruz:\n\n• *zuulight* — parametrik desenli masa lambaları\n• *zuukids* — eğitici oyuncaklar ve tekerlekli arabalar\n• *zuulife* — masaüstü organizer ve ev objeleri\n• *zuucharm* — kişiye özel anahtarlıklar\n• *zuutoptan* — işletmeler için toplu üretim\n\nTüm ürünler: " + `${SITE}/urunler`,
    related: ["lamba", "zuukids"],
  },
  {
    id: "lamba",
    category: "urun",
    short: "Masa lambaları",
    question: "Masa lambalarınız hakkında bilgi alabilir miyim?",
    variants: ["lamba fiyatı", "lambalar ne kadar", "zuulight", "gece lambası", "abajur", "muse lamba", "lumea", "brilla", "öfkeli lamba"],
    keywords: ["lamba", "zuulight", "aydınlatma", "abajur"],
    answer:
      "*zuulight* lambalarımız parametrik desenlidir: açıkken duvara desen düşürür, kapalıyken dekoratif bir obje olarak durur.\n\n• Muse, Lumea, Brilla: *999 TL* ~1.199 TL~\n• Öfkeli masa lambası: *1.500 TL*\n\nHediye için de çok sevilen bir seçim 🎁\n" + `${SITE}/koleksiyon/zuulight`,
    related: ["ampul", "kargo-ucret"],
  },
  {
    id: "ampul",
    category: "urun",
    short: "Lamba ampulü",
    question: "Lambalarda hangi ampulü kullanmalıyım?",
    variants: ["ampul dahil mi", "hangi ampul", "duy tipi", "kaç watt", "lamba ısınır mı"],
    keywords: ["ampul", "duy", "watt", "led"],
    answer:
      "Lambalarımızda *yalnızca LED ampul* kullanın; LED ampuller malzemeye zarar verecek kadar ısınmaz.\n\nDuy tipi ve önerilen watt her lambanın ürün sayfasında yazıyor.",
    related: ["lamba", "bakim"],
  },
  {
    id: "zuukids",
    category: "urun",
    short: "zuukids oyuncaklar",
    question: "Çocuklar için hangi ürünleriniz var?",
    variants: ["eğitici oyuncak", "çocuk oyuncağı", "montessori", "şekil eşleştirme", "oyuncak araba", "kesir yapboz", "sayı öğrenme"],
    keywords: ["zuukids", "oyuncak", "çocuk", "eğitici", "bebek"],
    answer:
      "*zuukids* koleksiyonu bitki kaynaklı, kokusuz bio-PLA'dan üretilir; renk, şekil ve sayı kavramlarını dokunarak öğretir. Yüzeyler çapaksız ve ele rahattır.\n\n• Eğitici setler (şekil, kesir, sayı, hafıza): *199–699 TL*\n• Tekerlekli arabalar: *99 TL*'den başlayan fiyatlarla\n\n" + `${SITE}/koleksiyon/zuukids`,
    related: ["guvenlik", "malzeme"],
  },
  {
    id: "guvenlik",
    category: "urun",
    short: "Çocuklar için güvenli mi",
    question: "zuukids ürünleri çocuklar için güvenli mi?",
    variants: ["bebek için uygun mu", "kaç yaş için", "kaç yaşına uygun", "çocuğum yaşında uygun mu", "küçük parça var mı", "zehirli mi", "ağza alınır mı"],
    keywords: ["güvenli", "yaş", "küçük parça", "zehir"],
    answer:
      "zuukids ürünleri çocuklar düşünülerek tasarlanır ve kokusuz, bitki kaynaklı bio-PLA'dan üretilir.\n\nHer ürünün sayfasında *yaş önerisi* ve *küçük parça uyarısı* yer alıyor. Küçük çocuklar oynarken bir yetişkinin gözetimini öneriyoruz.",
    related: ["zuukids", "bakim"],
  },
  {
    id: "malzeme",
    category: "urun",
    short: "Malzeme (PLA/PETG)",
    question: "Ürünleriniz hangi malzemeden yapılıyor?",
    variants: ["pla nedir", "petg nedir", "plastik mi", "sağlam mı", "dayanıklı mı", "ne malzemesi"],
    keywords: ["malzeme", "pla", "petg", "plastik"],
    answer:
      "İki malzeme kullanıyoruz:\n\n• *PLA* — bitki kaynaklı; dekor ve masaüstü ürünler için\n• *PETG* — ısıya, neme ve darbeye daha dayanıklı\n\nHer ürünün malzemesi kendi sayfasında yazıyor.",
    related: ["bakim", "katman"],
  },
  {
    id: "bakim",
    category: "urun",
    short: "Bakım ve temizlik",
    question: "Ürünleri nasıl temizlerim?",
    variants: ["bulaşık makinesine girer mi", "yıkanır mı", "güneşte kalırsa", "nasıl silinir", "sıcağa dayanıklı mı"],
    keywords: ["temizlik", "temizle", "yıka", "bakım", "bulaşık"],
    answer:
      "Nemli, yumuşak bir bezle silmeniz yeterli.\n\nPLA ürünleri *bulaşık makinesinden, sıcak sudan ve uzun süre doğrudan güneşten* uzak tutun; yaklaşık 50 °C üstünde yumuşayabilir.",
    related: ["malzeme"],
  },
  {
    id: "katman",
    category: "urun",
    short: "Yüzeydeki çizgiler",
    question: "Üründe ince çizgiler var, bu kusur mu?",
    variants: ["yüzeyde çizgi var", "katman izi", "pürüzlü", "çizgili geldi"],
    keywords: ["çizgi", "katman", "pürüz"],
    answer:
      "İnce katman çizgileri 3D baskının doğal bir sonucudur, kusur değildir.\n\nAncak çatlak, kırık ya da eksik parça varsa fotoğrafla bize yazın; hemen ilgileniyoruz.",
    related: ["hasar"],
  },

  // ── Sipariş ve ödeme ────────────────────────────────────
  {
    id: "odeme",
    category: "siparis",
    short: "Ödeme yöntemleri",
    question: "Hangi ödeme yöntemlerini kabul ediyorsunuz?",
    variants: ["kartla ödeyebilir miyim", "havale olur mu", "eft", "güvenli mi ödeme", "taksit", "ödeme seçenekleri"],
    keywords: ["ödeme", "kart", "havale", "eft", "paytr"],
    answer:
      "Üç ödeme seçeneğimiz var:\n\n• *Kredi/banka kartı* — PayTR ile, 3D Secure doğrulamalı. Kart bilgileriniz saklanmaz.\n• *Havale/EFT* — ödemeniz 48 saat içinde hesabımıza ulaştığında siparişiniz onaylanır.\n• *Kapıda ödeme* — PTT Kargo ile gelir, tutarı teslimatta ödersiniz; ek ücret yok.",
    related: ["kapida-odeme", "fatura"],
  },
  {
    id: "kapida-odeme",
    category: "siparis",
    short: "Kapıda ödeme",
    question: "Kapıda ödeme yapabilir miyim?",
    variants: ["kapıda ödeme var mı", "teslimatta ödeme", "kargoda ödeme", "nakit ödeyebilir miyim", "kapıda kartla ödeme"],
    keywords: ["kapıda ödeme", "kapıda", "teslimatta"],
    answer:
      "Evet, *kapıda ödeme* seçeneğimiz var ve *ek ücret almıyoruz*. Siparişiniz PTT Kargo ile gelir, tutarı teslimatta kargo görevlisine ödersiniz.\n\nKargoya vermeden önce size WhatsApp'tan bir onay mesajı göndeririz; *Onaylıyorum* demeniz yeterli.",
    related: ["kargo-sure", "odeme"],
  },
  {
    id: "uyeliksiz",
    category: "siparis",
    short: "Üye olmadan sipariş",
    question: "Üye olmadan sipariş verebilir miyim?",
    variants: ["üyelik şart mı", "hesap açmam gerekir mi", "misafir sipariş"],
    keywords: ["üye", "üyelik", "hesap"],
    answer:
      "Evet. Ödeme adımında e-posta ve adresiniz yeterli.\n\nHesap açarsanız siparişlerinizi, adreslerinizi ve favorilerinizi tek yerden yönetebilirsiniz.",
    related: ["takip"],
  },
  {
    id: "takip",
    category: "siparis",
    short: "Sipariş takibi",
    question: "Siparişim nerede, nasıl takip ederim?",
    variants: ["siparişim ne zaman gelir", "kargom nerede", "takip numarası", "sipariş durumu", "kargoya verildi mi"],
    keywords: ["takip", "siparişim", "kargom", "nerede"],
    answer:
      "Sipariş numaranızı (ör. *ZUU-20260142*) buraya yazın, siparişinizin durumunu ve kargo takip linkini hemen söyleyeyim 📦\n\nNumaranız sipariş onay e-postanızda ve sitede *Hesabım → Siparişlerim* bölümünde yazar.",
    related: ["kargo-sure", "kargo-ucret"],
  },
  {
    id: "fatura",
    category: "siparis",
    short: "Kurumsal fatura",
    question: "Kurumsal fatura alabilir miyim?",
    variants: ["şirket adına fatura", "e-fatura", "vergi numarası", "fatura kesiyor musunuz"],
    keywords: ["fatura", "kurumsal", "vergi"],
    answer:
      "Evet. Ödeme adımında kurumsal fatura seçeneğini işaretleyip firma adı, vergi dairesi ve vergi numaranızı girin. Faturanız e-Fatura ya da e-Arşiv olarak e-postanıza gelir.",
    related: ["toptan"],
  },
  {
    id: "indirim",
    category: "siparis",
    short: "İndirim kodu",
    question: "İndirim kodu var mı?",
    variants: ["kupon", "kampanya", "bülten indirimi", "indirim var mı"],
    keywords: ["indirim", "kupon", "kampanya", "bülten"],
    answer:
      "Sitemizdeki bültene abone olursanız *%10 indirim kodu* gönderiyoruz. Ayda en fazla iki e-posta atıyoruz, sınırlı serilere de erken erişim sağlıyorsunuz.\n\n" + SITE,
    related: ["kargo-ucret"],
  },

  // ── Kargo ───────────────────────────────────────────────
  {
    id: "kargo-sure",
    category: "kargo",
    short: "Kargo süresi",
    question: "Siparişim kaç günde gelir?",
    variants: ["ne zaman kargoya verilir", "teslimat süresi", "kaç günde elime ulaşır", "hazırlık süresi", "hemen gönderir misiniz"],
    keywords: ["kaç gün", "süre", "teslimat", "ne zaman"],
    answer:
      "• Stoktaki ürünler: ödeme onayından sonra *1–3 iş günü* içinde kargoda\n• Sipariş üzerine / kişiye özel ürünler: *2–5 iş günü*\n\nKargoya verildikten sonra teslimat genelde *2–3 iş günü* sürer.",
    related: ["kargo-ucret", "takip"],
  },
  {
    id: "kargo-ucret",
    category: "kargo",
    short: "Kargo ücreti",
    question: "Kargo ücreti ne kadar?",
    variants: ["kargo bedava mı", "ücretsiz kargo", "kargo parası", "kargo dahil mi"],
    keywords: ["kargo ücret", "ücretsiz kargo", "kargo bedava"],
    answer: "Kargo ücreti *110 TL*. *699 TL ve üzeri* siparişlerde kargo ücretsiz.",
    related: ["kargo-sure", "kargo-firma"],
  },
  {
    id: "kargo-firma",
    category: "kargo",
    short: "Kargo firması",
    question: "Hangi kargo firmasıyla gönderiyorsunuz?",
    variants: ["yurt dışına gönderiyor musunuz", "yurtdışı kargo", "hangi kargo", "aras yurtiçi"],
    keywords: ["kargo firma", "sürat", "ptt", "yurt dışı", "yurtdışı"],
    answer:
      "Adresinize en uygun olana göre *Sürat Kargo* veya *PTT Kargo* ile gönderiyoruz. Şu an yalnızca *Türkiye içine* gönderim yapıyoruz.\n\nEvde yoksanız kargo ertesi iş günü tekrar dener ya da en yakın şubede bekletir.",
    related: ["kargo-sure"],
  },
  {
    id: "hasar",
    category: "kargo",
    short: "Hasarlı geldi",
    question: "Ürünüm hasarlı geldi, ne yapmalıyım?",
    variants: ["kırık geldi", "paket ezik", "ürün bozuk geldi", "eksik parça", "yanlış ürün geldi"],
    keywords: ["hasar", "kırık", "ezik", "bozuk", "yanlış ürün"],
    answer:
      "Çok üzgünüz! Mümkünse kuryeye *hasar tutanağı* tutturun. Ardından *7 gün içinde* ürünün ve paketin fotoğraflarıyla bu sohbete ya da zuulab.co@gmail.com adresine yazın.\n\nYenisini hazırlayıp gönderiyoruz; kusurlu veya yanlış ürünlerde değişim ve iade ücretsiz.",
    related: ["iade"],
  },
  {
    id: "adres-degis",
    category: "kargo",
    short: "Adres değiştirme",
    question: "Teslimat adresimi değiştirebilir miyim?",
    variants: ["adresi yanlış yazdım", "adres güncelleme", "farklı adrese gönderin"],
    keywords: ["adres değiş", "yanlış adres"],
    answer: "Siparişiniz kargoya verilmeden önce adres değişikliği yapabiliyoruz. Sipariş numaranızı ve yeni adresi buraya yazın, hemen güncelleyelim.",
    related: ["takip"],
  },

  // ── İade ────────────────────────────────────────────────
  {
    id: "iade",
    category: "iade",
    short: "İade nasıl yapılır",
    question: "Ürünü iade edebilir miyim?",
    variants: ["iade etmek istiyorum", "beğenmedim", "geri göndermek", "para iadesi", "değişim yapabilir miyim", "cayma hakkı"],
    keywords: ["iade", "değişim", "cayma", "geri gönder"],
    answer:
      "Teslimden itibaren *14 gün içinde* gerekçe belirtmeden iade edebilirsiniz. *İade kargosu bizden.*\n\n1. Üyeyseniz: Hesabım → Siparişlerim → _İade talebi oluştur_\n2. Üye değilseniz: sipariş numaranızla zuulab.co@gmail.com\n3. Size gelen iade koduyla 10 gün içinde Sürat ya da PTT Kargo'ya teslim edin\n\nÜcret, ilk kargo dahil 14 gün içinde ödeme yaptığınız karta iade edilir.",
    related: ["kisiye-ozel-iade", "hasar"],
  },
  {
    id: "kisiye-ozel-iade",
    category: "iade",
    short: "Kişiye özel ürün iadesi",
    question: "Kişiye özel ürünler iade edilebilir mi?",
    variants: ["isimli ürün iade", "plakalı anahtarlık iade", "isimli anahtarlık iade edebilir miyim", "kişiye özel ürünü iade", "özel renk iade", "logolu ürün iade"],
    keywords: ["kişiye özel", "isimli", "özel üretim iade"],
    answer:
      "İsim, yazı, plaka, logo, size ait dosya ya da özel renk/ölçüyle üretilen ürünlerde yasal olarak cayma hakkı yok.\n\nAma ürün *kusurlu, hasarlı veya siparişten farklı* geldiyse ücretsiz yeniden basıyor, değiştiriyor ya da iade ediyoruz.",
    related: ["iade", "hasar"],
  },

  // ── Özel üretim ─────────────────────────────────────────
  {
    id: "ozel-uretim",
    category: "ozel",
    short: "Kendi tasarımım",
    question: "Kendi tasarımımı bastırabilir miyim?",
    variants: ["özel üretim yapıyor musunuz", "stl dosyam var", "3mf", "modelimi basar mısınız", "özel sipariş", "3d baskı yaptırmak istiyorum"],
    keywords: ["özel üretim", "stl", "3mf", "model", "baskı yaptır", "tasarımım"],
    answer:
      "Evet! Şöyle ilerliyoruz:\n\n1. *STL veya 3MF* dosyanızı ölçü, adet, renk ve kullanım amacıyla birlikte zuulab.co@gmail.com adresine gönderin\n2. Basılabilirliği inceleyip fiyat ve süreyi bildiriyoruz\n3. Onay ve ödemeden sonra PLA ya da PETG ile basıyoruz\n\nÜretim genelde *2–5 iş günü* sürer.",
    related: ["dosyam-yok", "toptan"],
  },
  {
    id: "dosyam-yok",
    category: "ozel",
    short: "Dosyam yok",
    question: "3D dosyam yok, yine de yaptırabilir miyim?",
    variants: ["çizimim var", "fotoğraftan yapar mısınız", "modelleme yapıyor musunuz", "tasarım yapar mısınız"],
    keywords: ["dosyam yok", "çizim", "eskiz", "modelleme"],
    answer:
      "Bir eskiz, çizim ya da ölçülerinizi gönderin; modelleyip modelleyemeyeceğimizi değerlendirip size dönüş yapalım. zuulab.co@gmail.com",
    related: ["ozel-uretim"],
  },
  {
    id: "toptan",
    category: "ozel",
    short: "Toptan ve kurumsal",
    question: "Toptan veya kurumsal sipariş veriyor musunuz?",
    variants: ["toplu sipariş", "logolu ürün", "kurumsal hediye", "kafe için", "etkinlik için", "firma için", "zuutoptan"],
    keywords: ["toptan", "toplu", "kurumsal", "logolu", "zuutoptan"],
    answer:
      "Evet — kafe, restoran, ofis, mağaza, etkinlik ve kurumsal hediyeler için toplu, logolu ya da özel renkli üretim yapıyoruz.\n\nÜrün, adet, logo/kişiselleştirme ve istediğiniz teslim tarihini zuulab.co@gmail.com adresine yazın; size özel teklif hazırlayalım.",
    related: ["fatura", "ozel-uretim"],
  },
  {
    id: "anahtarlik",
    category: "ozel",
    short: "İsimli anahtarlık",
    question: "Kişiye özel plaka anahtarlık nasıl sipariş edilir?",
    variants: ["plakalı anahtarlık", "isimli anahtarlık", "zuucharm", "hediyelik anahtarlık"],
    keywords: ["anahtarlık", "plaka", "zuucharm"],
    answer:
      "*zuucharm kişiye özel araba plaka anahtarlık* *149 TL*. Ürün sayfasından plakanızı ya da isminizi yazarak sipariş verebilirsiniz.\n\n" + `${SITE}/urun/kisiye-ozel-araba-plaka-anahtarlik-isimli-plakalik-hediyelik`,
    related: ["kargo-sure", "kisiye-ozel-iade"],
  },

  // ── İletişim ────────────────────────────────────────────
  {
    id: "iletisim",
    category: "iletisim",
    short: "İletişim bilgileri",
    question: "Size nasıl ulaşırım?",
    variants: ["telefon numaranız", "e-posta adresiniz", "mail", "sizi arayabilir miyim", "instagram"],
    keywords: ["telefon", "iletişim", "mail", "e-posta", "numara", "instagram"],
    answer:
      "☎️ 0 533 425 14 95 (hafta içi 09:00–18:00)\n✉️ zuulab.co@gmail.com\n📷 instagram.com/zuu.lab\n\nEn hızlı cevap için bu WhatsApp sohbeti 💬",
    related: ["saatler"],
  },
  {
    id: "saatler",
    category: "iletisim",
    short: "Çalışma saatleri",
    question: "Çalışma saatleriniz nedir?",
    variants: ["kaçta açılıyorsunuz", "şu an açık mısınız", "hafta sonu çalışıyor musunuz", "cumartesi açık mı"],
    keywords: ["saat", "açık", "mesai", "hafta sonu"],
    answer:
      "Canlı destek hafta içi *09:00–18:00*. Siparişlerinizi sitemizden 7/24 verebilirsiniz; mesai dışında yazdığınız mesajlara ilk iş saatinde dönüyoruz.",
    related: ["iletisim"],
  },
  {
    id: "adres",
    category: "iletisim",
    short: "Atölye adresi",
    question: "Atölyeniz nerede, gelip alabilir miyim?",
    variants: ["neredesiniz", "nerdesiniz", "mağazanız var mı", "elden teslim", "ziyaret edebilir miyim", "bolu"],
    keywords: ["adres", "nerede", "atölye", "mağaza", "ziyaret", "elden"],
    answer:
      "Atölyemiz *Bolu Merkez*'de. Üretim alanı olduğu için ziyaretçi kabul edemiyoruz; tüm siparişleri kargoyla gönderiyoruz.",
    related: ["kargo-sure"],
  },
];

export const faqById = new Map(faq.map((f) => [f.id, f]));
export const categoryById = new Map(categories.map((c) => [c.id, c]));
