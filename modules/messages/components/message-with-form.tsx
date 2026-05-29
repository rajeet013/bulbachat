"use client"
import { useChat } from "@ai-sdk/react";
import { useGetChatById } from "@/modules/chat/hooks/chat";
import { Fragment, useState, useMemo, useEffect, useRef } from "react";

import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { Spinner } from "@/components/ui/spinner";
import { ModelSelector } from "@/modules/chat/components/model-selector";
import { useChatStore } from "@/modules/chat/store/chat-store";
import { useAIModels } from "@/modules/ai-agent/hook/ai-agent";
import { PromptInput, PromptInputBody, PromptInputButton, PromptInputSubmit, PromptInputTextarea, PromptInputTools } from "@/components/ai-elements/prompt-input";
import { RotateCcwIcon, Send, StopCircleIcon } from "lucide-react";
import { Reasoning, ReasoningContent, ReasoningTrigger } from "@/components/ai-elements/reasoning";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface MessagePart {
    type: string;
    text?: string;
}

interface ChatMessage {
    id: string;
    content: string;
    messageRole: string;
    createdAt: Date;
}

const MessageWithForm = ({ chatId }: { chatId: string }) => {

    const { data: models, isPending: isLoadingModels } = useAIModels();
    const { data, isPending } = useGetChatById(chatId);
    const { hasChatBeenTriggered, markChatAsTriggered } = useChatStore();

    const [selectedModel, setSelectedModel] = useState<string>(data?.data?.model ?? "");
    const [input, setInput] = useState("");

    const hasAutoTriggered = useRef(false);
    const searchParams = useSearchParams();
    const router = useRouter();
    const shouldAutoTrigger = searchParams.get("autoTrigger") === "true";

    const initialMessages = useMemo(() => {
        if (!data?.data?.messages) return [];

        return data.data.messages
            .filter((msg: ChatMessage) => msg.content && msg.content.trim() !== "" && msg.id)
            .map((msg: ChatMessage) => {
                try {
                    const parts = JSON.parse(msg.content);
                    return {
                        id: msg.id,
                        role: msg.messageRole.toLowerCase(),
                        parts: Array.isArray(parts) ? parts : [{ type: "text", text: msg.content }],
                        createdAt: msg.createdAt
                    }
                } catch (error) {
                    return {
                        id: msg.id,
                        role: msg.messageRole.toLowerCase(),
                        parts: [{ type: "text", text: msg.content }],
                        createdAt: msg.createdAt
                    }
                }
            });
    }, [data]);

    const { stop, messages, status, sendMessage, regenerate } = useChat({});

    useEffect(() => {
        if (data?.data?.model && !selectedModel) {
            setSelectedModel(data.data.model);
        }
    }, [data, selectedModel]);

    useEffect(() => {
        if (hasAutoTriggered.current) return;
        if (!shouldAutoTrigger) return;
        if (hasChatBeenTriggered(chatId)) return;
        if (!selectedModel) return;
        if (initialMessages.length === 0) return;

        const lastMessage = initialMessages[initialMessages.length - 1];
        if (lastMessage.role !== "user") return;

        hasAutoTriggered.current = true;
        markChatAsTriggered(chatId);

        sendMessage(
            { text: "" },
            {
                body: {
                    model: selectedModel,
                    chatId,
                    skipUserMessage: true,
                }
            }
        );

        router.replace(`/chat/${chatId}`, { scroll: false });
    }, [
        shouldAutoTrigger,
        chatId,
        selectedModel,
        initialMessages,
        markChatAsTriggered,
        hasChatBeenTriggered,
        sendMessage,
        router,
    ]);

    if (isPending) {
        return (
            <div className="flex items-center justify-center h-full">
                <Spinner />
            </div>
        );
    }

    const handleSubmit = () => {
        if (!input.trim()) return;

        sendMessage(
            { role: "user", parts: [{ type: "text", text: input }] },
            {
                body: {
                    model: selectedModel,
                    chatId
                }
            }
        );

        setInput("");
    };

    const handleRetry = () => {
        const lastUserMessage = [...messageToRender].reverse().find(
            (msg) => msg.role === "user"
        );

        if (!lastUserMessage) return;

        const text = lastUserMessage.parts?.find((p: MessagePart) => p.type === "text")?.text ?? "";

        if (!text) return;

        sendMessage(
            { role: "user", parts: [{ type: "text", text }] },
            {
                body: {
                    model: selectedModel,
                    chatId,
                    skipUserMessage: true
                }
            }
        );
    };

    const handleStop = () => {
        stop();
    };

    const messageToRender = messages.length > 0 ? messages : initialMessages;

    const renderMessagePart = (
        part: MessagePart,
        message: { id: string; role: string },
        i: number
    ) => {
        switch (part.type) {
            case "text":
                return (
                    <Message
                        from={message.role as "user" | "system" | "assistant"}
                        key={`${message.id}-${i}`}
                    >
                        <MessageContent>
                            {message.role === "user" ? (
                                part.text
                            ) : (
                                <MessageResponse>
                                    {part.text ?? ""}
                                </MessageResponse>
                            )}
                        </MessageContent>
                    </Message>
                );

            case "reasoning":
                return (
                    <Reasoning
                        className="max-w-2xl p-4 border border-muted rounded-md bg-muted/50"
                        key={`${message.id}-${i}`}
                    >
                        <ReasoningTrigger />
                        <ReasoningContent className="mt-2 italic font-light text-muted-foreground">
                            <span>{part.text}</span>
                        </ReasoningContent>
                    </Reasoning>
                );

            default:
                return null;
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 relative size-full h-[calc(100vh-4rem)]">
            <div className="flex flex-col h-full">
                <Conversation className="h-full">
                    <ConversationContent>
                        {messageToRender.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                Start a conversation...
                            </div>
                        ) : (
                            messageToRender.map((message) => (
                                <Fragment key={message.id}>
                                    {message.parts.map((part: MessagePart, i: number) =>
                                        renderMessagePart(part, message, i)
                                    )}
                                </Fragment>
                            ))
                        )}
                        {status === "streaming" && (
                            <div className="flex items-center gap-2 text-muted-foreground px-4">
                                <Spinner />
                                <span className="text-sm">Bulba AI is thinking... 🌿</span>
                            </div>
                        )}
                    </ConversationContent>
                    <ConversationScrollButton />
                </Conversation>

                <div className="w-full px-4 pb-4">
                    <form onSubmit={handleSubmit}>
                        <div className="relative rounded-lg shadow-sm transition-all bg-accent">
                            <Textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask Bulba AI anything... 🌱"
                                className="min-h-[60px] max-h-[200px] resize-none border-0 bg-transparent px-4 py-3 text-base focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmit(e as any);
                                    }
                                }}
                            />
                            <div className="flex items-center justify-between gap-2 px-3 py-2 bg-background">
                                <div className="flex items-center gap-2">
                                    {isLoadingModels ? (<Spinner />) : (
                                        <ModelSelector
                                            models={models?.models ?? []}
                                            selectedModelId={selectedModel}
                                            onModelSelect={(model) => setSelectedModel(model.id)}
                                        />
                                    )}
                                    {status === "streaming" ? (
                                        <button
                                            type="button"
                                            onClick={handleStop}
                                            className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border border-border hover:bg-muted"
                                        >
                                            <StopCircleIcon size={14} />
                                            <span>Stop</span>
                                        </button>
                                    ) : (
                                        messageToRender.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={handleRetry}
                                                className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border border-border hover:bg-muted"
                                            >
                                                <RotateCcwIcon size={14} />
                                                <span>Retry</span>
                                            </button>
                                        )
                                    )}
                                </div>
                                <Button
                                    type="submit"
                                    disabled={input.trim() === "" || status === "streaming"}
                                    size="sm"
                                    variant={input.trim() ? "default" : "ghost"}
                                    className="h-8 w-8 p-0 rounded-full"
                                >
                                    {status === "streaming" ? <Spinner /> : <Send className="h-4 w-4" />}
                                    <span className="sr-only">Send message</span>
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default MessageWithForm