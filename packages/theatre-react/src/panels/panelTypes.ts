/**
 * Shared types for Theatre panel components.
 * Inlined to avoid external dependencies on the main Maia app.
 */

export type AgentActivityEvent = {
  id?: string;
  type?: string;
  title?: string;
  detail?: string;
  status?: string;
  agentId?: string;
  agentName?: string;
  timestamp?: string;
  payload?: Record<string, unknown>;
  [key: string]: unknown;
};

// Event type constants
export const EVT_AGENT_HANDOFF = "agent_handoff";
export const EVT_AGENT_HANDOFF_RECEIVED = "agent_handoff_received";
export const EVT_AGENT_HANDOFF_COMPLETED = "agent_handoff_completed";
export const EVT_ASSEMBLY_PLAN = "assembly_plan";
export const EVT_ASSEMBLY_STEP_START = "assembly_step_start";
export const EVT_ASSEMBLY_STEP_COMPLETE = "assembly_step_complete";
export const EVT_ASSEMBLY_DONE = "assembly_done";
export const EVT_ASSEMBLY_STARTED = "assembly_started";
export const EVT_ASSEMBLY_STEP_ADDED = "assembly_step_added";
export const EVT_ASSEMBLY_COMPLETE = "assembly_complete";
export const EVT_ASSEMBLY_COMPLETED = "assembly_completed";
export const EVT_ASSEMBLY_ERROR = "assembly_error";
export const EVT_EXECUTION_STARTING = "execution_starting";
export const EVT_BRAIN_REVIEW_START = "brain_review_start";
export const EVT_BRAIN_REVIEW_COMPLETE = "brain_review_complete";
export const EVT_BRAIN_REVISION_REQUEST = "brain_revision_request";
export const EVT_BRAIN_APPROVAL = "brain_approval";
export const EVT_BRAIN_REVIEW_STARTED = "brain_review_started";
export const EVT_BRAIN_REVISION_REQUESTED = "brain_revision_requested";
export const EVT_BRAIN_QUESTION = "brain_question";
export const EVT_BRAIN_ANSWER_RECEIVED = "brain_answer_received";

// Simple payload reader
export function readEventPayload(event: AgentActivityEvent | null, key: string): string {
  if (!event?.payload) return "";
  const val = event.payload[key];
  return typeof val === "string" ? val : val != null ? String(val) : "";
}
