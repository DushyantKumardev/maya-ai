import type { Metadata } from "next";
import { ChatInterface } from "@/features/chat/components/ChatInterface";
import { Suspense } from "react";
import Loader from "@/components/common/Loader";

export const metadata: Metadata = {
  title: "Chat - Maya AI",
  description: "Chat with Maya AI",
};

export default function ChatHomePage() {
  return (
    <Suspense fallback={<Loader />}>
      <ChatInterface />
    </Suspense>
  );
}
