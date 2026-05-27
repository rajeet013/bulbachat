import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createChatWithMessage } from "../actions";
import { toast } from "sonner";

interface CreateChatValues {
    content: string;
    model: string;
}


export const useCreateChat = () => {
    const queryClient = useQueryClient();

    const router = useRouter();

    return useMutation({
        mutationFn:(values: CreateChatValues)=> createChatWithMessage(values),
        
        onSuccess: (res) => {
            if(res.success && res.data) {
                // add optimistic UI
                const chat = res.data;

                queryClient.invalidateQueries({queryKey: ["chats"]});

                router.push(`/chat/${chat.id}?autoTrigger=true`)
            }
        },
        onError: (error) => {
            console.error("Error creating chat", error);
            toast.error("Failed to create chat");
        }
    })
}