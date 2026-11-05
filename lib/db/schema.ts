/**
 * Kara Sancak veri modeli.
 *
 * Tüm zaman alanları epoch milisaniye (integer) olarak tutulur. Bu sayede Server
 * Component'ler ile Client Component'ler arasında serileştirme derdi olmaz.
 */
import {
  blob,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

/* ------------------------------------------------------------------ */
/* Üyelik                                                              */
/* ------------------------------------------------------------------ */

export const ranks = sqliteTable("ranks", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  /** Küçükten büyüğe hiyerarşi. Büyük sayı = yüksek rütbe. */
  sortOrder: integer("sort_order").notNull().default(0),
  /** Rütbe seçilmeden onaylanan üyeye verilir. */
  isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at").notNull(),
});

export const USER_ROLES = ["member", "moderator", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    /** Küçük harfli, benzersiz. URL ve @bahsetme için kullanılır. */
    username: text("username").notNull(),
    displayName: text("display_name").notNull(),
    email: text("email"),
    phone: text("phone"),
    /** Aktivasyon linkini kullanana kadar boş kalabilir. */
    passwordHash: text("password_hash"),
    role: text("role", { enum: USER_ROLES }).notNull().default("member"),
    status: text("status", { enum: ["active", "suspended"] })
      .notNull()
      .default("active"),
    rankId: text("rank_id").references(() => ranks.id, { onDelete: "set null" }),
    xp: integer("xp").notNull().default(0),
    level: integer("level").notNull().default(1),
    bio: text("bio"),
    city: text("city"),
    instagram: text("instagram"),
    tribune: text("tribune"),
    avatarVersion: integer("avatar_version").notNull().default(0),
    referralCode: text("referral_code").notNull(),
    referredById: text("referred_by_id"),
    streak: integer("streak").notNull().default(0),
    bestStreak: integer("best_streak").notNull().default(0),
    /** Europe/Istanbul günü, YYYY-MM-DD */
    lastCheckInDay: text("last_check_in_day"),
    lastSeenAt: integer("last_seen_at"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [
    uniqueIndex("users_username_uq").on(t.username),
    uniqueIndex("users_email_uq").on(t.email),
    uniqueIndex("users_referral_code_uq").on(t.referralCode),
    index("users_xp_idx").on(t.xp),
    index("users_referred_by_idx").on(t.referredById),
  ],
);

export const avatars = sqliteTable("avatars", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  mime: text("mime").notNull(),
  data: blob("data", { mode: "buffer" }).notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const sessions = sqliteTable(
  "sessions",
  {
    /** Çerezdeki token'ın SHA-256 özeti. Token'ın kendisi saklanmaz. */
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: integer("expires_at").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const passwordTokens = sqliteTable(
  "password_tokens",
  {
    /** Linkteki token'ın SHA-256 özeti */
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    purpose: text("purpose", { enum: ["activation", "reset"] }).notNull(),
    expiresAt: integer("expires_at").notNull(),
    usedAt: integer("used_at"),
    createdById: text("created_by_id"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("password_tokens_user_idx").on(t.userId)],
);

export const APPLICATION_STATUSES = ["pending", "approved", "rejected"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const applications = sqliteTable(
  "applications",
  {
    id: text("id").primaryKey(),
    fullName: text("full_name").notNull(),
    username: text("username").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    city: text("city").notNull(),
    tribune: text("tribune"),
    instagram: text("instagram"),
    motivation: text("motivation").notNull(),
    passwordHash: text("password_hash").notNull(),
    referrerId: text("referrer_id").references(() => users.id, { onDelete: "set null" }),
    status: text("status", { enum: APPLICATION_STATUSES }).notNull().default("pending"),
    reviewNote: text("review_note"),
    reviewedById: text("reviewed_by_id").references(() => users.id, { onDelete: "set null" }),
    reviewedAt: integer("reviewed_at"),
    createdUserId: text("created_user_id").references(() => users.id, { onDelete: "set null" }),
    kvkkConsentAt: integer("kvkk_consent_at").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [
    index("applications_status_idx").on(t.status, t.createdAt),
    index("applications_email_idx").on(t.email),
    index("applications_username_idx").on(t.username),
    index("applications_referrer_idx").on(t.referrerId),
  ],
);

/* ------------------------------------------------------------------ */
/* Referans                                                            */
/* ------------------------------------------------------------------ */

export const referralClicks = sqliteTable(
  "referral_clicks",
  {
    id: text("id").primaryKey(),
    referrerId: text("referrer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** IP + tarayıcı özetinin gizli anahtarla HMAC'i. Ham IP saklanmaz. */
    visitorHash: text("visitor_hash").notNull(),
    day: text("day").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [
    uniqueIndex("referral_clicks_uq").on(t.referrerId, t.visitorHash, t.day),
    index("referral_clicks_referrer_idx").on(t.referrerId),
  ],
);

/* ------------------------------------------------------------------ */
/* XP                                                                  */
/* ------------------------------------------------------------------ */

export const xpRules = sqliteTable("xp_rules", {
  key: text("key").primaryKey(),
  label: text("label").notNull(),
  description: text("description").notNull().default(""),
  category: text("category").notNull().default("genel"),
  amount: integer("amount").notNull(),
  /** Günde en fazla kaç kez XP kazandırır. Boş = sınırsız. */
  dailyCap: integer("daily_cap"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const xpEvents = sqliteTable(
  "xp_events",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Elle yapılan düzeltmelerde "manual" */
    ruleKey: text("rule_key").notNull(),
    amount: integer("amount").notNull(),
    reason: text("reason"),
    /** Aynı işlemin iki kez ödül vermesini engeller. */
    dedupeKey: text("dedupe_key"),
    day: text("day").notNull(),
    actorId: text("actor_id"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [
    uniqueIndex("xp_events_dedupe_uq").on(t.dedupeKey),
    index("xp_events_user_idx").on(t.userId, t.createdAt),
    index("xp_events_user_rule_day_idx").on(t.userId, t.ruleKey, t.day),
    index("xp_events_created_idx").on(t.createdAt),
  ],
);

export const achievements = sqliteTable(
  "achievements",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.key] })],
);

/* ------------------------------------------------------------------ */
/* Forum                                                               */
/* ------------------------------------------------------------------ */

export const forumCategories = sqliteTable(
  "forum_categories",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
    /** members: yalnızca giriş yapmış üyeler görebilir */
    visibility: text("visibility", { enum: ["public", "members"] })
      .notNull()
      .default("public"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [uniqueIndex("forum_categories_slug_uq").on(t.slug)],
);

export const topics = sqliteTable(
  "topics",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    categoryId: text("category_id")
      .notNull()
      .references(() => forumCategories.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    isPinned: integer("is_pinned", { mode: "boolean" }).notNull().default(false),
    isLocked: integer("is_locked", { mode: "boolean" }).notNull().default(false),
    viewCount: integer("view_count").notNull().default(0),
    replyCount: integer("reply_count").notNull().default(0),
    lastPostAt: integer("last_post_at").notNull(),
    lastPostById: text("last_post_by_id"),
    deletedAt: integer("deleted_at"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [
    uniqueIndex("topics_slug_uq").on(t.slug),
    index("topics_category_idx").on(t.categoryId, t.isPinned, t.lastPostAt),
    index("topics_last_post_idx").on(t.lastPostAt),
    index("topics_author_idx").on(t.authorId),
  ],
);

export const posts = sqliteTable(
  "posts",
  {
    id: text("id").primaryKey(),
    topicId: text("topic_id")
      .notNull()
      .references(() => topics.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    isOpening: integer("is_opening", { mode: "boolean" }).notNull().default(false),
    likeCount: integer("like_count").notNull().default(0),
    editedAt: integer("edited_at"),
    deletedAt: integer("deleted_at"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [
    index("posts_topic_idx").on(t.topicId, t.createdAt),
    index("posts_author_idx").on(t.authorId, t.createdAt),
  ],
);

export const postLikes = sqliteTable(
  "post_likes",
  {
    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.postId, t.userId] }),
    index("post_likes_user_idx").on(t.userId),
  ],
);

/* ------------------------------------------------------------------ */
/* Mesajlaşma                                                          */
/* ------------------------------------------------------------------ */

export const conversations = sqliteTable(
  "conversations",
  {
    id: text("id").primaryKey(),
    type: text("type", { enum: ["direct", "room"] }).notNull(),
    /** Doğrudan sohbetlerde sıralı "kullanıcıA:kullanıcıB". Tekrarı engeller. */
    directKey: text("direct_key"),
    title: text("title"),
    lastMessageAt: integer("last_message_at"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [uniqueIndex("conversations_direct_key_uq").on(t.directKey)],
);

export const conversationMembers = sqliteTable(
  "conversation_members",
  {
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lastReadAt: integer("last_read_at").notNull().default(0),
  },
  (t) => [
    primaryKey({ columns: [t.conversationId, t.userId] }),
    index("conversation_members_user_idx").on(t.userId),
  ],
);

export const messages = sqliteTable(
  "messages",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderId: text("sender_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    deletedAt: integer("deleted_at"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("messages_conversation_idx").on(t.conversationId, t.createdAt)],
);

/* ------------------------------------------------------------------ */
/* Bildirim                                                            */
/* ------------------------------------------------------------------ */

export const notifications = sqliteTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    href: text("href"),
    readAt: integer("read_at"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("notifications_user_idx").on(t.userId, t.readAt, t.createdAt)],
);

/* ------------------------------------------------------------------ */
/* İçerik: duyuru, etkinlik, maç                                       */
/* ------------------------------------------------------------------ */

export const announcements = sqliteTable(
  "announcements",
  {
    id: text("id").primaryKey(),
    /** Afişteki büyük başlık. Örn: "Kamuoyuna Duyuru" */
    kicker: text("kicker").notNull().default("Duyuru"),
    title: text("title").notNull(),
    body: text("body").notNull(),
    published: integer("published", { mode: "boolean" }).notNull().default(true),
    pinned: integer("pinned", { mode: "boolean" }).notNull().default(false),
    publishedAt: integer("published_at").notNull(),
    createdById: text("created_by_id"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("announcements_published_idx").on(t.published, t.publishedAt)],
);

export const events = sqliteTable(
  "events",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    location: text("location").notNull(),
    city: text("city"),
    startsAt: integer("starts_at").notNull(),
    /** Saat henüz açıklanmadıysa yalnızca tarih gösterilir. */
    timeAnnounced: integer("time_announced", { mode: "boolean" }).notNull().default(true),
    /** Yoklamayla katılımı onaylanan üyeye verilecek XP */
    xpReward: integer("xp_reward").notNull().default(150),
    published: integer("published", { mode: "boolean" }).notNull().default(true),
    createdById: text("created_by_id"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [
    uniqueIndex("events_slug_uq").on(t.slug),
    index("events_starts_idx").on(t.startsAt),
  ],
);

export const eventAttendees = sqliteTable(
  "event_attendees",
  {
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rsvpAt: integer("rsvp_at").notNull(),
    attendedAt: integer("attended_at"),
  },
  (t) => [
    primaryKey({ columns: [t.eventId, t.userId] }),
    index("event_attendees_user_idx").on(t.userId),
  ],
);

export const matches = sqliteTable(
  "matches",
  {
    id: text("id").primaryKey(),
    competition: text("competition").notNull(),
    homeTeam: text("home_team").notNull(),
    awayTeam: text("away_team").notNull(),
    venue: text("venue").notNull().default(""),
    kickoffAt: integer("kickoff_at").notNull(),
    homeScore: integer("home_score"),
    awayScore: integer("away_score"),
    status: text("status", { enum: ["scheduled", "finished"] })
      .notNull()
      .default("scheduled"),
    settledAt: integer("settled_at"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("matches_kickoff_idx").on(t.kickoffAt)],
);

export const predictions = sqliteTable(
  "predictions",
  {
    matchId: text("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    homeScore: integer("home_score").notNull(),
    awayScore: integer("away_score").notNull(),
    awardedXp: integer("awarded_xp"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.matchId, t.userId] }),
    index("predictions_user_idx").on(t.userId),
  ],
);

/* ------------------------------------------------------------------ */
/* Altyapı                                                             */
/* ------------------------------------------------------------------ */

export const rateLimits = sqliteTable("rate_limits", {
  key: text("key").primaryKey(),
  windowStart: integer("window_start").notNull(),
  count: integer("count").notNull().default(0),
});

export const auditLogs = sqliteTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    actorId: text("actor_id"),
    action: text("action").notNull(),
    summary: text("summary").notNull(),
    targetType: text("target_type"),
    targetId: text("target_id"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("audit_logs_created_idx").on(t.createdAt)],
);
