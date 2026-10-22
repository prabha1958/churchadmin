"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const API_BASE_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api").replace(/\/$/, "");
const TOKEN_KEY = "cwcr_token";
const MEMBER_KEY = "cwcr_member";
const CHURCH_CODE_KEY = "cwcr_church_code";

export interface Member {
  id: number;
  first_name: string | null;
  last_name: string | null;
  role: string | null;
  profile_photo?: string | null;
  [key: string]: any;
}

interface AuthContextValue {
  token: string | null;
  member: Member | null;
  churchCode: string | null;
  loading: boolean;
  isAdmin: boolean;
  login: (token: string, member: Member, churchCode?: string) => void;
  logout: () => Promise<void>;
  refreshFromStorage: () => void;
  setChurchCode: (code: string) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [churchCode, setChurchCodeState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshFromStorage = useCallback(() => {
    if (typeof window === "undefined") return;
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedMember = localStorage.getItem(MEMBER_KEY);
    const storedChurchCode = localStorage.getItem(CHURCH_CODE_KEY);
    setChurchCodeState(storedChurchCode);
    if (!storedToken || !storedMember || !storedChurchCode) {
      setToken(null);
      setMember(null);
      setLoading(false);
      return;
    }
    try {
      setToken(storedToken);
      setMember(JSON.parse(storedMember) as Member);
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(MEMBER_KEY);
      setToken(null);
      setMember(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refreshFromStorage(); }, [refreshFromStorage]);

  const setChurchCode = (code: string) => {
    const normalized = code.trim().toUpperCase();
    if (typeof window !== "undefined") {
      if (normalized) localStorage.setItem(CHURCH_CODE_KEY, normalized);
      else localStorage.removeItem(CHURCH_CODE_KEY);
    }
    setChurchCodeState(normalized || null);
  };

  const login = (newToken: string, newMember: Member, code?: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, newToken);
      localStorage.setItem(MEMBER_KEY, JSON.stringify(newMember));
      const resolvedCode = (code || localStorage.getItem(CHURCH_CODE_KEY) || "").trim().toUpperCase();
      if (resolvedCode) localStorage.setItem(CHURCH_CODE_KEY, resolvedCode);
      setChurchCodeState(resolvedCode || null);
    }
    setToken(newToken);
    setMember(newMember);
  };

  const logout = async () => {
    if (typeof window === "undefined") return;
    const code = localStorage.getItem(CHURCH_CODE_KEY);
    try {
      if (token) {
        await fetch(`${API_BASE_URL}/logout`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            ...(code ? { "X-Church-Code": code } : {}),
          },
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(MEMBER_KEY);
      setToken(null);
      setMember(null);
    }
  };

  const role = (member?.role || "").toLowerCase();
  const value: AuthContextValue = {
    token, member, churchCode, loading,
    isAdmin: role === "admin" || role === "super_admin",
    login, logout, refreshFromStorage, setChurchCode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
