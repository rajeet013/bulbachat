import { convertToModelMessages, streamText } from "ai";
import db from "@/lib/db";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { CHAT_SYSTEM_PROMPT } from "@/lib/prompt";
import { MessageRole, MessageType } from "@prisma/client";

const provider = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY
});

interface MessagePart {
    type: string;
    text?: string;
}

interface UIMessage {
    id: string;
    role: string;
    parts: MessagePart[];
    content?: string;
    createdAt: Date;
}

interface StoredMessage {
    id: string;
    content: string;
    messageRole: string;
    createdAt: Date;
}

function convertStoreMessageToUI(msg: StoredMessage): UIMessage | null {
    try {
        const parts = JSON.parse(msg.content);
        const validParts = parts.filter((part: MessagePart) => part.type === "text");

        if (validParts.length === 0) return null;

        return {
            id: msg.id,
            role: msg.messageRole.toLowerCase(),
            parts: validParts,
            createdAt: msg.createdAt
        };
    } catch (error) {
        return {
            id: msg.id,
            role: msg.messageRole.toLowerCase(),
            parts: [{ type: "text", text: msg.content }],
            createdAt: msg.createdAt
        };
    }
}

function extractPartsAsJSON(message: UIMessage) {
    if (message.parts && Array.isArray(message.parts)) {
        return JSON.stringify(message.parts);
    }
    const content = message.content || "";
    return JSON.stringify([{ type: "text", text: content }]);
}

export async function POST(req: Request) {
    try {
        const { chatId, messages: newMessages, model, skipUserMessage } = await req.json();

        const previousMessages = chatId ? await db.message.findMany({
            where: { chatId },
            orderBy: { createdAt: "asc" }
        }) : [];

        const uiMessages = previousMessages
            .map(convertStoreMessageToUI)
            .filter((msg): msg is UIMessage => msg !== null);

        const normalizedNewMessages = Array.isArray(newMessages) ? newMessages : [newMessages];
        const allUIMessages = [...uiMessages, ...normalizedNewMessages];

        let modelMessages;

        try {
            modelMessages = await convertToModelMessages(allUIMessages);
        } catch (conversionError) {
            modelMessages = allUIMessages.map(msg => ({
                role: msg.role as "user" | "assistant",
                content: msg.parts
                    .filter((part: MessagePart) => part.type === "text")
                    .map((part: MessagePart) => part.text ?? "")
                    .join("\n")
            })).filter(msg => msg.content);
        }

        const result = streamText({
            model: provider.chat(model),
            messages: modelMessages,
            system: CHAT_SYSTEM_PROMPT
        });

        return result.toUIMessageStreamResponse({
            sendReasoning: true,
            originalMessages: allUIMessages,
            onFinish: async ({ responseMessage }) => {
                try {
                    const messageToSave: {
                        chatId: string;
                        content: string;
                        messageRole: MessageRole;
                        model: string;
                        messageType: MessageType;
                    }[] = [];

                    if (!skipUserMessage) {
                        const latestUserMessage = normalizedNewMessages[normalizedNewMessages.length - 1];

                        if (latestUserMessage?.role === "user") {
                            const userPartsJSON = extractPartsAsJSON(latestUserMessage);

                            messageToSave.push({
                                chatId,
                                content: userPartsJSON,
                                messageRole: MessageRole.USER,
                                model,
                                messageType: MessageType.NORMAL,
                            });
                        }
                    }

                    if (responseMessage?.parts && responseMessage.parts.length > 0) {
                        const assistantPartsJSON = extractPartsAsJSON(responseMessage as UIMessage);

                        messageToSave.push({
                            chatId,
                            content: assistantPartsJSON,
                            messageRole: MessageRole.ASSISTANT,
                            model,
                            messageType: MessageType.NORMAL,
                        });
                    }

                    if (messageToSave.length > 0) {
                        await db.message.createMany({
                            data: messageToSave
                        });
                    }
                } catch (error) {
                    console.error("Error saving messages:", error);
                }
            }
        });

    } catch (error) {
        console.error("Chat API error:", error);
        return new Response(
            JSON.stringify({ error: "Failed to process chat" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}