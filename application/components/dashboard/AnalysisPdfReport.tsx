import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
	accent: "#4F46E5",
	accentSoft: "#EEF2FF",
	green: "#059669",
	greenSoft: "#ECFDF5",
	red: "#DC2626",
	redSoft: "#FEF2F2",
	amber: "#D97706",
	amberSoft: "#FFFBEB",
	blue: "#2563EB",
	blueSoft: "#EFF6FF",
	g900: "#111827",
	g700: "#374151",
	g500: "#6B7280",
	g300: "#D1D5DB",
	g100: "#F3F4F6",
	g50: "#F9FAFB",
	white: "#FFFFFF",
};

const s = StyleSheet.create({
	// Pages
	page: {
		paddingTop: 40,
		paddingBottom: 48,
		paddingHorizontal: 44,
		fontFamily: "Helvetica",
		backgroundColor: C.white,
		color: C.g700,
		fontSize: 10,
	},
	coverPage: { fontFamily: "Helvetica", backgroundColor: C.white },

	// Cover
	coverBand: { height: 6, backgroundColor: C.accent },
	coverBody: { paddingHorizontal: 48, paddingTop: 56, paddingBottom: 40 },
	eyebrow: {
		fontSize: 8,
		fontFamily: "Helvetica-Bold",
		textTransform: "uppercase",
		letterSpacing: 2,
		color: C.accent,
		marginBottom: 12,
	},
	coverTitle: { fontSize: 28, fontFamily: "Helvetica-Bold", color: C.g900, lineHeight: 1.2, marginBottom: 6 },
	coverUrl: { fontSize: 10, color: C.g500, marginBottom: 36 },
	coverDivider: { height: 1, backgroundColor: C.g300, marginBottom: 24 },
	coverGrid: { flexDirection: "row", flexWrap: "wrap" },
	coverCell: { width: "50%", marginBottom: 18 },
	coverCellLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 1, color: C.g500, marginBottom: 3 },
	coverCellValue: { fontSize: 13, fontFamily: "Helvetica-Bold", color: C.g900 },
	coverNote: { fontSize: 8, color: C.g500, marginTop: 40 },

	// Running head
	rhead: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: C.g300 },
	rheadL: { fontSize: 8, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 1, color: C.accent },
	rheadR: { fontSize: 8, color: C.g500 },

	// Section title
	sectionTitle: { fontSize: 14, fontFamily: "Helvetica-Bold", color: C.g900, marginBottom: 3 },
	sectionSubtitle: { fontSize: 9, color: C.g500, marginBottom: 12, lineHeight: 1.4 },
	titleRule: { height: 2, width: 32, backgroundColor: C.accent, borderRadius: 1, marginBottom: 14 },

	// Stat cards
	statRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
	statCard: { flex: 1, backgroundColor: C.accentSoft, borderRadius: 6, padding: 10, borderLeftWidth: 3, borderLeftColor: C.accent },
	statCardGreen: { flex: 1, backgroundColor: C.greenSoft, borderRadius: 6, padding: 10, borderLeftWidth: 3, borderLeftColor: C.green },
	statCardRed: { flex: 1, backgroundColor: C.redSoft, borderRadius: 6, padding: 10, borderLeftWidth: 3, borderLeftColor: C.red },
	statCardAmber: { flex: 1, backgroundColor: C.amberSoft, borderRadius: 6, padding: 10, borderLeftWidth: 3, borderLeftColor: C.amber },
	statLabel: { fontSize: 7, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 1, color: C.accent, marginBottom: 3 },
	statLabelGreen: { fontSize: 7, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 1, color: C.green, marginBottom: 3 },
	statLabelRed: { fontSize: 7, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 1, color: C.red, marginBottom: 3 },
	statLabelAmber: { fontSize: 7, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 1, color: C.amber, marginBottom: 3 },
	statValue: { fontSize: 15, fontFamily: "Helvetica-Bold", color: C.g900 },

	// Generic card
	card: { backgroundColor: C.g50, borderRadius: 6, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: C.g300 },
	cardGreen: { backgroundColor: C.greenSoft, borderRadius: 6, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: C.green },
	cardRed: { backgroundColor: C.redSoft, borderRadius: 6, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: C.red },
	cardAmber: { backgroundColor: C.amberSoft, borderRadius: 6, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: C.amber },
	cardBlue: { backgroundColor: C.blueSoft, borderRadius: 6, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: C.blue },
	cardTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.g900, marginBottom: 4 },
	body: { fontSize: 9.5, color: C.g700, lineHeight: 1.55, marginBottom: 8 },
	bodySmall: { fontSize: 8.5, color: C.g700, lineHeight: 1.45 },

	// Row / two-col
	twoCol: { flexDirection: "row", gap: 10, marginBottom: 10 },
	col: { flex: 1 },
	colHead: { fontSize: 7.5, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 5 },
	bullet: { flexDirection: "row", marginBottom: 3.5, alignItems: "flex-start" },
	bulletDot: { width: 11, fontSize: 9, lineHeight: 1.4 },
	bulletTxt: { fontSize: 8.5, color: C.g700, lineHeight: 1.4, flex: 1 },

	// Persona card
	pCard: { borderWidth: 1, borderColor: C.g300, borderRadius: 8, overflow: "hidden", marginBottom: 10 },
	pAccent: { height: 3, backgroundColor: C.accent },
	pBody: { padding: 14 },
	pHeadRow: { flexDirection: "row", alignItems: "center", marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: C.g300 },
	pAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.accentSoft, justifyContent: "center", alignItems: "center", marginRight: 10 },
	pAvatarTxt: { fontSize: 15, fontFamily: "Helvetica-Bold", color: C.accent },
	pName: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.g900 },
	pMeta: { fontSize: 8.5, color: C.g500, marginTop: 1 },

	// Badge
	badge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10 },

	// Bar track
	barTrack: { height: 5, backgroundColor: C.g100, borderRadius: 3, overflow: "hidden", marginTop: 2, marginBottom: 6 },

	// Quote
	quote: { borderLeftWidth: 3, borderLeftColor: C.accent, paddingLeft: 10, paddingVertical: 4, marginBottom: 10, backgroundColor: C.accentSoft, borderRadius: 3 },
	quoteLabel: { fontSize: 7, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 1, color: C.accent, marginBottom: 3 },
	quoteTxt: { fontSize: 9, fontStyle: "italic", color: C.g700, lineHeight: 1.45 },

	// Recs
	recsBox: { backgroundColor: C.accentSoft, borderRadius: 5, padding: 9, marginTop: 4 },
	recsHead: { fontSize: 7.5, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 0.8, color: C.accent, marginBottom: 5 },

	// Table
	tHead: { flexDirection: "row", backgroundColor: C.g100, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 3, marginBottom: 2 },
	tRow: { flexDirection: "row", paddingVertical: 5, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: C.g100 },
	tRowAlt: { backgroundColor: C.g50 },
	cUrl: { flex: 2.5, paddingRight: 6 },
	cNum: { flex: 0.6 },
	th: { fontSize: 7.5, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 0.6, color: C.g500 },
	td: { fontSize: 9, color: C.g700 },
	tdBold: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.g900, marginBottom: 1 },
	tdSmall: { fontSize: 8, color: C.g500 },

	// Opportunity quadrant
	quadrant: { flex: 1, borderRadius: 5, padding: 8, borderWidth: 1 },

	// Footer
	footer: { position: "absolute", bottom: 18, left: 44, right: 44, flexDirection: "row", justifyContent: "space-between" },
	footerTxt: { fontSize: 7, color: C.g500 },
	footerDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: C.accent, marginTop: 2 },

	// Conflict item
	conflictItem: { backgroundColor: C.white, borderRadius: 4, padding: 8, marginBottom: 5, borderWidth: 1, borderColor: C.g300 },

	// Evidence level badge
	evBadge: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3, fontSize: 7, fontFamily: "Helvetica-Bold" },
	severityBadge: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 10, fontSize: 7, fontFamily: "Helvetica-Bold" },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseList(v: string | null | undefined): string[] {
	if (!v) return [];
	try {
		const p = JSON.parse(v);
		return Array.isArray(p) ? p.map(String).filter(Boolean) : [];
	} catch {
		return v.trim() ? [v] : [];
	}
}

