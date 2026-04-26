"use client";

import { useState } from "react";
import GenerateLinkForm from "@/components/GenerateLinkForm";
import LinksTable from "@/components/LinksTable";
import { Lock, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState("generate");
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    router.push("/admin/login");
  };

  const handleFormSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
    setActiveTab("manage");
  };

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <header className="bg-dark-secondary border-b border-dark-text-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock className="w-8 h-8 text-accent-bronze" />
              <h1 className="text-3xl font-bold text-dark-text">
                Admin Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-dark-text-secondary hover:text-accent-bronze transition text-sm"
              >
                ← Back Home
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-dark-bg text-dark-text-secondary px-3 py-1.5 rounded-[2px] border border-dark-text-secondary border-opacity-30 hover:text-accent-bronze hover:border-accent-bronze transition text-sm"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
          <p className="text-dark-text-secondary mt-2">
            Manage secure document access links
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-dark-text-secondary">
          <button
            onClick={() => setActiveTab("generate")}
            className={`px-4 py-3 font-medium transition ${
              activeTab === "generate"
                ? "border-b-2 border-accent-bronze text-accent-bronze"
                : "text-dark-text-secondary hover:text-dark-text"
            }`}
          >
            Generate Link
          </button>
          <button
            onClick={() => setActiveTab("manage")}
            className={`px-4 py-3 font-medium transition ${
              activeTab === "manage"
                ? "border-b-2 border-accent-bronze text-accent-bronze"
                : "text-dark-text-secondary hover:text-dark-text"
            }`}
          >
            Manage Links
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-dark-secondary rounded-[2px] p-8">
          {activeTab === "generate" && (
            <div>
              <h2 className="text-2xl font-bold text-dark-text mb-6">
                Create New Secure Link
              </h2>
              <GenerateLinkForm onSuccess={handleFormSuccess} />
            </div>
          )}

          {activeTab === "manage" && (
            <div>
              <h2 className="text-2xl font-bold text-dark-text mb-6">
                Active Links
              </h2>
              <LinksTable refreshTrigger={refreshTrigger} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
