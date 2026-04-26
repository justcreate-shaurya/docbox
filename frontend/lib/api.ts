import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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

  getAllLinks: async () => {
    const response = await apiClient.get("/api/admin/links");
    return response.data;
  },

  revokeLink: async (linkId: number) => {
    const response = await apiClient.post(`/api/admin/links/${linkId}/revoke`);
    return response.data;
  },
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
