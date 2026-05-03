/**
 * Agent — Public Entry Point
 *
 * This is the ONLY file external code should import from.
 * All internal pipeline layers are private to this folder.
 */
export { createChatStream } from "./orchestrator";
export type { ChatStreamConfig, StreamEvent, SendChunkFn } from "./types";
