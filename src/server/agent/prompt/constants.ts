import { APP_NAME } from "@/lib/constants";

/**
 * Prompt Layer — Constants
 * All raw template strings in one place.
 * Functions that build prompt sections live in modules.ts.
 */

// ─── Chat Prompt Templates ────────────────────────────────────────────────────

export const TITLE_GENERATION_PROMPT = (date: string, time: string) =>
  `Generate a 3-5 word Title Case conversation title with one emoji. No quotes or preamble. Blur personal details. Return ONLY the title. Today: ${date} | ${time}`;

export const SUMMARIZATION_PROMPT = `Summarize conversation. Start with 'SUMMARY:'. Facts only: user details, decisions, tasks, open loops. No <thought> tags. Accuracy over style.`;

export const REASONING_EFFORT_INSTRUCTIONS: Record<string, string> = {
  low: `## REASONING EFFORT: LOW\nThink briefly. Outline essential logic.`,
  medium: `## REASONING EFFORT: MEDIUM\nThink systematically. Break down reasoning into steps.`,
  high: `## REASONING EFFORT: HIGH\nDeep reasoning. Explore multiple perspectives.`,
};

// ─── Tool-Specific Prompt Templates ──────────────────────────────────────────

export const IMAGE_GENERATION_PROMPT_REFINER = (request: string) =>
  `You are an expert prompt engineer for DALL-E 3 and Midjourney. Your task is to take a simple user request for an image and expand it into a detailed, high-quality prompt.

Rules:
- Add specific details about lighting, composition, camera angle, and artistic style.
- Avoid buzzwords like "photorealistic" or "hyper-detailed"; instead, describe the textures and light.
- If the user is vague, assume a modern, cinematic aesthetic.
- Output ONLY the refined prompt text.

User Request: ${request}`;

export const WEB_SEARCH_INSTRUCTIONS = (type: string) =>
  `Synthesize ${type} results. The user sees a widget with details/media, so refer to them naturally (e.g., "As seen above") rather than repeating all data. Cite sources as [Title](URL).`;

export const VISION_ANALYSIS_PROMPT = (userPrompt: string) =>
  `Describe this image to help answer: "${userPrompt || "Describe this image"}". Output ONLY the description.`;

export const ATTACHMENT_CONTEXT_PROMPT = (list: string) =>
  `## ATTACHMENTS\n${list}\nUse 'doc-reader' with the ID to analyze these files. Do not claim you cannot see them.`;

// ─── App Identity ─────────────────────────────────────────────────────────────

export const DEFAULT_PERSONA = `You are ${APP_NAME}, a sharp, direct, and helpful agentic assistant. You speak like a knowledgeable friend—casual yet precise. Never say "As an AI" or "I don't have feelings." Be opinionated, push back when needed, and maintain a human tone without announcing you're an AI.`;
