"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { tokenStorage, onUnauthorized } from "../client";
import { authApi, type RegisterInput } from "../endpoints";
import type { User, UserType } from "../types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => void;
  refresh: () => Promise<void>;
  setUser: (user: User | null) => void;
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

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);

  const hydrate = useCallback(async () => {
    if (!tokenStorage.accessToken) {
      setIsLoading(false);
      return;
    }
    try {
      const me = await authApi.me();
      if (!allowedUserTypes.includes(me.userType)) {
        tokenStorage.clear();
        setUser(null);
      } else {
        setUser(me);
      }
    } catch {
      tokenStorage.clear();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    onUnauthorized(logout);
    hydrate();
  }, [hydrate, logout]);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await authApi.login(email, password);
      if (!allowedUserTypes.includes(result.user.userType)) {
        throw new Error("This account type cannot access this portal.");
      }
      tokenStorage.set(result);
      setUser(result.user);
      return result.user;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const register = useCallback(async (input: RegisterInput) => {
    const result = await authApi.register(input);
    tokenStorage.set(result);
    setUser(result.user);
    return result.user;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, isAuthenticated: !!user, login, register, logout, refresh: hydrate, setUser }),
    [user, isLoading, login, register, logout, hydrate],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
