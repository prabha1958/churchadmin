"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "../context/auth-provider";

const API_BASE_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api").replace(/\/$/, "");
type LoginStep = "contact" | "otp";
type Member = { id: number; first_name: string | null; last_name: string | null; role: string | null;[key: string]: any };
type VerifyResponse = { success: boolean; message: string; access_token?: string; token?: string; member?: Member;[key: string]: any };

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const [churchCode, setChurchCodeInput] = useState("");
  const [contact, setContact] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<LoginStep>("contact");
  const [loading, setLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const resetMessages = () => { setInfoMessage(null); setErrorMessage(null); };

  const handleSendOtp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); resetMessages();
    const code = churchCode.trim().toUpperCase();
    if (!code) return setErrorMessage("Enter your church code.");
    if (!contact.trim()) return setErrorMessage("Enter your registered email or mobile number.");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", "X-Church-Code": code },
        body: JSON.stringify({ contact: contact.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) { setErrorMessage(data?.message || "Could not send OTP. Check the church code and your registered details."); return; }
      localStorage.setItem("cwcr_church_code", code);
      setInfoMessage(data.message || "OTP sent. Check your email or mobile.");
      setStep("otp");
    } catch (error) {
      console.error("Send OTP error:", error);
      setErrorMessage("Network error. Please check your connection and try again.");
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); resetMessages();
    if (!otp.trim()) return setErrorMessage("Enter the OTP you received.");
    const code = churchCode.trim().toUpperCase();
    if (!code) return setErrorMessage("Church code is required. Return to the first step.");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", "X-Church-Code": code },
        body: JSON.stringify({ contact: contact.trim(), code: otp.trim(), device_name: "cwcr-admin" }),
      });
      const data = await res.json().catch(() => null) as VerifyResponse | null;
      const token = data?.access_token || data?.token;
      if (!res.ok || !data?.success || !token || !data.member) { setErrorMessage(data?.message || "OTP verification failed. Please try again."); return; }
      const role = (data.member.role || "").toLowerCase();
      if (role !== "admin" && role !== "super_admin") { setErrorMessage("You are not authorised to access this church's admin panel. Please contact the church office."); return; }
      login(token, data.member, code);
      setInfoMessage("Login successful. Opening dashboard...");
      router.replace("/dashboard");
    } catch (error) {
      console.error("Verify OTP error:", error);
      setErrorMessage("Network error. Please check your connection and try again.");
    } finally { setLoading(false); }
  };

  return (
    <main className="flex min-h-[100svh] w-full items-center justify-center bg-gradient-to-br from-slate-950 via-[#191970] to-slate-900 px-4 py-8 sm:px-6">
      <Card className="w-full max-w-md border-slate-700 bg-blue-950/95 text-slate-50 shadow-2xl">
        <CardHeader className="space-y-3 text-center">
          <div className="flex w-full items-center justify-center p-2"><Image src="/logo.png" alt="Church Community logo" width={72} height={72} priority /></div>
          <CardTitle className="text-xl font-semibold sm:text-2xl">Church Admin Login</CardTitle>
          <CardDescription className="text-slate-300">Authorised church administrators only. Enter your church code and receive a one-time password.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorMessage && <Alert className="border-red-500/60 bg-red-950/40 text-red-200"><AlertDescription>{errorMessage}</AlertDescription></Alert>}
          {infoMessage && <Alert className="border-emerald-500/60 bg-emerald-950/40 text-emerald-100"><AlertDescription>{infoMessage}</AlertDescription></Alert>}
          {step === "contact" ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2"><Label htmlFor="churchCode">Church Code</Label><Input id="churchCode" autoCapitalize="characters" autoComplete="organization" required value={churchCode} onChange={e => setChurchCodeInput(e.target.value.toUpperCase())} placeholder="Enter your church code" className="min-h-11 border-slate-700 bg-slate-900/60" /></div>
              <div className="space-y-2"><Label htmlFor="contact">Registered Email or Mobile</Label><Input id="contact" type="text" autoComplete="username" required value={contact} onChange={e => setContact(e.target.value)} placeholder="Email address or mobile number" className="min-h-11 border-slate-700 bg-slate-900/60" /></div>
              <Button type="submit" className="min-h-11 w-full" disabled={loading}>{loading ? "Sending OTP..." : "Send OTP"}</Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="rounded-md bg-slate-900/70 p-3 text-sm text-slate-300"><p>Church code: <strong className="text-white">{churchCode.toUpperCase()}</strong></p><p className="mt-1 break-words">OTP sent for: <strong className="text-white">{contact}</strong></p></div>
              <div className="space-y-2"><Label htmlFor="otp">One-Time Password</Label><Input id="otp" inputMode="numeric" autoComplete="one-time-code" required value={otp} onChange={e => setOtp(e.target.value.replace(/\s/g, ""))} placeholder="Enter OTP" className="min-h-11 border-slate-700 bg-slate-900/60 text-center tracking-[0.25em]" /></div>
              <Button type="submit" className="min-h-11 w-full" disabled={loading}>{loading ? "Verifying..." : "Verify and Login"}</Button>
              <Button type="button" variant="ghost" className="min-h-11 w-full text-slate-300" disabled={loading} onClick={() => { setStep("contact"); setOtp(""); resetMessages(); }}>Change church code or contact</Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="justify-center px-4 text-center text-xs text-slate-400">CSI Centenary Wesley Church · Church Community Admin</CardFooter>
      </Card>
    </main>
  );
}
