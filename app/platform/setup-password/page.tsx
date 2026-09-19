"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import {
    Alert,
    AlertDescription,
} from "@/components/ui/alert";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://localhost:8000/api";

export default function SetupPasswordPage() {
    const router = useRouter();

    const [currentPassword, setCurrentPassword] =
        useState("");

    const [newPassword, setNewPassword] =
        useState("");

    const [confirmPassword, setConfirmPassword] =
        useState("");

    const [loading, setLoading] = useState(false);

    const [errorMessage, setErrorMessage] =
        useState<string | null>(null);

    const [infoMessage, setInfoMessage] =
        useState<string | null>(null);

    const [churchName, setChurchName] =
        useState("");

    useEffect(() => {
        if (typeof window === "undefined") return;

        const token =
            localStorage.getItem("platform_token");

        const userJson =
            localStorage.getItem("platform_user");

        const churchJson =
            localStorage.getItem("platform_church");

        /*
         * The page can only be used after platform login.
         */
        if (!token || !userJson) {
            router.replace("/platform/login");
            return;
        }

        try {
            const user = JSON.parse(userJson);

            /*
             * If the administrator has already completed
             * the password setup, don't allow them to
             * remain on this page.
             */
            if (!user.must_change_password) {
                router.replace("/platform/dashboard");
                return;
            }

            if (churchJson) {
                const church = JSON.parse(churchJson);
                setChurchName(church.church_name || "");
            }
        } catch (error) {
            console.error(
                "Unable to read platform session:",
                error
            );

            localStorage.removeItem("platform_token");
            localStorage.removeItem("platform_user");
            localStorage.removeItem("platform_church");

            router.replace("/platform/login");
        }
    }, [router]);

    const handleSubmit = async (
        e: FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();

        setErrorMessage(null);
        setInfoMessage(null);

        if (!currentPassword) {
            setErrorMessage(
                "Please enter your current password."
            );
            return;
        }

        if (!newPassword) {
            setErrorMessage(
                "Please enter your new password."
            );
            return;
        }

        if (newPassword.length < 8) {
            setErrorMessage(
                "Your new password must contain at least 8 characters."
            );
            return;
        }

        if (newPassword !== confirmPassword) {
            setErrorMessage(
                "The new password confirmation does not match."
            );
            return;
        }

        if (newPassword === currentPassword) {
            setErrorMessage(
                "Your new password must be different from your current password."
            );
            return;
        }

        const token =
            localStorage.getItem("platform_token");

        if (!token) {
            router.replace("/platform/login");
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(
                `${API_BASE_URL}/platform/auth/change-password`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },

                    body: JSON.stringify({
                        current_password: currentPassword,
                        new_password: newPassword,
                        new_password_confirmation:
                            confirmPassword,
                    }),
                }
            );

            const data = await response
                .json()
                .catch(() => null);

            if (!response.ok || !data?.success) {
                setErrorMessage(
                    data?.message ||
                    "Unable to change your password. Please try again."
                );
                return;
            }

            const newToken = data.data?.token;
            const user = data.data?.user;
            const church = data.data?.church;

            if (!newToken || !user || !church) {
                setErrorMessage(
                    "Password was changed, but the server returned an incomplete session."
                );
                return;
            }

            /*
             * Replace the temporary platform token
             * with the new authenticated token.
             */
            localStorage.setItem(
                "platform_token",
                newToken
            );

            localStorage.setItem(
                "platform_user",
                JSON.stringify(user)
            );

            localStorage.setItem(
                "platform_church",
                JSON.stringify(church)
            );

            setInfoMessage(
                "Your password has been changed successfully."
            );

            /*
             * Give the administrator a moment to see
             * the success message before entering the dashboard.
             */
            setTimeout(() => {
                router.replace("/platform/dashboard");
            }, 700);
        } catch (error) {
            console.error(
                "Change password error:",
                error
            );

            setErrorMessage(
                "Network error. Please check your connection and try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-8">
            <Card className="w-full max-w-md border-slate-200 shadow-xl">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <Image
                            src="/logo.png"
                            alt="Church Community"
                            width={72}
                            height={72}
                            priority
                        />
                    </div>

                    <CardTitle className="text-2xl font-semibold text-slate-900">
                        Set Your Password
                    </CardTitle>

                    <CardDescription className="text-slate-600">
                        {churchName
                            ? `Set a permanent password for ${churchName}.`
                            : "Set a permanent password for your account."}
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <Alert className="mb-5 border-amber-200 bg-amber-50 text-amber-900">
                        <AlertDescription>
                            You are using a temporary password.
                            Please create a new password before
                            continuing to the administration portal.
                        </AlertDescription>
                    </Alert>

                    {errorMessage && (
                        <Alert className="mb-5 border-red-200 bg-red-50 text-red-800">
                            <AlertDescription>
                                {errorMessage}
                            </AlertDescription>
                        </Alert>
                    )}

                    {infoMessage && (
                        <Alert className="mb-5 border-emerald-200 bg-emerald-50 text-emerald-800">
                            <AlertDescription>
                                {infoMessage}
                            </AlertDescription>
                        </Alert>
                    )}

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-5"
                    >
                        <div className="space-y-2">
                            <Label htmlFor="current-password">
                                Temporary password
                            </Label>

                            <Input
                                id="current-password"
                                type="password"
                                value={currentPassword}
                                onChange={(e) =>
                                    setCurrentPassword(
                                        e.target.value
                                    )
                                }
                                autoComplete="current-password"
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="new-password">
                                New password
                            </Label>

                            <Input
                                id="new-password"
                                type="password"
                                value={newPassword}
                                onChange={(e) =>
                                    setNewPassword(e.target.value)
                                }
                                autoComplete="new-password"
                                disabled={loading}
                            />

                            <p className="text-xs text-slate-500">
                                Minimum 8 characters.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">
                                Confirm new password
                            </Label>

                            <Input
                                id="confirm-password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) =>
                                    setConfirmPassword(
                                        e.target.value
                                    )
                                }
                                autoComplete="new-password"
                                disabled={loading}
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading
                                ? "Changing Password..."
                                : "Set Password & Continue"}
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="justify-center">
                    <p className="text-xs text-slate-500 text-center">
                        Church Community · Setup Administration
                    </p>
                </CardFooter>
            </Card>
        </main>
    );
}