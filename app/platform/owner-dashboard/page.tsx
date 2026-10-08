"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import {
    Building2,
    ClipboardList,
    CheckCircle2,
    CreditCard,
    LogOut,
    Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";

type DashboardStats = {
    pendingRequests: number;
    approvedRequests: number;
    activeChurches: number;
    totalLicenses: number;
};

export default function OwnerDashboardPage() {
    const router = useRouter();

    const [stats, setStats] = useState<DashboardStats>({
        pendingRequests: 0,
        approvedRequests: 0,
        activeChurches: 0,
        totalLicenses: 0,
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("platform_token");

        if (!token) {
            router.replace("/platform/login");
            return;
        }

        loadDashboard(token);
    }, [router]);

    const loadDashboard = async (token: string) => {
        try {
            setLoading(true);

            const headers = {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            };

            const [
                pendingResponse,
                approvedResponse,
                licensesResponse,
            ] = await Promise.all([
                fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/platform/church-registration-requests?status=pending`,
                    { headers }
                ),

                fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/platform/church-registration-requests?status=approved`,
                    { headers }
                ),

                fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/platform/licenses`,
                    { headers }
                ),
            ]);

            if (
                !pendingResponse.ok ||
                !approvedResponse.ok ||
                !licensesResponse.ok
            ) {
                throw new Error(
                    "Unable to load platform dashboard."
                );
            }

            const pendingData = await pendingResponse.json();
            const approvedData = await approvedResponse.json();
            const licensesData = await licensesResponse.json();

            setStats({
                pendingRequests:
                    pendingData?.data?.requests?.total ?? 0,

                approvedRequests:
                    approvedData?.data?.requests?.total ?? 0,

                activeChurches: 0,

                totalLicenses:
                    licensesData?.data?.licenses?.total ??
                    licensesData?.data?.total ??
                    0,
            });
        } catch (error) {
            console.error(
                "Owner dashboard error:",
                error
            );
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("platform_token");
        localStorage.removeItem("platform_user");
        localStorage.removeItem("platform_role");
        localStorage.removeItem("platform_church");

        router.replace("/platform/login");
    };

    return (
        <main className="min-h-screen bg-slate-100">
            {/* Header */}
            <header className="bg-[#191970] text-white shadow-md">
                <div className="mx-auto max-w-7xl px-6 py-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold">
                                Platform Owner Dashboard
                            </h1>

                            <p className="mt-1 text-sm text-white/70">
                                Church Community Platform Administration
                            </p>
                        </div>

                        <Button
                            variant="outline"
                            onClick={handleLogout}
                            className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign Out
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main */}
            <div className="mx-auto max-w-7xl px-6 py-8">
                {/* Welcome */}
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-slate-900">
                        Platform Overview
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Manage churches, registration requests and
                        licenses from one place.
                    </p>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Pending Requests */}
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <CardTitle className="text-sm font-medium text-slate-600">
                                Pending Requests
                            </CardTitle>

                            <ClipboardList className="h-5 w-5 text-amber-600" />
                        </CardHeader>

                        <CardContent>
                            <div className="text-3xl font-bold text-slate-900">
                                {loading
                                    ? "..."
                                    : stats.pendingRequests}
                            </div>

                            <p className="mt-1 text-xs text-slate-500">
                                Churches awaiting approval
                            </p>
                        </CardContent>
                    </Card>

                    {/* Approved Requests */}
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <CardTitle className="text-sm font-medium text-slate-600">
                                Approved Requests
                            </CardTitle>

                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                        </CardHeader>

                        <CardContent>
                            <div className="text-3xl font-bold text-slate-900">
                                {loading
                                    ? "..."
                                    : stats.approvedRequests}
                            </div>

                            <p className="mt-1 text-xs text-slate-500">
                                Registration requests approved
                            </p>
                        </CardContent>
                    </Card>

                    {/* Active Churches */}
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <CardTitle className="text-sm font-medium text-slate-600">
                                Active Churches
                            </CardTitle>

                            <Building2 className="h-5 w-5 text-[#191970]" />
                        </CardHeader>

                        <CardContent>
                            <div className="text-3xl font-bold text-slate-900">
                                {loading
                                    ? "..."
                                    : stats.activeChurches}
                            </div>

                            <p className="mt-1 text-xs text-slate-500">
                                Churches currently provisioned
                            </p>
                        </CardContent>
                    </Card>

                    {/* Licenses */}
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <CardTitle className="text-sm font-medium text-slate-600">
                                Licenses
                            </CardTitle>

                            <CreditCard className="h-5 w-5 text-[#b8860b]" />
                        </CardHeader>

                        <CardContent>
                            <div className="text-3xl font-bold text-slate-900">
                                {loading
                                    ? "..."
                                    : stats.totalLicenses}
                            </div>

                            <p className="mt-1 text-xs text-slate-500">
                                Platform licenses
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Management Section */}
                <div className="mt-10">
                    <h2 className="mb-5 text-lg font-semibold text-slate-900">
                        Platform Management
                    </h2>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {/* Registration Requests */}
                        <Card
                            className="cursor-pointer border-slate-200 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                            onClick={() =>
                                router.push(
                                    "/platform/church-registration-requests"
                                )
                            }
                        >
                            <CardContent className="p-6">
                                <ClipboardList className="mb-4 h-8 w-8 text-[#191970]" />

                                <h3 className="font-semibold text-slate-900">
                                    Church Registration Requests
                                </h3>

                                <p className="mt-2 text-sm text-slate-500">
                                    Review, approve or reject new church
                                    registration requests.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Churches */}
                        <Card
                            className="cursor-pointer border-slate-200 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                            onClick={() =>
                                router.push(
                                    "/platform/churches"
                                )
                            }
                        >
                            <CardContent className="p-6">
                                <Building2 className="mb-4 h-8 w-8 text-[#191970]" />

                                <h3 className="font-semibold text-slate-900">
                                    Churches
                                </h3>

                                <p className="mt-2 text-sm text-slate-500">
                                    View and manage provisioned churches
                                    on the platform.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Licenses */}
                        <Card
                            className="cursor-pointer border-slate-200 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                            onClick={() =>
                                router.push(
                                    "/platform/licenses"
                                )
                            }
                        >
                            <CardContent className="p-6">
                                <CreditCard className="mb-4 h-8 w-8 text-[#b8860b]" />

                                <h3 className="font-semibold text-slate-900">
                                    Licenses
                                </h3>

                                <p className="mt-2 text-sm text-slate-500">
                                    Manage church licenses, renewals,
                                    suspension and cancellation.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Platform Users */}
                        <Card
                            className="cursor-pointer border-slate-200 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                            onClick={() =>
                                router.push(
                                    "/platform/users"
                                )
                            }
                        >
                            <CardContent className="p-6">
                                <Users className="mb-4 h-8 w-8 text-[#191970]" />

                                <h3 className="font-semibold text-slate-900">
                                    Platform Users
                                </h3>

                                <p className="mt-2 text-sm text-slate-500">
                                    Manage platform owners and setup
                                    administrators.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </main>
    );
}