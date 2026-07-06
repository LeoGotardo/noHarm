import { reauth as reauthSocket } from "./socket.js";
import { tokens } from "./tokens.js";

const BASE_URL = import.meta.env.VITE_API_URL ?? "";

export class ApiError extends Error {
  constructor(status, body) {
    super(`HTTP ${status}`);
    this.status = status;
    this.body = body;
  }
}

// Friendly copy per HTTP status, in the app's warm/compassionate tone.
const STATUS_MESSAGES = {
  400: "Something about that didn't look right. Please try again.",
  401: "Your session expired. Please sign in again.",
  403: "You don't have permission to do that.",
  404: "We couldn't find what you were looking for.",
  409: "That's already been done.",
  422: "Something about that didn't look right. Please try again.",
  429: "You're going a little fast — please wait a moment and try again.",
  500: "Something went wrong on our end. Please try again.",
  502: "We're having trouble reaching the server. Please try again.",
  503: "We're having trouble reaching the server. Please try again.",
};

/**
 * Turn any thrown error into a short, user-friendly message.
 * @param {unknown} err     the caught error (ApiError, TypeError, etc.)
 * @param {string} fallback message when nothing more specific applies
 */
export function errorMessage(err, fallback = "Something went wrong. Please try again.") {
  // Network failure — fetch rejects with a TypeError, no status
  if (err instanceof TypeError) {
    return "Connection problem. Check your internet and try again.";
  }
  if (err instanceof ApiError) {
    // Prefer a human-readable message the backend sent, if any
    const detail = err.body?.detail ?? err.body?.message;
    if (typeof detail === "string" && detail && !/^HTTP \d/.test(detail)) {
      return detail;
    }
    return STATUS_MESSAGES[err.status] ?? fallback;
  }
  return fallback;
}

async function parseResponse(res) {
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) throw new ApiError(res.status, json);
  return json;
}

async function request(method, path, body, retry = true, params) {
  const headers = { "Content-Type": "application/json" };

  const token = tokens.getAccess();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let url = BASE_URL + path;
  if (params && Object.keys(params).length > 0) {
    const qs = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v != null)
        .map(([k, v]) => [k, String(v)]),
    ).toString();
    if (qs) url += "?" + qs;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && retry) {
    // Refresh once, then retry the original request
    const refreshToken = tokens.getRefresh();
    if (!refreshToken) throw new ApiError(401, null);

    const refreshRes = await fetch(BASE_URL + "/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    const refreshed = await parseResponse(refreshRes);
    tokens.set(refreshed);
    // Reconnect the socket with the fresh access token (old one is expiring).
    reauthSocket(tokens.getAccess());

    return request(method, path, body, false, params);
  }

  return parseResponse(res);
}

export const api = {
  get: (path, params) => request("GET", path, undefined, true, params),
  post: (path, body) => request("POST", path, body),
  put: (path, body) => request("PUT", path, body),
  patch: (path, body) => request("PATCH", path, body),
  delete: (path) => request("DELETE", path),
};
