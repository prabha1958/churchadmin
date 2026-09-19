"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

interface PlatformUser {
    id: number;
    name: string;
    email: string;
    church_id: number;
    role: string;
    must_change_password: boolean;
}

interface PlatformChurch {
    id: number;
    church_code: string;
    church_name: string;
    short_name?: string | null;
    logo?: string | null;
}

export default function PlatformDashboardLayout({
    children,
}: {
    children: ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();

    const [ready, setReady] = useState(false);
    const [user, setUser] = useState<PlatformUser | null>(null);
    const [church, setChurch] = useState<PlatformChurch | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const token = localStorage.getItem("platform_token");
        const userJson = localStorage.getItem("platform_user");
        const churchJson = localStorage.getItem("platform_church");

        if (!token || !userJson || !churchJson) {
            router.replace("/platform/login");
            return;
        }

        try {
            const storedUser = JSON.parse(userJson) as PlatformUser;
            const storedChurch =
                JSON.parse(churchJson) as PlatformChurch;

            if (!storedUser || !storedChurch) {
                throw new Error("Invalid platform session");
            }

            if (storedUser.must_change_password) {
                router.replace("/platform/setup-password");
                return;
            }

            if (storedUser.role !== "setup_admin") {
                localStorage.removeItem("platform_token");
                localStorage.removeItem("platform_user");
                localStorage.removeItem("platform_church");

                router.replace("/platform/login");
                return;
            }

            setUser(storedUser);
            setChurch(storedChurch);
            setReady(true);
        } catch (error) {
            console.error(
                "Invalid platform authentication data:",
                error
            );

            localStorage.removeItem("platform_token");
            localStorage.removeItem("platform_user");
            localStorage.removeItem("platform_church");

            router.replace("/platform/login");
        }
    }, [router, pathname]);

    const handleLogout = () => {
        localStorage.removeItem("platform_token");
        localStorage.removeItem("platform_user");
        localStorage.removeItem("platform_church");

        router.replace("/platform/login");
    };

    if (!ready) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-700" />

                    <p className="text-sm text-slate-500">
                        Loading administration portal...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            {/* Responsive header */}
            <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex min-w-0 items-center gap-3">
                        {/* Mobile menu */}
                        <button
                            type="button"
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 md:hidden"
                            aria-label="Open navigation menu"
                            aria-expanded={menuOpen}
                        >
                            <span className="text-xl">
                                {menuOpen ? "×" : "☰"}
                            </span>
                        </button>

                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white">
                            <span className="text-sm font-bold">CC</span>
                        </div>

                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">
                                Church Community
                            </p>

                            <p className="truncate text-xs text-slate-500">
                                Setup Administration
                            </p>
                        </div>
                    </div>

                    {/* Desktop navigation */}
                    <nav className="hidden items-center gap-1 md:flex">
                        <NavLink
                            href="/platform/dashboard"
                            active={pathname === "/platform/dashboard"}
                        >
                            Dashboard
                        </NavLink>

                        <NavLink
                            href="/platform/dashboard/church"
                            active={pathname.startsWith(
                                "/platform/dashboard/church"
                            )}
                        >
                            Church
                        </NavLink>

                        <NavLink
                            href="/platform/dashboard/members"
                            active={pathname.startsWith(
                                "/platform/dashboard/members"
                            )}
                        >
                            Members
                        </NavLink>

                        <NavLink
                            href="/platform/dashboard/qr"
                            active={pathname.startsWith(
                                "/platform/dashboard/qr"
                            )}
                        >
                            QR Code
                        </NavLink>
                    </nav>

                    {/* Account */}
                    <div className="flex items-center gap-2">
                        <div className="hidden text-right sm:block">
                            <p className="max-w-40 truncate text-sm font-medium">
                                {user?.name}
                            </p>

                            <p className="text-xs text-slate-500">
                                {church?.church_code}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                        >
                            <span className="hidden sm:inline">
                                Sign out
                            </span>
                            <span className="sm:hidden">↪</span>
                        </button>
                    </div>
                </div>

                {/* Mobile navigation */}
                {menuOpen && (
                    <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
                        <nav className="mx-auto flex max-w-7xl flex-col gap-1">
                            <MobileNavLink
                                href="/platform/dashboard"
                                onClick={() => setMenuOpen(false)}
                            >
                                Dashboard
                            </MobileNavLink>

                            <MobileNavLink
                                href="/platform/dashboard/church"
                                onClick={() => setMenuOpen(false)}
                            >
                                Church Setup
                            </MobileNavLink>

                            <MobileNavLink
                                href="/platform/dashboard/members"
                                onClick={() => setMenuOpen(false)}
                            >
                                Members
                            </MobileNavLink>

                            <MobileNavLink
                                href="/platform/dashboard/qr"
                                onClick={() => setMenuOpen(false)}
                            >
                                QR Code
                            </MobileNavLink>

                            <MobileNavLink
                                href="/platform/dashboard/account"
                                onClick={() => setMenuOpen(false)}
                            >
                                Account
                            </MobileNavLink>

                            <MobileNavLink
                                href="/platform/dashboard/help"
                                onClick={() => setMenuOpen(false)}
                            >
                                Help
                            </MobileNavLink>
                        </nav>
                    </div>
                )}
            </header>

            {/* Main content */}
            <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
                {children}
            </main>
        </div>
    );
}

function NavLink({
    href,
    active,
    children,
}: {
    href: string;
    active: boolean;
    children: ReactNode;
}) {
    return (
        <a
            href={href}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${active
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
        >
            {children}
        </a>
    );
}

function MobileNavLink({
    href,
    onClick,
    children,
}: {
    href: string;
    onClick: () => void;
    children: ReactNode;
}) {
    return (
        <a
            href={href}
            onClick={onClick}
            className="rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
            {children}
        </a>
    );
}