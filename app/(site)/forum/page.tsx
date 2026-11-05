import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { TopicRow } from "@/components/forum/topic-row";
import { buttonClass } from "@/components/ui/button";
import { Lock, MagnifyingGlass, Plus } from "@/components/ui/icons";
import { ListSkeleton, PageContainer, PageHeader, SectionTitle } from "@/components/ui/page";
import { getCurrentUser } from "@/lib/auth/session";
import { formatNumber } from "@/lib/format";
import { latestTopics, listCategories, searchTopics } from "@/lib/queries/forum";
import { requestTime } from "@/lib/request";

export const metadata: Metadata = {
  title: "Forum",
  description: "Maç günü, Beşiktaş gündemi, Atatürk ve Cumhuriyet, yürüyüş ve deplasman konuşmaları.",
};

export default function ForumPage({ searchParams }: PageProps<"/forum">) {
  return (
    <PageContainer>
      <PageHeader
        title="Forum"
        description="Maç önü, maç sonu, yürüyüş planı, deplasman. Yazdıkça ve beğeni topladıkça XP kazanırsın."
        actions={
          <Link href="/forum/yeni" className={buttonClass("primary", "md")}>
            <Plus size={16} />
            Yeni konu
          </Link>
        }
      />
      <form role="search" action="/forum" className="mb-10 flex max-w-xl gap-2">
        <label htmlFor="forum-ara" className="sr-only">
          Konularda ara
        </label>
        <Suspense fallback={<input className="input" disabled placeholder="Konularda ara" />}>
          <SearchInput searchParams={searchParams} />
        </Suspense>
        <button type="submit" aria-label="Ara" className={buttonClass("ghost", "md", "shrink-0 px-4")}>
          <MagnifyingGlass size={18} />
        </button>
      </form>
      <Suspense fallback={<ListSkeleton rows={8} />}>
        <ForumContent searchParams={searchParams} />
      </Suspense>
    </PageContainer>
  );
}

async function SearchInput({ searchParams }: Pick<PageProps<"/forum">, "searchParams">) {
  const { ara } = await searchParams;
  return (
    <input
      id="forum-ara"
      name="ara"
      type="search"
      defaultValue={typeof ara === "string" ? ara : ""}
      placeholder="Konularda ara"
      className="input"
    />
  );
}

async function ForumContent({ searchParams }: Pick<PageProps<"/forum">, "searchParams">) {
  const [{ ara }, user] = await Promise.all([searchParams, getCurrentUser()]);
  const loggedIn = user !== null;
  const now = await requestTime();
  const query = typeof ara === "string" ? ara.trim() : "";

  if (query.length >= 2) {
    const results = await searchTopics(query, loggedIn);
    return (
      <section>
        <SectionTitle>
          &ldquo;{query}&rdquo; için {results.length} sonuç
        </SectionTitle>
        <ul>
          {results.map((topic) => (
            <TopicRow key={topic.id} topic={topic} now={now} showCategory />
          ))}
        </ul>
      </section>
    );
  }

  const [categories, latest] = await Promise.all([listCategories(loggedIn), latestTopics(10, loggedIn)]);

  return (
    <div className="grid gap-12 lg:grid-cols-12">
      <section className="lg:col-span-7" aria-labelledby="son-konular">
        <SectionTitle>
          <span id="son-konular">Son konuşulanlar</span>
        </SectionTitle>
        {latest.length === 0 ? (
          <p className="border border-line p-6 text-fog">İlk konuyu sen aç, sürü peşinden gelsin.</p>
        ) : (
          <ul>
            {latest.map((topic) => (
              <TopicRow key={topic.id} topic={topic} now={now} showCategory />
            ))}
          </ul>
        )}
      </section>

      <section className="lg:col-span-5" aria-labelledby="kategoriler">
        <SectionTitle>
          <span id="kategoriler">Kategoriler</span>
        </SectionTitle>
        <ul className="grid gap-px border border-line bg-line">
          {categories.map((category) => (
            <li key={category.id}>
              <Link
                href={`/forum/${category.slug}`}
                className="group flex items-center justify-between gap-5 bg-coal p-5 transition-colors hover:bg-ash"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-lg font-semibold group-hover:text-al-bright">
                    {category.name}
                    {category.visibility === "members" && <Lock size={15} aria-label="Üyelere özel" />}
                  </p>
                  <p className="mt-1 text-sm leading-snug text-fog">{category.description}</p>
                </div>
                <div className="shrink-0 text-right text-xs text-smoke">
                  <p className="display text-2xl text-bone">{formatNumber(category.topicCount)}</p>
                  <p>konu</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        {!loggedIn && (
          <p className="mt-4 text-sm text-smoke">Üyelere özel kategoriler yalnızca giriş yapınca görünür.</p>
        )}
      </section>
    </div>
  );
}
