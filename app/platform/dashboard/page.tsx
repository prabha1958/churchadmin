"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    completePlatformOnboarding,
    getPlatformChurch, createSetupAdmin,
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
    const [adminName, setAdminName] = useState("");
    const [adminEmail, setAdminEmail] = useState("");

    const [creatingAdmin, setCreatingAdmin] = useState(false);

    const [adminSuccess, setAdminSuccess] =
        useState<string | null>(null);

    const [adminError, setAdminError] =
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

    const handleCreateSetupAdmin = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        if (creatingAdmin) return;

        setAdminSuccess(null);
        setAdminError(null);

        const name = adminName.trim();
        const email = adminEmail.trim().toLowerCase();

        if (!name) {
            setAdminError("Administrator name is required.");
            return;
        }

        if (!email) {
            setAdminError("Administrator email is required.");
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setAdminError("Please enter a valid email address.");
            return;
        }

        setCreatingAdmin(true);

        try {
            await createSetupAdmin({
                name,
                email,
            });

            setAdminSuccess(
                `Setup administrator created successfully. A welcome email has been sent to ${email}.`
            );

            setAdminName("");
            setAdminEmail("");
        } catch (error) {
            console.error(
                "Unable to create setup administrator:",
                error
            );

            setAdminError(
                error instanceof Error
                    ? error.message
                    : "Unable to create setup administrator."
            );
        } finally {
            setCreatingAdmin(false);
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

            {/* Setup Administrator */}
            {church?.status !== "active" && (
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div>
                        <p className="text-sm font-semibold text-slate-900">
                            Setup Administrator
                        </p>

                        <p className="mt-1 text-sm leading-6 text-slate-500">
                            Create the administrator account for this church.
                            The administrator will receive a temporary password
                            by email and will be required to create a permanent
                            password on first sign-in.
                        </p>
                    </div>

                    <form
                        onSubmit={handleCreateSetupAdmin}
                        className="mt-6 space-y-5"
                    >
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            {/* Name */}
                            <div>
                                <label
                                    htmlFor="setup-admin-name"
                                    className="block text-sm font-medium text-slate-700"
                                >
                                    Administrator name
                                </label>

                                <input
                                    id="setup-admin-name"
                                    type="text"
                                    value={adminName}
                                    onChange={(event) =>
                                        setAdminName(event.target.value)
                                    }
                                    disabled={creatingAdmin}
                                    placeholder="Enter full name"
                                    autoComplete="name"
                                    className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label
                                    htmlFor="setup-admin-email"
                                    className="block text-sm font-medium text-slate-700"
                                >
                                    Administrator email
                                </label>

                                <input
                                    id="setup-admin-email"
                                    type="email"
                                    value={adminEmail}
                                    onChange={(event) =>
                                        setAdminEmail(event.target.value)
                                    }
                                    disabled={creatingAdmin}
                                    placeholder="admin@example.com"
                                    autoComplete="email"
                                    className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                                />
                            </div>
                        </div>

                        {adminError && (
                            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                                <p className="text-sm font-medium text-red-700">
                                    {adminError}
                                </p>
                            </div>
                        )}

                        {adminSuccess && (
                            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                                <p className="text-sm font-medium text-green-700">
                                    {adminSuccess}
                                </p>
                            </div>
                        )}

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-xs leading-5 text-slate-500">
                                The temporary password will be sent directly to
                                the administrator by email. It will not be displayed
                                here.
                            </p>

                            <button
                                type="submit"
                                disabled={creatingAdmin}
                                className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {creatingAdmin
                                    ? "Creating..."
                                    : "Create Setup Administrator"}
                            </button>
                        </div>
                    </form>
                </section>
            )}

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