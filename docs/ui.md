# 🎨 UI Documentation

Maya AI features a premium, responsive interface built with **React**, **Next.js**, and **Tailwind CSS v4**. This document outlines the core UI components and the layout architecture.

---

## 🏗️ Core Layout

The application follows a standard AI chat layout with a persistent sidebar and a centered chat viewport.

### Sidebar ([src/features/sidebar/components/AppSidebar.tsx](../src/features/sidebar/components/AppSidebar.tsx))
- **Conversation History**: Lists past chats with auto-generated titles.
- **User Profile**: Quick access to account settings.
- **New Chat**: Primary action to start a fresh conversation.

### Chat Viewport ([src/features/chat/components/ChatInterface.tsx](../src/features/chat/components/ChatInterface.tsx))
### Model Selector ([src/features/chat/components/ModelSelector.tsx](../src/features/chat/components/ModelSelector.tsx))
The model selector is dynamically placed based on the screen size:
- **Desktop Header**: Stays persistent in the top bar for quick switching.
- **Mobile Input Box**: On small screens, it's accessible via the **Plus (+)** icon in the chat input toolbar to maximize space for the conversation.

---

## 💬 Message System

Messages are the heart of the UI. They are broken down into **Parts** for granular rendering.

### [MarkdownMessages.tsx](../src/features/chat/components/MarkdownMessages.tsx)
The primary renderer for assistant responses. It handles:
- **Markdown Parsing**: Renders bold text, lists, tables, and links.
- **Syntax Highlighting**: Beautiful code blocks with copy-to-clipboard functionality.
- **LaTeX Support**: Renders mathematical equations using KaTeX.

### [PartsRenderer.tsx](../src/features/chat/components/parts/PartsRenderer.tsx)
A dispatcher that iterates through a message's parts and renders:
- **Reasoning Blocks**: Collapsible "thought" sections.
- **Status Chips**: Animated shimmers showing tool progress (e.g., "Searching web...").
- **Tool Results**: Specialized widgets for specific tool outputs.
- **replyTo Replies**: A "WhatsApp-style" context system where users can select text to reply specifically to a part of the conversation.

### WhatsApp-style replyTo Replies ([src/features/chat/components/ui/SelectionPopup.tsx](../src/features/chat/components/ui/SelectionPopup.tsx))
Maya supports a premium context-aware reply system:
- **Selection Trigger**: Highlighting text within any chat message reveals a floating **"Reply ↵"** button.
- **Context Preview**: Clicking reply docks the replied text in a preview bubble above the chat input.
- **Separate Block Rendering**: In the chat history, replied text is rendered as a distinct, styled mini-bubble above the main message bubble, providing a clear visual hierarchy of the reference context.

---

## 🛠️ UI Widgets

Widgets are specialized components used to visualize structured data returned by tools.

- **Web Search**: Carousel of search result cards with favicons.
- **Weather**: Interactive weather dashboard with icons and forecasts.
- **Image Gen**: Grid of generated images with zoom and download options.
- **YouTube**: Rich channel and video metadata cards.

---

## ✨ Feedback & Animations

Maya feels "alive" through subtle micro-animations and feedback.

- **Shimmers**: We use [TextShimmer](../src/components/ui/shimmer/TextShimmer.tsx) and [CardShimmer](../src/components/ui/shimmer/CardShimmer.tsx) to provide visual feedback while the AI is "thinking" or a tool is "working."
- **Transitions**: Powered by `motion` (Framer Motion) for smooth entry/exit of messages and widgets.
- **Toast Notifications**: Used for system alerts, errors, and success messages (e.g., "Prompt Copied").

---

## 🎨 Theme Support

Maya supports **Light** and **Dark** modes out of the box.
- **Dark Mode**: High-contrast, easy on the eyes, using deep blacks and vibrant primary accents.
- **Light Mode**: Clean, minimal, using soft grays and crisp typography.

> [!TIP]
> Use the **Theme Toggle** button in the header for instant switching, or visit the main **Settings Modal** for full theme control. The **Quick Settings** panel is dedicated to tuning model parameters like **Temperature** and **Top-P** for the current session.
