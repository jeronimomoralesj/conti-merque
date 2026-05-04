"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import PasswordInput from "@/app/_components/PasswordInput";

const LOGO_URL =
  "https://www.merquellantas.com/assets/images/logo/Logo-Merquellantas.png";

interface UserRow {
  id: string;
  username: string;
  role: "master" | "user";
  createdAt: string;
  createdBy: string | null;
}

export default function AdminPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // form
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [role, setRole] = useState<"master" | "user">("user");
  const [creating, setCreating] = useState(false);

  // change password
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [pwMsg, setPwMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const r = await fetch("/api/users");
    const j = await r.json();
    if (!r.ok) setErr(j.error || "Error");
    else setUsers(j.users);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setCreating(true);
    try {
      const r = await fetch("/api/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: u, password: p, role }),
      });
      const j = await r.json();
      if (!r.ok) {
        setErr(j.error || "Error");
        return;
      }
      setU("");
      setP("");
      setRole("user");
      load();
    } finally {
      setCreating(false);
    }
  }

  async function del(id: string, username: string) {
    if (!confirm(`Eliminar usuario "${username}"?`)) return;
    const r = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      alert(j.error || "Error");
      return;
    }
    load();
  }

  async function reset(id: string, username: string) {
    const np = prompt(`Nueva contraseña para "${username}" (min 6):`);
    if (!np) return;
    if (np.length < 6) {
      alert("Mínimo 6 caracteres");
      return;
    }
    const r = await fetch(`/api/users/${id}/reset-password`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ newPassword: np }),
    });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      alert(j.error || "Error");
      return;
    }
    alert("Contraseña restablecida");
  }

  async function changePw(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    const r = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ currentPassword: cur, newPassword: next }),
    });
    const j = await r.json();
    if (!r.ok) setPwMsg(j.error || "Error");
    else {
      setPwMsg("Contraseña actualizada");
      setCur("");
      setNext("");
    }
  }

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
          <h1 className="text-base font-semibold text-gray-900">Usuarios</h1>
          <Link
            href="/"
            className="text-sm text-merq-orange hover:text-merq-orange-dark underline-offset-4 hover:underline font-medium"
          >
            ← volver
          </Link>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-6 py-8 space-y-10">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm uppercase tracking-wide text-gray-500 mb-4">
            Crear usuario
          </h2>
          <form onSubmit={create} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              placeholder="usuario"
              value={u}
              onChange={(e) => setU(e.target.value)}
              className="rounded-lg bg-white border border-gray-300 px-3 py-2 outline-none focus:border-merq-orange focus:ring-1 focus:ring-merq-orange text-gray-900 placeholder-gray-400"
            />
            <PasswordInput
              placeholder="contraseña"
              value={p}
              onChange={(e) => setP(e.target.value)}
              className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 outline-none focus:border-merq-orange focus:ring-1 focus:ring-merq-orange text-gray-900 placeholder-gray-400"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "master" | "user")}
              className="rounded-lg bg-white border border-gray-300 px-3 py-2 outline-none focus:border-merq-orange focus:ring-1 focus:ring-merq-orange text-gray-900"
            >
              <option value="user">user</option>
              <option value="master">master</option>
            </select>
            <button
              disabled={creating}
              className="rounded-lg bg-merq-orange text-white font-medium py-2 disabled:opacity-50 hover:bg-merq-orange-dark transition"
            >
              {creating ? "Creando…" : "Crear"}
            </button>
          </form>
          {err && (
            <p className="mt-3 text-sm text-red-600">{err}</p>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
          <div className="grid grid-cols-[1fr_90px_120px_180px] gap-4 px-4 py-2 text-xs uppercase tracking-wide text-gray-500 bg-gray-50 border-b border-gray-200">
            <div>Usuario</div>
            <div>Rol</div>
            <div>Creado</div>
            <div className="text-right">Acciones</div>
          </div>
          {loading ? (
            <div className="p-4 text-gray-500 text-sm">Cargando…</div>
          ) : (
            users.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-[1fr_90px_120px_180px] gap-4 px-4 py-3 border-t border-gray-100 items-center"
              >
                <div className="text-sm break-all text-gray-900">
                  {row.username}
                </div>
                <div className="text-xs">
                  {row.role === "master" ? (
                    <span className="rounded bg-merq-orange/20 text-merq-orange-dark px-1.5 py-0.5 uppercase tracking-wide font-semibold">
                      master
                    </span>
                  ) : (
                    <span className="text-gray-500">user</span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(row.createdAt).toLocaleDateString()}
                </div>
                <div className="flex justify-end gap-3 text-xs">
                  <button
                    onClick={() => reset(row.id, row.username)}
                    className="text-merq-orange hover:text-merq-orange-dark font-medium"
                  >
                    Restablecer
                  </button>
                  <button
                    onClick={() => del(row.id, row.username)}
                    className="text-red-600 hover:text-red-700 font-medium"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm uppercase tracking-wide text-gray-500 mb-4">
            Cambiar mi contraseña
          </h2>
          <form
            onSubmit={changePw}
            className="grid grid-cols-1 md:grid-cols-3 gap-3"
          >
            <PasswordInput
              placeholder="actual"
              value={cur}
              onChange={(e) => setCur(e.target.value)}
              className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 outline-none focus:border-merq-orange focus:ring-1 focus:ring-merq-orange text-gray-900 placeholder-gray-400"
            />
            <PasswordInput
              placeholder="nueva"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 outline-none focus:border-merq-orange focus:ring-1 focus:ring-merq-orange text-gray-900 placeholder-gray-400"
            />
            <button className="rounded-lg bg-merq-orange text-white font-medium py-2 hover:bg-merq-orange-dark transition">
              Actualizar
            </button>
          </form>
          {pwMsg && (
            <p className="mt-3 text-sm text-gray-700">{pwMsg}</p>
          )}
        </div>
      </section>
    </main>
  );
}
