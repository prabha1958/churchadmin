"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { QRCodeCanvas } from "qrcode.react";

interface PlatformChurch {
    id: number;
    church_code: string;
    church_name: string;
    short_name?: string | null;
    logo?: string | null;
    status?: string;
}

export default function PlatformQrPage() {
    const [church, setChurch] =
        useState<PlatformChurch | null>(null);

    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;

        try {
            const churchJson =
                localStorage.getItem("platform_church");

            if (churchJson) {
                setChurch(JSON.parse(churchJson));
            }
        } catch (error) {
            console.error(
                "Unable to load church information:",
                error
            );
        }
    }, []);

    const churchCode = church?.church_code || "";

    const joinUrl = churchCode
        ? `churchmsg://join/${churchCode}`
        : "";

    const handleCopy = async () => {
        if (!joinUrl) return;

        try {
            await navigator.clipboard.writeText(joinUrl);

            setCopied(true);

            window.setTimeout(() => {
                setCopied(false);
            }, 2000);
        } catch (error) {
            console.error(
                "Unable to copy church join URL:",
                error
            );
        }
    };

    const handleDownload = () => {
        const canvas = document.getElementById(
            "church-join-qr"
        ) as HTMLCanvasElement | null;

        if (!canvas) return;

        const imageUrl = canvas.toDataURL("image/png");

        const link = document.createElement("a");

        link.download = `${churchCode || "church"}-join-qr.png`;
        link.href = imageUrl;
        link.click();
    };

    if (!church) {
        return (
            <div className="space-y-6">
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-sm text-slate-500">
                        Loading church information...
                    </p>
                </section>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <section>
                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        href="/platform/dashboard"
                        className="text-sm font-medium text-slate-500 hover:text-slate-900"
                    >
                        ← Dashboard
                    </Link>
                </div>

                <p className="mt-5 text-sm font-medium text-slate-500">
                    Church Membership
                </p>

                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    Church QR Code
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    Members can scan this QR code with the Church
                    Community app to connect to your church.
                </p>
            </section>

            {/* QR card */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
                    {/* Information */}
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-slate-900">
                                {church.church_name}
                            </span>

                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                                {church.church_code}
                            </span>

                            {church.status === "active" && (
                                <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                                    Active
                                </span>
                            )}
                        </div>

                        <h2 className="mt-6 text-lg font-semibold text-slate-900">
                            Join your church
                        </h2>

                        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                            Ask members to scan this QR code using
                            their phone. The Church Community app
                            will open and connect them to this
                            church.
                        </p>

                        {/* Join URL */}
                        <div className="mt-6">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Church join link
                            </p>

                            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                                <div className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                                    <code className="break-all text-sm text-slate-700">
                                        {joinUrl}
                                    </code>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleCopy}
                                    className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    {copied
                                        ? "Copied!"
                                        : "Copy Link"}
                                </button>
                            </div>
                        </div>

                        {/* Instructions */}
                        <div className="mt-6 rounded-xl bg-slate-50 p-4">
                            <p className="text-sm font-semibold text-slate-800">
                                How members use it
                            </p>

                            <ol className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                                <li>
                                    <span className="font-semibold">
                                        1.
                                    </span>{" "}
                                    Open the Church Community app.
                                </li>

                                <li>
                                    <span className="font-semibold">
                                        2.
                                    </span>{" "}
                                    Scan this QR code.
                                </li>

                                <li>
                                    <span className="font-semibold">
                                        3.
                                    </span>{" "}
                                    The app connects to{" "}
                                    <span className="font-semibold text-slate-800">
                                        {church.church_code}
                                    </span>
                                    .
                                </li>

                                <li>
                                    <span className="font-semibold">
                                        4.
                                    </span>{" "}
                                    The member can then sign in.
                                </li>
                            </ol>
                        </div>
                    </div>

                    {/* QR */}
                    <div className="flex justify-center">
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            {joinUrl && (
                                <QRCodeCanvas
                                    id="church-join-qr"
                                    value={joinUrl}
                                    size={280}
                                    level="H"
                                    includeMargin
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-8 flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={handleDownload}
                        className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                        Download QR Code
                    </button>
                </div>
            </section>

            {/* Technical information */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="text-sm font-semibold text-slate-900">
                    QR information
                </h2>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            Church code
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-800">
                            {church.church_code}
                        </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            Join URL
                        </p>

                        <p className="mt-1 break-all text-sm font-semibold text-slate-800">
                            {joinUrl}
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}