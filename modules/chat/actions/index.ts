"use server";

import db from "@/lib/db";
import { currentUser } from "@/modules/authentication/actions";
import { MessageRole, MessageType } from "@prisma/client";
import { revalidatePath } from "next/cache";

interface CreateChatValues {
    content: string;
    model: string;
}

export const createChatWithMessage = async (values: CreateChatValues) => {
    try {
        const user = await currentUser();
        if (!user) return {
            success: false,
            message: "Unauthorized user",
        }

        const { content, model } = values;

        if(!content || !content.trim()) 
            return {
                success: false,
                message: "Invalid message content",
            };

            const title = content.slice(0, 50) + (content.length > 50 ? "..." : "");

            const chat = await db.chat.create({
                data: {
                    title,
                    model,
                    userId: user.id,
                    messages: {
                        create: {
                            content,
                            messageRole: "USER",
                            messageType: "NORMAL", // ← was "TEXT", doesn't exist
                            model
                        }
                    }
                },
                include: {
                    messages: true,
                }
            });

            revalidatePath("/");

            return {
                success: true,
                message: "Chat created successfully",
                data: chat,
            }

    } catch (error) {
        console.error("Error creating chat", error);
        return {
            success: false,
            message: "Failed to create chat",
        };
    }
}

export const getAllChats = async () => {
    try {
        const user = await currentUser();
        if (!user) return {
            success: false,
            message: "Unauthorized user",
        };

        const chats = await db.chat.findMany({
            where: {
                userId: user.id,
            },
            include: {
                messages:true
            },
            orderBy: {
                createdAt: "desc",
            }
        });

        return {
            success: true,
            message: "Chats retrieved successfully",
            data: chats,
        };
    } catch (error) {
        console.error("Error retrieving chats", error);
        return {
            success: false,
            message: "Failed to fetch chats",
        };
    }
}

export const getChatById = async (chatId: string) => {
    const user = await currentUser();
    if (!user) return {
        success: false,
        message: "Unauthorized user",
    };

    try {
        const chat = await db.chat.findFirst({
            where: {
                id: chatId,
                userId: user.id,
            },
            include: {
                messages: true,
            }
        });

        return {
            success: true,
            message: "Chat retrieved successfully",
            data: chat,
        };
    } catch (error) {
        console.error("Error retrieving chat", error);
        return {
            success: false,
            message: "Failed to fetch chat",
        };
    }
}

export const deleteChat = async (chatId: string) => {
    try {
        const user = await currentUser();

        if (!user) {
            return {
                success: false,
                message: "Unauthorized user",
            }
        }

        const chat = await db.chat.findUnique({
            where: {
                id: chatId,
                userId: user.id,
            }
        })

        if (!chat) {
            return {
                success: false,
                message: "Chat not found",
            }
        }

        await db.chat.delete({
            where: {
                id: chatId,
            }
        })

        revalidatePath("/");
        return {
            success: true,
            message: "Chat deleted successfully",
        };
    } catch (error) {
        console.error("Error deleting chat", error);
        return {
            success: false,
            message: "Failed to delete chat",
        };
    }
}
