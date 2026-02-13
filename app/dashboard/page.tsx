"use client"


// app/admin/dashboard/page.tsx
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import StatCard from "../components/StatCard";
import GreetingsCard from "../components/GreetingsCard";
import PoorFeedingCard from "../components/PoorFeedingCard";
import QuickActions from "../components/QuickActions";
import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "../context/auth-provider";
import { Alert } from "@/components/ui/alert";


interface Dashboard {
    members: {
        total: number;
        by_area: [
            area_no: number,
            total: number
        ]
    }
    subscriptions: {
        total: number;
        amount: number;
    }
    alliances: {
        published: number;
    }

    birthday_last_run: string,
    anniversary_last_run: string

    poor_feeding: {
        date_of_event: string;
        no_of_persons_fed: number;
        sponsor: {
            family_name: string;
            first_name: string;
            last_name: string;
        }
    }

}

export default function AdminDashboard() {

    const [dashboard, setDashboard] = useState<Dashboard | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { token, isAdmin } = useAuth();
    const [logs, setLogs] = useState<any[]>([]);
    const [runningType, setRunningType] = useState<"birthday" | "anniversary" | null>(null);


    useEffect(() => {
        if (!token) return;   // 🔑 stop early
        loadDashboard();
    }, [token]);



    const loadDashboard = async () => {
        setIsLoading(true)

        try {

            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/dashboard`, {
                method: "GET",
                headers: {

                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });



            const data = await res.json();
            console.log(data)

            setDashboard(data);
            console.log(dashboard)

        } catch {
            alert("Unable to load dashboard");
            setIsLoading(false)
        } finally {
            setIsLoading(false);
        }
    }

    const sendBdayGreetings = async () => {
        setLogs([]);
        setRunningType("birthday");

        try {
            await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/greetings/birthday/run`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                }
            );
        } catch {
            alert("Unable to send birthday greetings");
            setRunningType(null);
        }
    };

    useEffect(() => {
        if (!runningType) return;

        const interval = setInterval(async () => {
            try {
                const url =
                    runningType === "birthday"
                        ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/greetings/birthday/logs`
                        : `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/greetings/anniversary/logs`;

                const res = await fetch(url, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                });

                if (res.ok) {
                    const data = await res.json();
                    setLogs(data);

                    if (data.some((l: any) => l.message.includes("completed"))) {
                        setRunningType(null);
                    }
                }
            } catch (e) {
                console.error("Log polling failed", e);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [runningType, token]);




    const fetchLogs = async () => {
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/greetings/birthday/logs`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                }
            );

            if (res.ok) {
                setLogs(await res.json());
            }
        } catch (e) {
            console.error("Failed to fetch logs", e);
        }
    };



    const sendAnnGreetings = async () => {
        setLogs([]);
        setRunningType("anniversary");

        try {
            await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/greetings/anniversary/run`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                }
            );
        } catch {
            alert("Unable to send anniversary greetings");
            setRunningType(null);
        }
    };




    const fetchannLogs = async () => {
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/greetings/anniversary/logs`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                }
            );

            if (res.ok) {
                setLogs(await res.json());
            }
        } catch (e) {
            console.error("Failed to fetch logs", e);
        }
    };






    return (
        <div className="space-y-6 p-6">
            {isLoading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="text-center">
                        <div className="animate-spin h-8 w-8 rounded-full border-2 border-white border-t-transparent mx-auto mb-3" />
                        <Spinner />
                    </div>
                </div>
            )}
            {/* PAGE TITLE */}
            <div>
                <h1 className="text-2xl font-bold text-slate-100">Admin Dashboard</h1>
                <p className="text-slate-400 text-sm">
                    Overview of members, subscriptions, greetings & welfare
                </p>
            </div>

            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Members" number={''} value={dashboard?.members.total?.toString() ?? "—"} subtitle="Active members" style="bg-blue-800 border-amber-100" />
                <StatCard title="Subscriptions" value={dashboard?.subscriptions.total?.toString() ?? "-"} number={dashboard?.subscriptions.amount?.toString() ?? "-"} subtitle="Collected this FY" style="bg-[#b35c05] border-[#07ed9d]" />
                <StatCard title="Alliances" number={""} value={dashboard?.alliances.published?.toString() ?? "-"} subtitle="Published profiles" style="bg-[#5b07ed] border-[#ed2607]" />
                <StatCard title="Areas" number={""} value="14" subtitle="Church areas" style="bg-[#048206] border-[#ed4f0c]" />
            </div>

            <div className="bg-black font-mono text-sm p-3 rounded h-64 overflow-auto">
                {logs.map((l, i) => (
                    <div
                        key={i}
                        className={
                            l.level === "error"
                                ? "text-red-400"
                                : l.level === "success"
                                    ? "text-green-400"
                                    : "text-yellow-400"
                        }
                    >
                        • {l.message}
                    </div>
                ))}
            </div>

            {/* GREETINGS SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <GreetingsCard
                    title="Birthday Greetings"
                    lastRun={dashboard?.birthday_last_run?.toString() ?? "-"}
                    command="send:birthday-wishes"
                    style="bg-[#056603] border-[#ede609]"
                    onRun={sendBdayGreetings}
                    isLoading={isLoading}

                />


                <GreetingsCard
                    title="Anniversary Greetings"
                    lastRun={dashboard?.anniversary_last_run?.toString() ?? "-"}
                    command="greetings:anniversary"
                    style="bg-[#270994] border-[#0af2d3]"
                    onRun={sendAnnGreetings}
                    isLoading={isLoading}
                />
            </div>

            {/* WELFARE & ACTIONS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PoorFeedingCard pfeeding={dashboard?.poor_feeding} />
                <QuickActions />
            </div>
        </div>
    );
}
