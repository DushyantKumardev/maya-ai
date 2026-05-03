import { auth } from "@/features/auth/config/auth";
import { Settings } from "@/server/db/models/settings-model";
import connectDB from "@/server/db/mongo";
import { NextResponse } from "next/server";

/**
 * Update Persona (Persona, Output Format)
 */
export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { persona, userContext, outputFormat, memories } = await req.json();
    await connectDB();

    const updateQuery: any = {};
    if (persona !== undefined) updateQuery["persona"] = persona;
    if (userContext !== undefined) updateQuery["userContext"] = userContext;
    if (outputFormat !== undefined) updateQuery["outputFormat"] = outputFormat;
    if (memories !== undefined) updateQuery["memories"] = memories;

    if (Object.keys(updateQuery).length === 0) {
      return NextResponse.json({ error: "No changes provided" }, { status: 400 });
    }

    const settings = await Settings.findOneAndUpdate(
      { userId: session.user.id },
      { $set: { ...updateQuery, updatedAt: new Date().toISOString() } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({
      persona: settings.persona,
      userContext: settings.userContext,
      outputFormat: settings.outputFormat,
      memories: settings.memories,
    });
  } catch (error) {
    console.error("Error updating persona settings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
