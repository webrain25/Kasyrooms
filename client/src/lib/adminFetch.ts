export class AdminUnauthorizedError extends Error {
  status = 401 as const;
  constructor() {
    super("admin_unauthorized");
  }
}

export class AdminForbiddenError extends Error {
  status = 403 as const;
  missing?: string;
  details?: unknown;

  constructor(args?: { missing?: string; details?: unknown; message?: string }) {
    super(args?.message || "admin_forbidden");
    this.missing = args?.missing;
    this.details = args?.details;
  }
}

export class AdminApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function throwIfNotOk(res: Response) {
  if (res.ok) return;
  if (res.status === 401) throw new AdminUnauthorizedError();
  const text = (await res.text()) || res.statusText;
  let parsed: any = undefined;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = undefined;
  }

  if (res.status === 403) {
    const missing = typeof parsed?.missing === "string" ? parsed.missing : undefined;
    const msg = missing ? `forbidden (missing ${missing})` : "forbidden";
    throw new AdminForbiddenError({ missing, details: parsed ?? text, message: msg });
  }

  throw new AdminApiError(res.status, `${res.status}: ${text}`, parsed ?? text);
}

export async function adminFetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.headers ?? {}),
    },
  });
  await throwIfNotOk(res);
  return (await res.json()) as T;
}

export async function adminPostJson<T>(url: string, body?: unknown): Promise<T> {
  return adminFetchJson<T>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
