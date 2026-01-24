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

interface Announcement {
    id: number;
    date: Date;
    picture: string;
    title: string;
    description: string;
    exp_date: Date;
    published: boolean;
    created_at: Date;
    updated_at: Date;
}

export default function PastrsPage() {
    const { token, isAdmin } = useAuth();
    const router = useRouter();

    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
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

    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
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

        loadAnnouncements();

    }, [token]);


    const loadAnnouncements = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/announcements`, {
                method: "GET",
                headers: {

                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });

            const json = await res.json();
            console.log(json)
            setAnnouncements(Array.isArray(json.data?.data) ? json.data.data : []);


        } catch {
            alert("Unable to load announcements");
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
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/announcements`, {
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
                setSuccessMsg("Announcement created successfully ✅");
                loadAnnouncements();

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



    const openEdit = (ann: Announcement) => {
        setSelectedAnnouncement(ann);
        setEditForm({
            ...ann,
            date: toDateInput(ann.date),
            exp_date: toDateInput(ann.exp_date),
        });
        setEditProfilePreview(ann.picture ? fileUrl(ann.picture) : null);
        setEditModal(true);
    };

    const handleEditSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!selectedAnnouncement) return;

        setIsCreating(true);
        setSuccessMsg(null);

        const formData = new FormData();



        Object.entries(editForm).forEach(([key, val]) => {
            if (val === null || val === undefined) return;

            // ✅ Picture: only send if it's a File
            if (key === "picture") {
                if (val instanceof File) {
                    formData.append(key, val);
                }
                return; // ⛔ skip string picture paths
            }

            // ✅ All other fields
            if (val instanceof File) {
                formData.append(key, val);
            } else {
                formData.append(key, String(val));
            }
        });

        formData.append('_method', 'PATCH')



        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/announcements/${selectedAnnouncement.id}`,
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
                alert(data.message || "Failed to create announcement");
                setIsCreating(false);
                return;
            }

            if (res.ok) {
                // success
                setSuccessMsg("Member has been edited successfully ✅");
                loadAnnouncements();

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
                <h1 className="text-xl font-bold">Announcements</h1>
                <Button onClick={openAdd} >+ Add Announcement</Button>
            </div>
            <table className="table table-zebra w-full  text-center">
                <thead className="bg-[#272757] text-blue-50 px-2 ">
                    <tr >
                        <th >Photo</th>
                        <th >Date</th>
                        <th>Description</th>
                        <th>Exp_date</th>
                        <th>Published</th>

                        <th className="text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="text-blue-950">
                    {announcements?.map((ann) => (
                        <tr key={ann.id} className="odd:bg-blue-200 even:bg-blue-50">
                            <td>
                                <Image
                                    src={fileUrl(ann.picture)}
                                    alt="avatar"
                                    width={20}
                                    height={20}
                                    className="w-10 h-10 rounded-full"

                                />
                            </td>
                            <td className="pl-2">{format(ann.date, "dd-MM-yyyy")}</td>
                            <td className="w-96"><Textarea value={ann.description} /> </td>
                            <td className="pl-2">{format(ann.exp_date, "dd-MM-yyyy")}</td>
                            <td>{ann.published ? "published" : "to approve"}</td>
                            <td>
                                <Button size="sm" onClick={() => openEdit(ann)} className="bg-amber-400 text-amber-950 font-bold my-1">
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
                        <DialogTitle>Add Announcement</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto px-6 py-4">
                        <form onSubmit={handleAddSubmit} className="space-y-4">
                            {/* BLUR + LOADING OVERLAY */}
                            {isCreating && (
                                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                                    <div className="text-center">
                                        <div className="animate-spin h-8 w-8 rounded-full border-2 border-white border-t-transparent mx-auto mb-3" />
                                        <p className="text-sm">Creating Announcement…</p>
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
                            <Label> Picture</Label>
                            <Input
                                type="file"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    setAddForm({ ...addForm, picture: file });
                                    setAddProfilePreview(URL.createObjectURL(file));
                                }}
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label>Date of Announcement</Label>
                                    <Input
                                        type="date"

                                        onChange={(e) =>
                                            setAddForm({ ...addForm, date: e.target.value })
                                        }
                                    />
                                </div>
                                <div>
                                    <Label>Title*</Label>
                                    <Input
                                        required
                                        onChange={(e) =>
                                            setAddForm({ ...addForm, title: e.target.value })
                                        }
                                    />
                                </div>
                                <div>
                                    <Label>Description *</Label>
                                    <Textarea

                                        onChange={(e) =>
                                            setAddForm({ ...addForm, description: e.target.value })
                                        }
                                    >

                                    </Textarea>
                                </div>
                                <div>
                                    <Label>Expiry Date *</Label>
                                    <Input
                                        type="date"

                                        onChange={(e) =>
                                            setAddForm({ ...addForm, exp_date: e.target.value })
                                        }
                                    />
                                </div>
                                <div>
                                    <Label>Published</Label>
                                    <Input
                                        type="number"

                                        onChange={(e) =>
                                            setAddForm({ ...addForm, published: e.target.value })
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
                                    <p className="text-sm">Updating announcement…</p>
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
                            <DialogTitle>Edit Announcement </DialogTitle>
                        </div>
                        <div className="max-h-[65vh] overflow-y-auto px-6 py-4 space-y-6">
                            <div className="flex flex-col items-center space-y-4">
                                <div className="flex flex-col items-center mx-auto">
                                    <Label>Profile Photo</Label>
                                    {(editProfilePreview || editForm.profile_photo) && (
                                        <img
                                            src={
                                                editProfilePreview ||
                                                fileUrl(editForm.picture as string)
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
                                            setEditForm({ ...editForm, picture: file });
                                            setEditProfilePreview(URL.createObjectURL(file));
                                        }}
                                    />
                                </div>

                                <div className="flex flex-col space-y-0.5 w-full">
                                    <Label className="text-amber-400 ">Date of Announcement*</Label>
                                    <Input

                                        value={editForm.date}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, date: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="flex flex-col space-y-0.5 w-full">
                                    <label className="text-amber-400">Title</label>
                                    <Input
                                        placeholder="Title"
                                        value={editForm.title || ""}
                                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                    />
                                </div>

                                <div className="flex flex-col  space-y-0.5 w-full">
                                    <label className="text-amber-400">Description</label>

                                    <Textarea
                                        placeholder="Description of announcement"
                                        value={editForm.description || ""}
                                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    >

                                    </Textarea>

                                </div>
                                <div className="flex flex-col space-y-0.5 w-full">
                                    <Label className="text-amber-400 ">Date of expiry*</Label>
                                    <Input

                                        value={editForm.exp_date}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, exp_date: e.target.value })
                                        }
                                    />
                                </div>



                            </div>
                        </div>
                        <button type="submit" className="w-full  p-2 bg-amber-900 text-amber-50">
                            Update Announcement
                        </button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}

