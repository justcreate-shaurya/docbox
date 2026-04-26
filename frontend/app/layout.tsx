import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "DocBox VDR",
  description: "Secure Virtual Data Room",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-dark-bg text-dark-text">
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
