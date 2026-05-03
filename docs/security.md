# 🛡️ Security & Privacy

Maya AI is built with a **Privacy-First** philosophy. This document explains how we protect your data, API keys, and conversation history.

---

## 🔐 API Key Protection

All sensitive credentials (like OpenAI, Anthropic, or Google API keys) are encrypted before being stored in the database.

### Encryption Standard
- **Algorithm**: `aes-256-gcm` (Authenticated Encryption).
- **Implementation**: Handled in [src/server/utils/crypto.ts](../src/server/utils/crypto.ts).
- **Key Derivation**: Uses the `MAYA_ENCRYPTION_KEY` environment variable.
- **Salt & IV**: A unique 12-byte Initialization Vector (IV) is generated for every encryption operation to prevent pattern matching.

### Masking in UI
In the Settings interface, API keys are always masked (e.g., `••••••••`). The system never sends the raw, decrypted key back to the browser unless it's being used for a secure server-side request.

---

## 👻 Incognito Mode (Privacy)

Maya features a dedicated **Incognito Mode** for ephemeral sessions.

- **Non-Persistence**: When Incognito is active, conversations are **not** saved to MongoDB.
- **Session-Only Memory**: The AI has access to the current conversation context, but once the tab is closed or a "New Chat" is started, all history is wiped.
- **Database Privacy**: Messages in incognito mode are never written to disk, ensuring no trace of the conversation remains.

---

## 📁 Data Persistence

For standard (non-incognito) chats, Maya uses **MongoDB** to provide a seamless experience across sessions.

- **Local Storage**: We use local storage for UI preferences (like theme) but never for sensitive chat data or API keys.
- **Encrypted Fields**: In addition to API keys, any field marked as sensitive in the [Settings Schema](../src/server/db/models/settings-model.ts) is encrypted.

---

## 🌐 Communication Security

- **Direct Provider Connections**: Maya connects directly to AI providers (OpenAI, Anthropic, etc.) from your hosting environment. There is no intermediate "Maya Cloud" or proxy; your data travels directly between your server and the provider's API.
- **Local LLMs**: When using **Ollama**, all traffic stays within your local machine or network. No data is sent to external servers.

---

## 🛡️ Best Practices for Users

1.  **Use a Strong Encryption Key**: Ensure your `MAYA_ENCRYPTION_KEY` is a long, random string.
2.  **Rotate Keys Regularly**: If you suspect your environment variables have been compromised, rotate your encryption key and re-enter your API keys.
3.  **Use Incognito for Sensitive Tasks**: If you are working with sensitive data that you don't want stored in your history, always toggle Incognito Mode.
