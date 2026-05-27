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
