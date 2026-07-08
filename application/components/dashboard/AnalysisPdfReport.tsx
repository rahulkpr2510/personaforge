import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const C = {
	brand: "#6366F1",
	brandDark: "#4338CA",
	brandLight: "#EEF2FF",
	brandMid: "#C7D2FE",
	success: "#059669",
	successLight: "#D1FAE5",
	successMid: "#6EE7B7",
	danger: "#DC2626",
	dangerLight: "#FEE2E2",
	warning: "#D97706",
	warningLight: "#FEF3C7",
	info: "#2563EB",
	infoLight: "#DBEAFE",
	ink: "#0F172A",
	ink2: "#1E293B",
	ink3: "#334155",
	body: "#475569",
	muted: "#94A3B8",
	border: "#E2E8F0",
	surface: "#F8FAFC",
	surface2: "#F1F5F9",
	white: "#FFFFFF",
	coverBg: "#0F172A",
};

const s = StyleSheet.create({
	page: {
		paddingTop: 0,
		paddingBottom: 56,
		paddingHorizontal: 0,
		fontFamily: "Helvetica",
		backgroundColor: C.white,
		fontSize: 9.5,
		color: C.body,
	},

	// ── Cover ──
	coverPage: {
		fontFamily: "Helvetica",
		backgroundColor: C.coverBg,
		flexDirection: "column",
	},
	coverTopStripe: { height: 4, backgroundColor: C.brand },
	coverContent: {
		flex: 1,
		paddingHorizontal: 50,
		paddingTop: 70,
		paddingBottom: 50,
	},
	coverBadgeRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 32,
	},
	coverBadgeDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: C.brand,
		marginRight: 8,
	},
	coverBadgeText: {
		fontSize: 9,
		fontFamily: "Helvetica-Bold",
		letterSpacing: 2.5,
		textTransform: "uppercase",
		color: C.brand,
	},
	coverTitle: {
		fontSize: 36,
		fontFamily: "Helvetica-Bold",
		color: C.white,
		lineHeight: 1.15,
		marginBottom: 10,
	},
	coverSubtitle: {
		fontSize: 13,
		color: "#94A3B8",
		marginBottom: 50,
		lineHeight: 1.5,
	},
	coverDivider: { height: 1, backgroundColor: "#1E293B", marginBottom: 36 },
	coverMetaGrid: { flexDirection: "row", flexWrap: "wrap" },
	coverMetaCell: { width: "50%", paddingBottom: 24, paddingRight: 20 },
	coverMetaLabel: {
		fontSize: 8,
		fontFamily: "Helvetica-Bold",
		letterSpacing: 1.5,
		textTransform: "uppercase",
		color: "#475569",
		marginBottom: 5,
	},
	coverMetaValue: {
		fontSize: 16,
		fontFamily: "Helvetica-Bold",
		color: C.white,
		lineHeight: 1.2,
	},
	coverFooter: {
		borderTopWidth: 1,
		borderTopColor: "#1E293B",
		paddingTop: 20,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	coverFooterText: { fontSize: 8, color: "#475569" },

	// ── Chapter band ──
	chapterBand: {
		backgroundColor: C.ink2,
		paddingHorizontal: 44,
		paddingVertical: 18,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 22,
	},
	chapterAccent: {
		width: 3,
		height: 28,
		backgroundColor: C.brand,
		borderRadius: 2,
		marginRight: 14,
	},
	chapterTitle: {
		fontSize: 15,
		fontFamily: "Helvetica-Bold",
		color: C.white,
		flex: 1,
	},
	chapterMeta: { fontSize: 8, color: "#64748B" },

	content: { paddingHorizontal: 44 },

	// ── Section heading ──
	sectionHeading: {
		fontSize: 11,
		fontFamily: "Helvetica-Bold",
		color: C.ink,
		marginBottom: 2,
		marginTop: 16,
	},

	// ── Metric strip ──
	metricRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
	metricBase: { flex: 1, borderRadius: 8, padding: 12 },
	metricLabel: {
		fontSize: 7,
		fontFamily: "Helvetica-Bold",
		letterSpacing: 1,
		textTransform: "uppercase",
		marginBottom: 4,
	},
	metricValue: { fontSize: 20, fontFamily: "Helvetica-Bold", lineHeight: 1 },
	metricSub: { fontSize: 7.5, color: C.muted, marginTop: 3 },

	// ── Cards ──
	cardBase: { borderRadius: 8, padding: 12, marginBottom: 10, borderWidth: 1 },
	cardTitle: {
		fontSize: 9.5,
		fontFamily: "Helvetica-Bold",
		color: C.ink,
		marginBottom: 5,
	},
	cardBody: { fontSize: 8.5, color: C.body, lineHeight: 1.55 },

	// ── Two column ──
	twoCol: { flexDirection: "row", gap: 12, marginBottom: 12 },
	col: { flex: 1 },
	colLabel: {
		fontSize: 7.5,
		fontFamily: "Helvetica-Bold",
		textTransform: "uppercase",
		letterSpacing: 0.8,
		marginBottom: 8,
	},

	// ── Bullets ──
	bullet: { flexDirection: "row", marginBottom: 4, alignItems: "flex-start" },
	bulletDot: { width: 12, fontSize: 8.5, lineHeight: 1.5 },
	bulletText: { fontSize: 8.5, color: C.body, lineHeight: 1.5, flex: 1 },

	// ── Bar ──
	barContainer: { marginBottom: 8 },
	barRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 3,
		alignItems: "center",
	},
	barLabel: { fontSize: 8.5, color: C.body, flex: 1, lineHeight: 1.3 },
	barValue: {
		fontSize: 8.5,
		fontFamily: "Helvetica-Bold",
		width: 32,
		textAlign: "right" as const,
	},
	barTrack: { height: 6, backgroundColor: C.surface2, borderRadius: 3 },

	// ── Persona card ──
	personaCard: {
		borderWidth: 1,
		borderColor: C.border,
		borderRadius: 10,
		overflow: "hidden",
		marginBottom: 12,
	},
	personaCardTop: { height: 4, backgroundColor: C.brand },
	personaCardBody: { padding: 14 },
	personaHeaderRow: {
		flexDirection: "row",
		alignItems: "flex-start",
		marginBottom: 12,
		paddingBottom: 12,
		borderBottomWidth: 1,
		borderBottomColor: C.border,
		gap: 12,
	},
	personaAvatar: {
		width: 38,
		height: 38,
		borderRadius: 19,
		backgroundColor: C.brandLight,
		justifyContent: "center",
		alignItems: "center",
	},
	personaAvatarText: {
		fontSize: 16,
		fontFamily: "Helvetica-Bold",
		color: C.brand,
	},
	personaInfo: { flex: 1 },
	personaName: {
		fontSize: 12,
		fontFamily: "Helvetica-Bold",
		color: C.ink,
		marginBottom: 2,
	},
	personaMeta: { fontSize: 8.5, color: C.muted, lineHeight: 1.4 },

	// ── Badge ──
	badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
	badgeText: { fontSize: 7.5, fontFamily: "Helvetica-Bold" },

	// ── Quote ──
	quote: {
		borderLeftWidth: 3,
		paddingLeft: 10,
		paddingVertical: 6,
		marginBottom: 10,
		borderRadius: 4,
	},
	quoteLabel: {
		fontSize: 7,
		fontFamily: "Helvetica-Bold",
		textTransform: "uppercase",
		letterSpacing: 1,
		marginBottom: 3,
	},
	quoteText: {
		fontSize: 9,
		fontStyle: "italic",
		color: C.ink3,
		lineHeight: 1.5,
	},

	// ── Table ──
	tableHead: {
		flexDirection: "row",
		backgroundColor: C.surface2,
		paddingVertical: 7,
		paddingHorizontal: 10,
		borderRadius: 5,
		borderWidth: 1,
		borderColor: C.border,
	},
	tableRow: {
		flexDirection: "row",
		paddingVertical: 6,
		paddingHorizontal: 10,
		borderBottomWidth: 1,
		borderBottomColor: C.border,
	},
	tableRowAlt: { backgroundColor: C.surface },
	th: {
		fontSize: 7.5,
		fontFamily: "Helvetica-Bold",
		textTransform: "uppercase",
		letterSpacing: 0.5,
		color: C.muted,
	},
	td: { fontSize: 8.5, color: C.body },
	tdBold: {
		fontSize: 8.5,
		fontFamily: "Helvetica-Bold",
		color: C.ink,
		marginBottom: 1,
	},
	tdSmall: { fontSize: 7.5, color: C.muted },
	cUrl: { flex: 2.5, paddingRight: 8 },
	cNum: { flex: 0.6, textAlign: "center" as const },

	// ── Focus group turn ──
	turnCard: {
		borderRadius: 6,
		padding: 9,
		marginBottom: 6,
		borderWidth: 1,
		borderColor: C.border,
		backgroundColor: C.white,
	},
	turnSpeaker: { fontSize: 8, fontFamily: "Helvetica-Bold", marginBottom: 2 },
	turnStatement: { fontSize: 8.5, color: C.body, lineHeight: 1.45 },

	// ── Running header / footer ──
	pageHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 44,
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: C.border,
		marginBottom: 20,
	},
	pageHeaderLeft: {
		fontSize: 8,
		fontFamily: "Helvetica-Bold",
		textTransform: "uppercase",
		letterSpacing: 1,
		color: C.brand,
	},
	pageHeaderRight: { fontSize: 8, color: C.muted },
	footer: {
		position: "absolute",
		bottom: 16,
		left: 44,
		right: 44,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		borderTopWidth: 1,
		borderTopColor: C.border,
		paddingTop: 8,
	},
	footerLeft: { fontSize: 7, color: C.muted },
	footerRight: { fontSize: 7, color: C.muted },
	footerDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: C.brand },

	// ── Appendix ──
	appendixItem: {
		borderRadius: 6,
		borderWidth: 1,
		borderColor: C.border,
		padding: 10,
		marginBottom: 8,
		flexDirection: "row",
		gap: 10,
	},
	appendixStripe: { width: 3, borderRadius: 2 },
	appendixContent: { flex: 1 },

	// ── Inline stat row for crawler ──
	statRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
	statBox: {
		flex: 1,
		borderRadius: 7,
		padding: 10,
		borderWidth: 1,
	},
	statBoxLabel: {
		fontSize: 7,
		fontFamily: "Helvetica-Bold",
		letterSpacing: 0.8,
		textTransform: "uppercase",
		marginBottom: 3,
	},
	statBoxValue: { fontSize: 17, fontFamily: "Helvetica-Bold", lineHeight: 1 },
	statBoxSub: { fontSize: 7.5, marginTop: 3, lineHeight: 1.3 },
});

