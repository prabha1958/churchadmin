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