import React, { useMemo } from "react";
import type { ACPEvent, ProvenanceClaim } from "@maia/acp";
import { deriveProvenanceState } from "../panels/deriveProvenanceState";
import { ClaimCard } from "./ClaimCard";
import { ContradictionBanner } from "./ContradictionBanner";

export interface ProvenancePanelProps {
  events: ACPEvent[];
  className?: string;
  staleAfterDays?: number;
}

const tierOrder = ["verified", "supported", "inferred", "unverified"] as const;

export function ProvenancePanel({
  events,
  className = "",
  staleAfterDays = 90,
}: ProvenancePanelProps) {
  const state = useMemo(() => deriveProvenanceState(events, staleAfterDays), [events, staleAfterDays]);
  const claimMap = useMemo<Map<string, ProvenanceClaim>>(
    () => new Map<string, ProvenanceClaim>(state.graph.claims.map((claim: ProvenanceClaim) => [claim.claim_id, claim])),
    [state.graph.claims],
  );

  return (
    <div className={`h-full overflow-auto bg-slate-950/5 p-4 ${className}`}>
      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        {tierOrder.map((tier) => (
          <div key={tier} className="rounded-2xl border border-white/10 bg-white/80 px-4 py-3 shadow-sm">
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              {tier}
            </div>
            <div className="mt-1 text-2xl font-semibold text-slate-900">
              {state.claimsByTier[tier].length}
            </div>
          </div>
        ))}
      </div>

      {state.contradictions.length > 0 && (
        <div className="mb-4 space-y-3">
          {state.contradictions.map((contradiction) => (
            <ContradictionBanner
              key={contradiction.contradiction_id}
              contradiction={contradiction}
              claimMap={claimMap}
            />
          ))}
        </div>
      )}

      {state.graph.claims.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-4 py-8 text-sm text-slate-500">
          No provenance claims have been derived from the current event stream yet.
        </div>
      ) : (
        <div className="space-y-4">
          {tierOrder.map((tier) =>
            state.claimsByTier[tier].length > 0 ? (
              <section key={tier} className="space-y-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {tier} claims
                </div>
                {state.claimsByTier[tier].map((claim) => (
                  <ClaimCard
                    key={claim.claim_id}
                    claim={claim}
                    stale={state.staleClaimIds.has(claim.claim_id)}
                  />
                ))}
              </section>
            ) : null,
          )}
        </div>
      )}
    </div>
  );
}
