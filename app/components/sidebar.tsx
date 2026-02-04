"use client"

import Link from 'next/link'
import { useAuth } from '../context/auth-provider'
import { useRouter, usePathname } from "next/navigation";

import {
    Avatar,
    AvatarImage,
    AvatarFallback,
} from "@/components/ui/avatar";


function Sidebar() {
    const { member, logout } = useAuth()
    const profile_url = process.env.NEXT_PUBLIC_URL
    const router = useRouter();
    const pathname = usePathname();

    const initials = (firstName: string | null | undefined) => {
        if (!firstName) return "NA";
        const trimmed = firstName.trim();
        if (!trimmed) return "NA";
        return trimmed.slice(0, 2).toUpperCase();
    };

    const fileUrl = (path?: string | null) => {
        if (!path) return "/no-photo.png";
        return `${process.env.NEXT_PUBLIC_IMAGE_BASE_URL}/storage/${path}`;
    };

    const handleLogoutClick = async () => {
        await logout();
        router.push("/");
    };

    return (

        <div className='w-full px-2 h-full  flex flex-col items-center gap-3 bg-[#272757] '>
            <div className='flex flex-col pt-5 pb-9'>
                <Avatar className="h-8 w-8 border border-blue-500/70">
                    <AvatarImage
                        src={fileUrl(member?.profile_photo)}
                        alt={`${member?.first_name || ""} ${member?.last_name || ""}`}
                    />
                    <AvatarFallback className="bg-blue-100 text-[10px] font-bold">
                        {initials(member?.first_name)}
                    </AvatarFallback>
                </Avatar>
                <div className="flex flex-col leading-tight">
                    <span className="text-xs font-medium text-blue-100">
                        {member?.first_name} {member?.last_name}
                    </span>
                    <span className="text-[10px] uppercase text-blue-300">
                        {member?.role}
                    </span>
                </div>
            </div>
            <Link href="/dashboard" className=' text-2xl text-blue-50 justify-items-start'>Dashboard</Link>
            <Link href="/dashboard/messages" className=' text-2xl text-blue-50 justify-items-start'>Messages</Link>
            <Link href="/dashboard/members" className=' text-2xl text-blue-50 justify-items-start'>Members</Link>
            <Link href="/dashboard/changes" className=' text-2xl text-blue-50 justify-items-start'>Change Requests</Link>
            <Link href="/dashboard/subscriptions" className=' text-2xl text-blue-50'>Subscriptions</Link>
            <Link href="/dashboard/alliances" className=' text-2xl text-blue-50'>Alliances</Link>
            <Link href="/dashboard/clergy" className=' text-2xl text-blue-50'>Clergy</Link>
            <Link href="/dashboard/committee" className=' text-2xl text-blue-50'>Committee Members</Link>
            <Link href="/dashboard/events" className=' text-2xl text-blue-50'>Events</Link>
            <Link href="/dashboard/poor-feeding" className=' text-2xl text-blue-50'>Poorfeeding</Link>
            <Link href="/dashboard/men-fellowships" className=' text-2xl text-blue-50'>MensFellowships</Link>
            <Link href="/dashboard/women-fellowship" className=' text-2xl text-blue-50'>WomensFellowships</Link>
            <button onClick={handleLogoutClick} className="bg-amber-500 p-2 rounded-2xl text-blue-50 text-[20px] cursor-pointer mt-6">Logout</button>
        </div>
    )
}

export default Sidebar