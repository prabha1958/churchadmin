'use client';

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


import { Spinner } from "@/components/ui/spinner"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Timestamp } from "next/dist/server/lib/cache-handlers/types";



type Message = {
    id: number;
    member_id?: number;
    title?: string;
    body?: string;
    image_path?: string;
    message_type: string;
    is_published: boolean;
    published_at: Timestamp;
    from: string;
    from_name: string;
};

type EditForm = {
    title: string;
    body: string;
    image: File | null;        // NEW upload
    existingImage?: string;   // EXISTING image path
};

export default function AdminMessagesPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [showModal, setShowModal] = useState(false);
    const { token, isAdmin } = useAuth();
    const router = useRouter();
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
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

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

        loadMessages();

    }, [token]);


    const loadMessages = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/messages`, {
                method: "GET",
                headers: {

                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });

            const json = await res.json();
            console.log(json)
            setMessages(json.data);


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
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/messages`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.message || "Failed to create message");
                setIsCreating(false);
                return;
            }

            if (res.ok) {
                // success
                setSuccessMsg("Message created successfully ✅");
                loadMessages();

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


    const handlSendSubmit = async (id: any) => {

        const confirmed = window.confirm(
            "Are you sure you want to publish this message?\nThis will notify members."
        );

        if (!confirmed) return;
        setIsCreating(true);
        setSuccessMsg(null);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/messages/${id}/send`, {
                method: "POST",
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
                loadMessages();

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




    const openEdit = (msg: Message) => {
        setSelectedMessage(msg);
        setEditForm(msg)
        setEditProfilePreview(msg.image_path ? fileUrl(msg.image_path) : null);
        setEditModal(true);
    };

    const submitEdit = async () => {
        if (!selectedMessage) return;

        const formData = new FormData();
        formData.append("title", editForm.title);
        formData.append("body", editForm.body);

        if (editForm.image_path) {
            formData.append("image_path", editForm.image_path);
        }

        await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/messages/${selectedMessage.id}/update`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
            },
            body: formData,
        });

        setEditModal(false);
        loadMessages();
    };






    const fileUrl = (path?: string | null) => {
        if (!path) return "/no-photo.png";
        return `${process.env.NEXT_PUBLIC_IMAGE_BASE_URL}/storage/${path}`;
    };


    return (
        <div className="p-6 bg-base-100">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-xl font-bold">Announcements</h1>
                <Button onClick={openAdd} >+ Create Message</Button>
            </div>
            <table className="table table-zebra w-full  text-center text-blue-900">
                <thead className="bg-[#272757] text-blue-50 px-2 ">
                    <tr >
                        <th >Id</th>
                        <th >Image</th>
                        <td>Member_id</td>
                        <th >Title</th>
                        <th>Message Body</th>
                        <th>Message Type</th>
                        <th>Sent on</th>


                        <th colSpan={2} className="text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>

                    {messages?.map((msg) => (
                        <tr key={msg.id} className="odd:bg-blue-200 even:bg-blue-50">
                            <td className="pl-2">{msg.id}</td>
                            <td>
                                <Image
                                    src={fileUrl(msg.image_path)}
                                    alt="avatar"
                                    width={20}
                                    height={20}
                                    className="w-10 h-10 rounded-full"

                                />
                            </td>
                            <td className="pl-2">{msg.member_id}</td>
                            <td className="pl-2">{msg.title}</td>
                            <td className="w-96"><Textarea value={msg.body} onChange={() => { }} /></td>
                            <td className="pl-2">{msg.message_type}</td>
                            <td className="pl-2">{msg.published_at ? format(msg.published_at, "dd-MM-yyyy") : ""}</td>
                            <td>
                                {!msg.is_published &&
                                    <Button onClick={() => openEdit(msg)} size="sm" className="bg-amber-400 text-amber-950 font-bold my-1">
                                        Edit
                                    </Button>
                                }

                            </td>
                            <td>
                                {isCreating &&
                                    <Button type="submit" size="sm" className="bg-green-400 text-amber-950 font-bold my-1 ml-1">
                                        <Spinner /> updating
                                    </Button>
                                }
                                {!isCreating && !msg.published_at &&
                                    <Button type="submit" onClick={() => handlSendSubmit(msg.id)} size="sm" className="bg-green-400 text-amber-950 font-bold my-1 ml-1">
                                        Send
                                    </Button>
                                }

                                {!isCreating && msg.published_at &&
                                    <p>Published</p>
                                }
                            </td>





                        </tr>
                    ))}
                </tbody>

            </table>

            {/* ------------------ ADD MODAL ------------------ */}
            <Dialog open={addModal} onOpenChange={setAddModal}>
                <DialogContent className="w-[95vw] bg-slate-900 text-white border-slate-700 px-2">
                    <DialogHeader>
                        <DialogTitle>Add Message</DialogTitle>
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
                            <Label> Upload Image (optional)</Label>
                            <Input
                                type="file"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    setAddForm({ ...addForm, image_path: file });
                                    setAddProfilePreview(URL.createObjectURL(file));
                                }}
                            />
                            <Label> Message type</Label>

                            <select onChange={(e) => {
                                setAddForm({ ...addForm, message_type: e.target.value })
                            }}>
                                <option>general</option>
                                <option>general</option>

                            </select>


                            <Label>Message Title</Label>
                            <input
                                className=" border border-blue-100"
                                onChange={(e) => {
                                    setAddForm({ ...addForm, title: e.target.value })
                                }}
                            />
                            <Label>Message Body</Label>
                            <Textarea onChange={(e) => {
                                setAddForm({ ...addForm, body: e.target.value })
                            }}>

                            </Textarea>

                            <Label>Message From</Label>
                            <input
                                className=" border border-blue-100 w-60"
                                onChange={(e) => {
                                    setAddForm({ ...addForm, from: e.target.value })
                                }}
                            />
                            <Label>Message by</Label>
                            <input
                                className=" border border-blue-100 w-60"
                                onChange={(e) => {
                                    setAddForm({ ...addForm, from_name: e.target.value })
                                }}
                            />
                            <button type="submit" className="w-full  p-2 bg-green-900 text-green-50">
                                CreateMessage
                            </button>
                        </form>
                    </div>
                </DialogContent>
            </Dialog>
            {/* ------------------ EDIT MODAL ------------------ */}
            <Dialog open={editModal} onOpenChange={setEditModal}>
                <DialogContent className="w-[95vw] bg-slate-900 text-white border-slate-700 px-2">
                    <DialogHeader>
                        <DialogTitle>Edit Message</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto px-6 py-4">
                        <form onSubmit={submitEdit} className="space-y-4">
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

                            <div className="flex flex-col items-center mx-auto">
                                <Label>Image </Label>
                                {(editProfilePreview || editForm.image_path) && (
                                    <img
                                        src={
                                            editProfilePreview ||
                                            fileUrl(editForm.image_path as string)
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
                                        setEditForm({ ...editForm, image_path: file });
                                        setEditProfilePreview(URL.createObjectURL(file));
                                    }}
                                />
                            </div>

                            <Label> Message type</Label>

                            <select
                                value={editForm.message_type}
                                onChange={(e) => {
                                    setAddForm({ ...addForm, message_type: e.target.value })
                                }}>
                                <option>general</option>
                                <option>general</option>

                            </select>

                            <div>
                                <Label>Title*</Label>
                                <Input
                                    required
                                    value={editForm?.title}
                                    onChange={(e) =>
                                        setEditForm({ ...editForm, title: e.target.value })
                                    }
                                />
                            </div>
                            <div>
                                <Label>Body*</Label>
                                <Input
                                    required
                                    value={editForm?.body}
                                    onChange={(e) =>
                                        setEditForm({ ...editForm, title: e.target.value })
                                    }
                                />
                            </div>
                            <div>
                                <Label>Message From</Label>
                                <Input
                                    required
                                    value={editForm?.from}
                                    onChange={(e) =>
                                        setEditForm({ ...editForm, from: e.target.value })
                                    }
                                />
                            </div>
                            <div>
                                <Label>Message from desgin</Label>
                                <Input
                                    required
                                    value={editForm?.from_name}
                                    onChange={(e) =>
                                        setEditForm({ ...editForm, from_name: e.target.value })
                                    }
                                />
                            </div>

                            <button type="submit" className="w-full  p-2 bg-amber-900 text-amber-50">
                                Update Message
                            </button>


                        </form>

                    </div>
                </DialogContent>

            </Dialog>

        </div >
    );
}
