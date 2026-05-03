import { auth } from "@/features/auth/config/auth";
import { Settings } from "@/server/db/models/settings-model";
import connectDB from "@/server/db/mongo";
import { DEFAULT_SETTINGS, AppSettings } from "@/features/settings/types";
import { NextResponse } from "next/server";

/**
 * Retrieves the user's settings.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const settings = (await Settings.findOne({ userId: session.user.id })
      .select("+apiKeys")
      .lean()) as (AppSettings & { _id?: string }) | null;

    if (!settings) {
      return NextResponse.json(DEFAULT_SETTINGS);
    }

    if (settings.apiKeys && settings.apiKeys instanceof Map) {
      settings.apiKeys = Object.fromEntries(settings.apiKeys);
    }

    // Hide actual keys from client, send placeholders
    maskSensitiveData(settings);

    // Remove theme (now client-side only)
    delete (settings as any).theme;

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}


/**
 * HELPER: Mask sensitive keys before sending to client
 */
function maskSensitiveData(settings: AppSettings) {
  const mask = "••••••••••••••••";
  
  if (settings.apiKeys) {
    Object.keys(settings.apiKeys).forEach(key => {
      if (settings.apiKeys[key]) (settings.apiKeys)[key] = mask;
    });
  }
}