function parseList(v: string | null | undefined): string[] {
	if (!v) return [];
	try {
		const p = JSON.parse(v);
		return Array.isArray(p) ? p.map(String).filter(Boolean) : [];
	} catch {
		return v.trim() ? [v] : [];
	}
}
function safeStr(v: unknown): string {
	if (v == null) return "—";
	const s = String(v).trim();
	return s === "" ? "—" : s;
}
function scoreColor(n: number) {
	return n >= 75 ? C.success : n >= 55 ? C.warning : C.danger;
}
function sentimentColor(v?: string | null) {
	const u = (v ?? "").toUpperCase();
	return u === "POSITIVE" ? C.success : u === "NEGATIVE" ? C.danger : C.warning;
}
function sentimentBg(v?: string | null) {
	const u = (v ?? "").toUpperCase();
	return u === "POSITIVE"
		? C.successLight
		: u === "NEGATIVE"
			? C.dangerLight
			: C.warningLight;
}
function frictionColor(n: number) {
	return n > 66 ? C.danger : n > 33 ? C.warning : C.success;
}
function severityColor(sev: string) {
	if (sev === "Critical") return { bg: C.dangerLight, text: C.danger };
	if (sev === "High") return { bg: "#FFF7ED", text: "#C2410C" };
	if (sev === "Medium") return { bg: C.warningLight, text: C.warning };
	return { bg: C.infoLight, text: C.info };
}

function PageFooter({
	hostname,
	section,
}: {
	hostname: string;
	section: string;
}) {
	return (
		<View style={s.footer} fixed>
			<Text style={s.footerLeft}>PersonaForge AI · {hostname}</Text>
			<View style={s.footerDot} />
			{/* Page number */}
			<Text
				style={s.footerRight}
				render={({
					pageNumber,
					totalPages,
				}: {
					pageNumber: number;
					totalPages: number;
				}) => `${section}  ·  ${pageNumber} / ${totalPages}`}
			/>
		</View>
	);
}

function PageRunHeader({ left, right }: { left: string; right: string }) {
	return (
		<View style={s.pageHeader} fixed>
			<Text style={s.pageHeaderLeft}>{left}</Text>
			<Text style={s.pageHeaderRight}>{right}</Text>
		</View>
	);
}

function ChapterBand({ title, meta }: { title: string; meta?: string }) {
	return (
		<View style={s.chapterBand}>
			<View style={s.chapterAccent} />
			<Text style={s.chapterTitle}>{title}</Text>
			{meta && <Text style={s.chapterMeta}>{meta}</Text>}
		</View>
	);
}

function Bullets({ items, color }: { items: string[]; color?: string }) {
	return (
		<View>
			{items.map((item, i) => (
				<View key={i} style={s.bullet}>
					<Text style={{ ...s.bulletDot, color: color ?? C.body }}>•</Text>
					<Text style={s.bulletText}>{item}</Text>
				</View>
			))}
		</View>
	);
}

