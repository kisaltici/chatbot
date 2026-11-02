# zuulab asistan — WhatsApp botu

Firmanızı tanıyan, WhatsApp üzerinden çalışan asistan. Önce **hazır cevaplara** bakar (anında, ücretsiz), bulamazsa **AI**'ye firma bilginizle sorar.

## Nasıl çalışır

```
Müşteri WhatsApp mesajı
  → Meta Cloud API → /api/webhooks/whatsapp (imza doğrulanır, izinli numara kontrolü)
  → Karar motoru (src/lib/engine.ts)
      1. Menü / buton seçimi      → ilgili içerik
      2. Komutlar (#ai, #sifirla)
      3. Selam, teşekkür, "yetkili" gibi kalıplar
      4. Hazır cevap eşleşmesi ≥ %55 → AI çağrılmaz
      5. AI — NVIDIA (firma bilgisi + hazır cevaplar + son 12 mesaj)
      6. AI yoksa → "Bunu mu demek istediniz?" butonları
  → WhatsApp liste menüsü / butonlu cevap
```

## Özellikler

- WhatsApp liste menüsü (kategoriler) ve butonlu cevaplar (ilgili sorular)
- Türkçe'ye duyarlı eşleştirme: ek toleransı (randevumu ≈ randevu), yazım hatası toleransı, Türkçe karakter sadeleştirme
- Çalışma saati farkındalığı (mesai dışında "Yarın 09:00'da döneceğiz")
- "Yetkiliye bağlan" → firma sahibine WhatsApp bildirimi (`OWNER_NUMBER`)
- Sohbet hafızası (AI önceki mesajları hatırlar), `#sifirla` ile temizlenir
- `#ai soru` → hazır cevapları atlayıp AI'ye sor
- İzinli numara listesi (`ALLOWED_NUMBERS`) — sadece sizin numaranız yazabilsin
- Şifreli web paneli: WhatsApp simülatörü + her cevabın karar izi, hazır cevap test aracı, firma bilgisi, kurulum sihirbazı

## Düzenlenecek dosyalar

| Dosya | İçerik |
|---|---|
| `src/data/company.ts` | Firma adı, hizmetler, fiyatlar, saatler, iletişim, ton, yasaklar |
| Panel → Hazır cevaplar | Soruları ekle, düzenle, sil (Redis'te saklanır; ilk içerik `src/data/faq.ts`) |

## Lokal geliştirme

```bash
npm install
cp .env.example .env.local   # NVIDIA_API_KEY ekleyin
npm run dev
```

Lokalde `ADMIN_PASSWORD` yoksa panel şifresiz açılır. WhatsApp webhook'u lokalde çalışmaz (Meta localhost'a ulaşamaz); simülatörü kullanın.

## Vercel'e yükleme

1. Projeyi GitHub'a gönderin, Vercel'de **Add New → Project** ile içe aktarın.
2. **Settings → Environment Variables** altına `.env.example`'daki değerleri girin (en az `ADMIN_PASSWORD` ve dört `WHATSAPP_*`).
3. `NVIDIA_API_KEY` değerini de ekleyin (AI bununla çalışır). İsterseniz `AI_MODEL` ile modeli değiştirin.
4. Deploy sonrası panelde **WhatsApp bağlantısı** sayfasındaki webhook adresini Meta'ya girin.
5. (Önerilir) Kalıcı hafıza için: `vercel integration add upstash/upstash-kv` → `REDIS_URL` otomatik gelir.

> Meta'nın geçici token'ı 24 saatte biter. Kalıcı çalışma için Meta Business Suite'te **System User** oluşturup kalıcı token alın.
