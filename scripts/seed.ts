/**
 * Kurulum verisi. Tekrar çalıştırmak güvenlidir: var olan kayıtların üzerine yazmaz,
 * yönetim panelinde yapılan değişiklikler korunur.
 *
 *   npm run db:seed            Rütbeler, XP kuralları, kategoriler, yönetici ve gerçek içerik
 *   npm run db:seed -- --demo  Ek olarak örnek üyeler ve forum içeriği (yalnızca yerel)
 */
import "./_env";
import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { hashPassword } from "../lib/auth/password";
import { db } from "../lib/db";
import {
  achievements,
  announcements,
  applications,
  conversationMembers,
  conversations,
  eventAttendees,
  events,
  forumCategories,
  matches,
  messages,
  notifications,
  postLikes,
  posts,
  predictions,
  ranks,
  referralClicks,
  topics,
  users,
  xpEvents,
  xpRules,
} from "../lib/db/schema";
import { istanbulDay, slugify } from "../lib/format";
import { newId, newReferralCode, newSlugSuffix } from "../lib/ids";
import { levelFromXp } from "../lib/xp/levels";
import { DEFAULT_XP_RULES } from "../lib/xp/rules";

const NOW = Date.now();
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
/** Türkiye saatinde belirtilmiş bir anı epoch ms'e çevirir. */
const trTime = (iso: string) => new Date(`${iso}+03:00`).getTime();

const RANKS = [
  { id: "er", name: "Er", description: "Sürünün yeni neferi. Onaylanan her üyenin ilk rütbesi.", sortOrder: 10, isDefault: true },
  { id: "alp", name: "Alp", description: "Sahada ve tribünde kendini kanıtlamış yiğit.", sortOrder: 20 },
  { id: "buyruk", name: "Buyruk", description: "Etkinliklerde görev alan, sorumluluk üstlenen üye.", sortOrder: 30 },
  { id: "tarkan", name: "Tarkan", description: "Şehrinde sürüyü toplayan temsilci.", sortOrder: 40 },
  { id: "sad", name: "Şad", description: "Kurullarda görev yapan üye.", sortOrder: 50 },
  { id: "yabgu", name: "Yabgu", description: "Başkana vekâlet eden üst düzey yönetici.", sortOrder: 60 },
  { id: "kagan", name: "Kağan", description: "Sancağı taşıyan grup başkanı.", sortOrder: 70 },
];

const CATEGORIES = [
  { id: "cat-mac", name: "Maç Günü", description: "Maç önü, maç sonu, kadro ve tribün. Düdük çalmadan buradayız.", visibility: "public" as const },
  { id: "cat-gundem", name: "Beşiktaş Gündemi", description: "Transfer, kulüp ve sezon konuşmaları.", visibility: "public" as const },
  { id: "cat-ata", name: "Atatürk ve Cumhuriyet", description: "Ata'mızın izinde; tarih, okuma önerileri, anma günleri.", visibility: "public" as const },
  { id: "cat-etkinlik", name: "Yürüyüş ve Etkinlikler", description: "Kortej, Anıtkabir ziyareti, buluşma organizasyonları.", visibility: "public" as const },
  { id: "cat-deplasman", name: "Deplasman", description: "Yol arkadaşı, otobüs, bilet ve konaklama.", visibility: "public" as const },
  { id: "cat-sehirler", name: "Şehirler", description: "Edirne'den Kars'a, her şehirdeki sürü burada buluşur.", visibility: "public" as const },
  { id: "cat-kadinlar", name: "Kara Sancak Kadınları", description: "Tribünde ve alanlarda birlikte.", visibility: "public" as const },
  { id: "cat-otag", name: "Otağ", description: "Üyelere özel iç sohbet.", visibility: "members" as const },
];

async function seedCore() {
  await db
    .insert(ranks)
    .values(RANKS.map((r) => ({ ...r, createdAt: NOW })))
    .onConflictDoNothing();

  await db
    .insert(xpRules)
    .values(DEFAULT_XP_RULES.map((r, i) => ({ ...r, sortOrder: i * 10 })))
    .onConflictDoNothing();

  await db
    .insert(forumCategories)
    .values(
      CATEGORIES.map((c, i) => ({
        ...c,
        slug: slugify(c.name),
        sortOrder: (i + 1) * 10,
        createdAt: NOW,
      })),
    )
    .onConflictDoNothing();

  await db
    .insert(conversations)
    .values({ id: "tribun", type: "room", title: "Tribün", createdAt: NOW })
    .onConflictDoNothing();
}

