"use client"

import { useState, useEffect } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import React from 'react'
import { useAIModels } from '@/modules/ai-agent/hook/ai-agent'
import { Spinner } from '@/components/ui/spinner'
import { ModelSelector } from './model-selector'
import { useCreateChat } from '../hooks/chat'
import { toast } from 'sonner'

interface ChatMessageFormProps {
    initialMessage?: string;
    onMessageChange: (message: string) => void;
}

const ChatMessageForm = ({ initialMessage, onMessageChange }: ChatMessageFormProps) => {

    const { data: models, isPending } = useAIModels();
    const [selectedModelId, setSelectedModelId] = useState<string>(models?.models[0]?.id ?? "");
    const [message, setMessage] = useState("");
    const { mutate: createChat, isPending: isCreating } = useCreateChat();

    useEffect(() => {
        if (initialMessage) {
            setMessage(initialMessage)
            onMessageChange(initialMessage)
        }
    }, [initialMessage, onMessageChange])

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    createChat(
        { content: message, model: selectedModelId },
        {
            onSuccess: (res) => {
                if (res.success) {
                    toast.success("Message sent successfully");
                    setMessage("");
                    onMessageChange("");
                }
            }
        }
    );
}

    return (
        <div className="w-full max-w-3xl mx-auto px-4 pb-6">
            <form onSubmit={handleSubmit}>
                <div className="relative rounded-2xl border-border shadow-sm transition-all">
                    <Textarea
                        value={message}
                        onChange={(e) => {
                            setMessage(e.target.value);
                        }}
                        placeholder="Type your message here..."
                        className="min-h-15 max-h-50 resize-none border-0 bg-accent px-4 py-3 text-base focus-visible:ring-0 focus-visible:ring-offset-0 rounded-lg"
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                    />

                    <div className="flex items-center justify-between gap-2 px-3 py-2 border-t">
                        {isPending ? (
                            <Spinner />
                        ) : (
                            <ModelSelector
                                models={models?.models ?? []}
                                selectedModelId={selectedModelId}
                                onModelSelect={(model) => setSelectedModelId(model.id)}
                                className="ml-1"
                            />
                        )}

                        <Button
                            type="submit"
                            disabled={message.trim() === "" || isCreating}
                            size="sm"
                            variant={message.trim() ? "default" : "ghost"}
                            className="h-8 w-8 p-0 rounded-full"
                        >
                            {isCreating ? <Spinner /> : <Send className="h-4 w-4" />}
                            <span className="sr-only">Send message</span>
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    )
}

export default ChatMessageForm