"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { downloadMemberImportTemplate, previewMemberImport, MemberImportPreview, importMembers } from "@/lib/platform-api";


const API_BASE_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/api";

type Member = {
    id: number;
    family_name: string;
    first_name: string;
    middle_name?: string | null;
    last_name?: string | null;

    date_of_birth?: string | null;
    wedding_date?: string | null;

    area_no: string;
    email: string;
    mobile_number: string;

    gender: string;
    spouse_name?: string | null;
    occupation?: string | null;
    status: string;

    profile_photo?: string | null;
    couple_pic?: string | null;

    membership_fee?: number | string | null;

    address_flat_number?: string | null;
    address_premises?: string | null;
    address_area?: string | null;
    address_landmark?: string | null;
    address_city?: string | null;
    address_pin?: string | null;

    status_flag?: boolean;
    created_at?: string;
};

type Pagination = {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
};

type MemberListResponse = {
    success: boolean;
    data: {
        members: {
            data: Member[];
            current_page: number;
            last_page: number;
            per_page: number;
            total: number;
        };
    };
    message?: string;
};

type FormState = {
    family_name: string;
    first_name: string;
    middle_name: string;
    last_name: string;

    date_of_birth: string;
    wedding_date: string;

    area_no: string;
    email: string;
    mobile_number: string;

    gender: string;
    spouse_name: string;
    occupation: string;
    status: string;

    membership_fee: string;

    address_flat_number: string;
    address_premises: string;
    address_area: string;
    address_landmark: string;
    address_city: string;
    address_pin: string;
};

type FormErrors = Partial<Record<keyof FormState | "profile_photo" | "couple_pic", string>>;

const initialForm: FormState = {
    family_name: "",
    first_name: "",
    middle_name: "",
    last_name: "",

    date_of_birth: "",
    wedding_date: "",

    area_no: "",
    email: "",
    mobile_number: "",

    gender: "",
    spouse_name: "",
    occupation: "",
    status: "in_service",

    membership_fee: "",

    address_flat_number: "",
    address_premises: "",
    address_area: "",
    address_landmark: "",
    address_city: "",
    address_pin: "",
};

function extractDateOnly(value?: string | null): string {
    if (!value) return "";

    // Handles:
    // 1990-01-15
    // 1990-01-15T00:00:00.000000Z
    // 1990-01-14T18:30:00.000000Z
    //
    // We deliberately do NOT use new Date(value), because that can
    // shift a date-only value across time zones.
    const match = value.match(/^(\d{4}-\d{2}-\d{2})/);

    return match?.[1] ?? "";
}

function formatDateOnly(value?: string | null): string {
    const dateOnly = extractDateOnly(value);

    if (!dateOnly) return "—";

    const [year, month, day] = dateOnly.split("-");

    return `${day}/${month}/${year}`;
}

function getInitials(member: Member): string {
    const first = member.first_name?.trim()?.charAt(0) ?? "";
    const last =
        member.last_name?.trim()?.charAt(0) ??
        member.family_name?.trim()?.charAt(0) ??
        "";

    return `${first}${last}`.toUpperCase() || "?";
}

function getFullName(member: Member): string {
    return [
        member.first_name,
        member.middle_name,
        member.last_name,
    ]
        .filter(Boolean)
        .join(" ");
}

function validateForm(
    form: FormState,
    profilePhoto: File | null,
    couplePic: File | null
): FormErrors {
    const errors: FormErrors = {};

    if (!form.family_name.trim()) {
        errors.family_name = "Family name is required.";
    }

    if (!form.first_name.trim()) {
        errors.first_name = "First name is required.";
    }

    if (!form.date_of_birth) {
        errors.date_of_birth = "Date of birth is required.";
    }

    if (!form.area_no.trim()) {
        errors.area_no = "Area number is required.";
    } else if (!/^\d{1,2}$/.test(form.area_no.trim())) {
        errors.area_no = "Enter a valid area number.";
    }

    if (!form.email.trim()) {
        errors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
        errors.email = "Enter a valid email address.";
    }

    if (!form.mobile_number.trim()) {
        errors.mobile_number = "Mobile number is required.";
    } else if (!/^\d{10}$/.test(form.mobile_number.trim())) {
        errors.mobile_number = "Mobile number must contain exactly 10 digits.";
    }

    if (!form.gender) {
        errors.gender = "Gender is required.";
    }

    if (!form.status) {
        errors.status = "Status is required.";
    }

    if (form.membership_fee.trim()) {
        const fee = Number(form.membership_fee);

        if (!Number.isFinite(fee) || fee < 0) {
            errors.membership_fee = "Enter a valid membership fee.";
        }
    }

    if (form.address_pin.trim() && !/^\d{6}$/.test(form.address_pin.trim())) {
        errors.address_pin = "PIN code must contain exactly 6 digits.";
    }

    if (profilePhoto && profilePhoto.size > 2 * 1024 * 1024) {
        errors.profile_photo = "Profile photo must be 2 MB or smaller.";
    }

    if (couplePic && couplePic.size > 2 * 1024 * 1024) {
        errors.couple_pic = "Couple photo must be 2 MB or smaller.";
    }

    return errors;
}

