export const formatDate = (date: Date | string) => {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
};

export const isLinkExpired = (expiresAt: string) => {
  return new Date(expiresAt) < new Date();
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case "Active":
      return "text-green-400";
    case "Expired":
      return "text-red-400";
    case "Revoked":
      return "text-yellow-400";
    default:
      return "text-gray-400";
  }
};
