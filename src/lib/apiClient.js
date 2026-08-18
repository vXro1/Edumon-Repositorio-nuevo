// src/lib/apiClient.js — DEPRECATED shim.
// All features now import from @/services/core/apiClient (or their feature service).
// This file is kept only as a safety net; it is not imported by any active code.
export {
  apiFetch,
  apiFetchFormData,
  registerLogoutCallback,
  setTokenProvider,
} from "@/services/core/apiClient";
