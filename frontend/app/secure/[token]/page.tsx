"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import NDAGate from "@/components/NDAGate";
import SecureDocumentViewer from "@/components/SecureDocumentViewer";
import { viewerAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { Loader } from "lucide-react";

interface LinkData {
  token: string;
  nda_text: string;
  allowed_name: string;
  max_views: number;
  current_views: number;
  expires_at: string;
  is_valid: boolean;
}

export default function SecureViewer() {
  const params = useParams();
  const token = params.token as string;

  const [linkData, setLinkData] = useState<LinkData | null>(null);
  const [ndaAccepted, setNdaAccepted] = useState(false);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  // Verify link on mount
  useEffect(() => {
    const verifyLink = async () => {
      try {
        setLoading(true);
        const data = await viewerAPI.verifyLink(token);
        setLinkData(data);
      } catch (error: any) {
        console.error("Error verifying link:", error);
        toast.error(
          error.response?.data?.detail || "Invalid or expired link"
        );
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      verifyLink();
    }
  }, [token]);

  // Prevent back button when NDA is accepted
  useEffect(() => {
    if (ndaAccepted) {
      window.history.pushState(null, "", window.location.href);
      const handlePopState = () => {
        window.history.pushState(null, "", window.location.href);
      };
      window.addEventListener("popstate", handlePopState);
      return () => window.removeEventListener("popstate", handlePopState);
    }
  }, [ndaAccepted]);

  const handleNdaAccept = async (userName: string) => {
    try {
      setVerifying(true);
      const response = await viewerAPI.acceptNDA(token, userName);

      if (response.success && response.document_url) {
        // Get the document blob
        const blob = await viewerAPI.getDocument(token);
        const url = URL.createObjectURL(blob);
        setDocumentUrl(url);
        setNdaAccepted(true);
        toast.success("NDA accepted! Document loaded.");
      } else {
        toast.error(response.message || "Failed to accept NDA");
      }
    } catch (error: any) {
      console.error("Error accepting NDA:", error);
      toast.error(
        error.response?.data?.detail || "Failed to accept NDA"
      );
    } finally {
      setVerifying(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-8 h-8 text-accent-bronze animate-spin" />
          <p className="text-dark-text-secondary">Verifying link...</p>
        </div>
      </div>
    );
  }

  // Invalid link
  if (!linkData) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-400 mb-4">
            Invalid or Expired Link
          </h1>
          <p className="text-dark-text-secondary mb-8">
            This document link is no longer valid or has expired. Please contact
            the document administrator.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-accent-bronze text-dark-bg rounded-[2px] hover:bg-opacity-90 transition"
          >
            Go Home
          </a>
        </div>
      </div>
    );
  }

  // NDA not accepted yet
  if (!ndaAccepted) {
    return (
      <NDAGate
        nda_text={linkData.nda_text}
        allowed_name={linkData.allowed_name}
        onAccept={handleNdaAccept}
        loading={verifying}
      />
    );
  }

  // Document viewer
  if (documentUrl) {
    return <SecureDocumentViewer documentUrl={documentUrl} />;
  }

  // Loading document
  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader className="w-8 h-8 text-accent-bronze animate-spin" />
        <p className="text-dark-text-secondary">Loading document...</p>
      </div>
    </div>
  );
}
