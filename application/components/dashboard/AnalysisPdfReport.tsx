import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// Register fonts if needed, otherwise fallback to Helvetica.
// We'll use standard Helvetica for reliability.

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },
  // Typography
  title: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
    color: "#111827",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 40,
  },
  heading1: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    marginTop: 24,
    marginBottom: 16,
    color: "#111827",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingBottom: 8,
  },
  heading2: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    marginTop: 16,
    marginBottom: 12,
    color: "#1F2937",
  },
  bodyText: {
    fontSize: 11,
    lineHeight: 1.6,
    color: "#4B5563",
    marginBottom: 12,
  },
  // Layout utilities
  flexRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  flexCol: {
    flexDirection: "column",
  },
  spaceBetween: {
    justifyContent: "space-between",
  },
  // Cover Page
  coverPage: {
    padding: 50,
    justifyContent: "center",
    height: "100%",
  },
  coverLabel: {
    fontSize: 12,
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 12,
    fontFamily: "Helvetica-Bold",
  },
  coverTitle: {
    fontSize: 36,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    marginBottom: 16,
  },
  coverUrl: {
    fontSize: 14,
    color: "#4B5563",
    marginBottom: 60,
  },
  coverGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 30,
    marginTop: 40,
  },
  coverGridItem: {
    width: "50%",
    marginBottom: 24,
  },
  coverGridLabel: {
    fontSize: 10,
    color: "#6B7280",
    textTransform: "uppercase",
    marginBottom: 4,
    fontFamily: "Helvetica-Bold",
  },
  coverGridValue: {
    fontSize: 14,
    color: "#111827",
    fontFamily: "Helvetica-Bold",
  },
  coverFooter: {
    position: "absolute",
    bottom: 50,
    left: 50,
    fontSize: 10,
    color: "#9CA3AF",
  },
  // Cards & Sections
  card: {
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 16,
  },
  summaryItem: {
    backgroundColor: "#F3F4F6",
    padding: 12,
    borderRadius: 6,
    flex: 1,
  },
  summaryLabel: {
    fontSize: 10,
    color: "#6B7280",
    textTransform: "uppercase",
    marginBottom: 4,
    fontFamily: "Helvetica-Bold",
  },
  summaryValue: {
    fontSize: 16,
    color: "#111827",
    fontFamily: "Helvetica-Bold",
  },
  // Persona Blocks
  personaHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  personaAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  personaAvatarText: {
    color: "#4F46E5",
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
  },
  personaName: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
  },
  personaMeta: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  quoteBlock: {
    borderLeftWidth: 3,
    borderLeftColor: "#4F46E5",
    paddingLeft: 12,
    marginBottom: 16,
  },
  quoteText: {
    fontSize: 12,
    fontStyle: "italic",
    color: "#4B5563",
    lineHeight: 1.5,
  },
  bulletList: {
    marginBottom: 16,
  },
  bulletItem: {
    flexDirection: "row",
    marginBottom: 6,
  },
  bulletPoint: {
    width: 12,
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
  },
  bulletText: {
    fontSize: 11,
    color: "#4B5563",
    lineHeight: 1.4,
    flex: 1,
  },
  // Two column layout for pos/neg
  twoCol: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  col: {
    flex: 1,
  },
  positivesTitle: {
    fontSize: 11,
    color: "#059669",
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  negativesTitle: {
    fontSize: 11,
    color: "#DC2626",
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  recsTitle: {
    fontSize: 11,
    color: "#4F46E5",
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  // Table
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#D1D5DB",
    paddingBottom: 8,
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingVertical: 8,
  },
  colUrl: { flex: 2, paddingRight: 8 },
  colDepth: { flex: 0.5 },
  colForms: { flex: 0.5 },
  colFriction: { flex: 0.5 },
  tableCellHeader: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#6B7280",
  },
  tableCell: {
    fontSize: 10,
    color: "#4B5563",
  },
});

