import axios from "axios";
import { API_BASE_URL } from "../config/api";
import { getToken, getRefreshToken, saveToken, saveRefreshToken, clearAuth } from "../utils/auth";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request Interceptor: Attach Access Token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await getToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (_e) {
      // Ignore token read error
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: 401 Refresh Token Rotation & Retry
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!error.response || error.response.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    const url = originalRequest.url || "";
    if (url.includes("/auth/login") || url.includes("/auth/refresh-token")) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((newToken) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return apiClient(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const currentRefreshToken = await getRefreshToken();
      if (!currentRefreshToken) {
        await clearAuth();
        processQueue(new Error("No refresh token available"), null);
        return Promise.reject(error);
      }

      const refreshResponse = await axios.post(`${API_BASE_URL}/api/auth/refresh-token`, {
        refreshToken: currentRefreshToken,
      });

      const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data;

      if (accessToken) {
        await saveToken(accessToken);
        if (newRefreshToken) {
          await saveRefreshToken(newRefreshToken);
        }

        apiClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return apiClient(originalRequest);
      }

      await clearAuth();
      processQueue(new Error("Failed to refresh token"), null);
      return Promise.reject(error);
    } catch (refreshErr) {
      await clearAuth();
      processQueue(refreshErr, null);
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

export const api = {
  get: (url, config) => apiClient.get(url, config).then((res) => res.data),
  post: (url, data, config) => apiClient.post(url, data, config).then((res) => res.data),
  put: (url, data, config) => apiClient.put(url, data, config).then((res) => res.data),
  delete: (url, config) => apiClient.delete(url, config).then((res) => res.data),
};

export default apiClient;
