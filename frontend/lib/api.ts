import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const SUPABASE_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || "documents";

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Intercept requests to add auth token
apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("admin_token");
    if (token && config.url?.startsWith("/api/admin")) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Admin API endpoints
export const adminAPI = {
  login: async (formData: FormData) => {
    const response = await apiClient.post("/api/admin/login", formData, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    return response.data;
  },

  generateLink: async (formData: FormData) => {
    const response = await apiClient.post("/api/admin/generate-link", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  generateLinkDirect: async (payload: {
    file_name: string;
    file_path: string;
    file_size: number;
    nda_text: string;
    allowed_name: string;
    max_views: number;
    expires_at: string;
  }) => {
    const response = await apiClient.post("/api/admin/generate-link-direct", payload);
    return response.data;
  },

  getAllLinks: async () => {
    const response = await apiClient.get("/api/admin/links");
    return response.data;
  },

  revokeLink: async (linkId: number) => {
    const response = await apiClient.post(`/api/admin/links/${linkId}/revoke`);
    return response.data;
  },
};

export const uploadPdfToSupabase = async (file: File) => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase public upload env vars are not configured");
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
  const uniqueName = `${crypto.randomUUID()}.${ext}`;
  const storagePath = `uploads/${uniqueName}`;
  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${storagePath}`;

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": file.type || "application/pdf",
      "x-upsert": "false",
    },
    body: file,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Failed to upload file to Supabase Storage");
  }

  return {
    storagePath,
    fileName: file.name,
    fileSize: file.size,
  };
};

// Viewer API endpoints
export const viewerAPI = {
  verifyLink: async (token: string) => {
    const response = await apiClient.get(`/api/viewer/verify-link/${token}`);
    return response.data;
  },

  acceptNDA: async (token: string, userName: string) => {
    const response = await apiClient.post(`/api/viewer/accept-nda/${token}`, {
      user_name: userName,
    });
    return response.data;
  },

  getDocument: async (token: string) => {
    const response = await apiClient.get(`/api/viewer/document/${token}`, {
      responseType: "blob",
    });
    return response.data;
  },
};

export default apiClient;
