import React from "react";
import { MessagePart } from "@/features/chat/types";
import TunelinkWidget from "./tunelink/TunelinkWidget";
import ImageGenWidget from "./ImageGenWidget";
import { WeatherWidget } from "./WeatherWidget";
import YtThumbnailWidget from "./YtThumbnailWidget";

import WebSearchWidget from "./WebSearchWidget";

export interface WidgetProps {
  part: MessagePart & ({ type: "status" } | { type: "tool_result" });
  messageId: string;
}

export const WIDGET_REGISTRY: Record<string, React.ComponentType<WidgetProps>> = {
  tunelink: TunelinkWidget,
  "image-gen": ImageGenWidget,
  weather: WeatherWidget,
  "yt-thumbnail": YtThumbnailWidget,
  "web-search": WebSearchWidget,
};
