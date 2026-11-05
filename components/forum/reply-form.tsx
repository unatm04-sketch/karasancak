"use client";

import { ActionForm, FormMessage, SubmitButton, TextArea } from "@/components/ui/form";
import { createPost } from "@/lib/actions/forum";

export function ReplyForm({ topicId }: { topicId: string }) {
  return (
    <ActionForm action={createPost.bind(null, topicId)} resetOnSuccess className="panel flex flex-col gap-4 p-5 md:p-6">
      <FormMessage />
      <TextArea
        label="Yanıtın"
        name="body"
        rows={5}
        required
        help="Birinden bahsetmek için @kullaniciadi yaz. En az 20 karakterlik yazılar XP kazandırır."
      />
      <div>
        <SubmitButton pendingLabel="Gönderiliyor...">Yanıtla</SubmitButton>
      </div>
    </ActionForm>
  );
}
