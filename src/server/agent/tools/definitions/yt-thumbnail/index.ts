// ─── Types ────────────────────────────────────────────────────

interface YTThumbnailArgs {
  url: string;
}

interface YTThumbnailSystemOptions {
  onStatusUpdate?: (params: { message: string; done?: boolean; data?: any }) => void;
}

export interface YTThumbnailResult {
  videoId: string;
  title: string | null;
  channelName: string | null;
  thumbnails: {
    quality: string;
    label: string;
    url: string;
    width: number;
    height: number;
  }[];
}

// ─── Tool Definition ──────────────────────────────────────────

export const youtubeThumbnailTool = {
  type: "function",
  name: "yt-thumbnail",
  description:
    "Download YouTube video thumbnails in all available resolutions given a YouTube URL or video ID. Returns thumbnail URLs that the user can download or preview.",
  parameters: {
    type: "object",
    properties: {
      url: {
        type: "string",
        description:
          "A YouTube video URL (e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ) or just the video ID (e.g. dQw4w9WgXcQ).",
      },
    },
    required: ["url"],
  },
  execute: ytThumbnail,
};

// ─── Video ID Extractor ───────────────────────────────────────

function extractVideoId(input: string): string | null {
  // Already a bare ID (11 chars, alphanumeric + - + _)
  if (/^[a-zA-Z0-9_-]{11}$/.test(input.trim())) return input.trim();

  try {
    const url = new URL(input);
    // Standard watch URL: youtube.com/watch?v=ID
    if (url.hostname.includes("youtube.com")) {
      const v = url.searchParams.get("v");
      if (v) return v;
      // Shorts: youtube.com/shorts/ID
      const shortsMatch = url.pathname.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
      if (shortsMatch) return shortsMatch[1];
      // Embed: youtube.com/embed/ID
      const embedMatch = url.pathname.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
      if (embedMatch) return embedMatch[1];
    }
    // Shortened: youtu.be/ID
    if (url.hostname === "youtu.be") {
      const id = url.pathname.slice(1).split("?")[0];
      if (id.length === 11) return id;
    }
  } catch {
    // Not a valid URL — try regex as last resort
    const match = input.match(/(?:v=|youtu\.be\/|\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (match) return match[1];
  }

  return null;
}

// ─── Fetch video title via oEmbed (no API key) ────────────────

async function fetchVideoMeta(videoId: string): Promise<{ title: string | null; channelName: string | null }> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { signal: AbortSignal.timeout(5_000) }
    );
    if (!res.ok) return { title: null, channelName: null };
    const data = await res.json();
    return { title: data.title ?? null, channelName: data.author_name ?? null };
  } catch {
    return { title: null, channelName: null };
  }
}

// ─── Execute ──────────────────────────────────────────────────

export async function ytThumbnail(
  args: YTThumbnailArgs,
  sysOptions: YTThumbnailSystemOptions = {}
): Promise<YTThumbnailResult> {
  const { url } = args;
  const { onStatusUpdate } = sysOptions;

  onStatusUpdate?.({ message: "Extracting video ID..." });

  const videoId = extractVideoId(url);
  if (!videoId) {
    const err = "Could not extract a valid YouTube video ID from the provided URL.";
    onStatusUpdate?.({ message: err, done: true, data: { error: err } });
    throw new Error(err);
  }

  onStatusUpdate?.({ message: `Fetching thumbnails for video: ${videoId}...` });

  // YouTube thumbnail URL patterns — all free, no API key
  const thumbnailDefs = [
    { quality: "maxresdefault", label: "Max HD (1280×720)", width: 1280, height: 720 },
    { quality: "sddefault",     label: "SD (640×480)",      width: 640,  height: 480 },
    { quality: "hqdefault",     label: "HQ (480×360)",      width: 480,  height: 360 },
    { quality: "mqdefault",     label: "MQ (320×180)",      width: 320,  height: 180 },
    { quality: "default",       label: "Default (120×90)",  width: 120,  height: 90  },
  ];

  const base = `https://img.youtube.com/vi/${videoId}`;

  // Probe to see which high-res thumbs actually exist (maxres sometimes missing)
  const availableThumbnails: YTThumbnailResult["thumbnails"] = [];

  for (const def of thumbnailDefs) {
    const thumbUrl = `${base}/${def.quality}.jpg`;
    try {
      const probe = await fetch(thumbUrl, {
        method: "HEAD",
        signal: AbortSignal.timeout(4_000),
      });
      // YouTube returns a tiny 120×90 placeholder for missing thumbs — filter those out
      // unless this is the last-resort "default" size
      if (probe.ok) {
        const contentLength = probe.headers.get("content-length");
        const size = contentLength ? parseInt(contentLength) : 0;
        // Placeholder images are typically < 1.5KB; real thumbnails are much larger
        if (def.quality === "default" || size > 1500) {
          availableThumbnails.push({ ...def, url: thumbUrl });
        }
      }
    } catch {
      // Skip on network error
    }
  }

  // Fallback — always include hqdefault which YouTube guarantees
  if (availableThumbnails.length === 0) {
    availableThumbnails.push({
      quality: "hqdefault",
      label: "HQ (480×360)",
      url: `${base}/hqdefault.jpg`,
      width: 480,
      height: 360,
    });
  }

  const meta = await fetchVideoMeta(videoId);

  const result: YTThumbnailResult = {
    videoId,
    title: meta.title,
    channelName: meta.channelName,
    thumbnails: availableThumbnails,
  };

  onStatusUpdate?.({
    message: `Found ${availableThumbnails.length} thumbnail resolution${availableThumbnails.length !== 1 ? "s" : ""}`,
    done: true,
  });

  return {
    ...result,
    instructions:
      "A specialized thumbnail downloader widget has been rendered for the user. Do NOT include the YouTube URLs or thumbnail links in your text response. Simply mention that the thumbnails are ready for download.",
  } as any;
}
