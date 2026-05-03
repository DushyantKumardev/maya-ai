# 🔐 Environment Variables

Maya AI uses environment variables for core configuration like database connections, authentication secrets, and encryption keys.

---

## 🛠️ Essential Variables

Copy `.env.example` to `.env` to get started:

```bash
cp .env.example .env
```

| Variable | Description | Default |
| :--- | :--- | :--- |
| `MONGODB_URI` | Your MongoDB connection string. Supports Local and Atlas. | `mongodb://localhost:27017/maya-ai` |
| `MAYA_ENCRYPTION_KEY` | **CRITICAL**: 32-character key used for AES-256-GCM encryption of your API keys in the database. | (None) |
| `NEXT_PUBLIC_APP_URL` | The base URL of your application. Used for redirects and links. | `http://localhost:3000` |
| `AUTH_SECRET` | A random string used to sign and encrypt session cookies (Auth.js). | (None) |
| `AUTH_URL` | The base URL for authentication endpoints. | `http://localhost:3000` |
| `AUTH_TRUST_HOST` | Set to `true` to allow Auth.js to trust the host header. | `true` |
| `NODE_ENV` | The application environment mode (e.g., `development`, `production`). | `development` |

---

## 🛡️ Security & Encryption

### `MAYA_ENCRYPTION_KEY`
This is arguably the most important variable. Maya AI encrypts all external API keys (OpenAI, Anthropic, etc.) before storing them in MongoDB. 

- **Lost Key**: If you lose this key, you will not be able to decrypt and use your saved API keys. You will need to re-enter them in the UI.
- **Changed Key**: If you change this key, existing encrypted data in the database will become unreadable.
- **Format**: It should be a strong, random 32-character string.

### Auth Secret
The `AUTH_SECRET` is used by Auth.js to secure user sessions. You can generate one quickly using:
```bash
openssl rand -base64 32
```

---

## 🌐 Next Steps
After configuring your `.env` file, proceed to the **[Getting Started](./getting-started.md)** guide to run the application.
