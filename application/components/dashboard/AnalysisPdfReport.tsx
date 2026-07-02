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
	g900: "#111827",
	g700: "#374151",
	g500: "#6B7280",
	g300: "#D1D5DB",
	g100: "#F3F4F6",
	g50: "#F9FAFB",
	white: "#FFFFFF",
};

// ─── Styles ───────────────────────────────────────────────────────────────────
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
	coverPage: {
		fontFamily: "Helvetica",
		backgroundColor: C.white,
	},

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
	coverTitle: {
		fontSize: 28,
		fontFamily: "Helvetica-Bold",
		color: C.g900,
		lineHeight: 1.2,
		marginBottom: 6,
	},
	coverUrl: { fontSize: 10, color: C.g500, marginBottom: 36 },
	coverDivider: { height: 1, backgroundColor: C.g300, marginBottom: 24 },
	coverGrid: { flexDirection: "row", flexWrap: "wrap" },
	coverCell: { width: "50%", marginBottom: 18 },
	coverCellLabel: {
		fontSize: 8,
		fontFamily: "Helvetica-Bold",
		textTransform: "uppercase",
		letterSpacing: 1,
		color: C.g500,
		marginBottom: 3,
	},
	coverCellValue: {
		fontSize: 13,
		fontFamily: "Helvetica-Bold",
		color: C.g900,
	},
	coverNote: { fontSize: 8, color: C.g500, marginTop: 40 },

	// Running head
	rhead: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 20,
		paddingBottom: 8,
		borderBottomWidth: 1,
		borderBottomColor: C.g300,
	},
	rheadL: {
		fontSize: 8,
		fontFamily: "Helvetica-Bold",
		textTransform: "uppercase",
		letterSpacing: 1,
		color: C.accent,
	},
	rheadR: { fontSize: 8, color: C.g500 },

	// Section title
	sectionTitle: {
		fontSize: 14,
		fontFamily: "Helvetica-Bold",
		color: C.g900,
		marginBottom: 3,
	},
	titleRule: {
		height: 2,
		width: 32,
		backgroundColor: C.accent,
		borderRadius: 1,
		marginBottom: 14,
	},

	// Stat cards
	statRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
	statCard: {
		flex: 1,
		backgroundColor: C.accentSoft,
		borderRadius: 6,
		padding: 10,
		borderLeftWidth: 3,
		borderLeftColor: C.accent,
	},
	statLabel: {
		fontSize: 7,
		fontFamily: "Helvetica-Bold",
		textTransform: "uppercase",
		letterSpacing: 1,
		color: C.accent,
		marginBottom: 3,
	},
	statValue: {
		fontSize: 15,
		fontFamily: "Helvetica-Bold",
		color: C.g900,
	},

	// Generic card
	card: {
		backgroundColor: C.g50,
		borderRadius: 6,
		padding: 12,
		marginBottom: 12,
		borderWidth: 1,
		borderColor: C.g300,
	},
	cardTitle: {
		fontSize: 9,
		fontFamily: "Helvetica-Bold",
		color: C.g900,
		marginBottom: 5,
	},
	body: { fontSize: 9.5, color: C.g700, lineHeight: 1.55, marginBottom: 8 },

	// Persona card
	pCard: {
		borderWidth: 1,
		borderColor: C.g300,
		borderRadius: 8,
		overflow: "hidden",
	},
	pAccent: { height: 3, backgroundColor: C.accent },
	pBody: { padding: 14 },

	// Persona header row
	pHeadRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 10,
		paddingBottom: 10,
		borderBottomWidth: 1,
		borderBottomColor: C.g300,
	},
	pAvatar: {
		width: 34,
		height: 34,
		borderRadius: 17,
		backgroundColor: C.accentSoft,
		justifyContent: "center",
		alignItems: "center",
		marginRight: 10,
	},
	pAvatarTxt: { fontSize: 15, fontFamily: "Helvetica-Bold", color: C.accent },
	pName: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.g900 },
	pMeta: { fontSize: 8.5, color: C.g500, marginTop: 1 },

	// Badge inline
	badge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10 },

	// Friction bar
	fTrack: {
		height: 5,
		backgroundColor: C.g100,
		borderRadius: 3,
		overflow: "hidden",
		marginTop: 3,
		marginBottom: 10,
	},

	// Quote
	quote: {
		borderLeftWidth: 3,
		borderLeftColor: C.accent,
		paddingLeft: 10,
		paddingVertical: 4,
		marginBottom: 10,
		backgroundColor: C.accentSoft,
		borderRadius: 3,
	},
	quoteLabel: {
		fontSize: 7,
		fontFamily: "Helvetica-Bold",
		textTransform: "uppercase",
		letterSpacing: 1,
		color: C.accent,
		marginBottom: 3,
	},
	quoteTxt: {
		fontSize: 9,
		fontStyle: "italic",
		color: C.g700,
		lineHeight: 1.45,
	},

	// Two-col
	twoCol: { flexDirection: "row", gap: 10, marginBottom: 10 },
	col: { flex: 1 },
	colHead: {
		fontSize: 7.5,
		fontFamily: "Helvetica-Bold",
		textTransform: "uppercase",
		letterSpacing: 0.8,
		marginBottom: 5,
	},
	bullet: { flexDirection: "row", marginBottom: 3.5, alignItems: "flex-start" },
	bulletDot: { width: 11, fontSize: 9, lineHeight: 1.4 },
	bulletTxt: { fontSize: 8.5, color: C.g700, lineHeight: 1.4, flex: 1 },

	// Recs
	recsBox: {
		backgroundColor: C.accentSoft,
		borderRadius: 5,
		padding: 9,
		marginTop: 2,
	},
	recsHead: {
		fontSize: 7.5,
		fontFamily: "Helvetica-Bold",
		textTransform: "uppercase",
		letterSpacing: 0.8,
		color: C.accent,
		marginBottom: 5,
	},

	// Accessibility
	a11yBox: {
		borderWidth: 1,
		borderColor: C.amber,
		backgroundColor: C.amberSoft,
		borderRadius: 5,
		padding: 9,
		marginTop: 8,
	},

	// Table
	tHead: {
		flexDirection: "row",
		backgroundColor: C.g100,
		paddingVertical: 6,
		paddingHorizontal: 8,
		borderRadius: 3,
		marginBottom: 2,
	},
	tRow: {
		flexDirection: "row",
		paddingVertical: 5,
		paddingHorizontal: 8,
		borderBottomWidth: 1,
		borderBottomColor: C.g100,
	},
	tRowAlt: { backgroundColor: C.g50 },
	cUrl: { flex: 2.5, paddingRight: 6 },
	cNum: { flex: 0.6 },
	th: {
		fontSize: 7.5,
		fontFamily: "Helvetica-Bold",
		textTransform: "uppercase",
		letterSpacing: 0.6,
		color: C.g500,
	},
	td: { fontSize: 9, color: C.g700 },
	tdBold: {
		fontSize: 9,
		fontFamily: "Helvetica-Bold",
		color: C.g900,
		marginBottom: 1,
	},
	tdSmall: { fontSize: 8, color: C.g500 },

	// Footer
	footer: {
		position: "absolute",
		bottom: 18,
		left: 44,
		right: 44,
		flexDirection: "row",
		justifyContent: "space-between",
	},
	footerTxt: { fontSize: 7, color: C.g500 },
	footerDot: {
		width: 3,
		height: 3,
		borderRadius: 2,
		backgroundColor: C.accent,
		marginTop: 2,
	},

	// Conflict item
	conflictItem: {
		backgroundColor: C.white,
		borderRadius: 4,
		padding: 8,
		marginBottom: 5,
		borderWidth: 1,
		borderColor: C.g300,
	},
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

