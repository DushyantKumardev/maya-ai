import { auth } from "@/features/auth/config/auth";
import { Settings } from "@/server/db/models/settings-model";
import connectDB from "@/server/db/mongo";
import { NextResponse } from "next/server";

/**
 * Update Engine (Provider, Model, Config)
 */
export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { provider, modelId, config } = await req.json();
    await connectDB();

    const updateQuery: Record<string, unknown> = {};
    if (provider !== undefined) updateQuery["provider"] = provider;
    if (modelId !== undefined) updateQuery["modelId"] = modelId;
    if (config !== undefined) updateQuery["config"] = config;

    if (Object.keys(updateQuery).length === 0) {
      return NextResponse.json({ error: "No changes provided" }, { status: 400 });
    }

    const settings = await Settings.findOneAndUpdate(
      { userId: session.user.id },
      { $set: { ...updateQuery, updatedAt: new Date().toISOString() } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({
      provider: settings.provider,
      modelId: settings.modelId,
      config: settings.config,
    });
  } catch (error) {
    console.error("Error updating engine settings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
