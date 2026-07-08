// lib/services/vision.ts
// Shim — re-exports from the new VisionService module.
// All callers that imported from here continue to work unchanged.
export {
	analyzeScreenshot,
	shouldRunVision,
	getMaxVisionPages,
} from "./vision/index";
