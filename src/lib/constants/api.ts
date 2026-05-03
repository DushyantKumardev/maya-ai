/**
 * Centralized API endpoints for the application.
 * Use these constants instead of hardcoded strings to ensure consistency.
 */
export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: "/api/auth/register",
    FORGOT_PASSWORD: "/api/auth/forgot-password",
    SESSION: "/api/auth/session",
  },
  CHAT: {
    STREAM: "/api/chat",
  },
  CONVERSATIONS: {
    BASE: "/api/conversations",
    BY_ID: (id: string) => `/api/conversations/${id}`,
  },
  SETTINGS: {
    BASE: "/api/settings",
    INTERFACE: "/api/settings/interface",
    ENGINE: "/api/settings/engine",
    PERSONA: "/api/settings/persona",
    KEYS: "/api/settings/keys",
    TOOLS: "/api/settings/tools",
    MEMORY: "/api/settings/memory",
  },
  MODELS: {
    BASE: "/api/models",
    BY_ID: (id: string) => `/api/models/${id}`,
  },
  ATTACHMENTS: {
    BASE: "/api/attachments",
    BY_ID: (id: string) => `/api/attachments/${id}`,
  },
  YOUTUBE: {
    CHANNEL_INFO: "/api/youtube/channel-info",
  },
  STORAGE: {
    GENERATED: (fileName: string) => `/api/storage/generated/${fileName}`,
  },
} as const;