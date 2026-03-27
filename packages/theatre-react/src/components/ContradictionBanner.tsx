import React from "react";
import type { ProvenanceClaim, ProvenanceContradiction } from "@maia/acp";

export interface ContradictionBannerProps {
  contradiction: ProvenanceContradiction;
  claimMap: Map<string, ProvenanceClaim>;
}

export function ContradictionBanner({ contradiction, claimMap }: ContradictionBannerProps) {
  const claimA = claimMap.get(contradiction.claim_a_id);
  const claimB = claimMap.get(contradiction.claim_b_id);

  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
      <div className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-rose-700">
        Contradiction
      </div>
      <div className="space-y-2 text-sm text-rose-900">
        <div>{claimA?.text ?? contradiction.claim_a_id}</div>
        <div>{claimB?.text ?? contradiction.claim_b_id}</div>
        {contradiction.resolution_summary ? (
          <div className="text-xs text-rose-700">{contradiction.resolution_summary}</div>
        ) : null}
      </div>
    </div>
  );
}