function ScoreBar({
	label,
	value,
	color,
}: {
	label: string;
	value: number;
	color: string;
}) {
	const pct = Math.min(100, Math.max(0, value));
	return (
		<View style={s.barContainer}>
			<View style={s.barRow}>
				<Text style={s.barLabel}>{label}</Text>
				<Text style={{ ...s.barValue, color }}>{value}</Text>
			</View>
			<View style={s.barTrack}>
				<View
					style={{
						height: "100%",
						width: `${pct}%`,
						backgroundColor: color,
						borderRadius: 3,
					}}
				/>
			</View>
		</View>
	);
}

// Metric card with configurable colors
function MetricCard({
	label,
	value,
	sub,
	bg,
	border,
	labelColor,
	valueColor,
}: {
	label: string;
	value: string;
	sub?: string;
	bg: string;
	border: string;
	labelColor: string;
	valueColor: string;
}) {
	return (
		<View
			style={{
				...s.metricBase,
				backgroundColor: bg,
				borderWidth: 1,
				borderColor: border,
			}}
		>
			<Text style={{ ...s.metricLabel, color: labelColor }}>{label}</Text>
			<Text style={{ ...s.metricValue, color: valueColor }}>{value}</Text>
			{sub ? <Text style={s.metricSub}>{sub}</Text> : null}
		</View>
	);
}