/** Safely parse a JSON-stringified array from the DB */
function parseList(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch {
    return value.trim() ? [value] : [];
  }
}

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
    <Document>
      {/* 1. COVER PAGE */}
      <Page size="A4" style={styles.coverPage}>
        <Text style={styles.coverLabel}>Synthetic User Research Report</Text>
        <Text style={styles.coverTitle}>{hostname}</Text>
        <Text style={styles.coverUrl}>{analysis.url}</Text>

        <View style={styles.coverGrid}>
          <View style={styles.coverGridItem}>
            <Text style={styles.coverGridLabel}>Date</Text>
            <Text style={styles.coverGridValue}>{dateStr}</Text>
          </View>
          <View style={styles.coverGridItem}>
            <Text style={styles.coverGridLabel}>Device Profile</Text>
            <Text style={styles.coverGridValue}>
              {analysis.deviceType === "MOBILE" ? "Mobile" : "Desktop"}
            </Text>
          </View>
          <View style={styles.coverGridItem}>
            <Text style={styles.coverGridLabel}>Scope</Text>
            <Text style={styles.coverGridValue}>
              {analysis.pages.length} Pages
            </Text>
          </View>
          <View style={styles.coverGridItem}>
            <Text style={styles.coverGridLabel}>Personas Evaluated</Text>
            <Text style={styles.coverGridValue}>
              {analysis.personas.length} Archetypes
            </Text>
          </View>
        </View>

        <Text style={styles.coverFooter}>Generated by PersonaForge AI</Text>
      </Page>

      {/* 2. EXECUTIVE SUMMARY */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.heading1}>Executive Summary</Text>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Sentiment</Text>
            <Text style={styles.summaryValue}>{analysis.overallSentiment}</Text>
          </View>
          {analysis.overallFrictionScore != null && (
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Friction Score</Text>
              <Text style={styles.summaryValue}>
                {analysis.overallFrictionScore} / 100
              </Text>
            </View>
          )}
        </View>

        {analysis.summary && (
          <View style={{ marginBottom: 24 }}>
            <Text style={styles.heading2}>Key Findings</Text>
            <Text style={styles.bodyText}>{analysis.summary}</Text>
          </View>
        )}

        {analysis.focusGroup && (
          <View style={styles.card}>
            <Text style={styles.heading2}>Focus Group Insight</Text>
            <Text style={styles.bodyText}>{analysis.focusGroup.summary}</Text>

            {Array.isArray(
              (analysis.focusGroup.conflicts as any)?.items
            ) && (
              <View style={{ marginTop: 12 }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: "Helvetica-Bold",
                    marginBottom: 8,
                    color: "#111827",
                  }}
                >
                  Areas of Friction & Conflict
                </Text>
                {(analysis.focusGroup.conflicts as any).items.map(
                  (c: any, i: number) => (
                    <View
                      key={i}
                      style={{
                        backgroundColor: "#ffffff",
                        padding: 8,
                        borderRadius: 4,
                        marginBottom: 6,
                        borderWidth: 1,
                        borderColor: "#E5E7EB",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          fontFamily: "Helvetica-Bold",
                          color: "#111827",
                          marginBottom: 2,
                        }}
                      >
                        {c.topic}
                      </Text>
                      <Text style={{ fontSize: 10, color: "#4B5563" }}>
                        {c.reason}
                      </Text>
                    </View>
                  )
                )}
              </View>
            )}
          </View>
        )}
      </Page>

      {/* 3. PERSONA EVALUATIONS */}
      {analysis.personas.length > 0 && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.heading1}>Detailed Persona Evaluations</Text>

          {analysis.personas.map((persona: any, index: number) => {
            const positives = parseList(persona.positives);
            const painPoints = parseList(persona.painPoints);
            const recommendations = parseList(persona.recommendations);

            return (
              <View
                key={persona.id}
                wrap={false}
                style={{
                  marginBottom: 30,
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  padding: 20,
                  borderRadius: 8,
                }}
              >
                <View style={styles.personaHeader}>
                  <View style={styles.personaAvatar}>
                    <Text style={styles.personaAvatarText}>
                      {persona.label.charAt(0)}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.personaName}>{persona.label}</Text>
                    <Text style={styles.personaMeta}>
                      {persona.name} • {persona.age}y • {persona.occupation}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ fontSize: 12, fontFamily: "Helvetica-Bold" }}>
                      {persona.sentiment}
                    </Text>
                    {persona.adoptionLikelihood != null && (
                      <Text style={{ fontSize: 10, color: "#6B7280" }}>
                        {persona.adoptionLikelihood}% Adoption
                      </Text>
                    )}
                  </View>
                </View>

                {persona.frictionScore != null && (
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 10, color: "#6B7280", marginBottom: 4 }}>
                      Friction Score: {persona.frictionScore} / 100
                    </Text>
                    <View
                      style={{
                        height: 6,
                        backgroundColor: "#E5E7EB",
                        borderRadius: 3,
                        overflow: "hidden",
                      }}
                    >
                      <View
                        style={{
                          height: "100%",
                          width: `${persona.frictionScore}%`,
                          backgroundColor: "#4F46E5",
                        }}
                      />
                    </View>
                  </View>
                )}

                {persona.firstImpressions && (
                  <View style={styles.quoteBlock}>
                    <Text
                      style={{
                        fontSize: 9,
                        color: "#6B7280",
                        textTransform: "uppercase",
                        marginBottom: 4,
                      }}
                    >
                      First Impression
                    </Text>
                    <Text style={styles.quoteText}>
                      "{persona.firstImpressions}"
                    </Text>
                  </View>
                )}

                <View style={styles.twoCol}>
                  <View style={styles.col}>
                    <Text style={styles.positivesTitle}>✓ Positives</Text>
                    <View style={styles.bulletList}>
                      {positives.map((item, i) => (
                        <View key={i} style={styles.bulletItem}>
                          <Text style={{ ...styles.bulletPoint, color: "#059669" }}>
                            •
                          </Text>
                          <Text style={styles.bulletText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.negativesTitle}>✗ Pain Points</Text>
                    <View style={styles.bulletList}>
                      {painPoints.map((item, i) => (
                        <View key={i} style={styles.bulletItem}>
                          <Text style={{ ...styles.bulletPoint, color: "#DC2626" }}>
                            •
                          </Text>
                          <Text style={styles.bulletText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>

                {recommendations.length > 0 && (
                  <View>
                    <Text style={styles.recsTitle}>→ Recommendations</Text>
                    <View style={styles.bulletList}>
                      {recommendations.map((item, i) => (
                        <View key={i} style={styles.bulletItem}>
                          <Text style={{ ...styles.bulletPoint, color: "#4F46E5" }}>
                            •
                          </Text>
                          <Text style={styles.bulletText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </Page>
      )}

      {/* 4. CRAWLED PAGES TABLE */}
      {analysis.pages.length > 0 && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.heading1}>Crawled Pages</Text>

          <View style={styles.tableHeader}>
            <Text style={[styles.colUrl, styles.tableCellHeader]}>URL / TITLE</Text>
            <Text style={[styles.colDepth, styles.tableCellHeader]}>DEPTH</Text>
            <Text style={[styles.colForms, styles.tableCellHeader]}>FORMS</Text>
            <Text style={[styles.colFriction, styles.tableCellHeader]}>FRICTION</Text>
          </View>

          {analysis.pages.map((page: any) => (
            <View key={page.id} style={styles.tableRow} wrap={false}>
              <View style={styles.colUrl}>
                <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: "#111827", marginBottom: 2 }}>
                  {page.title || "No Title"}
                </Text>
                <Text style={{ fontSize: 9, color: "#6B7280" }}>
                  {page.url}
                </Text>
              </View>
              <View style={styles.colDepth}>
                <Text style={styles.tableCell}>{page.depth}</Text>
              </View>
              <View style={styles.colForms}>
                <Text style={styles.tableCell}>{page.formsCount}</Text>
              </View>
              <View style={styles.colFriction}>
                <Text style={styles.tableCell}>
                  {page.frictionScore != null ? `${page.frictionScore}/100` : "—"}
                </Text>
              </View>
            </View>
          ))}
        </Page>
      )}
    </Document>
  );
}
