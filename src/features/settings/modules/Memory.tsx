"use client";

import { Save, MessageSquare, Brain, Trash2, History as HistoryIcon } from "lucide-react";
import { SettingsSection, SettingsCard, SettingsItem } from "../components/SettingsUI";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { AppSettings, Memory } from "@/features/settings/types";

interface ModuleProps {
  draftSettings: AppSettings;
  updateDraft: <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
  ) => void;
}

export default function MemoryModule({
  draftSettings,
  updateDraft,
}: ModuleProps) {
  const updateHistory = (updates: Partial<AppSettings>) => {
    Object.entries(updates).forEach(([key, val]) => {
      updateDraft(key as keyof AppSettings, val as any);
    });
  };

  const clearMemories = () => {
    if (window.confirm("Are you sure you want to clear all memories? This cannot be undone.")) {
      updateHistory({ memories: [] });
    }
  };

  const removeMemory = (id: string) => {
    const memories = draftSettings.memories || [];
    const updatedMemories = memories.filter(m => m.id !== id);
    updateHistory({ memories: updatedMemories });
  };

  return (
    <div className="space-y-10 pb-10 max-w-xl">
      <SettingsSection 
        title="Memory" 
        description="Control how Maya retains conversation context and historical facts."
      >
        <SettingsCard className="space-y-6">
          <SettingsItem
            label="Persist Conversations"
            description="Automatically save your chat history across sessions and devices."
            icon={Save}
          >
            <Switch
              checked={draftSettings.persistConversations}
              onCheckedChange={(v) => updateHistory({ persistConversations: v })}
            />
          </SettingsItem>

          <SettingsItem
            label="Context Window Size"
            description="Total number of recent messages kept in active memory before summarization."
            icon={MessageSquare}
          >
            <div className="flex items-center gap-2 w-24">
              <Input
                type="number"
                min={2}
                max={100}
                value={draftSettings.maxMessagesPerConversation}
                onChange={(e) =>
                  updateHistory({
                    maxMessagesPerConversation: parseInt(e.target.value) || 20,
                  })
                }
                className="h-8 text-xs bg-background/50 border-border/40"
              />
            </div>
          </SettingsItem>

          <SettingsItem
            label="Summarize Threshold"
            description="Number of messages to batch together when performing background summarization."
            icon={HistoryIcon}
          >
            <div className="flex items-center gap-2 w-24">
              <Input
                type="number"
                min={1}
                max={50}
                value={draftSettings.summarizeAfter}
                onChange={(e) =>
                  updateHistory({
                    summarizeAfter: parseInt(e.target.value) || 10,
                  })
                }
                className="h-8 text-xs bg-background/50 border-border/40"
              />
            </div>
          </SettingsItem>
        </SettingsCard>

        <SettingsCard className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background border border-border/20 text-primary shadow-sm">
                <Brain className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">Stored Facts</span>
            </div>
            {draftSettings.memories && draftSettings.memories.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={clearMemories}
                className="h-7 text-[10px] text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Clear All
              </Button>
            )}
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
            {(!draftSettings.memories || draftSettings.memories.length === 0) ? (
              <div className="p-8 border border-dashed border-border/40 rounded-xl text-center bg-background/5">
                <p className="text-xs text-muted-foreground">No memories saved yet.</p>
              </div>
            ) : (
                draftSettings.memories.map((memory: Memory) => (
                <div 
                  key={memory.id}
                  className="flex items-start justify-between p-3 rounded-lg bg-background/40 border border-border/10 group hover:border-primary/20 transition-all"
                >
                  <p className="text-sm text-foreground flex-1 pr-4 leading-relaxed">{memory.content}</p>
                  <Button 
                    variant="ghost"
                    size="icon"
                    onClick={() => removeMemory(memory.id)}
                    className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </SettingsCard>
      </SettingsSection>
    </div>
  );
}
