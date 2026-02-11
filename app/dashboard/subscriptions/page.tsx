"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "../../context/auth-provider";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Label } from "@radix-ui/react-label";
import { pid } from "process";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"





export default function SubscriptionsPage() {
    const [rows, setRows] = useState<any[]>([]);
    const [search, setSearch] = useState("");

    const { token, isAdmin } = useAuth();
    const [payModalOpen, setPayModalOpen] = useState(false);
    const [payMember, setPayMember] = useState<any>(null);
    const [unpaidMonths, setUnpaidMonths] = useState<string[]>([]);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const [monthlyFee, setMonthlyFee] = useState<number>(0);
    const [isPaying, setIsPaying] = useState(false);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [viewData, setViewData] = useState<any>(null);
    const allMonths = ['apr', 'may', 'jun', 'jul', 'aug', 'sep',
        'oct', 'nov', 'dec', 'jan', 'feb', 'mar']
    const [mode, setMode] = useState<'online' | 'cash' | 'upi'>('online');
    const [referenceNo, setReferenceNo] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [paymentMode, setPaymentMode] = useState<"cash" | "upi">("cash");

    const FY_MONTHS = [
        "apr", "may", "jun", "jul", "aug", "sep",
        "oct", "nov", "dec", "jan", "feb", "mar"
    ];

    const getCurrentFYIndex = () => {
        const now = new Date();
        const m = now.getMonth(); // 0–11
        return m >= 3 ? m - 3 : m + 9; // April = 0
    };


    type MonthRow = {
        month: string;
        paid: boolean;
        paid_at?: string;
        due: boolean;

    };

    const [months, setMonths] = useState<MonthRow[]>([]);
    const [selectedMonths, setSelectedMonths] = useState<string[]>([]);

    const openPayModal = async (row: any) => {
        setPayMember(row);
        setPayModalOpen(true);

        // 🔑 reset
        setSelectedMonths([]);
        setMonths([]);
        setMonthlyFee(0);

        const res = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/subscriptions/${row.member_id}/due`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            }
        );

        const data = await res.json();
        console.log("DUE RESPONSE", data);

        if (!res.ok) {
            alert(data.message || "Failed to load subscription");
            return;
        }

        const subscription = data.subscription;
        if (!subscription) {
            alert("Subscription not found");
            return;
        }

        const currentFYIndex = getCurrentFYIndex();

        // ✅ Build months (PAID / DUE / FUTURE)
        const monthRows = FY_MONTHS.map((month, index) => {
            const paymentId = subscription[`${month}_payment_id`];

            return {
                month,
                paid: Boolean(paymentId),
                due: !paymentId && index <= currentFYIndex, // 🔥 key fix
            };
        });

        setMonths(monthRows);

        // ✅ Auto-select ONLY DUE months (not future)
        setSelectedMonths(
            monthRows.filter(m => m.due).map(m => m.month)
        );

        setMonthlyFee(Number(subscription.monthly_fee ?? 0));
    };







    const loadSubscriptions = async () => {
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/subscriptions?search=${search}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            }
        );

        const data = await res.json();
        if (res.ok) {
            setRows(data.data);

        }
    };

    useEffect(() => {
        loadSubscriptions();
    }, []);



    const handlePayNow = async (response: any) => {
        if (!payMember) return;


        setIsPaying(true);

        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/subscriptions/${payMember.member_id}/pay`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify({
                        months: selectedMonths,
                    }),
                }
            );

            const data = await res.json();




            if (!res.ok) {
                alert(data.message || "Payment failed");
                setIsPaying(false);
                return;
            }

            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
                amount: data.amount * 100,
                currency: "INR",
                name: "CSI Centenary Wesley Church",
                description: "Subscription Payment",
                order_id: data.order.id,

                handler: async function (response: any) {


                    // 🔥 CALL VERIFY PAYMENT API
                    const verifyRes = await fetch(
                        `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/subscriptions/verify-payment`,
                        {
                            method: "POST",
                            headers: {
                                Authorization: `Bearer ${token}`,
                                "Content-Type": "application/json",
                                Accept: "application/json",
                            },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                            }),
                        }
                    );

                    const verifyData = await verifyRes.json();
                    console.log("Verify response", verifyData);

                    if (!verifyRes.ok) {
                        alert(verifyData.message || "Payment verification failed");
                        return;
                    }

                    alert("Payment successful");
                    setPayModalOpen(false);
                    setConfirmOpen(false)
                    loadSubscriptions();
                },

                theme: { color: "#1e293b" },
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();
        } catch {
            alert("Network error");
        } finally {
            setIsPaying(false);
            setConfirmOpen(false)
            setPayModalOpen(false);
        }
    };


    const handleViewSubscription = async (memberId: number) => {
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/subscriptions/${memberId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            }
        );

        const data = await res.json();

        if (!res.ok) {
            alert("Failed to load subscription");
            return;
        }

        setViewData(data);
        setViewModalOpen(true);

    };


    const handleOfflinePay = async () => {
        if (!payMember) return;
        setIsCreating(true)
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/subscriptions/${payMember.member_id}/pay-offline`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                    Accept: "application/json", // 🔑 REQUIRED
                },
                body: JSON.stringify({
                    months: selectedMonths,
                    payment_mode: 'cash',
                    reference_no: referenceNo,
                }),
            }
        );

        const data = await res.json();
        console.log(data)
        if (!res.ok) {

            setIsCreating(false)
            alert(data.message);
            return;
        }

        setSuccessMsg("Payment recorded successfully");
        setIsCreating(false)
        setPayModalOpen(false);
        loadSubscriptions();
    };




    return (
        <div className="p-6 space-y-4">
            <h1 className="text-xl font-semibold">Subscriptions</h1>

            <div className="flex gap-2 max-w-md">
                <Input
                    placeholder="Search by Member ID or Name"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <Button onClick={loadSubscriptions}>Search</Button>
            </div>
            <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                    <thead className="bg-blue-900 text-blue-50">
                        <tr>
                            <th>Member ID</th>
                            <th>Name</th>
                            <th>Membership Fee</th>
                            <th>Paid Amount</th>
                            <th>Due Amount</th>
                            <th>Actions</th>


                        </tr>
                    </thead>

                    <tbody>
                        {rows.map((r) => (
                            <tr key={r.member_id} className="odd:bg-blue-200 even:bg-blue-50 font-bold">
                                <td>{r.member_id}</td>
                                <td>{r.name}</td>
                                <td>₹{r.membership_fee}</td>
                                <td className="text-green-500">₹{r.paid_amount}</td>
                                <td className="text-red-500">₹{r.due_amount}</td>

                                <td className="flex gap-2">
                                    <Button onClick={() => handleViewSubscription(r.member_id)} size="sm" variant="outline"
                                        className="mt-1 bg-blue-500 text-blue-50"
                                    >
                                        View
                                    </Button>
                                    {(r.due_amount > 0) &&
                                        <Button
                                            size="sm"
                                            className="bg-amber-600 text-amber-50 mt-1"
                                            onClick={() => openPayModal(r)}
                                        >
                                            Pay
                                        </Button>

                                    }

                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Dialog open={payModalOpen} onOpenChange={setPayModalOpen}>
                {/* BLUR + LOADING OVERLAY */}
                {isCreating && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="text-center">
                            <div className="animate-spin h-8 w-8 rounded-full border-2 border-white border-t-transparent mx-auto mb-3" />
                            <p className="text-sm">Payment being made…</p>
                        </div>
                    </div>
                )}

                {/* SUCCESS MESSAGE */}
                {successMsg && (
                    <div className="bg-green-600/20 border border-green-500 text-green-300 px-4 py-2 text-sm">
                        {successMsg}
                    </div>
                )}
                <DialogContent className="max-w-lg z-50 bg-gray-900 text-gray-50">
                    <DialogHeader>
                        <DialogTitle>
                            Pay Subscription – {payMember?.name}
                        </DialogTitle>
                    </DialogHeader>

                    {/* MONTHS LIST */}
                    <div className="flex items-center gap-2">
                        {/* BLUR + LOADING OVERLAY */}
                        {isCreating && (
                            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                                <div className="text-center">
                                    <div className="animate-spin h-8 w-8 rounded-full border-2 border-white border-t-transparent mx-auto mb-3" />
                                    <p className="text-sm">updating payment....</p>
                                </div>
                            </div>
                        )}
                        <div className="space-y-2 w-[30%]  ">
                            {months.map((m) => (
                                <label
                                    key={m.month}
                                    className={`flex items-center gap-2 p-2 rounded
            ${m.paid ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
                                >
                                    <input
                                        type="checkbox"
                                        disabled={m.paid}
                                        checked={
                                            m.paid ||
                                            (m.due && selectedMonths.includes(m.month))
                                        }
                                        onChange={(e) => {
                                            setSelectedMonths(prev => {
                                                const safe = Array.isArray(prev) ? prev : [];

                                                if (e.target.checked) {
                                                    return [...new Set([...safe, m.month])];
                                                }
                                                return safe.filter(x => x !== m.month);
                                            });
                                        }}
                                    />

                                    <span className="capitalize">
                                        {m.month}
                                        {m.paid && (
                                            <span className="ml-2 text-green-400 text-xs">
                                                (Paid)
                                            </span>
                                        )}
                                    </span>
                                </label>
                            ))}
                        </div>
                        <div className="w-[70%]">
                            <Input
                                placeholder={
                                    mode === "cash"
                                        ? "Cash Receipt Number"
                                        : "UPI Transaction ID"
                                }
                                value={referenceNo}
                                onChange={(e) => setReferenceNo(e.target.value)}
                            />

                            <Label>Payment Mode</Label>
                            <select
                                className="select select-bordered w-full"
                                value={paymentMode}
                                onChange={(e) => setPaymentMode(e.target.value as "cash" | "upi")}
                            >
                                <option value="cash">Cash</option>
                                <option value="upi">UPI</option>
                            </select>


                            <Button variant="destructive" onClick={() => setConfirmOpen(true)} className="p-2 mt-2 rounded-2xl bg-amber-500 text-amber-50">
                                Confirm  Payment received
                            </Button>
                        </div>

                    </div>


                    {/* TOTAL */}
                    <div className="mt-4 text-right font-semibold">

                        Total: ₹{(selectedMonths?.length ?? 0) * (monthlyFee ?? 0)}
                    </div>

                    {/* ACTION */}
                  //  <Button
                    //    className="w-full mt-4 bg-green-600 text-gray-50 p-2 rounded-2xl"
                    //    disabled={isPaying || selectedMonths?.length === 0}
                    //    onClick={handlePayNow}

                    >
                    //    {isPaying ? "Creating payment..." : "Pay ONLINE"}
                  //  </Button>
                </DialogContent>
            </Dialog>
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent className="bg-[#5c2a02] text-[#fce2cc]">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Have you really received the due amount { } </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                            <div><b>Member:</b> {payMember?.name}</div>
                            <div><b>Months:</b> {selectedMonths?.join(", ")}</div>
                            <div><b>Mode:</b> {paymentMode.toUpperCase()}</div>
                            <div><b>Reference:</b> {referenceNo}</div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600"
                            onClick={() => {
                                setConfirmOpen(false);
                                handleOfflinePay(); // 🔑 call backend here
                            }}
                        >
                            Confirm Payment
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
                <DialogContent className="max-w-3xl bg-gray-900 text-gray-50">
                    <DialogHeader>
                        <DialogTitle>Subscription Details</DialogTitle>
                    </DialogHeader>

                    {viewData && (
                        <div className="space-y-4">
                            {/* Member Info */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <strong>Name:</strong> {viewData.member.name}
                                </div>
                                <div>
                                    <strong>Monthly Fee:</strong> ₹{viewData.member.membership_fee}
                                </div>
                            </div>

                            {/* Month-wise table */}
                            <div className="overflow-x-auto border rounded">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-100 text-slate-950">
                                        <tr>
                                            <th className="p-2 text-left">Month</th>
                                            <th className="p-2">Payment ID</th>
                                            <th className="p-2">Paid At</th>
                                            <th className="p-2">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {viewData.months.map((m: string) => {
                                            const pid = viewData.subscription?.[`${m}_payment_id`];
                                            const paidAt = viewData.subscription?.[`${m}_paid_at`];

                                            return (
                                                <tr key={m} className="border-t">
                                                    <td className="p-2 capitalize">{m}</td>
                                                    <td className="p-2">
                                                        {pid ? pid : "—"}
                                                    </td>
                                                    <td className="p-2">
                                                        {paidAt
                                                            ? new Date(paidAt).toLocaleDateString()
                                                            : "—"}
                                                    </td>
                                                    <td className="p-2 text-center">
                                                        {pid ? (
                                                            <Badge className="bg-green-600">Paid</Badge>
                                                        ) : (
                                                            <Badge variant="secondary">Unpaid</Badge>
                                                        )}
                                                    </td>
                                                    <td colSpan={4}>
                                                        <Button
                                                            onClick={() =>
                                                                window.open(
                                                                    `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/payments/${pid ? pid : '-'}/receipt`,
                                                                    "_blank"
                                                                )
                                                            }
                                                        >
                                                            Download Receipt
                                                        </Button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        <tr>

                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

        </div>
    )
}