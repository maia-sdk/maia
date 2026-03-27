import type {
  ACPEvent,
  ACPProvenanceGraph,
  ProvenanceClaim,
  ProvenanceContradiction,
  ProvenanceTier,
} from "@maia/acp";
import * as MaiaBrain from "@maia/brain";

export interface ProvenanceState {
  graph: ACPProvenanceGraph;
  claimsByTier: Record<ProvenanceTier, ProvenanceClaim[]>;
  contradictions: ProvenanceContradiction[];
  staleClaimIds: Set<string>;
}

export function deriveProvenanceState(events: ACPEvent[], staleAfterDays = 90): ProvenanceState {
  const graph = MaiaBrain.buildProvenanceGraph(events);
  const staleClaimIds = new Set<string>(
    MaiaBrain.staleClaims(graph, staleAfterDays).map((claim: ProvenanceClaim) => claim.claim_id),
  );
  const claimsByTier: Record<ProvenanceTier, ProvenanceClaim[]> = {
    verified: [],
    supported: [],
    inferred: [],
    unverified: [],
  };

  for (const claim of graph.claims as ProvenanceClaim[]) {
    const bucket = claimsByTier[claim.tier] ?? claimsByTier.unverified;
    bucket.push(claim);
  }

  return {
    graph,
    claimsByTier,
    contradictions: graph.contradictions,
    staleClaimIds,
  };
}
