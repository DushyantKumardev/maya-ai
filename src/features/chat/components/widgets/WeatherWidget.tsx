"use client";

import React, { useMemo } from "react";
import { motion } from "motion/react";
import {
  Cloud,
  CloudDrizzle,
  CloudLightning,
  CloudRain,
  CloudSnow,
  Droplets,
  MapPin,
  Moon,
  Sun,
  Thermometer,
  Wind,
  Navigation,
} from "lucide-react";
import { cn } from "@/lib/utils/utils";
import { WidgetProps } from "./index";

// ─── Weather Themes ─────────────────────────────────────────────────────────

type WeatherTheme = {
  gradient: string;
  accent: string;
  glow: string;
  iconColor: string;
};

const WEATHER_THEMES: Record<string, WeatherTheme> = {
  sunny: {
    gradient: "from-chart-3/20 via-chart-3/10 to-transparent",
    accent: "bg-chart-3",
    glow: "shadow-chart-3/20",
    iconColor: "text-chart-3",
  },
  cloudy: {
    gradient: "from-muted-foreground/20 via-muted-foreground/10 to-transparent",
    accent: "bg-muted-foreground",
    glow: "shadow-muted-foreground/20",
    iconColor: "text-muted-foreground",
  },
  rainy: {
    gradient: "from-chart-1/20 via-chart-1/10 to-transparent",
    accent: "bg-chart-1",
    glow: "shadow-chart-1/20",
    iconColor: "text-chart-1",
  },
  stormy: {
    gradient: "from-chart-5/20 via-chart-5/10 to-transparent",
    accent: "bg-chart-5",
    glow: "shadow-chart-5/20",
    iconColor: "text-chart-5",
  },
  snowy: {
    gradient: "from-chart-1/10 via-chart-5/10 to-transparent",
    accent: "bg-chart-1",
    glow: "shadow-chart-1/20",
    iconColor: "text-chart-1",
  },
  night: {
    gradient: "from-chart-5/20 via-primary/10 to-transparent",
    accent: "bg-chart-5",
    glow: "shadow-chart-5/20",
    iconColor: "text-chart-5",
  },
};

function getTheme(condition: string, isDay?: boolean): WeatherTheme {
  const desc = condition.toLowerCase();
  if (desc.includes("thunder") || desc.includes("storm")) return WEATHER_THEMES.stormy;
  if (desc.includes("snow") || desc.includes("sleet") || desc.includes("hail")) return WEATHER_THEMES.snowy;
  if (desc.includes("rain") || desc.includes("shower") || desc.includes("drizzle")) return WEATHER_THEMES.rainy;
  if (desc.includes("cloud") || desc.includes("overcast")) return WEATHER_THEMES.cloudy;
  if (!isDay) return WEATHER_THEMES.night;
  return WEATHER_THEMES.sunny;
}

// ─── Condition Icon Resolver ─────────────────────────────────────────────────

function WeatherIcon({
  condition,
  isDay,
  size = 24,
  className,
}: {
  condition: string;
  isDay?: boolean;
  size?: number;
  className?: string;
}) {
  const desc = condition.toLowerCase();
  const theme = getTheme(condition, isDay);
  
  const iconProps = { size, className: cn(theme.iconColor, className) };

  if (desc.includes("thunder") || desc.includes("storm")) return <CloudLightning {...iconProps} />;
  if (desc.includes("snow") || desc.includes("sleet")) return <CloudSnow {...iconProps} />;
  if (desc.includes("rain") || desc.includes("shower")) return <CloudRain {...iconProps} />;
  if (desc.includes("drizzle")) return <CloudDrizzle {...iconProps} />;
  if (desc.includes("cloud") || desc.includes("overcast")) return <Cloud {...iconProps} />;
  if (!isDay) return <Moon {...iconProps} />;
  return <Sun {...iconProps} />;
}

// ─── Forecast Day Card ───────────────────────────────────────────────────────

function ForecastDay({ day, idx }: { day: any; idx: number }) {
  const label = idx === 0 ? "Today" : idx === 1 ? "Tmrw" : new Date(day.date).toLocaleDateString("en-US", { weekday: "short" });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + idx * 0.05 }}
      className={cn(
        "flex flex-1 flex-col items-center gap-1.5 rounded-2xl px-1 py-3 transition-all duration-300",
        idx === 0
          ? "bg-foreground/5 border border-foreground/10 shadow-sm"
          : "hover:bg-foreground/5 border border-transparent"
      )}
    >
      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/80">{label}</p>
      <div className="my-0.5">
        <WeatherIcon condition={day.description ?? ""} isDay={true} size={18} />
      </div>
      <div className="text-center leading-tight">
        <p className="text-xs font-bold text-foreground">
          {day.maxTemp}°
        </p>
        <p className="text-[10px] font-medium text-muted-foreground/60">{day.minTemp}°</p>
      </div>
      {(day.precipitationChance ?? 0) > 10 && (
        <div className="mt-0.5 flex items-center gap-0.5 text-[8px] font-bold text-chart-1/80">
          <Droplets size={7} />
          {day.precipitationChance}%
        </div>
      )}
    </motion.div>
  );
}

