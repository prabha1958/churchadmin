"use client";

import { useEffect, useState, FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { format } from 'date-fns';


import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "../context/auth-provider";

interface Collection {
    admin_id: number;
    admin_name: string;
    date: string;
    mode_totals: {
        cash: number,
        upi: number,
        other: number
    },
    payments: {
        payment_id: number;
        member_id: number;
        member_name: string;
        payment_date: string;
        amount: number;
        payment_mode: string;
        reference_no: string;
    }[];
    total_amount: number;
    total_transactions: number;

}

export default function CashCollectionReport() {
    const { token, isAdmin } = useAuth();
    const router = useRouter();

    const [collections, setCollections] = useState<Collection | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(
        new Date().toISOString().split("T")[0]
    );
    const [report, setReport] = useState<any>(null);
    const [loadingReport, setLoadingReport] = useState(false);

    const [viewModal, setViewModal] = useState(false);
    const [editModal, setEditModal] = useState(false);
    const [addModal, setAddModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [addForm, setAddForm] = useState<any>({});
    const [addProfilePreview, setAddProfilePreview] = useState<string | null>(
        null
    );


    const [editProfilePreview, setEditProfilePreview] = useState<string | null>(
        null
    );

    const [editForm, setEditForm] = useState<any>({});



    const toDateInput = (value?: string | Date | null): string => {
        if (!value) return "";

        if (value instanceof Date) {
            // Convert Date → YYYY-MM-DD
            return value.toISOString().split("T")[0];
        }

        // String (ISO or YYYY-MM-DD)
        return value.split("T")[0];
    };

    const fetchDailyReport = async () => {
        setAddModal(true)
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/subscriptions/daily-report?date=${selectedDate}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            }
        );

        const data = await res.json();
        setCollections(data);
    };

    console.log(collections)



    return (
        <div className="p-6 bg-base-100">
            <div>
                <div className="flex items-end gap-4 mb-6">
                    <div className="flex flex-col">
                        <label className="text-sm text-gray-400">Select Date</label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="px-3 py-2 rounded bg-slate-800 text-white border border-slate-600"
                        />
                    </div>

                    <button
                        onClick={fetchDailyReport}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        {loadingReport ? "Generating..." : "Generate Report"}
                    </button>
                </div>


            </div>


            {/* ------------------ REPORT MODAL ------------------ */}
            <Dialog open={addModal} onOpenChange={setAddModal} >
                <DialogContent
                    className="w-[95vw] max-w-6xl bg-slate-900 text-white border-slate-700 p-0"
                >
                    <div className="p-6">
                        <DialogHeader className="w-full">
                            <DialogTitle>Collection details</DialogTitle>
                        </DialogHeader>
                        {collections && (
                            <div id="print-section" className="w-7xl bg-white text-black p-6 rounded mt-6 overflow-auto">
                                <h2 className="text-xl font-bold text-center mb-2">
                                    Daily Payment Report
                                </h2>
                                <p>Date: {selectedDate}</p>

                                <table className="w-5xl border mt-4 text-sm scroll-auto">
                                    <thead>
                                        <tr className="border bg-gray-200">
                                            <th className="border p-2">Member Id</th>
                                            <th className="border p-2">Member name</th>
                                            <th className="border p-2">PaymentDate</th>
                                            <th className="border p-2">Amount</th>
                                            <th className="border p-2">Payment Mode</th>
                                            <th className="border p-2">Payment Reference</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {collections?.payments?.map((payment: any) => (
                                            <tr key={payment.payment_id}>
                                                <td className="border p-2">{payment.member_id}</td>
                                                <td className="border p-2">{payment.member_name}</td>
                                                <td className="border p-2">{payment.payment_date}</td>
                                                <td className="border p-2">{payment.amount}</td>
                                                <td className="border p-2">{payment.payment_mode}</td>
                                                <td className="border p-2">{payment.reference_no}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                <div className="mt-4 font-bold space-y-1">
                                    <div>Total Transactions: {collections.total_transactions}</div>
                                    <div>Cash: {collections.mode_totals?.cash ?? 0}</div>
                                    <div>UPI: {collections.mode_totals?.upi ?? 0}</div>
                                    <div>Other: {collections.mode_totals?.other ?? 0}</div>
                                    <div className="text-lg">
                                        Grand Total: {collections.total_amount}
                                    </div>
                                </div>

                                <button
                                    onClick={() => window.print()}
                                    className="mt-4 px-4 py-2 bg-amber-600 text-white rounded"
                                >
                                    Print
                                </button>
                            </div>
                        )}

                    </div>
                </DialogContent>

            </Dialog>

        </div>
    )
}

