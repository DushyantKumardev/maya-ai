import OpenAI from "openai";
import { SERVICES } from "@/lib/constants/services";
import type { AppSettings } from "@/features/settings/types";
import { resolveApiKey } from "@/server/agent/utils/api-keys";

/**
 * Layer 1 — Provider
 *
 * Factory that creates an OpenAI-compatible client for any configured provider.
 *
 * Resolution order:
 *  1. Look up the provider in SERVICES by id.
 *  2. Resolve API key via resolveApiKey().
 */
const createProvider = (
  providerId: string,
  settings?: AppSettings,
): OpenAI => {
  const service = SERVICES.find((s) => s.id === providerId);

  if (!service) {
    throw new Error(`Provider "${providerId}" not found in system services`);
  }

  const apiKey = resolveApiKey(providerId, settings);

  return new OpenAI({
    baseURL: service.baseURL || "http://localhost:11434/v1",
    apiKey,
  });
};

export default createProvider;
