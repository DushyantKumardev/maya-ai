import { auth } from "@/features/auth/config/auth";
import { Settings } from "@/server/db/models/settings-model";
import connectDB from "@/server/db/mongo";
import { NextResponse } from "next/server";

/**
 * Update Connectivity (API Keys)
 * Handles encryption of sensitive keys and preserves existing ones for masks.
 */
export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { emailProvider, gmailEmail, resendEmail, apiKeys } = await req.json();
    const userId = session.user.id;
    await connectDB();

    // 1. Fetch existing settings to check for masks
    const existingSettings = await Settings.findOne({ userId }).select("+apiKeys");
    
    const updateData: any = {};
    if (emailProvider !== undefined) updateData.emailProvider = emailProvider;
    if (gmailEmail !== undefined) updateData.gmailEmail = gmailEmail;
    if (resendEmail !== undefined) updateData.resendEmail = resendEmail;

    if (apiKeys) {
      const { encrypt } = await import("@/server/utils/crypto");
      const mask = "••••••••••••••••";
      const finalKeys = existingSettings?.apiKeys ? Object.fromEntries(existingSettings.apiKeys) : {};

      for (const [key, value] of Object.entries(apiKeys)) {
        if (value === mask) {
          // Keep existing value if it's the mask
          continue;
        }
        if (!value) {
          // Delete if empty
          delete finalKeys[key];
        } else {
          // Encrypt new value
          finalKeys[key] = encrypt(value as string);
        }
      }
      updateData.apiKeys = finalKeys;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No changes provided" }, { status: 400 });
    }

    const updatedSettings = await Settings.findOneAndUpdate(
      { userId },
      { $set: { ...updateData, updatedAt: new Date().toISOString() } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({
      emailProvider: updatedSettings.emailProvider,
      apiKeys: updatedSettings.apiKeys instanceof Map 
        ? Object.fromEntries(updatedSettings.apiKeys) 
        : updatedSettings.apiKeys,
    });
  } catch (error) {
    console.error("Error updating keys settings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
