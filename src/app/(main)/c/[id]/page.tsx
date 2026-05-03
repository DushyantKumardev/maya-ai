import { ChatInterface } from "@/features/chat/components/ChatInterface";
import Loader from "@/components/common/Loader";
import { Suspense } from "react";

export default function ConversationPage() {
  return (
    <Suspense fallback={<Loader />}>
      <ChatInterface />
    </Suspense>
  );
}
