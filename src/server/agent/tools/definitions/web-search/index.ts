import { resolveApiKey } from "@/server/agent/utils/api-keys";
import { AppSettings } from "@/features/settings/types";
import { WEB_SEARCH_INSTRUCTIONS } from "@/server/agent/prompt/constants";

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  imageUrl?: string;
  source?: string;
  answerBox?: AnswerBox;
  knowledgeGraph?: KnowledgeGraph;
  video?: { duration?: string; channel?: string; views?: string; date?: string };
  place?: { address?: string; rating?: number; ratingCount?: number; category?: string; phone?: string; cid?: string };
  scholar?: { publication?: string; citedBy?: number };
  shopping?: { price?: string; source?: string; rating?: number; ratingCount?: number; delivery?: string };
}

export interface AnswerBox { title?: string; answer?: string; snippet?: string }
export interface KnowledgeGraph { title?: string; type?: string; description?: string; website?: string; attributes?: Record<string, string> }
export interface PeopleAlsoAsk { question: string; answer?: string; link?: string; title?: string }

interface WebSearchArgs {
  query?: string;
  queries?: string[];
  max?: number;
  location?: string;
  gl?: string;
  type?: SearchType;
  tbs?: string;
}

type SearchType = "search" | "news" | "images" | "videos" | "places" | "scholar" | "shopping";

interface SearchLocation { city?: string; country?: string; countryCode?: string }
interface StatusUpdate { message: string; done?: boolean; data?: unknown }
interface WebSearchSystemOptions { onStatusUpdate?: (params: StatusUpdate) => void; settings?: AppSettings; location?: SearchLocation }

export interface WebSearchResponse {
  results: SearchResult[];
  groups?: { query: string; results: SearchResult[] }[];
  peopleAlsoAsk?: PeopleAlsoAsk[];
  relatedSearches?: string[];
  instructions?: string;
  error?: string;
}

interface SerperResultItem {
  title?: string; link?: string; snippet?: string; description?: string;
  imageUrl?: string; thumbnailUrl?: string; thumbnail?: string; source?: string;
  channel?: string; duration?: string; views?: string; date?: string; address?: string;
  rating?: number; ratingCount?: number; category?: string; phoneNumber?: string;
  cid?: string; publication?: string; citedBy?: number; price?: string; delivery?: string;
}

interface SerperAnswerBox { title?: string; answer?: string; snippet?: string }
interface SerperKnowledgeGraph { title?: string; type?: string; description?: string; website?: string; attributes?: Record<string, string> }
interface SerperPeopleAlsoAskItem { question: string; snippet?: string; link?: string; title?: string }
interface SerperRelatedSearchItem { query: string }

interface SerperExtendedResponse {
  organic?: SerperResultItem[]; news?: SerperResultItem[]; images?: SerperResultItem[];
  videos?: SerperResultItem[]; places?: SerperResultItem[]; scholar?: SerperResultItem[];
  shopping?: SerperResultItem[]; answerBox?: SerperAnswerBox; knowledgeGraph?: SerperKnowledgeGraph;
  peopleAlsoAsk?: SerperPeopleAlsoAskItem[]; relatedSearches?: SerperRelatedSearchItem[]; error?: string;
}

type SanitizedValue = string | number | boolean | null | SanitizedObject | SanitizedValue[];
interface SanitizedObject { [key: string]: SanitizedValue }

const SERPER_BASE = "https://google.serper.dev";
const DEFAULT_MAX = 5;
const MAX_RESULTS_CAP = 40;
const REQUEST_TIMEOUT_MS = 12_000;
const MAX_ATTEMPTS = 3;
const RETRY_BASE_MS = 600;
const DROP_FIELDS = new Set(["data", "base64", "favicon"]);

