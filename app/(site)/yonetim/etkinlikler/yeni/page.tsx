import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { EventForm } from "@/components/admin/event-form";
import { PageHeader, Skeleton } from "@/components/ui/page";
import { createEvent } from "@/lib/actions/admin-content";
import { requireStaff } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Yeni etkinlik" };

export default function NewEventPage() {
  return (
    <div className="max-w-3xl">
      <PageHeader title="Yeni etkinlik" breadcrumb={[{ href: "/yonetim/etkinlikler", label: "Etkinlikler" }]} />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Guarded />
      </Suspense>
    </div>
  );
}

async function Guarded() {
  await connection();
  await requireStaff();
  return <EventForm action={createEvent} submitLabel="Etkinliği oluştur" />;
}
