"use client";

import { FormEvent, useEffect, useState, useSyncExternalStore } from "react";
import { pullAndMergeCloudData } from "@/lib/cloud-sync-login";
import { getLastSyncError, subscribeSyncErrors } from "@/lib/cloud-sync";
import { refreshAuth, useAuth } from "@/lib/use-auth";

type AuthMode = "login" | "register";

export function CloudSyncSection() {
  const { user, configured, hydrated, login, register, logout } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );

  const syncError = useSyncExternalStore(
    subscribeSyncErrors,
    getLastSyncError,
    () => null,
  );

  useEffect(() => {
    void refreshAuth();
  }, []);

  useEffect(() => {
    if (syncError) {
      setMessage({ type: "error", text: syncError });
    }
  }, [syncError]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setBusy(true);

    try {
      if (mode === "register") {
        await register(username, password);
      } else {
        await login(username, password);
      }

      await pullAndMergeCloudData();
      setUsername("");
      setPassword("");
      setMessage({
        type: "success",
        text:
          mode === "register"
            ? "Account created. Your data is synced to the cloud."
            : "Logged in. Local and cloud data have been merged.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Authentication failed.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    setMessage(null);
    setBusy(true);
    try {
      await logout();
      setMessage({
        type: "success",
        text: "Logged out. Your data remains saved locally in this browser.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Logout failed.",
      });
    } finally {
      setBusy(false);
    }
  }

  if (!hydrated) {
    return (
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="text-lg font-semibold text-white">Cloud sync</h2>
        <p className="mt-2 text-sm text-zinc-400">Loading account status…</p>
      </section>
    );
  }

  if (!configured) {
    return (
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="text-lg font-semibold text-white">Cloud sync</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Cloud sync is not available on this deployment.
        </p>
      </section>
    );
  }

  if (user) {
    return (
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="text-lg font-semibold text-white">Cloud sync</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Signed in as{" "}
          <span className="font-medium text-zinc-200">{user.username}</span>.
          Watch progress and visited channels sync to the cloud automatically.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <span className="inline-flex items-center rounded-lg border border-emerald-900/50 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-300">
            Synced to cloud
          </span>
          <button
            type="button"
            onClick={handleLogout}
            disabled={busy}
            className="rounded-lg border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100 disabled:opacity-50"
          >
            Log out
          </button>
        </div>

        {message ? (
          <p
            role="status"
            className={`mt-4 rounded-lg px-3 py-2 text-sm ${
              message.type === "success"
                ? "border border-emerald-900/50 bg-emerald-950/30 text-emerald-300"
                : "border border-red-900/50 bg-red-950/30 text-red-300"
            }`}
          >
            {message.text}
          </p>
        ) : null}
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
      <h2 className="text-lg font-semibold text-white">Cloud sync</h2>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">
        Optional account to back up watch progress and visited channels. Data
        always saves locally; when signed in, it also syncs to the cloud.
      </p>

      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={() => {
            setMode("login");
            setMessage(null);
          }}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            mode === "login"
              ? "bg-zinc-100 text-zinc-900"
              : "border border-zinc-700 text-zinc-300 hover:border-zinc-500"
          }`}
        >
          Log in
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("register");
            setMessage(null);
          }}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            mode === "register"
              ? "bg-zinc-100 text-zinc-900"
              : "border border-zinc-700 text-zinc-300 hover:border-zinc-500"
          }`}
        >
          Register
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label htmlFor="cloud-username" className="block text-sm text-zinc-300">
            Username
          </label>
          <input
            id="cloud-username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 outline-none ring-zinc-500 focus:ring-2"
            required
          />
        </div>
        <div>
          <label htmlFor="cloud-password" className="block text-sm text-zinc-300">
            Password
          </label>
          <input
            id="cloud-password"
            type="password"
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 outline-none ring-zinc-500 focus:ring-2"
            required
            minLength={6}
          />
          <p className="mt-1.5 text-xs text-zinc-500">
            Password must be at least 6 characters.
          </p>
        </div>
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-50"
        >
          {busy ? "Please wait…" : mode === "register" ? "Create account" : "Log in"}
        </button>
      </form>

      {message ? (
        <p
          role="status"
          className={`mt-4 rounded-lg px-3 py-2 text-sm ${
            message.type === "success"
              ? "border border-emerald-900/50 bg-emerald-950/30 text-emerald-300"
              : "border border-red-900/50 bg-red-950/30 text-red-300"
          }`}
        >
          {message.text}
        </p>
      ) : null}
    </section>
  );
}
