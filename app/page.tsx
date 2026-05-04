"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

const LOGO_URL =
  "https://www.merquellantas.com/assets/images/logo/Logo-Merquellantas.png";

interface Me {
  username: string;
  role: "master" | "user";
}
interface Item {
  articleNum: string;
  brand: string;
  description: string;
  available: string | null; // null = not fetched yet, "error" = fetch failed
  warehouse: string;
  shown: boolean; // whether the row has been clicked / revealed
}
interface DebugInfo {
  triggered?: boolean;
  triggerReason?: string;
  haveSearchResults?: boolean;
  searching?: boolean;
  resultCount?: number;
  tireSearchType?: string;
  freeTextSearch?: string;
}

export default function HomePage() {
  const [me, setMe] = useState<Me | null>(null);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Item[] | null>(null);
  const [searchedQuery, setSearchedQuery] = useState<string>("");
  const [elapsed, setElapsed] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [debug, setDebug] = useState<DebugInfo | null>(null);
  const itemsRef = useRef<Item[] | null>(null);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((j) => setMe(j.user));
    fetch("/api/conti/warm", { method: "POST" }).catch(() => {});
  }, []);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setErr(null);
    setItems(null);
    setElapsed(null);
    setDebug(null);
    setLoading(true);
    const t0 = performance.now();

    try {
      const r = await fetch("/api/conti/lookup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const j = await r.json();
      if (!r.ok) {
        setErr(j.error || `HTTP ${r.status}`);
        return;
      }
      setDebug(j.debug || null);
      setSearchedQuery(query);
      setItems(
        (j.items || []).map((m: any) => ({
          articleNum: m.articleNum,
          brand: m.brand,
          description: m.description,
          available: null,
          warehouse: "",
          shown: false,
        }))
      );
      setElapsed(Math.round(performance.now() - t0));
    } catch (e: any) {
      setErr(e?.message || "Conexión perdida");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    location.href = "/login";
  }

  async function reveal(articleNum: string) {
    const cur = itemsRef.current?.find((x) => x.articleNum === articleNum);
    if (!cur) return;

    setItems((prev) =>
      prev
        ? prev.map((it) =>
            it.articleNum === articleNum ? { ...it, shown: true } : it
          )
        : prev
    );

    if (cur.available !== null && cur.available !== "error") return;

    try {
      const r = await fetch("/api/conti/availability", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ articleNum, query: searchedQuery }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
      setItems((prev) =>
        prev
          ? prev.map((it) =>
              it.articleNum === articleNum
                ? {
                    ...it,
                    available: j.available || "—",
                    warehouse: j.warehouse || "",
                  }
                : it
            )
          : prev
      );
    } catch {
      setItems((prev) =>
        prev
          ? prev.map((it) =>
              it.articleNum === articleNum
                ? { ...it, available: "error", warehouse: "" }
                : it
            )
          : prev
      );
    }
  }

  async function revealAll() {
    const snapshot = itemsRef.current;
    if (!snapshot) return;
    for (const it of snapshot) {
      if (it.shown) continue;
      // eslint-disable-next-line no-await-in-loop
      await reveal(it.articleNum);
    }
  }

  const filtered = useMemo(() => {
    if (!items) return null;
    const f = filter.trim().toLowerCase();
    if (!f) return items;
    return items.filter((i) =>
      [i.articleNum, i.brand, i.description, i.warehouse]
        .join(" ")
        .toLowerCase()
        .includes(f)
    );
  }, [items, filter]);

  const cachedCount = items
    ? items.filter((i) => i.available !== null && i.available !== "error")
        .length
    : 0;
  const pendingShownCount = items
    ? items.filter((i) => i.shown && i.available === null).length
    : 0;

  return (
    <main className="min-h-screen bg-white">
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LOGO_URL}
            alt="Merquellantas"
            className="h-9 w-auto object-contain"
          />
          <span className="text-xs text-gray-500 hidden sm:inline">
            Inventario
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {me && (
            <span className="text-gray-600 break-all">
              {me.username}
              {me.role === "master" && (
                <span className="ml-2 rounded bg-merq-orange/20 text-merq-orange-dark px-1.5 py-0.5 text-[10px] uppercase tracking-wide font-semibold">
                  master
                </span>
              )}
            </span>
          )}
          {me?.role === "master" && (
            <Link
              href="/admin"
              className="text-merq-orange hover:text-merq-orange-dark font-medium underline-offset-4 hover:underline"
            >
              Usuarios
            </Link>
          )}
          <button
            onClick={logout}
            className="text-gray-500 hover:text-gray-900"
          >
            Salir
          </button>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-6 pt-10">
        <form onSubmit={run} className="flex gap-2">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ej. 29580225"
            className="flex-1 rounded-xl bg-white border border-gray-300 px-4 py-3 outline-none focus:border-merq-orange focus:ring-1 focus:ring-merq-orange text-base text-gray-900 placeholder-gray-400"
          />
          <button
            disabled={loading || !query.trim()}
            className="rounded-xl bg-merq-orange text-white font-medium px-6 disabled:opacity-50 hover:bg-merq-orange-dark transition"
          >
            {loading ? "Buscando…" : "Buscar"}
          </button>
        </form>

        {err && (
          <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start justify-between gap-3">
            <span className="break-words">{err}</span>
            <a
              href="/api/conti/debug?view=image"
              target="_blank"
              rel="noreferrer"
              className="shrink-0 text-xs text-red-600 underline-offset-4 hover:underline"
            >
              ver captura →
            </a>
          </div>
        )}

        {items && !err && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
              <h2 className="text-xs uppercase tracking-wide text-gray-500">
                {items.length} resultado{items.length === 1 ? "" : "s"}
                {items.length > 0 && cachedCount > 0 && (
                  <span className="ml-2 text-gray-400">
                    · {cachedCount} en caché
                  </span>
                )}
                {pendingShownCount > 0 && (
                  <span className="ml-2 text-merq-orange animate-pulse">
                    cargando {pendingShownCount}
                  </span>
                )}
                {elapsed != null && (
                  <span className="ml-2 text-gray-400">
                    · {(elapsed / 1000).toFixed(1)}s
                  </span>
                )}
              </h2>
              {items.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={revealAll}
                    className="text-xs rounded-lg border border-merq-orange text-merq-orange-dark bg-white hover:bg-merq-orange/10 px-3 py-1.5 font-medium"
                  >
                    Mostrar todo
                  </button>
                  <input
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="filtrar resultados…"
                    className="text-sm rounded-lg bg-white border border-gray-300 px-3 py-1.5 outline-none focus:border-merq-orange focus:ring-1 focus:ring-merq-orange w-56 text-gray-900 placeholder-gray-400"
                  />
                </div>
              )}
            </div>

            {items.length === 0 ? (
              <div className="space-y-3">
                <p className="text-gray-500">Sin resultados.</p>
                {debug && (
                  <pre className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3 overflow-x-auto">
{`triggerReason:    ${debug.triggerReason ?? "—"}
freeTextSearch:   ${debug.freeTextSearch ?? "—"}
tireSearchType:   ${debug.tireSearchType || "(ninguno)"}
resultCount:      ${debug.resultCount ?? 0}
haveSearchResults:${String(debug.haveSearchResults ?? false)}`}
                  </pre>
                )}
                <a
                  href="/api/conti/debug?view=image"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block text-xs text-gray-500 hover:text-gray-900 underline-offset-4 hover:underline"
                >
                  ver captura del navegador →
                </a>
              </div>
            ) : (
              <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
                <div className="grid grid-cols-[140px_110px_1fr_140px_80px] gap-4 px-4 py-2 text-xs uppercase tracking-wide text-gray-500 bg-gray-50 border-b border-gray-200">
                  <div>Artículo</div>
                  <div>Descripción</div>
                  <div className="text-right">Disponible</div>
                  <div className="text-right">Bodega</div>
                </div>
                {(filtered || []).map((it) => {
                  const cached =
                    it.available !== null && it.available !== "error";
                  const errored = it.available === "error";
                  const n = parseInt(it.available || "", 10);
                  const positive = !isNaN(n) && n > 0;
                  return (
                    <div
                      key={it.articleNum}
                      className="grid grid-cols-[140px_110px_1fr_140px_80px] gap-4 px-4 py-3 border-t first:border-t-0 border-gray-100 items-center"
                    >
                      <div className="font-mono text-sm text-gray-900">
                        {it.articleNum}
                      </div>
                      <div className="text-sm text-gray-800 break-words">
                        {it.description}
                      </div>
                      <div className="text-right">
                        {!it.shown ? (
                          <button
                            onClick={() => reveal(it.articleNum)}
                            className={
                              "text-xs rounded-lg px-3 py-1.5 border transition font-medium " +
                              (cached
                                ? "border-merq-orange bg-merq-orange/10 text-merq-orange-dark hover:bg-merq-orange/20"
                                : "border-gray-300 bg-white text-gray-700 hover:border-merq-orange hover:text-merq-orange-dark")
                            }
                          >
                            {cached ? "Ver" : "Mostrar"}
                          </button>
                        ) : errored ? (
                          <button
                            onClick={() => reveal(it.articleNum)}
                            className="text-xs rounded-lg px-3 py-1.5 border border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
                          >
                            reintentar
                          </button>
                        ) : !cached ? (
                          <span className="inline-flex items-center gap-2 text-xs text-gray-500">
                            <span className="inline-block h-3 w-8 rounded bg-gray-200 animate-pulse" />
                            cargando
                          </span>
                        ) : (
                          <span
                            className={
                              "font-mono text-base " +
                              (positive
                                ? "text-merq-orange-dark font-semibold"
                                : "text-gray-400")
                            }
                          >
                            {it.available || "—"}
                          </span>
                        )}
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        {it.shown && cached ? it.warehouse || "—" : ""}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
