"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    completePlatformOnboarding,
    getPlatformChurch,
} from "@/lib/platform-api";

interface PlatformChurch {
    id: number;
    church_code: string;
    church_name: string;
    short_name?: string | null;
    logo?: string | null;
    status?: string;
    activated_at?: string | null;
}

interface PlatformUser {
    name: string;
    email: string;
}

export default function PlatformDashboardPage() {
    const [church, setChurch] =
        useState<PlatformChurch | null>(null);

    const [user, setUser] =
        useState<PlatformUser | null>(null);

    const [completing, setCompleting] =
        useState(false);

    const [completionError, setCompletionError] =
        useState<string | null>(null);


    useEffect(() => {
        if (typeof window === "undefined") return;

        const loadDashboard = async () => {
            try {
                const userJson =
                    localStorage.getItem("platform_user");

                if (userJson) {
                    setUser(JSON.parse(userJson));
                }

                const result = await getPlatformChurch();

                const currentChurch = result.data.church;

                setChurch(currentChurch);

                localStorage.setItem(
                    "platform_church",
                    JSON.stringify(currentChurch)
                );
            } catch (error) {
                console.error(
                    "Unable to load platform dashboard data:",
                    error
                );

                // Fall back to cached church information
                try {
                    const churchJson =
                        localStorage.getItem("platform_church");

                    if (churchJson) {
                        setChurch(JSON.parse(churchJson));
                    }
                } catch (storageError) {
                    console.error(
                        "Unable to load cached church data:",
                        storageError
                    );
                }
            }
        };

        loadDashboard();
    }, []);

    const handleCompleteOnboarding = async () => {
        if (completing) return;

        setCompleting(true);
        setCompletionError(null);

        try {
            const result = await completePlatformOnboarding();

            const updatedChurch = result.data.church;

            setChurch(updatedChurch);

            localStorage.setItem(
                "platform_church",
                JSON.stringify(updatedChurch)
            );
        } catch (error) {
            console.error(
                "Unable to complete church onboarding:",
                error
            );

            setCompletionError(
                error instanceof Error
                    ? error.message
                    : "Unable to complete church onboarding."
            );
        } finally {
            setCompleting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Welcome */}
            <section>
                <p className="text-sm font-medium text-slate-500">
                    Setup Administration
                </p>

                <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                    Welcome{user?.name ? `, ${user.name}` : ""}
                </h1>

                {church && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="font-medium text-slate-700">
                            {church.church_name}
                        </span>

                        <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">
                            Code: {church.church_code}
                        </span>

                        {church.status && (
                            <span
                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${church.status === "active"
                                        ? "bg-green-100 text-green-700"
                                        : "bg-amber-100 text-amber-700"
                                    }`}
                            >
                                {church.status === "active"
                                    ? "Active"
                                    : "Setup"}
                            </span>
                        )}
                    </div>
                )}
            </section>

            {/* Setup status */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <p className="text-sm font-semibold text-slate-900">
                                Church setup
                            </p>

                            {church?.status && (
                                <span
                                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${church.status === "active"
                                        ? "bg-green-100 text-green-700"
                                        : "bg-amber-100 text-amber-700"
                                        }`}
                                >
                                    {church.status === "active"
                                        ? "Active"
                                        : "Setup in progress"}
                                </span>
                            )}
                        </div>

                        <p className="mt-1 text-sm text-slate-500">
                            Complete your church information and prepare
                            the app for your members.
                        </p>
                    </div>

                    {church?.status !== "active" && (
                        <Link
                            href="/platform/dashboard/church"
                            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                        >
                            Continue Setup
                        </Link>
                    )}
                </div>

                <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                        className={`h-full rounded-full ${church?.status === "active"
                            ? "w-full bg-green-600"
                            : "w-[80%] bg-slate-800"
                            }`}
                    />
                </div>

                <div className="mt-4">
                    {church?.status === "active" ? (
                        <p className="text-sm font-medium text-green-700">
                            ✓ Church onboarding is complete.
                        </p>
                    ) : (
                        <>
                            <p className="text-xs text-slate-500">
                                Your church is ready to be activated once setup
                                is complete.
                            </p>

                            <button
                                type="button"
                                onClick={handleCompleteOnboarding}
                                disabled={completing}
                                className="mt-4 inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {completing
                                    ? "Completing..."
                                    : "Complete Onboarding"}
                            </button>

                            {completionError && (
                                <p className="mt-3 text-sm font-medium text-red-600">
                                    {completionError}
                                </p>
                            )}
                        </>
                    )}
                </div>
            </section>

            {/* Church information */}
            {church && (
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <h2 className="text-sm font-semibold text-slate-900">
                        Your church
                    </h2>

                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <InfoItem
                            label="Church name"
                            value={church.church_name}
                        />

                        <InfoItem
                            label="Church code"
                            value={church.church_code}
                        />

                        <InfoItem
                            label="Administrator"
                            value={user?.email || "—"}
                        />
                    </div>
                </section>
            )}
        </div>
    );
}

function DashboardCard({
    href,
    icon,
    title,
    description,
}: {
    href: string;
    icon: string;
    title: string;
    description: string;
}) {
    return (
        <Link
            href={href}
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
        >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-xl text-slate-700">
                {icon}
            </div>

            <h2 className="mt-4 text-base font-semibold text-slate-900">
                {title}
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
                {description}
            </p>

            <div className="mt-4 text-sm font-semibold text-slate-700 group-hover:text-slate-900">
                Open →
            </div>
        </Link>
    );
}

function InfoItem({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {label}
            </p>

            <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                {value}
            </p>
        </div>
    );
}