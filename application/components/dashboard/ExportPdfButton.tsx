"use client";

import { Download } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// Dynamically import the PDF Download link to avoid SSR issues with Node canvas/font APIs
const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
  {
    ssr: false,
    loading: () => (
      <button disabled className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm opacity-70">
        <Download className="h-4 w-4 animate-pulse" />
        Preparing PDF...
      </button>
    ),
  }
);

import AnalysisPdfReport from "./AnalysisPdfReport";

export function ExportPdfButton({ analysis, filename }: { analysis: any; filename: string }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return (
    <PDFDownloadLink
      document={<AnalysisPdfReport analysis={analysis} />}
      fileName={filename + ".pdf"}
      className="no-print inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted"
    >
      {/* @ts-ignore */}
      {({ blob, url, loading, error }) =>
        loading ? (
          <>
            <Download className="h-4 w-4 animate-pulse text-muted-foreground" />
            <span className="text-muted-foreground">Preparing...</span>
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            Export PDF
          </>
        )
      }
    </PDFDownloadLink>
  );
}
