// src/server/tools/runners/docReaderRunner.ts

import fs from "fs";
import path from "path";
import connectDB from "@/server/db/mongo";
import AttachmentModel from "@/server/db/models/attachment-model";

export const docReaderTool = {
  function: {
    name: "doc-reader",
    description: "Reads the content of an uploaded document (txt, md, csv, json, etc.).",
    parameters: {
      type: "object",
      properties: {
        attachmentId: {
          type: "string",
          description: "The ID of the attachment to read.",
        },
      },
      required: ["attachmentId"],
    },
  },
  execute: docReaderRunner,
};

// ---- Types ---------------------------------------------------------------

interface StatusUpdate {
  message: string;
  done?: boolean;
  data?: unknown;
}

interface DocReaderSystemOptions {
  onStatusUpdate?: (params: StatusUpdate) => void;
}

export interface DocReaderResponse {
  content?: string;
  filename?: string;
  mimeType?: string;
  truncated?: boolean;
  error?: string;
}

// ---- Config ---------------------------------------------------------------

const MAX_CHARS = 50_000;

// ---- Helpers --------------------------------------------------------------

function truncate(text: string): { text: string; truncated: boolean } {
  if (text.length <= MAX_CHARS) return { text, truncated: false };
  return {
    text: text.slice(0, MAX_CHARS) + "\n\n[... content truncated ...]",
    truncated: true,
  };
}

function getExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}


const PLAIN_TEXT_EXTENSIONS = new Set([
  "txt", "md", "csv", "json", "xml",
  "html", "htm", "log", "ts", "js",
  "py", "css", "yaml", "yml", "toml",
]);

export async function docReaderRunner(
  args: { attachmentId: string },
  sysOptions: DocReaderSystemOptions = {},
): Promise<DocReaderResponse> {
  const { attachmentId } = args;
  const { onStatusUpdate } = sysOptions;

  try {
    onStatusUpdate?.({ message: "Looking up attachment…" });
    await connectDB();
    const attachment = await AttachmentModel.findById(attachmentId).lean();
    if (!attachment) throw new Error(`Attachment not found: ${attachmentId}`);

    const absolutePath = path.join(/* turbopackIgnore: true */ process.cwd(), attachment.path);
    if (!fs.existsSync(absolutePath)) throw new Error(`File not found on disk: ${absolutePath}`);

    const ext = getExtension(attachment.filename);
    const mimeType = attachment.mimeType;

    if (!PLAIN_TEXT_EXTENSIONS.has(ext) && !mimeType.startsWith("text/")) {
      throw new Error(
        `Unsupported file type: "${ext}". Only plain text files are supported (md, txt, csv, json, etc).`
      );
    }

    onStatusUpdate?.({ message: `Reading ${attachment.filename}…` });
    const buffer = fs.readFileSync(/* turbopackIgnore: true */ absolutePath);
    const rawText = buffer.toString("utf-8");

    const { text: content, truncated } = truncate(rawText.trim());

    const result: DocReaderResponse = {
      content,
      filename: attachment.filename,
      mimeType,
      truncated,
    };

    onStatusUpdate?.({ message: `Read ${attachment.filename}`, done: true, data: result });
    return result;

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    onStatusUpdate?.({ message: `Failed: ${errorMessage}`, done: true });
    return { error: errorMessage };
  }
}