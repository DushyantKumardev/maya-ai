import { auth } from "@/features/auth/config/auth";
import connectDB from "@/server/db/mongo";
import Conversation from "@/server/db/models/conversation-model";
import { NextResponse } from "next/server";

/**
 * Lists all conversations for the currently authenticated user.
 *
 * Returns only metadata (title, createdAt, updatedAt) to be lightweight,
 * sorted by most recent first.
 *
 * @returns A JSON response with the list of conversations.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const conversations = await Conversation.find({ userId: session.user.id })
      .select("title updatedAt")
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json(conversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * Creates a new, empty conversation.
 *
 * Used when the user clicks "New Chat". Default title is "New Chat"
 * (usually updated later by AI).
 *
 * @param req - The incoming HTTP request containing optional title.
 * @returns A JSON response with the new conversation ID and title.
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { Settings } = await import("@/server/db/models/settings-model");
    const dbSettings = await Settings.findOne({ userId: session.user.id }).lean() as { persistConversations?: boolean } | null;
    const persistConversations = dbSettings?.persistConversations !== false;

    const body = await req.json().catch(() => ({}));
    const title = body.title || "New Chat";

    // If persistence is disabled, we return a virtual conversation without saving to DB
    if (!persistConversations) {
      return NextResponse.json({
        id: `ephemeral_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        title,
        isEphemeral: true,
      });
    }

    const conversation = await Conversation.create({
      userId: session.user.id,
      title,
      messages: [],
    });

    return NextResponse.json({
      id: conversation._id,
      title: conversation.title,
    });
  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * Bulk deletes all conversations for the authenticated user.
 *
 * Warning: This is a destructive action (Clear All History).
 *
 * @returns A JSON response indicating success or an error payload.
 */
export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    await Conversation.deleteMany({ userId: session.user.id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting conversations:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
