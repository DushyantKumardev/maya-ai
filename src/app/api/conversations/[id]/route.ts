import { auth } from "@/features/auth/config/auth";
import connectDB from "@/server/db/mongo";
import Conversation from "@/server/db/models/conversation-model";
import type { Message } from "@/features/chat/types";
import { NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function normalizeMessageContent(message: Message): Message {
  if (message?.content || !Array.isArray(message?.parts)) {
    return message;
  }

  const reconstructedContent = message.parts
    .filter((part) => part.type === "content")
    .map((part) => part.content)
    .join("");

  return reconstructedContent
    ? { ...message, content: reconstructedContent }
    : message;
}

/**
 * Retrieves a single conversation by ID.
 *
 * Ensures the user is authenticated and owns the conversation.
 *
 * @param req - The incoming HTTP request.
 * @param params - The route parameters containing the conversation ID.
 * @returns A JSON response with the conversation data, or an error payload.
 */
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const isEphemeral = id.startsWith("ephemeral_");

    // If the ID is ephemeral, it doesn't exist in MongoDB. Return a mock object.
    if (isEphemeral) {
      return NextResponse.json({
        _id: id,
        userId: session.user.id,
        title: "New Chat",
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isEphemeral: true,
      });
    }

    await connectDB();

    const conversation = await Conversation.findOne({
      _id: id,
      userId: session.user.id,
    }).lean();

    if (!conversation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(conversation);
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * Updates a conversation's data (title or messages).
 *
 * Ensures the user is authenticated and owns the conversation.
 * Common use cases include updating the title after auto-generation, or syncing message history.
 */
interface UpdateBody {
  messages?: Message[];
  title?: string;
}

export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const isEphemeral = id.startsWith("ephemeral_");

    const body: UpdateBody = await req.json();
    await connectDB();

    // Check if persistence is disabled via settings
    const { Settings } = await import("@/server/db/models/settings-model");
    const dbSettings = await Settings.findOne({ userId: session.user.id }).lean();
    const persistConversations = (dbSettings as any)?.history?.persistConversations !== false;

    // If persistence is disabled OR the ID is ephemeral, we don't save to the database
    if (isEphemeral || !persistConversations) {
      return NextResponse.json({ success: true, isEphemeral: true });
    }

    const updateData: Record<string, unknown> = {};
    if (body.messages) {
      const normalizedMessages = body.messages.map(normalizeMessageContent);
      updateData.messages = normalizedMessages;

      // Handle transparent auto-title background tasks for new conversations without blocking user UX
      if (normalizedMessages.length === 2 && !body.title) {
         try {
           const { BackgroundService } = await import("@/server/jobs");
           const userMsgStr = normalizedMessages[0]?.content || "";
           BackgroundService.dispatch("generate_title", { 
              conversationId: id, 
              userId: session.user.id, 
              firstMessage: typeof userMsgStr === 'string' ? userMsgStr : JSON.stringify(userMsgStr)
           });
         } catch(e) { console.error("Could not dispatch background service", e) }
      }
    }
    if (body.title) updateData.title = body.title;

    const conversation = await Conversation.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      { $set: updateData },
      { new: true },
    );

    if (!conversation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating conversation:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * Permanently deletes a specific conversation.
 *
 * Ensures the user is authenticated and owns the conversation.
 *
 * @param req - The incoming HTTP request.
 * @param params - The route parameters containing the conversation ID.
 * @returns A JSON response indicating success or an error payload.
 */
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const isEphemeral = id.startsWith("ephemeral_");

    if (isEphemeral) {
      return NextResponse.json({ success: true, isEphemeral: true });
    }

    await connectDB();

    const result = await Conversation.deleteOne({
      _id: id,
      userId: session.user.id,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