export default function MembersPage() {
    const [members, setMembers] = useState<Member[]>([]);
    const [pagination, setPagination] = useState<Pagination>({
        current_page: 1,
        last_page: 1,
        per_page: 20,
        total: 0,
    });

    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [showAddForm, setShowAddForm] = useState(false);
    const [importingMembers, setImportingMembers] =
        useState(false);

    const [form, setForm] = useState<FormState>(initialForm);
    const [errors, setErrors] = useState<FormErrors>({});

    const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
    const [couplePic, setCouplePic] = useState<File | null>(null);

    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [downloadingTemplate, setDownloadingTemplate] = useState(false);
    const [importMessage, setImportMessage] = useState("");
    const [importError, setImportError] = useState("");
    const [selectedImportFile, setSelectedImportFile] =
        useState<File | null>(null);

    const [previewingImport, setPreviewingImport] =
        useState(false);

    const [importPreview, setImportPreview] =
        useState<MemberImportPreview | null>(null);

    const loadMembers = useCallback(
        async (page = 1) => {
            const token = localStorage.getItem("platform_token");

            if (!token) {
                setErrorMessage("Your platform session has expired. Please sign in again.");
                setLoading(false);
                return;
            }

            setLoading(true);
            setErrorMessage("");

            try {
                const params = new URLSearchParams({
                    page: String(page),
                    per_page: "20",
                });

                if (search.trim()) {
                    params.set("search", search.trim());
                }

                const storedChurch = localStorage.getItem("platform_church");

                if (!storedChurch) {
                    throw new Error(
                        "Church information is missing. Please sign in again."
                    );
                }

                let churchCode: string;

                try {
                    const parsedChurch = JSON.parse(storedChurch);
                    churchCode = String(parsedChurch?.church_code || "").trim();
                } catch {
                    throw new Error(
                        "Invalid church information. Please sign in again."
                    );
                }

                if (!churchCode) {
                    throw new Error(
                        "Church code is missing. Please sign in again."
                    );
                }

                const response = await fetch(
                    `${API_BASE_URL}/platform/members?${params.toString()}`,
                    {
                        method: "GET",
                        headers: {
                            Accept: "application/json",
                            Authorization: `Bearer ${token}`,
                            "X-Church-Code": churchCode,
                        },
                    }
                );

                const data: MemberListResponse = await response.json().catch(() => ({
                    success: false,
                    data: {
                        members: {
                            data: [],
                            current_page: 1,
                            last_page: 1,
                            per_page: 20,
                            total: 0,
                        },
                    },
                }));

                if (!response.ok || !data.success) {
                    if (response.status === 401) {
                        throw new Error(
                            "Your platform session has expired. Please sign in again."
                        );
                    }

                    throw new Error(data.message || "Unable to load members.");
                }

                const memberPage = data.data.members;

                setMembers(memberPage.data || []);

                setPagination({
                    current_page: memberPage.current_page,
                    last_page: memberPage.last_page,
                    per_page: memberPage.per_page,
                    total: memberPage.total,
                });
            } catch (error) {
                setErrorMessage(
                    error instanceof Error
                        ? error.message
                        : "Unable to load members."
                );
            } finally {
                setLoading(false);
            }
        },
        [search]
    );

    useEffect(() => {
        loadMembers(1);
    }, [loadMembers]);

    function updateField<K extends keyof FormState>(
        field: K,
        value: FormState[K]
    ) {
        setForm((previous) => ({
            ...previous,
            [field]: value,
        }));

        setErrors((previous) => ({
            ...previous,
            [field]: undefined,
        }));
    }

    function handleTextChange(
        event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) {
        const { name, value } = event.target;

        updateField(name as keyof FormState, value);
    }

    function handleMobileChange(event: ChangeEvent<HTMLInputElement>) {
        const value = event.target.value.replace(/\D/g, "").slice(0, 10);

        updateField("mobile_number", value);
    }

    function handleAreaChange(event: ChangeEvent<HTMLInputElement>) {
        const value = event.target.value.replace(/\D/g, "").slice(0, 2);

        updateField("area_no", value);
    }

    function handlePinChange(event: ChangeEvent<HTMLInputElement>) {
        const value = event.target.value.replace(/\D/g, "").slice(0, 6);

        updateField("address_pin", value);
    }

    function resetForm() {
        setForm(initialForm);
        setErrors({});
        setProfilePhoto(null);
        setCouplePic(null);
        setSuccessMessage("");
        setErrorMessage("");
    }

    function openAddForm() {
        resetForm();
        setShowAddForm(true);
    }

    function closeAddForm() {
        if (saving) return;

        setShowAddForm(false);
        resetForm();
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (saving) {
            return;
        }
        setSuccessMessage("");
        setErrorMessage("");

        const validationErrors = validateForm(
            form,
            profilePhoto,
            couplePic
        );

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            setErrorMessage("Please correct the highlighted fields.");
            return;
        }

        const token = localStorage.getItem("platform_token");

        if (!token) {
            setErrorMessage(
                "Your platform session has expired. Please sign in again."
            );
            return;
        }

        setSaving(true);

        try {
            const formData = new FormData();

            /*
             * Important:
             * Do NOT convert these values with new Date().
             *
             * The backend expects a date string and date_of_birth/wedding_date
             * are date-only fields from the user's perspective.
             */
            formData.append("family_name", form.family_name.trim());
            formData.append("first_name", form.first_name.trim());

            if (form.middle_name.trim()) {
                formData.append("middle_name", form.middle_name.trim());
            }

            if (form.last_name.trim()) {
                formData.append("last_name", form.last_name.trim());
            }

            formData.append("date_of_birth", form.date_of_birth);

            if (form.wedding_date) {
                formData.append("wedding_date", form.wedding_date);
            }

            formData.append("area_no", form.area_no.trim());
            formData.append("email", form.email.trim().toLowerCase());
            formData.append("mobile_number", form.mobile_number.trim());

            formData.append("gender", form.gender);

            if (form.spouse_name.trim()) {
                formData.append("spouse_name", form.spouse_name.trim());
            }

            if (form.occupation.trim()) {
                formData.append("occupation", form.occupation.trim());
            }

            formData.append("status", form.status);

            if (form.membership_fee.trim()) {
                formData.append("membership_fee", form.membership_fee.trim());
            }

            if (form.address_flat_number.trim()) {
                formData.append(
                    "address_flat_number",
                    form.address_flat_number.trim()
                );
            }

            if (form.address_premises.trim()) {
                formData.append(
                    "address_premises",
                    form.address_premises.trim()
                );
            }

            if (form.address_area.trim()) {
                formData.append(
                    "address_area",
                    form.address_area.trim()
                );
            }

            if (form.address_landmark.trim()) {
                formData.append(
                    "address_landmark",
                    form.address_landmark.trim()
                );
            }

            if (form.address_city.trim()) {
                formData.append(
                    "address_city",
                    form.address_city.trim()
                );
            }

            if (form.address_pin.trim()) {
                formData.append(
                    "address_pin",
                    form.address_pin.trim()
                );
            }

            formData.append("status_flag", "1");

            if (profilePhoto) {
                formData.append("profile_photo", profilePhoto);
            }

            if (couplePic) {
                formData.append("couple_pic", couplePic);
            }

            const response = await fetch(
                `${API_BASE_URL}/platform/members`,
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

                if (response.status === 422 && data?.errors) {
                    const backendErrors: FormErrors = {};

                    Object.entries(data.errors).forEach(([field, messages]) => {
                        if (Array.isArray(messages) && messages.length > 0) {
                            backendErrors[field as keyof FormErrors] = String(messages[0]);
                        }
                    });

                    setErrors(backendErrors);
                    throw new Error(
                        data.message || "Please correct the highlighted fields."
                    );
                }

                throw new Error(
                    data?.message || "Unable to create the member."
                );
            }

            setSuccessMessage("Member added successfully.");

            resetForm();
            setShowAddForm(false);

            await loadMembers(1);


            resetForm();
            setShowAddForm(false);

            await loadMembers(1);
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Unable to create the member."
            );
        } finally {
            setSaving(false);
        }
    }

    function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSearch(searchInput.trim());
    }

    function clearSearch() {
        setSearchInput("");
        setSearch("");
    }

    const showingText = useMemo(() => {
        if (pagination.total === 0) {
            return "No members found";
        }

        return `${pagination.total} member${pagination.total === 1 ? "" : "s"
            }`;
    }, [pagination.total]);


    const handleDownloadTemplate = async () => {
        try {
            setDownloadingTemplate(true);
            setImportMessage("");
            setImportError("");

            const blob = await downloadMemberImportTemplate();

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");

            link.href = url;
            link.download = "church_members_template.csv";

            document.body.appendChild(link);
            link.click();
            link.remove();

            window.URL.revokeObjectURL(url);

            setImportMessage(
                "CSV template downloaded successfully."
            );
        } catch (error) {
            setImportError(
                error instanceof Error
                    ? error.message
                    : "Unable to download the CSV template."
            );
        } finally {
            setDownloadingTemplate(false);
        }
    };

    const handleImportFileChange = (
        event: ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0] ?? null;

        setImportError("");
        setImportMessage("");
        setImportPreview(null);

        if (!file) {
            setSelectedImportFile(null);
            return;
        }

        if (!file.name.toLowerCase().endsWith(".csv")) {
            setSelectedImportFile(null);
            setImportError("Please select a CSV file.");
            event.target.value = "";
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            setSelectedImportFile(null);
            setImportError("The CSV file must not exceed 10 MB.");
            event.target.value = "";
            return;
        }

        setSelectedImportFile(file);
    };

    const handlePreviewImport = async () => {
        if (!selectedImportFile) {
            setImportError("Please select a CSV file first.");
            return;
        }

        try {
            setPreviewingImport(true);
            setImportError("");
            setImportMessage("");
            setImportPreview(null);

            const response = await previewMemberImport(
                selectedImportFile
            );



            if (!response.success || !response.data) {
                throw new Error(
                    response.message || "Unable to preview the CSV file."
                );
            }

            setImportPreview(response.data);

            setImportMessage(
                "CSV preview generated successfully."
            );
        } catch (error) {
            const typedError = error as Error & {
                responseData?: {
                    data?: MemberImportPreview;
                    message?: string;
                };
            };

            if (typedError.responseData?.data) {
                setImportPreview(typedError.responseData.data);
            }

            setImportError(
                typedError.responseData?.message ||
                typedError.message ||
                "Unable to preview the CSV file."
            );
        } finally {
            setPreviewingImport(false);
        }
    };

    const handleConfirmImport = async () => {
        if (!selectedImportFile) {
            setImportError("Please select a CSV file first.");
            return;
        }
        const preview = importPreview;

        if (!preview) {
            setImportError("Please preview the CSV file first.");
            return;
        }


        const {
            total_rows,
            valid_rows,
            invalid_rows,
            duplicate_rows,
            importable_rows,
        } = importPreview.summary;

        if (invalid_rows > 0 || duplicate_rows > 0) {
            setImportError(
                "The CSV contains validation errors or duplicates. Please correct the CSV and preview it again."
            );
            return;
        }

        if (importable_rows === 0) {
            setImportError("There are no members available to import.");
            return;
        }

        const confirmed = window.confirm(
            `Are you sure you want to import ${importable_rows} members?\n\n` +
            `Total rows: ${total_rows}\n` +
            `Valid rows: ${valid_rows}\n` +
            `Importable rows: ${importable_rows}`
        );

        if (!confirmed) {
            return;
        }

        try {
            setImportingMembers(true);
            setImportError("");
            setImportMessage("");

            const response = await importMembers(
                selectedImportFile
            );

            if (!response.success) {
                throw new Error(
                    response.message || "Unable to import members."
                );
            }

            setImportMessage(
                response.message ||
                `${response.data?.created ?? importable_rows} members imported successfully.`
            );

            // Clear import state
            setSelectedImportFile(null);
            setImportPreview(null);

            // Reset the file input
            const fileInput = document.getElementById(
                "member-import-file"
            ) as HTMLInputElement | null;

            if (fileInput) {
                fileInput.value = "";
            }

            // Refresh the members list
            await loadMembers();
        } catch (error) {
            const typedError = error as Error & {
                responseData?: {
                    message?: string;
                };
            };

            setImportError(
                typedError.responseData?.message ||
                typedError.message ||
                "Unable to import members."
            );
        } finally {
            setImportingMembers(false);
        }
    };

    const importSummary = importPreview?.summary;


    const displayImportValue = (
        value: string | null | undefined
    ): string => {
        if (value === null || value === undefined || value === "") {
            return "—";
        }

        return value;
    };

    const formatImportErrors = (errors: unknown): string => {
        if (Array.isArray(errors)) {
            return errors.map((error) => String(error)).join(", ");
        }

        if (errors && typeof errors === "object") {
            const values = Object.values(errors as Record<string, unknown>);

            return values
                .flatMap((value) => {
                    if (Array.isArray(value)) {
                        return value.map((item) => String(item));
                    }

                    return [String(value)];
                })
                .join(", ");
        }

        if (errors === null || errors === undefined) {
            return "";
        }

        return String(errors);
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

                <div className="rounded-xl border bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-[#191970]">
                                    Bulk Import Members
                                </h2>

                                <p className="mt-1 text-sm text-gray-600">
                                    Add multiple church members using a CSV file.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={handleDownloadTemplate}
                                disabled={downloadingTemplate}
                                className="inline-flex items-center justify-center rounded-lg bg-[#191970] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#12124f] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {downloadingTemplate
                                    ? "Downloading..."
                                    : "Download CSV Template"}
                            </button>
                        </div>

                        <div className="border-t pt-5">
                            <label
                                htmlFor="member-import-file"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                                Select CSV File
                            </label>

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <input
                                    id="member-import-file"
                                    type="file"
                                    accept=".csv,text/csv"
                                    onChange={handleImportFileChange}
                                    disabled={previewingImport}
                                    className="block w-full rounded-lg border border-gray-300 bg-white text-sm text-gray-700 file:mr-4 file:border-0 file:bg-gray-100 file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
                                />

                                <button
                                    type="button"
                                    onClick={handlePreviewImport}
                                    disabled={!selectedImportFile || previewingImport}
                                    className="inline-flex min-w-[150px] items-center justify-center rounded-lg bg-[#191970] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#12124f] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {previewingImport
                                        ? "Previewing..."
                                        : "Preview CSV"}
                                </button>
                            </div>

                            {selectedImportFile && (
                                <p className="mt-2 text-sm text-gray-600">
                                    Selected file:{" "}
                                    <span className="font-medium">
                                        {selectedImportFile.name}
                                    </span>
                                </p>
                            )}
                        </div>

                        {importMessage && (
                            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                                {importMessage}
                            </div>
                        )}

                        {importError && (
                            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {importError}
                            </div>
                        )}

                        {importPreview && (
                            <div className="border-t pt-5">
                                <h3 className="text-base font-semibold text-[#191970]">
                                    Import Preview
                                </h3>

                                {/* Summary */}
                                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                    <div className="rounded-lg bg-gray-50 p-4">
                                        <p className="text-xs text-gray-500">
                                            Total Rows
                                        </p>

                                        <p className="mt-1 text-xl font-semibold text-gray-900">
                                            {importPreview.summary.total_rows}
                                        </p>
                                    </div>

                                    <div className="rounded-lg bg-green-50 p-4">
                                        <p className="text-xs text-green-700">
                                            Valid Rows
                                        </p>

                                        <p className="mt-1 text-xl font-semibold text-green-700">
                                            {importPreview.summary.valid_rows}
                                        </p>
                                    </div>

                                    <div className="rounded-lg bg-red-50 p-4">
                                        <p className="text-xs text-red-700">
                                            Invalid Rows
                                        </p>

                                        <p className="mt-1 text-xl font-semibold text-red-700">
                                            {importPreview.summary.invalid_rows}
                                        </p>
                                    </div>

                                    <div className="rounded-lg bg-amber-50 p-4">
                                        <p className="text-xs text-amber-700">
                                            Duplicates
                                        </p>

                                        <p className="mt-1 text-xl font-semibold text-amber-700">
                                            {importPreview.summary.duplicate_rows}
                                        </p>
                                    </div>
                                </div>

                                {/* Importable Members */}
                                {importPreview.importable_rows &&
                                    importPreview.importable_rows.length > 0 && (
                                        <div className="mt-6">
                                            <div className="mb-3">
                                                <h4 className="text-sm font-semibold text-[#191970]">
                                                    Importable Members
                                                </h4>

                                                <p className="mt-1 text-xs text-gray-500">
                                                    These members passed validation and are ready
                                                    to be imported.
                                                </p>
                                            </div>

                                            <div className="overflow-x-auto rounded-lg border border-slate-200">
                                                <table className="min-w-full divide-y divide-slate-200 text-sm">
                                                    <thead className="bg-slate-50">
                                                        <tr>
                                                            <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-slate-600">
                                                                Row
                                                            </th>

                                                            <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-slate-600">
                                                                Family Name
                                                            </th>

                                                            <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-slate-600">
                                                                First Name
                                                            </th>

                                                            <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-slate-600">
                                                                Last Name
                                                            </th>

                                                            <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-slate-600">
                                                                Date of Birth
                                                            </th>

                                                            <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-slate-600">
                                                                Mobile
                                                            </th>

                                                            <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-slate-600">
                                                                Email
                                                            </th>

                                                            <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-slate-600">
                                                                Area
                                                            </th>

                                                            <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-slate-600">
                                                                Status
                                                            </th>
                                                        </tr>
                                                    </thead>

                                                    <tbody className="divide-y divide-slate-100 bg-white">
                                                        {importPreview.importable_rows.map((item) => (
                                                            <tr
                                                                key={`importable-${item.row}`}
                                                                className="hover:bg-slate-50"
                                                            >
                                                                <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                                                                    {item.row}
                                                                </td>

                                                                <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                                                                    {displayImportValue(
                                                                        item.data.family_name
                                                                    )}
                                                                </td>

                                                                <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                                                                    {displayImportValue(
                                                                        item.data.first_name
                                                                    )}
                                                                </td>

                                                                <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                                                                    {displayImportValue(
                                                                        item.data.last_name
                                                                    )}
                                                                </td>

                                                                <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                                                                    {displayImportValue(
                                                                        item.data.date_of_birth
                                                                    )}
                                                                </td>

                                                                <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                                                                    {displayImportValue(
                                                                        item.data.mobile_number
                                                                    )}
                                                                </td>

                                                                <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                                                                    {displayImportValue(
                                                                        item.data.email
                                                                    )}
                                                                </td>

                                                                <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                                                                    {displayImportValue(
                                                                        item.data.area_no
                                                                    )}
                                                                </td>

                                                                <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                                                                    {displayImportValue(
                                                                        item.data.status
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                {/* Validation Errors */}
                                {importPreview.invalid_rows &&
                                    importPreview.invalid_rows.length > 0 && (
                                        <div className="mt-6">
                                            <div className="mb-3">
                                                <h4 className="text-sm font-semibold text-red-700">
                                                    Validation Errors
                                                </h4>

                                                <p className="mt-1 text-xs text-gray-500">
                                                    Correct these rows in the CSV and upload the
                                                    file again.
                                                </p>
                                            </div>

                                            <div className="space-y-3">
                                                {importPreview.invalid_rows.map((item) => (
                                                    <div
                                                        key={`invalid-${item.row}`}
                                                        className="rounded-lg border border-red-200 bg-red-50 p-4"
                                                    >
                                                        <p className="font-semibold text-red-800">
                                                            Row {item.row}
                                                        </p>

                                                        {item.data && (
                                                            <p className="mt-1 text-sm text-red-700">
                                                                {displayImportValue(
                                                                    item.data.family_name
                                                                )}{" "}
                                                                {displayImportValue(
                                                                    item.data.first_name
                                                                )}{" "}
                                                                {displayImportValue(
                                                                    item.data.last_name
                                                                )}
                                                            </p>
                                                        )}

                                                        {item.errors &&
                                                            Object.entries(item.errors).map(
                                                                ([field, messages]) => (
                                                                    <div
                                                                        key={field}
                                                                        className="mt-2 text-sm text-red-700"
                                                                    >
                                                                        <span className="font-medium">
                                                                            {field}:
                                                                        </span>{" "}
                                                                        {formatImportErrors(messages)}
                                                                    </div>
                                                                )
                                                            )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                {/* Duplicate Rows */}
                                {importPreview.duplicate_rows &&
                                    importPreview.duplicate_rows.length > 0 && (
                                        <div className="mt-6">
                                            <div className="mb-3">
                                                <h4 className="text-sm font-semibold text-amber-700">
                                                    Duplicate Members
                                                </h4>

                                                <p className="mt-1 text-xs text-gray-500">
                                                    These rows cannot be imported because the
                                                    email or mobile number already exists or is
                                                    duplicated within the CSV.
                                                </p>
                                            </div>

                                            <div className="space-y-3">
                                                {importPreview.duplicate_rows.map((item) => (
                                                    <div
                                                        key={`duplicate-${item.row}`}
                                                        className="rounded-lg border border-amber-200 bg-amber-50 p-4"
                                                    >
                                                        <p className="font-semibold text-amber-800">
                                                            Row {item.row}
                                                        </p>

                                                        {item.data && (
                                                            <p className="mt-1 text-sm text-amber-700">
                                                                {displayImportValue(
                                                                    item.data.family_name
                                                                )}{" "}
                                                                {displayImportValue(
                                                                    item.data.first_name
                                                                )}{" "}
                                                                {displayImportValue(
                                                                    item.data.last_name
                                                                )}
                                                            </p>
                                                        )}

                                                        {item.errors &&
                                                            Object.entries(item.errors).map(
                                                                ([field, messages]) => (
                                                                    <div
                                                                        key={field}
                                                                        className="mt-2 text-sm text-amber-700"
                                                                    >
                                                                        <span className="font-medium">
                                                                            {field}:
                                                                        </span>{" "}
                                                                        {formatImportErrors(messages)}
                                                                    </div>
                                                                )
                                                            )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                {/* Ready to Import */}
                                {importPreview.summary.invalid_rows === 0 &&
                                    importPreview.summary.duplicate_rows === 0 &&
                                    importPreview.summary.importable_rows > 0 && (
                                        <div className="mt-6 flex flex-col gap-3 rounded-lg border border-green-200 bg-green-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <p className="font-medium text-green-800">
                                                    Ready to import
                                                </p>

                                                <p className="mt-1 text-sm text-green-700">
                                                    {importPreview.summary.importable_rows} member
                                                    {importPreview.summary.importable_rows === 1
                                                        ? ""
                                                        : "s"}{" "}
                                                    will be added to the church database.
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={handleConfirmImport}
                                                disabled={importingMembers}
                                                className="inline-flex items-center justify-center rounded-lg bg-green-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                {importingMembers
                                                    ? "Importing..."
                                                    : `Confirm Import – ${importPreview.summary.importable_rows} Members`}
                                            </button>
                                        </div>
                                    )}
                            </div>
                        )}
                    </div>
                </div>

                {importSummary &&
                    importSummary.invalid_rows === 0 &&
                    importSummary.duplicate_rows === 0 &&
                    importSummary.importable_rows > 0 && (
                        <div className="mt-5 flex flex-col gap-3 rounded-lg border border-green-200 bg-green-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="font-medium text-green-800">
                                    Ready to import
                                </p>

                                <p className="mt-1 text-sm text-green-700">
                                    {importSummary.importable_rows} member
                                    {importSummary.importable_rows === 1 ? "" : "s"}{" "}
                                    will be added to the church database.
                                </p>
                            </div>

                            {importPreview.importable_rows.length > 0 && (
                                <div className="mt-6">
                                    <div className="mb-3">
                                        <h4 className="text-sm font-semibold text-[#191970]">
                                            Importable Members
                                        </h4>

                                        <p className="mt-1 text-xs text-gray-500">
                                            These members passed validation and are ready to be imported.
                                        </p>
                                    </div>

                                    <div className="overflow-x-auto rounded-lg border">
                                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-700">
                                                        Row
                                                    </th>

                                                    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-700">
                                                        Family Name
                                                    </th>

                                                    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-700">
                                                        First Name
                                                    </th>

                                                    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-700">
                                                        Last Name
                                                    </th>

                                                    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-700">
                                                        Date of Birth
                                                    </th>

                                                    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-700">
                                                        Mobile
                                                    </th>

                                                    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-700">
                                                        Email
                                                    </th>

                                                    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-700">
                                                        Area
                                                    </th>

                                                    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-700">
                                                        Status
                                                    </th>
                                                </tr>
                                            </thead>

                                            <tbody className="divide-y divide-gray-100 bg-white">
                                                {importPreview.importable_rows.map((item) => (
                                                    <tr
                                                        key={item.row}
                                                        className="hover:bg-gray-50"
                                                    >
                                                        <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                                                            {item.row}
                                                        </td>

                                                        <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                                                            {displayImportValue(
                                                                item.data.family_name
                                                            )}
                                                        </td>

                                                        <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                                                            {displayImportValue(
                                                                item.data.first_name
                                                            )}
                                                        </td>

                                                        <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                                                            {displayImportValue(
                                                                item.data.last_name
                                                            )}
                                                        </td>

                                                        <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                                                            {displayImportValue(
                                                                item.data.date_of_birth
                                                            )}
                                                        </td>

                                                        <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                                                            {displayImportValue(
                                                                item.data.mobile_number
                                                            )}
                                                        </td>

                                                        <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                                                            {displayImportValue(
                                                                item.data.email
                                                            )}
                                                        </td>

                                                        <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                                                            {displayImportValue(
                                                                item.data.area_no
                                                            )}
                                                        </td>

                                                        <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                                                            {displayImportValue(
                                                                item.data.status
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {importPreview.invalid_rows.length > 0 && (
                                <div className="mt-6">
                                    <div className="mb-3">
                                        <h4 className="text-sm font-semibold text-red-700">
                                            Validation Errors
                                        </h4>

                                        <p className="mt-1 text-xs text-gray-500">
                                            Correct these rows in the CSV and upload the file again.
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        {importPreview.invalid_rows.map((item) => (
                                            <div
                                                key={`invalid-${item.row}`}
                                                className="rounded-lg border border-red-200 bg-red-50 p-4"
                                            >
                                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                                    <div>
                                                        <p className="font-semibold text-red-800">
                                                            Row {item.row}
                                                        </p>

                                                        {item.data && (
                                                            <p className="mt-1 text-sm text-red-700">
                                                                {displayImportValue(
                                                                    item.data.family_name
                                                                )}{" "}
                                                                {displayImportValue(
                                                                    item.data.first_name
                                                                )}{" "}
                                                                {displayImportValue(
                                                                    item.data.last_name
                                                                )}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {item.errors && (
                                                    <div className="mt-3 space-y-1">
                                                        {Object.entries(item.errors).map(
                                                            ([field, messages]) => (
                                                                <div
                                                                    key={field}
                                                                    className="text-sm text-red-700"
                                                                >
                                                                    <span className="font-medium">
                                                                        {field}:
                                                                    </span>{" "}
                                                                    {formatImportErrors(messages)}
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {importPreview.duplicate_rows.length > 0 && (
                                <div className="mt-6">
                                    <div className="mb-3">
                                        <h4 className="text-sm font-semibold text-amber-700">
                                            Duplicate Members
                                        </h4>

                                        <p className="mt-1 text-xs text-gray-500">
                                            These rows cannot be imported because the email
                                            or mobile number already exists or is duplicated
                                            within the CSV.
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        {importPreview.duplicate_rows.map((item) => (
                                            <div
                                                key={`duplicate-${item.row}`}
                                                className="rounded-lg border border-amber-200 bg-amber-50 p-4"
                                            >
                                                <p className="font-semibold text-amber-800">
                                                    Row {item.row}
                                                </p>

                                                {item.data && (
                                                    <p className="mt-1 text-sm text-amber-700">
                                                        {displayImportValue(
                                                            item.data.family_name
                                                        )}{" "}
                                                        {displayImportValue(
                                                            item.data.first_name
                                                        )}{" "}
                                                        {displayImportValue(
                                                            item.data.last_name
                                                        )}
                                                    </p>
                                                )}

                                                {item.errors && (
                                                    <div className="mt-3 space-y-1">
                                                        {Object.entries(item.errors).map(
                                                            ([field, messages]) => (
                                                                <div
                                                                    key={field}
                                                                    className="text-sm text-amber-700"
                                                                >
                                                                    <span className="font-medium">
                                                                        {field}:
                                                                    </span>{" "}
                                                                    {formatImportErrors(messages)}
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={handleConfirmImport}
                                disabled={importingMembers}
                                className="inline-flex items-center justify-center rounded-lg bg-green-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {importingMembers
                                    ? "Importing..."
                                    : `Confirm Import – ${importSummary.importable_rows} Members`}
                            </button>
                        </div>
                    )}

                {/* Header */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="mb-1 text-sm font-medium text-slate-500">
                            Church Administration
                        </div>

                        <h1 className="text-2xl font-bold text-[#191970]">
                            Members
                        </h1>

                        <p className="mt-1 text-sm text-slate-600">
                            Manage the members of your church community.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={openAddForm}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#191970] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#11115c] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <span className="text-lg leading-none">+</span>
                        Add Member
                    </button>
                </div>

                {/* Messages */}
                {successMessage && (
                    <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                        {successMessage}
                    </div>
                )}

                {errorMessage && (
                    <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {errorMessage}
                    </div>
                )}

                {/* Add Member Form */}
                {showAddForm && (
                    <div className="mb-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
                            <div>
                                <h2 className="font-semibold text-[#191970]">
                                    Add New Member
                                </h2>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    Fields marked with <span className="text-red-500">*</span>{" "}
                                    are required.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeAddForm}
                                disabled={saving}
                                className="rounded-md px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-200 hover:text-slate-800 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="space-y-8 p-5">

                                {/* Personal Details */}
                                <section>
                                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#191970]">
                                        Personal Details
                                    </h3>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                                        <Field
                                            label="Family Name"
                                            required
                                            name="family_name"
                                            value={form.family_name}
                                            onChange={handleTextChange}
                                            error={errors.family_name}
                                        />

                                        <Field
                                            label="First Name"
                                            required
                                            name="first_name"
                                            value={form.first_name}
                                            onChange={handleTextChange}
                                            error={errors.first_name}
                                        />

                                        <Field
                                            label="Middle Name"
                                            name="middle_name"
                                            value={form.middle_name}
                                            onChange={handleTextChange}
                                        />

                                        <Field
                                            label="Last Name"
                                            name="last_name"
                                            value={form.last_name}
                                            onChange={handleTextChange}
                                        />

                                        <Field
                                            label="Date of Birth"
                                            required
                                            type="date"
                                            name="date_of_birth"
                                            value={form.date_of_birth}
                                            onChange={handleTextChange}
                                            error={errors.date_of_birth}
                                        />

                                        <Field
                                            label="Wedding Date"
                                            type="date"
                                            name="wedding_date"
                                            value={form.wedding_date}
                                            onChange={handleTextChange}
                                            error={errors.wedding_date}
                                        />

                                        <div>
                                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                                Gender <Required />
                                            </label>

                                            <select
                                                name="gender"
                                                value={form.gender}
                                                onChange={handleTextChange}
                                                className={inputClass(!!errors.gender)}
                                            >
                                                <option value="">Select gender</option>
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                                <option value="other">Other</option>
                                            </select>

                                            <FieldError message={errors.gender} />
                                        </div>

                                        <Field
                                            label="Spouse Name"
                                            name="spouse_name"
                                            value={form.spouse_name}
                                            onChange={handleTextChange}
                                        />
                                    </div>
                                </section>

                                {/* Contact & Membership */}
                                <section>
                                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#191970]">
                                        Contact & Membership
                                    </h3>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                                        <Field
                                            label="Area No."
                                            required
                                            name="area_no"
                                            value={form.area_no}
                                            onChange={handleAreaChange}
                                            error={errors.area_no}
                                            inputMode="numeric"
                                            maxLength={2}
                                        />

                                        <Field
                                            label="Mobile Number"
                                            required
                                            name="mobile_number"
                                            value={form.mobile_number}
                                            onChange={handleMobileChange}
                                            error={errors.mobile_number}
                                            inputMode="numeric"
                                            maxLength={10}
                                            placeholder="10 digit mobile number"
                                        />

                                        <Field
                                            label="Email"
                                            required
                                            type="email"
                                            name="email"
                                            value={form.email}
                                            onChange={handleTextChange}
                                            error={errors.email}
                                        />

                                        <div>
                                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                                Member Status <Required />
                                            </label>

                                            <select
                                                name="status"
                                                value={form.status}
                                                onChange={handleTextChange}
                                                className={inputClass(!!errors.status)}
                                            >
                                                <option value="in_service">In Service</option>
                                                <option value="retired">Retired</option>
                                                <option value="other">Other</option>
                                            </select>

                                            <FieldError message={errors.status} />
                                        </div>

                                        <Field
                                            label="Occupation"
                                            name="occupation"
                                            value={form.occupation}
                                            onChange={handleTextChange}
                                        />

                                        <Field
                                            label="Membership Fee"
                                            name="membership_fee"
                                            value={form.membership_fee}
                                            onChange={handleTextChange}
                                            error={errors.membership_fee}
                                            inputMode="decimal"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </section>

                                {/* Address */}
                                <section>
                                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#191970]">
                                        Address
                                    </h3>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                                        <Field
                                            label="Flat / House No."
                                            name="address_flat_number"
                                            value={form.address_flat_number}
                                            onChange={handleTextChange}
                                        />

                                        <Field
                                            label="Premises / Building"
                                            name="address_premises"
                                            value={form.address_premises}
                                            onChange={handleTextChange}
                                        />

                                        <Field
                                            label="Area"
                                            name="address_area"
                                            value={form.address_area}
                                            onChange={handleTextChange}
                                        />

                                        <Field
                                            label="Landmark"
                                            name="address_landmark"
                                            value={form.address_landmark}
                                            onChange={handleTextChange}
                                        />

                                        <Field
                                            label="City"
                                            name="address_city"
                                            value={form.address_city}
                                            onChange={handleTextChange}
                                        />

                                        <Field
                                            label="PIN Code"
                                            name="address_pin"
                                            value={form.address_pin}
                                            onChange={handlePinChange}
                                            error={errors.address_pin}
                                            inputMode="numeric"
                                            maxLength={6}
                                        />
                                    </div>
                                </section>

                                {/* Photos */}
                                <section>
                                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#191970]">
                                        Photos
                                    </h3>

                                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                        <FileField
                                            label="Profile Photo"
                                            file={profilePhoto}
                                            onChange={(file) => {
                                                setProfilePhoto(file);
                                                setErrors((previous) => ({
                                                    ...previous,
                                                    profile_photo: undefined,
                                                }));
                                            }}
                                            error={errors.profile_photo}
                                        />

                                        <FileField
                                            label="Couple Photo"
                                            file={couplePic}
                                            onChange={(file) => {
                                                setCouplePic(file);
                                                setErrors((previous) => ({
                                                    ...previous,
                                                    couple_pic: undefined,
                                                }));
                                            }}
                                            error={errors.couple_pic}
                                        />
                                    </div>

                                    <p className="mt-2 text-xs text-slate-500">
                                        JPG, PNG, WEBP or other supported image format. Maximum
                                        size: 2 MB per image.
                                    </p>
                                </section>
                            </div>

                            {/* Form Footer */}
                            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={closeAddForm}
                                    disabled={saving}
                                    className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="rounded-lg bg-[#191970] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#11115c] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {saving ? (
                                        <span className="inline-flex items-center gap-2">
                                            <Spinner />
                                            Saving...
                                        </span>
                                    ) : (
                                        "Add Member"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Member List */}
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 px-5 py-4">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <h2 className="font-semibold text-[#191970]">
                                    Church Members
                                </h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    {showingText}
                                </p>
                            </div>

                            <form
                                onSubmit={handleSearchSubmit}
                                className="flex w-full gap-2 sm:w-auto"
                            >
                                <input
                                    type="search"
                                    value={searchInput}
                                    onChange={(event) => setSearchInput(event.target.value)}
                                    placeholder="Search name, email, mobile..."
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-[#191970] focus:ring-2 focus:ring-[#191970]/10 sm:w-72"
                                />

                                <button
                                    type="submit"
                                    className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
                                >
                                    Search
                                </button>

                                {search && (
                                    <button
                                        type="button"
                                        onClick={clearSearch}
                                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                                    >
                                        Clear
                                    </button>
                                )}
                            </form>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex min-h-64 items-center justify-center">
                            <div className="inline-flex items-center gap-3 text-sm text-slate-500">
                                <Spinner />
                                Loading members...
                            </div>
                        </div>
                    ) : members.length === 0 ? (
                        <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
                            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">
                                👤
                            </div>

                            <h3 className="font-semibold text-slate-700">
                                No members found
                            </h3>

                            <p className="mt-1 max-w-md text-sm text-slate-500">
                                {search
                                    ? "Try a different search term."
                                    : "Add your first church member to get started."}
                            </p>

                            {!search && (
                                <button
                                    type="button"
                                    onClick={openAddForm}
                                    className="mt-4 rounded-lg bg-[#191970] px-4 py-2 text-sm font-semibold text-white hover:bg-[#11115c]"
                                >
                                    Add First Member
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Desktop table */}
                            <div className="hidden overflow-x-auto md:block">
                                <table className="w-full min-w-[900px]">
                                    <thead>
                                        <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            <th className="px-5 py-3">Member</th>
                                            <th className="px-5 py-3">Mobile</th>
                                            <th className="px-5 py-3">Email</th>
                                            <th className="px-5 py-3">DOB</th>
                                            <th className="px-5 py-3">Area</th>
                                            <th className="px-5 py-3">Status</th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-100">
                                        {members.map((member) => (
                                            <tr
                                                key={member.id}
                                                className="transition hover:bg-slate-50"
                                            >
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#191970]/10 text-sm font-bold text-[#191970]">
                                                            {getInitials(member)}
                                                        </div>

                                                        <div>
                                                            <div className="font-medium text-slate-800">
                                                                {getFullName(member)}
                                                            </div>

                                                            <div className="text-xs text-slate-400">
                                                                #{member.id}
                                                                {member.family_name
                                                                    ? ` · ${member.family_name} family`
                                                                    : ""}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4 text-sm text-slate-600">
                                                    {member.mobile_number || "—"}
                                                </td>

                                                <td className="px-5 py-4 text-sm text-slate-600">
                                                    {member.email || "—"}
                                                </td>

                                                <td className="px-5 py-4 text-sm text-slate-600">
                                                    {formatDateOnly(member.date_of_birth)}
                                                </td>

                                                <td className="px-5 py-4 text-sm text-slate-600">
                                                    {member.area_no || "—"}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <StatusBadge status={member.status} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile cards */}
                            <div className="divide-y divide-slate-100 md:hidden">
                                {members.map((member) => (
                                    <div key={member.id} className="p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#191970]/10 text-sm font-bold text-[#191970]">
                                                {getInitials(member)}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="font-semibold text-slate-800">
                                                    {getFullName(member)}
                                                </div>

                                                <div className="mt-0.5 text-xs text-slate-400">
                                                    Member #{member.id}
                                                </div>

                                                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                                    <div>
                                                        <div className="text-xs text-slate-400">
                                                            Mobile
                                                        </div>
                                                        <div className="text-slate-700">
                                                            {member.mobile_number || "—"}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <div className="text-xs text-slate-400">
                                                            Area
                                                        </div>
                                                        <div className="text-slate-700">
                                                            {member.area_no || "—"}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <div className="text-xs text-slate-400">
                                                            Date of Birth
                                                        </div>
                                                        <div className="text-slate-700">
                                                            {formatDateOnly(member.date_of_birth)}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <div className="text-xs text-slate-400">
                                                            Status
                                                        </div>
                                                        <StatusBadge status={member.status} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="text-xs text-slate-500">
                                    Page {pagination.current_page} of{" "}
                                    {pagination.last_page}
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        disabled={pagination.current_page <= 1 || loading}
                                        onClick={() =>
                                            loadMembers(pagination.current_page - 1)
                                        }
                                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Previous
                                    </button>

                                    <button
                                        type="button"
                                        disabled={
                                            pagination.current_page >= pagination.last_page ||
                                            loading
                                        }
                                        onClick={() =>
                                            loadMembers(pagination.current_page + 1)
                                        }
                                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Reusable UI components                                                     */
/* -------------------------------------------------------------------------- */

function Required() {
    return <span className="text-red-500">*</span>;
}
function Field({
    label,
    required,
    name,
    value,
    onChange,
    error,
    type = "text",
    placeholder,
    inputMode,
    maxLength,
}: {
    label: string;
    required?: boolean;
    name: string;
    value: string;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
    error?: string;
    type?: string;
    placeholder?: string;
    inputMode?: "text" | "numeric" | "decimal" | "email" | "tel";
    maxLength?: number;
}) {
    return (
        <div>
            <label
                htmlFor={name}
                className="mb-1.5 block text-sm font-medium text-slate-700"
            >
                {label} {required && <Required />}
            </label>

            <input
                id={name}
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                inputMode={inputMode}
                maxLength={maxLength}
                className={inputClass(!!error)}
            />

            <FieldError message={error} />
        </div>
    );
}

function FileField({
    label,
    file,
    onChange,
    error,
}: {
    label: string;
    file: File | null;
    onChange: (file: File | null) => void;
    error?: string;
}) {
    return (
        <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                {label}
            </label>

            <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                onChange={(event) => {
                    onChange(event.target.files?.[0] ?? null);
                }}
                className="block w-full rounded-lg border border-slate-300 bg-white text-sm text-slate-600 file:mr-4 file:border-0 file:bg-slate-100 file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
            />

            {file && (
                <div className="mt-1.5 text-xs text-slate-500">
                    Selected: {file.name}
                </div>
            )}

            <FieldError message={error} />
        </div>
    );
}

function FieldError({ message }: { message?: string }) {
    if (!message) return null;

    return (
        <p className="mt-1 text-xs text-red-600">
            {message}
        </p>
    );
}

function StatusBadge({ status }: { status?: string | null }) {
    const label =
        status === "in_service"
            ? "In Service"
            : status === "retired"
                ? "Retired"
                : "Other";

    return (
        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
            {label}
        </span>
    );
}

function Spinner() {
    return (
        <span
            className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
        />
    );
}

function inputClass(hasError: boolean) {
    return [
        "w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition",
        "placeholder:text-slate-400",
        "focus:ring-2",
        hasError
            ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
            : "border-slate-300 focus:border-[#191970] focus:ring-[#191970]/10",
    ].join(" ");
}