"use client";

import { useEffect, useState } from "react";
import { adminAPI } from "@/lib/api";
import { formatDate, formatFileSize, getStatusColor } from "@/lib/utils";
import toast from "react-hot-toast";
import { Trash2, Copy, Check } from "lucide-react";

interface AccessLink {
  id: number;
  token: string;
  allowed_name: string;
  max_views: number;
  current_views: number;
  is_revoked: boolean;
  expires_at: string;
  created_at: string;
  status: string;
  document_name: string;
}

export default function LinksTable({ refreshTrigger }: { refreshTrigger: number }) {
  const [links, setLinks] = useState<AccessLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const fetchLinks = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getAllLinks();
      setLinks(data);
    } catch (error) {
      console.error("Error fetching links:", error);
      toast.error("Failed to load links");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, [refreshTrigger]);

  const handleCopyToken = (token: string) => {
    const url = `${window.location.origin}/secure/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleRevoke = async (linkId: number) => {
    if (!window.confirm("Are you sure you want to revoke this link?")) {
      return;
    }

    try {
      await adminAPI.revokeLink(linkId);
      toast.success("Link revoked successfully");
      fetchLinks();
    } catch (error) {
      console.error("Error revoking link:", error);
      toast.error("Failed to revoke link");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-dark-text-secondary">Loading links...</p>
      </div>
    );
  }

  if (links.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-dark-text-secondary">No links generated yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-dark-text-secondary">
            <th className="text-left py-3 px-4 text-dark-text-secondary text-sm font-medium">
              Document
            </th>
            <th className="text-left py-3 px-4 text-dark-text-secondary text-sm font-medium">
              Recipient
            </th>
            <th className="text-left py-3 px-4 text-dark-text-secondary text-sm font-medium">
              Views
            </th>
            <th className="text-left py-3 px-4 text-dark-text-secondary text-sm font-medium">
              Status
            </th>
            <th className="text-left py-3 px-4 text-dark-text-secondary text-sm font-medium">
              Expires
            </th>
            <th className="text-left py-3 px-4 text-dark-text-secondary text-sm font-medium">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {links.map((link) => (
            <tr
              key={link.id}
              className="border-b border-dark-secondary hover:bg-dark-secondary transition"
            >
              <td className="py-4 px-4 text-dark-text text-sm truncate">
                {link.document_name}
              </td>
              <td className="py-4 px-4 text-dark-text text-sm">
                {link.allowed_name}
              </td>
              <td className="py-4 px-4 text-dark-text text-sm">
                {link.current_views}/{link.max_views}
              </td>
              <td className={`py-4 px-4 text-sm font-medium ${getStatusColor(link.status)}`}>
                {link.status}
              </td>
              <td className="py-4 px-4 text-dark-text-secondary text-sm">
                {formatDate(link.expires_at)}
              </td>
              <td className="py-4 px-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyToken(link.token)}
                    className="p-2 hover:bg-dark-secondary rounded-[2px] transition"
                    title="Copy link"
                  >
                    {copiedToken === link.token ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-accent-bronze" />
                    )}
                  </button>
                  <button
                    onClick={() => handleRevoke(link.id)}
                    disabled={link.is_revoked}
                    className="p-2 hover:bg-dark-secondary rounded-[2px] transition disabled:opacity-50"
                    title="Revoke link"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