/**
 * @karasancak1903 hesabında yayınlanmış gerçek içerik (Kasım 2026).
 * Etkinlik saatleri ve metinleri gönderilerden alınmıştır.
 */
async function seedRealContent() {
  await db
    .insert(matches)
    .values([
      {
        id: "m-besiktas-basaksehir",
        competition: "Trendyol Süper Lig",
        homeTeam: "Beşiktaş",
        awayTeam: "Başakşehir",
        venue: "Tüpraş Stadyumu, İstanbul",
        kickoffAt: trTime("2026-10-26T19:00:00"),
        homeScore: 2,
        awayScore: 0,
        status: "finished",
        settledAt: trTime("2026-10-26T21:00:00"),
        createdAt: NOW,
      },
      {
        id: "m-celtic-besiktas",
        competition: "UEFA Avrupa Ligi",
        homeTeam: "Celtic",
        awayTeam: "Beşiktaş",
        venue: "Celtic Park, Glasgow",
        kickoffAt: trTime("2026-11-05T23:00:00"),
        createdAt: NOW,
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(events)
    .values([
      {
        id: "e-anitkabir-2026",
        slug: "10-kasim-anitkabir-ziyareti-2026",
        title: "10 Kasım Anıtkabir Ziyareti",
        description:
          "10 Kasım Atatürk'ü Anma Günü dolayısıyla, Cumhuriyetimizin kurucusu Gazi Mustafa Kemal Atatürk'ü saygı, özlem ve minnetle anmak üzere 8 Kasım'da Anıtkabir'deyiz.\n\nBüyük önderimizin huzurunda olmak yalnızca bir ziyaret değil, tarihimize ve değerlerimize duyduğumuz bağlılığın ifadesidir.\n\nAtam, izindeyiz.",
        location: "Anıtkabir",
        city: "Ankara",
        startsAt: trTime("2026-11-08T12:00:00"),
        timeAnnounced: false,
        xpReward: 200,
        createdAt: NOW,
      },
      {
        id: "e-29-ekim-2026",
        slug: "29-ekim-cumhuriyet-yuruyusu-2026",
        title: "29 Ekim Cumhuriyet Yürüyüşü",
        description:
          "Beşiktaş Belediyesinin olumsuz hava koşulları nedeniyle yürüyüşü iptal etmesi üzerine rotamızı Kadıköy'e çevirdik.\n\nKara Sancak 1903 olarak Cumhuriyet için, Ata'mızın izinde alandaydık. Yaşasın Cumhuriyet!",
        location: "Şaşkınbakkal Işıklar, Bağdat Caddesi",
        city: "İstanbul",
        startsAt: trTime("2026-10-29T18:45:00"),
        timeAnnounced: true,
        xpReward: 200,
        createdAt: NOW,
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(announcements)
    .values([
      {
        id: "a-anitkabir",
        kicker: "Anma",
        title: "8 Kasım'da Anıtkabir'deyiz",
        body: "10 Kasım Atatürk'ü Anma Günü dolayısıyla, Cumhuriyetimizin kurucusu Gazi Mustafa Kemal Atatürk'ü saygı, özlem ve minnetle anmak üzere 8 Kasım'da Anıtkabir'deyiz.",
        pinned: true,
        publishedAt: trTime("2026-11-02T12:00:00"),
        createdAt: NOW,
      },
      {
        id: "a-danisma",
        kicker: "Kamuoyuna Duyuru",
        title: "Danışma Kurulu Başkanlığına Sait Ören atanmıştır",
        body: "Derneğimizin Danışma Kurulu Başkanlığına Sait Ören atanmıştır. Kendisine yeni görevinde başarılar dileriz. Kutlu olsun.",
        publishedAt: trTime("2026-10-28T12:00:00"),
        createdAt: NOW,
      },
    ])
    .onConflictDoNothing();
}

async function seedAdmin() {
  const username = (process.env.ADMIN_USERNAME ?? "kagan").toLowerCase();
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  if (existing) return existing.id;

  let password = process.env.ADMIN_PASSWORD;
  const generated = !password;
  if (!password) password = randomBytes(12).toString("base64url");

  const id = newId();
  await db.insert(users).values({
    id,
    username,
    displayName: process.env.ADMIN_NAME ?? "Sancak Yönetimi",
    email: process.env.ADMIN_EMAIL || null,
    passwordHash: await hashPassword(password),
    role: "admin",
    rankId: "kagan",
    referralCode: newReferralCode(),
    createdAt: NOW,
  });

  console.log(`Yönetici oluşturuldu: ${username}`);
  if (generated) {
    console.log(`Üretilen şifre (bir daha gösterilmeyecek): ${password}`);
  } else {
    console.log("Şifre: ADMIN_PASSWORD ortam değişkenindeki değer.");
  }
  return id;
}

/* ------------------------------- Demo -------------------------------- */

const DEMO_MEMBERS = [
  { username: "kartal_deniz", displayName: "Deniz Akbaş", city: "İstanbul", tribune: "Kapalı Tribün", rank: "tarkan", xp: 6240, streak: 21, bio: "Dolmabahçe'de büyüdüm, hâlâ oradayım." },
  { username: "asena_selin", displayName: "Selin Kayaoğlu", city: "Ankara", tribune: "Doğu Tribünü", rank: "buyruk", xp: 4980, streak: 12, bio: "Kara Sancak Kadınları. Anıtkabir yolunda buluşalım." },
  { username: "edirneli_ufuk", displayName: "Ufuk Tuncer", city: "Edirne", tribune: "Deplasman", rank: "tarkan", xp: 3620, streak: 8, bio: "Serhat şehrinden selam olsun." },
  { username: "mert_1903", displayName: "Mert Yazıcı", city: "İzmir", tribune: "Yeni Açık", rank: "alp", xp: 2750, streak: 5, bio: "Deplasman kaçırmam." },
  { username: "karakartal_elif", displayName: "Elif Sönmez", city: "Bursa", tribune: "Numaralı", rank: "alp", xp: 1880, streak: 3, bio: null },
  { username: "ogulcan_bjk", displayName: "Oğulcan Erdem", city: "Trabzon", tribune: "Deplasman", rank: "er", xp: 1240, streak: 2, bio: "İstatistik sevenler buraya." },
  { username: "burcu_tribun", displayName: "Burcu Aydemir", city: "İstanbul", tribune: "Kapalı Tribün", rank: "er", xp: 640, streak: 1, bio: null },
  { username: "kerem_akaretler", displayName: "Kerem Öztürk", city: "Eskişehir", tribune: "Yeni Açık", rank: "er", xp: 310, streak: 0, bio: null },
];

const DEMO_TOPICS = [
  {
    category: "cat-mac", author: "kartal_deniz", title: "Celtic deplasmanı öncesi kadro tahminleri", pinned: true,
    body: "Glasgow'da hücum hattı nasıl olmalı? Ben orta sahada iki ön libero ile başlanmasından yanayım, Celtic Park'ın ilk yirmi dakikası her zaman zordur.",
    replies: [
      { author: "ogulcan_bjk", body: "Son beş deplasman maçında ilk yarı gol ortalamamız düşük. Tempoyu ilk başta düşürmek mantıklı." },
      { author: "mert_1903", body: "Biletimi aldım, Glasgow'a gidiyoruz. Sancağı oraya da taşıyacağız. @kartal_deniz orada görüşürüz." },
      { author: "burcu_tribun", body: "Evden bağıracağız ama sesimiz oraya kadar gidecek. Haydi Beşiktaş!" },
    ],
  },
  {
    category: "cat-ata", author: "asena_selin", title: "8 Kasım Anıtkabir ziyareti için ulaşım", pinned: true,
    body: "Ankara dışından gelecek arkadaşlar için ortak ulaşım planlayalım. Hangi şehirden kaç kişi geliyor, buraya yazalım.",
    replies: [
      { author: "edirneli_ufuk", body: "Edirne'den on kişilik bir grup çıkıyoruz. Yolda İstanbul'dan da alabiliriz." },
      { author: "karakartal_elif", body: "Bursa'dan üç kişiyiz, bir araç bulursak katılırız. Atam, izindeyiz." },
    ],
  },
  {
    category: "cat-mac", author: "mert_1903", title: "Başakşehir maçının ardından: 2-0'ın anlattıkları",
    body: "İkinci yarıdaki baskı bu sezon gördüğümüz en iyi oyundu. Kanatlardan gelen ortalar ve savunma arkası koşular üzerine konuşalım.",
    replies: [
      { author: "ogulcan_bjk", body: "İkinci golden sonra topa sahip olma oranı yüzde altmışı geçti. Oyunu kilitlemeyi öğrenmişiz." },
      { author: "kerem_akaretler", body: "Tribünden izlemesi ayrı keyifti. Sesimiz stadyumu inletti." },
    ],
  },
  {
    category: "cat-etkinlik", author: "edirneli_ufuk", title: "29 Ekim'de Edirne korteji fotoğrafları",
    body: "Edirne'de sancağımızı açtık. Yürüyüşe katılan herkese teşekkürler. Fotoğrafları bu başlık altında toplayalım.",
    replies: [{ author: "asena_selin", body: "Gurur duyduk. Emeğinize sağlık." }],
  },
  {
    category: "cat-deplasman", author: "kartal_deniz", title: "Deplasman yol arkadaşı rehberi",
    body: "Bu sezonki deplasmanlar için otobüs organizasyonlarını burada birleştirelim. Şehir, tarih ve boş koltuk sayısı yazmanız yeterli.",
    replies: [],
  },
  {
    category: "cat-gundem", author: "ogulcan_bjk", title: "Devre arası için transfer listesi",
    body: "Sol bek ve yaratıcı orta saha en acil ihtiyaç bana göre. Sizin listeniz nedir, gerekçesiyle yazın.",
    replies: [{ author: "mert_1903", body: "Sol beke katılıyorum ama önce kadro genişliğine bakmak lazım." }],
  },
  {
    category: "cat-kadinlar", author: "asena_selin", title: "Kara Sancak Kadınları buluşması",
    body: "İstanbul ve Ankara'da birer buluşma planlıyoruz. Katılmak isteyenler şehirlerini yazsın.",
    replies: [{ author: "burcu_tribun", body: "İstanbul için ben varım." }],
  },
  {
    category: "cat-otag", author: "kartal_deniz", title: "Yeni dönem pankart önerileri",
    body: "Bu başlık yalnızca üyelere açık. Gelecek maçlar için pankart ve koreografi fikirlerini burada toplayalım.",
    replies: [],
  },
];

async function seedDemo(adminId: string) {
  const [already] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, DEMO_MEMBERS[0]!.username))
    .limit(1);
  if (already) {
    console.log("Demo verisi zaten yüklü, atlandı.");
    return;
  }

  const password = process.env.DEMO_PASSWORD ?? randomBytes(12).toString("base64url");
  const passwordHash = await hashPassword(password);
  const ids = new Map<string, string>();
  const today = istanbulDay(NOW);

  for (const [i, m] of DEMO_MEMBERS.entries()) {
    const id = newId();
    ids.set(m.username, id);
    const joined = NOW - (60 - i * 6) * DAY;
    await db.insert(users).values({
      id,
      username: m.username,
      displayName: m.displayName,
      email: `${m.username}@ornek.test`,
      passwordHash,
      rankId: m.rank,
      role: m.username === "asena_selin" ? "moderator" : "member",
      xp: m.xp,
      level: levelFromXp(m.xp),
      city: m.city,
      tribune: m.tribune,
      bio: m.bio,
      streak: m.streak,
      bestStreak: m.streak + 4,
      lastCheckInDay: m.streak > 0 ? today : null,
      referralCode: newReferralCode(),
      // İlk üye sonraki bazı üyeleri davet etmiş sayılır.
      referredById: i >= 5 ? ids.get(DEMO_MEMBERS[0]!.username)! : null,
      createdAt: joined,
    });
    // Sıralamadaki haftalık/aylık görünüm boş kalmasın diye XP geçmişi
    await db.insert(xpEvents).values([
      { id: newId(), userId: id, ruleKey: "welcome", amount: 25, day: istanbulDay(joined), createdAt: joined },
      {
        id: newId(),
        userId: id,
        ruleKey: "post_create",
        amount: Math.round(m.xp * 0.12),
        reason: "Demo geçmişi",
        day: istanbulDay(NOW - (i + 1) * DAY),
        createdAt: NOW - (i + 1) * DAY,
      },
    ]);
  }

  const deniz = ids.get("kartal_deniz")!;
  await db.insert(referralClicks).values(
    Array.from({ length: 34 }, (_, i) => ({
      id: newId(),
      referrerId: deniz,
      visitorHash: `demo-${i}`,
      day: istanbulDay(NOW - (i % 12) * DAY),
      createdAt: NOW - (i % 12) * DAY,
    })),
  );
  await db.insert(achievements).values([
    { userId: deniz, key: "ilk_konu", createdAt: NOW - 40 * DAY },
    { userId: deniz, key: "davet_1", createdAt: NOW - 30 * DAY },
    { userId: deniz, key: "seri_7", createdAt: NOW - 20 * DAY },
    { userId: ids.get("asena_selin")!, key: "ilk_konu", createdAt: NOW - 30 * DAY },
    { userId: ids.get("asena_selin")!, key: "sahada_1", createdAt: NOW - 7 * DAY },
    { userId: ids.get("edirneli_ufuk")!, key: "sahada_1", createdAt: NOW - 7 * DAY },
  ]);

  // Forum
  let cursor = NOW - 9 * DAY;
  for (const t of DEMO_TOPICS) {
    const topicId = newId();
    const authorId = ids.get(t.author)!;
    const openingAt = (cursor += 6 * HOUR);
    const openingId = newId();
    let lastAt = openingAt;
    let lastBy = authorId;
    await db.insert(topics).values({
      id: topicId,
      slug: `${slugify(t.title)}-${newSlugSuffix()}`,
      categoryId: t.category,
      authorId,
      title: t.title,
      isPinned: t.pinned ?? false,
      viewCount: 24 + t.replies.length * 31,
      replyCount: t.replies.length,
      lastPostAt: openingAt,
      lastPostById: authorId,
      createdAt: openingAt,
    });
    await db.insert(posts).values({
      id: openingId,
      topicId,
      authorId,
      body: t.body,
      isOpening: true,
      likeCount: t.replies.length,
      createdAt: openingAt,
    });
    for (const [i, r] of t.replies.entries()) {
      const replyAt = (cursor += 2 * HOUR);
      const replyAuthor = ids.get(r.author)!;
      await db.insert(posts).values({
        id: newId(),
        topicId,
        authorId: replyAuthor,
        body: r.body,
        likeCount: i,
        createdAt: replyAt,
      });
      await db
        .insert(postLikes)
        .values({ postId: openingId, userId: replyAuthor, createdAt: replyAt })
        .onConflictDoNothing();
      lastAt = replyAt;
      lastBy = replyAuthor;
    }
    await db.update(topics).set({ lastPostAt: lastAt, lastPostById: lastBy }).where(eq(topics.id, topicId));
  }

  // Tribün sohbeti ve bir doğrudan sohbet
  const roomLines: Array<[string, string]> = [
    ["kartal_deniz", "Bu akşam Celtic maçı, herkes hazır mı?"],
    ["asena_selin", "Ankara'dan selamlar. Maçtan sonra da 8 Kasım planını konuşalım."],
    ["mert_1903", "Glasgow'dan yazıyorum, stat şimdiden dolmaya başladı!"],
    ["burcu_tribun", "Kolay gelsin, sesimiz sizinle."],
  ];
  for (const [i, [who, body]] of roomLines.entries()) {
    await db.insert(messages).values({
      id: newId(),
      conversationId: "tribun",
      senderId: ids.get(who)!,
      body,
      createdAt: NOW - (roomLines.length - i) * 20 * 60 * 1000,
    });
  }
  await db
    .update(conversations)
    .set({ lastMessageAt: NOW - 20 * 60 * 1000 })
    .where(eq(conversations.id, "tribun"));

  const selin = ids.get("asena_selin")!;
  const dmId = newId();
  await db.insert(conversations).values({
    id: dmId,
    type: "direct",
    directKey: [deniz, selin].sort().join(":"),
    lastMessageAt: NOW - 2 * HOUR,
    createdAt: NOW - DAY,
  });
  await db.insert(conversationMembers).values([
    { conversationId: dmId, userId: deniz, lastReadAt: NOW - 3 * HOUR },
    { conversationId: dmId, userId: selin, lastReadAt: NOW - 2 * HOUR },
  ]);
  await db.insert(messages).values([
    { id: newId(), conversationId: dmId, senderId: deniz, body: "8 Kasım için otobüs listesini aldın mı?", createdAt: NOW - 4 * HOUR },
    { id: newId(), conversationId: dmId, senderId: selin, body: "Aldım, akşam paylaşıyorum. On iki kişiyiz şimdilik.", createdAt: NOW - 2 * HOUR },
  ]);

  // Etkinlik katılımları ve maç tahminleri
  await db.insert(eventAttendees).values([
    { eventId: "e-anitkabir-2026", userId: selin, rsvpAt: NOW - 2 * DAY },
    { eventId: "e-anitkabir-2026", userId: ids.get("edirneli_ufuk")!, rsvpAt: NOW - 2 * DAY },
    { eventId: "e-anitkabir-2026", userId: ids.get("karakartal_elif")!, rsvpAt: NOW - DAY },
    { eventId: "e-29-ekim-2026", userId: deniz, rsvpAt: NOW - 8 * DAY, attendedAt: NOW - 7 * DAY },
    { eventId: "e-29-ekim-2026", userId: selin, rsvpAt: NOW - 8 * DAY, attendedAt: NOW - 7 * DAY },
    { eventId: "e-29-ekim-2026", userId: ids.get("mert_1903")!, rsvpAt: NOW - 8 * DAY },
  ]);
  await db.insert(predictions).values([
    { matchId: "m-besiktas-basaksehir", userId: deniz, homeScore: 2, awayScore: 0, awardedXp: 75, createdAt: NOW - 11 * DAY, updatedAt: NOW - 11 * DAY },
    { matchId: "m-besiktas-basaksehir", userId: selin, homeScore: 2, awayScore: 1, awardedXp: 20, createdAt: NOW - 11 * DAY, updatedAt: NOW - 11 * DAY },
    { matchId: "m-celtic-besiktas", userId: deniz, homeScore: 1, awayScore: 2, createdAt: NOW - DAY, updatedAt: NOW - DAY },
  ]);

  // İncelenmeyi bekleyen başvurular: yönetim paneli akışını denemek için
  const applicantHash = await hashPassword(process.env.DEMO_PASSWORD ?? randomBytes(12).toString("base64url"));
  await db.insert(applications).values([
    {
      id: newId(),
      fullName: "Nazlı Gürkan",
      username: "nazli_sancak",
      email: "nazli_sancak@ornek.test",
      phone: null,
      city: "Samsun",
      tribune: "Deplasman",
      instagram: "nazli.sancak",
      motivation: "19 Mayıs'ın şehrinden geliyorum. Beşiktaş'ı babamdan, Atatürk sevgisini annemden öğrendim. Sahadaki yürüyüşlerinizi uzaktan izliyordum, artık saflarda olmak istiyorum.",
      passwordHash: applicantHash,
      referrerId: deniz,
      kvkkConsentAt: NOW - 3 * HOUR,
      createdAt: NOW - 3 * HOUR,
    },
    {
      id: newId(),
      fullName: "Tolga Erkan",
      username: "tolga_erkan",
      email: "tolga_erkan@ornek.test",
      phone: null,
      city: "Antalya",
      tribune: "Yeni Açık",
      instagram: null,
      motivation: "Yirmi yıldır kombine sahibiyim. Antalya'daki Beşiktaşlıları toplamak ve deplasman organizasyonlarına destek olmak istiyorum.",
      passwordHash: applicantHash,
      kvkkConsentAt: NOW - 26 * HOUR,
      createdAt: NOW - 26 * HOUR,
    },
  ]);

  await db.insert(notifications).values({
    id: newId(),
    userId: adminId,
    type: "application",
    title: "İncelenmeyi bekleyen başvurular var",
    body: "Yönetim panelinden onaylayıp rütbe verebilirsin.",
    href: "/yonetim/basvurular",
    createdAt: NOW,
  });

  console.log(`Demo verisi yüklendi: ${DEMO_MEMBERS.length} üye, ${DEMO_TOPICS.length} konu.`);
  if (!process.env.DEMO_PASSWORD) console.log(`Demo üye şifresi: ${password}`);
}

async function main() {
  const demo = process.argv.includes("--demo");
  const url = process.env.DATABASE_URL ?? "file:";
  if (demo && (process.env.NODE_ENV === "production" || !url.startsWith("file:"))) {
    throw new Error("Demo verisi yalnızca yerel veritabanına yüklenebilir.");
  }

  await seedCore();
  await seedRealContent();
  const adminId = await seedAdmin();
  if (demo) await seedDemo(adminId);
  console.log("Kurulum verisi hazır.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
