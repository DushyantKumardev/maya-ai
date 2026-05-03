# 🗝️ Constants & Global Configuration

Maya uses a centralized constants system to ensure consistency across the UI, AI logic, and backend services. This document outlines the primary configuration files found in `src/lib/constants/`.

---

## 📱 Application Metadata (`app.ts`)
Defines the core identity of the platform.
- **`APP_NAME`**: The display name ("Maya").
- **`APP_CURRENT_VERSION`**: The current stable version (e.g., `1.0.0`).
- **`APP_LOGO`**: Paths to the Light and Dark mode SVG logos.

---

## 🤖 AI & LLM Config (`llm.ts`)
Handles the default settings for the AI "Brain."
- **`DEFAULT_PROVIDER`**: Fallback provider (typically `ollama`).
- **`DEFAULT_MODEL`**: Default model ID (e.g., `qwen2.5:1.5b`).

---

## 🛠️ Service Registry (`services.ts`)
The **source of truth** for all integrated tools and providers. Every entry includes metadata like `baseURL` and `link` for obtaining API keys.
- **AI Providers**: OpenAI, Anthropic, Google Gemini, OpenRouter, Groq, and Ollama (Local/Cloud).
- **Search**: Serper.dev for web search capabilities.
- **Dynamic Selection**: The `SYSTEM_PROVIDERS` constant is automatically derived from this list for UI dropdowns.

---

## 🌐 API Endpoints (`api.ts`)
All internal routes are centralized in the `API_ENDPOINTS` object. Using these constants ensures that frontend requests always match backend routes.
- **Auth**: Register, forgot password, and session management.
- **Settings**: Specialized endpoints for Persona, Engine, Keys, and Tools.
- **Features**: Dedicated routes for Conversations, Models, Attachments, and YouTube metadata.

---

## 🎙️ Audio & Sounds (`audio.ts`)
Configuration for voice-to-text and UI audio feedback.
- **Beeper/Sounds**: Base64 strings for start/stop beeps in hands-free mode.
- **Customization**: Change the `CHAT_COMPLETION_BEEP` path here to update the sound played when a response finish streaming.

---

## 📂 File Structure Reference

| File | Primary Use Case |
| :--- | :--- |
| [app.ts](../src/lib/constants/app.ts) | Branding, versioning, and logo paths. |
| [services.ts](../src/lib/constants/services.ts) | Full provider/tool registry with API links. |
| [api.ts](../src/lib/constants/api.ts) | **All** internal API endpoints and routes. |
| [audio.ts](../src/lib/constants/audio.ts) | **Sound** files and audio feedback configs. |
| [llm.ts](../src/lib/constants/llm.ts) | Default AI parameters and model choices. |
| [suggestions.ts](../src/lib/constants/suggestions.ts) | Prompt suggestions shown in the empty chat state. |

---

## 🔗 Related Documentation
- **[Architecture Overview](./architecture.md)**: How these constants are consumed by the Brain.
- **[Styling Guide](./styling-guide.md)**: For theme-related constants and Tailwind v4 tokens.
- **[API Reference](./api-reference.md)**: Deep dive into the endpoints defined in `api.ts`.
