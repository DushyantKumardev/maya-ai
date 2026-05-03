import { JioSaavn, BITRATES } from "saavn-ts";

export const tunelinkTool = {
  type: "function",
  name: "tunelink",
  description: "Search and play a song from JioSaavn.",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "The name of the song to search for.",
      }
    },
    required: ["query"],
  },
  execute: tunelink,
};

/**
 * Ensures the audio URL has the correct bitrate suffix if not already present.
 */
function ensureBitrate(url: string, bitrate: string): string {
  if (!url) return url;
  const quality = bitrate.split("kbps")[0];
  const transformed = url.replace(/_(48|96|160|320)\.mp4/g, `_${quality}.mp4`);
  if (!transformed.endsWith(".mp4")) return `${transformed}_${quality}.mp4`;
  return transformed;
}

export async function tunelink(
  args: { query: string },
  sysOptions: {
    onStatusUpdate?: (params: {
      message: string;
      done?: boolean;
      data?: any;
    }) => void;
  },
): Promise<any | null> {
  const { query } = args;
  const { onStatusUpdate } = sysOptions || {};

  try {
    onStatusUpdate?.({ message: `Searching for song: ${query}...` });
    const sdk = new JioSaavn();
    
    // 1. Search for a song
    const searchResults = await sdk.search.songs({ query });
    if (!searchResults.results || searchResults.results.length === 0) {
      onStatusUpdate?.({ message: "No songs found.", done: true });
      return { error: "No results found for this song." };
    }

    const song = searchResults.results[0];
    onStatusUpdate?.({ message: `Loading details for ${song.title}...` });

    // 2. Get full details
    const details = await sdk.songs.getDetailsById(song.id);
    if (!details) {
      onStatusUpdate?.({ message: "Could not retrieve song details.", done: true });
      return { error: "Details not available." };
    }

    // 3. Get streaming URL
    onStatusUpdate?.({ message: `Fetching high-quality stream...` });
    const encryptedUrl = details.more_info?.encrypted_media_url;
    
    if (!encryptedUrl) {
      onStatusUpdate?.({ message: "No streamable URL found.", done: true });
      return { error: "This song cannot be streamed." };
    }

    const rawMediaUrl = await sdk.media.getStreamUrl({
      encryptedUrl: encryptedUrl,
      bitrate: BITRATES.S_HIGH // Use 320kbps
    });
    const mediaUrl = ensureBitrate(rawMediaUrl, BITRATES.S_HIGH);

    const resultData = {
      success: true,
      audioUrl: mediaUrl,
      title: details.title,
      artist: details.more_info?.artistMap?.primary_artists?.[0]?.name || "Unknown Artist",
      album: details.more_info?.album || "Unknown Album",
      coverArt: details.image?.replace("150x150", "500x500") || null,
      label: "JioSaavn",
      isMusic: true,
      instructions: "The song is playing in the global player. Do not provide links. Just confirm the playback.",
    };

    onStatusUpdate?.({ message: "Track ready!", done: true });
    return resultData;

  } catch (err: any) {
    console.error(`[tunelink] Error:`, err);
    onStatusUpdate?.({ message: `Playback failed`, done: true });
    return { error: `Music service error: ${err.message}` };
  }
}
