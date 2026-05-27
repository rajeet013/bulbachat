import { get } from "https";
import { create } from "zustand";

interface ChatStore {
    messages: any[];
    setMessages: (messages: any[]) => void;
    chats: any[];
    setChats: (chats: any[]) => void;
    activeChatId: string | null;
    setActiveChatId: (chatId: string | null) => void;
    addChat: (chat: any) => void;        
    addMessage: (message: any) => void;   
    clearMessages: () => void;            
}

export const useChatStore = create<ChatStore>((set) => ({
    chats:[],
    activeChatId: null,
    messages: [],

    setChats: (chats) => set({ chats: chats }),
    setActiveChatId: (chatId) => set({ activeChatId: chatId }),
    setMessages: (messages) => set({ messages: messages }),

    addChat: (chat) => set(( state ) => ({ chats: [chat, ...state.chats] })),
    addMessage: (message) => set(( state ) => ({ messages: [message, ...state.messages] })),
    clearMessages: () => set({ messages: [] }),
}));