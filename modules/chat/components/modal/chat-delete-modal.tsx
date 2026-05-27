"use client";
import Modal from "@/components/ui/modal";
import { useDeleteChat } from "../../hooks/chat";
import React from "react";
import { toast } from "sonner";

type DeleteChatModalProps = {
    isModalOpen: boolean;
    setIsModalOpen: (value: boolean) => void;
    chatId: string; 
};

const DeleteChatModal = ({
    isModalOpen,
    setIsModalOpen,
    chatId
}: DeleteChatModalProps ) => {
    const {mutateAsync, isPending} = useDeleteChat(chatId);

    const handleDelete = async () => {
        try {
            await mutateAsync();
            toast.success("Chat deleted successfully");
            setIsModalOpen(false);
        } catch (error) {
            toast.error("Failed to delete chat");
            console.error("Error deleting chat", error);
        }
    }

    return (
        <Modal 
            title={"Delete Chat"} 
            description="Are you sure you want to delete this chat? This action cannot be undone." 
            isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} 
            onSubmit={handleDelete} submitText="Delete" cancelText="Cancel" submitVariant="destructive" size="sm"
            className="rounded-lg"
        >
            <p className="text-sm text-muted-foreground">
                Once deleted, all requests and data in this Chat will be permanently removed.
            </p>
        </Modal>
    )
}

export default DeleteChatModal;