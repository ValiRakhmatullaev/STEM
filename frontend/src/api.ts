/**
 * Centralised fetch wrapper that automatically includes CSRF token
 * and credentials for all requests to the Django backend.
 */

function getCsrfToken(): string {
  const match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : "";
}

export async function ensureCsrfCookie(): Promise<void> {
  if (getCsrfToken()) return;
  await fetch("/api/auth/csrf/", { credentials: "include" });
}

type FetchOptions = RequestInit & { skipCsrf?: boolean };

/**
 * Drop-in replacement for `fetch` that:
 * 1. Always sends `credentials: "include"`
 * 2. Attaches the `X-CSRFToken` header for mutating methods
 */
export async function apiFetch(
  url: string,
  options: FetchOptions = {},
): Promise<Response> {
  const method = (options.method || "GET").toUpperCase();
  const headers = new Headers(options.headers || {});

  if (!["GET", "HEAD", "OPTIONS"].includes(method) && !options.skipCsrf) {
    let token = getCsrfToken();
    if (!token) {
      await ensureCsrfCookie();
      token = getCsrfToken();
    }
    if (token) {
      headers.set("X-CSRFToken", token);
    }
  }

  return fetch(url, {
    ...options,
    credentials: "include",
    headers,
  });
}
