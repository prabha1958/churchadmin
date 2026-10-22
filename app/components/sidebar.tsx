"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, X, LogOut, LayoutDashboard, MessageSquare, Users, ClipboardList, CreditCard, HeartHandshake, Church, CalendarDays, HandHeart, UsersRound } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "../context/auth-provider";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/members", label: "Members", icon: Users },
  { href: "/dashboard/changes", label: "Change Requests", icon: ClipboardList },
  { href: "/dashboard/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/dashboard/alliances", label: "Alliances", icon: HeartHandshake },
  { href: "/dashboard/clergy", label: "Clergy", icon: Church },
  { href: "/dashboard/committee", label: "Committee Members", icon: UsersRound },
  { href: "/dashboard/events", label: "Events", icon: CalendarDays },
  { href: "/dashboard/poor-feeding", label: "Poor Feeding", icon: HandHeart },
  { href: "/dashboard/men-fellowships", label: "Mens Fellowships", icon: UsersRound },
  { href: "/dashboard/women-fellowship", label: "Womens Fellowships", icon: UsersRound },
];

export default function Sidebar() {
  const { member, churchCode, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const initials = `${member?.first_name?.trim()?.[0] || ""}${member?.last_name?.trim()?.[0] || ""}`.toUpperCase() || "AD";
  const imageUrl = member?.profile_photo ? `${process.env.NEXT_PUBLIC_IMAGE_BASE_URL || ""}/storage/${member.profile_photo}` : "/no-photo.png";

  const handleLogout = async () => { setOpen(false); await logout(); router.replace("/"); };
  const navContent = (
    <div className="flex h-full flex-col bg-[#191970] text-white">
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-5">
        <Avatar className="h-10 w-10 border border-white/30"><AvatarImage src={imageUrl} alt="Administrator profile" /><AvatarFallback className="bg-blue-100 font-semibold text-blue-950">{initials}</AvatarFallback></Avatar>
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{[member?.first_name, member?.last_name].filter(Boolean).join(" ") || "Administrator"}</p><p className="text-xs capitalize text-blue-200">{member?.role || "Admin"}</p>{churchCode && <p className="mt-1 truncate text-[11px] text-amber-300">Church: {churchCode}</p>}</div>
        <button type="button" className="rounded-md p-2 hover:bg-white/10 md:hidden" onClick={() => setOpen(false)} aria-label="Close navigation"><X className="h-5 w-5" /></button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {links.map(({ href, label, icon: Icon }) => {
          const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
          return <Link key={href} href={href} onClick={() => setOpen(false)} className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${active ? "bg-white text-[#191970] font-semibold" : "text-blue-50 hover:bg-white/10"}`}><Icon className="h-4 w-4 shrink-0" /><span>{label}</span></Link>;
        })}
      </nav>
      <div className="border-t border-white/10 p-3"><button onClick={handleLogout} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400"><LogOut className="h-4 w-4" />Sign out</button></div>
    </div>
  );

  return <>
    <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between bg-[#191970] px-4 text-white shadow-md md:hidden"><button type="button" onClick={() => setOpen(true)} className="rounded-md p-2 hover:bg-white/10" aria-label="Open navigation"><Menu className="h-6 w-6" /></button><span className="truncate px-2 text-base font-semibold">Church Admin</span><span className="max-w-[35%] truncate text-xs text-amber-300">{churchCode || ""}</span></div>
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 shadow-xl md:block lg:w-72">{navContent}</aside>
    {open && <div className="fixed inset-0 z-50 md:hidden"><button className="absolute inset-0 bg-black/60" aria-label="Close navigation overlay" onClick={() => setOpen(false)} /><aside className="absolute inset-y-0 left-0 w-[min(84vw,20rem)] shadow-2xl">{navContent}</aside></div>}
  </>;
}
