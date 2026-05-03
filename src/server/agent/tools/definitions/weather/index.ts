import type { ToolExecutorContext } from "@/server/agent/types";

interface WeatherArgs { location?: string; unit?: "celsius" | "fahrenheit" }
interface WeatherSystemOptions { onStatusUpdate?: ToolExecutorContext["onStatusUpdate"]; location?: ToolExecutorContext["location"] }

export interface ForecastDay { date: string; maxTemp: number; minTemp: number; description: string; precipitationChance: number }
export interface WeatherResult { location: string; country: string; temperature: number; feelsLike: number; humidity: number; windSpeed: number; windDirection: string; description: string; uvIndex: number; isDay: boolean; forecast: ForecastDay[] }
interface WeatherToolResult extends WeatherResult { instructions: string }
interface Coordinates { lat: number; lon: number; name: string; country: string }
interface GeocodeResult { lat: string; lon: string; display_name: string }

interface OpenMeteoResponse {
  current: { temperature_2m: number; apparent_temperature: number; relative_humidity_2m: number; wind_speed_10m: number; wind_direction_10m: number; weather_code: number; uv_index: number; is_day: number };
  daily: { time: string[]; weather_code: number[]; temperature_2m_max: number[]; temperature_2m_min: number[]; precipitation_probability_max: Array<number | null> };
}

export const weatherTool = {
  type: "function",
  name: "weather",
  description: "Get current weather and a 5-day forecast for any location.",
  parameters: {
    type: "object",
    properties: {
      location: { type: "string", description: "City or location name. Defaults to the user's current city if omitted." },
      unit: { type: "string", enum: ["celsius", "fahrenheit"], description: "Temperature unit. Defaults to celsius." },
    },
  },
  execute: getWeather,
};

export async function getWeather(args: WeatherArgs, sysOptions: WeatherSystemOptions = {}): Promise<WeatherToolResult> {
  const { onStatusUpdate, location: sysLocation } = sysOptions;
  let location = args.location;
  if (!location && sysLocation?.city) location = sysLocation.city;
  if (!location) throw new Error("Location not provided and could not be detected automatically.");

  const { unit = "celsius" } = args;

  try {
    onStatusUpdate?.({ message: `Finding location: "${location}"...` });
    const coords = await geocode(location);
    onStatusUpdate?.({ message: `Found: ${coords.name}, ${coords.country}` });
    onStatusUpdate?.({ message: "Fetching current weather and 5-day forecast..." });
    const result = await fetchWeather(coords);

    if (unit === "fahrenheit") {
      result.temperature = toF(result.temperature);
      result.feelsLike = toF(result.feelsLike);
      result.forecast = result.forecast.map((forecast) => ({ ...forecast, maxTemp: toF(forecast.maxTemp), minTemp: toF(forecast.minTemp) }));
    }

    onStatusUpdate?.({ message: `Fetched weather for ${result.location}, ${result.country}`, done: true });
    return { ...result, instructions: "NOTE: An interactive weather widget is showing these details to the user. Do not repeat the full table or list. Give a very brief one-sentence summary of current conditions and mention major forecast changes only if useful." };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown weather error";
    onStatusUpdate?.({ message: `Weather failed: ${message}`, done: true, data: { error: message } });
    throw error;
  }
}

async function geocode(location: string): Promise<Coordinates> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`;
  const res = await fetch(url, { headers: { "User-Agent": "AIWeatherTool/1.0 (agentic-chatbot)", Accept: "application/json" }, signal: AbortSignal.timeout(8_000) });
  if (!res.ok) throw new Error(`Geocoding failed: HTTP ${res.status}`);
  const data = (await res.json()) as GeocodeResult[];
  if (data.length === 0) throw new Error(`Location not found: "${location}". Try a more specific name.`);
  const place = data[0];
  return { lat: Number.parseFloat(place.lat), lon: Number.parseFloat(place.lon), name: place.display_name.split(",")[0].trim(), country: place.display_name.split(",").at(-1)?.trim() ?? "" };
}

async function fetchWeather(coords: Coordinates): Promise<WeatherResult> {
  const params = new URLSearchParams({ latitude: coords.lat.toString(), longitude: coords.lon.toString(), current: ["temperature_2m","apparent_temperature","relative_humidity_2m","wind_speed_10m","wind_direction_10m","weather_code","uv_index","is_day"].join(","), daily: ["weather_code","temperature_2m_max","temperature_2m_min","precipitation_probability_max"].join(","), timezone: "auto", forecast_days: "5" });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal: AbortSignal.timeout(8_000) });
  if (res.status === 429) throw new Error("Weather service rate limit reached. Please try again in 1 minute.");
  if (!res.ok) throw new Error(`Weather API failed: HTTP ${res.status}`);
  const data = (await res.json()) as OpenMeteoResponse;
  const { current, daily } = data;
  const forecast: ForecastDay[] = daily.time.map((date, i) => ({ date, maxTemp: Math.round(daily.temperature_2m_max[i]), minTemp: Math.round(daily.temperature_2m_min[i]), description: wmoDescription(daily.weather_code[i]), precipitationChance: daily.precipitation_probability_max[i] ?? 0 }));
  return { location: coords.name, country: coords.country, temperature: Math.round(current.temperature_2m), feelsLike: Math.round(current.apparent_temperature), humidity: current.relative_humidity_2m, windSpeed: Math.round(current.wind_speed_10m), windDirection: degreesToDirection(current.wind_direction_10m), description: wmoDescription(current.weather_code), uvIndex: current.uv_index, isDay: current.is_day === 1, forecast };
}

function toF(celsius: number): number { return Math.round((celsius * 9) / 5 + 32); }
function degreesToDirection(deg: number): string { const dirs = ["N","NE","E","SE","S","SW","W","NW"]; return dirs[Math.round(deg / 45) % 8]; }
function wmoDescription(code: number): string { const map: Record<number, string> = { 0:"Clear sky",1:"Mainly clear",2:"Partly cloudy",3:"Overcast",45:"Foggy",48:"Icy fog",51:"Light drizzle",53:"Moderate drizzle",55:"Dense drizzle",61:"Slight rain",63:"Moderate rain",65:"Heavy rain",71:"Slight snow",73:"Moderate snow",75:"Heavy snow",77:"Snow grains",80:"Slight showers",81:"Moderate showers",82:"Violent showers",85:"Slight snow showers",86:"Heavy snow showers",95:"Thunderstorm",96:"Thunderstorm with hail",99:"Thunderstorm with heavy hail" }; return map[code] ?? "Unknown conditions"; }
