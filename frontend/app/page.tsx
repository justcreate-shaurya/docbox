"use client";

import Link from "next/link";
import { FileText, Lock } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center px-4">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-16 text-center"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <Lock className="w-10 h-10 text-accent-bronze" />
          <h1 className="text-4xl md:text-5xl font-bold text-dark-text">
            DocBox VDR
          </h1>
        </div>
        <p className="text-dark-text-secondary text-lg">
          Secure Virtual Data Room
        </p>
      </motion.div>

      {/* Main Content */}
      <div className="grid md:grid-cols-2 gap-12 max-w-2xl w-full">
        {/* Admin Card */}
        <Link href="/admin">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-dark-secondary rounded-[2px] p-8 cursor-pointer hover:border-l-4 hover:border-accent-bronze transition-all duration-300 h-full"
          >
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-8 h-8 text-accent-bronze" />
              <h2 className="text-2xl font-semibold text-dark-text">
                Admin Dashboard
              </h2>
            </div>
            <p className="text-dark-text-secondary">
              Generate secure document links, manage NDAs, and track access to shared files.
            </p>
          </motion.div>
        </Link>

        {/* Viewer Info Card */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-dark-secondary rounded-[2px] p-8 opacity-75 h-full"
        >
          <div className="flex items-center gap-3 mb-4">
            <Lock className="w-8 h-8 text-accent-bronze" />
            <h2 className="text-2xl font-semibold text-dark-text">
              Viewer Portal
            </h2>
          </div>
          <p className="text-dark-text-secondary">
            Access secure document links using the unique token provided by document administrators.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