function scoreColor(n: number) {
	return n >= 75 ? C.green : n >= 55 ? C.amber : C.red;
}
function sentimentColor(v: string | null | undefined) {
	const u = (v ?? "").toUpperCase();
	return u === "POSITIVE" ? C.green : u === "NEGATIVE" ? C.red : C.amber;
}
function sentimentBg(v: string | null | undefined) {
	const u = (v ?? "").toUpperCase();
	return u === "POSITIVE" ? C.greenSoft : u === "NEGATIVE" ? C.redSoft : C.amberSoft;
}
function frictionColor(n: number) {
	return n > 66 ? C.red : n > 33 ? C.amber : C.green;
}
function evidenceLevelColor(lvl: string | undefined) {
	if (lvl === "OBSERVED" || lvl === "MEASURED") return { bg: C.greenSoft, color: C.green };
	if (lvl === "INFERRED") return { bg: C.amberSoft, color: C.amber };
	return { bg: C.g100, color: C.g500 };
}
function severityColor(sev: string) {
	if (sev === "Critical") return { bg: C.redSoft, color: C.red };
	if (sev === "High") return { bg: "#FFF7ED", color: "#C2410C" };
	if (sev === "Medium") return { bg: C.amberSoft, color: C.amber };
	return { bg: C.blueSoft, color: C.blue };
}
function quadrantMeta(cat: string) {
	if (cat === "Quick Win") return { bg: C.greenSoft, border: C.green, color: C.green };
	if (cat === "Strategic") return { bg: C.blueSoft, border: C.blue, color: C.blue };
	if (cat === "Fill-in") return { bg: C.g50, border: C.g300, color: C.g500 };
	return { bg: C.g100, border: C.g300, color: C.g500 };
}

// ─── Reusable sub-components ──────────────────────────────────────────────────
function Bullets({ items, color }: { items: string[]; color: string }) {
	return (
		<View>
			{items.map((item, i) => (
				<View key={i} style={s.bullet}>
					<Text style={{ ...s.bulletDot, color }}>•</Text>
					<Text style={s.bulletTxt}>{item}</Text>
				</View>
			))}
		</View>
	);
}

function Footer({ hostname, section }: { hostname: string; section: string }) {
	return (
		<View style={s.footer} fixed>
			<Text style={s.footerTxt}>PersonaForge AI · {hostname}</Text>
			<View style={s.footerDot} />
			<Text style={s.footerTxt}>{section}</Text>
		</View>
	);
}

function RHead({ left, right }: { left: string; right: string }) {
	return (
		<View style={s.rhead} fixed>
			<Text style={s.rheadL}>{left}</Text>
			<Text style={s.rheadR}>{right}</Text>
		</View>
	);
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
	return (
		<View>
			<Text style={s.sectionTitle}>{title}</Text>
			<View style={s.titleRule} />
			{subtitle && <Text style={s.sectionSubtitle}>{subtitle}</Text>}
		</View>
	);
}

function ConfidenceBar({ value, label, color }: { value: number; label: string; color: string }) {
	return (
		<View style={{ marginBottom: 6 }}>
			<View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
				<Text style={{ fontSize: 8, color: C.g700 }}>{label}</Text>
				<Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color }}>{value}</Text>
			</View>
			<View style={s.barTrack}>
				<View style={{ height: "100%", width: `${value}%`, backgroundColor: color, borderRadius: 3 }} />
			</View>
		</View>
	);
}

