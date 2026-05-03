# 🔌 API Reference

This document provides a reference for the internal API routes used by Maya AI. All routes are prefixed with `/api`.

---

## 💬 Chat API

### `POST /api/chat`
The core endpoint for sending messages and receiving streamed responses.

**Request Body:**
```json
{
  "messages": [
    { 
      "role": "user", 
      "content": "What was that greeting again?",
      "replyTo": "Hi. How can I help you today?"
    }
  ],
  "model": "qwen3:1.7b",
  "provider": "ollama",
  "conversationId": "optional-uuid",
  "settings": { ... },
  "location": { "city": "Mumbai", "country": "India" }
}
```

**Response:**
A readable stream of events (Server-Sent Events).
- **Content**: Raw text chunks from the LLM.
- **Events**: JSON objects prefixed with special markers (e.g., `summary_status`, `tool_call`).

---

## ⚙️ Settings API

### `GET /api/settings`
Retrieves the current user's settings, merged with system defaults.

**Response:**
```json
{
  "provider": "ollama",
  "modelId": "qwen3:1.7b",
  "persona": "...",
  "tools": {
    "webSearch": { "enabled": true },
    "weather": { "enabled": true },
    . (other tools)...
  }
}
```

### `PATCH /api/settings/[category]`
Updates specific categories of settings (e.g., `engine`, `keys`, `tools`).

---

## 🗂️ Conversations API

### `GET /api/conversations`
Lists all conversations for the authenticated user, sorted by date.

### `GET /api/conversations/[id]`
Retrieves a specific conversation with its full message history and summary.

### - **replyTo Replies**: A "WhatsApp-style" context system where users can select text to reply specifically to a part of the conversation.

### WhatsApp-style replyTo Replies ([src/features/chat/components/ui/SelectionPopup.tsx](../src/features/chat/components/ui/SelectionPopup.tsx))
Maya supports a premium context-aware reply system:
- **Selection Trigger**: Highlighting text within any chat message reveals a floating **"Reply ↵"** button.
- **Context Preview**: Clicking reply docks the replyTo text in a preview bubble above the chat input.
- **Separate Block Rendering**: In the chat history, replyTo text is rendered as a distinct, styled mini-bubble above the main message bubble, providing a clear visual hierarchy of the reference context.

### `DELETE /api/conversations/[id]`
Deletes a specific conversation.

---

## 🛠️ YouTube API

### `GET /api/youtube/channel-info?url=[channel_url]`
A proxy endpoint to fetch YouTube channel metadata used by the WebSearchWidget to render rich YouTube channel cards.

---

## 🔐 Authentication

All routes (except `/api/auth/*`) require a valid session.
- **`POST /api/auth/register`**: Register a new user.
- **`POST /api/auth/forgot-password`**: Initiate password recovery.

---

> [!IMPORTANT]
> Maya uses **Next.js 16 App Router**. API routes are defined in `src/app/api` and use the `route.ts` convention.
