"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import toast from "react-hot-toast";

interface NDAGateProps {
  nda_text: string;
  allowed_name: string;
  onAccept: (userName: string) => Promise<void>;
  loading: boolean;
}

export default function NDAGate({
  nda_text,
  allowed_name,
  onAccept,
  loading,
}: NDAGateProps) {
  const [userName, setUserName] = useState("");
  const [accepted, setAccepted] = useState(false);

  const handleAccept = async () => {
    if (!userName.trim()) {
      toast.error("Please enter your name");
      return;
    }

    if (userName.trim().toLowerCase() !== allowed_name.trim().toLowerCase()) {
      toast.error("Access denied: Name mismatch");
      return;
    }

    setAccepted(true);

    try {
      await onAccept(userName);
    } catch (error) {
      setAccepted(false);
      toast.error("Failed to accept NDA");
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        {/* NDA Card */}
        <div className="bg-dark-secondary rounded-[2px] p-8 md:p-12">
          {/* Header */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <Lock className="w-8 h-8 text-accent-bronze" />
            <h1 className="text-3xl font-bold text-dark-text">
              Non-Disclosure Agreement
            </h1>
          </div>

          {/* NDA Text */}
          <div className="bg-dark-bg rounded-[2px] p-6 mb-8 max-h-96 overflow-y-auto">
            <p className="text-dark-text whitespace-pre-wrap leading-relaxed">
              {nda_text}
            </p>
          </div>


          {/* Name Input */}
          <div className="mb-8">
            <label className="block text-dark-text text-sm font-medium mb-3">
              Type your full name to accept and view the document:
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAccept()}
              disabled={loading}
              placeholder="Enter your full name"
              className="w-full bg-dark-bg border border-accent-bronze rounded-[2px] p-4 text-dark-text placeholder-dark-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-bronze"
            />
            <p className="text-dark-text-secondary text-xs mt-2">
              Your name must match exactly to proceed.
            </p>
          </div>

          {/* Accept Button */}
          <button
            onClick={handleAccept}
            disabled={loading || accepted}
            className="w-full bg-accent-bronze text-dark-bg font-semibold py-4 rounded-[2px] hover:bg-opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : accepted ? "NDA Accepted ✓" : "Accept & View Document"}
          </button>

          {/* Security Notice */}
          <div className="mt-8 p-4 bg-dark-bg rounded-[2px]">
            <p className="text-dark-text-secondary text-xs">
              This document is protected by security measures including copy
              prevention, fullscreen lock, and view tracking. All access is
              logged.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
