export * from "./speech-to-text-converter"

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));


/**
 * Extracts the apex (root) domain from a hostname, stripping subdomains.
 * Examples:
 *   img.youtube.com   → youtube.com
 *   www.bbc.co.uk     → bbc.co.uk
 *   docs.github.com   → github.com
 *   google.com        → google.com
*/
function getApexDomain(hostname: string): string {
  const parts = hostname.split(".");
  if (parts.length <= 2) return hostname; // already apex
  
  // Known second-level TLDs used in country-code domains.
  // For these, we need 3 parts to get the apex domain (e.g. bbc.co.uk → bbc.co.uk).
  const CC_SLDS = new Set([
    "co", "com", "net", "org", "gov", "edu", "ac", "ne", "or", "me",
  ]);
  const tld = parts[parts.length - 1];           // e.g. "uk", "com"
  const sld = parts[parts.length - 2];           // e.g. "co", "youtube"

  // Country-code SLD pattern: short + known keyword (e.g. co.uk, com.au)
  if (tld.length === 2 && CC_SLDS.has(sld)) {
    // Take last 3 parts → e.g. bbc.co.uk
    return parts.slice(-3).join(".");
  }

  // Default: take last 2 parts → e.g. youtube.com
  return parts.slice(-2).join(".");
}

export const getFaviconByDomainUrl = (url: string) => {
  if (!url || url.length < 4) return "";

  try {
    const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;
    const urlObj = new URL(normalizedUrl);
    const hostname = urlObj.hostname;

    const parts = hostname.split(".");
    const dotCount = parts.length - 1;
    const lastPart = parts[parts.length - 1];

    // Must have at least one dot, and TLD must be 2–10 chars
    if (dotCount < 1 || lastPart.length < 2 || lastPart.length > 10) {
      return "";
    }

    // Use the apex domain for the favicon so subdomains (img.youtube.com)
    // resolve to the correct brand icon (youtube.com)
    const apexDomain = getApexDomain(hostname);

    return `https://www.google.com/s2/favicons?domain=${apexDomain}&sz=64`;
  } catch {
    return "";
  }
};
