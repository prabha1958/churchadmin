"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "../components/sidebar";
import { useAuth } from "../context/auth-provider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { token, member, churchCode, loading, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!token || !member || !churchCode) {
      router.replace("/");
      return;
    }
    if (!isAdmin) router.replace("/");
  }, [loading, token, member, churchCode, isAdmin, router]);

  if (loading || !token || !member || !churchCode || !isAdmin) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-center text-sm text-slate-600">Checking administrator session...</div>;
  }

  return <div className="min-h-screen bg-slate-50">
    <Sidebar />
    <main className="min-w-0 pt-14 md:ml-64 md:pt-0 lg:ml-72">
      <div className="mx-auto w-full max-w-[1600px] px-3 py-4 sm:px-5 sm:py-6 lg:px-8">{children}</div>
    </main>
  </div>;
}
