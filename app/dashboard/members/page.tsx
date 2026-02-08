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
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";



interface Member {
    id: number;
    family_name: string;
    first_name: string;
    middle_name?: string;
    last_name?: string;
    date_of_birth: Date;
    wedding_date: Date;
    spouse_name: string;
    area_no: string;
    email: string;
    mobile_number: string;
    address_flat_no: string;
    address_premises: string;
    address_area: string;
    address_landmark: string;
    address_pin: number;
    occupation?: string;
    status: "in_service" | "retired" | "other";

    profile_photo?: string | null;
    couple_pic?: string | null;

    membership_fee?: number | null;

}

type ContactFields = Pick<Member, "email" | "mobile_number">;


export default function MembersPage() {
    const { token, isAdmin } = useAuth();
    const router = useRouter();

    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(false);

    const [viewModal, setViewModal] = useState(false);
    const [editModal, setEditModal] = useState(false);
    const [addModal, setAddModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [editContact, setEditContact] = useState(false);
    const [isDeactivating, setIsDeactivating] = useState(false);
    const [search, setSearch] = useState("");


    const [selectedMember, setSelectedMember] = useState<Member | null>(null);

    const [contactForm, setContactForm] = useState<Partial<ContactFields>>({});
    const [savingContact, setSavingContact] = useState(false);
    // For editing
    const [editForm, setEditForm] = useState<any>({});
    const [editProfilePreview, setEditProfilePreview] = useState<string | null>(
        null
    );
    const [editCouplepicPreview, setEditCouplepicPreview] = useState<string | null>(
        null
    );

    const [editEmail, setEditEmail] = useState(false);
    const [editMobile, setEditMobile] = useState(false);

    const [emailForm, setEmailForm] = useState<string>("");
    const [mobileForm, setMobileForm] = useState<string>("");

    const [savingEmail, setSavingEmail] = useState(false);
    const [savingMobile, setSavingMobile] = useState(false);


    const toDateInput = (value?: string | Date | null): string => {
        if (!value) return "";

        if (value instanceof Date) {
            // Convert Date → YYYY-MM-DD
            return value.toISOString().split("T")[0];
        }

        // String (ISO or YYYY-MM-DD)
        return value.split("T")[0];
    };


    // For add
    const [addForm, setAddForm] = useState<any>({});
    const [addProfilePreview, setAddProfilePreview] = useState<string | null>(
        null
    );
    const [addCouplepicPreview, setAddCouplepicPreview] = useState<string | null>(
        null
    );

    useEffect(() => {

        loadMembers();
    }, [token]);

    const loadMembers = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/members?search=${search}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await res.json();
            setMembers(data.data.data);
        } catch {
            alert("Unable to load members");
        } finally {
            setLoading(false);
        }
    };

    const openView = (m: Member) => {
        setSelectedMember(m);
        setViewModal(true);
    };



    const openEdit = (m: Member) => {
        setSelectedMember(m);
        setEditForm({
            ...m,
            date_of_birth: toDateInput(m.date_of_birth),
            wedding_date: toDateInput(m.wedding_date),
        });
        setEditProfilePreview(m.profile_photo ? fileUrl(m.profile_photo) : null);
        setEditModal(true);
    };

    const openAdd = () => {
        setAddForm({});
        setAddProfilePreview(null);
        setAddModal(true);
    };

    const fileUrl = (path?: string | null) => {
        if (!path) return "/avatar.png";
        return `${process.env.NEXT_PUBLIC_IMAGE_BASE_URL}/storage/${path}`;
    };




    /* ---------------------- ADD MEMBER ------------------------ */

    const handleAddSubmit = async (e: FormEvent) => {
        e.preventDefault();

        setIsCreating(true);
        setSuccessMsg(null);
        const formData = new FormData();

        Object.entries(addForm).forEach(([key, val]) => {
            if (val !== null && val !== undefined) {
                if (typeof val === "object" && key === "residential_address") {
                    Object.entries(val as any).forEach(([subKey, subVal]) => {
                        if (subVal)
                            formData.append(`residential_address[${subKey}]`, subVal as any);
                    });
                } else {
                    formData.append(key, val as any);
                }
            }
        });

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/members`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.message || "Failed to create member");
                setIsCreating(false);
                return;
            }

            if (res.ok) {
                // success
                setSuccessMsg("Member created successfully ✅");
                loadMembers();

                // auto close modal after short delay
                setTimeout(() => {
                    setAddModal(false);
                    setSuccessMsg(null);
                }, 1500);
            } else {
                alert(data.message || "Error creating member");
            }
        } catch (err) {
            alert("Network error");
        } finally {
            setIsCreating(false);
        }
    };

    /* ---------------------- EDIT MEMBER ------------------------ */

    const handleEditSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsCreating(true);

        const fd = new FormData();

        Object.entries(editForm).forEach(([key, val]) => {
            if (val === null || val === undefined) return;

            // ✅ 1. FILES: send ONLY if user selected a new file
            if (val instanceof File) {
                fd.append(key, val);
                return;
            }

            // ❌ 2. DO NOT send existing image paths
            if (
                key === "profile_photo" ||
                key === "couple_pic"
            ) {
                return;
            }

            // ✅ 3. Normal scalar values
            fd.append(key, String(val));
        });

        // Laravel PATCH support
        fd.append("_method", "PATCH");

        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/members/${editForm.id}`,
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
                alert(data.message || "Update failed");
                return;
            }

            alert("Member updated successfully");
            setEditModal(false);
            loadMembers();
        } catch {
            alert("Network error");
        } finally {
            setIsCreating(false);
        }
    };


    const handleEmailUpdate = async () => {
        if (!selectedMember) return;

        if (emailForm.trim() === selectedMember.email) {
            alert("No change in email");
            return;
        }

        setSavingEmail(true);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/members/${selectedMember.id}/email`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify({ email: emailForm }),
                }
            );

            const data = await res.json();
            if (!res.ok) {
                alert(data.message || "Failed to update email");
                return;
            }

            setSelectedMember((prev: any) => ({
                ...prev,
                email: data.data.email,
            }));
            loadMembers()

            setEditEmail(false);
        } finally {
            setSavingEmail(false);
        }
    };


    const handleMobileUpdate = async () => {
        if (!selectedMember) return;

        if (mobileForm.trim() === selectedMember.mobile_number) {
            alert("No change in mobile number");
            return;
        }

        setSavingMobile(true);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/members/${selectedMember.id}/mobile`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify({ mobile_number: mobileForm }),
                }
            );

            const data = await res.json();
            if (!res.ok) {
                alert(data.message || "Failed to update mobile number");
                return;
            }

            setSelectedMember((prev: any) => ({
                ...prev,
                mobile_number: data.data.mobile_number,
            }));
            loadMembers()

            setEditMobile(false);
        } finally {
            setSavingMobile(false);
        }
    };




    const handleDeactivateMember = async () => {
        if (!selectedMember) return;

        const confirmed = window.confirm(
            "Are you sure?\n\nThis will deactivate the member.\nThey will no longer be active."
        );

        if (!confirmed) return;

        setIsDeactivating(true);

        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/members/${selectedMember.id}/deactivate`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                }
            );

            const data = await res.json();

            if (!res.ok) {
                alert(data.message || "Failed to deactivate member");
                return;
            }

            alert("Member deactivated successfully");

            loadMembers();
            setEditModal(false);
        } catch {
            alert("Network error");
        } finally {
            setIsDeactivating(false);
        }
    };



    return (
        <div className="p-6 bg-base-100">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-xl font-bold">Members</h1>
                <Button onClick={openAdd}>+ Add Member</Button>
            </div>

            {/* DaisyUI Table */}
            <div className="overflow-x-auto">
                <div className="flex gap-2 max-w-md py-2">
                    <Input
                        placeholder="Search by Member ID or Name"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <Button onClick={loadMembers}>Search</Button>
                </div>
                <table className="table table-zebra w-full text-center">
                    <thead className="bg-[#272757] text-blue-50 px-2 ">
                        <tr >
                            <th >Photo</th>
                            <th >Family Name</th>
                            <th>First</th>
                            <th>Last</th>
                            <th>DOB</th>
                            <th>Email</th>
                            <th>Mobile</th>
                            <th>Area</th>
                            <th className="text-right">Actions</th>
                        </tr>
                    </thead>

                    <tbody>

                        {members.map((m) => (
                            <tr key={m.id} className="odd:bg-blue-200 even:bg-blue-50">
                                <td>

                                    <Image
                                        src={fileUrl(m.profile_photo)}
                                        alt="avatar"
                                        width={20}
                                        height={20}
                                        className="w-10 h-10 rounded-full"

                                    />
                                </td>

                                <td>{m.family_name}</td>
                                <td>{m.first_name}</td>
                                <td>{m.last_name}</td>
                                <td>{format(m.date_of_birth, 'dd-MM-yyyy')}</td>
                                <td>{m.email}</td>
                                <td>{m.mobile_number}</td>
                                <td>{m.area_no}</td>

                                <td className="text-right">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => openView(m)}
                                        className="bg-green-200 text-green-950 font-bold my-1"
                                    >
                                        View
                                    </Button>{" "}
                                    <Button size="sm" onClick={() => openEdit(m)} className="bg-amber-400 text-amber-950 font-bold my-1">
                                        Edit
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {loading && <p className="mt-4">Loading members…</p>}
            </div>

            {/* ------------------ VIEW MODAL ------------------ */}
            <Dialog open={viewModal} onOpenChange={setViewModal}>
                <DialogContent className="max-w-2xl bg-blue-50 text-blue-950 border-slate-700">
                    <DialogHeader className="flex items-center justify-center">
                        <DialogTitle>Member Details</DialogTitle>
                        <DialogDescription>
                            Full information of the member.
                        </DialogDescription>
                    </DialogHeader>


                    <div className="overflow-x-auto">
                        {selectedMember && (
                            <ScrollArea className="max-h-[70vh] pr-2">
                                <table className="table table-zebra w-full">
                                    <thead className=" px-2 ">
                                        <tr >
                                            <td >
                                                <Image
                                                    src={fileUrl(selectedMember?.profile_photo)}
                                                    alt="photo"
                                                    width={120}
                                                    height={120}
                                                    className="rounded mb-2"
                                                />
                                            </td>
                                            <td >
                                                <Image
                                                    src={fileUrl(selectedMember?.couple_pic)}
                                                    alt="photo"
                                                    width={120}
                                                    height={120}
                                                    className="rounded mb-2"
                                                />
                                            </td>

                                        </tr>

                                    </thead>
                                    <tbody>
                                        {Object.entries(selectedMember).map(([key, value]) => (
                                            <tr key={key} className="odd:bg-blue-200 even:bg-blue-50">
                                                <td className="p-2"><strong>{key}:</strong>{" "}</td>
                                                <td className="p-2">{typeof value === "object"
                                                    ? JSON.stringify(value)
                                                    : String(value)}</td>
                                            </tr>
                                        ))}


                                    </tbody>

                                </table>


                            </ScrollArea>
                        )}

                    </div>


                </DialogContent>
            </Dialog>

            {/* ------------------ EDIT MODAL ------------------ */}
            <Dialog open={editModal} onOpenChange={setEditModal}>
                <DialogContent
                    className="
                            w-[95vw]
                            max-w-6xl
                            bg-slate-900
                            text-white
                            border-slate-700
                            p-0
    "
                >
                    <form onSubmit={handleEditSubmit} className="relative">

                        {/* BLUR + LOADING OVERLAY */}
                        {isCreating && (
                            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                                <div className="text-center">
                                    <div className="animate-spin h-8 w-8 rounded-full border-2 border-white border-t-transparent mx-auto mb-3" />
                                    <p className="text-sm">Creating member…</p>
                                </div>
                            </div>
                        )}

                        {/* SUCCESS MESSAGE */}
                        {successMsg && (
                            <div className="bg-green-600/20 border border-green-500 text-green-300 px-4 py-2 text-sm">
                                {successMsg}
                            </div>
                        )}


                        {/* HEADER */}
                        <div className="px-6 py-4 border-b border-slate-700">
                            <DialogTitle>Edit Member </DialogTitle>
                        </div>

                        {/* BODY (SCROLLABLE) */}
                        <div className="max-h-[65vh] overflow-y-auto px-6 py-4 space-y-6">

                            {/* PHOTO SECTION */}
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <Label>Profile Photo</Label>
                                    {(editProfilePreview || editForm.profile_photo) && (
                                        <img
                                            src={
                                                editProfilePreview ||
                                                fileUrl(editForm.profile_photo as string)
                                            }
                                            className="w-28 h-28 object-cover rounded-2xl mb-2"
                                            alt="profile"
                                        />
                                    )}
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            setEditForm({ ...editForm, profile_photo: file });
                                            setEditProfilePreview(URL.createObjectURL(file));
                                        }}
                                    />
                                </div>

                                <div>
                                    <Label>Couple Pic</Label>
                                    {(editCouplepicPreview || editForm.couple_pic) && (
                                        <img
                                            src={
                                                editCouplepicPreview ||
                                                fileUrl(editForm.couple_pic as string)
                                            }
                                            className="w-28 h-28 object-cover rounded-2xl mb-2"
                                            alt="profile"
                                        />
                                    )}
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            setEditForm({ ...editForm, couple_pic: file });
                                            setEditCouplepicPreview(URL.createObjectURL(file));
                                        }}
                                    />
                                </div>
                            </div>

                            {/* BASIC INFO */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col space-y-0.5">
                                    <label className="text-amber-400">Family Name</label>
                                    <Input
                                        placeholder="Family Name *"
                                        value={editForm.family_name || ""}
                                        onChange={(e) => setEditForm({ ...editForm, family_name: e.target.value })}
                                    />
                                </div>
                                <div className="flex flex-col space-y-0.5">
                                    <label className="text-amber-400">First Name</label>
                                    <Input
                                        placeholder="First Name *"
                                        value={editForm.first_name || ""}
                                        onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                                    />
                                </div>
                                <div className="flex flex-col space-y-0.5">
                                    <label className="text-amber-400">Middle Name</label>
                                    <Input
                                        placeholder="Middle Name"
                                        value={editForm.middle_name || ""}
                                        onChange={(e) => setEditForm({ ...editForm, middle_name: e.target.value })}
                                    />
                                </div>
                                <div className="flex flex-col space-y-0.5">
                                    <label className="text-amber-400">Middle Name</label>


                                    <Input
                                        placeholder="Last Name"
                                        value={editForm.last_name || ""}
                                        onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* DATES */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-amber-400">Date of Birth </Label>
                                    <Input
                                        type="date"
                                        value={editForm.date_of_birth}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, date_of_birth: e.target.value })
                                        }
                                    />
                                </div>

                                <div>
                                    <Label className="text-amber-400">Wedding Date<p>{editForm.wedding_date}</p></Label>
                                    <Input
                                        type="date"
                                        value={editForm.wedding_date}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, wedding_date: e.target.value })
                                        }
                                    />
                                </div>
                            </div>

                            {/* SPOUSE + GENDER */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col space-y-0.5">
                                    <label className="text-amber-400">Spouse Name</label>
                                    <Input
                                        placeholder="Spouse Name"
                                        value={editForm.spouse_name || ""}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, spouse_name: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="flex flex-col space-y-0.5">
                                    <label className="text-amber-400">Gender</label>

                                    <select
                                        className="bg-slate-800 border border-slate-600 rounded px-3 py-2"
                                        value={editForm.gender || ""}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, gender: e.target.value })
                                        }
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>

                                    </select>
                                </div>
                            </div>

                            {/* CONTACT */}


                            {/* ADDRESS */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col space-y-0.5">
                                    <label className="text-amber-400">HNo/Flat No</label>
                                    <Input
                                        placeholder="Flat / House No"
                                        value={editForm.address_flat_number || ""}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, address_flat_number: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="flex flex-col space-y-0.5">
                                    <label className="text-amber-400">Premises Name</label>
                                    <Input
                                        placeholder="Premises"
                                        value={editForm.address_premises || ""}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, address_premises: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="flex flex-col space-y-0.5">
                                    <label className="text-amber-400">Area name</label>
                                    <Input
                                        placeholder="Area"
                                        value={editForm.address_area || ""}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, address_area: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="flex flex-col space-y-0.5">
                                    <label className="text-amber-400">Land Mark</label>
                                    <Input
                                        placeholder="Landmark"
                                        value={editForm.address_landmark || ""}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, address_landmark: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="flex flex-col space-y-0.5">
                                    <label className="text-amber-400">City</label>
                                    <Input
                                        placeholder="City"
                                        value={editForm.address_city || ""}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, address_city: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="flex flex-col space-y-0.5">
                                    <label className="text-amber-400">PIN</label>
                                    <Input
                                        placeholder="PIN"
                                        maxLength={6}
                                        value={editForm.address_pin || ""}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, address_pin: e.target.value })
                                        }
                                    />
                                </div>
                            </div>

                            {/* STATUS / ROLE */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="flex flex-col space-y-0.5">
                                    <label className="text-amber-400">Church Area No</label>
                                    <Input
                                        placeholder="Area No *"
                                        maxLength={2}
                                        value={editForm.area_no || ""}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, area_no: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="flex flex-col space-y-0.5">
                                    <label className="text-amber-400">Occupation</label>
                                    <Input
                                        placeholder="City"
                                        value={editForm.occupation || ""}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, occupation: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="flex flex-col space-y-0.5">
                                    <label className="text-amber-400">Occupation Status</label>

                                    <select
                                        className="bg-slate-800 border border-slate-600 rounded px-3 py-2"
                                        value={editForm.status || ""}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, status: e.target.value })
                                        }
                                    >
                                        <option value="">Status</option>
                                        <option value="in_service">In Service</option>
                                        <option value="retired">Retired</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                {/* FINANCE */}
                                <div className="flex flex-col space-y-0.5">
                                    <label className="text-amber-400">Membership Fee</label>
                                    <Input
                                        type="number"
                                        placeholder="Membership Fee"
                                        value={editForm.membership_fee || ""}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, membership_fee: e.target.value })
                                        }
                                    />
                                </div>


                            </div>



                        </div>

                        {/* FOOTER */}
                        <div className="px-6 py-4 border-t border-slate-700 flex justify-between">
                            <Button
                                type="button"
                                variant="destructive"
                                disabled={isDeactivating}
                                onClick={handleDeactivateMember}
                                className="p3 bg-red-500 text-red-100 font-bold"
                            >
                                {isDeactivating ? "Deactivating..." : "Deactivate Member"}
                            </Button>
                            <Button type="submit" className="bg-emerald-600">
                                Save Changes
                            </Button>
                        </div>
                        <div className="border rounded p-4 bg-slate-950 space-y-3">
                            <div className="flex items-center justify-between">
                                <Label>Email</Label>
                                {!editEmail && (
                                    <Button size="sm" variant="outline" onClick={() => setEditEmail(true)}>
                                        Edit
                                    </Button>
                                )}
                            </div>
                            {editEmail ? (
                                <div className="flex gap-2">
                                    <Input
                                        type="email"
                                        value={emailForm}
                                        onChange={(e) => setEmailForm(e.target.value)}
                                    />
                                    <Button onClick={handleEmailUpdate} disabled={savingEmail}>
                                        {savingEmail ? "Saving…" : "Save"}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            setEditEmail(false);
                                            setEmailForm(selectedMember?.email ?? "");
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            ) : (
                                <p className="text-sm">{selectedMember?.email}</p>
                            )}

                            <div className="flex items-center justify-between">
                                <Label>Mobile</Label>
                                {!editMobile && (
                                    <Button size="sm" variant="outline" onClick={() => setEditMobile(true)}>
                                        Edit
                                    </Button>
                                )}
                            </div>
                            {editMobile ? (
                                <div className="flex gap-2">
                                    <Input
                                        maxLength={10}
                                        value={mobileForm}
                                        onChange={(e) => setMobileForm(e.target.value)}
                                    />
                                    <Button onClick={handleMobileUpdate} disabled={savingMobile}>
                                        {savingMobile ? "Saving…" : "Save"}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            setEditMobile(false);
                                            setMobileForm(selectedMember?.mobile_number ?? "");
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            ) : (
                                <p className="text-sm">{selectedMember?.mobile_number}</p>
                            )}


                        </div>


                    </form>


                </DialogContent>
            </Dialog>


            {/* ------------------ ADD MODAL ------------------ */}
            <Dialog open={addModal} onOpenChange={setAddModal}>

                <DialogContent className="w-[95vw] bg-slate-900 text-white border-slate-700 px-2">
                    <DialogHeader>
                        <DialogTitle>Add Member</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="max-h-[70vh] pr-2">
                        <div className="flex-1 overflow-y-auto px-6 py-4">
                            <form onSubmit={handleAddSubmit} className="space-y-4">

                                {/* BLUR + LOADING OVERLAY */}
                                {isCreating && (
                                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                                        <div className="text-center">
                                            <div className="animate-spin h-8 w-8 rounded-full border-2 border-white border-t-transparent mx-auto mb-3" />
                                            <p className="text-sm">Creating member…</p>
                                        </div>
                                    </div>
                                )}

                                {/* SUCCESS MESSAGE */}
                                {successMsg && (
                                    <div className="bg-green-600/20 border border-green-500 text-green-300 px-4 py-2 text-sm">
                                        {successMsg}
                                    </div>
                                )}


                                {/* Photo preview */}
                                {addProfilePreview && (
                                    <Image
                                        src={addProfilePreview}
                                        width={100}
                                        height={100}
                                        className="rounded"
                                        alt="preview"
                                    />
                                )}
                                <Label>Profile picture</Label>
                                <Input
                                    type="file"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        setAddForm({ ...addForm, profile_photo: file });
                                        setAddProfilePreview(URL.createObjectURL(file));
                                    }}
                                />



                                {/* Photo preview */}
                                {addCouplepicPreview && (
                                    <Image
                                        src={addCouplepicPreview}
                                        width={100}
                                        height={100}
                                        className="rounded"
                                        alt="preview"
                                    />
                                )}
                                <Label>Couple picture</Label>
                                <Input
                                    type="file"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        setAddForm({ ...addForm, couple_pic: file });
                                        setAddCouplepicPreview(URL.createObjectURL(file));
                                    }}
                                />

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label>Family Name *</Label>
                                        <Input
                                            required
                                            onChange={(e) =>
                                                setAddForm({ ...addForm, family_name: e.target.value })
                                            }
                                        />
                                    </div>

                                    <div>
                                        <Label>First Name *</Label>
                                        <Input
                                            required
                                            onChange={(e) =>
                                                setAddForm({ ...addForm, first_name: e.target.value })
                                            }
                                        />
                                    </div>
                                    <div>
                                        <Label>Middle Name *</Label>
                                        <Input

                                            onChange={(e) =>
                                                setAddForm({ ...addForm, middle_name: e.target.value })
                                            }
                                        />
                                    </div>
                                    <div>
                                        <Label>Last Name *</Label>
                                        <Input
                                            required
                                            onChange={(e) =>
                                                setAddForm({ ...addForm, last_name: e.target.value })
                                            }
                                        />
                                    </div>
                                    <div>
                                        <Label>Gender *</Label>
                                        <select
                                            required
                                            onChange={(e) =>
                                                setAddForm({ ...addForm, gender: e.target.value })
                                            }
                                        >
                                            <option>--select--</option>
                                            <option>Male</option>
                                            <option>Female</option>
                                        </select>
                                    </div>

                                    <div>
                                        <Label>Date of Birth *</Label>
                                        <Input
                                            type="date"
                                            required
                                            onChange={(e) =>
                                                setAddForm({ ...addForm, date_of_birth: e.target.value })
                                            }
                                        />
                                    </div>
                                    <div>
                                        <Label>Wedding Date </Label>
                                        <Input
                                            type="date"

                                            onChange={(e) =>
                                                setAddForm({ ...addForm, wedding_date: e.target.value })
                                            }
                                        />
                                    </div>
                                    <div>
                                        <Label>Spouse Name </Label>
                                        <Input
                                            type="string"
                                            onChange={(e) =>
                                                setAddForm({ ...addForm, spouse_name: e.target.value })
                                            }
                                        />
                                    </div>

                                    <div>
                                        <Label>Email *</Label>
                                        <Input
                                            required
                                            type="email"
                                            onChange={(e) =>
                                                setAddForm({ ...addForm, email: e.target.value })
                                            }
                                        />
                                    </div>

                                    <div>
                                        <Label>Mobile *</Label>
                                        <Input
                                            required
                                            maxLength={10}
                                            onChange={(e) =>
                                                setAddForm({ ...addForm, mobile_number: e.target.value })
                                            }
                                        />
                                    </div>
                                    <div>
                                        <Label>Address_flat_number</Label>
                                        <Input
                                            type="sting"
                                            onChange={(e) =>
                                                setAddForm({ ...addForm, address_flat_number: e.target.value })
                                            }
                                        />
                                    </div>
                                    <div>
                                        <Label>Address_premises</Label>
                                        <Input
                                            type="sting"
                                            onChange={(e) =>
                                                setAddForm({ ...addForm, address_premises: e.target.value })
                                            }
                                        />
                                    </div>
                                    <div>
                                        <Label>Address_area</Label>
                                        <Input
                                            type="sting"
                                            onChange={(e) =>
                                                setAddForm({ ...addForm, address_area: e.target.value })
                                            }
                                        />
                                    </div>
                                    <div>
                                        <Label>Address_landmark</Label>
                                        <Input
                                            type="sting"
                                            onChange={(e) =>
                                                setAddForm({ ...addForm, address_landmark: e.target.value })
                                            }
                                        />
                                    </div>
                                    <div>
                                        <Label>Address_city</Label>
                                        <Input
                                            type="sting"
                                            onChange={(e) =>
                                                setAddForm({ ...addForm, address_city: e.target.value })
                                            }
                                        />
                                    </div>
                                    <div>
                                        <Label>Address_pin</Label>
                                        <Input
                                            type="sting"
                                            onChange={(e) =>
                                                setAddForm({ ...addForm, address_pin: e.target.value })
                                            }
                                        />
                                    </div>



                                    <div>
                                        <Label>Area No *</Label>
                                        <Input
                                            required
                                            maxLength={2}
                                            onChange={(e) =>
                                                setAddForm({ ...addForm, area_no: e.target.value })
                                            }
                                        />
                                    </div>
                                    <div>
                                        <Label>Occupation</Label>
                                        <Input

                                            maxLength={20}
                                            onChange={(e) =>
                                                setAddForm({ ...addForm, occupation: e.target.value })
                                            }
                                        />
                                    </div>

                                    <div>
                                        <Label>Status *</Label>
                                        <select
                                            required
                                            className="w-full rounded bg-slate-800 p-2 border border-slate-600"
                                            onChange={(e) =>
                                                setAddForm({ ...addForm, status: e.target.value })
                                            }
                                        >
                                            <option value="">Select...</option>
                                            <option value="in_service">In Service</option>
                                            <option value="retired">Retired</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <Label>Membershipfee</Label>
                                        <Input
                                            type="number"
                                            onChange={(e) =>
                                                setAddForm({ ...addForm, membership_fee: e.target.value })
                                            }
                                        />
                                    </div>

                                </div>

                                <Button type="submit" className="bg-blue-600">
                                    Create Member
                                </Button>
                            </form>
                        </div>
                    </ScrollArea>
                </DialogContent>

            </Dialog>

        </div>
    );
}
