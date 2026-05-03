import { createChatStream } from "@/server/agent";
import { auth } from "@/features/auth/config/auth";
import { NextResponse } from "next/server";
import type { ChatRequest } from "@/features/chat/types";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: ChatRequest = await req.json();

    const {
      messages,
      model,
      provider,
      modelConfig,
      reasoningEffort,
      settings,
      conversationId,
      location,
    } = body;

    const stream = createChatStream({
      messages,
      model,
      provider,
      reasoning_effort: reasoningEffort,
      modelConfig,
      settings,
      conversationId,
      location,
      userId: session.user.id as string,
      abortSignal: req.signal,
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
