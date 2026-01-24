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

interface Pastor {
    id: number;
    name: string;
    designation: string;
    qualifications: string;
    date_of_joining: Date;
    date_of_leaving: Date;
    past_service_description: string;
    photo: string;
    order_no: number;
    created_at: Date;
    updated_at: Date;
}

export default function PastrsPage() {
    const { token, isAdmin } = useAuth();
    const router = useRouter();

    const [pastors, setPastors] = useState<Pastor[]>([]);
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

    const [selectedPastor, setSelectedPastor] = useState<Pastor | null>(null);
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

        loadPastors();

    }, [token]);




    const loadPastors = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/pastors`, {
                method: "GET",
                headers: {

                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });

            const json = await res.json();
            console.log(json)
            setPastors(Array.isArray(json.data?.data) ? json.data.data : []);


        } catch {
            alert("Unable to load pastors");
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
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/pastors`, {
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
                loadPastors();

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



    const openEdit = (pastor: Pastor) => {
        setSelectedPastor(pastor);
        setEditForm({
            ...pastor,
            date_of_joining: toDateInput(pastor.date_of_joining),
            date_of_leaving: toDateInput(pastor.date_of_leaving),
        });
        setEditProfilePreview(pastor.photo ? fileUrl(pastor.photo) : null);
        setEditModal(true);
    };


    const handleEditSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!selectedPastor) return;

        setIsCreating(true);
        setSuccessMsg(null);

        const formData = new FormData();



        Object.entries(editForm).forEach(([key, val]) => {
            if (val === null || val === undefined) return;

            // files
            if (val instanceof File) {
                formData.append(key, val);
                return;
            }

            // skip readonly fields
            if (["id", "created_at", "updated_at"].includes(key)) return;



            if (val instanceof File) {
                formData.append(key, val);
            } else if (typeof val === "string" || typeof val === "number") {
                // DO NOT send existing photo path as profile_photo
                if (key === "photo") return;
                formData.append(key, String(val));
            }

            // always send strings/numbers
            formData.append(key, String(val));
        });

        formData.append('_method', 'PATCH')



        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/pastors/${selectedPastor.id}`,
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
            console.log(data)

            if (!res.ok) {
                alert(data.message || "Failed to create member");
                setIsCreating(false);
                return;
            }

            if (res.ok) {
                // success
                setSuccessMsg("Member has been edited successfully ✅");
                loadPastors();

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
                <h1 className="text-xl font-bold">Pastors</h1>
                <Button onClick={openAdd} >+ Add Pastor</Button>
            </div>
            <table className="table table-zebra w-full  text-center">
                <thead className="bg-[#272757] text-blue-50 px-2 ">
                    <tr >
                        <th >Photo</th>
                        <th >Name</th>
                        <th>Designation</th>
                        <th>Qualifications</th>
                        <th>Dt. of Joining</th>
                        <th>Dt.of Leaving</th>
                        <th>About</th>
                        <th>order no</th>
                        <th className="text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {pastors?.map((pastor) => (
                        <tr key={pastor.id} className="odd:bg-blue-200 even:bg-blue-50">
                            <td>
                                <Image
                                    src={fileUrl(pastor.photo)}
                                    alt="avatar"
                                    width={20}
                                    height={20}
                                    className="w-10 h-10 rounded-full"

                                />
                            </td>
                            <td className="pl-2">{pastor.name}</td>
                            <td className="pl-2">{pastor.designation}</td>
                            <td>{pastor.qualifications}</td>
                            <td>{format(pastor.date_of_joining, "dd-MM-yyyy")}</td>
                            <td>{pastor.date_of_leaving && format(pastor.date_of_leaving, "dd-MM-yyyy")}</td>
                            <td className="w-96"><Textarea value={pastor.past_service_description} /></td>
                            <td>{pastor.order_no}</td>
                            <td>
                                <Button size="sm" onClick={() => openEdit(pastor)} className="bg-amber-400 text-amber-950 font-bold my-1">
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
                        <DialogTitle>Add Member</DialogTitle>
                    </DialogHeader>
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
                                    setAddForm({ ...addForm, photo: file });
                                    setAddProfilePreview(URL.createObjectURL(file));
                                }}
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label>Name *</Label>
                                    <Input
                                        required
                                        onChange={(e) =>
                                            setAddForm({ ...addForm, name: e.target.value })
                                        }
                                    />
                                </div>
                                <div>
                                    <Label>Designation *</Label>
                                    <Input
                                        required
                                        onChange={(e) =>
                                            setAddForm({ ...addForm, designation: e.target.value })
                                        }
                                    />
                                </div>
                                <div>
                                    <Label>Qualifications *</Label>
                                    <Input
                                        required
                                        onChange={(e) =>
                                            setAddForm({ ...addForm, qualifications: e.target.value })
                                        }
                                    />
                                </div>
                                <div>
                                    <Label>Date of Joining</Label>
                                    <Input
                                        type="date"

                                        onChange={(e) =>
                                            setAddForm({ ...addForm, date_of_joining: e.target.value })
                                        }
                                    />
                                </div>
                                <div>
                                    <Label>Date of Leaving</Label>
                                    <Input
                                        type="date"

                                        onChange={(e) =>
                                            setAddForm({ ...addForm, date_of_leaving: e.target.value })
                                        }
                                    />
                                </div>
                                <div>
                                    <Label>About </Label>
                                    <Textarea

                                        onChange={(e) =>
                                            setAddForm({ ...addForm, past_service_description: e.target.value })
                                        }
                                    >

                                    </Textarea>

                                </div>
                                <div>
                                    <Label>Order No</Label>
                                    <Input
                                        type="number"

                                        onChange={(e) =>
                                            setAddForm({ ...addForm, order_no: e.target.value })
                                        }
                                    />
                                </div>
                            </div>
                            <Button type="submit" className="bg-blue-600 text-blue-50">
                                Create Pastor
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
                            <DialogTitle>Edit Pastor </DialogTitle>
                        </div>
                        <div className="max-h-[65vh] overflow-y-auto px-6 py-4 space-y-6">
                            <div className="flex flex-col items-center space-y-4">
                                <div className="flex flex-col items-center mx-auto">
                                    <Label>Profile Photo</Label>
                                    {(editProfilePreview || editForm.profile_photo) && (
                                        <img
                                            src={
                                                editProfilePreview ||
                                                fileUrl(editForm.photo as string)
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
                                            setEditForm({ ...editForm, photo: file });
                                            setEditProfilePreview(URL.createObjectURL(file));
                                        }}
                                    />
                                </div>

                                <div className="flex flex-col space-y-0.5 w-full">
                                    <label className="text-amber-400">Name</label>
                                    <Input
                                        placeholder="Name *"
                                        value={editForm.name || ""}
                                        onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
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
                                    <label className="text-amber-400">Qualifications</label>
                                    <Input
                                        placeholder="Qualifications"
                                        value={editForm.qualifications || ""}
                                        onChange={(e) => setEditForm({ ...editForm, qualifications: e.target.value })}
                                    />
                                </div>
                                <div className="flex flex-col  space-y-0.5 w-full">
                                    <label className="text-amber-400">About pastor</label>

                                    <Textarea
                                        placeholder="About pasto"
                                        value={editForm.past_service_description || ""}
                                        onChange={(e) => setEditForm({ ...editForm, past_service_description: e.target.value })}
                                    >

                                    </Textarea>

                                </div>
                                <div className="flex flex-col space-y-0.5 w-full">
                                    <Label className="text-amber-400 ">Date of Joining*<p>{editForm.date_of_joining}</p></Label>
                                    <Input
                                        type="date"
                                        value={editForm.date_of_joining}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, date_of_joining: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="flex flex-col space-y-0.5 w-full">
                                    <Label className="text-amber-400 w-full">Date of Leaving*<p>{editForm.date_of_leaving}</p></Label>
                                    <Input
                                        type="date"
                                        value={editForm.date_of_leaving}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, date_of_leaving: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="flex flex-col space-y-0.5 w-full">
                                    <Label className="text-amber-400 w-full">Order No</Label>
                                    <Input
                                        type="number"
                                        value={editForm.order_no}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, order_no: e.target.value })
                                        }
                                    />
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

