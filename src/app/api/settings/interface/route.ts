import { auth } from "@/features/auth/config/auth";
import { Settings } from "@/server/db/models/settings-model";
import connectDB from "@/server/db/mongo";
import { NextResponse } from "next/server";

/**
 * Update Interface Settings (Locale)
 */
export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { locale } = await req.json();
    await connectDB();

    const updateQuery: any = {};
    if (locale) updateQuery["locale"] = locale;

    if (Object.keys(updateQuery).length === 0) {
      return NextResponse.json({ error: "No changes provided" }, { status: 400 });
    }

    const settings = await Settings.findOneAndUpdate(
      { userId: session.user.id },
      { $set: { ...updateQuery, updatedAt: new Date().toISOString() } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({
      locale: settings.locale,
    });
  } catch (error) {
    console.error("Error updating interface settings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
