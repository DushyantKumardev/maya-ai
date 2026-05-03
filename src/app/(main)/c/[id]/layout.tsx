"use client";

import { ChatProvider } from "@/features/chat/context/ChatProvider";
import { use } from "react";
import { useSession } from "next-auth/react";
import Loader from "@/components/common/Loader";

/**
 * Layout for /c/[id] — overrides the parent /c layout's ChatProvider
 * with one that knows the specific conversationId, so the AI loads the
 * correct message history.
 */
export default function ConversationLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { status } = useSession();

  if (status === "loading") {
    return <Loader />;
  }

  return <ChatProvider conversationId={id}>{children}</ChatProvider>;
}
