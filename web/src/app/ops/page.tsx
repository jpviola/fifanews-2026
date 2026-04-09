"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type RunLog = {
  id: number;
  startedAtIso: string;
  finishedAtIso: string;
  sourceMode: "websets" | "search";
  websetId?: string;
  query?: string;
  countRequested?: number;
  urlsFound: number;
  urlsToProcess: number;
  draftsGenerated: number;
  errorsCount: number;
  storedCount: number;
};

function formatIso(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(d);
}

function durationMs(startIso: string, endIso: string) {
  const a = new Date(startIso).getTime();
  const b = new Date(endIso).getTime();
  const ms = Math.max(0, b - a);
  return ms;
}

function formatDuration(ms: number) {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}m ${r}s`;
}

function getStoredToken() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("opsToken") ?? "";
}

function setStoredToken(token: string) {
  if (typeof window === "undefined") return;
  if (!token) window.localStorage.removeItem("opsToken");
  else window.localStorage.setItem("opsToken", token);
}

export default function OpsPage() {
  const [token, setToken] = useState("");
  const [runs, setRuns] = useState<RunLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [count, setCount] = useState(25);
  const [concurrency, setConcurrency] = useState(3);

  const authHeaders = useMemo<Record<string, string>>(() => {
    if (!token) return {} as Record<string, string>;
    return { Authorization: `Bearer ${token}` };
  }, [token]);

  const loadRuns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/automation/runs?limit=30", {
        headers: {
          ...authHeaders,
        },
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      const data = (await res.json()) as { runs?: RunLog[] };
      setRuns(data.runs ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  const runNow = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/automation/daily/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({
          count,
          concurrency,
          onlyNew: true,
        }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      await loadRuns();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [authHeaders, concurrency, count, loadRuns]);

  useEffect(() => {
    const stored = getStoredToken();
    if (stored) setToken(stored);
  }, []);

  useEffect(() => {
    if (!token) return;
    setStoredToken(token);
    void loadRuns();
  }, [loadRuns, token]);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="rounded-3xl border border-zinc-200/70 bg-white/75 p-6 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
              Ops
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              Estado de automatización, cron y corridas recientes.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setToken("");
              setStoredToken("");
              setRuns([]);
              setError(null);
            }}
            className="rounded-full border border-zinc-200 bg-white/70 px-4 py-2 text-sm text-zinc-800 shadow-sm hover:bg-white"
          >
            Salir
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-zinc-200/70 bg-white/70 p-4">
              <div className="text-sm font-semibold text-zinc-950">
                Acceso (OPS_TOKEN)
              </div>
              <p className="mt-1 text-sm text-zinc-600">
                Pegá el token y se guardará en el navegador.
              </p>
              <input
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Bearer token"
                className="mt-3 w-full rounded-xl border border-zinc-200 bg-white/70 px-4 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:ring-2 focus:ring-zinc-900/10"
              />
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => void loadRuns()}
                  className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800"
                  disabled={!token || loading}
                >
                  Refrescar
                </button>
              </div>
              {error ? (
                <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-zinc-200/70 bg-white/70 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-semibold text-zinc-950">
                    Ejecutar ahora
                  </div>
                  <div className="text-sm text-zinc-600">
                    Corre una vuelta manual (solo nuevos).
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void runNow()}
                  className="rounded-full bg-gradient-to-r from-sky-500 via-emerald-500 to-red-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95"
                  disabled={!token || loading}
                >
                  Run
                </button>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="rounded-xl border border-zinc-200 bg-white/70 px-4 py-3">
                  <div className="text-xs font-semibold text-zinc-500">Count</div>
                  <input
                    type="number"
                    value={count}
                    min={1}
                    max={100}
                    onChange={(e) => setCount(Number(e.target.value))}
                    className="mt-1 w-full bg-transparent text-sm text-zinc-900 outline-none"
                  />
                </label>
                <label className="rounded-xl border border-zinc-200 bg-white/70 px-4 py-3">
                  <div className="text-xs font-semibold text-zinc-500">
                    Concurrency
                  </div>
                  <input
                    type="number"
                    value={concurrency}
                    min={1}
                    max={6}
                    onChange={(e) => setConcurrency(Number(e.target.value))}
                    className="mt-1 w-full bg-transparent text-sm text-zinc-900 outline-none"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-zinc-200/70 bg-white/70 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-zinc-950">
                Corridas recientes
              </div>
              <div className="text-sm text-zinc-600">
                Últimas 30 ejecuciones guardadas en Postgres.
              </div>
            </div>
            <div className="text-sm text-zinc-500">
              {loading ? "Cargando…" : `${runs.length} filas`}
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[900px] border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="text-xs font-semibold text-zinc-500">
                  <th className="border-b border-zinc-200/70 px-3 py-2">ID</th>
                  <th className="border-b border-zinc-200/70 px-3 py-2">Inicio</th>
                  <th className="border-b border-zinc-200/70 px-3 py-2">Duración</th>
                  <th className="border-b border-zinc-200/70 px-3 py-2">Modo</th>
                  <th className="border-b border-zinc-200/70 px-3 py-2">Found</th>
                  <th className="border-b border-zinc-200/70 px-3 py-2">Proc</th>
                  <th className="border-b border-zinc-200/70 px-3 py-2">Drafts</th>
                  <th className="border-b border-zinc-200/70 px-3 py-2">Err</th>
                  <th className="border-b border-zinc-200/70 px-3 py-2">Stored</th>
                  <th className="border-b border-zinc-200/70 px-3 py-2">Webset</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => (
                  <tr key={r.id} className="text-zinc-800">
                    <td className="border-b border-zinc-200/70 px-3 py-2">
                      {r.id}
                    </td>
                    <td className="border-b border-zinc-200/70 px-3 py-2">
                      {formatIso(r.startedAtIso)}
                    </td>
                    <td className="border-b border-zinc-200/70 px-3 py-2">
                      {formatDuration(durationMs(r.startedAtIso, r.finishedAtIso))}
                    </td>
                    <td className="border-b border-zinc-200/70 px-3 py-2">
                      <span className="rounded-full bg-zinc-100/80 px-2 py-0.5 text-xs text-zinc-700">
                        {r.sourceMode}
                      </span>
                    </td>
                    <td className="border-b border-zinc-200/70 px-3 py-2">
                      {r.urlsFound}
                    </td>
                    <td className="border-b border-zinc-200/70 px-3 py-2">
                      {r.urlsToProcess}
                    </td>
                    <td className="border-b border-zinc-200/70 px-3 py-2">
                      {r.draftsGenerated}
                    </td>
                    <td className="border-b border-zinc-200/70 px-3 py-2">
                      {r.errorsCount}
                    </td>
                    <td className="border-b border-zinc-200/70 px-3 py-2">
                      {r.storedCount}
                    </td>
                    <td className="border-b border-zinc-200/70 px-3 py-2 font-mono text-xs text-zinc-600">
                      {(r.websetId ?? "-").slice(0, 14)}
                    </td>
                  </tr>
                ))}
                {runs.length === 0 && !loading ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-3 py-6 text-center text-sm text-zinc-600"
                    >
                      Sin datos. Cargá el token y refrescá.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
