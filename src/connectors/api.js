import { tokens } from "./tokens.js";

const BASE_URL = import.meta.env.VITE_API_URL ?? "";

export class ApiError extends Error {
  constructor(status, body) {
    super(`HTTP ${status}`);
    this.status = status;
    this.body = body;
  }
}

async function parseResponse(res) {
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) throw new ApiError(res.status, json);
  return json;
}

async function request(method, path, body, retry = true) {
  const headers = { "Content-Type": "application/json" };

  const token = tokens.getAccess();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(BASE_URL + path, {
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

    return request(method, path, body, false);
  }

  return parseResponse(res);
}

export const api = {
  get: (path) => request("GET", path),
  post: (path, body) => request("POST", path, body),
  put: (path, body) => request("PUT", path, body),
  patch: (path, body) => request("PATCH", path, body),
  delete: (path) => request("DELETE", path),
};