// ─── Stat Chip ───────────────────────────────────────────────────────────────

function StatChip({ icon, label, value, delay = 0 }: { icon: React.ReactNode; label: string; value: string; delay?: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className="group flex items-center gap-3 rounded-2xl bg-foreground/3 border border-foreground/5 px-3 py-2.5 transition-colors hover:bg-foreground/5"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-background shadow-sm border border-border/50 text-muted-foreground group-hover:text-foreground transition-colors">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground/50 leading-none mb-1">
          {label}
        </p>
        <p className="text-sm font-bold text-foreground leading-none truncate">{value}</p>
      </div>
    </motion.div>
  );
}

// ─── Main Widget ─────────────────────────────────────────────────────────────

export const WeatherWidget = React.memo(function WeatherWidget({ part }: WidgetProps) {
  const data = (part.type === "status" ? part.data : part.result) as any;

  const theme = useMemo(() => getTheme(data?.description || "", data?.isDay), [data?.description, data?.isDay]);

  if (!data || data.error) return null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="my-4 w-full max-w-sm"
    >
      <div className="relative overflow-hidden rounded-[2.5rem] border border-border/50 bg-card/80 backdrop-blur-3xl shadow-2xl">
        
        {/* Background Glow Effect */}
        <div className={cn("absolute -top-24 -right-24 h-64 w-64 rounded-full blur-[80px] opacity-20 transition-colors duration-1000", theme.accent)} />
        <div className={cn("absolute inset-0 bg-linear-to-br opacity-[0.15] transition-all duration-1000", theme.gradient)} />

        {/* ── Header Section ── */}
        <div className="relative z-10 px-6 pt-8 pb-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground/80">
                <MapPin size={14} />
                <span className="text-xs font-bold tracking-tight">{data.location}</span>
              </div>
              <div className="flex items-start">
                <span className="text-7xl font-black tracking-tighter text-foreground drop-shadow-sm">
                  {data.temperature}
                </span>
                <span className="mt-3 text-2xl font-bold text-muted-foreground/40">°C</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("h-2 w-2 rounded-full animate-pulse", theme.accent)} />
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                  {data.description}
                </p>
              </div>
            </div>

            <motion.div 
              animate={{ 
                y: [0, -4, 0],
                rotate: data.isDay ? [0, 5, 0] : [0, -2, 0]
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className={cn(
                "flex h-24 w-24 items-center justify-center rounded-4xl bg-background/50 backdrop-blur-xl border border-foreground/10 shadow-xl ring-1 ring-black/5",
                theme.glow
              )}
            >
              <WeatherIcon
                condition={data.description ?? ""}
                isDay={data.isDay}
                size={48}
              />
            </motion.div>
          </div>

          {/* Secondary Info Bar */}
          <div className="mt-8 flex items-center justify-between gap-4">
             <div className="flex items-center gap-2 rounded-2xl bg-foreground/3 px-4 py-2 border border-foreground/5">
                <Thermometer size={14} className="text-muted-foreground" />
                <p className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-wider">
                  Feels like <span className="text-foreground">{data.feelsLike}°</span>
                </p>
             </div>
             <div className="flex items-center gap-2 rounded-2xl bg-foreground/3 px-4 py-2 border border-foreground/5">
                <Navigation size={14} className="text-muted-foreground -rotate-45" />
                <p className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-wider">
                  UV Index <span className="text-foreground">{data.uvIndex || 0}</span>
                </p>
             </div>
          </div>
        </div>

        {/* ── Detailed Stats Grid ── */}
        <div className="relative z-10 grid grid-cols-2 gap-3 px-6 pb-6">
          <StatChip
            icon={<Droplets size={16} />}
            label="Humidity"
            value={`${data.humidity}%`}
            delay={0.1}
          />
          <StatChip
            icon={<Wind size={16} />}
            label="Wind Speed"
            value={`${data.windSpeed} km/h`}
            delay={0.15}
          />
        </div>

        {/* ── Forecast Section ── */}
        {data.forecast?.length > 0 && (
          <div className="relative z-10 px-6 pb-8">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">5-Day Forecast</h4>
              <div className="h-px flex-1 ml-4 bg-foreground/5" />
            </div>
            <div className="flex gap-2">
              {data.forecast.slice(0, 5).map((day: any, idx: number) => (
                <ForecastDay key={idx} day={day} idx={idx} />
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  const prevData = prevProps.part.type === "status" ? prevProps.part.data : prevProps.part.result;
  const nextData = nextProps.part.type === "status" ? nextProps.part.data : nextProps.part.result;
  return JSON.stringify(prevData) === JSON.stringify(nextData);
});