function sentimentColor(v: string | null | undefined) {
	const u = (v ?? "").toUpperCase();
	return u === "POSITIVE" ? C.green : u === "NEGATIVE" ? C.red : C.amber;
}
function sentimentBg(v: string | null | undefined) {
	const u = (v ?? "").toUpperCase();
	return u === "POSITIVE"
		? C.greenSoft
		: u === "NEGATIVE"
			? C.redSoft
			: C.amberSoft;
}
function frictionColor(n: number) {
	return n > 66 ? C.red : n > 33 ? C.amber : C.green;
}

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

// ─── Component ────────────────────────────────────────────────────────────────
export default function AnalysisPdfReport({ analysis }: { analysis: any }) {
	const hostname = (() => {
		try {
			return new URL(analysis.url).hostname;
		} catch {
			return analysis.url;
		}
	})();

	const dateStr = analysis.startedAt
		? new Date(analysis.startedAt).toLocaleDateString("en-US", {
				year: "numeric",
				month: "long",
				day: "numeric",
			})
		: "—";

	return (
		<Document
			title={`PersonaForge — ${hostname}`}
			author="PersonaForge AI"
			subject="Synthetic UX Research Report"
		>
			{/* ── PAGE 1: COVER ────────────────────────────────────────────────────── */}
			<Page size="A4" style={s.coverPage}>
				<View style={s.coverBand} />
				<View style={s.coverBody}>
					<Text style={s.eyebrow}>Synthetic User Research Report</Text>
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
							<Text style={s.coverCellValue}>
								{analysis.deviceType === "MOBILE" ? "Mobile" : "Desktop"}
							</Text>
						</View>
						<View style={s.coverCell}>
							<Text style={s.coverCellLabel}>Pages Crawled</Text>
							<Text style={s.coverCellValue}>{analysis.pages.length}</Text>
						</View>
						<View style={s.coverCell}>
							<Text style={s.coverCellLabel}>Personas Evaluated</Text>
							<Text style={s.coverCellValue}>{analysis.personas.length}</Text>
						</View>
						{analysis.overallSentiment && (
							<View style={s.coverCell}>
								<Text style={s.coverCellLabel}>Overall Sentiment</Text>
								<Text
									style={{
										...s.coverCellValue,
										color: sentimentColor(analysis.overallSentiment),
									}}
								>
									{analysis.overallSentiment}
								</Text>
							</View>
						)}
						{analysis.overallFrictionScore != null && (
							<View style={s.coverCell}>
								<Text style={s.coverCellLabel}>Friction Score</Text>
								<Text style={s.coverCellValue}>
									{analysis.overallFrictionScore}
									<Text
										style={{
											fontSize: 9,
											fontFamily: "Helvetica",
											color: C.g500,
										}}
									>
										{" "}
										/ 100
									</Text>
								</Text>
							</View>
						)}
					</View>
					<Text style={s.coverNote}>
						Generated by PersonaForge AI · Confidential — for internal use only
					</Text>
				</View>
			</Page>

			{/* ── PAGE 2: EXECUTIVE SUMMARY ────────────────────────────────────────── */}
			<Page size="A4" style={s.page}>
				<RHead left="Executive Summary" right={hostname} />

				<Text style={s.sectionTitle}>Executive Summary</Text>
				<View style={s.titleRule} />

				{/* Stat strip */}
				<View style={s.statRow}>
					{analysis.overallSentiment && (
						<View style={s.statCard}>
							<Text style={s.statLabel}>Overall Sentiment</Text>
							<Text
								style={{
									...s.statValue,
									color: sentimentColor(analysis.overallSentiment),
								}}
							>
								{analysis.overallSentiment}
							</Text>
						</View>
					)}
					{analysis.overallFrictionScore != null && (
						<View style={s.statCard}>
							<Text style={s.statLabel}>Friction Score</Text>
							<Text style={s.statValue}>
								{analysis.overallFrictionScore}
								<Text
									style={{
										fontSize: 9,
										fontFamily: "Helvetica",
										color: C.g500,
									}}
								>
									{" "}
									/ 100
								</Text>
							</Text>
						</View>
					)}
					<View style={s.statCard}>
						<Text style={s.statLabel}>Personas Tested</Text>
						<Text style={s.statValue}>{analysis.personas.length}</Text>
					</View>
					<View style={s.statCard}>
						<Text style={s.statLabel}>Pages Analysed</Text>
						<Text style={s.statValue}>{analysis.pages.length}</Text>
					</View>
				</View>

				{/* Summary */}
				{analysis.summary && (
					<View style={{ marginBottom: 12 }}>
						<Text style={{ ...s.cardTitle, fontSize: 10, marginBottom: 5 }}>
							Key Findings
						</Text>
						<Text style={s.body}>{analysis.summary}</Text>
					</View>
				)}

				{/* Focus group */}
				{analysis.focusGroup && (
					<View style={s.card}>
						<Text style={s.cardTitle}>Focus Group Insight</Text>
						<Text style={s.body}>{analysis.focusGroup.summary}</Text>

						{Array.isArray((analysis.focusGroup.conflicts as any)?.items) && (
							<View style={{ marginTop: 6 }}>
								<Text style={{ ...s.colHead, color: C.red, marginBottom: 6 }}>
									Areas of Friction & Conflict
								</Text>
								{(analysis.focusGroup.conflicts as any).items.map(
									(c: any, i: number) => (
										<View key={i} style={s.conflictItem}>
											<Text
												style={{
													fontSize: 8.5,
													fontFamily: "Helvetica-Bold",
													color: C.g900,
													marginBottom: 2,
												}}
											>
												{c.topic}
											</Text>
											<Text
												style={{
													fontSize: 8.5,
													color: C.g500,
													lineHeight: 1.4,
												}}
											>
												{c.reason}
											</Text>
										</View>
									),
								)}
							</View>
						)}
					</View>
				)}

				<Footer hostname={hostname} section="Executive Summary" />
			</Page>

			{/* ── PAGE PER PERSONA ─────────────────────────────────────────────────── */}
			{analysis.personas.map((persona: any, idx: number) => {
				const positives = parseList(persona.positives);
				const painPoints = parseList(persona.painPoints);
				const recommendations = parseList(persona.recommendations);

				return (
					<Page key={persona.id} size="A4" style={s.page}>
						<RHead
							left={`Persona ${idx + 1} of ${analysis.personas.length}`}
							right={hostname}
						/>

						<View style={s.pCard}>
							<View style={s.pAccent} />
							<View style={s.pBody}>
								{/* Header row */}
								<View style={s.pHeadRow}>
									<View style={s.pAvatar}>
										<Text style={s.pAvatarTxt}>{persona.label.charAt(0)}</Text>
									</View>
									<View style={{ flex: 1 }}>
										<Text style={s.pName}>{persona.label}</Text>
										<Text style={s.pMeta}>
											{persona.name} · {persona.age} yrs · {persona.occupation}
										</Text>
									</View>
									<View style={{ alignItems: "flex-end" }}>
										<View
											style={{
												...s.badge,
												backgroundColor: sentimentBg(persona.sentiment),
											}}
										>
											<Text
												style={{
													fontSize: 8.5,
													fontFamily: "Helvetica-Bold",
													color: sentimentColor(persona.sentiment),
												}}
											>
												{persona.sentiment ?? "Neutral"}
											</Text>
										</View>
										{persona.adoptionLikelihood != null && (
											<Text
												style={{ fontSize: 8, color: C.g500, marginTop: 3 }}
											>
												{persona.adoptionLikelihood}% adoption likelihood
											</Text>
										)}
									</View>
								</View>

								{/* Friction bar */}
								{persona.frictionScore != null && (
									<View style={{ marginBottom: 10 }}>
										<Text
											style={{ fontSize: 7.5, color: C.g500, marginBottom: 2 }}
										>
											Friction Score — {persona.frictionScore} / 100
										</Text>
										<View style={s.fTrack}>
											<View
												style={{
													height: "100%",
													width: `${persona.frictionScore}%`,
													backgroundColor: frictionColor(persona.frictionScore),
													borderRadius: 3,
												}}
											/>
										</View>
									</View>
								)}

								{/* First impression */}
								{persona.firstImpressions && (
									<View style={s.quote}>
										<Text style={s.quoteLabel}>First Impression</Text>
										<Text style={s.quoteTxt}>"{persona.firstImpressions}"</Text>
									</View>
								)}

								{/* Positives + Pain points */}
								<View style={s.twoCol}>
									{positives.length > 0 && (
										<View style={s.col}>
											<Text style={{ ...s.colHead, color: C.green }}>
												✓ Positives
											</Text>
											<Bullets items={positives} color={C.green} />
										</View>
									)}
									{painPoints.length > 0 && (
										<View style={s.col}>
											<Text style={{ ...s.colHead, color: C.red }}>
												✗ Pain Points
											</Text>
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
									<View style={s.a11yBox}>
										<Text style={{ ...s.recsHead, color: C.amber }}>
											⚠ Accessibility Notes
										</Text>
										<Text style={{ ...s.body, marginBottom: 0 }}>
											{persona.accessibilityNotes}
										</Text>
									</View>
								)}
							</View>
						</View>

						<Footer
							hostname={hostname}
							section={`Persona — ${persona.label}`}
						/>
					</Page>
				);
			})}

			{/* ── LAST PAGE: CRAWLED PAGES TABLE ───────────────────────────────────── */}
			{analysis.pages.length > 0 && (
				<Page size="A4" style={s.page}>
					<RHead left="Crawled Pages" right={hostname} />

					<Text style={s.sectionTitle}>Crawled Pages</Text>
					<View style={s.titleRule} />

					<View style={s.tHead}>
						<Text style={[s.cUrl, s.th]}>URL / Title</Text>
						<Text style={[s.cNum, s.th]}>Depth</Text>
						<Text style={[s.cNum, s.th]}>Forms</Text>
						<Text style={[s.cNum, s.th]}>Friction</Text>
					</View>

					{analysis.pages.map((page: any, i: number) => (
						<View
							key={page.id}
							style={[s.tRow, i % 2 === 1 ? s.tRowAlt : {}]}
							wrap={false}
						>
							<View style={s.cUrl}>
								<Text style={s.tdBold}>{page.title || "No Title"}</Text>
								<Text style={s.tdSmall}>{page.url}</Text>
							</View>
							<Text style={[s.cNum, s.td]}>{page.depth}</Text>
							<Text style={[s.cNum, s.td]}>{page.formsCount}</Text>
							<Text style={[s.cNum, s.td]}>
								{page.frictionScore != null
									? `${page.frictionScore} / 100`
									: "—"}
							</Text>
						</View>
					))}

					<Footer hostname={hostname} section="Crawled Pages" />
				</Page>
			)}
		</Document>
	);
}
