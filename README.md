# <img src="./public/logo-white.svg" alt="Sales chart" width="30"> Maya AI

**High-performance, privacy-first agentic AI assistant built for the modern web.**

Maya AI is not just another chat interface. It is a powerful, extensible "Brain" designed to reason, search, and execute tasks with precision. Built with **Next.js 16** and **Tailwind CSS v4**, Maya delivers a premium, low-latency experience for both local and cloud-based AI workflows.

![Maya AI Interface](./public/demo/image.png)

---

## ✨ Key Features

- **🧠 Multi-Model Intelligence**: Seamlessly switch between OpenAI, Anthropic, Google Gemini, and **Local LLMs** via Ollama or Ollama Cloud.
- **🌍 Tool-Powered Reasoning**: Built-in agents for Web Search, Weather, Image Generation, and YouTube metadata.
- **🎨 Premium UI/UX**: A stunning, responsive interface with glassmorphism, shimmer loading states, and smooth micro-animations.
- **🛡️ Privacy-First Design**: 
  - **Incognito Mode** for ephemeral ( _Incognito_ ) chats.
  - **AES-256-GCM Encryption** for sensitive API credentials.
  - **Local-First** optimization for total data sovereignty.
- **📊 Robust Memory**: Persistent conversation history and session management powered by MongoDB.
- **🚀 Pipeline-First Architecture**: Decoupled 7-layer processing engine for ultra-low latency and modular extensibility.
- **📚 Highly Extensible**: Easily add your [own Tools](./docs/extending-maya.md#️-adding-a-new-tool), [AI Providers](./docs/extending-maya.md#-adding-an-ai-provider), and [custom UI Widgets](./docs/extending-maya.md#-adding-an-widget).

---

## 🏗️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/) & [Lucide Icons](https://lucide.dev/)
- **Database**: [MongoDB](https://www.mongodb.com/)
- **Authentication**: [NextAuth.js v5](https://next-auth.js.org/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/DushyantKumardev/maya-ai.git
cd maya-ai
npm install
```

### 2. Configure
Copy `.env.example` to `.env` and configure your [Environment Variables](./docs/environment-variables.md).

### 3. Run
```bash
npm run dev
```
Visit [http://localhost:3000](http://localhost:3000) to get started.

---

## 📚 Documentation

Explore our comprehensive guides to master Maya:

- 🚀 **[Getting Started](./docs/getting-started.md)**: Full installation and setup guide.
- 🧠 **[Prompts](./docs/prompts.md)**: Deep dive into the Prompt Engineering layer.
- 🏗️ **[Architecture](./docs/architecture.md)**: Deep dive into the "Brain" and data flow.
- 🎨 **[UI & Styling](./docs/ui.md)**: Guide to components and **[Tailwind v4](./docs/styling-guide.md)**.
- 🔐 **[Environment Variables](./docs/environment-variables.md)**: Full configuration and security details.
- 🛠️ **[Extending Maya](./docs/extending-maya.md)**: How to add new Tools and Widgets.
- 🗝️ **[Constants](./docs/constants.md)**: Global configuration and service registry.
- 🛡️ **[Security & Privacy](./docs/security.md)**: How we protect your data.
- 📖 **[API Reference](./docs/api-reference.md)**: Details on internal endpoints.

---

## 📜 Changelog

Stay updated with the latest features and fixes in our **[Changelog](./CHANGELOG.md)**.

---

## 🤝 Contributing

Contributions are welcome! Please read our **[Contributing Guide](./CONTRIBUTING.md)** to get started. You can also check the **[Extending Maya](./docs/extending-maya.md)** guide to see how you can add new capabilities.

---

## 📄 License

This project is licensed under the **Maya Community License** - see the [LICENSE](LICENSE) file for details. Large entities require explicit approval for commercial use.
