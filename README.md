# PATİMATİK — canlı QR mama/su takip sitesi

Bu proje React + Vite + Supabase ile hazırlanmış bir başlangıç sürümüdür. QR kodla nokta sayfası açılır; ziyaretçi mama/su bildirimi gönderir; veritabanı tetikleyicisi ilgili son bildirim zamanını günceller. Realtime aboneliği açık sayfalarda güncellemeyi anında yansıtır.

## İçindekiler
- Ana sayfa ve aktif nokta listesi
- Her istasyon için ayrı `/nokta/slug` sayfası
- Mama bıraktım / Su koydum bildirimleri
- Son bildirim zamanı ve geçen süre
- Yönetici girişi, istasyon ekleme, aktif/pasif yapma
- İstasyon başına QR kod üretimi

## 1. Supabase kurulumu
1. https://supabase.com üzerinden ücretsiz bir proje açın.
2. Project Settings → API bölümünden Project URL ve anon/public key değerlerini alın.
3. Supabase → SQL Editor → New query bölümünde `supabase/schema.sql` dosyasının tamamını çalıştırın.
4. Authentication → Users bölümünden yönetici hesabı oluşturun (e-posta/şifre).
5. Oluşan kullanıcının UUID bilgisini kopyalayın. SQL Editor'de şu komutu UUID ile çalıştırın:
   `insert into public.admins (user_id) values ('KULLANICI-UUID');`
6. Project Settings → API → anon/public key ve Project URL bilgilerini kullanarak proje kökünde `.env` adlı dosya oluşturun. `.env.example` içeriğini kopyalayıp değerleri girin:
   ```
   VITE_SUPABASE_URL=https://proje-kimligi.supabase.co
   VITE_SUPABASE_ANON_KEY=anon-public-key
   ```
   Supabase `service_role` anahtarını ASLA tarayıcıya veya `.env` içindeki `VITE_` değişkenlerine koymayın.

## 2. Bilgisayarda çalıştırma
Node.js 20 veya üzeri kurulu olmalı.
```bash
npm install
npm run dev
```
Terminalde çıkan yerel adresi açın. Üretim kontrolü:
```bash
npm run build
```

## 3. İnternette yayınlama (Vercel)
1. Projeyi GitHub'a yükleyin.
2. https://vercel.com üzerinden New Project ile GitHub deposunu içe aktarın.
3. Environment Variables alanına `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` değerlerini ekleyin.
4. Deploy edin. `vercel.json` QR bağlantılarındaki sayfa yönlendirmesini sağlar.
5. Vercel'in verdiği alan adını kullanarak yönetim paneline girin: `https://alan-adiniz/yonetim`.
6. Yönetim panelinde her nokta için QR kod görünür. QR kodu indirip/yazdırmak için QR görseline sağ tıklayıp kaydedebilirsiniz.

## 4. Kullanım
- Yönetici `/yonetim` adresinden giriş yapar ve nokta ekler.
- Her nokta için QR kod otomatik oluşur.
- QR kodu okutan kişi o istasyonun sayfasına gider.
- Mama veya su koyduktan sonra ilgili butona basar.
- Kayıt sunucu zamanıyla eklenir; istasyonun son mama/su zamanı otomatik güncellenir.
- Ana sayfa ve açık istasyon sayfaları Realtime ile güncellenir.

## Önemli sınırlar / canlıya çıkmadan önce
- Bildirimler kullanıcı beyanıdır; sistem fiziksel olarak kapta mama veya su olduğunu sensörle doğrulamaz. Arayüz bunu açıkça belirtir.
- Herkese açık bildirim butonları kötüye kullanılabilir. Bu sürüm öğrenci projesi MVP'sidir; halka açmadan önce CAPTCHA / rate-limit, moderasyon ve raporlama mekanizması eklenmesi önerilir.
- “Yeni bildirildi / kontrol önerilir / uzun süredir bildirim yok” eşikleri başlangıç için 6 ve 24 saattir; proje ekibinin saha ihtiyacına göre değiştirilebilir.
- Realtime çalışması için Supabase projesinde `stations` tablosunun Realtime/Replication ayarının açık olduğunu kontrol edin.
- Supabase ücretsiz plan limitleri ve Vercel ücretsiz plan koşulları zamanla değişebilir; yayınlamadan önce güncel koşulları kontrol edin.

## Teknoloji
React, Vite, Supabase (Postgres + Auth + Realtime), qrcode.react, Vercel.
