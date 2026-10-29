import { useEffect, useState } from "react";
import { Download, ExternalLink, Loader2, Maximize2, Minimize2, X, ZoomIn, ZoomOut } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui";
import type { AdminCertification } from "@/types";

interface DocumentPreviewModalProps {
  certification: AdminCertification | null;
  onClose: () => void;
}

const ZOOM_LEVELS = [50, 75, 100, 125, 150, 200] as const;
type ZoomLevel = (typeof ZOOM_LEVELS)[number];

const ZOOM_CLASSES: Record<ZoomLevel, string> = {
  50: "zoom-level-50",
  75: "zoom-level-75",
  100: "zoom-level-100",
  125: "zoom-level-125",
  150: "zoom-level-150",
  200: "zoom-level-200",
};

export function DocumentPreviewModal({ certification, onClose }: DocumentPreviewModalProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState<ZoomLevel>(100);
  const [fitWidth, setFitWidth] = useState(false);

  useEffect(() => {
    if (!certification || !certification.has_file) {
      setBlobUrl(null);
      setError(null);
      return;
    }

    let active = true;
    let createdUrl: string | null = null;

    setLoading(true);
    setError(null);
    setZoom(100);

    api
      .blob(`/admin/certifications/${certification.id}/file`)
      .then((blob) => {
        if (!active) return;
        createdUrl = URL.createObjectURL(blob);
        setBlobUrl(createdUrl);
      })
      .catch((err: Error) => {
        if (!active) return;
        setError(err.message || "Failed to load document preview");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [certification]);

  if (!certification) return null;

  const isPdf = certification.file_mime === "application/pdf" || (!certification.file_mime && blobUrl?.includes("pdf"));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="preview-title">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative flex flex-col w-full max-w-4xl h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h3 id="preview-title" className="text-base font-bold text-slate-900">
              Evidence Document: {certification.title}
            </h3>
            <p className="text-xs text-slate-500">
              Student: {certification.student_name}
              {certification.student_register_number ? ` (${certification.student_register_number})` : ""}
              {certification.student_department ? ` · ${certification.student_department}` : ""}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!isPdf && (
              <div className="hidden sm:flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 text-xs">
                <button
                  onClick={() => {
                    const currentIndex = ZOOM_LEVELS.indexOf(zoom);
                    if (currentIndex > 0) {
                      const nextZoom = ZOOM_LEVELS[currentIndex - 1];
                      if (nextZoom) setZoom(nextZoom);
                    }
                  }}
                  className="p-1 rounded hover:bg-slate-100 text-slate-600 disabled:opacity-40"
                  aria-label="Zoom out"
                  disabled={zoom === ZOOM_LEVELS[0]}
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="px-2 font-mono text-[11px]">{zoom}%</span>
                <button
                  onClick={() => {
                    const currentIndex = ZOOM_LEVELS.indexOf(zoom);
                    if (currentIndex < ZOOM_LEVELS.length - 1) {
                      const nextZoom = ZOOM_LEVELS[currentIndex + 1];
                      if (nextZoom) setZoom(nextZoom);
                    }
                  }}
                  className="p-1 rounded hover:bg-slate-100 text-slate-600 disabled:opacity-40"
                  aria-label="Zoom in"
                  disabled={zoom === ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setFitWidth((f) => !f)}
                  className="p-1 rounded hover:bg-slate-100 text-slate-600 ml-1 border-l border-slate-200"
                  aria-label={fitWidth ? "Actual size" : "Fit width"}
                >
                  {fitWidth ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
              </div>
            )}

            <Button
              variant="secondary"
              onClick={() =>
                api.download(
                  `/admin/certifications/${certification.id}/file`,
                  `certificate-${certification.id.slice(0, 8)}`
                )
              }
            >
              <Download className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Download</span>
            </Button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
              aria-label="Close document preview"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Viewer Body */}
        <div className="flex-1 overflow-auto bg-slate-100/70 p-4 flex items-center justify-center">
          {loading && (
            <div className="flex flex-col items-center gap-3 text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <p className="text-sm">Retrieving secure certificate document...</p>
            </div>
          )}

          {error && (
            <div className="max-w-md p-6 bg-white rounded-xl border border-red-200 text-center space-y-3 shadow-sm">
              <p className="text-sm font-semibold text-red-600">Document Could Not Be Displayed</p>
              <p className="text-xs text-slate-600">{error}</p>
              <Button
                variant="secondary"
                onClick={() =>
                  api.download(
                    `/admin/certifications/${certification.id}/file`,
                    `certificate-${certification.id.slice(0, 8)}`
                  )
                }
              >
                Try Direct Download
              </Button>
            </div>
          )}

          {!loading && !error && blobUrl && (
            <>
              {isPdf ? (
                <iframe
                  src={blobUrl}
                  title="PDF Certificate Document Preview"
                  className="w-full h-full rounded-lg border border-slate-300 bg-white shadow-sm"
                />
              ) : (
                <div className="max-w-full max-h-full overflow-auto flex items-center justify-center p-2">
                  <img
                    src={blobUrl}
                    alt={`Certificate submitted by ${certification.student_name}`}
                    className={`rounded-lg border border-slate-300 shadow-md transition-transform duration-150 ${ZOOM_CLASSES[zoom]} ${
                      fitWidth ? "w-full object-contain" : "max-h-[75vh] object-contain"
                    }`}
                  />
                </div>
              )}
            </>
          )}

          {!loading && !error && !blobUrl && !certification.has_file && (
            <p className="text-sm text-slate-500">No document was attached to this certificate submission.</p>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between text-xs text-slate-500">
          <div>
            Issued by <strong className="text-slate-800">{certification.issuer}</strong> on {certification.issue_date}
            {certification.file_size ? ` · File size: ${Math.round(certification.file_size / 1024)} KB` : ""}
          </div>
          {certification.credential_url && (
            <a
              href={certification.credential_url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-indigo-600 font-semibold inline-flex items-center gap-1 hover:underline"
            >
              <span>External Credential Link</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
