"use client";
import { useGetChatById } from '@/modules/chat/hooks/chat';
import { useChatStore } from '@/modules/chat/store/chat-store';
import React from 'react'
import { useEffect } from 'react'

interface ActiveChatLoaderProps {
    chatId: string;
}

const ActiveChatLoader = ({ chatId }: ActiveChatLoaderProps) => {
    const { setActiveChatId, setMessages, addChat, chats } = useChatStore();

    const {data} = useGetChatById(chatId);

    useEffect(() => {
        if(!chatId) return;
        setActiveChatId(chatId);
    }, [chatId, setActiveChatId]);

    useEffect(() => {
        if(!data || !data.success || !data.data) return;

        const chat = data.data;

        setMessages(chat.messages || []);

        if (!chats.find((c) => c.id === chat.id)) {
            addChat(chat);
        }
    }, [data, setMessages, addChat, chats]);

    return null;
}

export default ActiveChatLoader