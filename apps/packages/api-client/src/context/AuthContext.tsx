"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ApiClientError, onUnauthorized } from "../client";
import { authApi, type SyncInput } from "../endpoints";
import {
  onAuthStateChanged,
  signInWithEmail,
  signOutFirebase,
  signUpWithEmail,
} from "../firebase";
import type { User, UserType } from "../types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginWithEmail: (email: string, password: string) => Promise<User>;
  registerWithEmail: (email: string, password: string, profile: SyncInput) => Promise<User>;
  /** Patches the local profile (e.g. after linking a phone number) and refreshes `user`. */
  completeSync: (profile?: SyncInput) => Promise<User>;
  logout: () => Promise<void>;
  /** Re-checks the local profile for the current Firebase session. Never auto-creates
   * one — resolves to null if the signed-in Firebase user has no matching profile
   * (e.g. a phone number that was never linked to an account). */
  refresh: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({
  children,
  allowedUserTypes,
}: {
  children: ReactNode;
  /** Restricts which account types may hold a session in this app (e.g. customer-web only allows CUSTOMER). */
  allowedUserTypes: UserType[];
}) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // A brand-new Firebase sign-up has no local profile yet — /auth/me 404s until
  // /auth/sync creates it. This holds the form data for whichever code path
  // (the explicit register() call, or the onAuthStateChanged listener firing
  // for the same transition) reaches that 404 branch first.
  const pendingProfileRef = useRef<SyncInput | null>(null);
  // Collapses concurrent loadProfile() calls (explicit action + listener firing
  // for the same auth transition) into a single /auth/me (+ /auth/sync) sequence.
  const syncInFlightRef = useRef<Promise<User | null> | null>(null);

  const signOutLocally = useCallback(async () => {
    await signOutFirebase();
    setUser(null);
  }, []);

  const loadProfile = useCallback((): Promise<User | null> => {
    if (syncInFlightRef.current) return syncInFlightRef.current;

    const promise = (async (): Promise<User | null> => {
      let profile: User;
      try {
        profile = await authApi.me();
      } catch (err) {
        if (!(err instanceof ApiClientError) || err.status !== 404) return null;
        // Only an explicit registerWithEmail() call primes pendingProfileRef — an
        // ordinary sign-in (email or phone) that 404s means no profile exists yet
        // and must NOT be auto-created (e.g. an unrecognized phone number that
        // Firebase happily signed in as a brand-new, unlinked user).
        if (!pendingProfileRef.current) return null;
        const pending = pendingProfileRef.current;
        pendingProfileRef.current = null;
        profile = await authApi.sync(pending);
      }
      if (!allowedUserTypes.includes(profile.userType)) {
        await signOutFirebase();
        return null;
      }
      return profile;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    })();

    syncInFlightRef.current = promise;
    return promise.finally(() => {
      syncInFlightRef.current = null;
    });
  }, []);

  useEffect(() => {
    onUnauthorized(signOutLocally);
    const unsubscribe = onAuthStateChanged((firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      loadProfile()
        .then(setUser)
        .finally(() => setIsLoading(false));
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadProfile, signOutLocally]);

  const loginWithEmail = useCallback(
    async (email: string, password: string) => {
      await signInWithEmail(email, password);
      const profile = await loadProfile();
      if (!profile) throw new Error("This account type cannot access this portal.");
      setUser(profile);
      return profile;
    },
    [loadProfile],
  );

  const registerWithEmail = useCallback(
    async (email: string, password: string, profile: SyncInput) => {
      pendingProfileRef.current = profile;
      await signUpWithEmail(email, password);
      const created = await loadProfile();
      if (!created) throw new Error("This account type cannot access this portal.");
      setUser(created);
      return created;
    },
    [loadProfile],
  );

  const completeSync = useCallback(async (profile?: SyncInput) => {
    const me = await authApi.sync(profile ?? {});
    setUser(me);
    return me;
  }, []);

  const refresh = useCallback(async () => {
    const profile = await loadProfile();
    setUser(profile);
    return profile;
  }, [loadProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      loginWithEmail,
      registerWithEmail,
      completeSync,
      logout: signOutLocally,
      refresh,
    }),
    [user, isLoading, loginWithEmail, registerWithEmail, completeSync, signOutLocally, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
