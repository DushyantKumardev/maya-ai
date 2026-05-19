import { NextResponse } from "next/server";
import createProvider from "@/server/agent/provider";
import { SERVICES } from "@/lib/constants";
import connectDB from "@/server/db/mongo";
import { Settings } from "@/server/db/models/settings-model";
import { auth } from "@/features/auth/config/auth";
import { AppSettings } from "@/features/settings/types";

/**
 * Retrieves the list of available models for a given provider.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const providerId = searchParams.get("provider") || "ollama";
    let settings: (AppSettings & { _id?: string }) | null = null;

    await connectDB();
    const session = await auth();
    
    if (session?.user?.id) {
      settings = await Settings.findOne({ userId: session.user.id }).lean();
    }

    // System Provider Lookup
    const systemProvider = SERVICES.find((s) => s.id === providerId);
    if (!systemProvider) {
      return NextResponse.json([]);
    }

    // Initialize the provider client
    const client = createProvider(providerId, settings || undefined);

    let list;
    try {
      list = await client.models.list();
    } catch (connectionError: unknown) {
      const message = connectionError instanceof Error ? connectionError.message : "Connection failed";
      console.warn(
        `Failed to connect to provider ${providerId}:`,
        message
      );
      return NextResponse.json([]); // Return empty list instead of crashing
    }

    // Normalize the output
    const models = (list?.data || []).map((model: { id: string; owned_by?: string }) => ({
      id: model.id,
      name: model.id,
      owned_by: model.owned_by,
    }));



    return NextResponse.json(models);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch models";
    console.error("Error fetching models:", error);
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
