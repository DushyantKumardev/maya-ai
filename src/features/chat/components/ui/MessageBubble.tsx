import * as React from "react";
import { cn } from "@/lib/utils/utils";

const Message = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { isUser?: boolean }
>(({ className, isUser, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "group flex w-full justify-center px-4 py-3 md:px-0", 
      className
    )}
    {...props}
  >
    <div className={cn(
      "flex w-full max-w-chat flex-col", // Using centralized chat width
      isUser ? "items-end" : "items-start"
    )}>
      {props.children}
    </div>
  </div>
));
Message.displayName = "Message";

const MessageAvatar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { isUser?: boolean }
>(({ className, isUser, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-9 w-9 shrink-0 select-none items-center justify-center rounded-full border shadow-sm",
      isUser ? "bg-background" : "bg-primary text-primary-foreground",
      className
    )}
    {...props}
  />
));
MessageAvatar.displayName = "MessageAvatar";

const MessageContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { isUser?: boolean }
>(({ className, isUser, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex w-full flex-col gap-1", 
      isUser ? "items-end" : "items-start",
      className
    )}
    {...props}
  />
));
MessageContent.displayName = "MessageContent";

const MessageBubble = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { isUser?: boolean }
>(({ className, isUser, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative transition-all duration-200",
      isUser 
        ? "inline-block max-w-[85%] rounded-3xl bg-[#2f2f2f] px-5 py-2.5 text-[#ececec] shadow-sm hover:bg-[#353535]" 
        : "w-full rounded-none bg-transparent p-0 text-foreground", // Assistant takes full width of container
      className
    )}
    {...props}
  />
));
MessageBubble.displayName = "MessageBubble";

const MessageActionsContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { isUser?: boolean }
>(({ className, isUser, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100",
      isUser ? "justify-end" : "justify-start",
      className
    )}
    {...props}
  />
));
MessageActionsContainer.displayName = "MessageActionsContainer";

export {
  Message,
  MessageAvatar,
  MessageContent,
  MessageBubble,
  MessageActionsContainer,
};
