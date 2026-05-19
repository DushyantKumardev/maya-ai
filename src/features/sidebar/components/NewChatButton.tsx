"use client";
 
import { Plus } from "lucide-react";
import { SidebarMenuButton } from "@/components/ui/sidebar";

interface NewChatButtonProps {
  variant: "outline" | "default";
  size: "sm" | "lg" | "default";
  iconOnly?: boolean;
}

const NewChatButton = ({ variant, size, iconOnly }: NewChatButtonProps) => {

  const handleNewChat = () => {
    window.dispatchEvent(new CustomEvent("new-chat"));
  };

  return (
    <SidebarMenuButton
      variant={variant}
      size={size}
      onClick={handleNewChat}
      className="h-10 rounded-sm border-sidebar-border bg-sidebar-accent px-3 transition-colors hover:bg-sidebar-accent/80 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:rounded-xl! flex items-center justify-center"
    >
      <Plus className="h-4 w-4 shrink-0" />
      {!iconOnly &&<span className="ml-2 font-medium truncate group-data-[collapsible=icon]:hidden">
        New Chat
      </span>}
    </SidebarMenuButton>
  );
};

export default NewChatButton;
