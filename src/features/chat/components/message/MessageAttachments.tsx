import React from "react";
import { MessageImage } from "./MessageImage";
import { MessageFiles } from "./MessageFiles";
import { Message } from "../../hooks/use-chat-handler";

interface MessageAttachmentsProps {
  message: Message;
  isUser: boolean;
}

export function MessageAttachments({ message, isUser }: MessageAttachmentsProps) {
  return (
    <>
      {isUser && message.image && (
        <div className="max-w-sm mb-2">
          <MessageImage src={message.image} />
        </div>
      )}

      {message.files && message.files.length > 0 && (
        <div className="mb-2 w-full">
          <MessageFiles files={message.files} isUser={isUser} />
        </div>
      )}
    </>
  );
}