export const webSearchTool = {
  type: "function",
  name: "web-search",
  description: "Comprehensive research engine. Use the optimal type: places for local queries, images for visual topics, shopping for product discovery, videos for tutorials, scholar for academic research, and search for general snippets. Use queries (max 3) for parallel multi-intent research.",
  parameters: {
    type: "object",
    properties: {
      query: { type: "string", description: "Primary research query." },
      queries: { type: "array", items: { type: "string" }, description: "List of related sub-topics for parallel research." },
      max: { type: "number", description: "Max results per query (1-15, default 5)." },
      location: { type: "string", description: "Specific location for local search (for example, 'New York, NY')." },
      gl: { type: "string", description: "Two-letter country code for regional search. Defaults to user's current country." },
      type: { type: "string", enum: ["search", "news", "images", "videos", "places", "scholar", "shopping"], description: "Specialized mode. Default is 'search'." },
      tbs: { type: "string", description: "Time filter such as qdr:d for 24h or qdr:w for week." },
    },
  },
  execute: webSearch,
};

export async function webSearch(args: WebSearchArgs, sysOptions: WebSearchSystemOptions = {}): Promise<WebSearchResponse> {
  const { query, queries, max = DEFAULT_MAX, type = "search", location: argLocation, gl, tbs } = args;
  const { onStatusUpdate, settings, location: sysLocation } = sysOptions;

  let activeLocation = argLocation;
  if (!activeLocation && sysLocation?.city && sysLocation?.country) {
    activeLocation = `${sysLocation.city}, ${sysLocation.country}`;
  }

  const activeGl = (gl || sysLocation?.countryCode || "us").toLowerCase().slice(0, 2);
  const searchQueries = Array.isArray(queries) ? queries : query ? [query] : [];
  const validQueries = searchQueries.map((item) => (typeof item === "string" ? item.trim() : "")).filter((item) => item.length > 0).slice(0, 3);

  if (validQueries.length === 0) {
    onStatusUpdate?.({ message: "Search queries are empty.", done: true });
    return { results: [], error: "At least one valid query is required." };
  }

  const apiKey = resolveApiKey("serper", settings);
  if (!apiKey) {
    const message = "Serper API key is not configured. Please add it in Settings > Connections.";
    onStatusUpdate?.({ message, done: true });
    return { results: [], error: message };
  }

  const clampedMax = Math.min(Math.max(1, max), MAX_RESULTS_CAP);
  onStatusUpdate?.({ message: "Searching...", data: { isLive: true, activeQueries: validQueries, searchType: type } });

  try {
    const taskResponses = await Promise.all(validQueries.map((searchQuery) => fetchWithRetry(searchQuery, clampedMax, type, activeLocation, activeGl, tbs, apiKey)));
    const combinedResults: SearchResult[] = [];
    const allPeopleAlsoAsk: PeopleAlsoAsk[] = [];
    const allRelated: string[] = [];
    const groups: Array<{ query: string; results: SearchResult[] }> = [];

    taskResponses.forEach((response, index) => {
      combinedResults.push(...response.results);
      if (response.peopleAlsoAsk) allPeopleAlsoAsk.push(...response.peopleAlsoAsk);
      if (response.relatedSearches) allRelated.push(...response.relatedSearches);
      groups.push({ query: validQueries[index], results: response.results });
    });

    const seenUrls = new Set<string>();
    const results = combinedResults.filter((result) => {
      if (!result.url || seenUrls.has(result.url)) return false;
      seenUrls.add(result.url);
      return true;
    });

    const seenQuestions = new Set<string>();
    const peopleAlsoAsk = allPeopleAlsoAsk.filter((item) => {
      if (seenQuestions.has(item.question)) return false;
      seenQuestions.add(item.question);
      return true;
    }).slice(0, 6);

    const relatedSearches = Array.from(new Set(allRelated)).slice(0, 8);
    onStatusUpdate?.({ message: "Research complete.", done: true });

    return {
      results: sanitizeForModel(results),
      groups: sanitizeForModel(groups),
      peopleAlsoAsk: sanitizeForModel(peopleAlsoAsk),
      relatedSearches,
      instructions: WEB_SEARCH_INSTRUCTIONS(type),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    onStatusUpdate?.({ message: `Research engine failed: ${message}`, done: true });
    return { results: [], error: message };
  }
}

async function fetchSerper(query: string, max: number, type: SearchType, location: string | undefined, gl: string, tbs: string | undefined, apiKey: string): Promise<{ results: SearchResult[]; peopleAlsoAsk?: PeopleAlsoAsk[]; relatedSearches?: string[] }> {
  const url = `${SERPER_BASE}/${type === "search" ? "search" : type}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-KEY": apiKey },
      body: JSON.stringify({ q: query, num: max, location: location || undefined, tbs: tbs || undefined, hl: "en", gl }),
      signal: controller.signal,
    });

    if (!res.ok) throw new Error(`Serper HTTP ${res.status}`);
    const body = (await res.json()) as SerperExtendedResponse;
    if (body.error) throw new Error(body.error);

    return {
      results: parseSerperResponse(body, max, type),
      peopleAlsoAsk: body.peopleAlsoAsk?.map((item) => ({ question: item.question, answer: item.snippet, link: item.link, title: item.title })),
      relatedSearches: body.relatedSearches?.map((item) => item.query),
    };
  } finally {
    clearTimeout(timer);
  }
}

function parseSerperResponse(body: SerperExtendedResponse, max: number, type: SearchType): SearchResult[] {
  const results: SearchResult[] = [];
  const answerBox = body.answerBox ? { title: body.answerBox.title, answer: body.answerBox.answer || body.answerBox.snippet } : undefined;
  const knowledgeGraph = body.knowledgeGraph ? { title: body.knowledgeGraph.title, type: body.knowledgeGraph.type, description: body.knowledgeGraph.description, website: body.knowledgeGraph.website, attributes: body.knowledgeGraph.attributes } : undefined;

  const rawList = type === "images" ? body.images ?? [] : type === "videos" ? body.videos ?? [] : type === "places" ? body.places ?? [] : type === "scholar" ? body.scholar ?? [] : type === "shopping" ? body.shopping ?? [] : type === "news" ? body.news ?? [] : body.organic ?? [];

  for (const item of rawList) {
    if (results.length >= max) break;
    const result: SearchResult = { title: item.title?.trim() || "Untitled Result", url: item.link?.trim() || item.imageUrl || "", snippet: item.snippet?.trim() || item.description || "", imageUrl: item.imageUrl || item.thumbnailUrl || item.thumbnail, source: item.source || item.channel };
    if (type === "videos") result.video = { duration: item.duration, channel: item.channel, views: item.views, date: item.date };
    if (type === "places") { result.place = { address: item.address, rating: item.rating, ratingCount: item.ratingCount, category: item.category, phone: item.phoneNumber, cid: item.cid }; if (!result.imageUrl && item.thumbnailUrl) result.imageUrl = item.thumbnailUrl; }
    if (type === "scholar") result.scholar = { publication: item.publication, citedBy: item.citedBy };
    if (type === "shopping") result.shopping = { price: item.price, source: item.source, rating: item.rating, ratingCount: item.ratingCount, delivery: item.delivery };
    if (results.length === 0 && type === "search") { if (answerBox) result.answerBox = answerBox; if (knowledgeGraph) result.knowledgeGraph = knowledgeGraph; }
    if (result.title || result.url) results.push(result);
  }
  return results;
}

async function fetchWithRetry(query: string, max: number, type: SearchType, location: string | undefined, gl: string, tbs: string | undefined, apiKey: string): Promise<{ results: SearchResult[]; peopleAlsoAsk?: PeopleAlsoAsk[]; relatedSearches?: string[] }> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try { return await fetchSerper(query, max, type, location, gl, tbs, apiKey); }
    catch (error) { if (attempt === MAX_ATTEMPTS) throw error; await new Promise((resolve) => setTimeout(resolve, RETRY_BASE_MS * 2 ** (attempt - 1))); }
  }
  throw new Error("Search retry loop exhausted unexpectedly.");
}

function sanitizeForModel<T>(data: T): T {
  if (Array.isArray(data)) return data.map((item) => sanitizeForModel(item)) as T;
  if (data !== null && typeof data === "object") {
    const sanitized: SanitizedObject = {};
    for (const [key, value] of Object.entries(data)) {
      if (DROP_FIELDS.has(key)) continue;
      if (typeof value === "string" && value.length > 5000 && key !== "imageUrl") continue;
      sanitized[key] = sanitizeForModel(value);
    }
    return sanitized as T;
  }
  if (typeof data === "string" || typeof data === "number" || typeof data === "boolean" || data === null) return data;
  return null as T;
}
