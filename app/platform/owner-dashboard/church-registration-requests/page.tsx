
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    CheckCircle2,
    Eye,
    Loader2,
    RefreshCw,
    XCircle,
} from "lucide-react";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/api";

type RequestStatus = "pending" | "approved" | "rejected";

interface RegistrationRequest {
    id: number;
    church_name: string;
    address: string | null;
    city: string | null;
    admin_name: string;
    admin_email: string;
    status: RequestStatus;
    reviewed_at: string | null;
    reviewed_by: number | null;
    church_id: number | null;
    admin_notes: string | null;
    created_at: string;
    updated_at: string;
}

interface RequestResponse {
    success: boolean;
    message?: string;
    data?: {
        requests: {
            data: RegistrationRequest[];
            current_page: number;
            last_page: number;
            total: number;
        };
    };
}

const statusOptions: {
    value: RequestStatus;
    label: string;
}[] = [
        { value: "pending", label: "Pending" },
        { value: "approved", label: "Approved" },
        { value: "rejected", label: "Rejected" },
    ];

function formatDate(value: string | null) {
    if (!value) return "—";

    return new Date(value).toLocaleString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function statusClasses(status: RequestStatus) {
    switch (status) {
        case "approved":
            return "bg-green-100 text-green-800";
        case "rejected":
            return "bg-red-100 text-red-800";
        default:
            return "bg-amber-100 text-amber-800";
    }
}

export default function ChurchRegistrationRequestsPage() {
    const router = useRouter();

    const [status, setStatus] = useState<RequestStatus>("pending");
    const [requests, setRequests] = useState<RegistrationRequest[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState<number | null>(null);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [selected, setSelected] =
        useState<RegistrationRequest | null>(null);

    const loadRequests = useCallback(
        async (requestedPage = 1) => {
            const token = localStorage.getItem("platform_token");

            if (!token) {
                router.replace("/platform/login");
                return;
            }

            setLoading(true);
            setError("");

            try {
                const params = new URLSearchParams({
                    status,
                    page: String(requestedPage),
                });

                const response = await fetch(
                    `${API_BASE_URL}/platform/church-registration-requests?${params}`,
                    {
                        headers: {
                            Accept: "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        cache: "no-store",
                    }
                );

                const result: RequestResponse =
                    await response.json().catch(() => ({
                        success: false,
                        message: "The server did not return valid JSON.",
                    }));

                if (response.status === 401) {
                    localStorage.removeItem("platform_token");
                    localStorage.removeItem("platform_user");
                    localStorage.removeItem("platform_role");
                    localStorage.removeItem("platform_church");
                    router.replace("/platform/login");
                    return;
                }

                if (!response.ok || !result.success || !result.data?.requests) {
                    throw new Error(
                        result.message || `Unable to load requests (${response.status}).`
                    );
                }

                const paginator = result.data.requests;

                setRequests(paginator.data);
                setTotal(paginator.total);
                setPage(paginator.current_page);
                setLastPage(paginator.last_page);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load registration requests."
                );
            } finally {
                setLoading(false);
            }
        },
        [router, status]
    );

    useEffect(() => {
        void loadRequests(1);
    }, [loadRequests]);

    async function handleAction(
        request: RegistrationRequest,
        action: "approve" | "reject"
    ) {
        const actionLabel = action === "approve" ? "approve" : "reject";

        if (
            !window.confirm(
                `Are you sure you want to ${actionLabel} the registration request for ${request.church_name}?`
            )
        ) {
            return;
        }

        const token = localStorage.getItem("platform_token");

        if (!token) {
            router.replace("/platform/login");
            return;
        }

        setBusyId(request.id);
        setError("");
        setNotice("");

        try {
            const response = await fetch(
                `${API_BASE_URL}/platform/church-registration-requests/${request.id}/${action}`,
                {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const result = await response.json().catch(() => null);

            if (response.status === 401) {
                router.replace("/platform/login");
                return;
            }

            if (!response.ok || result?.success === false) {
                throw new Error(
                    result?.message ||
                    `Unable to ${actionLabel} this registration request.`
                );
            }

            setNotice(
                result?.message ||
                `Registration request ${action === "approve" ? "approved" : "rejected"} successfully.`
            );

            setSelected(null);
            await loadRequests(1);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "The requested action failed."
            );
        } finally {
            setBusyId(null);
        }
    }

    return (
        <main className="min-h-screen bg-slate-100">
            <header className="bg-[#191970] text-white shadow-md">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
                    <div>
                        <button
                            onClick={() => router.push("/platform/owner-dashboard")}
                            className="mb-3 inline-flex items-center gap-2 text-sm text-white/80 hover:text-white"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Owner Dashboard
                        </button>
                        <h1 className="text-2xl font-bold">
                            Church Registration Requests
                        </h1>
                        <p className="mt-1 text-sm text-white/70">
                            Review applications submitted by churches.
                        </p>
                    </div>

                    <button
                        onClick={() => void loadRequests(page)}
                        disabled={loading}
                        className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-white/30 px-3 py-2 text-sm hover:bg-white/10 disabled:opacity-50"
                    >
                        <RefreshCw
                            className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                        />
                        Refresh
                    </button>
                </div>
            </header>

            <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">
                                Applications
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                {loading ? "Loading requests..." : `${total} ${status} request(s)`}
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {statusOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => {
                                        setNotice("");
                                        setStatus(option.value);
                                    }}
                                    className={`rounded-lg px-4 py-2 text-sm font-medium transition ${status === option.value
                                        ? "bg-[#191970] text-white"
                                        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {notice && (
                    <div
                        role="status"
                        className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
                    >
                        {notice}
                    </div>
                )}

                {error && (
                    <div
                        role="alert"
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                    >
                        <span>{error}</span>
                        <button
                            onClick={() => void loadRequests(page)}
                            className="font-semibold underline"
                        >
                            Try again
                        </button>
                    </div>
                )}

                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    {loading ? (
                        <div className="flex min-h-64 items-center justify-center gap-3 text-slate-500">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Loading registration requests...
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
                            <CheckCircle2 className="mb-3 h-10 w-10 text-slate-300" />
                            <h3 className="font-semibold text-slate-800">
                                No {status} requests
                            </h3>
                            <p className="mt-1 text-sm text-slate-500">
                                There are no registration requests in this category.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[850px] text-left text-sm">
                                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                        <tr>
                                            <th className="px-5 py-4">Church</th>
                                            <th className="px-5 py-4">Contact Person</th>
                                            <th className="px-5 py-4">Location</th>
                                            <th className="px-5 py-4">Submitted</th>
                                            <th className="px-5 py-4">Status</th>
                                            <th className="px-5 py-4">Actions</th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-100">
                                        {requests.map((request) => (
                                            <tr key={request.id} className="hover:bg-slate-50">
                                                <td className="px-5 py-4">
                                                    <p className="font-semibold text-slate-900">
                                                        {request.church_name}
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        Request #{request.id}
                                                    </p>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <p className="font-medium text-slate-800">
                                                        {request.admin_name}
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        {request.admin_email}
                                                    </p>
                                                </td>

                                                <td className="px-5 py-4 text-slate-600">
                                                    {[request.city, request.address]
                                                        .filter(Boolean)
                                                        .join(", ") || "—"}
                                                </td>

                                                <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                                                    {formatDate(request.created_at)}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span
                                                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClasses(request.status)}`}
                                                    >
                                                        {request.status}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            title="View details"
                                                            onClick={() => setSelected(request)}
                                                            className="rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-100"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </button>

                                                        {request.status === "pending" && (
                                                            <>
                                                                <button
                                                                    title="Approve request"
                                                                    disabled={busyId === request.id}
                                                                    onClick={() =>
                                                                        router.push(`/platform/owner-dashboard/approve?registration_request_id=${request.id}`)
                                                                    }
                                                                    className="rounded-lg bg-green-600 p-2 text-white hover:bg-green-700 disabled:opacity-50"
                                                                >
                                                                    {busyId === request.id ? (
                                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                                    ) : (
                                                                        <CheckCircle2 className="h-4 w-4" />
                                                                    )}
                                                                </button>

                                                                <button
                                                                    title="Reject request"
                                                                    disabled={busyId === request.id}
                                                                    onClick={() =>
                                                                        void handleAction(request, "reject")
                                                                    }
                                                                    className="rounded-lg bg-red-600 p-2 text-white hover:bg-red-700 disabled:opacity-50"
                                                                >
                                                                    <XCircle className="h-4 w-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-sm text-slate-500">
                                    Page {page} of {lastPage} · {total} total requests
                                </p>

                                <div className="flex gap-2">
                                    <button
                                        disabled={page <= 1 || loading}
                                        onClick={() => void loadRequests(page - 1)}
                                        className="rounded-lg border border-slate-200 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        disabled={page >= lastPage || loading}
                                        onClick={() => void loadRequests(page + 1)}
                                        className="rounded-lg border border-slate-200 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </section>
            </div>

            {selected && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4"
                    onClick={() => setSelected(null)}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="request-detail-title"
                        className="my-auto w-full max-w-2xl rounded-xl bg-white shadow-xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="flex items-start justify-between border-b border-slate-200 p-5">
                            <div>
                                <h2
                                    id="request-detail-title"
                                    className="text-xl font-bold text-slate-900"
                                >
                                    {selected.church_name}
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Registration request #{selected.id}
                                </p>
                            </div>

                            <button
                                onClick={() => setSelected(null)}
                                className="rounded-lg px-3 py-1 text-slate-500 hover:bg-slate-100"
                            >
                                Close
                            </button>
                        </div>

                        <div className="grid gap-5 p-5 sm:grid-cols-2">
                            {[
                                ["Church Name", selected.church_name],
                                ["Address", selected.address],
                                ["City", selected.city],
                                ["Contact Person", selected.admin_name],
                                ["Contact Email", selected.admin_email],
                                ["Submitted", formatDate(selected.created_at)],
                                ["Reviewed At", formatDate(selected.reviewed_at)],
                                ["Church ID", selected.church_id ?? "Not provisioned"],
                            ].map(([label, value]) => (
                                <div key={label}>
                                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                        {label}
                                    </p>
                                    <p className="mt-1 break-words text-sm text-slate-900">
                                        {value || "—"}
                                    </p>
                                </div>
                            ))}

                            <div className="sm:col-span-2">
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                    Admin Notes
                                </p>
                                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-900">
                                    {selected.admin_notes || "No notes"}
                                </p>
                            </div>
                        </div>

                        {selected.status === "pending" && (
                            <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 p-5">
                                <button
                                    disabled={busyId === selected.id}
                                    onClick={() => void handleAction(selected, "reject")}
                                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                                >
                                    Reject
                                </button>
                                <button
                                    disabled={busyId === selected.id}
                                    onClick={() => void handleAction(selected, "approve")}
                                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                                >
                                    Approve
                                </button>
                            </div>
                        )}
                    </section>
                </div>
            )}
        </main>
    );
}

