const API_BASE_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/api";

export interface PlatformChurch {
    id: number;
    church_code: string;
    church_name: string;
    short_name?: string | null;
    email?: string | null;
    mobile?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    logo?: string | null;
    timezone?: string | null;
    financial_year_start_month?: number;
    status?: string;
    activated_at?: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface PlatformChurchResponse {
    success: boolean;
    message?: string;
    data: {
        church: PlatformChurch;
    };
}

export async function platformLogin(
    email: string,
    password: string
) {
    const response = await fetch(
        `${API_BASE_URL}/platform/auth/login`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                email,
                password,
            }),
        }
    );

    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.success) {
        throw new Error(
            data?.message || "Unable to sign in."
        );
    }

    return data;
}

/**
 * GET /api/platform/church
 */
export async function getPlatformChurch(): Promise<PlatformChurchResponse> {
    const token = localStorage.getItem("platform_token");

    if (!token) {
        throw new Error("Platform session has expired. Please sign in again.");
    }

    const response = await fetch(
        `${API_BASE_URL}/platform/church`,
        {
            method: "GET",
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
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
            data?.message || "Unable to load church information."
        );
    }

    return data;
}

/**
 * PATCH /api/platform/church
 */
export async function updatePlatformChurch(
    church: {
        church_name: string;
        short_name?: string | null;
        email?: string | null;
        mobile?: string | null;
        address?: string | null;
        city?: string | null;
        state?: string | null;
        country?: string | null;
    }
): Promise<PlatformChurchResponse> {
    const token = localStorage.getItem("platform_token");

    if (!token) {
        throw new Error("Platform session has expired. Please sign in again.");
    }

    const response = await fetch(
        `${API_BASE_URL}/platform/church`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(church),
        }
    );

    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.success) {
        if (response.status === 401) {
            throw new Error(
                "Your platform session has expired. Please sign in again."
            );
        }

        if (response.status === 422) {
            const errors = data?.errors;

            if (errors) {
                const firstError = Object.values(errors)
                    .flat()
                    .find((message) => typeof message === "string");

                if (firstError) {
                    throw new Error(firstError);
                }
            }
        }

        throw new Error(
            data?.message || "Unable to update church information."
        );
    }

    return data;


}

/**
 * POST /api/platform/onboarding/complete
 */
export async function completePlatformOnboarding(): Promise<PlatformChurchResponse> {
    const token = localStorage.getItem("platform_token");

    if (!token) {
        throw new Error(
            "Platform session has expired. Please sign in again."
        );
    }

    const response = await fetch(
        `${API_BASE_URL}/platform/onboarding/complete`,
        {
            method: "POST",
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
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
            data?.message || "Unable to complete church onboarding."
        );
    }

    return data;
}

export async function downloadMemberImportTemplate(): Promise<Blob> {
    const token = localStorage.getItem("platform_token");

    if (!token) {
        throw new Error("Platform session expired. Please sign in again.");
    }

    const response = await fetch(
        `${API_BASE_URL}/platform/members/import/template`,
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "text/csv",
            },
        }
    );

    if (!response.ok) {
        let message = "Unable to download the CSV template.";

        try {
            const data = await response.json();
            message = data.message || message;
        } catch {
            // Response wasn't JSON.
        }

        throw new Error(message);
    }

    return response.blob();
}

export interface MemberImportPreviewRow {
    row: number;
    data: Record<string, string | null>;
}

export interface MemberImportInvalidRow {
    row: number;
    data?: Record<string, string | null>;
    errors?: Record<string, string[]>;
}

export interface MemberImportDuplicateRow {
    row: number;
    data?: Record<string, string | null>;
    errors?: Record<string, string[]>;
}

export interface MemberImportSummary {
    total_rows: number;
    valid_rows: number;
    invalid_rows: number;
    duplicate_rows: number;
    importable_rows: number;
}

export interface MemberImportPreview {
    columns: string[];
    summary: MemberImportSummary;
    invalid_rows: MemberImportInvalidRow[];
    duplicate_rows: MemberImportDuplicateRow[];
    importable_rows: MemberImportPreviewRow[];
}

export interface MemberImportPreviewResponse {
    success: boolean;
    message?: string;
    data?: MemberImportPreview;
}
export async function previewMemberImport(
    file: File
): Promise<MemberImportPreviewResponse> {
    const token = localStorage.getItem("platform_token");

    if (!token) {
        throw new Error("Platform session expired. Please sign in again.");
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
        `${API_BASE_URL}/platform/members/import/preview`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
            },
            body: formData,
        }
    );

    const data = await response.json();

    if (!response.ok) {
        const error = new Error(
            data?.message || "Unable to preview the CSV file."
        ) as Error & {
            responseData?: MemberImportPreviewResponse;
        };

        error.responseData = data;
        throw error;
    }

    return data;
}

export interface MemberImportResult {
    created: number;
}

export interface MemberImportResponse {
    success: boolean;
    message?: string;
    data?: MemberImportResult;
}

export async function importMembers(
    file: File
): Promise<MemberImportResponse> {
    const token = localStorage.getItem("platform_token");

    if (!token) {
        throw new Error(
            "Platform session expired. Please sign in again."
        );
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
        `${API_BASE_URL}/platform/members/import`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
            },
            body: formData,
        }
    );

    const data = await response.json();

    if (!response.ok) {
        const error = new Error(
            data?.message || "Unable to import members."
        ) as Error & {
            responseData?: MemberImportResponse;
        };

        error.responseData = data;

        throw error;
    }

    return data;
}

export interface MemberImportResult {
    created: number;
}

export interface MemberImportResponse {
    success: boolean;
    message?: string;
    data?: MemberImportResult;
}
export async function createSetupAdmin(data: {
    name: string;
    email: string;
}) {
    const token = localStorage.getItem("platform_token");

    if (!token) {
        throw new Error(
            "Your platform session has expired. Please sign in again."
        );
    }

    const response = await fetch(
        `${API_BASE_URL}/platform/onboarding/setup-admin`,
        {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                name: data.name.trim(),
                email: data.email.trim().toLowerCase(),
            }),
        }
    );

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error(
                "Your platform session has expired. Please sign in again."
            );
        }

        if (response.status === 422) {
            const validationMessage =
                result?.message ||
                Object.values(result?.errors || {})
                    .flat()
                    .join(" ");

            throw new Error(
                validationMessage ||
                "Please correct the highlighted fields."
            );
        }

        throw new Error(
            result?.message ||
            "Unable to create setup administrator."
        );
    }

    return result;
}