"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PasswordInput from "@/app/_components/PasswordInput";

const LOGO_URL =
  "https://www.merquellantas.com/assets/images/logo/Logo-Merquellantas.png";

type Mode = "login" | "forgot";

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-white" />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [mode, setMode] = useState<Mode>("login");

  // login
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // forgot password
  const [fpEmail, setFpEmail] = useState("");
  const [fpNew, setFpNew] = useState("");
  const [fpConfirm, setFpConfirm] = useState("");
  const [fpErr, setFpErr] = useState<string | null>(null);
  const [fpMsg, setFpMsg] = useState<string | null>(null);
  const [fpLoading, setFpLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const j = await r.json();
      if (!r.ok) {
        setErr(j.error || "Login failed");
        return;
      }
      router.replace(search.get("next") || "/");
    } finally {
      setLoading(false);
    }
  }

  async function submitForgot(e: React.FormEvent) {
    e.preventDefault();
    setFpErr(null);
    setFpMsg(null);
    if (fpNew.length < 6) {
      setFpErr("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (fpNew !== fpConfirm) {
      setFpErr("Las contraseñas no coinciden");
      return;
    }
    setFpLoading(true);
    try {
      const r = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: fpEmail, newPassword: fpNew }),
      });
      const j = await r.json();
      if (!r.ok) {
        setFpErr(j.error || "No se pudo actualizar");
        return;
      }
      setFpMsg("Contraseña actualizada. Ya puedes ingresar.");
      setUsername(fpEmail);
      setPassword("");
      setFpEmail("");
      setFpNew("");
      setFpConfirm("");
      setTimeout(() => {
        setMode("login");
        setFpMsg(null);
      }, 1500);
    } finally {
      setFpLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-white">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LOGO_URL}
            alt="Merquellantas"
            className="h-16 w-auto object-contain"
          />
        </div>

        {mode === "login" ? (
          <form
            onSubmit={submit}
            className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
          >
            <h1 className="text-xl font-semibold mb-1 text-gray-900">
              Bienvenido
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              Ingresa para consultar inventario
            </p>

            <label className="block text-xs uppercase tracking-wide text-gray-500 mb-1">
              Usuario
            </label>
            <input
              autoFocus
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full mb-4 rounded-lg bg-white border border-gray-300 px-3 py-2 outline-none focus:border-merq-orange focus:ring-1 focus:ring-merq-orange text-gray-900"
            />

            <label className="block text-xs uppercase tracking-wide text-gray-500 mb-1">
              Contraseña
            </label>
            <PasswordInput
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mb-6 rounded-lg bg-white border border-gray-300 px-3 py-2 outline-none focus:border-merq-orange focus:ring-1 focus:ring-merq-orange text-gray-900"
            />

            {err && (
              <div className="text-sm text-red-600 mb-4 bg-red-50 border border-red-200 rounded-lg p-2">
                {err}
              </div>
            )}

            <button
              disabled={loading}
              className="w-full rounded-lg bg-merq-orange text-white font-medium py-2 hover:bg-merq-orange-dark disabled:opacity-50 transition"
            >
              {loading ? "Ingresando…" : "Ingresar"}
            </button>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode("forgot");
                  setErr(null);
                }}
                className="text-xs text-merq-orange hover:text-merq-orange-dark underline-offset-4 hover:underline font-medium"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          </form>
        ) : (
          <form
            onSubmit={submitForgot}
            className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
          >
            <h1 className="text-xl font-semibold mb-1 text-gray-900">
              Restablecer contraseña
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              Ingresa tu email y elige una nueva contraseña
            </p>

            <label className="block text-xs uppercase tracking-wide text-gray-500 mb-1">
              Email
            </label>
            <input
              autoFocus
              type="email"
              autoComplete="email"
              value={fpEmail}
              onChange={(e) => setFpEmail(e.target.value)}
              className="w-full mb-4 rounded-lg bg-white border border-gray-300 px-3 py-2 outline-none focus:border-merq-orange focus:ring-1 focus:ring-merq-orange text-gray-900"
            />

            <label className="block text-xs uppercase tracking-wide text-gray-500 mb-1">
              Nueva contraseña
            </label>
            <PasswordInput
              autoComplete="new-password"
              value={fpNew}
              onChange={(e) => setFpNew(e.target.value)}
              className="w-full mb-4 rounded-lg bg-white border border-gray-300 px-3 py-2 outline-none focus:border-merq-orange focus:ring-1 focus:ring-merq-orange text-gray-900"
            />

            <label className="block text-xs uppercase tracking-wide text-gray-500 mb-1">
              Confirmar contraseña
            </label>
            <PasswordInput
              autoComplete="new-password"
              value={fpConfirm}
              onChange={(e) => setFpConfirm(e.target.value)}
              className="w-full mb-6 rounded-lg bg-white border border-gray-300 px-3 py-2 outline-none focus:border-merq-orange focus:ring-1 focus:ring-merq-orange text-gray-900"
            />

            {fpErr && (
              <div className="text-sm text-red-600 mb-4 bg-red-50 border border-red-200 rounded-lg p-2">
                {fpErr}
              </div>
            )}
            {fpMsg && (
              <div className="text-sm text-green-700 mb-4 bg-green-50 border border-green-200 rounded-lg p-2">
                {fpMsg}
              </div>
            )}

            <button
              disabled={fpLoading}
              className="w-full rounded-lg bg-merq-orange text-white font-medium py-2 hover:bg-merq-orange-dark disabled:opacity-50 transition"
            >
              {fpLoading ? "Actualizando…" : "Actualizar contraseña"}
            </button>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setFpErr(null);
                  setFpMsg(null);
                }}
                className="text-xs text-gray-500 hover:text-gray-800 underline-offset-4 hover:underline"
              >
                ← Volver al ingreso
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
