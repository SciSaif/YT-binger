"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  fetchMe,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
  type AuthUser,
} from "@/lib/auth-client";

interface AuthState {
  user: AuthUser | null;
  configured: boolean;
  hydrated: boolean;
}

const DEFAULT_STATE: AuthState = {
  user: null,
  configured: true,
  hydrated: false,
};

let clientState: AuthState = { ...DEFAULT_STATE };
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emitChange(): void {
  for (const listener of listeners) {
    listener();
  }
}

function setAuthState(next: Partial<AuthState>): void {
  clientState = { ...clientState, ...next };
  emitChange();
}

function getSnapshot(): AuthState {
  return clientState;
}

function getServerSnapshot(): AuthState {
  return DEFAULT_STATE;
}

let refreshPromise: Promise<void> | null = null;

export async function refreshAuth(): Promise<void> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const data = await fetchMe();
      setAuthState({
        user: data.user,
        configured: data.configured ?? true,
        hydrated: true,
      });
    } catch {
      setAuthState({
        user: null,
        configured: false,
        hydrated: true,
      });
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export function useAuth() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const register = useCallback(async (username: string, password: string) => {
    const user = await registerRequest(username, password);
    setAuthState({ user, hydrated: true, configured: true });
    return user;
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const user = await loginRequest(username, password);
    setAuthState({ user, hydrated: true, configured: true });
    return user;
  }, []);

  const logout = useCallback(async () => {
    await logoutRequest();
    setAuthState({ user: null, hydrated: true });
  }, []);

  return {
    user: state.user,
    configured: state.configured,
    hydrated: state.hydrated,
    register,
    login,
    logout,
    refreshAuth,
  };
}

export function isUserLoggedIn(): boolean {
  return clientState.user !== null;
}

export function getAuthUser(): AuthUser | null {
  return clientState.user;
}
