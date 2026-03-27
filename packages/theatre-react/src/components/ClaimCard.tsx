import React from "react";
import type { ProvenanceClaim } from "@maia/acp";

export interface ClaimCardProps {
  claim: ProvenanceClaim;
  stale?: boolean;
}

const tierClasses: Record<ProvenanceClaim["tier"], string> = {
  verified: "bg-emerald-50 text-emerald-700 border-emerald-200",
  supported: "bg-sky-50 text-sky-700 border-sky-200",
  inferred: "bg-amber-50 text-amber-700 border-amber-200",
  unverified: "bg-rose-50 text-rose-700 border-rose-200",
};

const tierLabel: Record<ProvenanceClaim["tier"], string> = {
  verified: "Verified",
  supported: "Supported",
  inferred: "Inferred",
  unverified: "Unverified",
};

export function ClaimCard({ claim, stale = false }: ClaimCardProps) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/70 p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${tierClasses[claim.tier]}`}>
          {tierLabel[claim.tier]}
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
          confidence {Math.round(claim.confidence * 100)}%
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
          {claim.agent_id.replace("agent://", "")}
        </span>
        {stale && (
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
            stale source
          </span>
        )}
      </div>

      <p className="text-sm leading-6 text-slate-800">{claim.text}</p>

      {claim.source_refs.length > 0 && (
        <div className="mt-3 space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            Sources
          </div>
          <ul className="space-y-2">
            {claim.source_refs.map((sourceRef) => (
              <li key={`${sourceRef.kind}:${sourceRef.source_id}`} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="text-xs font-medium text-slate-700">
                  {sourceRef.title || sourceRef.uri || sourceRef.artifact_id || sourceRef.source_id}
                </div>
                <div className="text-xs text-slate-500">
                  {sourceRef.kind}
                  {sourceRef.uri ? ` • ${sourceRef.uri}` : ""}
                </div>
                {sourceRef.excerpt ? (
                  <div className="mt-1 text-xs text-slate-600">{sourceRef.excerpt}</div>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
