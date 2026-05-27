"use client"
import { useState, useMemo, Fragment } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { PlusIcon, SearchIcon, EllipsisIcon, Trash } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger} from '@/components/ui/dropdown-menu'
import React from 'react'
import UserButton from '@/modules/authentication/components/user-button'
import Image from 'next/image'
import { useChatStore } from '../store/chat-store'
import DeleteChatModal from './modal/chat-delete-modal'
import { DropdownMenuGroup } from '@/components/ui/dropdown-menu'

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

interface ChatSidebarProps {
    user: User;
    chats?: Chat[];
}

const ChatSidebar = ({ user, chats = [] }: ChatSidebarProps) => {
    const { activeChatId } = useChatStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedChatID, setSelectedChatID] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const filteredChats = useMemo(() => {
        if (!searchQuery.trim()) {
            return chats;
        }
        const query = searchQuery.toLowerCase();
        return chats.filter(chat =>
            chat.title.toLowerCase().includes(query) ||
            chat.messages?.some(msg =>
                msg.content?.toLowerCase().includes(query)
            )
        )
    }, [chats, searchQuery])

    const groupedChats = useMemo(() => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);

        const groups: { today: Chat[], yesterday: Chat[], lastWeek: Chat[], older: Chat[] } = {
            today: [],
            yesterday: [],
            lastWeek: [],
            older: []
        };

        filteredChats.forEach(chat => {
            const chatDate = new Date(chat.createdAt);
            if (chatDate >= today) {
                groups.today.push(chat);
            } else if (chatDate >= yesterday) {
                groups.yesterday.push(chat);
            } else if (chatDate >= lastWeek) {
                groups.lastWeek.push(chat);
            } else {
                groups.older.push(chat);
            }
        });

        return groups;
    }, [filteredChats]);

    const onDelete = (e: React.MouseEvent, chatId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedChatID(chatId);
        setIsModalOpen(true);
    }

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    const handleClearSearch = () => {
        setSearchQuery("");
    };

    const renderChatList = (chatList: Chat[]) => {
        if (chatList.length === 0) return null;

        return chatList.map((chat) => (
            <Fragment key={chat.id}>
            <Link
                key={chat.id}
                href={`/chat/${chat.id}`}
                className={cn(
                    "block rounded-lg px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors",
                    chat.id === activeChatId && "bg-sidebar-accent"
                )}
            >
                <div className="flex flex-row justify-between items-center gap-2">
                    <span className="truncate flex-1">{chat.title}</span>
                    <DropdownMenu>
                        <DropdownMenuTrigger>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 group-hover:opacity-100 hover:bg-sidebar-accent-foreground/10 rounded-xl"
                                onClick={(e) => e.preventDefault()}
                            >
                                <EllipsisIcon className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuGroup>
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            </DropdownMenuGroup>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                                className="flex flex-row gap-2 cursor-pointer rounded-xl"
                                onClick={(e) => onDelete(e, chat.id)}
                            >
                                <Trash className="h-4 w-4 text-red-500" />
                                <span className="text-red-500">Delete</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </Link>
            <DeleteChatModal 
                isModalOpen={isModalOpen} 
                setIsModalOpen={setIsModalOpen} 
                chatId={selectedChatID!}
            />
            </Fragment>
        ))
    }

    return (
        <div className="flex h-full w-64 flex-col border-r border-border bg-sidebar">
            <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-3">
                <div className="flex items-center gap-2">
                    <div className="flex flex-col items-center">
                        <Image src="/bulbasaur.png" alt="bulbasaur" width={100} height={100} />
                        <p className="text-[#468D53] text-xl">BulbaChat</p>
                    </div>
                </div>
            </div>
            <div className="p-4">
                <Link href={"/"}>
                    <Button className={"w-full rounded-xl"}>
                        <PlusIcon className="mr-2 h-4 w-4"/>
                        New Chat
                    </Button>
                </Link>
            </div>
            <div className="px-4 pb-4">
                <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search your chat..."
                        className={"pl-9 bg-sidebar-accent border-sidebar-b pr-8 rounded-xl"}
                        value={searchQuery}
                        onChange={handleSearchChange}
                    />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto px-2">
                <div className="text-center text-sm text-muted-foreground py-8">
                    {filteredChats.length === 0 ? (
                        <div className="text-center text-sm text-muted-foreground py-8">
                            {searchQuery ? "No Chats Found." : "No Chats Yet."}
                        </div>
                    ) : (
                        <>
                            {groupedChats.today.length > 0 && (
                                <div className="mb-4">
                                    <div className="mb-2 px-2 text-xs font-semibold text-muted-foreground">
                                        Today
                                    </div>
                                    {renderChatList(groupedChats.today)}
                                </div>
                            )}
                            {groupedChats.yesterday.length > 0 && (
                                <div className="mb-4">
                                    <div className="mb-2 px-2 text-xs font-semibold text-muted-foreground">
                                        Yesterday
                                    </div>
                                    {renderChatList(groupedChats.yesterday)}
                                </div>
                            )}
                            {groupedChats.lastWeek.length > 0 && (
                                <div className="mb-4">
                                    <div className="mb-2 px-2 text-xs font-semibold text-muted-foreground">
                                        Last 7 Days
                                    </div>
                                    {renderChatList(groupedChats.lastWeek)}
                                </div>
                            )}
                            {groupedChats.older.length > 0 && (
                                <div className="mb-4">
                                    <div className="mb-2 px-2 text-xs font-semibold text-muted-foreground">
                                        Older
                                    </div>
                                    {renderChatList(groupedChats.older)}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
            <div className="p-4 flex items-center gap-3 border-t border-sidebar-border">
                <UserButton user={user} />
                <span className="flex-1 text-sm text-sidebar-foreground truncate">
                    {user.email}
                </span>
            </div>
        </div>
    )
}

export default ChatSidebar