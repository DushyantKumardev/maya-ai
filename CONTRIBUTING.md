# 🤝 Contributing to Maya AI

First off, thank you for considering contributing to Maya AI! It's people like you who make Maya a powerful tool for everyone.

This document provides guidelines for contributing to the project. These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

---

## 🚀 How Can I Contribute?

### 🛠️ Adding New Tools
One of the best ways to contribute is by adding new AI tools. Whether it's a financial data fetcher, a code runner, or a music controller, we love seeing new capabilities.
- **Guide**: Check out **[Extending Maya](./docs/extending-maya.md)** for a step-by-step tutorial.

### 🎨 Improving the UI
If you have an eye for design, help us make Maya even more beautiful.
- **Guidelines**: Follow the **[Styling Guide](./docs/styling-guide.md)** and **[UI Documentation](./docs/ui.md)**.
- **Tech**: We use Tailwind CSS v4 and Framer Motion.

### 🐛 Reporting Bugs
If you find a bug, please open an issue and include:
- A clear, descriptive title.
- Steps to reproduce the issue.
- Your environment (Browser, OS, Node version).
- Any relevant logs or screenshots.

---

## 💻 Development Workflow

### 1. Fork & Clone
Fork the repository and clone it to your local machine.

### 2. Create a Branch
Use a descriptive name for your branch:
- `feat/add-spotify-tool`
- `fix/sidebar-alignment-mobile`
- `docs/update-security-guide`

### 3. Coding Standards
- **TypeScript**: We use strict TypeScript. Ensure your types are accurate.
- **Tailwind CSS v4**: Use utility classes wherever possible. Follow the design tokens in `globals.css`.
- **Formatting**: We use Prettier for consistent formatting.

### 4. Commit Messages
Write clear, concise commit messages:
- `feat: add weather tool with openweather integration`
- `fix: resolve hydration error in model selector`
- `docs: clarify tool registration process`

---

## 🛠️ Local Development Environment

- **Node.js**: v20+ recommended.
- **MongoDB**: Ensure you have a local instance running or a valid Atlas URI.
- **Environment**: Keep your `.env` file up to date with the latest keys.

---

## 📮 Pull Request Process

1.  **Update Documentation**: If you added a feature or changed a workflow, update the corresponding file in `docs/`.
2.  **Self-Review**: Look over your changes and remove any debug logs or commented-out code.
3.  **PR Description**: Explain *what* you changed and *why*.
4.  **Wait for Review**: We'll review your PR as soon as possible!

---

## 📜 Code of Conduct
By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

Thank you for building the future of Maya AI with us! 🚀
