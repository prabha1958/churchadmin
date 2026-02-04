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

interface PastorateComMember {
    id: number;
    family_name: string;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    dt_from: string;
    dt_to: string;
    status: "in" | "out";
    designation: string;
    profile_photo: string;
    achievements: string;
    created_at: Date;
    updated_at: Date;

}

export default function PastrsPage() {
    const { token, isAdmin } = useAuth();
    const router = useRouter();

    const [pcmembers, setPcmembers] = useState<PastorateComMember[]>([]);
    const [loading, setLoading] = useState(false);

    const [viewModal, setViewModal] = useState(false);
    const [editModal, setEditModal] = useState(false);
    const [addModal, setAddModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [addForm, setAddForm] = useState<any>({});
    const [addProfilePreview, setAddProfilePreview] = useState<string | null>(
        null
    );

    const [selectedComMember, setSelectedComMember] = useState<PastorateComMember | null>(null);
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

    useEffect(() => {

        loadPcmembers();

    }, [token]);




    const loadPcmembers = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/commembers`, {
                method: "GET",
                headers: {

                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });

            const json = await res.json();

            setPcmembers(Array.isArray(json.data) ? json.data : []);
            console.log(pcmembers)

        } catch {
            alert("Unable to load pcmembers");
        } finally {
            setLoading(false);
        }
    };


    const openAdd = () => {
        setAddForm({});
        setAddProfilePreview(null);
        setAddModal(true);
    };

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
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/commembers`, {
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
                loadPcmembers();

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



    const openEdit = (pcm: PastorateComMember) => {
        setSelectedComMember(pcm);
        setEditForm({
            ...pcm,
            dt_from: toDateInput(pcm.dt_from),
            dt_to: toDateInput(pcm.dt_to),
            date_of_birth: toDateInput(pcm.date_of_birth)
        });
        setEditProfilePreview(pcm.profile_photo ? fileUrl(pcm.profile_photo) : null);
        setEditModal(true);
    };


    const handleEditSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!selectedComMember) return;

        setIsCreating(true);
        setSuccessMsg(null);

        const formData = new FormData();


        Object.entries(editForm).forEach(([key, val]) => {
            if (val === null || val === undefined) return;

            // ✅ 1. FILES: send ONLY if user selected a new file
            if (val instanceof File) {
                formData.append(key, val);
                return;
            }

            // ❌ 2. DO NOT send existing image paths
            if (
                key === "profile_photo"

            ) {
                return;
            }

            // ✅ 3. Normal scalar values
            formData.append(key, String(val));
        });

        formData.append('_method', 'PATCH')



        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/commembers/${selectedComMember.id}`,
                {
                    method: "POST", // Laravel will accept POST+_method=PUT
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                    body: formData,
                }
            );

            const data = await res.json();


            if (!res.ok) {
                alert(data.message || "Failed to create member");
                setIsCreating(false);
                return;
            }

            if (res.ok) {
                // success
                setSuccessMsg("Member has been edited successfully ✅");
                loadPcmembers();

                // auto close modal after short delay
                setTimeout(() => {
                    setEditModal(false);
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

    const fileUrl = (path?: string | null) => {
        if (!path) return "/no-photo.png";
        return `${process.env.NEXT_PUBLIC_IMAGE_BASE_URL}/storage/${path}`;
    };




    return (
        <div className="p-6 bg-base-100">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-xl font-bold">Pastorate Commitee Members</h1>
                <Button onClick={openAdd} >+ Add PC Member</Button>
            </div>
            <table className="table table-zebra w-full  text-center">
                <thead className="bg-[#272757] text-blue-50 px-2 ">
                    <tr >
                        <th >Photo</th>
                        <th >Familly Name</th>
                        <th>First Name</th>
                        <th>Last Name</th>
                        <th>Date of Birth</th>
                        <th>Dt. of Joining</th>
                        <th>Dt.of Leaving</th>
                        <th>Designation</th>
                        <th>Status</th>
                        <th className="text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {pcmembers?.map((pcm) => (
                        <tr key={pcm.id} className="odd:bg-blue-200 even:bg-blue-50">
                            <td>
                                <Image
                                    src={fileUrl(pcm.profile_photo)}
                                    alt="avatar"
                                    width={20}
                                    height={20}
                                    className="w-10 h-10 rounded-full"

                                />
                            </td>
                            <td className="pl-2">{pcm.family_name}</td>
                            <td className="pl-2">{pcm.first_name}</td>
                            <td className="pl-2">{pcm.last_name}</td>
                            <td className="pl-2">{format(pcm.date_of_birth, "dd-MM-yyyy")}</td>
                            <td className="pl-2">{format(pcm.dt_from, "dd-MM-yyyy")}</td>
                            <td className="pl-2">{format(pcm.dt_to, "dd-MM-yyyy")}</td>
                            <td>{pcm.designation}</td>
                            <td>{pcm.status}</td>
                            <td>
                                <Button size="sm" onClick={() => openEdit(pcm)} className="bg-amber-400 text-amber-950 font-bold my-1">
                                    Edit
                                </Button>
                            </td>



                        </tr>
                    ))}

                </tbody>
            </table>

            {/* ------------------ ADD MODAL ------------------ */}
            <Dialog open={addModal} onOpenChange={setAddModal}>
                <DialogContent className="w-[95vw] bg-slate-900 text-white border-slate-700 px-2">
                    <DialogHeader>
                        <DialogTitle>Add Pastorate Committee Member</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto px-6 py-4">
                        <form onSubmit={handleAddSubmit} className="space-y-4">
                            {/* BLUR + LOADING OVERLAY */}
                            {isCreating && (
                                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                                    <div className="text-center">
                                        <div className="animate-spin h-8 w-8 rounded-full border-2 border-white border-t-transparent mx-auto mb-3" />
                                        <p className="text-sm">Creating PC member…</p>
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
                                    <Label>Last Name *</Label>
                                    <Input
                                        required
                                        onChange={(e) =>
                                            setAddForm({ ...addForm, last_name: e.target.value })
                                        }
                                    />
                                </div>
                                <div>
                                    <Label>Date of Birth</Label>
                                    <Input
                                        type="date"

                                        onChange={(e) =>
                                            setAddForm({ ...addForm, date_of_birth: e.target.value })
                                        }
                                    />
                                </div>
                                <div>
                                    <Label>Date of Joining</Label>
                                    <Input
                                        type="date"

                                        onChange={(e) =>
                                            setAddForm({ ...addForm, dt_from: e.target.value })
                                        }
                                    />
                                </div>
                                <div>
                                    <Label>Date of Leaving</Label>
                                    <Input
                                        type="date"

                                        onChange={(e) =>
                                            setAddForm({ ...addForm, dt_to: e.target.value })
                                        }
                                    />
                                </div>
                                <div>
                                    <Label>Designation *</Label>
                                    <select
                                        required
                                        onChange={(e) =>
                                            setAddForm({ ...addForm, designation: e.target.value })
                                        }
                                    >
                                        <option value="">--select desgn--</option>
                                        <option value="secretary">Secretary</option>
                                        <option value="treasurer">Treasurer</option>
                                        <option value="steward">Steward</option>
                                        <option value="prop-secretary">Property Secretary</option>

                                    </select>



                                </div>
                                <div>
                                    <Label>Achivements</Label>
                                    <Input

                                        onChange={(e) =>
                                            setAddForm({ ...addForm, achievements: e.target.value })
                                        }
                                    />
                                </div>


                            </div>
                            <Button type="submit" className="bg-blue-600 text-blue-50">
                                Create Pastorate Comm Member
                            </Button>
                        </form>
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
                                    <p className="text-sm">Updating pc member…</p>
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
                            <DialogTitle>Edit Pastorate Committee Member </DialogTitle>
                        </div>
                        <div className="max-h-[65vh] overflow-y-auto px-6 py-4 space-y-6">
                            <div className="flex flex-col items-center space-y-4">
                                <div className="flex flex-col items-center mx-auto">
                                    <Label>Profile Photo</Label>
                                    {(editProfilePreview || editForm.profile_photo) && (
                                        <img
                                            src={
                                                editProfilePreview ||
                                                fileUrl(editForm.profile_photo as string)
                                            }
                                            className="w-40 h-40 object-cover rounded-2xl mb-2"
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

                                <div className="flex flex-col space-y-0.5 w-full">
                                    <label className="text-amber-400">Family Name</label>
                                    <Input
                                        placeholder="Name *"
                                        value={editForm.family_name || ""}
                                        onChange={(e) => setEditForm({ ...editForm, family_name: e.target.value })}
                                    />
                                </div>
                                <div className="flex flex-col space-y-0.5 w-full">
                                    <label className="text-amber-400">First Name</label>
                                    <Input
                                        placeholder="Name *"
                                        value={editForm.first_name || ""}
                                        onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                                    />
                                </div>
                                <div className="flex flex-col space-y-0.5 w-full">
                                    <label className="text-amber-400">Last Name</label>
                                    <Input
                                        placeholder="Name *"
                                        value={editForm.last_name || ""}
                                        onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                                    />
                                </div>
                                <div className="flex flex-col space-y-0.5 w-full">
                                    <Label className="text-amber-400 ">Date of Birth*<p>{editForm.date_of_joining}</p></Label>
                                    <Input
                                        type="date"
                                        value={editForm.date_of_birth}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, date_of_birth: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="flex flex-col space-y-0.5 w-full">
                                    <Label className="text-amber-400 ">Date of Joining*<p>{editForm.date_of_joining}</p></Label>
                                    <Input
                                        type="date"
                                        value={editForm.dt_from}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, dt_from: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="flex flex-col space-y-0.5 w-full">
                                    <Label className="text-amber-400 ">Date of leaving*<p>{editForm.date_of_joining}</p></Label>
                                    <Input
                                        type="date"
                                        value={editForm.dt_to}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, dt_to: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="flex flex-col space-y-0.5 w-full">
                                    <label className="text-amber-400">Designation</label>
                                    <Input
                                        placeholder="Designation"
                                        value={editForm.designation || ""}
                                        onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                                    />
                                </div>
                                <div className="flex flex-col space-y-0.5 w-full">
                                    <label className="text-amber-400">Achievements</label>
                                    <Input
                                        placeholder="Qualifications"
                                        value={editForm.achievements || ""}
                                        onChange={(e) => setEditForm({ ...editForm, achievements: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label>Status</Label>
                                    <select
                                        value={editForm.status}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, status: e.target.value })
                                        }
                                    >

                                        <option value="in">in</option>
                                        <option value="out">out</option>


                                    </select>



                                </div>


                            </div>
                        </div>
                        <button type="submit" className="w-full  p-2 bg-amber-900 text-amber-50">
                            Update Pastor
                        </button>
                    </form>
                </DialogContent>
            </Dialog>

        </div>
    )
}

