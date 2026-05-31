"use client"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { MenuIcon, XIcon } from "lucide-react"
import ChatSidebar from "./chat-sidebar"

interface User {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    createdAt?: Date | string;
}

interface Chat {
    id: string;
    title: string;
    createdAt: Date | string;
    messages?: { content?: string }[];
}

interface ChatSidebarWrapperProps {
    user: User;
    chats: Chat[];
}

export default function ChatSidebarWrapper({ user, chats }: ChatSidebarWrapperProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Mobile hamburger button */}
            <button
                className="md:hidden fixed top-4 left-4 p-2 rounded-lg bg-sidebar border border-border shadow-md"
                onClick={() => setIsOpen(!isOpen)}
            >
                <MenuIcon size={16} />
            </button>

            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="md:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={cn(
                "fixed md:relative inset-y-0 left-0 z-40 h-full",
                "transform transition-transform duration-300 ease-in-out",
                isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}>
                <ChatSidebar
                    user={user}
                    chats={chats}
                    onClose={() => setIsOpen(false)}
                />
            </div>
        </>
    )
}