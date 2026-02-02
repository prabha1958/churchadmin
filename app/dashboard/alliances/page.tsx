"use client";

import { useEffect, useState, FormEvent } from "react";
import Image from "next/image";
import { useAuth } from "../../context/auth-provider";
import { useRouter } from "next/navigation";
import { format } from 'date-fns';


import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";



interface Alliance {
    id: number;
    family_name: string;
    first_name: string;
    middle_name?: string;
    last_name?: string;
    date_of_birth: Date;
    alliance_type: string;
    profile_photo?: string | null;
    photo1?: string | null;
    photo2?: string | null;
    photo3?: string | null;
    mother_name?: string | null;
    father_name?: string | null;
    mother_occupation?: string | null;
    father_occupation?: string | null;
    educational_qualifications: string;
    profession: string;
    designation: string;
    company_name: string;
    place_of_working: string;
    about_self?: string | null;
    about_family?: string | null;
    is_published: number;
    age: number;
    member_name: string;
    payment_date: Date;
    payment_id: string;
    amount: number;

}

export default function AlliancePage() {
    const { token, isAdmin } = useAuth();
    const router = useRouter();

    const [alliances, setAlliances] = useState<Alliance[]>([]);
    const [loading, setLoading] = useState(false);
    const [viewModal, setViewModal] = useState(false);
    const [editModal, setEditModal] = useState(false);
    const [addModal, setAddModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [editContact, setEditContact] = useState(false);
    const [search, setSearch] = useState("");
    const [addAllianceOpen, setAddAllianceOpen] = useState(false);
    const [viewLoading, setViewLoading] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [payOpen, setPayOpen] = useState(false);
    const [payAlliance, setPayAlliance] = useState<any>(null);
    const [amount, setAmount] = useState<number>(3000);
    const [isPaying, setIsPaying] = useState(false);







    // For editing
    const [editForm, setEditForm] = useState<any>({});
    const [editProfilePreview, setEditProfilePreview] = useState<string | null>(
        null
    );

    const toDateInput = (value?: Date | null) => {
        if (!value) return "";
        return format(value, 'dd-MM-yyy'); // 1960-09-25
    };


    // For add
    const [addForm, setAddForm] = useState<any>({});
    const [addProfilePreview, setAddProfilePreview] = useState<string | null>(
        null
    );
    const [viewAllianceOpen, setViewAllianceOpen] = useState(false);
    const [viewAlliance, setViewAlliance] = useState<any>(null);
    const [offlineOpen, setOfflineOpen] = useState(false);
    const [offlineForm, setOfflineForm] = useState({
        amount: 3000,
        payment_mode: "cash",
        reference_no: "",
    });


    const [previews, setPreviews] = useState<Record<string, string | null>>({
        profile_photo: null,
        photo1: null,
        photo2: null,
        photo3: null,
    });

    const [editPreviews, setEditPreviews] = useState<Record<string, string | null>>({
        profile_photo: null,
        photo1: null,
        photo2: null,
        photo3: null,
    });

    const normalize = (v?: string) =>
        v ? v.toLowerCase().trim() : "";


    const openAdd = () => {
        setForm({});
        setAddProfilePreview(null);
        setAddAllianceOpen(true);
    };


    const [form, setForm] = useState<any>({
        member_id: "",
        alliance_type: "",
        family_name: "",
        first_name: "",
        last_name: "",
        date_of_birth: "",

        father_name: "",
        mother_name: "",
        father_occupation: "",
        mother_occupation: "",

        educational_qualifications: "",
        profession: "",
        profession_other: "",
        designation: "",
        designation_other: "",
        company_name: "",
        place_of_working: "",

        about_self: "",
        about_family: "",

        profile_photo: null,
        photo1: null,
        photo2: null,
        photo3: null,
    });

    const professionOptions = [
        "business",
        "medical doctor",
        "civil engineer",
        "mechanical engineer",
        "software engineer",
        "lawyer",
        "administrator",
        "chef",
        "architect",
        "freelance",
        "other",
    ];

    const designationOptions = [
        "clerical",
        "supervisor",
        "officer",
        "junior management",
        "senior management",
        "managing director",
        "other",
    ];





    useEffect(() => {
        const t = setTimeout(() => {
            loadAlliances();
        }, 400);

        return () => clearTimeout(t);
    }, [search]);


    const loadAlliances = async () => {
        const query = search ? `?search=${encodeURIComponent(search)}` : "";

        const res = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/alliances${query}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            }
        );

        const data = await res.json();
        console.log(data.amount)
        setAlliances(data.data || []);

    };

    const handleAddAllianceSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsCreating(true);

        const fd = new FormData();

        Object.entries(form).forEach(([k, v]) => {
            if (v) fd.append(k, v as any);
        });

        if (form.profession === "other") {
            fd.set("profession", form.profession_other);
        }
        if (form.designation === "other") {
            fd.set("designation", form.designation_other);
        }

        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/alliances`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                    body: fd,
                }
            );

            const data = await res.json();


            if (!res.ok) {
                alert(data.message || "Failed to create alliance");
                return;
            }

            alert("Alliance created successfully");
            setAddAllianceOpen(false);
            loadAlliances();
        } finally {
            setIsCreating(false);
        }
    };

    const splitOtherValue = (
        value: string | null | undefined,
        options: string[]
    ) => {
        if (!value) return { select: "", other: "" };

        if (options.includes(value)) {
            return { select: value, other: "" };
        }

        return { select: "other", other: value };
    };





    const handleImageChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        field: string
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setForm((prev: any) => ({
            ...prev,
            [field]: file,
        }));

        setPreviews((prev) => ({
            ...prev,
            [field]: URL.createObjectURL(file),
        }));
    };

    const fetchAlliance = async (id: number) => {
        setViewLoading(true);
        setViewAllianceOpen(true);

        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/alliances/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                }
            );

            const data = await res.json();

            if (res.ok) {
                setViewAlliance(data.data);
            } else {
                alert(data.message || "Failed to load alliance");
                setViewAllianceOpen(false);
            }
        } finally {
            setViewLoading(false);
        }
    };


    const openEditAlliance = async (id: number) => {
        setEditOpen(true);
        setEditLoading(true);

        const res = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/alliances/${id}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            }
        );

        const json = await res.json();

        if (res.ok) {
            const alliance = json.data;

            const prof = splitOtherValue(alliance.profession, professionOptions);
            const desg = splitOtherValue(alliance.designation, designationOptions);

            setEditForm({
                ...alliance,
                profession: prof.select,
                profession_other: prof.other,
                designation: desg.select,
                designation_other: desg.other,
            });

            setEditPreviews({
                profile_photo: fileUrl(alliance.profile_photo),
                photo1: fileUrl(alliance.photo1),
                photo2: fileUrl(alliance.photo2),
                photo3: fileUrl(alliance.photo3),
            });
        }

        setEditLoading(false);
    };


    const handleEditImage = (
        e: React.ChangeEvent<HTMLInputElement>,
        field: string
    ) => {


        const file = e.target.files?.[0];
        if (!file) return;

        setEditForm((prev: any) => ({ ...prev, [field]: file }));
        setEditPreviews((p) => ({
            ...p,
            [field]: URL.createObjectURL(file),
        }));
    };




    const handleEditSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        const fd = new FormData();
        const payload = {
            ...editForm,
            designation:
                editForm.designation === "other"
                    ? editForm.designation_other
                    : editForm.designation,
            profession:
                editForm.profession === "other"
                    ? editForm.profession_other
                    : editForm.profession,
        };

        Object.entries(payload).forEach(([k, v]) => {
            if (v === null || v === undefined) return;

            // ✅ FILES: only append if actually File
            if (v instanceof File) {
                fd.append(k, v);
                return;
            }

            // 🚫 DO NOT send existing image paths
            if (
                k === "profile_photo" ||
                k === "photo1" ||
                k === "photo2" ||
                k === "photo3"
            ) {
                return;
            }

            // ✅ normal scalar fields
            if (typeof v === "string" || typeof v === "number") {
                fd.append(k, String(v));
            }
        });
        fd.append('_method', 'PATCH')


        const res = await fetch(

            `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/alliances/${editForm.id}`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
                body: fd,
            }
        );


        const data = await res.json();


        if (res.ok) {
            alert("Alliance updated successfully");
            setEditOpen(false);
            setIsCreating(false);
            loadAlliances();
            delete payload.profession_other;
            delete payload.designation_other;

        } else {
            setIsCreating(false);
            alert(data.message || "Update failed");
        }
    };

    const togglePublish = async (allianceId: number) => {
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/alliances/${allianceId}/publish`,
            {
                method: "POST", // spoof PATCH
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
                body: new URLSearchParams({ _method: "PATCH" }),
            }
        );

        const data = await res.json();

        if (res.ok) {
            loadAlliances();
        } else {
            alert(data.message || "Failed to update status");
        }
    };

    const handleAlliancePay = async () => {
        if (!payAlliance) return;

        setIsPaying(true);

        try {
            // 1️⃣ Create order
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/alliances/${payAlliance.id}/payments/create-order`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify({ amount }),
                }
            );

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Order creation failed");

            // 2️⃣ Razorpay checkout
            const options = {
                key: data.razorpay_key,
                amount: data.order.amount,
                currency: "INR",
                name: "CSI Centenary Wesley Church",
                description: "Alliance Payment",
                order_id: data.order.id,

                handler: async function (response: any) {
                    await verifyAlliancePayment(response, data.payment_id);
                },

                theme: { color: "#1e293b" },
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();
        } catch (err: any) {
            alert(err.message || "Payment failed");
        } finally {
            setIsPaying(false);
        }
    };

    const verifyAlliancePayment = async (
        response: any,
        paymentId: number
    ) => {
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/alliances/${payAlliance.id}/payments/verify`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_signature: response.razorpay_signature,
                    payment_id: paymentId,
                }),
            }
        );

        const data = await res.json();

        if (!res.ok) {
            alert(data.message || "Payment verification failed");
            return;
        }

        alert("Payment successful 🎉");
        setPayOpen(false);
        loadAlliances();
    };

    const handleOfflinePay = async () => {
        if (!confirm("Confirm offline payment?")) return;
        setIsCreating(true)

        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/alliances/${payAlliance.id}/payments/offline`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify(offlineForm),
                }
            );

            const data = await res.json();

            if (!res.ok) {
                setIsCreating(false)
                setOfflineOpen(false)
                setPayOpen(false)
                alert(data.message || "Offline payment failed");
                return;
            }

            alert("Offline payment recorded & receipt emailed");
            setOfflineOpen(false);
            setIsCreating(false)
            loadAlliances();

        } catch {
            alert("Network error");
        }
    };









    const fileUrl = (path?: string | null) => {
        if (!path) return "/no-photo.png";
        return `${process.env.NEXT_PUBLIC_IMAGE_BASE_URL}/storage/${path}`;
    };


    return (
        <div className="p-6 bg-base-100">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-xl font-bold">Alliances</h1>
                <Button onClick={openAdd} className="text-2xl font-bold cursor-pointer"><span className="text-3xl text-amber-600 font-bold">+</span> Add Alliance</Button>
            </div>
            <div className="flex justify-between items-center mb-4 gap-3">
                <div className="flex gap-2 w-2xl py-2">
                    <Input
                        placeholder="Search by alliance_id or Name"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <Button onClick={loadAlliances}>Search</Button>
                </div>

                <button
                    className="btn btn-primary"
                    onClick={() => loadAlliances()}
                >
                    Load Alliances
                </button>
            </div>



            <div className="overflow-x-auto">
                <table className="table table-zebra w-full text-center">
                    <thead>
                        <tr className="bg-blue-900 text-blue-50 p-2 text-[20px]">
                            <th>Photo</th>
                            <th>Family Name</th>
                            <th>Name</th>
                            <th>Age</th>
                            <th>Profession</th>
                            <th>Posted by</th>
                            <th>Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {alliances?.map((a) => (
                            <tr key={a.id} className="p-3 odd:bg-blue-200 even:bg-blue-50 text-[18px] ">
                                <td>
                                    {a.profile_photo ? (
                                        <img
                                            src={fileUrl(a.profile_photo)}
                                            className="w-10 h-10 rounded-full"
                                        />
                                    ) : (
                                        <div className="avatar placeholder">
                                            <div className="bg-neutral text-neutral-content w-10 bg-gray-600 rounded-full">
                                                <span className=" text-blue-50 font-bold">{a.first_name[0]}</span>
                                            </div>
                                        </div>
                                    )}
                                </td>

                                <td>{a.family_name}</td>

                                <td>{a.first_name} {a.last_name}</td>

                                <td>{a.age ?? "-"}</td>

                                <td>{a.profession ?? "-"}</td>

                                <td>{a.member_name ?? "-"}</td>



                                <td className="space-x-2">
                                    <button
                                        className="py-1 px-2 mt-2 border-2 border-blue-900 rounded-lg bg-gray-500 text-gray-50 cursor-pointer"
                                        onClick={() => {
                                            fetchAlliance(a.id);
                                            setViewAllianceOpen(true);
                                        }}
                                    >
                                        View
                                    </button>

                                    <button
                                        className="py-1 px-2 mt-2 border-2 border-blue-900 rounded-lg bg-amber-500 text-amber-50 cursor-pointer"
                                        onClick={() => openEditAlliance(a.id)}>

                                        Edit
                                    </button>

                                    {!a.amount &&
                                        <button className="py-1 px-2 mt-2 border-2 border-blue-900 rounded-lg bg-blue-500 text-amber-50 cursor-pointer"
                                            onClick={() => {
                                                setPayAlliance(a);
                                                setPayOpen(true);
                                            }}
                                        >
                                            Pay
                                        </button>

                                    }
                                    {a.amount &&
                                        <button className="py-1 px-2 mt-2 border-2 rounded-lg bg-green-300 text-green-800 "

                                        >
                                            Paid
                                        </button>

                                    }


                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Dialog open={addAllianceOpen} onOpenChange={setAddAllianceOpen}>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-gray-900 text-gray-50">

                    <DialogHeader>
                        <DialogTitle>Add Alliance</DialogTitle>
                    </DialogHeader>
                    {/* BLUR + LOADING OVERLAY */}
                    {isCreating && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                            <div className="text-center">
                                <div className="animate-spin h-8 w-8 rounded-full border-2 border-white border-t-transparent mx-auto mb-3" />
                                <p className="text-sm">Creating alliance…</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleAddAllianceSubmit} className="space-y-4">

                        {/* MEMBER + TYPE */}
                        <div className="grid grid-cols-2 gap-3">
                            <Label className="text-sm text-amber-200">Member Id</Label>
                            <Input placeholder="Member ID *" required
                                onChange={(e) => setForm({ ...form, member_id: e.target.value })}
                            />
                            <Label className="text-sm text-amber-200">Alliance Type</Label>

                            <select className="select select-bordered w-full" required
                                onChange={(e) => setForm({ ...form, alliance_type: e.target.value })}
                            >
                                <option value="">--select alliance type-- *</option>
                                <option value="bride">Bride</option>
                                <option value="bridegroom">Bridegroom</option>
                            </select>
                        </div>

                        {/* BASIC */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid grid-cols gap-1">
                                <Label className="text-sm text-amber-200">Family Name</Label>
                                <Input placeholder="Family Name *" required
                                    onChange={(e) => setForm({ ...form, family_name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols gap-1">
                                <Label className="text-sm text-amber-200">First Name</Label>
                                <Input placeholder="First Name *" required
                                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols gap-1">
                                <Label className="text-sm text-amber-200">Last Name</Label>
                                <Input placeholder="Last Name"
                                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols gap-1">
                                <Label className="text-sm text-amber-200">Date of Birth</Label>
                                <Input type="date" required
                                    onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* PARENTS */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid grid-cols gap-1">
                                <Label className="text-sm text-amber-200">Father Name</Label>
                                <Input placeholder="Father Name"
                                    onChange={(e) => setForm({ ...form, father_name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols gap-1">
                                <Label className="text-sm text-amber-200">Mother Name</Label>
                                <Input placeholder="Mother Name"
                                    onChange={(e) => setForm({ ...form, mother_name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols gap-1">
                                <Label className="text-sm text-amber-200">Father Occupation</Label>
                                <Input placeholder="Father Occupation"
                                    onChange={(e) => setForm({ ...form, father_occupation: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols gap-1">
                                <Label className="text-sm text-amber-200">Mothers Occupation</Label>
                                <Input placeholder="Mother Occupation"
                                    onChange={(e) => setForm({ ...form, mother_occupation: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* EDUCATION */}
                        <div className="grid grid-cols gap-1">
                            <Label className="text-sm text-amber-200">Educational Qualifications</Label>
                            <Textarea placeholder="Educational Qualifications"
                                onChange={(e) => setForm({ ...form, educational_qualifications: e.target.value })}
                            ></Textarea>
                        </div>

                        {/* PROFESSION */}
                        <div className="grid grid-cols gap-1">
                            <Label className="text-sm text-amber-200">Profession</Label>
                            <select className="select select-bordered border-amber-50 w-full"
                                onChange={(e) => setForm({ ...form, profession: e.target.value })}
                            >
                                <option value="">--select Profession --</option>
                                {professionOptions.map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>


                            {form.profession === "other" && (
                                <Input placeholder="Enter Profession"
                                    onChange={(e) => setForm({ ...form, profession_other: e.target.value })}
                                />
                            )}
                        </div>

                        {/* DESIGNATION */}
                        <div className="grid grid-cols gap-1">
                            <Label className="text-sm text-amber-200">Designation</Label>

                            <select className="select select-bordered w-full"
                                onChange={(e) => setForm({ ...form, designation: e.target.value })}
                            >
                                <option value="">--selectDesignation --</option>
                                {designationOptions.map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>

                            {form.designation === "other" && (
                                <Input placeholder="Enter Designation"
                                    onChange={(e) => setForm({ ...form, designation_other: e.target.value })}
                                />
                            )}
                        </div>

                        {/* WORK */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid grid-cols gap-1">
                                <Label className="text-sm text-amber-200">Company Name</Label>
                                <Input placeholder="Company Name"
                                    onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols gap-1">
                                <Label className="text-sm text-amber-200">Place of Working</Label>
                                <Input placeholder="Place of Working"
                                    onChange={(e) => setForm({ ...form, place_of_working: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* ABOUT */}
                        <div className="grid grid-cols gap-1">
                            <Label className="text-sm text-amber-200">About Self</Label>
                            <Textarea placeholder="About Self"
                                onChange={(e) => setForm({ ...form, about_self: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols gap-1">
                            <Label className="text-sm text-amber-200">About Family</Label>
                            <Textarea placeholder="About Family"
                                onChange={(e) => setForm({ ...form, about_family: e.target.value })}
                            />
                        </div>

                        {/* PHOTOS */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { key: "profile_photo", label: "Profile Photo" },
                                { key: "photo1", label: "Photo 1" },
                                { key: "photo2", label: "Photo 2" },
                                { key: "photo3", label: "Photo 3" },
                            ].map(({ key, label }) => (
                                <div key={key} className="space-y-2 text-center">
                                    <Label>{label}</Label>

                                    {previews[key] ? (
                                        <img
                                            src={previews[key] as string}
                                            alt={label}
                                            className="w-28 h-28 object-cover rounded border mx-auto"
                                        />
                                    ) : (
                                        <div className="w-28 h-28 border rounded flex items-center justify-center text-xs text-gray-400 mx-auto">
                                            No Image
                                        </div>
                                    )}

                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageChange(e, key)}
                                    />
                                </div>
                            ))}
                        </div>



                        <Button type="submit" className="w-full mx-auto bg-green-600 text-green-50">
                            Create Alliance
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={viewAllianceOpen} onOpenChange={setViewAllianceOpen}>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-gray-900 text-gray-50">

                    <DialogHeader>
                        <DialogTitle>Alliance Details</DialogTitle>
                    </DialogHeader>

                    {viewAlliance && (
                        <div className="space-y-6">

                            {/* PROFILE + BASIC INFO */}
                            <div className="flex gap-6 items-start">
                                <img
                                    src={fileUrl(viewAlliance.profile_photo)}
                                    alt="Profile"
                                    className="w-32 h-32 rounded object-cover border"
                                />

                                <div className="space-y-1">
                                    <h2 className="text-xl font-semibold">
                                        {viewAlliance.first_name} {viewAlliance.last_name}
                                    </h2>
                                    <p className="text-sm ">
                                        {viewAlliance.family_name}
                                    </p>
                                    <p>
                                        <strong>Alliance Type:</strong>{" "}
                                        {viewAlliance.alliance_type === "bride" ? "Bride" : "Bridegroom"}
                                    </p>
                                    <p>
                                        <strong>Date of Birth:</strong>{" "}
                                        {new Date(viewAlliance.date_of_birth).toLocaleDateString()}
                                    </p>
                                    <p>
                                        <strong>Status:</strong>{" "}
                                        {viewAlliance.is_published ? (
                                            <span className="text-green-600">Published</span>
                                        ) : (
                                            <span className="text-orange-600">Pending Approval</span>
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* PHOTO GALLERY */}
                            <div>
                                <h3 className="font-semibold mb-2">Photos</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {["photo1", "photo2", "photo3"].map((k) =>
                                        viewAlliance[k] ? (
                                            <img
                                                key={k}
                                                src={fileUrl(viewAlliance[k])}
                                                className="w-full h-40 object-cover rounded border"
                                            />
                                        ) : (
                                            <div
                                                key={k}
                                                className="h-40 border rounded flex items-center justify-center text-gray-400 text-sm"
                                            >
                                                No Photo
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>

                            {/* FAMILY DETAILS */}
                            <div className="grid grid-cols-2 gap-4">
                                <p><strong>Father Name:</strong> {viewAlliance.father_name || "—"}</p>
                                <p><strong>Mother Name:</strong> {viewAlliance.mother_name || "—"}</p>
                                <p><strong>Father Occupation:</strong> {viewAlliance.father_occupation || "—"}</p>
                                <p><strong>Mother Occupation:</strong> {viewAlliance.mother_occupation || "—"}</p>
                            </div>

                            {/* PROFESSIONAL */}
                            <div className="grid grid-cols-2 gap-4">
                                <p><strong>Profession:</strong> {viewAlliance.profession || "—"}</p>
                                <p><strong>Designation:</strong> {viewAlliance.designation || "—"}</p>
                                <p><strong>Company:</strong> {viewAlliance.company_name || "—"}</p>
                                <p><strong>Place of Working:</strong> {viewAlliance.place_of_working || "—"}</p>
                            </div>

                            {/* EDUCATION */}
                            <div>
                                <h3 className="font-semibold">Educational Qualifications</h3>
                                <p className="text-sm ">
                                    {viewAlliance.educational_qualifications || "—"}
                                </p>
                            </div>

                            {/* ABOUT */}
                            <div>
                                <h3 className="font-semibold">About Self</h3>
                                <p className="text-sm  whitespace-pre-line">
                                    {viewAlliance.about_self || "—"}
                                </p>
                            </div>


                            <div>
                                <h3 className="font-semibold">About Family</h3>
                                <p className="text-sm whitespace-pre-line">
                                    {viewAlliance.about_family || "—"}
                                </p>
                            </div>

                            <div>
                                <p>{viewAlliance.id}</p>
                            </div>

                            {/* MEMBER INFO */}
                            {viewAlliance.member && (
                                <div className="border-t pt-4">
                                    <h3 className="font-semibold mb-1">Member Information</h3>
                                    <p>
                                        <strong>Member:</strong>{" "}
                                        {viewAlliance.member.first_name} {viewAlliance.member.last_name}
                                    </p>
                                    <p>
                                        <strong>Member ID:</strong> {viewAlliance.member.id}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}


                </DialogContent>
            </Dialog>
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-gray-900 text-gray-50">
                    <DialogHeader>
                        <DialogTitle>Edit Alliance </DialogTitle>
                    </DialogHeader>

                    {isCreating && (
                        <div className="absolute inset-0 bg-black/40 z-50 flex items-center justify-center text-white text-lg">
                            Updating alliance…
                        </div>
                    )}

                    {editLoading && <p className="text-center">Loading…</p>}

                    {!editLoading && editForm && (
                        <form onSubmit={handleEditSubmit} className="space-y-4">



                            {/* Images */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {["profile_photo", "photo1", "photo2", "photo3"].map((k) => (
                                    <div key={k} className="space-y-2 text-center">
                                        {editPreviews[k] && (
                                            <img src={editPreviews[k] as string}
                                                className="w-28 h-28 object-cover rounded mx-auto" />
                                        )}
                                        <Input type="file" accept="image/*"
                                            onChange={(e) => handleEditImage(e, k)} />
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col space-y-0.5">
                                    <label className="text-amber-400 text-[12px]">Alliance Type</label>
                                    <select className="select select-bordered w-full"
                                        value={editForm.alliance_type}
                                        onChange={(e) => setForm({ ...editForm, alliance_type: e.target.value })}
                                    >
                                        <option value="">Alliance Type *</option>
                                        <option value="bride">Bride</option>
                                        <option value="bridegroom">Bridegroom</option>
                                    </select>
                                </div>
                                <div className="flex flex-col space-y-0.5">
                                    <label className="text-amber-400 text-[12px]">Family Name</label>
                                    <Input value={editForm.family_name}
                                        onChange={(e) => setEditForm({ ...editForm, family_name: e.target.value })}
                                    />
                                </div>
                                <div className="flex flex-col space-y-0.5">
                                    <label className="text-amber-400 text-[12px]">First Name</label>
                                    <Input value={editForm.first_name}
                                        onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                                    />
                                </div>
                                <div className="flex flex-col space-y-0.5">
                                    <label className="text-amber-400 text-[12px]">Last Name</label>

                                    <Input value={editForm.last_name ?? ""}
                                        onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                                    />
                                </div>
                                <div className="flex flex-col space-y-0.5">
                                    <label className="text-amber-400 text-[12px]">Date of Birth</label>

                                    <Input type="date"
                                        value={editForm.date_of_birth?.substring(0, 10)}
                                        onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })}
                                    />
                                </div>
                                <div className="flex flex-col space-y-0.5">
                                    <label className="text-amber-400 text-[12px]">Father Name</label>
                                    <Input value={editForm.father_name}
                                        onChange={(e) => setEditForm({ ...editForm, father_name: e.target.value })}
                                    />
                                </div>
                                <div className="flex flex-col space-y-0.5">
                                    <label className="text-amber-400 text-[12px]">Mother Name</label>

                                    <Input value={editForm.mother_name}
                                        onChange={(e) => setEditForm({ ...editForm, mother_name: e.target.value })}
                                    />
                                </div>
                                <div className="flex flex-col space-y-0.5">
                                    <label className="text-amber-400 text-[12px]">Father Occupation</label>

                                    <Input value={editForm.father_occupation}
                                        onChange={(e) => setEditForm({ ...editForm, father_occupation: e.target.value })}
                                    />
                                </div>
                                <div className="flex flex-col space-y-0.5">
                                    <label className="text-amber-400 text-[12px]">Mother Occupation</label>

                                    <Input value={editForm.mother_occupation}
                                        onChange={(e) => setEditForm({ ...editForm, mother_occupation: e.target.value })}
                                    />
                                </div>
                                <div className="flex flex-col space-y-0.5">
                                    <label className="text-amber-400 text-[12px]">Educational Qualifications</label>
                                    <Textarea
                                        value={editForm.educational_qualifications}
                                        onChange={(e) => setForm({ ...editForm, educational_qualifications: e.target.value })}
                                    />

                                </div>
                                <div className="flex flex-col space-y-0.5">
                                    <label className="text-amber-400 text-[12px]">Profession: {editForm.profession}</label>
                                    <select
                                        className="select select-bordered w-full"
                                        value={editForm.profession || ""}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, profession: e.target.value })
                                        }
                                    >
                                        <option value="">--Profession--</option>
                                        {professionOptions.map(p => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>

                                    {editForm.profession === "other" && (
                                        <Input
                                            placeholder="Enter Profession"
                                            value={editForm.profession_other || ""}
                                            onChange={(e) =>
                                                setEditForm({
                                                    ...editForm,
                                                    profession_other: e.target.value,
                                                })
                                            }
                                        />
                                    )}

                                </div>
                                <div className="flex flex-col space-y-0.5">
                                    <label className="text-amber-400 text-[12px]">Designation: {editForm.designation}</label>
                                    <select
                                        className="select select-bordered w-full"
                                        value={editForm.designation || ""}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, designation: e.target.value })
                                        }
                                    >
                                        <option value="">--select Designation--</option>
                                        {designationOptions.map(p => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>

                                    {editForm.designation === "other" && (
                                        <Input
                                            placeholder="Enter Profession"
                                            value={editForm.designation_other || ""}
                                            onChange={(e) =>
                                                setEditForm({
                                                    ...editForm,
                                                    designation_other: e.target.value,
                                                })
                                            }
                                        />
                                    )}

                                </div>
                                <div className="flex flex-col space-y-0.5">
                                    <label className="text-amber-400 text-[12px]">Company Name</label>

                                    <Input value={editForm.company_name}
                                        onChange={(e) => setEditForm({ ...editForm, company_name: e.target.value })}
                                    />
                                </div>
                                <div className="flex flex-col space-y-0.5">
                                    <label className="text-amber-400 text-[12px]">Place of Working</label>

                                    <Input value={editForm.place_of_working}
                                        onChange={(e) => setEditForm({ ...editForm, place_of_working: e.target.value })}
                                    />
                                </div>

                            </div>
                            <div className="flex flex-col space-y-0.5">
                                <label className="text-amber-400 text-[12px]">About the ward</label>
                                <Textarea
                                    value={editForm.about_self}
                                    onChange={(e) => setForm({ ...editForm, about_self: e.target.value })}
                                />

                            </div>
                            <div className="flex flex-col space-y-0.5">
                                <label className="text-amber-400 text-[12px]">About the family</label>
                                <Textarea
                                    value={editForm.about_family}
                                    onChange={(e) => setForm({ ...editForm, about_family: e.target.value })}
                                />

                            </div>

                            <Button onClick={handleEditSubmit} type="submit" className="w-full bg-green-600 text-gray-50">
                                Update Alliance
                            </Button>

                        </form>
                    )}
                </DialogContent>
            </Dialog>
            <Dialog open={payOpen} onOpenChange={setPayOpen}>
                <DialogContent className="max-w-md bg-gray-900 text-gray-50">
                    <DialogHeader>
                        <DialogTitle>Alliance Payment</DialogTitle>
                    </DialogHeader>

                    {payAlliance && (
                        <div className="space-y-4">
                            <div className="text-sm text-gray-400">
                                {payAlliance.first_name} {payAlliance.last_name}
                            </div>

                            <Input
                                type="number"
                                min={3000}
                                value={amount}
                                onChange={(e) => setAmount(Number(e.target.value))}
                                placeholder="Amount (₹)"
                            />

                            <div className="flex gap-3 justify-end mt-4">
                                <Button onClick={handleAlliancePay} className="bg-blue-600">
                                    Pay Online
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={() => setOfflineOpen(true)}
                                >
                                    Pay Offline
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {offlineOpen && (
                <Dialog open onOpenChange={setOfflineOpen}>
                    <DialogContent className="bg-gray-50 text-gray-950 text-[14px]">
                        <DialogHeader>
                            <DialogTitle>Confirm Offline Payment</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-3">
                            <Input
                                type="number"
                                value={offlineForm.amount}
                                onChange={(e) =>
                                    setOfflineForm({ ...offlineForm, amount: Number(e.target.value) })
                                }
                                placeholder="Amount"
                            />

                            <select
                                className="select select-bordered w-full"
                                value={offlineForm.payment_mode}
                                onChange={(e) =>
                                    setOfflineForm({ ...offlineForm, payment_mode: e.target.value })
                                }
                            >
                                <option value="cash">Cash</option>
                                <option value="upi">UPI</option>
                            </select>

                            <Input
                                placeholder="Receipt / Reference Number"
                                value={offlineForm.reference_no}
                                onChange={(e) =>
                                    setOfflineForm({ ...offlineForm, reference_no: e.target.value })
                                }
                            />
                        </div>

                        <DialogFooter className="mt-4">
                            <Button variant="ghost" onClick={() => setOfflineOpen(false)}>
                                Cancel
                            </Button>

                            <Button
                                className="bg-green-600"
                                onClick={handleOfflinePay}
                            >
                                Confirm Payment
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}








        </div>
    );
}
