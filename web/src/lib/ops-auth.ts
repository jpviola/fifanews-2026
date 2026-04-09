export function requireOpsAuth(req: Request): { ok: true } | { ok: false; error: Response } {
  const expected = process.env.OPS_TOKEN ?? "";
  if (!expected) return { ok: true };

  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${expected}`) {
    return { ok: false, error: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  return { ok: true };
}

