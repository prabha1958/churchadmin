

"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

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
import { Alert, AlertDescription } from "@/components/ui/alert";

const API_BASE_URL = "http://localhost:8000/api"; // adjust if no /api prefix

type LoginStep = "contact" | "otp";

interface Member {
    id: number;
    first_name: string | null;
    last_name: string | null;
    role: string | null; // "admin" / "member"
    [key: string]: any;
}

interface VerifyResponse {
    success: boolean;
    message: string;
    access_token?: string;
    token_type?: string;
    member?: Member;
    [key: string]: any;
}

export default function Login() {
    const router = useRouter();

    const [contact, setContact] = useState("");
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState<LoginStep>("contact");
    const [loading, setLoading] = useState(false);
    const [infoMessage, setInfoMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const resetMessages = () => {
        setInfoMessage(null);
        setErrorMessage(null);
    };

    const getBackendUrl = () => {
        // In v0 environment, use a configurable backend URL
        // In local development, this can be localhost:8000
        return process.env.NEXT_PUBLIC_BACKEND_URL || ""
    }

    // 1) SEND OTP
    const handleSendOtp = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        resetMessages();

        if (!contact.trim()) {
            setErrorMessage("Please enter your registered email or mobile number.");
            return;
        }

        try {
            setLoading(true);



            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/otp/send`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({ contact }),
            });

            const data = (await res.json().catch(() => null)) as
                | { success?: boolean; message?: string }
                | null;

            if (!res.ok || !data?.success) {
                setErrorMessage(
                    data?.message || "Failed to send OTP. Please check your details."
                );
                return;
            }

            setInfoMessage(
                data.message || "OTP sent. Please check your email or mobile."
            );
            setStep("otp");
        } catch (err) {
            console.error(err);
            setErrorMessage("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // 2) VERIFY OTP + ADMIN-ONLY CHECK
    const handleVerifyOtp = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        resetMessages();

        if (!otp.trim()) {
            setErrorMessage("Please enter the OTP you received.");
            return;
        }

        try {
            setLoading(true);

            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/otp/verify`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    contact,
                    code: otp,
                    device_name: "cwcr-admin",
                }),
            });



            const data = (await res.json().catch(() => null)) as VerifyResponse | null;

            if (!res.ok || !data?.success || !data.access_token || !data.member) {
                setErrorMessage(
                    data?.message || "OTP verification failed. Please try again."
                );
                return;
            }

            const member = data.member;
            const role = (member.role || "").toLowerCase();

            // ✅ FRONTEND ROLE CHECK
            if (role !== "admin" && role !== "super_admin") {
                setErrorMessage(
                    "You are not authorised to access the admin panel. Please contact the church office."
                );
                // Do not store token/member, do not redirect
                return;
            }

            // Save token & member for authorised admins
            if (typeof window !== "undefined") {
                localStorage.setItem("cwcr_token", data.access_token);
                localStorage.setItem("cwcr_member", JSON.stringify(member));
            }

            setInfoMessage("Login successful. Redirecting to dashboard...");
            router.push("/dashboard");
        } catch (err) {
            console.error(err);
            setErrorMessage("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (

        <Card className="w-full  border-slate-700 bg-blue-800 text-slate-50 shadow-2xl">
            <CardHeader>
                <CardTitle className="text-xl font-semibold">
                    CSI WCR Admin Login
                </CardTitle>
                <CardDescription className="text-slate-300">
                    Admins only. Use your registered email or whatsapp mobile to receive an OTP.
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                {errorMessage && (
                    <Alert className="border-red-500/60 bg-red-950/40 text-red-200">
                        <AlertDescription>{errorMessage}</AlertDescription>
                    </Alert>
                )}

                {infoMessage && (
                    <Alert className="border-emerald-500/60 bg-emerald-950/40 text-emerald-100">
                        <AlertDescription>{infoMessage}</AlertDescription>
                    </Alert>
                )}

                {step === "contact" && (
                    <form onSubmit={handleSendOtp} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="contact">Email or Mobile</Label>
                            <Input
                                id="contact"
                                type="text"
                                value={contact}
                                onChange={(e) => setContact(e.target.value)}
                                placeholder="enter your email or mobile number"
                                className="bg-slate-900/40 border-slate-700 focus-visible:ring-blue-500"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading ? "Sending OTP..." : "Send OTP"}
                        </Button>
                    </form>
                )}

                {step === "otp" && (
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                        <div className="space-y-1 text-sm text-slate-300">
                            <p>OTP sent to:</p>
                            <p className="font-medium text-slate-100">{contact}</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="otp">Enter OTP</Label>
                            <Input
                                id="otp"
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="6-digit code"
                                className="text-center tracking-[0.3em] bg-slate-900/40 border-slate-700 focus-visible:ring-blue-500"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading ? "Verifying..." : "Verify & Login"}
                        </Button>

                        <Button
                            type="button"
                            variant="ghost"
                            className="w-full text-xs text-slate-300 hover:text-slate-50"
                            disabled={loading}
                            onClick={() => {
                                setStep("contact");
                                setOtp("");
                                resetMessages();
                            }}
                        >
                            Change email / mobile
                        </Button>
                    </form>
                )}
            </CardContent>

            <CardFooter className="justify-center text-xs text-slate-500">
                CSI Centenary Wesley Church · Admin Panel
            </CardFooter>
        </Card>

    );
}
