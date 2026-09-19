"use client";

import { useEffect, useRef, useState } from "react";
import {
    getPlatformChurch,
    updatePlatformChurch,
    type PlatformChurch,
} from "@/lib/platform-api";

interface ChurchForm {
    church_name: string;
    church_code: string;
    short_name: string;
    email: string;
    mobile: string;
    address: string;
    city: string;
    state: string;
    country: string;
}

const emptyForm: ChurchForm = {
    church_name: "",
    church_code: "",
    short_name: "",
    email: "",
    mobile: "",
    address: "",
    city: "",
    state: "",
    country: "",
};

function churchToForm(church: PlatformChurch): ChurchForm {
    return {
        church_name: church.church_name ?? "",
        church_code: church.church_code ?? "",
        short_name: church.short_name ?? "",
        email: church.email ?? "",
        mobile: church.mobile ?? "",
        address: church.address ?? "",
        city: church.city ?? "",
        state: church.state ?? "",
        country: church.country ?? "",
    };
}

export default function ChurchSetupPage() {
    const [form, setForm] = useState<ChurchForm>(emptyForm);

    const [church, setChurch] = useState<PlatformChurch | null>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [logoUploading, setLogoUploading] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        loadChurch();
    }, []);

    useEffect(() => {
        return () => {
            if (logoPreview?.startsWith("blob:")) {
                URL.revokeObjectURL(logoPreview);
            }
        };
    }, [logoPreview]);

    async function loadChurch() {
        try {
            setLoading(true);
            setError("");
            setSuccess("");

            const result = await getPlatformChurch();

            const currentChurch = result.data.church;

            setChurch(currentChurch);
            setForm(churchToForm(currentChurch));

            localStorage.setItem(
                "platform_church",
                JSON.stringify(currentChurch)
            );

            /*
             * Only use the backend logo when there is no local
             * preview selected by the user.
             */
            if (currentChurch.logo) {
                setLogoPreview(resolveLogoUrl(currentChurch.logo));
            } else {
                setLogoPreview(null);
            }
        } catch (err) {
            console.error("Failed to load church:", err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to load church information."
            );
        } finally {
            setLoading(false);
        }
    }

    function resolveLogoUrl(logo: string): string {
        /*
         * If Laravel already returns a complete URL,
         * use it directly.
         */
        if (
            logo.startsWith("http://") ||
            logo.startsWith("https://")
        ) {
            return logo;
        }

        /*
         * Otherwise assume Laravel returned a storage-relative
         * path such as:
         *
         * churches/TEST001/logo.png
         */
        const backendUrl =
            process.env.NEXT_PUBLIC_BACKEND_URL ||
            "http://localhost:8000/api";

        const baseUrl = backendUrl.replace(/\/api\/?$/, "");

        return `${baseUrl}/storage/${logo.replace(/^\/+/, "")}`;
    }

    function handleChange(
        field: keyof ChurchForm,
        value: string
    ) {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));

        setError("");
        setSuccess("");
    }

    function handleLogoSelect(
        event: React.ChangeEvent<HTMLInputElement>
    ) {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        setError("");
        setSuccess("");

        /*
         * Client-side validation.
         */
        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
        ];

        if (!allowedTypes.includes(file.type)) {
            setError(
                "Please select a JPG, PNG, or WebP image."
            );

            event.target.value = "";
            return;
        }

        /*
         * 5 MB maximum.
         */
        const maxSize = 5 * 1024 * 1024;

        if (file.size > maxSize) {
            setError("Logo image must be 5 MB or smaller.");

            event.target.value = "";
            return;
        }

        /*
         * Release the previous preview URL.
         */
        if (logoPreview?.startsWith("blob:")) {
            URL.revokeObjectURL(logoPreview);
        }

        const previewUrl = URL.createObjectURL(file);

        setLogoFile(file);
        setLogoPreview(previewUrl);
    }

    function removeSelectedLogo() {
        if (logoPreview?.startsWith("blob:")) {
            URL.revokeObjectURL(logoPreview);
        }

        setLogoFile(null);

        if (church?.logo) {
            setLogoPreview(resolveLogoUrl(church.logo));
        } else {
            setLogoPreview(null);
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }

        setError("");
        setSuccess("");
    }

    async function handleLogoUpload() {
        if (!logoFile) {
            setError("Please select a logo image first.");
            return;
        }

        const token = localStorage.getItem("platform_token");

        if (!token) {
            setError(
                "Your platform session has expired. Please sign in again."
            );
            return;
        }

        try {
            setLogoUploading(true);
            setError("");
            setSuccess("");

            const formData = new FormData();

            formData.append("logo", logoFile);

            const apiBaseUrl =
                process.env.NEXT_PUBLIC_BACKEND_URL ||
                "http://localhost:8000/api";

            const response = await fetch(
                `${apiBaseUrl}/platform/church/logo`,
                {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                }
            );

            const data = await response.json().catch(() => null);

            if (!response.ok || !data?.success) {
                if (response.status === 401) {
                    throw new Error(
                        "Your platform session has expired. Please sign in again."
                    );
                }

                throw new Error(
                    data?.message || "Unable to upload church logo."
                );
            }

            const updatedChurch: PlatformChurch =
                data.data.church;

            setChurch(updatedChurch);

            setForm(churchToForm(updatedChurch));

            localStorage.setItem(
                "platform_church",
                JSON.stringify(updatedChurch)
            );

            /*
             * Use the URL returned by Laravel rather than
             * continuing to use the temporary blob URL.
             */
            if (updatedChurch.logo) {
                setLogoPreview(
                    resolveLogoUrl(updatedChurch.logo)
                );
            }

            setLogoFile(null);

            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }

            setSuccess(
                data.message ||
                "Church logo uploaded successfully."
            );
        } catch (err) {
            console.error("Logo upload failed:", err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to upload church logo."
            );
        } finally {
            setLogoUploading(false);
        }
    }

    async function handleSubmit(
        event: React.FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setError("");
        setSuccess("");

        if (!form.church_name.trim()) {
            setError("Church name is required.");
            return;
        }

        try {
            setSaving(true);

            const result = await updatePlatformChurch({
                church_name: form.church_name.trim(),
                short_name: form.short_name.trim() || null,
                email: form.email.trim() || null,
                mobile: form.mobile.trim() || null,
                address: form.address.trim() || null,
                city: form.city.trim() || null,
                state: form.state.trim() || null,
                country: form.country.trim() || null,
            });

            const updatedChurch = result.data.church;

            setChurch(updatedChurch);
            setForm(churchToForm(updatedChurch));

            localStorage.setItem(
                "platform_church",
                JSON.stringify(updatedChurch)
            );

            /*
             * Don't overwrite a newly selected local preview.
             */
            if (!logoFile && updatedChurch.logo) {
                setLogoPreview(
                    resolveLogoUrl(updatedChurch.logo)
                );
            }

            setSuccess(
                result.message ||
                "Church information updated successfully."
            );
        } catch (err) {
            console.error("Failed to update church:", err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to update church information."
            );
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="mx-auto max-w-3xl">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="animate-pulse space-y-4">
                        <div className="h-7 w-48 rounded bg-slate-200" />
                        <div className="h-4 w-72 rounded bg-slate-200" />

                        <div className="space-y-3 pt-4">
                            <div className="h-11 rounded bg-slate-100" />
                            <div className="h-11 rounded bg-slate-100" />
                            <div className="h-11 rounded bg-slate-100" />
                            <div className="h-11 rounded bg-slate-100" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            {/* Page heading */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">
                    Church Setup
                </h1>

                <p className="mt-1 text-sm text-slate-600">
                    Update your church information.
                </p>
            </div>

            {/* Error */}
            {error && (
                <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                    {error}
                </div>
            )}

            {/* Success */}
            {success && (
                <div
                    role="status"
                    className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
                >
                    {success}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic information */}
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="mb-5">
                        <h2 className="text-lg font-semibold text-slate-900">
                            Basic Information
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Basic identification details for your church.
                        </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <label
                                htmlFor="church_name"
                                className="mb-1.5 block text-sm font-medium text-slate-700"
                            >
                                Church Name
                            </label>

                            <input
                                id="church_name"
                                type="text"
                                value={form.church_name}
                                onChange={(e) =>
                                    handleChange(
                                        "church_name",
                                        e.target.value
                                    )
                                }
                                disabled={saving}
                                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
                                placeholder="Enter church name"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="church_code"
                                className="mb-1.5 block text-sm font-medium text-slate-700"
                            >
                                Church Code
                            </label>

                            <input
                                id="church_code"
                                type="text"
                                value={form.church_code}
                                readOnly
                                className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-600 outline-none"
                            />

                            <p className="mt-1.5 text-xs text-slate-500">
                                Church code cannot be changed.
                            </p>
                        </div>

                        <div>
                            <label
                                htmlFor="short_name"
                                className="mb-1.5 block text-sm font-medium text-slate-700"
                            >
                                Short Name
                            </label>

                            <input
                                id="short_name"
                                type="text"
                                value={form.short_name}
                                onChange={(e) =>
                                    handleChange(
                                        "short_name",
                                        e.target.value
                                    )
                                }
                                disabled={saving}
                                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
                                placeholder="Optional"
                            />
                        </div>
                    </div>
                </section>

                {/* Contact information */}
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="mb-5">
                        <h2 className="text-lg font-semibold text-slate-900">
                            Contact Information
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Contact details members can use to reach the church.
                        </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label
                                htmlFor="email"
                                className="mb-1.5 block text-sm font-medium text-slate-700"
                            >
                                Email
                            </label>

                            <input
                                id="email"
                                type="email"
                                value={form.email}
                                onChange={(e) =>
                                    handleChange("email", e.target.value)
                                }
                                disabled={saving}
                                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
                                placeholder="church@example.com"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="mobile"
                                className="mb-1.5 block text-sm font-medium text-slate-700"
                            >
                                Mobile
                            </label>

                            <input
                                id="mobile"
                                type="tel"
                                value={form.mobile}
                                onChange={(e) =>
                                    handleChange("mobile", e.target.value)
                                }
                                disabled={saving}
                                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
                                placeholder="+91"
                            />
                        </div>
                    </div>
                </section>

                {/* Address */}
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="mb-5">
                        <h2 className="text-lg font-semibold text-slate-900">
                            Address
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Physical address of the church.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label
                                htmlFor="address"
                                className="mb-1.5 block text-sm font-medium text-slate-700"
                            >
                                Address
                            </label>

                            <textarea
                                id="address"
                                rows={3}
                                value={form.address}
                                onChange={(e) =>
                                    handleChange(
                                        "address",
                                        e.target.value
                                    )
                                }
                                disabled={saving}
                                className="w-full resize-y rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
                                placeholder="Enter church address"
                            />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="city"
                                    className="mb-1.5 block text-sm font-medium text-slate-700"
                                >
                                    City
                                </label>

                                <input
                                    id="city"
                                    type="text"
                                    value={form.city}
                                    onChange={(e) =>
                                        handleChange("city", e.target.value)
                                    }
                                    disabled={saving}
                                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
                                    placeholder="City"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="state"
                                    className="mb-1.5 block text-sm font-medium text-slate-700"
                                >
                                    State
                                </label>

                                <input
                                    id="state"
                                    type="text"
                                    value={form.state}
                                    onChange={(e) =>
                                        handleChange(
                                            "state",
                                            e.target.value
                                        )
                                    }
                                    disabled={saving}
                                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
                                    placeholder="State"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label
                                    htmlFor="country"
                                    className="mb-1.5 block text-sm font-medium text-slate-700"
                                >
                                    Country
                                </label>

                                <input
                                    id="country"
                                    type="text"
                                    value={form.country}
                                    onChange={(e) =>
                                        handleChange(
                                            "country",
                                            e.target.value
                                        )
                                    }
                                    disabled={saving}
                                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
                                    placeholder="Country"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Church logo */}
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="mb-5">
                        <h2 className="text-lg font-semibold text-slate-900">
                            Church Logo
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Upload the logo that will identify your church
                            throughout the platform.
                        </p>
                    </div>

                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                        {/* Preview */}
                        <div className="flex h-36 w-36 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                            {logoPreview ? (
                                <img
                                    src={logoPreview}
                                    alt="Church logo preview"
                                    className="h-full w-full object-contain p-3"
                                />
                            ) : (
                                <div className="px-4 text-center">
                                    <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-200">
                                        <span className="text-lg text-slate-500">
                                            +
                                        </span>
                                    </div>

                                    <p className="text-xs text-slate-500">
                                        No logo
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Controls */}
                        <div className="flex-1">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleLogoSelect}
                                className="hidden"
                            />

                            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                                <button
                                    type="button"
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                    disabled={logoUploading}
                                    className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {logoFile
                                        ? "Choose Another"
                                        : "Choose Logo"}
                                </button>

                                {logoFile && (
                                    <button
                                        type="button"
                                        onClick={removeSelectedLogo}
                                        disabled={logoUploading}
                                        className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                )}

                                {logoFile && (
                                    <button
                                        type="button"
                                        onClick={handleLogoUpload}
                                        disabled={logoUploading}
                                        className="rounded-xl bg-[#191970] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#15155f] disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {logoUploading
                                            ? "Uploading..."
                                            : "Upload Logo"}
                                    </button>
                                )}
                            </div>

                            <p className="mt-3 text-xs text-slate-500">
                                JPG, PNG, or WebP. Maximum file size: 5 MB.
                            </p>

                            {logoFile && (
                                <p className="mt-2 truncate text-xs font-medium text-slate-600">
                                    Selected: {logoFile.name}
                                </p>
                            )}
                        </div>
                    </div>
                </section>

                {/* Save */}
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={loadChurch}
                        disabled={saving || logoUploading}
                        className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Reload
                    </button>

                    <button
                        type="submit"
                        disabled={saving || logoUploading}
                        className="rounded-xl bg-[#191970] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#15155f] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </form>
        </div>
    );
}