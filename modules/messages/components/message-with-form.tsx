"use client"
import { useChat } from "@ai-sdk/react";
import { useGetChatById } from "@/modules/chat/hooks/chat";
import { Fragment, useState, useMemo } from "react";

import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Spinner } from "@/components/ui/spinner";
import { ModelSelector } from "@/modules/chat/components/model-selector";
import { useChatStore } from "@/modules/chat/store/chat-store";
import { useAIModels } from "@/modules/ai-agent/hook/ai-agent";
import { PromptInput, PromptInputBody, PromptInputButton, PromptInputSubmit, PromptInputTextarea, PromptInputTools } from "@/components/ai-elements/prompt-input";
import { RotateCcwIcon, StopCircleIcon } from "lucide-react";
import { Reasoning, ReasoningContent, ReasoningTrigger } from "@/components/ai-elements/reasoning";

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

    const { stop, messages, status, sendMessage, regenerate } = useChat({
        fetch: async (input, init) => {
            return fetch("/api/chat", init);
        }
    });


    if (isPending) {
        return (
            <div className="flex items-center justify-center h-full">
                <Spinner />
            </div>
        )
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

    const handleStop = ()=>{
      stop();
    }

    const messageToRender = [...initialMessages, ...messages]

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
                                    {message.parts.map((part: MessagePart, i: number) => {
                                        switch (part.type) {
                                            case "text":
                                                return (
                                                    <Message from={message.role as "user" | "system" | "assistant"} key={`${message.id}-${i}`}>
                                                        <MessageContent>
                                                            {part.text}
                                                        </MessageContent>
                                                    </Message>
                                                )
                                            default:
                                                return null;

                                            case "reasoning":
                                              return (
                                                <Reasoning 
                                                  className="max-w-2xl p-4 border border-muted rounded-md bg-muted/50"
                                                  key={`${message.id} - ${i}`}>
                                                  <ReasoningTrigger />
                                                  <ReasoningContent className="mt-2 italic font-light text-muted-foreground">
                                                    {part.text}
                                                  </ReasoningContent>
                                                </Reasoning>
                                              )
                                        }
                                    })}
                                </Fragment>
                            ))
                        )}
                        {
                          status === "streaming" && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Spinner />
                              <span className="text-sm">AI is thinking...</span>
                            </div>
                          )
                        }
                    </ConversationContent>
                    <ConversationScrollButton />
                </Conversation>

                <PromptInput onSubmit={handleSubmit} className={"mt-4 border border-border rounded-2xl bg-accent"}>
                  <PromptInputBody>
                      <PromptInputTextarea
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          placeholder="Type your message..."
                          className="min-h-[80px] resize-none bg-transparent px-4 py-3 text-base focus-visible:ring-0"
                      />
                  </PromptInputBody>
                  <PromptInputTools className={"flex items-center justify-between gap-2 px-3 py-2 border-t border-border"}>
                      <div className="flex items-center gap-2">
                          {isLoadingModels ? (<Spinner />) : (
                              <ModelSelector
                                  models={models?.models ?? []}
                                  selectedModelId={selectedModel}
                                  onModelSelect={(model) => setSelectedModel(model.id)}
                              />
                          )}
                          {status === "streaming" ? (
                              <PromptInputButton onClick={handleStop} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted">
                                  <StopCircleIcon size={14} />
                                  <span>Stop</span>
                              </PromptInputButton>
                          ) : (
                              messageToRender.length > 0 && (
                                  <PromptInputButton onClick={handleRetry} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted">
                                      <RotateCcwIcon size={14} />
                                      <span>Retry</span>
                                  </PromptInputButton>
                              )
                          )}
                      </div>
                      <PromptInputSubmit
                          status={status}
                          className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90"
                      />
                  </PromptInputTools>
              </PromptInput>
            </div>
        </div>
    )
}

export default MessageWithForm