"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Users, ChevronDown, CheckCircle, HelpCircle, Search, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FocusGroupTurn {
  speaker: string;
  statement: string;
  referencesPersona: string | null;
  turnType?: "opening" | "challenge" | "agreement" | "partial_agreement" | "moderator" | "conclusion";
}

interface ConflictItem {
  topic?: string;
  reason?: string;
  personasAgree?: string[];
  personasDisagree?: string[];
  segmentExplanation?: string;
}

interface FocusGroupDiscussionProps {
  summary: string;
  moderatorSummary?: string | null;
  discussion?: FocusGroupTurn[];
  consensus?: string[];
  openQuestions?: string[];
  researchGaps?: string[];
  conflicts?: { items: ConflictItem[] };
}

const AVATAR_COLORS = [
  "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300",
  "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
  "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
  "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300",
];

const MODERATOR_STYLE =
  "bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300";

function getAvatarColor(name: string, isModerator: boolean): string {
  if (isModerator) return MODERATOR_STYLE;
  let h = 0;
  for (let i = 0; i < name.length; i++)
    h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function initials(speaker: string): string {
  return speaker
    .split(/[\s(]/)[0]
    .slice(0, 2)
    .toUpperCase();
}

export function FocusGroupDiscussion({
  summary,
  moderatorSummary,
  discussion = [],
  consensus = [],
  openQuestions = [],
  researchGaps = [],
  conflicts,
}: FocusGroupDiscussionProps) {
  const [showFullDiscussion, setShowFullDiscussion] = useState(false);

  const displayedTurns = showFullDiscussion
    ? discussion
    : discussion.slice(0, 6);

  const conflictItems = conflicts?.items ?? [];

  const isModerator = (turn: FocusGroupTurn) =>
    turn.speaker === "Moderator" || turn.turnType === "moderator";

  return (
    <div className="space-y-5">
      {/* ── Moderator Summary ── */}
      <div className="rounded-2xl border border-(--pf-accent)/20 bg-(--pf-accent-soft) overflow-hidden">
        <div className="border-b border-(--pf-accent)/15 px-6 py-4">
          <h3 className="font-heading text-sm font-semibold text-(--pf-accent) flex items-center gap-2">
            <Users className="h-4 w-4" />
            Moderator Summary
          </h3>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-foreground leading-relaxed">
            {moderatorSummary || summary}
          </p>
        </div>
      </div>

      {/* ── Discussion turns ── */}
      {discussion.length > 0 && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="border-b border-border px-5 py-3.5 flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Debate Transcript</span>
            <span className="ml-auto text-xs text-muted-foreground">{discussion.length} turns</span>
          </div>
          <div className="px-5 py-4 space-y-4">
            <AnimatePresence initial={false}>
              {displayedTurns.map((turn, i) => {
                const isMod = isModerator(turn);
                const avatarCls = getAvatarColor(turn.speaker, isMod);

                // Moderator turns — centered pill style
                if (isMod) {
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-center py-1"
                    >
                      <div className="rounded-full border border-slate-300/50 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/50 px-4 py-2 max-w-[85%]">
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 text-center mb-0.5">Moderator</p>
                        <p className="text-xs text-slate-700 dark:text-slate-300 text-center leading-relaxed italic">
                          {turn.statement}
                        </p>
                      </div>
                    </motion.div>
                  );
                }

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.04, 0.3) }}
                    className={cn(
                      "flex items-start gap-3",
                      turn.referencesPersona ? "pl-4 border-l-2 border-(--pf-accent)/20" : "",
                    )}
                  >
                    <div
                      className={cn(
                        "h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold leading-none",
                        avatarCls,
                      )}
                    >
                      {initials(turn.speaker)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="text-xs font-semibold text-foreground">{turn.speaker}</p>
                        {turn.referencesPersona && (
                          <span className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5">
                            ↩ replying to {turn.referencesPersona}
                          </span>
                        )}
                        {turn.turnType === "challenge" && (
                          <span className="text-[10px] font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-500/20 rounded px-1.5 py-0.5">
                            Challenges
                          </span>
                        )}
                        {(turn.turnType === "agreement") && (
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20 rounded px-1.5 py-0.5">
                            Agrees
                          </span>
                        )}
                        {turn.turnType === "partial_agreement" && (
                          <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-500/20 rounded px-1.5 py-0.5">
                            Partially agrees
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">{turn.statement}</p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {discussion.length > 6 && (
              <button
                onClick={() => setShowFullDiscussion(!showFullDiscussion)}
                className="flex items-center gap-1.5 text-xs text-(--pf-accent) hover:text-(--pf-accent)/70 transition-colors font-medium"
              >
                <motion.span
                  animate={{ rotate: showFullDiscussion ? 180 : 0 }}
                  transition={{ duration: 0.22 }}
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </motion.span>
                {showFullDiscussion
                  ? "Show less"
                  : `Show ${discussion.length - 6} more turns`}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        {/* ── Consensus ── */}
        {consensus.length > 0 && (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/10 overflow-hidden">
            <div className="border-b border-emerald-500/15 px-5 py-3.5 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                Points of Consensus
              </p>
            </div>
            <ul className="px-5 py-4 space-y-2.5">
              {consensus.map((point, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── Open Questions ── */}
        {openQuestions.length > 0 && (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/10 overflow-hidden">
            <div className="border-b border-amber-500/15 px-5 py-3.5 flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                Open Questions
              </p>
            </div>
            <ul className="px-5 py-4 space-y-2.5">
              {openQuestions.map((q, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                  <span className="leading-relaxed">{q}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ── Conflict items ── */}
      {conflictItems.length > 0 && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="border-b border-border px-6 py-4">
            <p className="text-sm font-semibold text-foreground">
              Persona Disagreements
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Areas where different user segments had opposing views
            </p>
          </div>
          <div className="divide-y divide-border/50">
            {conflictItems.map((c, i) => (
              <div key={i} className="px-6 py-4">
                <p className="text-sm font-semibold text-foreground mb-1.5">
                  {c.topic}
                </p>
                {c.reason && (
                  <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                    {c.reason}
                  </p>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {(c.personasAgree ?? []).map((p) => (
                    <span
                      key={p}
                      className="text-xs rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 px-2 py-0.5"
                    >
                      ✓ {p}
                    </span>
                  ))}
                  {(c.personasDisagree ?? []).map((p) => (
                    <span
                      key={p}
                      className="text-xs rounded-full bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-500/20 px-2 py-0.5"
                    >
                      ✗ {p}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* ── Research Gaps ── */}
      {researchGaps.length > 0 && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-50 dark:bg-amber-950/20 overflow-hidden">
          <div className="border-b border-amber-500/15 px-5 py-3.5 flex items-center gap-2">
            <Search className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
              Research Gaps
            </p>
            <span className="ml-1 text-xs text-amber-600/70 dark:text-amber-400/70">
              Areas not assessed due to crawl coverage limits
            </span>
          </div>
          <div className="px-5 py-4">
            <ul className="space-y-2.5">
              {researchGaps.map((gap, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-300">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{gap}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[10px] text-amber-600/70 dark:text-amber-400/70 border-t border-amber-500/10 pt-2">
              These gaps represent known limitations of the current analysis. Run a deeper crawl to eliminate them.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
