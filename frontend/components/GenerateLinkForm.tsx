"use client";

import { useState, useEffect } from "react";
import { adminAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { Upload } from "lucide-react";
import { motion } from "framer-motion";

export default function GenerateLinkForm({ onSuccess }: { onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    nda_text: "",
    allowed_name: "",
    max_views: 1,
    expires_at: "",
  });
  const [defaultThreeHours, setDefaultThreeHours] = useState(true);

  useEffect(() => {
    if (defaultThreeHours) {
      const date = new Date();
      date.setHours(date.getHours() + 3);
      // Format to YYYY-MM-DDThh:mm
      const formatted = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setFormData(prev => ({ ...prev, expires_at: formatted }));
    }
  }, [defaultThreeHours]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== "application/pdf") {
        toast.error("Only PDF files are allowed");
        return;
      }
      if (selectedFile.size > 100 * 1024 * 1024) {
        toast.error("File size must be less than 100MB");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "max_views" ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast.error("Please select a PDF file");
      return;
    }

    if (!formData.nda_text.trim()) {
      toast.error("Please enter NDA text");
      return;
    }

    if (!formData.allowed_name.trim()) {
      toast.error("Please enter allowed recipient name");
      return;
    }

    if (formData.max_views < 1) {
      toast.error("Max views must be at least 1");
      return;
    }

    if (!formData.expires_at) {
      toast.error("Please set expiration date");
      return;
    }

    const expiryDate = new Date(formData.expires_at);
    if (expiryDate <= new Date()) {
      toast.error("Expiration date must be in the future");
      return;
    }

    setLoading(true);

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("nda_text", formData.nda_text);
      form.append("allowed_name", formData.allowed_name);
      form.append("max_views", formData.max_views.toString());
      form.append("expires_at", expiryDate.toISOString());

      const response = await adminAPI.generateLink(form);

      toast.success("Link generated successfully!");
      console.log("Generated link:", response);

      // Reset form
      setFile(null);
      setFormData({
        nda_text: "",
        allowed_name: "",
        max_views: 1,
        expires_at: "",
      });

      // Call onSuccess callback to refresh the links table
      onSuccess();
    } catch (error: any) {
      console.error("Error generating link:", error);
      toast.error(error.response?.data?.detail || "Failed to generate link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      onSubmit={handleSubmit} 
      className="space-y-6"
    >
      {/* File Upload */}
      <div>
        <label className="block text-dark-text text-sm font-medium mb-2">
          Upload PDF Document
        </label>
        <div className="relative border-2 border-dashed border-accent-bronze rounded-[2px] p-6 hover:bg-dark-secondary transition">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <div className="flex items-center justify-center gap-3 pointer-events-none">
            <Upload className="w-5 h-5 text-accent-bronze" />
            <div>
              <p className="text-dark-text font-medium">
                {file ? file.name : "Click to select PDF"}
              </p>
              <p className="text-dark-text-secondary text-xs">
                Max 100MB
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* NDA Text */}
      <div>
        <label className="block text-dark-text text-sm font-medium mb-2">
          NDA Text
        </label>
        <textarea
          name="nda_text"
          value={formData.nda_text}
          onChange={handleInputChange}
          rows={6}
          placeholder="Enter the NDA terms that users must accept..."
          className="w-full bg-dark-secondary border border-dark-text-secondary rounded-[2px] p-3 text-dark-text placeholder-dark-text-secondary focus:outline-none focus:border-accent-bronze"
        />
      </div>

      {/* Allowed Name */}
      <div>
        <label className="block text-dark-text text-sm font-medium mb-2">
          Allowed Recipient Name
        </label>
        <input
          type="text"
          name="allowed_name"
          value={formData.allowed_name}
          onChange={handleInputChange}
          placeholder="Enter the name of the person who can access this document"
          className="w-full bg-dark-secondary border border-dark-text-secondary rounded-[2px] p-3 text-dark-text placeholder-dark-text-secondary focus:outline-none focus:border-accent-bronze"
        />
      </div>

      {/* Max Views */}
      <div>
        <label className="block text-dark-text text-sm font-medium mb-2">
          Maximum Views
        </label>
        <input
          type="number"
          name="max_views"
          value={formData.max_views}
          onChange={handleInputChange}
          min="1"
          max="100"
          className="w-full bg-dark-secondary border border-dark-text-secondary rounded-[2px] p-3 text-dark-text placeholder-dark-text-secondary focus:outline-none focus:border-accent-bronze"
        />
      </div>

      {/* Expiration Date */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-dark-text text-sm font-medium">
            Expiration Date & Time
          </label>
          <label className="flex items-center text-xs text-dark-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={defaultThreeHours}
              onChange={(e) => setDefaultThreeHours(e.target.checked)}
              className="mr-2 rounded border-dark-text-secondary bg-dark-bg focus:ring-accent-bronze"
            />
            Default 3 hours from now
          </label>
        </div>
        <input
          type="datetime-local"
          name="expires_at"
          value={formData.expires_at}
          onChange={(e) => {
            setDefaultThreeHours(false);
            handleInputChange(e);
          }}
          style={{ colorScheme: 'dark' }}
          className="w-full bg-dark-secondary border border-dark-text-secondary rounded-[2px] p-3 text-dark-text focus:outline-none focus:border-accent-bronze"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-accent-bronze text-dark-bg font-semibold py-3 rounded-[2px] hover:bg-opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Generating..." : "Generate Secure Link"}
      </button>
    </motion.form>
  );
}
