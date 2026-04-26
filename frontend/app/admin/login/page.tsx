"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { Lock } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("password", password);

      const response = await adminAPI.login(formData);

      if (response.access_token) {
        localStorage.setItem("admin_token", response.access_token);
        toast.success("Login successful");
        router.push("/admin");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-dark-secondary rounded-[2px] p-8 max-w-md w-full border border-dark-text-secondary border-opacity-20"
      >
        <div className="flex flex-col items-center justify-center mb-8">
          <Lock className="w-12 h-12 text-accent-bronze mb-4" />
          <h1 className="text-2xl font-bold text-dark-text">Admin Login</h1>
          <p className="text-dark-text-secondary text-sm text-center mt-2">
            Enter your credentials to access the DocBox dashboard
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-dark-text text-sm font-medium mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-dark-bg border border-dark-text-secondary rounded-[2px] p-3 text-dark-text focus:outline-none focus:border-accent-bronze"
              placeholder="Enter username"
              required
            />
          </div>

          <div>
            <label className="block text-dark-text text-sm font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-dark-bg border border-dark-text-secondary rounded-[2px] p-3 text-dark-text focus:outline-none focus:border-accent-bronze"
              placeholder="Enter password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent-bronze text-dark-bg font-semibold py-3 rounded-[2px] hover:bg-opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Authenticating..." : "Login"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
