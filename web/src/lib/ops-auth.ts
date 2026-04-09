export function requireOpsAuth(req: Request): { ok: true } | { ok: false; error: Response } {
  const expected = (process.env.OPS_TOKEN ?? "").trim();
  if (!expected) return { ok: true };

  const authHeader = (req.headers.get("authorization") ?? "").trim();
  if (!authHeader) {
    return {
      ok: false,
      error: Response.json({ error: "Unauthorized: missing Authorization header" }, { status: 401 }),
    };
  }

  const match = /^Bearer\s+(.+)$/i.exec(authHeader);
  if (!match) {
    return {
      ok: false,
      error: Response.json({ error: "Unauthorized: expected Bearer token" }, { status: 401 }),
    };
  }

  const token = match?.[1]?.trim() ?? "";

  if (!token) {
    return {
      ok: false,
      error: Response.json({ error: "Unauthorized: empty token" }, { status: 401 }),
    };
  }

  if (token !== expected) {
    return {
      ok: false,
      error: Response.json({ error: "Unauthorized: invalid token" }, { status: 401 }),
    };
  }

  return { ok: true };
}
