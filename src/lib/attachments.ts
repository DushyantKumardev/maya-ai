import { type AttachmentKind } from "@/features/chat/types";

const TEXT_MIME_PREFIXES = ["text/"];

const TEXT_MIME_TYPES = new Set([
  "application/json",
  "application/ld+json",
  "application/xml",
  "application/javascript",
  "application/typescript",
  "application/x-javascript",
  "application/x-typescript",
  "application/x-sh",
  "application/x-httpd-php",
  "application/sql",
  "image/svg+xml",
]);

const TEXT_EXTENSIONS = new Set([
  "txt",
  "md",
  "markdown",
  "mdx",
  "json",
  "jsonl",
  "csv",
  "tsv",
  "log",
  "html",
  "htm",
  "xml",
  "svg",
  "css",
  "scss",
  "sass",
  "less",
  "js",
  "jsx",
  "ts",
  "tsx",
  "mjs",
  "cjs",
  "py",
  "rb",
  "php",
  "java",
  "kt",
  "go",
  "rs",
  "c",
  "h",
  "cpp",
  "cc",
  "hpp",
  "cs",
  "swift",
  "sql",
  "sh",
  "bash",
  "zsh",
  "yaml",
  "yml",
  "toml",
  "ini",
  "env",
  "dockerfile",
  "pdf",
]);



export function getFileExtension(filename?: string | null) {
  if (!filename) return "";
  const trimmed = filename.trim();
  if (!trimmed) return "";

  const lastDot = trimmed.lastIndexOf(".");
  if (lastDot === -1 || lastDot === trimmed.length - 1) {
    return trimmed.toLowerCase() === "dockerfile" ? "dockerfile" : "";
  }

  return trimmed.slice(lastDot + 1).toLowerCase();
}

export function sanitizeAttachmentName(filename?: string | null) {
  const fallback = "upload";
  if (!filename?.trim()) return fallback;

  return filename
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, " ")
    .slice(0, 180) || fallback;
}

export function inferAttachmentKind(
  mimeType?: string | null,
  filename?: string | null,
): AttachmentKind {
  const normalizedMime = (mimeType || "").toLowerCase();
  const extension = getFileExtension(filename);

  if (normalizedMime.startsWith("image/")) return "image";
  if (normalizedMime.startsWith("audio/")) return "audio";
  if (normalizedMime.startsWith("video/")) return "video";

  if (
    normalizedMime.includes("spreadsheet") ||
    ["csv", "tsv", "xlsx", "xls"].includes(extension)
  ) {
    return "spreadsheet";
  }

  if (
    TEXT_EXTENSIONS.has(extension) &&
    ["js", "jsx", "ts", "tsx", "py", "java", "go", "rs", "c", "cpp", "cs", "sql", "sh", "php"].includes(extension)
  ) {
    return "code";
  }

  if (supportsTextExtraction(mimeType, filename)) {
    if (["json", "jsonl", "yaml", "yml", "toml", "xml", "csv", "tsv"].includes(extension)) {
      return "data";
    }
    return "text";
  }

  if (
    normalizedMime === "application/pdf" ||
    normalizedMime.includes("word") ||
    normalizedMime.includes("officedocument")
  ) {
    return "document";
  }

  return "other";
}

export function supportsTextExtraction(
  mimeType?: string | null,
  filename?: string | null,
) {
  const normalizedMime = (mimeType || "").toLowerCase();
  const extension = getFileExtension(filename);

  return (
    TEXT_MIME_PREFIXES.some((prefix) => normalizedMime.startsWith(prefix)) ||
    TEXT_MIME_TYPES.has(normalizedMime) ||
    TEXT_EXTENSIONS.has(extension)
  );
}

export function truncateExtractedText(text?: string | null, maxChars = 16000) {
  if (!text) return "";
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return "";
  return normalized.length <= maxChars
    ? normalized
    : `${normalized.slice(0, maxChars)}\n\n[TRUNCATED]`;
}

export function formatAttachmentSize(size?: number | null) {
  if (!size || size < 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let value = size;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}