// Generic card
function Card({
	bg,
	border,
	children,
}: {
	bg: string;
	border: string;
	children: React.ReactNode;
}) {
	return (
		<View
			wrap={false}
			style={{ ...s.cardBase, backgroundColor: bg, borderColor: border }}
		>
			{children}
		</View>
	);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function AnalysisPdfReport({ analysis }: { analysis: any }) {
	const hostname = (() => {
		try {
			return new URL(analysis.url).hostname;
		} catch {
			return analysis.url;
		}
	})();

	// Fix 1: Robust date — try startedAt, createdAt, then today
	const reportDate =
		analysis.startedAt ?? analysis.createdAt ?? new Date().toISOString();
	const dateStr = new Date(reportDate).toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});

	const scorecard = (analysis.executiveScorecard ?? {}) as Record<
		string,
		unknown
	>;
	const topStrengths =
		(scorecard.topStrengths as Array<{
			title: string;
			evidence: string;
			supportedByPersonas: string[];
		}>) ?? [];
	const topRisks =
		(scorecard.topRisks as Array<{
			title: string;
			evidence: string;
			severity: string;
			businessImpact: string;
		}>) ?? [];
	const adoptionComparison =
		(scorecard.adoptionComparison as Array<{
			label: string;
			name: string;
			score: number;
		}>) ?? [];
	const confidenceDist = scorecard.confidenceDistribution as
		| { high: number; medium: number; low: number }
		| undefined;
	const mostImpactful = scorecard.mostImpactfulRecommendation as
		| string
		| undefined;
	const technicalDebt = scorecard.technicalDebtIndicator as string | undefined;
	const conversionRisk = scorecard.conversionRisk as number | undefined;
	const accessibilityRisk = scorecard.accessibilityRisk as string | undefined;
	const businessRisk = scorecard.businessRisk as string | undefined;

	const metaBlob = (analysis.meta ?? {}) as Record<string, unknown>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const crawlCoverage = (analysis.crawlCoverage ??
		metaBlob.crawlCoverage) as any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const analysisReliability = (analysis.analysisReliability ??
		metaBlob.analysisReliability) as any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const crawlerStats = (analysis.crawlerStats ?? metaBlob.crawlerStats) as any;
	const researchGaps =
		((analysis.researchGaps ?? metaBlob.researchGaps) as
			| string[]
			| undefined) ?? [];

	const focusGroup = analysis.focusGroup;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const fgExt = focusGroup as Record<string, any> | undefined;
	const fgConsensus = fgExt?.consensus as string[] | undefined;
	const fgOpenQuestions = fgExt?.openQuestions as string[] | undefined;
	const fgDiscussion = fgExt?.discussion as
		| Array<{ speaker: string; statement: string; turnType?: string }>
		| undefined;
	const fgResearchGaps =
		(fgExt?.researchGaps as string[] | undefined) ?? researchGaps;

	const personas = analysis.personas ?? [];

	return (
		<Document
			title={`PersonaForge Report — ${hostname}`}
			author="PersonaForge AI"
			subject="Synthetic UX Research Report"
			creator="PersonaForge"
		>
			{/* ══════════════════════════════════════════════════════════════════
          PAGE 1 — COVER
      ══════════════════════════════════════════════════════════════════ */}
			<Page size="A4" style={s.coverPage}>
				<View style={s.coverTopStripe} />
				<View style={s.coverContent}>
					<View style={s.coverBadgeRow}>
						<View style={s.coverBadgeDot} />
						<Text style={s.coverBadgeText}>AI UX Research Report</Text>
					</View>
					<Text style={s.coverTitle}>{hostname}</Text>
					<Text style={s.coverSubtitle}>{analysis.url}</Text>
					<View style={s.coverDivider} />
					<View style={s.coverMetaGrid}>
						<View style={s.coverMetaCell}>
							<Text style={s.coverMetaLabel}>Report Date</Text>
							<Text style={s.coverMetaValue}>{dateStr}</Text>
						</View>
						<View style={s.coverMetaCell}>
							<Text style={s.coverMetaLabel}>Device</Text>
							<Text style={s.coverMetaValue}>
								{analysis.deviceType === "MOBILE" ? "Mobile" : "Desktop"}
							</Text>
						</View>
						<View style={s.coverMetaCell}>
							<Text style={s.coverMetaLabel}>Pages Crawled</Text>
							<Text style={s.coverMetaValue}>
								{analysis.pages?.length ?? 0}
							</Text>
						</View>
						<View style={s.coverMetaCell}>
							<Text style={s.coverMetaLabel}>Personas Evaluated</Text>
							<Text style={s.coverMetaValue}>{personas.length}</Text>
						</View>
						{analysis.overallUxScore != null && (
							<View style={s.coverMetaCell}>
								<Text style={s.coverMetaLabel}>Overall UX Score</Text>
								<Text
									style={{
										...s.coverMetaValue,
										color: scoreColor(analysis.overallUxScore),
									}}
								>
									{analysis.overallUxScore} / 100
								</Text>
							</View>
						)}
						{analysis.uxMaturityLevel && (
							<View style={s.coverMetaCell}>
								<Text style={s.coverMetaLabel}>UX Maturity</Text>
								<Text style={s.coverMetaValue}>{analysis.uxMaturityLevel}</Text>
							</View>
						)}
						{analysis.overallSentiment && (
							<View style={s.coverMetaCell}>
								<Text style={s.coverMetaLabel}>Overall Sentiment</Text>
								<Text
									style={{
										...s.coverMetaValue,
										color: sentimentColor(analysis.overallSentiment),
									}}
								>
									{analysis.overallSentiment}
								</Text>
							</View>
						)}
					</View>
					<View style={{ flex: 1 }} />
					<View style={s.coverFooter}>
						<Text style={s.coverFooterText}>
							Generated by PersonaForge AI · Confidential · Evidence-driven
							synthetic UX research
						</Text>
						<Text style={s.coverFooterText}>{dateStr}</Text>
					</View>
				</View>
			</Page>

			{/* ══════════════════════════════════════════════════════════════════
          PAGE 2 — EXECUTIVE SCORECARD
      ══════════════════════════════════════════════════════════════════ */}
			<Page size="A4" style={s.page}>
				<PageRunHeader left="Executive Scorecard" right={hostname} />
				<ChapterBand
					title="Executive Scorecard"
					meta={`${personas.length} personas`}
				/>
				<View style={s.content}>
					{/* Top metrics — wrap=false keeps the row together */}
					<View wrap={false} style={s.metricRow}>
						{analysis.overallUxScore != null && (
							<MetricCard
								label="UX Score"
								value={`${analysis.overallUxScore}/100`}
								bg={C.brandLight}
								border={C.brandMid}
								labelColor={C.brand}
								valueColor={scoreColor(analysis.overallUxScore)}
							/>
						)}
						{conversionRisk != null && (
							<MetricCard
								label="Conversion Risk"
								value={`${conversionRisk}%`}
								bg={C.dangerLight}
								border="#FECACA"
								labelColor={C.danger}
								valueColor={C.danger}
							/>
						)}
						{technicalDebt && (
							<MetricCard
								label="Technical Debt"
								value={technicalDebt}
								bg={C.warningLight}
								border="#FDE68A"
								labelColor={C.warning}
								valueColor={C.warning}
							/>
						)}
						{accessibilityRisk && (
							<MetricCard
								label="A11y Risk"
								value={accessibilityRisk}
								bg={C.warningLight}
								border="#FDE68A"
								labelColor={C.warning}
								valueColor={C.warning}
							/>
						)}
						<MetricCard
							label="Personas"
							value={String(personas.length)}
							bg={C.surface}
							border={C.border}
							labelColor={C.muted}
							valueColor={C.ink}
						/>
					</View>

					{businessRisk && (
						<Card bg={C.warningLight} border="#FDE68A">
							<Text style={{ ...s.cardTitle, color: C.warning }}>
								Business Risk Assessment
							</Text>
							<Text style={s.cardBody}>{businessRisk}</Text>
						</Card>
					)}
					{mostImpactful && (
						<Card bg={C.brandLight} border={C.brandMid}>
							<Text style={{ ...s.cardTitle, color: C.brand }}>
								★ Most Impactful Recommendation
							</Text>
							<Text style={s.cardBody}>{mostImpactful}</Text>
						</Card>
					)}

					{/* Strengths + Risks — two-col, each column wraps independently */}
					<View style={s.twoCol}>
						{topStrengths.length > 0 && (
							<View style={s.col}>
								{topStrengths.slice(0, 3).map((str, i) => (
									<View wrap={false} key={i}>
										{i === 0 && (
											<Text style={{ ...s.colLabel, color: C.success }}>
												✓ Top Strengths
											</Text>
										)}
										<View
											style={{
												...s.cardBase,
												backgroundColor: C.successLight,
												borderColor: C.successMid,
												padding: 9,
											}}
										>
											<Text style={s.cardTitle}>{str.title}</Text>
											<Text style={s.cardBody}>{str.evidence}</Text>
											{str.supportedByPersonas?.length > 0 && (
												<Text
													style={{
														fontSize: 7.5,
														color: C.success,
														marginTop: 4,
													}}
												>
													{str.supportedByPersonas.join(" · ")}
												</Text>
											)}
										</View>
									</View>
								))}
							</View>
						)}
						{topRisks.length > 0 && (
							<View style={s.col}>
								{topRisks.slice(0, 3).map((risk, i) => {
									const sc = severityColor(risk.severity);
									return (
										<View wrap={false} key={i}>
											{i === 0 && (
												<Text style={{ ...s.colLabel, color: C.danger }}>
													✗ Top Risks
												</Text>
											)}
											<View
												style={{
													...s.cardBase,
													backgroundColor: C.surface,
													borderColor: C.border,
													padding: 9,
												}}
											>
												<View
													style={{
														flexDirection: "row",
														alignItems: "center",
														marginBottom: 4,
														gap: 6,
													}}
												>
													<View
														style={{
															backgroundColor: sc.bg,
															borderRadius: 10,
															paddingHorizontal: 7,
															paddingVertical: 2,
														}}
													>
														<Text
															style={{
																fontSize: 7,
																fontFamily: "Helvetica-Bold",
																color: sc.text,
															}}
														>
															{risk.severity}
														</Text>
													</View>
												</View>
												<Text style={s.cardTitle}>{risk.title}</Text>
												<Text style={{ ...s.cardBody, marginBottom: 3 }}>
													{risk.evidence}
												</Text>
												<Text style={{ fontSize: 7.5, color: C.danger }}>
													Impact: {risk.businessImpact}
												</Text>
											</View>
										</View>
									);
								})}
							</View>
						)}
					</View>

					{/* Adoption bars */}
					{adoptionComparison.length > 0 && (
						<View wrap={false} style={{ marginBottom: 14 }}>
							<Text style={{ ...s.colLabel, color: C.brand, marginBottom: 10 }}>
								Adoption Likelihood by Persona
							</Text>
							{adoptionComparison.map((a, i) => (
								<ScoreBar
									key={i}
									label={`${a.label} — ${a.name}`}
									value={a.score}
									color={scoreColor(a.score)}
								/>
							))}
						</View>
					)}

					{/* Confidence distribution */}
					{confidenceDist && (
						<View
							wrap={false}
							style={{
								...s.cardBase,
								backgroundColor: C.surface,
								borderColor: C.border,
							}}
						>
							<Text style={s.cardTitle}>Finding Confidence Distribution</Text>
							<View
								style={{
									...s.barTrack,
									height: 10,
									borderRadius: 5,
									overflow: "hidden",
									marginBottom: 6,
									marginTop: 4,
								}}
							>
								<View style={{ flexDirection: "row", height: "100%" }}>
									<View
										style={{
											width: `${confidenceDist.high}%`,
											backgroundColor: C.success,
											height: "100%",
										}}
									/>
									<View
										style={{
											width: `${confidenceDist.medium}%`,
											backgroundColor: C.warning,
											height: "100%",
										}}
									/>
									<View
										style={{
											width: `${confidenceDist.low}%`,
											backgroundColor: C.muted,
											height: "100%",
										}}
									/>
								</View>
							</View>
							<View style={{ flexDirection: "row", gap: 16 }}>
								<Text style={{ fontSize: 7.5, color: C.success }}>
									■ High {confidenceDist.high}%
								</Text>
								<Text style={{ fontSize: 7.5, color: C.warning }}>
									■ Medium {confidenceDist.medium}%
								</Text>
								<Text style={{ fontSize: 7.5, color: C.muted }}>
									■ Low {confidenceDist.low}%
								</Text>
							</View>
						</View>
					)}
				</View>
				<PageFooter hostname={hostname} section="Executive Scorecard" />
			</Page>

			{/* ══════════════════════════════════════════════════════════════════
          PAGE 3 — COVERAGE & RELIABILITY
      ══════════════════════════════════════════════════════════════════ */}
			{(crawlCoverage || analysisReliability) && (
				<Page size="A4" style={s.page}>
					<PageRunHeader left="Coverage & Reliability" right={hostname} />
					<ChapterBand
						title="Coverage & Reliability"
						meta="Site analysis depth & confidence"
					/>
					<View style={s.content}>
						{crawlCoverage && (
							<View wrap={false}>
								<Text
									style={{ ...s.colLabel, color: C.brand, marginBottom: 10 }}
								>
									Analysis Coverage
								</Text>
								<View style={s.metricRow}>
									<MetricCard
										label="Pages Crawled"
										value={safeStr(crawlCoverage.pagesCrawled)}
										bg={C.brandLight}
										border={C.brandMid}
										labelColor={C.brand}
										valueColor={C.brand}
									/>
									<MetricCard
										label="Coverage"
										value={`${safeStr(crawlCoverage.coveragePercent)}%`}
										bg={C.surface}
										border={C.border}
										labelColor={C.muted}
										valueColor={C.ink}
									/>
									<MetricCard
										label="Avg Depth"
										value={safeStr(crawlCoverage.avgDepth)}
										bg={C.surface}
										border={C.border}
										labelColor={C.muted}
										valueColor={C.ink}
									/>
									<MetricCard
										label="Confidence"
										value={safeStr(crawlCoverage.coverageConfidence)}
										bg={C.surface}
										border={C.border}
										labelColor={C.muted}
										valueColor={C.ink}
									/>
								</View>
								{crawlCoverage.coverageNote && (
									<Card bg={C.warningLight} border="#FDE68A">
										<Text style={s.cardBody}>
											⚠ {String(crawlCoverage.coverageNote)}
										</Text>
									</Card>
								)}
							</View>
						)}

						{analysisReliability && (
							<View wrap={false} style={{ marginTop: 12 }}>
								<Text
									style={{ ...s.colLabel, color: C.brand, marginBottom: 10 }}
								>
									Analysis Reliability
								</Text>
								<View style={s.metricRow}>
									<MetricCard
										label="Reliability"
										value={`${safeStr(analysisReliability.score)}%`}
										bg={C.successLight}
										border={C.successMid}
										labelColor={C.success}
										valueColor={C.success}
									/>
									<MetricCard
										label="Evidence-Backed"
										value={safeStr(analysisReliability.evidenceBacked)}
										bg={C.surface}
										border={C.border}
										labelColor={C.muted}
										valueColor={C.ink}
									/>
									<MetricCard
										label="Measured"
										value={safeStr(analysisReliability.measured)}
										bg={C.surface}
										border={C.border}
										labelColor={C.muted}
										valueColor={C.ink}
									/>
									<MetricCard
										label="Inferred"
										value={safeStr(analysisReliability.inferred)}
										bg={C.surface}
										border={C.border}
										labelColor={C.muted}
										valueColor={C.ink}
									/>
									<MetricCard
										label="Speculative"
										value={safeStr(analysisReliability.speculative)}
										bg={C.warningLight}
										border="#FDE68A"
										labelColor={C.warning}
										valueColor={C.warning}
									/>
								</View>
								{analysisReliability.reliabilityNote && (
									<Card bg={C.surface} border={C.border}>
										<Text style={s.cardBody}>
											{String(analysisReliability.reliabilityNote)}
										</Text>
									</Card>
								)}
							</View>
						)}

						{fgResearchGaps.length > 0 && (
							<View wrap={false} style={{ marginTop: 14 }}>
								<Text
									style={{ ...s.colLabel, color: C.warning, marginBottom: 6 }}
								>
									Research Gaps
								</Text>
								<Bullets items={fgResearchGaps.slice(0, 8)} color={C.warning} />
							</View>
						)}

						{/* Evidence level legend */}
						<View wrap={false} style={{ marginTop: 20 }}>
							<Text style={{ ...s.colLabel, color: C.muted, marginBottom: 8 }}>
								Evidence Level Glossary
							</Text>
							<View style={{ flexDirection: "row", gap: 10 }}>
								{[
									{
										label: "OBSERVED",
										desc: "Verified from crawl data",
										color: C.success,
									},
									{
										label: "MEASURED",
										desc: "Calculated metric",
										color: C.info,
									},
									{
										label: "INFERRED",
										desc: "Likely from evidence",
										color: C.warning,
									},
									{
										label: "SPECULATIVE",
										desc: "Low confidence",
										color: C.muted,
									},
								].map((e) => (
									<View
										key={e.label}
										style={{
											flex: 1,
											borderLeftWidth: 2,
											borderLeftColor: e.color,
											paddingLeft: 7,
											paddingVertical: 4,
										}}
									>
										<Text
											style={{
												fontSize: 7.5,
												fontFamily: "Helvetica-Bold",
												color: e.color,
												marginBottom: 2,
											}}
										>
											{e.label}
										</Text>
										<Text
											style={{ fontSize: 7.5, color: C.muted, lineHeight: 1.4 }}
										>
											{e.desc}
										</Text>
									</View>
								))}
							</View>
						</View>
					</View>
					<PageFooter hostname={hostname} section="Coverage & Reliability" />
				</Page>
			)}

			{/* ══════════════════════════════════════════════════════════════════
          PAGES — ONE PER PERSONA (Fix 2: each persona on its own page,
          wrap=false on each sub-section so nothing mid-breaks)
      ══════════════════════════════════════════════════════════════════ */}
			{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
			{personas.map((persona: any, idx: number) => {
				const positives = parseList(persona.positives as string);
				const painPoints = parseList(persona.painPoints as string);
				const recommendations = parseList(persona.recommendations as string);
				const uxScore = persona.overallUxScore as number | null | undefined;
				const initial = String(persona.label ?? "?")
					.charAt(0)
					.toUpperCase();

				return (
					<Page key={String(persona.id)} size="A4" style={s.page}>
						<PageRunHeader
							left={`Persona ${idx + 1} / ${personas.length}`}
							right={hostname}
						/>
						<ChapterBand
							title={`Persona — ${safeStr(persona.label)}`}
							meta={`${safeStr(persona.name)} · ${safeStr(persona.age)} yrs · ${safeStr(persona.occupation)}`}
						/>
						<View style={s.content}>
							{/* Identity card */}
							<View wrap={false} style={s.personaCard}>
								<View style={s.personaCardTop} />
								<View style={s.personaCardBody}>
									<View style={s.personaHeaderRow}>
										<View style={s.personaAvatar}>
											<Text style={s.personaAvatarText}>{initial}</Text>
										</View>
										<View style={s.personaInfo}>
											<Text style={s.personaName}>
												{safeStr(persona.label)}
											</Text>
											<Text style={s.personaMeta}>
												{safeStr(persona.name)} · {safeStr(persona.age)} yrs
											</Text>
											<Text style={s.personaMeta}>
												{safeStr(persona.occupation)}
											</Text>
										</View>
										<View style={{ alignItems: "flex-end", gap: 3 }}>
											<View
												style={{
													...s.badge,
													backgroundColor: sentimentBg(persona.sentiment),
												}}
											>
												<Text
													style={{
														...s.badgeText,
														color: sentimentColor(persona.sentiment),
													}}
												>
													{safeStr(persona.sentiment)}
												</Text>
											</View>
											{uxScore != null && (
												<Text
													style={{
														fontSize: 13,
														fontFamily: "Helvetica-Bold",
														color: scoreColor(uxScore),
														marginTop: 4,
													}}
												>
													UX {uxScore}/100
												</Text>
											)}
											{persona.adoptionLikelihood != null && (
												<Text
													style={{ fontSize: 8, color: C.muted, marginTop: 2 }}
												>
													{String(persona.adoptionLikelihood)}% adoption
												</Text>
											)}
										</View>
									</View>
									{persona.frictionScore != null && (
										<ScoreBar
											label="Friction Score — higher is worse"
											value={persona.frictionScore as number}
											color={frictionColor(persona.frictionScore as number)}
										/>
									)}
								</View>
							</View>

							{/* Quotes */}
							{persona.firstImpressions && (
								<View
									wrap={false}
									style={{
										...s.quote,
										borderLeftColor: C.brand,
										backgroundColor: C.brandLight,
									}}
								>
									<Text style={{ ...s.quoteLabel, color: C.brand }}>
										First Impression
									</Text>
									<Text style={s.quoteText}>
										"{String(persona.firstImpressions)}"
									</Text>
								</View>
							)}
							{persona.personaVoice && (
								<View
									wrap={false}
									style={{
										...s.quote,
										borderLeftColor: C.success,
										backgroundColor: C.successLight,
									}}
								>
									<Text style={{ ...s.quoteLabel, color: C.success }}>
										Persona Voice
									</Text>
									<Text style={s.quoteText}>
										"{String(persona.personaVoice)}"
									</Text>
								</View>
							)}

							{/* Positives + Pain Points */}
							<View style={s.twoCol}>
								{positives.length > 0 && (
									<View style={s.col}>
										<Text style={{ ...s.colLabel, color: C.success }}>
											✓ Positives
										</Text>
										<Bullets items={positives} color={C.success} />
									</View>
								)}
								{painPoints.length > 0 && (
									<View style={s.col}>
										<Text style={{ ...s.colLabel, color: C.danger }}>
											✗ Pain Points
										</Text>
										<Bullets items={painPoints} color={C.danger} />
									</View>
								)}
							</View>

							{recommendations.length > 0 && (
								<View
									wrap={false}
									style={{
										...s.cardBase,
										backgroundColor: C.brandLight,
										borderColor: C.brandMid,
									}}
								>
									<Text style={{ ...s.cardTitle, color: C.brand }}>
										→ Recommendations
									</Text>
									<Bullets items={recommendations} color={C.brand} />
								</View>
							)}
							{persona.accessibilityNotes && (
								<Card bg={C.warningLight} border="#FDE68A">
									<Text style={{ ...s.cardTitle, color: C.warning }}>
										⚠ Accessibility Notes
									</Text>
									<Text style={s.cardBody}>
										{String(persona.accessibilityNotes)}
									</Text>
								</Card>
							)}
							{persona.adoptionReasoning && (
								<Card bg={C.surface} border={C.border}>
									<Text style={s.cardTitle}>Adoption Reasoning</Text>
									<Text style={s.cardBody}>
										{String(persona.adoptionReasoning)}
									</Text>
								</Card>
							)}
						</View>
						<PageFooter
							hostname={hostname}
							section={`Persona — ${safeStr(persona.label)}`}
						/>
					</Page>
				);
			})}

			{/* ══════════════════════════════════════════════════════════════════
          PAGE — FOCUS GROUP
      ══════════════════════════════════════════════════════════════════ */}
			{focusGroup && (
				<Page size="A4" style={s.page}>
					<PageRunHeader left="Focus Group" right={hostname} />
					<ChapterBand
						title="Focus Group"
						meta="Moderated AI debate across all personas"
					/>
					<View style={s.content}>
						{focusGroup.summary && (
							<Card bg={C.brandLight} border={C.brandMid}>
								<Text style={s.cardTitle}>Moderator Summary</Text>
								<Text style={s.cardBody}>{focusGroup.summary}</Text>
							</Card>
						)}
						{fgDiscussion && fgDiscussion.length > 0 && (
							<View style={{ marginBottom: 12 }}>
								<Text
									style={{ ...s.colLabel, color: C.brand, marginBottom: 8 }}
								>
									Discussion Excerpt
								</Text>
								{fgDiscussion.slice(0, 6).map((turn, i) => (
									<View
										wrap={false}
										key={i}
										style={{
											...s.turnCard,
											borderLeftWidth: 3,
											borderLeftColor:
												turn.speaker === "MODERATOR" ? C.brand : C.border,
										}}
									>
										<Text
											style={{
												...s.turnSpeaker,
												color: turn.speaker === "MODERATOR" ? C.brand : C.ink,
											}}
										>
											{turn.speaker}
											{turn.turnType ? ` (${turn.turnType})` : ""}
										</Text>
										<Text style={s.turnStatement}>{turn.statement}</Text>
									</View>
								))}
							</View>
						)}
						<View style={s.twoCol}>
							{fgConsensus && fgConsensus.length > 0 && (
								<View style={s.col}>
									<Text style={{ ...s.colLabel, color: C.success }}>
										Consensus Points
									</Text>
									<Bullets items={fgConsensus} color={C.success} />
								</View>
							)}
							{fgOpenQuestions && fgOpenQuestions.length > 0 && (
								<View style={s.col}>
									<Text style={{ ...s.colLabel, color: C.warning }}>
										Open Questions
									</Text>
									<Bullets items={fgOpenQuestions} color={C.warning} />
								</View>
							)}
						</View>
						{Array.isArray(fgExt?.conflicts?.items) && (
							<View style={{ marginTop: 8 }}>
								<Text
									style={{ ...s.colLabel, color: C.danger, marginBottom: 6 }}
								>
									Areas of Conflict
								</Text>
								{fgExt.conflicts.items
									.slice(0, 4)
									.map((c: Record<string, unknown>, i: number) => (
										<View wrap={false} key={i} style={s.turnCard}>
											<Text
												style={{
													fontSize: 8.5,
													fontFamily: "Helvetica-Bold",
													color: C.ink,
													marginBottom: 2,
												}}
											>
												{safeStr(c.topic)}
											</Text>
											<Text
												style={{
													fontSize: 8.5,
													color: C.muted,
													lineHeight: 1.4,
												}}
											>
												{safeStr(c.reason)}
											</Text>
										</View>
									))}
							</View>
						)}
					</View>
					<PageFooter hostname={hostname} section="Focus Group" />
				</Page>
			)}

			{/* ══════════════════════════════════════════════════════════════════
          PAGE — CRAWLER STATISTICS (Fix 5: proper null-safe rendering)
      ══════════════════════════════════════════════════════════════════ */}
			{crawlerStats && (
				<Page size="A4" style={s.page}>
					<PageRunHeader left="Crawler Statistics" right={hostname} />
					<ChapterBand
						title="Crawler Statistics"
						meta="Raw metrics from the crawl"
					/>
					<View style={s.content}>
						{/* Count stats */}
						<View wrap={false}>
							<Text style={{ ...s.colLabel, color: C.brand, marginBottom: 10 }}>
								Page Inventory
							</Text>
							<View style={s.metricRow}>
								<MetricCard
									label="Pages"
									value={safeStr(crawlerStats.totalPages)}
									bg={C.brandLight}
									border={C.brandMid}
									labelColor={C.brand}
									valueColor={C.brand}
								/>
								<MetricCard
									label="Buttons"
									value={safeStr(crawlerStats.totalButtons)}
									bg={C.surface}
									border={C.border}
									labelColor={C.muted}
									valueColor={C.ink}
								/>
								<MetricCard
									label="Forms"
									value={safeStr(crawlerStats.totalForms)}
									bg={C.surface}
									border={C.border}
									labelColor={C.muted}
									valueColor={C.ink}
								/>
								<MetricCard
									label="Links"
									value={safeStr(crawlerStats.totalLinks)}
									bg={C.surface}
									border={C.border}
									labelColor={C.muted}
									valueColor={C.ink}
								/>
							</View>
							<View style={s.metricRow}>
								<MetricCard
									label="Images"
									value={safeStr(crawlerStats.totalImages)}
									bg={C.surface}
									border={C.border}
									labelColor={C.muted}
									valueColor={C.ink}
								/>
								<MetricCard
									label="Inputs"
									value={safeStr(crawlerStats.totalInputs)}
									bg={C.surface}
									border={C.border}
									labelColor={C.muted}
									valueColor={C.ink}
								/>
								<MetricCard
									label="Headings"
									value={safeStr(crawlerStats.totalHeadings)}
									bg={C.surface}
									border={C.border}
									labelColor={C.muted}
									valueColor={C.ink}
								/>
								<MetricCard
									label="Total Words"
									value={safeStr(crawlerStats.totalWords)}
									bg={C.surface}
									border={C.border}
									labelColor={C.muted}
									valueColor={C.ink}
								/>
							</View>
						</View>

						{/* Performance */}
						<View wrap={false} style={{ marginTop: 8 }}>
							<Text style={{ ...s.colLabel, color: C.brand, marginBottom: 10 }}>
								Performance
							</Text>
							<View style={s.metricRow}>
								{crawlerStats.avgTtfbMs != null && (
									<MetricCard
										label="Avg TTFB"
										value={`${safeStr(crawlerStats.avgTtfbMs)} ms`}
										bg={C.surface}
										border={C.border}
										labelColor={C.muted}
										valueColor={C.ink}
									/>
								)}
								{crawlerStats.avgLoadMs != null && (
									<MetricCard
										label="Avg Load"
										value={`${safeStr(crawlerStats.avgLoadMs)} ms`}
										bg={C.surface}
										border={C.border}
										labelColor={C.muted}
										valueColor={C.ink}
									/>
								)}
								{crawlerStats.avgWordCount != null && (
									<MetricCard
										label="Avg Words/Page"
										value={safeStr(crawlerStats.avgWordCount)}
										bg={C.surface}
										border={C.border}
										labelColor={C.muted}
										valueColor={C.ink}
									/>
								)}
								{crawlerStats.avgDomDepth != null && (
									<MetricCard
										label="Avg DOM Depth"
										value={safeStr(crawlerStats.avgDomDepth)}
										bg={C.surface}
										border={C.border}
										labelColor={C.muted}
										valueColor={C.ink}
									/>
								)}
							</View>
						</View>

						{/* Fix 5 — Fastest / Slowest pages as simple cards, not metric cards */}
						<View wrap={false} style={{ marginTop: 4 }}>
							<Text style={{ ...s.colLabel, color: C.brand, marginBottom: 10 }}>
								Page Benchmarks
							</Text>
							<View style={s.twoCol}>
								{/* Fastest */}
								<View
									style={{
										...s.cardBase,
										backgroundColor: C.successLight,
										borderColor: C.successMid,
										flex: 1,
									}}
								>
									<Text
										style={{
											fontSize: 8,
											fontFamily: "Helvetica-Bold",
											color: C.success,
											marginBottom: 5,
										}}
									>
										Fastest Page
									</Text>
									<Text
										style={{
											fontSize: 18,
											fontFamily: "Helvetica-Bold",
											color: C.success,
											lineHeight: 1,
											marginBottom: 4,
										}}
									>
										{crawlerStats.fastestPageMs != null
											? `${crawlerStats.fastestPageMs} ms`
											: "—"}
									</Text>
									{crawlerStats.fastestPageUrl != null &&
									crawlerStats.fastestPageUrl !== "" ? (
										<Text
											style={{
												fontSize: 7.5,
												color: C.body,
												lineHeight: 1.35,
												maxLines: 2,
												textOverflow: "ellipsis",
											}}
										>
											{String(crawlerStats.fastestPageUrl)}
										</Text>
									) : (
										<Text style={{ fontSize: 7.5, color: C.muted }}>
											URL not recorded
										</Text>
									)}
								</View>

								{/* Slowest */}
								<View
									style={{
										...s.cardBase,
										backgroundColor: C.warningLight,
										borderColor: "#FDE68A",
										flex: 1,
									}}
								>
									<Text
										style={{
											fontSize: 8,
											fontFamily: "Helvetica-Bold",
											color: C.warning,
											marginBottom: 5,
										}}
									>
										Slowest Page
									</Text>
									<Text
										style={{
											fontSize: 18,
											fontFamily: "Helvetica-Bold",
											color: C.warning,
											lineHeight: 1,
											marginBottom: 4,
										}}
									>
										{crawlerStats.slowestPageMs != null
											? `${crawlerStats.slowestPageMs} ms`
											: "—"}
									</Text>
									{crawlerStats.slowestPageUrl != null &&
									crawlerStats.slowestPageUrl !== "" ? (
										<Text
											style={{
												fontSize: 7.5,
												color: C.body,
												lineHeight: 1.35,
												maxLines: 2,
											}}
										>
											{String(crawlerStats.slowestPageUrl)}
										</Text>
									) : (
										<Text style={{ fontSize: 7.5, color: C.muted }}>
											URL not recorded
										</Text>
									)}
								</View>

								{/* Largest page */}
								{crawlerStats.largestPageWords != null && (
									<View
										style={{
											...s.cardBase,
											backgroundColor: C.surface,
											borderColor: C.border,
											flex: 1,
										}}
									>
										<Text
											style={{
												fontSize: 8,
												fontFamily: "Helvetica-Bold",
												color: C.muted,
												marginBottom: 5,
											}}
										>
											Largest Page
										</Text>
										<Text
											style={{
												fontSize: 18,
												fontFamily: "Helvetica-Bold",
												color: C.ink,
												lineHeight: 1,
												marginBottom: 4,
											}}
										>
											{crawlerStats.largestPageWords} words
										</Text>
										{crawlerStats.largestPageUrl != null &&
										crawlerStats.largestPageUrl !== "" ? (
											<Text
												style={{
													fontSize: 7.5,
													color: C.body,
													lineHeight: 1.35,
													maxLines: 2,
												}}
											>
												{String(crawlerStats.largestPageUrl)}
											</Text>
										) : (
											<Text style={{ fontSize: 7.5, color: C.muted }}>
												URL not recorded
											</Text>
										)}
									</View>
								)}
							</View>
						</View>
					</View>
					<PageFooter hostname={hostname} section="Crawler Statistics" />
				</Page>
			)}

			{/* ══════════════════════════════════════════════════════════════════
          PAGE — CRAWLED PAGES TABLE
      ══════════════════════════════════════════════════════════════════ */}
			{analysis.pages?.length > 0 && (
				<Page size="A4" style={s.page}>
					<PageRunHeader left="Crawled Pages" right={hostname} />
					<ChapterBand
						title="Crawled Pages"
						meta={`${analysis.pages.length} pages analyzed`}
					/>
					<View style={s.content}>
						<View style={s.tableHead}>
							<Text style={[s.cUrl, s.th]}>URL / Title</Text>
							<Text style={[s.cNum, s.th]}>Depth</Text>
							<Text style={[s.cNum, s.th]}>Btns</Text>
							<Text style={[s.cNum, s.th]}>Forms</Text>
							<Text style={[s.cNum, s.th]}>Friction</Text>
						</View>
						{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
						{analysis.pages.map((page: any, i: number) => (
							<View
								wrap={false}
								key={String(page.id)}
								style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}
							>
								<View style={s.cUrl}>
									<Text style={s.tdBold}>{safeStr(page.title)}</Text>
									<Text style={s.tdSmall}>{safeStr(page.url)}</Text>
								</View>
								<Text style={[s.cNum, s.td]}>{safeStr(page.depth)}</Text>
								<Text style={[s.cNum, s.td]}>{safeStr(page.buttonsCount)}</Text>
								<Text style={[s.cNum, s.td]}>{safeStr(page.formsCount)}</Text>
								<Text style={[s.cNum, s.td]}>
									{page.frictionScore != null
										? `${String(page.frictionScore)}/100`
										: "—"}
								</Text>
							</View>
						))}
					</View>
					<PageFooter hostname={hostname} section="Crawled Pages" />
				</Page>
			)}

			{/* ══════════════════════════════════════════════════════════════════
          PAGE — APPENDIX
      ══════════════════════════════════════════════════════════════════ */}
			<Page size="A4" style={s.page}>
				<PageRunHeader left="Appendix" right={hostname} />
				<ChapterBand
					title="Appendix"
					meta="Methodology, definitions & caveats"
				/>
				<View style={s.content}>
					<Text style={s.sectionHeading}>Scoring Methodology</Text>
					{[
						{
							title: "UX Score (0–100)",
							desc: "Weighted average across 10 categories: Navigation (×1.2), Content Clarity (×1.1), Trust Signals (×1.2), Conversion Clarity (×1.1), Accessibility (×1.0), Interaction Quality (×1.0), Performance (×0.9), Visual Hierarchy (×0.9), Error Prevention (×0.9), Consistency (×0.8).",
							color: C.brand,
						},
						{
							title: "Friction Score (0–100)",
							desc: "Calculated from: missing H1 (+10), slow TTFB (+10), slow load (+10), inputs without labels (+5 each), images without alt text (+2 each), missing primary CTA (+5). Higher = more friction.",
							color: C.danger,
						},
						{
							title: "Adoption Likelihood (%)",
							desc: "Each persona evaluates whether they would adopt or recommend the product, influenced by goals, frustrations, technical level, and observed UX evidence.",
							color: C.success,
						},
						{
							title: "Conversion Risk (%)",
							desc: "Estimated from friction score and adoption likelihood divergence. High friction + low adoption = high conversion risk.",
							color: C.warning,
						},
					].map((m) => (
						<View wrap={false} key={m.title} style={s.appendixItem}>
							<View style={{ ...s.appendixStripe, backgroundColor: m.color }} />
							<View style={s.appendixContent}>
								<Text style={{ ...s.cardTitle, color: m.color }}>
									{m.title}
								</Text>
								<Text style={s.cardBody}>{m.desc}</Text>
							</View>
						</View>
					))}

					<Text style={{ ...s.sectionHeading, marginTop: 12 }}>
						Confidence Definitions
					</Text>
					{[
						{
							label: "OBSERVED",
							desc: "Verified directly from crawled page data. Confidence capped based on page count.",
							color: C.success,
						},
						{
							label: "MEASURED",
							desc: "Calculated from numeric metrics (button counts, load times, word counts, etc.).",
							color: C.info,
						},
						{
							label: "INFERRED",
							desc: "Reasonable conclusion from multiple observed signals. Confidence ≤79%.",
							color: C.warning,
						},
						{
							label: "SPECULATIVE",
							desc: "Low-confidence assumption. Not supported by direct observation. Confidence ≤49%.",
							color: C.muted,
						},
					].map((e) => (
						<View wrap={false} key={e.label} style={s.appendixItem}>
							<View style={{ ...s.appendixStripe, backgroundColor: e.color }} />
							<View style={s.appendixContent}>
								<Text
									style={{
										fontSize: 8,
										fontFamily: "Helvetica-Bold",
										color: e.color,
										marginBottom: 2,
									}}
								>
									{e.label}
								</Text>
								<Text style={s.cardBody}>{e.desc}</Text>
							</View>
						</View>
					))}
					<View style={{ marginTop: 6, marginBottom: 12 }} wrap={false}>
						<Text style={{ ...s.sectionHeading, marginTop: 12 }}>
							Important Caveats
						</Text>
						<View
							wrap={false}
							style={{
								...s.cardBase,
								backgroundColor: C.warningLight,
								borderColor: "#FDE68A",
							}}
						>
							<Bullets
								items={[
									'"Not observed" ≠ "Does not exist". Pages not crawled may contain information not reflected here.',
									"All personas are synthetic AI agents. Findings are research hypotheses, not user testing results.",
									"Scores are relative to observed evidence. A 1-page crawl warrants reduced confidence.",
									"This report supplements — not replaces — real user research and accessibility testing.",
								]}
								color={C.warning}
							/>
						</View>
					</View>
				</View>
				<PageFooter hostname={hostname} section="Appendix" />
			</Page>
		</Document>
	);
}
