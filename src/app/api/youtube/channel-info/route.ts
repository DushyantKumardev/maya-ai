import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing URL" }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch from YouTube: ${response.status}`);
    }

    const html = await response.text();
    
    // We can parse here or send the raw HTML. 
    // Since parsing is easier with DOMParser on client, we'll send the HTML.
    // However, Node doesn't have DOMParser, so we'd need a library like 'jsdom' or 'cheerio'.
    // To keep it simple, we'll just return the HTML text.
    return new NextResponse(html, {
      headers: { "Content-Type": "text/html" },
    });
  } catch (error: any) {
    console.error("YouTube Proxy Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
