"use client";

import { ActionForm, FormMessage, SubmitButton } from "@/components/ui/form";
import { submitPrediction } from "@/lib/actions/engagement";

type Props = {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  current?: { homeScore: number; awayScore: number } | null;
};

function ScoreInput({ name, label, defaultValue }: { name: string; label: string; defaultValue?: number }) {
  return (
    <label className="flex flex-col items-center gap-2 text-center">
      <span className="text-sm font-medium">{label}</span>
      <input
        name={name}
        type="number"
        inputMode="numeric"
        min={0}
        max={30}
        required
        defaultValue={defaultValue}
        aria-label={`${label} gol sayısı`}
        className="input display h-16 w-20 text-center text-3xl"
      />
    </label>
  );
}

export function PredictionForm({ matchId, homeTeam, awayTeam, current }: Props) {
  return (
    <ActionForm action={submitPrediction.bind(null, matchId)} className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-4">
        <ScoreInput name="home" label={homeTeam} defaultValue={current?.homeScore} />
        <span className="display pb-3 text-3xl text-smoke">-</span>
        <ScoreInput name="away" label={awayTeam} defaultValue={current?.awayScore} />
        <SubmitButton pendingLabel="Kaydediliyor..." className="h-16">
          {current ? "Güncelle" : "Tahmin et"}
        </SubmitButton>
      </div>
      <FormMessage />
    </ActionForm>
  );
}
