// lib/services/persona-engine.ts
// Backward-compatibility shim.
// All actual logic now lives in persona-analysis-service.ts.
// This file keeps the public export surface identical so no other file breaks.

export { buildPersonaPrompt } from "./persona-engine-internals";
export { runSequentialEvaluations as runParallelEvaluations } from "./persona-analysis-service";
