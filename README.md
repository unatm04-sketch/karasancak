# Kara Sancak 1903

Kara Sancak Taraftar Grubu'nun sitesi: tanıtım sayfası, üyelik başvurusu, forum, mesajlaşma,
XP ve seviye sistemi, referans linkleri, maç tahminleri, etkinlik yoklaması ve yönetim paneli.

> Gökte Kartal, Yerde Bozkurt ol.

## Kurulum

```bash
npm install
cp .env.example .env.local   # APP_SECRET ve ADMIN_PASSWORD değerlerini doldur
npm run db:setup             # tabloları oluşturur, rütbe/XP/kategori ve yöneticiyi ekler
npm run dev
```

`ADMIN_PASSWORD` boş bırakılırsa şifre üretilip konsola bir kez yazılır.

Yerelde örnek üyeler ve forum içeriğiyle denemek için:

```bash
npm run db:seed -- --demo
```

Örnek üyelerin şifresi `DEMO_PASSWORD` değeridir. Bu komut canlı veritabanında çalışmaz.

## Komutlar

| Komut | Görevi |
| --- | --- |
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` / `npm start` | Üretim derlemesi ve sunucusu |
| `npm run typecheck` / `npm run lint` | Tip ve kod kontrolü |
| `npm run db:generate` | Şema değişince yeni migration üretir |
| `npm run db:migrate` | Migration'ları uygular |
| `npm run db:seed` | Kurulum verisini ekler (tekrar çalıştırmak güvenlidir) |
| `npm run db:studio` | Veritabanını tarayıcıda açar |

## Canlıya alma

Veritabanı libSQL'dir: yerelde dosya, canlıda [Turso](https://turso.tech). Kod değişmez, yalnızca
ortam değişkenleri değişir.

```
DATABASE_URL=libsql://...
DATABASE_AUTH_TOKEN=...
APP_SECRET=...                 # zorunlu
NEXT_PUBLIC_SITE_URL=https://alanadi.com   # referans linkleri bu adresle üretilir
```

Sunucusuz ortamlarda (Vercel gibi) dosya tabanlı SQLite kalıcı olmadığı için Turso gerekir. Kendi
sunucunda çalıştırırsan `file:` adresi de yeterlidir, `data/` klasörünü yedeklemeyi unutma.

Dağıtımdan önce `npm run db:setup` komutunu canlı değişkenlerle bir kez çalıştır.

## Sistem nasıl işliyor

**Üyelik.** İki yol var: ziyaretçi `/basvuru` formunu doldurur ve yönetim her başvuruyu tek tek
onaylarken rütbesini verir; ya da yönetim `/yonetim/uyeler/yeni` ekranından doğrudan üye tanımlar.
İkinci yolda üye, tek kullanımlık aktivasyon linkiyle kendi şifresini belirler. E-posta altyapısı
olmadığı için şifre sıfırlama linkleri de yönetim panelinden üretilip üyeye elle iletilir.

**Seviye ve rütbe ayrı şeylerdir.** Seviye XP ile kendiliğinden yükselir (`lib/xp/levels.ts`).
Rütbe yönetimin verdiği unvandır, adları `/yonetim/rutbeler` ekranından değiştirilebilir.

**XP.** Tüm kazanımlar `lib/xp/award.ts` içindeki `awardXp` fonksiyonundan geçer. Miktarlar ve günlük
limitler `/yonetim/xp` ekranından ayarlanır, varsayılanlar `lib/xp/rules.ts` dosyasındadır. Çift
ödül benzersiz `dedupeKey` ile engellenir; silinen yazıların XP'si geri alınır.

**Referans.** Her üyenin `/r/kod` linki vardır. Ziyaretçi çerezle başvuruya kadar izlenir. Tıklama,
başvuru ve onay ayrı ayrı XP kazandırır; kendi linkine tıklamak ve aynı kişinin tekrar gelmesi
sayılmaz. Ham IP saklanmaz, yalnızca gizli anahtarlı özeti tutulur.

**Yetki.** Her Server Action ilk satırında `requireUser`, `requireStaff` veya `requireAdmin` çağırır
(`lib/auth/dal.ts`). `proxy.ts` yalnızca iyimser bir yönlendirme yapar, asıl kontrol değildir.

## Klasörler

```
app/(site)/        Üye ve yönetim sayfaları
app/page.tsx       Tanıtım sayfası
components/        landing, forum, messages, member, admin, ui, site
lib/actions/       Server Action'lar (tüm yazma işlemleri)
lib/queries/       Okuma sorguları
lib/xp/            Seviye eğrisi, kurallar, ödül motoru, nişanlar
lib/db/schema.ts   Veri modeli
scripts/           migrate, seed, gen-icons
```

## Değiştirilebilir içerik

- **Arma:** `lib/brand/emblem.ts`. Instagram logosundan elle çizilmiş vektördür; grubun asıl dosyası
  varsa yollar onunla değiştirilebilir.
- **Fotoğraflar:** `public/img/` klasöründedir, `lib/brand/images.ts` içinde tanımlıdır. Bu dosya aynı
  zamanda `/kaynaklar` sayfasındaki lisans listesini üretir. Grubun kendi fotoğrafını kullanacaksanız
  dosyayı değiştirip bu listedeki sahip ve lisans bilgisini de güncelleyin. CC lisanslı görsellerde
  atıf zorunludur, `/kaynaklar` sayfasını kaldırmayın.
- **İkonlar:** `scripts/gen-icons.mjs` listesine ekleyip betiği çalıştırın.

## Yayın öncesi kontrol listesi

- [ ] `/kvkk` metnini hukuk danışmanına okutun, başvuru için iletişim bilgisi ekleyin.
- [ ] `.env` değerlerini ve yönetici şifresini canlı için yenileyin.
- [ ] Veritabanı yedeğini planlayın.
