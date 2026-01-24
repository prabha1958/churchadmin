"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from "react";

const API_BASE_URL = "http://localhost:8000/api";

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
    loading: boolean;
    isAdmin: boolean;
    login: (token: string, member: Member) => void;
    logout: () => Promise<void>;
    refreshFromStorage: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(null);
    const [member, setMember] = useState<Member | null>(null);
    const [loading, setLoading] = useState(true);

    // Load from localStorage on first mount
    useEffect(() => {
        refreshFromStorage();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const refreshFromStorage = () => {
        if (typeof window === "undefined") return;

        const storedToken = localStorage.getItem("cwcr_token");
        const storedMember = localStorage.getItem("cwcr_member");

        if (!storedToken || !storedMember) {
            setToken(null);
            setMember(null);
            setLoading(false);
            return;
        }

        try {
            const parsed: Member = JSON.parse(storedMember);
            setToken(storedToken);
            setMember(parsed);
        } catch {
            setToken(null);
            setMember(null);
        } finally {
            setLoading(false);
        }
    };

    const login = (newToken: string, newMember: Member) => {
        if (typeof window !== "undefined") {
            localStorage.setItem("cwcr_token", newToken);
            localStorage.setItem("cwcr_member", JSON.stringify(newMember));
        }
        setToken(newToken);
        setMember(newMember);
    };

    const logout = async () => {
        if (typeof window === "undefined") return;

        try {
            if (token) {
                await fetch(`${API_BASE_URL}/logout`, {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });
            }
        } catch (error) {
            console.error("Logout error:", error);
        }

        localStorage.removeItem("cwcr_token");
        localStorage.removeItem("cwcr_member");
        setToken(null);
        setMember(null);
    };

    const role = (member?.role || "").toLowerCase();
    const isAdmin = role === "admin" || role === "super_admin";

    const value: AuthContextValue = {
        token,
        member,
        loading,
        isAdmin,
        login,
        logout,
        refreshFromStorage,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used inside <AuthProvider>");
    }
    return ctx;
}