// ─── Main Component ────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function AnalysisPdfReport({ analysis }: { analysis: any }) {
	const hostname = (() => {
		try { return new URL(analysis.url).hostname; } catch { return analysis.url; }
	})();

	const dateStr = analysis.startedAt
		? new Date(analysis.startedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
		: "—";

	const scorecard = (analysis.executiveScorecard ?? {}) as Record<string, unknown>;
	const topStrengths = (scorecard.topStrengths as Array<{ title: string; evidence: string; supportedByPersonas: string[] }>) ?? [];
	const topRisks = (scorecard.topRisks as Array<{ title: string; evidence: string; severity: string; businessImpact: string }>) ?? [];
	const adoptionComparison = (scorecard.adoptionComparison as Array<{ label: string; name: string; score: number; reasoning?: string }>) ?? [];
	const opportunityMatrix = (scorecard.opportunityMatrix as Array<{ title: string; category: string; impact: string; effort: string }>) ?? [];
	const confidenceDist = scorecard.confidenceDistribution as { high: number; medium: number; low: number } | undefined;
	const mostImpactful = scorecard.mostImpactfulRecommendation as string | undefined;
	const technicalDebt = scorecard.technicalDebtIndicator as string | undefined;
	const conversionRisk = scorecard.conversionRisk as number | undefined;
	const accessibilityRisk = scorecard.accessibilityRisk as string | undefined;
	const businessRisk = scorecard.businessRisk as string | undefined;

	const metaBlob = (analysis.meta ?? {}) as Record<string, unknown>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const crawlCoverage = (analysis.crawlCoverage ?? metaBlob.crawlCoverage) as any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const analysisReliability = (analysis.analysisReliability ?? metaBlob.analysisReliability) as any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const crawlerStats = (analysis.crawlerStats ?? metaBlob.crawlerStats) as any;
	const researchGaps = ((analysis.researchGaps ?? metaBlob.researchGaps) as string[] | undefined) ?? [];

	const focusGroup = analysis.focusGroup;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const fgExt = focusGroup as Record<string, any> | undefined;
	const fgConsensus = fgExt?.consensus as string[] | undefined;
	const fgOpenQuestions = fgExt?.openQuestions as string[] | undefined;
	const fgDiscussion = fgExt?.discussion as Array<{ speaker: string; statement: string; turnType?: string }> | undefined;
	const fgResearchGaps = (fgExt?.researchGaps as string[] | undefined) ?? researchGaps;

	const quadrantOrder = ["Quick Win", "Strategic", "Fill-in", "Avoid"];

	return (
		<Document title={`PersonaForge — ${hostname}`} author="PersonaForge AI" subject="Synthetic UX Research Report">

			{/* ── PAGE 1: COVER ── */}
			<Page size="A4" style={s.coverPage}>
				<View style={s.coverBand} />
				<View style={s.coverBody}>
					<Text style={s.eyebrow}>AI UX Research Report</Text>
					<Text style={s.coverTitle}>{hostname}</Text>
					<Text style={s.coverUrl}>{analysis.url}</Text>
					<View style={s.coverDivider} />
					<View style={s.coverGrid}>
						<View style={s.coverCell}>
							<Text style={s.coverCellLabel}>Report Date</Text>
							<Text style={s.coverCellValue}>{dateStr}</Text>
						</View>
						<View style={s.coverCell}>
							<Text style={s.coverCellLabel}>Device</Text>
							<Text style={s.coverCellValue}>{analysis.deviceType === "MOBILE" ? "Mobile" : "Desktop"}</Text>
						</View>
						<View style={s.coverCell}>
							<Text style={s.coverCellLabel}>Pages Crawled</Text>
							<Text style={s.coverCellValue}>{analysis.pages?.length ?? 0}</Text>
						</View>
						<View style={s.coverCell}>
							<Text style={s.coverCellLabel}>Personas Evaluated</Text>
							<Text style={s.coverCellValue}>{analysis.personas?.length ?? 0}</Text>
						</View>
						{analysis.overallUxScore != null && (
							<View style={s.coverCell}>
								<Text style={s.coverCellLabel}>Overall UX Score</Text>
								<Text style={{ ...s.coverCellValue, color: scoreColor(analysis.overallUxScore) }}>
									{analysis.overallUxScore} / 100
								</Text>
							</View>
						)}
						{analysis.uxMaturityLevel && (
							<View style={s.coverCell}>
								<Text style={s.coverCellLabel}>UX Maturity</Text>
								<Text style={s.coverCellValue}>{analysis.uxMaturityLevel}</Text>
							</View>
						)}
						{analysis.overallSentiment && (
							<View style={s.coverCell}>
								<Text style={s.coverCellLabel}>Overall Sentiment</Text>
								<Text style={{ ...s.coverCellValue, color: sentimentColor(analysis.overallSentiment) }}>
									{analysis.overallSentiment}
								</Text>
							</View>
						)}
						{crawlCoverage && (
							<View style={s.coverCell}>
								<Text style={s.coverCellLabel}>Coverage Confidence</Text>
								<Text style={s.coverCellValue}>{String(crawlCoverage.coverageConfidence)}</Text>
							</View>
						)}
					</View>
					<Text style={s.coverNote}>
						Generated by PersonaForge AI · Evidence-driven synthetic UX research · Confidential
					</Text>
				</View>
			</Page>

			{/* ── PAGE 2: EXECUTIVE SCORECARD ── */}
			<Page size="A4" style={s.page}>
				<RHead left="Executive Scorecard" right={hostname} />
				<SectionHeader
					title="Executive Scorecard"
					subtitle="Evidence-grounded strengths, risks, and business intelligence across all personas."
				/>

				{/* Score strip */}
				<View style={s.statRow}>
					{analysis.overallUxScore != null && (
						<View style={s.statCard}>
							<Text style={s.statLabel}>UX Score</Text>
							<Text style={{ ...s.statValue, color: scoreColor(analysis.overallUxScore) }}>
								{analysis.overallUxScore}/100
							</Text>
						</View>
					)}
					{conversionRisk != null && (
						<View style={s.statCardRed}>
							<Text style={s.statLabelRed}>Conversion Risk</Text>
							<Text style={{ ...s.statValue, color: C.red }}>{conversionRisk}%</Text>
						</View>
					)}
					{technicalDebt && (
						<View style={s.statCardAmber}>
							<Text style={s.statLabelAmber}>Technical Debt</Text>
							<Text style={{ ...s.statValue, color: C.amber }}>{technicalDebt}</Text>
						</View>
					)}
					{accessibilityRisk && (
						<View style={s.statCardAmber}>
							<Text style={s.statLabelAmber}>A11y Risk</Text>
							<Text style={{ ...s.statValue, color: C.amber }}>{accessibilityRisk}</Text>
						</View>
					)}
					<View style={s.statCard}>
						<Text style={s.statLabel}>Personas</Text>
						<Text style={s.statValue}>{analysis.personas?.length ?? 0}</Text>
					</View>
				</View>

				{/* Business Risk */}
				{businessRisk && (
					<View style={{ ...s.cardAmber, marginBottom: 10 }}>
						<Text style={{ ...s.cardTitle, color: C.amber }}>▲ Business Risk Assessment</Text>
						<Text style={s.bodySmall}>{businessRisk}</Text>
					</View>
				)}

				{/* Most Impactful Recommendation */}
				{mostImpactful && (
					<View style={{ ...s.cardBlue, marginBottom: 10 }}>
						<Text style={{ ...s.cardTitle, color: C.blue }}>★ Most Impactful Recommendation</Text>
						<Text style={s.bodySmall}>{mostImpactful}</Text>
					</View>
				)}

				{/* Top Strengths + Top Risks */}
				<View style={s.twoCol}>
					{topStrengths.length > 0 && (
						<View style={s.col}>
							<Text style={{ ...s.colHead, color: C.green }}>✓ Top Strengths</Text>
							{topStrengths.slice(0, 3).map((str, i) => (
								<View key={i} style={{ ...s.card, padding: 8, marginBottom: 6 }}>
									<Text style={{ fontSize: 8.5, fontFamily: "Helvetica-Bold", color: C.g900, marginBottom: 2 }}>
										{str.title}
									</Text>
									<Text style={{ fontSize: 8, color: C.g700, lineHeight: 1.4 }}>{str.evidence}</Text>
									{str.supportedByPersonas?.length > 0 && (
										<Text style={{ fontSize: 7.5, color: C.green, marginTop: 3 }}>
											{str.supportedByPersonas.join(" · ")}
										</Text>
									)}
								</View>
							))}
						</View>
					)}
					{topRisks.length > 0 && (
						<View style={s.col}>
							<Text style={{ ...s.colHead, color: C.red }}>✗ Top Risks</Text>
							{topRisks.slice(0, 3).map((risk, i) => {
								const sc = severityColor(risk.severity);
								return (
									<View key={i} style={{ ...s.card, padding: 8, marginBottom: 6 }}>
										<View style={{ flexDirection: "row", alignItems: "center", marginBottom: 3, gap: 5 }}>
											<View style={{ ...s.severityBadge, backgroundColor: sc.bg }}>
												<Text style={{ fontSize: 7, fontFamily: "Helvetica-Bold", color: sc.color }}>
													{risk.severity}
												</Text>
											</View>
										</View>
										<Text style={{ fontSize: 8.5, fontFamily: "Helvetica-Bold", color: C.g900, marginBottom: 2 }}>
											{risk.title}
										</Text>
										<Text style={{ fontSize: 7.5, color: C.g700, lineHeight: 1.4, marginBottom: 2 }}>
											{risk.evidence}
										</Text>
										<Text style={{ fontSize: 7.5, color: C.red, lineHeight: 1.4 }}>
											Impact: {risk.businessImpact}
										</Text>
									</View>
								);
							})}
						</View>
					)}
				</View>

				{/* Adoption Comparison */}
				{adoptionComparison.length > 0 && (
					<View style={{ marginBottom: 10 }}>
						<Text style={{ ...s.colHead, color: C.accent, marginBottom: 8 }}>Adoption Likelihood by Persona</Text>
						{adoptionComparison.map((a, i) => (
							<ConfidenceBar key={i} value={a.score} label={`${a.label} — ${a.name}`} color={scoreColor(a.score)} />
						))}
					</View>
				)}

				{/* Confidence distribution */}
				{confidenceDist && (
					<View style={s.card}>
						<Text style={s.cardTitle}>Finding Confidence Distribution</Text>
						<View style={{ ...s.barTrack, height: 8 }}>
							<View style={{ flexDirection: "row", height: "100%" }}>
								<View style={{ width: `${confidenceDist.high}%`, backgroundColor: C.green, height: "100%" }} />
								<View style={{ width: `${confidenceDist.medium}%`, backgroundColor: C.amber, height: "100%" }} />
								<View style={{ width: `${confidenceDist.low}%`, backgroundColor: C.g300, height: "100%" }} />
							</View>
						</View>
						<View style={{ flexDirection: "row", gap: 14, marginTop: 4 }}>
							<Text style={{ fontSize: 7.5, color: C.green }}>■ High {confidenceDist.high}%</Text>
							<Text style={{ fontSize: 7.5, color: C.amber }}>■ Medium {confidenceDist.medium}%</Text>
							<Text style={{ fontSize: 7.5, color: C.g500 }}>■ Low {confidenceDist.low}%</Text>
						</View>
					</View>
				)}

				<Footer hostname={hostname} section="Executive Scorecard" />
			</Page>

			{/* ── PAGE 3: COVERAGE + RELIABILITY ── */}
			{(crawlCoverage || analysisReliability) && (
				<Page size="A4" style={s.page}>
					<RHead left="Coverage & Reliability" right={hostname} />
					<SectionHeader
						title="Coverage & Reliability"
						subtitle="How much of the site was analyzed, and how confident we are in each finding."
					/>

					{/* Coverage */}
					{crawlCoverage && (
						<View>
							<Text style={{ ...s.colHead, color: C.accent, marginBottom: 8 }}>Analysis Coverage</Text>
							<View style={s.statRow}>
								<View style={s.statCard}>
									<Text style={s.statLabel}>Pages Crawled</Text>
									<Text style={s.statValue}>{String(crawlCoverage.pagesCrawled)}</Text>
								</View>
								<View style={s.statCard}>
									<Text style={s.statLabel}>Coverage</Text>
									<Text style={s.statValue}>{String(crawlCoverage.coveragePercent)}%</Text>
								</View>
								<View style={s.statCard}>
									<Text style={s.statLabel}>Avg Depth</Text>
									<Text style={s.statValue}>{String(crawlCoverage.avgDepth)}</Text>
								</View>
								<View style={s.statCard}>
									<Text style={s.statLabel}>Confidence</Text>
									<Text style={s.statValue}>{String(crawlCoverage.coverageConfidence)}</Text>
								</View>
							</View>
							{crawlCoverage.coverageNote && (
								<View style={{ ...s.cardAmber, padding: 8, marginBottom: 10 }}>
									<Text style={s.bodySmall}>⚠ {String(crawlCoverage.coverageNote)}</Text>
								</View>
							)}
						</View>
					)}

					{/* Reliability */}
					{analysisReliability && (
						<View>
							<Text style={{ ...s.colHead, color: C.accent, marginBottom: 8 }}>Analysis Reliability</Text>
							<View style={s.statRow}>
								<View style={s.statCardGreen}>
									<Text style={s.statLabelGreen}>Reliability Score</Text>
									<Text style={{ ...s.statValue, color: C.green }}>{String(analysisReliability.score)}%</Text>
								</View>
								<View style={s.statCard}>
									<Text style={s.statLabel}>Evidence-Backed</Text>
									<Text style={s.statValue}>{String(analysisReliability.evidenceBacked)}</Text>
								</View>
								<View style={s.statCard}>
									<Text style={s.statLabel}>Measured</Text>
									<Text style={s.statValue}>{String(analysisReliability.measured)}</Text>
								</View>
								<View style={s.statCard}>
									<Text style={s.statLabel}>Inferred</Text>
									<Text style={s.statValue}>{String(analysisReliability.inferred)}</Text>
								</View>
								<View style={s.statCardAmber}>
									<Text style={s.statLabelAmber}>Speculative</Text>
									<Text style={{ ...s.statValue, color: C.amber }}>{String(analysisReliability.speculative)}</Text>
								</View>
							</View>
							{analysisReliability.reliabilityNote && (
								<View style={s.card}>
									<Text style={s.bodySmall}>{String(analysisReliability.reliabilityNote)}</Text>
								</View>
							)}
						</View>
					)}

					{/* Research Gaps */}
					{fgResearchGaps.length > 0 && (
						<View style={{ marginTop: 10 }}>
							<Text style={{ ...s.colHead, color: C.amber, marginBottom: 8 }}>Research Gaps</Text>
							<Text style={{ fontSize: 8.5, color: C.g500, marginBottom: 8, lineHeight: 1.4 }}>
								Areas not analyzed due to limited crawl coverage. Confidence of recommendations related to these topics is reduced.
							</Text>
							<Bullets items={fgResearchGaps.slice(0, 8)} color={C.amber} />
						</View>
					)}

					{/* Evidence level legend */}
					<View style={{ marginTop: 14 }}>
						<Text style={{ ...s.colHead, color: C.g500, marginBottom: 6 }}>Evidence Level Glossary</Text>
						<View style={{ flexDirection: "row", gap: 10 }}>
							{[
								{ label: "OBSERVED", desc: "Verified from crawl data", color: C.green },
								{ label: "MEASURED", desc: "Calculated metric", color: C.blue },
								{ label: "INFERRED", desc: "Likely from evidence", color: C.amber },
								{ label: "SPECULATIVE", desc: "Low confidence", color: C.g500 },
							].map((e) => (
								<View key={e.label} style={{ flex: 1, borderLeftWidth: 2, borderLeftColor: e.color, paddingLeft: 6 }}>
									<Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: e.color, marginBottom: 2 }}>
										{e.label}
									</Text>
									<Text style={{ fontSize: 7.5, color: C.g500, lineHeight: 1.35 }}>{e.desc}</Text>
								</View>
							))}
						</View>
					</View>

					<Footer hostname={hostname} section="Coverage & Reliability" />
				</Page>
			)}

			{/* ── PAGE 4: OPPORTUNITY MATRIX ── */}
			{opportunityMatrix.length > 0 && (
				<Page size="A4" style={s.page}>
					<RHead left="Opportunity Matrix" right={hostname} />
					<SectionHeader
						title="Opportunity Matrix"
						subtitle="Improvements categorised by expected impact vs. implementation effort."
					/>

					<View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
						{quadrantOrder.map((quad) => {
							const items = opportunityMatrix.filter((x) => x.category === quad);
							const meta = quadrantMeta(quad);
							return (
								<View
									key={quad}
									style={{
										...s.quadrant,
										width: "47%",
										backgroundColor: meta.bg,
										borderColor: meta.border,
										minHeight: 100,
									}}
								>
									<Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: meta.color, marginBottom: 4 }}>
										{quad}
									</Text>
									{items.length === 0 ? (
										<Text style={{ fontSize: 8, color: C.g500, fontStyle: "italic" }}>No items</Text>
									) : (
										items.map((item, i) => (
											<View key={i} style={{ flexDirection: "row", marginBottom: 3 }}>
												<Text style={{ fontSize: 8.5, color: meta.color, width: 10 }}>•</Text>
												<Text style={{ fontSize: 8.5, color: C.g700, flex: 1, lineHeight: 1.35 }}>
													{item.title}
												</Text>
											</View>
										))
									)}
								</View>
							);
						})}
					</View>

					<Text style={{ fontSize: 8, color: C.g500, marginTop: 14, lineHeight: 1.4 }}>
						Quick Win: High impact, low effort — prioritise immediately.{"\n"}
						Strategic: High impact, high effort — plan and resource.{"\n"}
						Fill-in: Low impact, low effort — when capacity allows.{"\n"}
						Avoid: Low impact, high effort — deprioritise.
					</Text>

					<Footer hostname={hostname} section="Opportunity Matrix" />
				</Page>
			)}

			{/* ── PAGE PER PERSONA ── */}
			{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
			{analysis.personas?.map((persona: any, idx: number) => {
				const positives = parseList(persona.positives as string);
				const painPoints = parseList(persona.painPoints as string);
				const recommendations = parseList(persona.recommendations as string);
				const uxScore = persona.overallUxScore as number | null | undefined;

				return (
					<Page key={String(persona.id)} size="A4" style={s.page}>
						<RHead left={`Persona ${idx + 1} of ${analysis.personas.length}`} right={hostname} />

						<View style={s.pCard}>
							<View style={s.pAccent} />
							<View style={s.pBody}>
								{/* Header */}
								<View style={s.pHeadRow}>
									<View style={s.pAvatar}>
										<Text style={s.pAvatarTxt}>{String(persona.label ?? "?").charAt(0)}</Text>
									</View>
									<View style={{ flex: 1 }}>
										<Text style={s.pName}>{String(persona.label ?? "")}</Text>
										<Text style={s.pMeta}>
											{String(persona.name ?? "")} · {String(persona.age ?? "")} yrs · {String(persona.occupation ?? "")}
										</Text>
									</View>
									<View style={{ alignItems: "flex-end" }}>
										<View style={{ ...s.badge, backgroundColor: sentimentBg(persona.sentiment as string) }}>
											<Text style={{ fontSize: 8.5, fontFamily: "Helvetica-Bold", color: sentimentColor(persona.sentiment as string) }}>
												{String(persona.sentiment ?? "Neutral")}
											</Text>
										</View>
										{uxScore != null && (
											<Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: scoreColor(uxScore), marginTop: 4 }}>
												UX {uxScore}/100
											</Text>
										)}
										{persona.adoptionLikelihood != null && (
											<Text style={{ fontSize: 8, color: C.g500, marginTop: 3 }}>
												{String(persona.adoptionLikelihood)}% adoption
											</Text>
										)}
									</View>
								</View>

								{/* Friction bar */}
								{persona.frictionScore != null && (
									<View style={{ marginBottom: 10 }}>
										<Text style={{ fontSize: 7.5, color: C.g500, marginBottom: 2 }}>
											Friction Score — {String(persona.frictionScore)} / 100
										</Text>
										<View style={s.barTrack}>
											<View
												style={{
													height: "100%",
													width: `${persona.frictionScore}%`,
													backgroundColor: frictionColor(persona.frictionScore as number),
													borderRadius: 3,
												}}
											/>
										</View>
									</View>
								)}

								{/* First impression + persona voice */}
								{persona.firstImpressions && (
									<View style={s.quote}>
										<Text style={s.quoteLabel}>First Impression</Text>
										<Text style={s.quoteTxt}>"{String(persona.firstImpressions)}"</Text>
									</View>
								)}
								{persona.personaVoice && (
									<View style={{ ...s.quote, borderLeftColor: C.green }}>
										<Text style={{ ...s.quoteLabel, color: C.green }}>Persona Voice</Text>
										<Text style={s.quoteTxt}>"{String(persona.personaVoice)}"</Text>
									</View>
								)}

								{/* Positives + Pain points */}
								<View style={s.twoCol}>
									{positives.length > 0 && (
										<View style={s.col}>
											<Text style={{ ...s.colHead, color: C.green }}>✓ Positives</Text>
											<Bullets items={positives} color={C.green} />
										</View>
									)}
									{painPoints.length > 0 && (
										<View style={s.col}>
											<Text style={{ ...s.colHead, color: C.red }}>✗ Pain Points</Text>
											<Bullets items={painPoints} color={C.red} />
										</View>
									)}
								</View>

								{/* Recommendations */}
								{recommendations.length > 0 && (
									<View style={s.recsBox}>
										<Text style={s.recsHead}>→ Recommendations</Text>
										<Bullets items={recommendations} color={C.accent} />
									</View>
								)}

								{/* Accessibility */}
								{persona.accessibilityNotes && (
									<View style={{ ...s.cardAmber, marginTop: 8, padding: 8 }}>
										<Text style={{ ...s.recsHead, color: C.amber }}>⚠ Accessibility Notes</Text>
										<Text style={{ ...s.body, marginBottom: 0 }}>{String(persona.accessibilityNotes)}</Text>
									</View>
								)}
							</View>
						</View>

						{/* Adoption reasoning */}
						{persona.adoptionReasoning && (
							<View style={s.card}>
								<Text style={s.cardTitle}>Adoption Reasoning</Text>
								<Text style={s.bodySmall}>{String(persona.adoptionReasoning)}</Text>
							</View>
						)}

						<Footer hostname={hostname} section={`Persona — ${String(persona.label ?? "")}`} />
					</Page>
				);
			})}

			{/* ── PAGE: FOCUS GROUP ── */}
			{focusGroup && (
				<Page size="A4" style={s.page}>
					<RHead left="Focus Group" right={hostname} />
					<SectionHeader
						title="Focus Group"
						subtitle="Moderated debate — personas cross-reference findings and reach consensus."
					/>

					{/* Summary */}
					{focusGroup.summary && (
						<View style={s.card}>
							<Text style={s.cardTitle}>Moderator Summary</Text>
							<Text style={s.bodySmall}>{focusGroup.summary}</Text>
						</View>
					)}

					{/* Discussion excerpt */}
					{fgDiscussion && fgDiscussion.length > 0 && (
						<View style={{ marginBottom: 10 }}>
							<Text style={{ ...s.colHead, color: C.accent, marginBottom: 6 }}>Discussion (excerpt)</Text>
							{fgDiscussion.slice(0, 6).map((turn, i) => (
								<View key={i} style={{ ...s.conflictItem, borderLeftWidth: 3, borderLeftColor: turn.speaker === "MODERATOR" ? C.accent : C.g300 }}>
									<Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: turn.speaker === "MODERATOR" ? C.accent : C.g900, marginBottom: 2 }}>
										{turn.speaker}
										{turn.turnType ? ` (${turn.turnType})` : ""}
									</Text>
									<Text style={{ fontSize: 8.5, color: C.g700, lineHeight: 1.4 }}>{turn.statement}</Text>
								</View>
							))}
						</View>
					)}

					<View style={s.twoCol}>
						{/* Consensus */}
						{fgConsensus && fgConsensus.length > 0 && (
							<View style={s.col}>
								<Text style={{ ...s.colHead, color: C.green, marginBottom: 5 }}>Consensus Points</Text>
								<Bullets items={fgConsensus} color={C.green} />
							</View>
						)}
						{/* Open questions */}
						{fgOpenQuestions && fgOpenQuestions.length > 0 && (
							<View style={s.col}>
								<Text style={{ ...s.colHead, color: C.amber, marginBottom: 5 }}>Open Questions</Text>
								<Bullets items={fgOpenQuestions} color={C.amber} />
							</View>
						)}
					</View>

					{/* Conflicts */}
					{Array.isArray(fgExt?.conflicts?.items) && (
						<View style={{ marginTop: 6 }}>
							<Text style={{ ...s.colHead, color: C.red, marginBottom: 6 }}>Areas of Conflict</Text>
							{fgExt.conflicts.items.slice(0, 4).map((c: Record<string, unknown>, i: number) => (
								<View key={i} style={s.conflictItem}>
									<Text style={{ fontSize: 8.5, fontFamily: "Helvetica-Bold", color: C.g900, marginBottom: 2 }}>
										{String(c.topic ?? "")}
									</Text>
									<Text style={{ fontSize: 8.5, color: C.g500, lineHeight: 1.4 }}>{String(c.reason ?? "")}</Text>
								</View>
							))}
						</View>
					)}

					<Footer hostname={hostname} section="Focus Group" />
				</Page>
			)}

			{/* ── PAGE: CRAWLER STATISTICS ── */}
			{crawlerStats && (
				<Page size="A4" style={s.page}>
					<RHead left="Crawler Statistics" right={hostname} />
					<SectionHeader
						title="Crawler Statistics"
						subtitle="Raw metrics collected from the crawl — these directly feed all AI findings."
					/>

					<View style={s.statRow}>
						<View style={s.statCard}><Text style={s.statLabel}>Pages</Text><Text style={s.statValue}>{String(crawlerStats.totalPages ?? 0)}</Text></View>
						<View style={s.statCard}><Text style={s.statLabel}>Buttons</Text><Text style={s.statValue}>{String(crawlerStats.totalButtons ?? 0)}</Text></View>
						<View style={s.statCard}><Text style={s.statLabel}>Forms</Text><Text style={s.statValue}>{String(crawlerStats.totalForms ?? 0)}</Text></View>
						<View style={s.statCard}><Text style={s.statLabel}>Links</Text><Text style={s.statValue}>{String(crawlerStats.totalLinks ?? 0)}</Text></View>
					</View>
					<View style={s.statRow}>
						<View style={s.statCard}><Text style={s.statLabel}>Images</Text><Text style={s.statValue}>{String(crawlerStats.totalImages ?? 0)}</Text></View>
						<View style={s.statCard}><Text style={s.statLabel}>Inputs</Text><Text style={s.statValue}>{String(crawlerStats.totalInputs ?? 0)}</Text></View>
						<View style={s.statCard}><Text style={s.statLabel}>Headings</Text><Text style={s.statValue}>{String(crawlerStats.totalHeadings ?? 0)}</Text></View>
						<View style={s.statCard}><Text style={s.statLabel}>Total Words</Text><Text style={s.statValue}>{String(crawlerStats.totalWords ?? 0)}</Text></View>
					</View>

					<View style={s.twoCol}>
						<View style={s.col}>
							<Text style={{ ...s.colHead, color: C.accent, marginBottom: 6 }}>Performance</Text>
							{crawlerStats.avgTtfbMs != null && (
								<View style={s.card}><Text style={s.cardTitle}>Avg TTFB</Text><Text style={s.bodySmall}>{String(crawlerStats.avgTtfbMs)} ms</Text></View>
							)}
							{crawlerStats.avgLoadMs != null && (
								<View style={s.card}><Text style={s.cardTitle}>Avg Load Time</Text><Text style={s.bodySmall}>{String(crawlerStats.avgLoadMs)} ms</Text></View>
							)}
							{crawlerStats.fastestPageMs != null && (
								<View style={s.cardGreen}>
									<Text style={{ ...s.cardTitle, color: C.green }}>Fastest Page</Text>
									<Text style={s.bodySmall}>{String(crawlerStats.fastestPageMs)} ms</Text>
									{crawlerStats.fastestPageUrl && (
										<Text style={{ fontSize: 7.5, color: C.g500, marginTop: 2 }}>{String(crawlerStats.fastestPageUrl)}</Text>
									)}
								</View>
							)}
							{crawlerStats.slowestPageMs != null && (
								<View style={s.cardAmber}>
									<Text style={{ ...s.cardTitle, color: C.amber }}>Slowest Page</Text>
									<Text style={s.bodySmall}>{String(crawlerStats.slowestPageMs)} ms</Text>
									{crawlerStats.slowestPageUrl && (
										<Text style={{ fontSize: 7.5, color: C.g500, marginTop: 2 }}>{String(crawlerStats.slowestPageUrl)}</Text>
									)}
								</View>
							)}
						</View>
						<View style={s.col}>
							<Text style={{ ...s.colHead, color: C.accent, marginBottom: 6 }}>Content</Text>
							<View style={s.card}><Text style={s.cardTitle}>Avg Word Count</Text><Text style={s.bodySmall}>{String(crawlerStats.avgWordCount ?? 0)} words/page</Text></View>
							<View style={s.card}><Text style={s.cardTitle}>Avg DOM Depth</Text><Text style={s.bodySmall}>{String(crawlerStats.avgDomDepth ?? 0)}</Text></View>
							{crawlerStats.largestPageWords != null && crawlerStats.largestPageWords > 0 && (
								<View style={s.card}>
									<Text style={s.cardTitle}>Largest Page</Text>
									<Text style={s.bodySmall}>{String(crawlerStats.largestPageWords)} words</Text>
									{crawlerStats.largestPageUrl && (
										<Text style={{ fontSize: 7.5, color: C.g500, marginTop: 2 }}>{String(crawlerStats.largestPageUrl)}</Text>
									)}
								</View>
							)}
						</View>
					</View>

					<Footer hostname={hostname} section="Crawler Statistics" />
				</Page>
			)}

			{/* ── PAGE: CRAWLED PAGES TABLE ── */}
			{analysis.pages?.length > 0 && (
				<Page size="A4" style={s.page}>
					<RHead left="Crawled Pages" right={hostname} />
					<SectionHeader
						title="Crawled Pages"
						subtitle="All pages analyzed during this run. Findings are sourced directly from these pages."
					/>

					<View style={s.tHead}>
						<Text style={[s.cUrl, s.th]}>URL / Title</Text>
						<Text style={[s.cNum, s.th]}>Depth</Text>
						<Text style={[s.cNum, s.th]}>Btns</Text>
						<Text style={[s.cNum, s.th]}>Forms</Text>
						<Text style={[s.cNum, s.th]}>Friction</Text>
					</View>

					{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
				{analysis.pages.map((page: any, i: number) => (
						<View key={String(page.id)} style={[s.tRow, i % 2 === 1 ? s.tRowAlt : {}]} wrap={false}>
							<View style={s.cUrl}>
								<Text style={s.tdBold}>{String(page.title ?? "No Title")}</Text>
								<Text style={s.tdSmall}>{String(page.url ?? "")}</Text>
							</View>
							<Text style={[s.cNum, s.td]}>{String(page.depth ?? 0)}</Text>
							<Text style={[s.cNum, s.td]}>{String(page.buttonsCount ?? 0)}</Text>
							<Text style={[s.cNum, s.td]}>{String(page.formsCount ?? 0)}</Text>
							<Text style={[s.cNum, s.td]}>
								{page.frictionScore != null ? `${String(page.frictionScore)}/100` : "—"}
							</Text>
						</View>
					))}

					<Footer hostname={hostname} section="Crawled Pages" />
				</Page>
			)}

			{/* ── PAGE: APPENDIX ── */}
			<Page size="A4" style={s.page}>
				<RHead left="Appendix" right={hostname} />
				<SectionHeader
					title="Appendix"
					subtitle="Scoring methodology, confidence definitions, and evidence glossary."
				/>

				<Text style={{ ...s.colHead, color: C.accent, marginBottom: 8 }}>Scoring Methodology</Text>
				<View style={s.card}>
					<Text style={s.cardTitle}>UX Score (0–100)</Text>
					<Text style={s.bodySmall}>
						Weighted average across 10 categories: Navigation (×1.2), Content Clarity (×1.1), Trust Signals (×1.2),
						Conversion Clarity (×1.1), Accessibility (×1.0), Interaction Quality (×1.0), Performance (×0.9),
						Visual Hierarchy (×0.9), Error Prevention (×0.9), Consistency (×0.8).
					</Text>
				</View>
				<View style={s.card}>
					<Text style={s.cardTitle}>Friction Score (0–100)</Text>
					<Text style={s.bodySmall}>
						Calculated from: missing H1 (+10), slow TTFB (+10), slow load (+10), inputs without labels (+5 each),
						images without alt text (+2 each), missing primary CTA (+5). Higher = more friction.
					</Text>
				</View>
				<View style={s.card}>
					<Text style={s.cardTitle}>Adoption Likelihood (%)</Text>
					<Text style={s.bodySmall}>
						Each persona evaluates whether they would adopt or recommend the product. Influenced by goals, frustrations,
						technical level, and the observed UX evidence.
					</Text>
				</View>
				<View style={s.card}>
					<Text style={s.cardTitle}>Conversion Risk (%)</Text>
					<Text style={s.bodySmall}>
						Estimated from friction score and adoption likelihood divergence. High friction with low adoption = high conversion risk.
					</Text>
				</View>

				<Text style={{ ...s.colHead, color: C.accent, marginBottom: 8, marginTop: 8 }}>Confidence Definitions</Text>
				{[
					{ label: "OBSERVED", desc: "Verified directly from crawled page data. Confidence capped based on page count.", color: C.green },
					{ label: "MEASURED", desc: "Calculated from numeric metrics (button counts, load times, word counts, etc.).", color: C.blue },
					{ label: "INFERRED", desc: "Reasonable conclusion from multiple observed signals. Confidence ≤79%.", color: C.amber },
					{ label: "SPECULATIVE", desc: "Low-confidence assumption. Not supported by direct observation. Confidence ≤49%.", color: C.g500 },
				].map((e) => (
					<View key={e.label} style={{ ...s.card, flexDirection: "row", gap: 10, padding: 9 }}>
						<View style={{ borderLeftWidth: 3, borderLeftColor: e.color, paddingLeft: 8, flex: 1 }}>
							<Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: e.color, marginBottom: 2 }}>{e.label}</Text>
							<Text style={{ fontSize: 8.5, color: C.g700, lineHeight: 1.4 }}>{e.desc}</Text>
						</View>
					</View>
				))}

				<Text style={{ ...s.colHead, color: C.accent, marginBottom: 8, marginTop: 8 }}>Important Caveats</Text>
				<View style={{ ...s.cardAmber, padding: 10 }}>
					<Bullets
						items={[
							"\"Not observed\" ≠ \"Does not exist\". Pages not crawled may contain information not reflected in this report.",
							"All personas are synthetic AI agents. Findings are research hypotheses, not user testing results.",
							"Scores are relative to observed evidence. A 1-page crawl warrants reduced confidence.",
							"This report supplements — not replaces — real user research and accessibility testing.",
						]}
						color={C.amber}
					/>
				</View>

				<Footer hostname={hostname} section="Appendix" />
			</Page>

		</Document>
	);
}
