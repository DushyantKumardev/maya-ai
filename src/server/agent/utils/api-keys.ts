import { decrypt } from "@/server/utils/crypto";
import { AppSettings } from "@/features/settings/types";
import { SERVICES } from "@/lib/constants/services";

/**
 * Resolves an API key for a given service.
 *
 * Resolution Order:
 * 1. User Settings (Encrypted) — decrypts and returns if found.
 * 2. Ollama default — returns "ollama" for local instances.
 *
 * @param serviceId - The unique service identifier (e.g. "serper", "openai").
 * @param settings  - The user's application settings.
 */
export function resolveApiKey(serviceId: string, settings?: AppSettings): string {
  const service = SERVICES.find((s) => s.id === serviceId);
  const idsToTry = [serviceId];
  if (service?.apiKeyId) idsToTry.push(service.apiKeyId);

  const mask = "••••••••••••••••";
  for (const id of idsToTry) {
    const userKey = settings?.apiKeys?.[id];
    if (userKey && userKey !== mask) {
      try {
        const decrypted = decrypt(userKey);
        if (decrypted && decrypted !== mask) return decrypted;
      } catch (e) {
        console.error(`Failed to decrypt API key for ${id}:`, e);
      }
    }
  }

  if (serviceId === "ollama") return "ollama";

  return "";
}
