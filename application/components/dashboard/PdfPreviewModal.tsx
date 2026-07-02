"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Download, Eye, X, Loader2 } from "lucide-react";
import AnalysisPdfReport from "./AnalysisPdfReport";

const PDFViewer = dynamic(
	() => import("@react-pdf/renderer").then((m) => m.PDFViewer),
	{ ssr: false, loading: () => null },
);

const PDFDownloadLink = dynamic(
	() => import("@react-pdf/renderer").then((m) => m.PDFDownloadLink),
	{ ssr: false, loading: () => null },
);

interface Props {
	analysis: any;
	filename: string;
}

export function PdfPreviewModal({ analysis, filename }: Props) {
	const [open, setOpen] = useState(false);
	const [isClient, setIsClient] = useState(false);

	useEffect(() => {
		setIsClient(true);
	}, []);

	if (!isClient) return null;

	return (
		<>
			{/* ── Trigger button ──────────────────────────────────────────────────── */}
			<button
				onClick={() => setOpen(true)}
				className="no-print inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted"
			>
				<Eye className="h-4 w-4" />
				Preview & Export PDF
			</button>

			{/* ── Modal overlay ───────────────────────────────────────────────────── */}
			{open && (
				<div
					className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm p-4"
					onClick={(e) => {
						if (e.target === e.currentTarget) setOpen(false);
					}}
				>
					<div className="relative flex flex-col w-full max-w-4xl h-[90vh] rounded-2xl bg-background shadow-2xl overflow-hidden">
						{/* Header */}
						<div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
							<div>
								<p className="text-sm font-semibold text-foreground">
									PDF Preview
								</p>
								<p className="text-xs text-muted-foreground mt-0.5">
									Review the report below, then download.
								</p>
							</div>
							<div className="flex items-center gap-3">
								{/* Download button — header */}
								<PDFDownloadLink
									document={<AnalysisPdfReport analysis={analysis} />}
									fileName={`${filename}.pdf`}
								>
									{/* @ts-ignore */}
									{({ loading }) =>
										loading ? (
											<button
												disabled
												className="inline-flex items-center gap-2 rounded-lg bg-primary/60 px-4 py-2 text-sm font-medium text-primary-foreground cursor-not-allowed"
											>
												<Loader2 className="h-4 w-4 animate-spin" />
												Preparing…
											</button>
										) : (
											<button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90">
												<Download className="h-4 w-4" />
												Download PDF
											</button>
										)
									}
								</PDFDownloadLink>

								{/* Close */}
								<button
									onClick={() => setOpen(false)}
									className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
									aria-label="Close preview"
								>
									<X className="h-4 w-4" />
								</button>
							</div>
						</div>

						{/* PDF Viewer */}
						<div className="flex-1 overflow-hidden bg-muted/30">
							<PDFViewer
								width="100%"
								height="100%"
								showToolbar={false}
								style={{ border: "none" }}
							>
								<AnalysisPdfReport analysis={analysis} />
							</PDFViewer>
						</div>

						{/* Footer download bar */}
						<div className="flex items-center justify-between px-6 py-3 border-t border-border bg-card shrink-0">
							<p className="text-xs text-muted-foreground">
								Scroll through the preview above to check all pages before
								downloading.
							</p>
							<PDFDownloadLink
								document={<AnalysisPdfReport analysis={analysis} />}
								fileName={`${filename}.pdf`}
							>
								{/* @ts-ignore */}
								{({ loading }) =>
									loading ? (
										<button
											disabled
											className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground cursor-not-allowed"
										>
											<Loader2 className="h-4 w-4 animate-spin" />
											Preparing PDF…
										</button>
									) : (
										<button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted">
											<Download className="h-4 w-4" />
											Download PDF
										</button>
									)
								}
							</PDFDownloadLink>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
