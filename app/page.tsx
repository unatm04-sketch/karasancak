import { Suspense } from "react";
import { AtaturkStory } from "@/components/landing/ataturk-story";
import { CommunityBoard } from "@/components/landing/community-board";
import { FieldEvents } from "@/components/landing/field-events";
import { FinalCall } from "@/components/landing/final-call";
import { Hero } from "@/components/landing/hero";
import { MatchDay } from "@/components/landing/match-day";
import { MottoBands } from "@/components/landing/motto-bands";
import { PlatformBento } from "@/components/landing/platform-bento";
import { ReferralRibbon } from "@/components/landing/referral-ribbon";
import { SloganMarquee } from "@/components/landing/slogan-marquee";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";

export default function HomePage() {
  return (
    <>
      <Suspense fallback={null}>
        <ReferralRibbon />
      </Suspense>
      <div className="relative">
        <SiteHeader overlay />
        <main>
          <Hero />
          <AtaturkStory />
          <SloganMarquee />
          <MottoBands />
          <MatchDay />
          <PlatformBento />
          <CommunityBoard />
          <FieldEvents />
          <FinalCall />
        </main>
      </div>
      <SiteFooter />
    </>
  );
}
