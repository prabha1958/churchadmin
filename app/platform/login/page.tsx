"use client";

import { FormEvent, useState } from "react";
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

import { Alert, AlertDescription } from "@/components/ui/alert";

import { platformLogin } from "@/lib/platform-api";

export default function PlatformLoginPage() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(
        null
    );

    const handleLogin = async (
        e: FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();

        setErrorMessage(null);

        if (!email.trim()) {
            setErrorMessage("Please enter your email address.");
            return;
        }

        if (!password) {
            setErrorMessage("Please enter your password.");
            return;
        }

        try {
            setLoading(true);

            const data = await platformLogin(
                email.trim(),
                password
            );

            const token = data.data?.token;
            const user = data.data?.user;
            const church = data.data?.church;

            if (!token || !user || !church) {
                throw new Error(
                    "The server returned an incomplete login response."
                );
            }

            /*
             * Keep platform authentication completely
             * separate from the existing church admin login.
             */
            localStorage.setItem(
                "platform_token",
                token
            );

            localStorage.setItem(
                "platform_user",
                JSON.stringify(user)
            );

            localStorage.setItem(
                "platform_church",
                JSON.stringify(church)
            );

            if (user.must_change_password) {
                router.replace("/platform/setup-password");
            } else {
                router.replace("/platform/dashboard");
            }
        } catch (error) {
            console.error("Platform login error:", error);

            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Unable to sign in. Please try again."
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
                        Setup Administrator
                    </CardTitle>

                    <CardDescription className="text-slate-600">
                        Sign in to set up and manage your church
                        community app.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {errorMessage && (
                        <Alert className="mb-4 border-red-200 bg-red-50 text-red-800">
                            <AlertDescription>
                                {errorMessage}
                            </AlertDescription>
                        </Alert>
                    )}

                    <form
                        onSubmit={handleLogin}
                        className="space-y-5"
                    >
                        <div className="space-y-2">
                            <Label htmlFor="platform-email">
                                Email address
                            </Label>

                            <Input
                                id="platform-email"
                                type="email"
                                value={email}
                                onChange={(e) =>
                                    setEmail(e.target.value)
                                }
                                placeholder="administrator@example.com"
                                autoComplete="email"
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="platform-password">
                                Password
                            </Label>

                            <Input
                                id="platform-password"
                                type="password"
                                value={password}
                                onChange={(e) =>
                                    setPassword(e.target.value)
                                }
                                placeholder="Enter your password"
                                autoComplete="current-password"
                                disabled={loading}
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading ? "Signing in..." : "Sign In"}
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