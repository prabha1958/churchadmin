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

import { Spinner } from "@/components/ui/spinner"

interface PoorFeeding {
    id: number;
    date_of_event: string;
    sponsored_by: number;
    brief_description: string;
    no_of_persons_fed: number;
    event_photos: string[]; // 👈 JSON array
    published: boolean;
    created_at: string;
    updated_at: string;
    sponsor: {
        family_name: string;
        first_name: string;
        last_name: string;
    }
}

export default function EventsPage() {
    const { token, isAdmin } = useAuth();
    const router = useRouter();

    const [pfeedings, setPfeedings] = useState<PoorFeeding[]>([]);
    const [loading, setLoading] = useState(false);
    const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

    const [viewModal, setViewModal] = useState(false);
    const [editModal, setEditModal] = useState(false);
    const [addModal, setAddModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [addForm, setAddForm] = useState<any>({});
    const [addProfilePreview, setAddProfilePreview] = useState<string | null>(
        null
    );

    const [selectedPfeeding, setSelectedPfeeding] = useState<PoorFeeding | null>(null);
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

        loadPfeedings();

    }, [token]);

    useEffect(() => {
        return () => {
            photoPreviews.forEach((url) => URL.revokeObjectURL(url));
        };
    }, []);

    const loadPfeedings = async () => {
        try {
            setLoading(true);
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/poor-feedings`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                }
            );

            const json = await res.json();
            setPfeedings(Array.isArray(json.data.data) ? json.data.data : []);
            console.log(json.data.data)

        } catch {
            alert("Unable to load events");
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
            if (!val) return;

            if (key === "event_photos" && Array.isArray(val)) {
                val.forEach((file: File) =>
                    formData.append("event_photos[]", file)
                );
            } else {
                formData.append(key, String(val));
            }
        });



        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/poor-feedings`, {
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
                loadPfeedings();

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



    const openEdit = (pf: PoorFeeding) => {
        setSelectedPfeeding(pf);
        setEditForm({
            ...pf,
            date: toDateInput(pf.date_of_event),

        });

        setEditModal(true);
    };

    const handleEditSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!selectedPfeeding) return;

        setIsCreating(true);
        setSuccessMsg(null);

        const formData = new FormData();


        Object.entries(editForm).forEach(([key, val]) => {
            if (!val) return;

            // ✅ Send ONLY new photos as files
            if (key === "new_photos" && Array.isArray(val)) {
                val.forEach((file: File) =>
                    formData.append("event_photos[]", file)
                );
                return;
            }

            // ❌ DO NOT send event_photos paths again
            if (key === "event_photos") return;

            // ✅ Scalars only
            formData.append(key, String(val));
        });


        if (editForm.new_photos?.length) {
            editForm.new_photos.forEach((file: File) => {
                formData.append("event_photos[]", file);
            });

            // 🔑 THIS IS THE KEY
            formData.append("append_photos", "1");
        }

        formData.append('_method', 'PATCH')

        try {

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/poor-feedings/${selectedPfeeding.id}`,
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
                alert(data.message || "Failed to update event");
                setIsCreating(false);
                return;
            }

            if (res.ok) {
                // success
                setSuccessMsg("Event has been edited successfully ✅");
                loadPfeedings();

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



    const handlHideSubmit = async (id: any) => {

        const confirmed = window.confirm(
            "Are you sure you want to hide this event?\nThis will notify members."
        );

        if (!confirmed) return;
        setIsCreating(true);
        setSuccessMsg(null);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/poor-feedings/${id}/hide`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },

            });

            const data = await res.json();


            if (!res.ok) {
                alert(data.message || "Failed to update message");
                setIsCreating(false);
                return;
            }

            if (res.ok) {
                // success
                setSuccessMsg("Message updated successfully ✅");
                loadPfeedings();

                // auto close modal after short delay
                setTimeout(() => {
                    setAddModal(false);
                    setSuccessMsg(null);
                }, 1500);
            } else {
                alert(data.message || "Error updating member");
            }
        } catch (err) {
            alert("Network error");
        } finally {
            setIsCreating(false);
        }
    };


    const handleShowSubmit = async (id: any) => {

        const confirmed = window.confirm(
            "Are you sure you want to show this event?\nThis will notify members."
        );

        if (!confirmed) return;
        setIsCreating(true);
        setSuccessMsg(null);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/poor-feedings/${id}/show`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },

            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.message || "Failed to update message");
                setIsCreating(false);
                return;
            }

            if (res.ok) {
                // success
                setSuccessMsg("Message updated successfully ✅");
                loadPfeedings();

                // auto close modal after short delay
                setTimeout(() => {
                    setAddModal(false);
                    setSuccessMsg(null);
                }, 1500);
            } else {
                alert(data.message || "Error updating member");
            }
        } catch (err) {
            alert("Network error");
        } finally {
            setIsCreating(false);
        }
    };

    const removePreview = (index: number) => {
        const newFiles = [...(addForm.event_photos ?? [])];
        const newPreviews = [...photoPreviews];

        newFiles.splice(index, 1);
        newPreviews.splice(index, 1);

        setAddForm({
            ...addForm,
            event_photos: newFiles,
        });
        setPhotoPreviews(newPreviews);

    };


    const removePhoto = async (path: string) => {
        await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/poor-feedings/${selectedPfeeding?.id}/photo`,
            {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({ photo_path: path }),
            }
        );

        loadPfeedings();
    };



    const fileUrl = (path?: string) =>
        path
            ? `${process.env.NEXT_PUBLIC_IMAGE_BASE_URL}/storage/${path}`
            : "/no-photo.png";



    return (
        <div className="p-6 bg-base-100">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-xl font-bold">Poor Feeding</h1>
                <Button onClick={openAdd} >+ Add Event</Button>
            </div>
            <table className="table table-zebra w-full  text-center">
                <thead className="bg-[#272757] text-blue-50 px-2 ">
                    <tr >
                        <th >Event Id</th>
                        <th >Date of event</th>
                        <th >Sponsored By</th>
                        <th>Description</th>
                        <th>No of persons fed</th>
                        <th>Event Photo</th>
                        <th colSpan={2}>Actions</th>

                    </tr>
                </thead>
                <tbody className="text-blue-950">
                    {pfeedings?.map((pf) => (
                        <tr key={pf.id} className="odd:bg-blue-200 even:bg-blue-50">
                            <td>{pf.id}</td>
                            <td className="pl-2">{format(pf.date_of_event, "dd-MM-yyyy")}</td>
                            <td className="pl-2">{pf.sponsor.family_name} {pf.sponsor.first_name} {pf.sponsor.last_name}</td>
                            <td className="w-96"><Textarea value={pf.brief_description} /> </td>
                            <td className="pl-2">{pf.no_of_persons_fed}</td>
                            <td className="pl-2">{pf.event_photos.length}</td>
                            <td>{pf.published
                                ? <button onClick={() => handlHideSubmit(pf.id)} className="bg-green-600 text-amber-50 font-bold my-1 px-2 py-1 rounded-xl">Hide</button>
                                : <button onClick={() => handleShowSubmit(pf.id)} className="bg-red-600 text-amber-50 font-bold my-1 px-2 py-1 rounded-xl">Show</button>
                            }


                            </td>


                            <td>
                                <Button size="sm" onClick={() => openEdit(pf)} className="bg-amber-400 text-amber-950 font-bold my-1">
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
                        <DialogTitle>Add Poorfeeding Event</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto px-6 py-4">
                        <form onSubmit={handleAddSubmit} className="space-y-4">
                            {/* BLUR + LOADING OVERLAY */}
                            {isCreating && (
                                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                                    <div className="text-center">
                                        <div className="animate-spin h-8 w-8 rounded-full border-2 border-white border-t-transparent mx-auto mb-3" />
                                        <p className="text-sm">Creating Event…</p>
                                    </div>
                                </div>
                            )}
                            {/* SUCCESS MESSAGE */}
                            {successMsg && (
                                <div className="bg-green-600/20 border border-green-500 text-green-300 px-4 py-2 text-sm">
                                    {successMsg}
                                </div>
                            )}

                            <Label>Upload Pictures</Label>
                            {photoPreviews.length > 0 && (
                                <div className="grid grid-cols-4 gap-3 mt-4">
                                    {photoPreviews.map((src, idx) => (
                                        <div key={idx} className="relative group">
                                            <img
                                                src={src}
                                                alt="preview"
                                                className="h-28 w-full object-cover rounded-lg border border-slate-700"
                                            />

                                            {/* Remove button */}
                                            <button
                                                type="button"
                                                onClick={() => removePreview(idx)}
                                                className="
                                                            absolute top-1 right-1
                                                            bg-red-600 text-white
                                                            text-xs px-2 py-0.5
                                                            rounded opacity-0 group-hover:opacity-100
                                                        "
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}


                            <Input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={(e) => {
                                    const newFiles = Array.from(e.target.files ?? []);

                                    // existing files
                                    const existingFiles: File[] = addForm.event_photos ?? [];
                                    const existingPreviews: string[] = photoPreviews ?? [];

                                    // total count check
                                    if (existingFiles.length + newFiles.length > 6) {
                                        alert("Maximum 6 photos allowed");
                                        e.target.value = ""; // reset input
                                        return;
                                    }

                                    // append files
                                    const combinedFiles = [...existingFiles, ...newFiles];
                                    const combinedPreviews = [
                                        ...existingPreviews,
                                        ...newFiles.map((file) => URL.createObjectURL(file)),
                                    ];

                                    setAddForm({
                                        ...addForm,
                                        event_photos: combinedFiles,
                                    });

                                    setPhotoPreviews(combinedPreviews);

                                    e.target.value = ""; // allow selecting same file again
                                }}
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label>Date of event</Label>
                                    <Input
                                        type="date"

                                        onChange={(e) =>
                                            setAddForm({ ...addForm, date_of_event: e.target.value })
                                        }
                                    />
                                </div>
                                <div>
                                    <Label>Sponsored By</Label>
                                    <Input
                                        required
                                        onChange={(e) =>
                                            setAddForm({ ...addForm, sponsored_by: e.target.value })
                                        }
                                    />
                                </div>
                                <div>
                                    <Label>Description *</Label>
                                    <Textarea

                                        onChange={(e) =>
                                            setAddForm({ ...addForm, brief_description: e.target.value })
                                        }
                                    >

                                    </Textarea>
                                </div>
                                <div>
                                    <Label>No of persons fed</Label>
                                    <Input
                                        required
                                        onChange={(e) =>
                                            setAddForm({ ...addForm, no_of_persons_fed: e.target.value })
                                        }
                                    />
                                </div>


                            </div>
                            <Button type="submit" className="bg-blue-600 text-blue-50">
                                Create Event
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
                                    <p className="text-sm">Updating Event…</p>
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
                            <DialogTitle>Edit Event </DialogTitle>
                        </div>
                        <div className="max-h-[65vh] overflow-y-auto px-6 py-4 space-y-6">
                            <div className="flex flex-col items-center space-y-4">
                                <div className="flex flex-col items-center mx-auto">
                                    <Label>Event Photos</Label>
                                    <div className="grid grid-cols-4 gap-3">
                                        {editForm.event_photos?.map((path: string) => (
                                            <div key={path} className="relative">
                                                <Image
                                                    src={`${process.env.NEXT_PUBLIC_IMAGE_BASE_URL}/storage/${path}`}
                                                    width={120}
                                                    height={120}
                                                    className="rounded"
                                                    alt=""
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removePhoto(path)}
                                                    className="absolute top-1 right-1 bg-red-600 text-white text-xs px-1 rounded"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>


                                    {photoPreviews.length > 0 && (
                                        <div className="grid grid-cols-4 gap-3 mt-4">
                                            {photoPreviews.map((src, idx) => (
                                                <div key={idx} className="relative group">
                                                    <img
                                                        src={src}
                                                        alt="preview"
                                                        className="h-28 w-full object-cover rounded-lg border border-slate-700"
                                                    />

                                                    {/* Remove button */}
                                                    <button
                                                        type="button"
                                                        onClick={() => removePreview(idx)}
                                                        className="
                                                            absolute top-1 right-1
                                                            bg-red-600 text-white
                                                            text-xs px-2 py-0.5
                                                            rounded opacity-0 group-hover:opacity-100
                                                        "
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}


                                    <Input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={(e) => {
                                            const newFiles = Array.from(e.target.files ?? []);

                                            const existingCount = editForm.event_photos?.length ?? 0;
                                            const currentNew = editForm.new_photos ?? [];

                                            if (existingCount + currentNew.length + newFiles.length > 6) {
                                                alert("Maximum 6 photos allowed");
                                                e.target.value = "";
                                                return;
                                            }

                                            setEditForm({
                                                ...editForm,
                                                new_photos: [...currentNew, ...newFiles],
                                            });

                                            setPhotoPreviews([
                                                ...photoPreviews,
                                                ...newFiles.map((f) => URL.createObjectURL(f)),
                                            ]);

                                            e.target.value = "";
                                        }}
                                    />
                                </div>

                                <div className="flex flex-col space-y-0.5 w-full">
                                    <Label className="text-amber-400 ">Date of Event</Label>
                                    <Input

                                        value={editForm.date_of_event}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, date_of_event: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="flex flex-col space-y-0.5 w-full">
                                    <label className="text-amber-400">Sponsored By</label>
                                    <Input
                                        placeholder="Title"
                                        value={editForm.sponsored_by || ""}
                                        onChange={(e) => setEditForm({ ...editForm, sponsored_by: e.target.value })}
                                    />
                                </div>

                                <div className="flex flex-col  space-y-0.5 w-full">
                                    <label className="text-amber-400">Description</label>

                                    <Textarea
                                        placeholder="Description of announcement"
                                        value={editForm.brief_description || ""}
                                        onChange={(e) => setEditForm({ ...editForm, brief_description: e.target.value })}
                                    >

                                    </Textarea>

                                </div>
                                <div className="flex flex-col space-y-0.5 w-full">
                                    <label className="text-amber-400">No of persons fed</label>
                                    <Input
                                        placeholder="no of persons fed"
                                        value={editForm.no_of_persons_fed || ""}
                                        onChange={(e) => setEditForm({ ...editForm, no_persons_fed: e.target.value })}
                                    />
                                </div>

                            </div>
                        </div>
                        <button type="submit" className="w-full  p-2 bg-amber-900 text-amber-50">
                            Update event
                        </button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}

