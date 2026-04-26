"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import toast from "react-hot-toast";
import { Maximize, Minimize, ChevronLeft, ChevronRight } from "lucide-react";

// Set worker for PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface SecureDocumentViewerProps {
  documentUrl: string;
}

export default function SecureDocumentViewer({
  documentUrl,
}: SecureDocumentViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [autoFullscreenTried, setAutoFullscreenTried] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const documentRef = useRef<HTMLDivElement>(null);

  // The blur state is now derived from isFullscreen and isMobile in the JSX

  const getFullscreenState = useCallback(() => {
    if (typeof document === "undefined") return false;
    return !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );
  }, []);

  // Disable copy-paste and devtools
  useEffect(() => {
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      e.clipboardData?.setData("text/plain", "NDA Protected Document");
      toast("Copy protection enabled", { icon: "🔒" });
    };

    const handleContextMenu = (e: Event) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent F12
      if (e.key === "F12") {
        e.preventDefault();
      }
      // Prevent Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "J" || e.key === "j" || e.key === "C" || e.key === "c")) {
        e.preventDefault();
      }
      if (e.ctrlKey && (e.key === "U" || e.key === "u")) {
        e.preventDefault();
      }
      if (e.metaKey && e.altKey && (e.key === "I" || e.key === "i" || e.key === "J" || e.key === "j" || e.key === "C" || e.key === "c")) {
        e.preventDefault();
      }
    };

    document.addEventListener("copy", handleCopy);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    // Basic DevTools Detection Loop
    const devtoolsDetector = setInterval(() => {
      const threshold = 160;
      const widthDiff = window.outerWidth - window.innerWidth > threshold;
      const heightDiff = window.outerHeight - window.innerHeight > threshold;
      if (widthDiff || heightDiff) {
        if (documentRef.current) {
          documentRef.current.classList.add("hidden");
        }
        toast.error("Developer tools detected. Document hidden.");
      } else {
        if (documentRef.current) {
          documentRef.current.classList.remove("hidden");
        }
      }
    }, 1000);

    return () => {
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      clearInterval(devtoolsDetector);
    };
  }, []);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(getFullscreenState());
    };

    // Sync state immediately on mount.
    handleFullscreenChange();

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, [getFullscreenState]);

  // Blur state logic is now handled in the render phase

  useEffect(() => {
    if (isMobile || isFullscreen || autoFullscreenTried || !numPages || !containerRef.current) {
      return;
    }

    const tryAutoFullscreen = async () => {
      setAutoFullscreenTried(true);
      try {
        if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any).webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen();
        }
      } catch {
        // Browser may block non-user initiated fullscreen requests.
        toast("Click the fullscreen button to unlock document view", { icon: "🔒" });
      }
    };

    void tryAutoFullscreen();
  }, [autoFullscreenTried, isFullscreen, isMobile, numPages]);

  const handleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      if (!getFullscreenState()) {
        const el = containerRef.current as any;
        if (el.requestFullscreen) {
          await el.requestFullscreen();
        } else if (el.webkitRequestFullscreen) {
          await el.webkitRequestFullscreen();
        } else if (el.mozRequestFullScreen) {
          await el.mozRequestFullScreen();
        } else if (el.msRequestFullscreen) {
          await el.msRequestFullscreen();
        }
      } else {
        const doc = document as any;
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        } else if (doc.mozCancelFullScreen) {
          await doc.mozCancelFullScreen();
        } else if (doc.msExitFullscreen) {
          await doc.msExitFullscreen();
        }
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
      toast.error("Fullscreen request failed");
    }
  }, [getFullscreenState]);

  // Mobile fallback: use fixed positioning instead of Fullscreen API
  const handleMobileViewDocument = useCallback(() => {
    setIsFullscreen(true);
  }, []);

  const handleMobileExit = useCallback(() => {
    setIsFullscreen(false);
  }, []);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, numPages || 1));
  };

  return (
    <div
      ref={containerRef}
      className={`w-full bg-dark-bg ${isFullscreen ? (isMobile ? "fixed inset-0 z-[9999] overflow-auto" : "fullscreen-container") : "relative"}`}
    >
      {/* Toolbar */}
      <div className="bg-dark-secondary border-b border-dark-text-secondary sticky top-0 z-40 flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <span className="text-dark-text-secondary text-sm">
            Page {currentPage} of {numPages || "..."}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Navigation Buttons */}
          <button
            onClick={goToPreviousPage}
            disabled={currentPage <= 1}
            className="p-2 hover:bg-dark-bg rounded-[2px] transition disabled:opacity-50"
            title="Previous page"
          >
            <ChevronLeft className="w-5 h-5 text-accent-bronze" />
          </button>

          <button
            onClick={goToNextPage}
            disabled={currentPage >= (numPages || 1)}
            className="p-2 hover:bg-dark-bg rounded-[2px] transition disabled:opacity-50"
            title="Next page"
          >
            <ChevronRight className="w-5 h-5 text-accent-bronze" />
          </button>

          {/* Fullscreen Button */}
          {!isMobile ? (
            <button
              onClick={handleFullscreen}
              className="p-2 hover:bg-dark-bg rounded-[2px] transition ml-2"
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? (
                <Minimize className="w-5 h-5 text-accent-bronze" />
              ) : (
                <Maximize className="w-5 h-5 text-accent-bronze" />
              )}
            </button>
          ) : isFullscreen ? (
            <button
              onClick={handleMobileExit}
              className="px-4 py-2 bg-red-600 text-white rounded-[2px] hover:bg-red-700 transition"
              title="Exit fullscreen"
            >
              Exit
            </button>
          ) : (
            <button
              onClick={handleMobileViewDocument}
              className="px-4 py-2 bg-accent-bronze text-dark-bg rounded-[2px] hover:bg-opacity-90 transition"
              title="View in fullscreen"
            >
              View
            </button>
          )}
        </div>
      </div>

      {/* Document Container */}
      <div
        ref={documentRef}
        className={`flex justify-center bg-dark-bg overflow-auto hide-scrollbar transition-all duration-500 ${
          !isFullscreen && !isMobile ? "blur-xl pointer-events-none scale-95" : "blur-0"
        }`}
        style={{
          maxHeight: isFullscreen && !isMobile ? "calc(100vh - 70px)" : "600px",
        }}
      >
        <Document
          file={documentUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<p className="text-dark-text p-4">Loading PDF...</p>}
          error={<p className="text-red-400 p-4">Error loading PDF</p>}
        >
          <Page pageNumber={currentPage} />
        </Document>
      </div>

      {/* Info Bar */}
      <div className="bg-dark-secondary border-t border-dark-text-secondary p-4">
        <p className="text-dark-text-secondary text-xs text-center">
          🔒 This document is protected. Copy, print, and screenshots are
          disabled. All viewing is logged.
        </p>
      </div>
    </div>
  );
}
