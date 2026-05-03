import { auth } from "@/features/auth/config/auth";
import { Settings } from "@/server/db/models/settings-model";
import connectDB from "@/server/db/mongo";
import { NextResponse } from "next/server";

/**
 * Update Tools (Enabled Modules)
 */
export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tools } = await req.json();
    await connectDB();

    const updateQuery: any = {};
    if (tools !== undefined) updateQuery["tools"] = tools;

    if (Object.keys(updateQuery).length === 0) {
      return NextResponse.json({ error: "No changes provided" }, { status: 400 });
    }

    const settings = await Settings.findOneAndUpdate(
      { userId: session.user.id },
      { $set: { ...updateQuery, updatedAt: new Date().toISOString() } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({
      tools: settings.tools,
    });
  } catch (error) {
    console.error("Error updating tools settings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
