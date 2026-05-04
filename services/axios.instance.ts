import { useAuthStore } from "@/stores";
import axios from "axios";

let refreshPromise: Promise<string | null> | null = null;

// Create axios instance with base configuration
export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || "https://api.example.com",
  timeout: 120000, // Tăng lên 120s cho server cold start
  headers: {
    "Content-Type": "application/json",
  },
});

// ===== THÊM LOG Ở ĐÂY =====
console.log("[ENV] EXPO_PUBLIC_API_URL:", process.env.EXPO_PUBLIC_API_URL);
console.log("[ENV] Axios Base URL đang dùng:", api.defaults.baseURL);
// ==========================

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

const refreshAccessToken = async (): Promise<string | null> => {
  const { refreshToken, user, logout } = useAuthStore.getState();

  if (!refreshToken) {
    logout();
    return null;
  }

  try {
    const response = await axios.post(
      `${api.defaults.baseURL}/api/Home/refresh`,
      { refreshToken },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 120000,
      },
    );

    const nextAccessToken =
      response.data?.accessToken ?? response.data?.AccessToken;
    const nextRefreshToken =
      response.data?.refreshToken ??
      response.data?.RefreshToken ??
      refreshToken;

    if (!nextAccessToken) {
      throw new Error("Refresh endpoint did not return access token");
    }

    useAuthStore.setState({
      token: nextAccessToken,
      refreshToken: nextRefreshToken,
      user,
    });

    return nextAccessToken;
  } catch (refreshError) {
    console.error("[AUTH] Refresh token failed, logging out", refreshError);
    logout();
    return null;
  }
};

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const requestUrl = error.config?.url || "";
    const status = error.response?.status;
    const errorMessage = String(
      error.response?.data?.message || error.message || "",
    );
    const isWarehouseStructureSchemaMismatch =
      requestUrl.includes("/api/get-warehouse-structure/") &&
      status === 400 &&
      /column\s+.*isvulnerable\s+does not exist/i.test(errorMessage);

    const logPayload = {
      status,
      statusText: error.response?.statusText,
      errorData: error.response?.data,
      errorMessage: error.message,
    };

    if (isWarehouseStructureSchemaMismatch) {
      console.warn(`[AXIOS WARN] ${requestUrl}`, logPayload);
    } else {
      console.error(`[AXIOS ERROR] ${requestUrl}`, logPayload);

      if (
        requestUrl.includes("/api/InventoryInbound/update-tickets/") &&
        requestUrl.includes("/items")
      ) {
        try {
          const rawData = error.config?.data;
          const parsedData =
            typeof rawData === "string" ? JSON.parse(rawData) : rawData;

          const binPayload = Array.isArray(parsedData)
            ? parsedData.map((item: any) => ({
                itemId: item?.id,
                productId: item?.productId,
                bins: Array.isArray(item?.locations)
                  ? item.locations.map((location: any) => ({
                      binId: location?.binId,
                      quantity: location?.quantity,
                    }))
                  : [],
              }))
            : parsedData;

          console.log("[INBOUND UPDATE BIN PAYLOAD]", binPayload);
        } catch (parseError) {
          console.warn(
            "[INBOUND UPDATE BIN PAYLOAD] unable to parse request payload",
            parseError,
          );
        }
      }
    }

    const originalRequest = error.config as
      | (typeof error.config & { _retry?: boolean })
      | undefined;
    const url = originalRequest?.url || "";
    const isAuthEndpoint =
      url.includes("/Login") ||
      url.includes("/logout") ||
      url.includes("/refresh") ||
      url.includes("/auth/") ||
      url.includes("/token");

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      originalRequest._retry = true;

      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      const nextAccessToken = await refreshPromise;

      if (nextAccessToken) {
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
        return api(originalRequest);
      }
    }

    return Promise.reject(error);
  },
);
