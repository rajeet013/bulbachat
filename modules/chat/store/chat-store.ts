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
    triggeredChats: Set<string>;
    markChatAsTriggered: (chatId: string) => void;
    hasChatBeenTriggered: (chatId: string) => boolean;
}

export const useChatStore = create<ChatStore>((set, get) => ({
    chats: [],
    activeChatId: null,
    messages: [],
    triggeredChats: new Set(),

    setChats: (chats) => set({ chats }),
    setActiveChatId: (chatId) => set({ activeChatId: chatId }),
    setMessages: (messages) => set({ messages }),

    addChat: (chat) => set((state) => ({ chats: [chat, ...state.chats] })),
    addMessage: (message) => set((state) => ({ messages: [message, ...state.messages] })),
    clearMessages: () => set({ messages: [] }),

    markChatAsTriggered: (chatId: string) => {
        const triggered = new Set(get().triggeredChats);
        triggered.add(chatId);
        set({ triggeredChats: triggered });
    },

    hasChatBeenTriggered: (chatId: string) => {
        return get().triggeredChats.has(chatId);
    }
}));