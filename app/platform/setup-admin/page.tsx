"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL;

export default function SetupAdminPage() {
    const router = useRouter();


    const [name, setName] = useState("");
    const [email, setEmail] = useState("");

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [church, setChurch] = useState<{
        id: number;
        church_name: string;
        short_name: string | null;
        church_code: string;
        status: string;
    } | null>(null);

    useEffect(() => {
        const storedChurch = localStorage.getItem("platform_church");

        if (!storedChurch) {
            router.push("/platform/register");
            return;
        }

        try {
            const parsedChurch = JSON.parse(storedChurch);
            setChurch(parsedChurch);
        } catch (error) {
            console.error("Invalid stored church:", error);
            localStorage.removeItem("platform_church");
            localStorage.removeItem("church_code");
            router.push("/platform/register");
        }
    }, [router]);

    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        if (submitting) return;

        setError(null);
        setSuccess(null);

        const trimmedName = name.trim();
        const trimmedEmail = email.trim().toLowerCase();
        const trimmedChurchCode = church?.church_code.trim();



        if (!trimmedChurchCode) {
            setError(
                "Church code is missing. Please return to church registration and try again."
            );
            return;
        }

        if (!trimmedName) {
            setError("Administrator name is required.");
            return;
        }

        if (!trimmedEmail) {
            setError("Administrator email is required.");
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
            setError("Please enter a valid email address.");
            return;
        }

        setSubmitting(true);

        try {
            /*
            |--------------------------------------------------------------------------
            | Initial setup administrator creation happens BEFORE platform login.
            |
            | Therefore:
            | - No platform token is required.
            | - No Authorization header is sent.
            | - Church is identified by the church code.
            |--------------------------------------------------------------------------
            */

            const response = await fetch(
                `${API_BASE_URL}/onboarding/setup-admin`,
                {
                    method: "POST",

                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                    },

                    body: JSON.stringify({
                        church_code: trimmedChurchCode,
                        name: trimmedName,
                        email: trimmedEmail,
                    }),
                }
            );

            const result = await response
                .json()
                .catch(() => ({}));

            console.log("SETUP ADMIN HTTP RESPONSE", {
                url: response.url,
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
                result,
            });

            if (!response.ok || result?.success !== true) {
                console.error("SETUP ADMIN FAILED", {
                    status: response.status,
                    statusText: response.statusText,
                    result,
                });

                throw new Error(
                    result?.message ||
                    `Unable to create setup administrator (${response.status}).`
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Setup administrator was successfully created.
            |--------------------------------------------------------------------------
            */

            setSuccess(
                "Setup administrator created successfully. Login instructions will be sent by email."
            );

            /*
            |--------------------------------------------------------------------------
            | The administrator now needs to login.
            |--------------------------------------------------------------------------
            */

            setTimeout(() => {
                router.replace("/platform/login");
            }, 1200);

        } catch (error) {
            console.error(
                "Unable to create setup administrator:",
                error
            );

            setError(
                error instanceof Error
                    ? error.message
                    : "Unable to create the setup administrator."
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-slate-50">
            <div className="mx-auto flex min-h-screen w-full max-w-2xl items-center justify-center px-4 py-10 sm:px-6">
                <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

                    {/* Header */}
                    <div className="mb-8">
                        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                            Church Community
                        </p>

                        <h1 className="mt-2 text-2xl font-bold text-slate-900">
                            Setup Administrator
                        </h1>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            Create the administrator account for your church.
                            The administrator will receive a temporary
                            password by email and will be required to create
                            a permanent password when signing in for the first
                            time.
                        </p>
                    </div>

                    {/* Church code */}
                    <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            Church Code
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-900">
                            {church?.church_code || "Not provided"}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">

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
                                value={name}
                                onChange={(event) =>
                                    setName(event.target.value)
                                }
                                disabled={submitting}
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
                                value={email}
                                onChange={(event) =>
                                    setEmail(event.target.value)
                                }
                                disabled={submitting}
                                placeholder="admin@example.com"
                                autoComplete="email"
                                className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                            />
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                                <p className="text-sm font-medium text-red-700">
                                    {error}
                                </p>
                            </div>
                        )}

                        {/* Success */}
                        {success && (
                            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                                <p className="text-sm font-medium text-green-700">
                                    {success}
                                </p>
                            </div>
                        )}

                        {/* Information */}
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                            <p className="text-sm leading-5 text-amber-800">
                                A temporary password will be sent directly to
                                this email address. It will not be displayed
                                on this page.
                            </p>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={submitting || !church?.church_code}
                            className="inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {submitting
                                ? "Creating Administrator..."
                                : "Create Setup Administrator"}
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
}