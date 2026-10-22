/** Fetch wrapper for tenant API requests. Adds the saved church code and admin bearer token. */
export async function tenantFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers || {});
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("cwcr_token");
    const churchCode = localStorage.getItem("cwcr_church_code");
    if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);
    if (churchCode && !headers.has("X-Church-Code")) headers.set("X-Church-Code", churchCode);
  }
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  return fetch(input, { ...init, headers });
}
