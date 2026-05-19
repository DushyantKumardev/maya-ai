# 📜 Changelog

All notable changes to **Maya AI** will be documented in this file.

---

## [1.1.2] - 2026-05-19

### Added & Improved

- **App-Wide Transactional Email Engine**: Implemented a global, system-wide email delivery module supporting SMTP and Resend API protocols. This provides unified transactional mailing (such as account recovery and security verification alerts) across the entire application, as opposed to an AI assistant tool for sending emails to users.
- **Environment Documentation**: Updated `.env.example` to detail SMTP and Resend API variables (`GLOBAL_ENV_SMTP_*` and `GLOBAL_ENV_RESEND_*`) for production deployments.
- **Form State Consolidation**: Merged multi-state handlers into a single `formData` object state inside `RegisterForm` and `ForgotPasswordForm` to optimize React rendering performance.
- **Client Session & Prefetch Optimization**:
  - Integrated server-side pre-hydration using layout cookie resolution (`auth()`) to eliminate all initial client-side `/api/auth/session` roundtrips.
  - Disabled background tab focus automatic refetching (`refetchOnWindowFocus={false}`) to stop unnecessary parallel session sync pings when switching browser tabs.
  - Disabled automatic viewport prefetching for chat history links (`prefetch={false}` in `ConversationList.tsx`) to prevent massive, concurrent server/database queries for every visible chat ID on sidebar render.
- **Input Validation**:
  - **Email Validator**: Implemented real-time structural verification and blacklisted temporary/disposable domains along with keyboard-spam prefixes.
  - **Password Strength Engine**: Enforced strict rules requiring at least 8 characters, lowercase & uppercase letters, numbers, and special symbols, linked to a dynamic 4-bar visual strength meter.
- **UI & UX Enhancements**:
  - Improved the design of login, register and forgot password pages to make them more user-friendly and visually appealing.

---

## [1.1.1] - 2026-05-18

### Added & Improved

- **Virtual Keyboard Avoidance**: Built a custom virtual keyboard handler to prevent active textareas and message inputs from hiding behind the software keyboard on mobile.
- **Audio Autoplay Lock**: Restricted music widget automatic playback to target only the freshly generated tool calls within the active streaming message, completely blocking historical song widgets from autoplaying when a chat is loaded from history.
- **Playback Session Autostop**: Linked the global playback session with the active conversation. Switching chat rooms or returning home automatically halts current music, ensuring background tracks never bleed between conversations.
- **Luxury Header Music Player**: Re-designed the global music player into a futuristic, integrated sticky card placed directly below the app header. Features an SVG circular progress ring wrapping the rotating cover art, a custom-animated bouncing equalizing wave visualizer, and single-tap mute/dismiss controls.
- **Flat System Info Panel**: Overhauled the Settings `System` tab into a flat, native-looking read-only specs layout. Displays system details (Next.js, MongoDB, NextAuth, Multi-LLM), grouped resource actions, and an interactive developer profile badge loaded with a real-time GitHub avatar dynamically.
- **Collapsible Questionnaires**: Implemented accordion collapsing for completed assistant question lists to maintain a clean chat canvas, including full inline rendering and custom skip actions.

---

## [1.1.0] - 2026-05-17

### Added

- **Cloud Mode (`NEXT_PUBLIC_APP_MODE`)**: Added a setting to switch between `self-hosted` (local disk storage) and `cloud` (Cloudinary cloud storage) modes.
- **Incognito Mode (Ghost Mode)**: Added a local-only chat option that keeps conversations in browser memory and bypasses MongoDB saves entirely.
- **Mode Toggle Safeguards**: Configured automatic session resets when switching privacy modes to keep chats separate, and enabled auto-upgrades if a local chat is switched to standard mode.

### Changed & Improved

- **Sidebar & Header Caching**: Added an in-memory title cache to eliminate redundant network reads when switching conversations or toggling the sidebar.
- **Strict Mode Concurrency Guard**: Added a loading reference tracker to discard duplicate concurrent database fetches caused by React Strict Mode in development.
- **Optimistic UI Rendering**: Updated the submission logic to clear inputs instantly and show image preview thumbnails before upload completion.
- **Serverless and Vercel Compatibility**: Intercepted cloud assets and routed them via API redirects, eliminating direct disk-write dependencies for static production builds.

---

## [1.0.0] - 2026-05-03

### 🚀 Initial Stable Release

This marks the first stable release of **Maya AI**, a high-performance, privacy-focused agentic AI assistant. Built with a modular, pipeline-first architecture, Maya is designed for visual excellence, low latency, and infinite extensibility.

#### 🧠 Pipeline-First Architecture

- **Layered Intelligence**: Core logic decoupled into 7 specialized layers: `Provider`, `Context`, `Prompt`, `Memory`, `Tools`, `Stream`, and `Orchestrator`.
- **High Performance**: Streamlined message processing and prompt assembly for minimal Time to First Token (TTFT).
- **Vision-via-Tool**: A simplified, robust vision system that delegates image analysis to a dedicated tool with a multi-stage fallback chain (User Model → Ollama Cloud → Ollama Local).

#### 🛠️ Extensible Tool System

- **Unified Registry**: A central manifest for all agent capabilities, ensuring a consistent contract for both LLM schemas and execution logic.
- **Built-in Plugins**: Standard support for Web Search, Weather updates, Image Generation, Document Reading, and YouTube metadata extraction.

#### 🎨 Premium UI/UX

- **Visual Excellence**: Crafted with **Tailwind CSS v4** and **Shadcn UI** for a stunning, state-of-the-art interface.
- **Interactive Widgets**: Tool results are rendered as rich, interactive components (e.g., Search Cards, Weather Dashboards).
- **Micro-Animations**: Smooth transitions and shimmer loading states powered by Framer Motion.

#### 🛡️ Privacy & Security

- **AES-256-GCM Encryption**: All sensitive API credentials are encrypted at rest.
- **Incognito Mode**: Support for ephemeral, non-persisted chat sessions.
- **Local-First Focus**: Optimized for local LLMs via Ollama to keep sensitive data on your hardware.

#### 📊 Robust Memory & Context

- **Modular Prompting**: A sophisticated system that assembles prompts from Persona, Memory, Rules, and Context layers.
- **Smart History**: Intelligent conversation summarization and token management powered by MongoDB.
- **Long-Term Memory**: Automatic extraction of user facts and preferences to personalize interactions over time.

#### 📚 Developer Ready

- **Comprehensive Docs**: Full documentation suite covering Architecture, Tool Extension, Security, and UI guides.
- **Modern Tech Stack**: Built on Next.js 16 (App Router), TypeScript, and MongoDB.
