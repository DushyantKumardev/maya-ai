import * as React from "react";
import { usePathname } from "next/navigation";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils/utils";
import {
  Plus, StopCircle, ArrowUp, Mic, Brain, Sparkles, Zap, ZapOff, Check,
  Image as ImageIcon, X,
  Loader2,
  Reply,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { useSpeechToText } from "../../hooks/use-speech-to-text";
import { ImagePreview } from "./ImagePreview";
import { FileAttachmentPreview } from "./FileAttachmentPreview";
import { TextFile } from "@/features/chat/types";
import {
  inferAttachmentKind,
  supportsTextExtraction,
  truncateExtractedText,
} from "@/lib/attachments";
import ModelSelector from "../ModelSelector";
import { ReasoningEffort } from "@/features/chat/types";
import { useChatContext } from "@/features/chat/context/ChatContext";

const REASONING_OPTIONS: {
  value: ReasoningEffort;
  label: string;
  icon: React.ElementType;
  color: string;
  desc: string;
}[] = [
  { value: "none",   label: "None",   icon: ZapOff,    color: "text-muted-foreground", desc: "Fastest response, no extra thinking" },
  { value: "low",    label: "Low",    icon: Zap,        color: "text-blue-400",         desc: "Brief reasoning for simple tasks" },
  { value: "medium", label: "Medium", icon: Brain,      color: "text-primary",          desc: "Standard reasoning for most tasks" },
  { value: "high",   label: "High",   icon: Sparkles,   color: "text-purple-500",       desc: "Deep reasoning for complex problems" },
];

const LARGE_TEXT_THRESHOLD = 1000;
const ACCEPTED_ATTACHMENT_TYPES = [
  "image/*", ".txt", ".md", ".markdown", ".mdx", ".json", ".jsonl", ".csv", ".tsv",
  ".html", ".htm", ".xml", ".svg", ".yaml", ".yml", ".toml", ".js", ".jsx", ".ts",
  ".tsx", ".py", ".java", ".go", ".rs", ".c", ".cpp", ".cs", ".php", ".css", ".scss",
  ".sql", ".sh", ".pdf",
].join(",");

interface ChatInputBoxProps {
  textInput: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSubmit: (
    e?: React.FormEvent | null,
    imageData?: string | null,
    overrideContent?: string,
    files?: UploadableAttachment[],
  ) => void;
  isLoading: boolean;
  stop: () => void;
  isStreaming: boolean;
  setTextInput: React.Dispatch<React.SetStateAction<string>>;
  reasoningEffort: ReasoningEffort;
  setReasoningEffort: (effort: ReasoningEffort) => void;
  replyTo: string | null;
  setReplyTo: (quote: string | null) => void;
}

type UploadableAttachment = TextFile & { dataUrl: string };

const ChatInputBox = React.forwardRef<HTMLTextAreaElement, ChatInputBoxProps>(
  (
    {
      textInput,
      handleInputChange,
      handleSubmit,
      isLoading,
      stop,
      isStreaming,
      setTextInput,
      reasoningEffort,
      setReasoningEffort,
      replyTo,
      setReplyTo,
    },
    ref,
  ) => {
    const internalTextareaRef = React.useRef<HTMLTextAreaElement>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const [imagePreview, setImagePreview] = React.useState<string | null>(null);
    const [textAttachments, setTextAttachments] = React.useState<UploadableAttachment[]>([]);
    const pathname = usePathname();
    const isChatPageWithId = pathname.includes("/c/");

    const { messages } = useChatContext();

    const hasActiveQuestionnaire = React.useMemo(() => {
      // Find all questionnaires in the chat history
      const allQuestionnaires = messages.flatMap((m) => {
        const parts = m.parts ?? [];
        return parts.flatMap((p) => {
          if (p.type !== "ask_user") return [];
          
          let title = (p as any).attributes?.title;
          if (!title) {
            const titleMatch = p.content.match(/<ask_user\s+title=["'](.*?)["']\s*>/i);
            title = titleMatch?.[1];
          }
          if (!title) {
            try {
              const cleaned = p.content.trim().replace(/<\/?ask_user>/g, "").trim();
              const parsed = JSON.parse(cleaned);
              title = parsed?.raw?.title ?? parsed?.title;
            } catch (e) {}
          }
          
          if (!title) return [];

          const isQSubmitted = messages
            .slice(messages.indexOf(m) + 1)
            .some(
              (um) =>
                um.role === "user" &&
                um.content.startsWith(`Here are my answers to "${title}":`)
            );

          return [{
            messageId: m.id,
            title,
            isSubmitted: isQSubmitted
          }];
        });
      });

      // Is there any questionnaire that is NOT yet submitted?
      return allQuestionnaires.some((q) => !q.isSubmitted);
    }, [messages]);

    React.useImperativeHandle(ref, () => internalTextareaRef.current!, []);

    const { isListening, isHearing, toggleListening } = useSpeechToText({
      onTranscript: setTextInput,
      currentText: textInput,
    });

    React.useLayoutEffect(() => {
      const textarea = internalTextareaRef.current;
      if (textarea) {
        textarea.style.height = "auto";
        textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
      }
    }, [textInput]);

    const readFileAsDataUrl = React.useCallback(
      (file: File) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        }),
      [],
    );

    const readFileAsText = React.useCallback(
      (file: File) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ""));
          reader.onerror = () => reject(reader.error);
          reader.readAsText(file);
        }),
      [],
    );

    const buildAttachment = React.useCallback(
      async (file: File): Promise<UploadableAttachment> => {
        const dataUrl = await readFileAsDataUrl(file);
        let extractedText = "";

        if (supportsTextExtraction(file.type, file.name)) {
          const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
          if (!isPdf) {
            extractedText = truncateExtractedText(await readFileAsText(file));
          }
        }

        return {
          filename: file.name,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
          kind: inferAttachmentKind(file.type, file.name),
          extractedText: extractedText || undefined,
          previewText: extractedText ? extractedText.slice(0, 240) : undefined,
          dataUrl,
        };
      },
      [readFileAsDataUrl, readFileAsText],
    );

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(event.target.files || []);
      if (selectedFiles.length === 0) return;

      for (const file of selectedFiles) {
        if (file.type.startsWith("image/")) {
          const imageDataUrl = await readFileAsDataUrl(file);
          setImagePreview(imageDataUrl);
          continue;
        }
        try {
          const attachment = await buildAttachment(file);
          setTextAttachments((prev) => [...prev, attachment]);
        } catch (error) {
          console.error("Failed to process attachment:", error);
        }
      }

      event.target.value = "";
    };

    const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const { clipboardData } = event;
      if (!clipboardData) return;

      for (let i = 0; i < clipboardData.items.length; i++) {
        if (clipboardData.items[i].type.includes("image")) {
          event.preventDefault();
          const file = clipboardData.items[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
          }
          return;
        }
      }

      const pastedText = clipboardData.getData("text");
      if (pastedText && pastedText.length > LARGE_TEXT_THRESHOLD) {
        event.preventDefault();
        const fileName = `Pasted-Text-${textAttachments.length + 1}.txt`;
        setTextAttachments((prev) => [
          ...prev,
          {
            filename: fileName,
            mimeType: "text/plain",
            size: pastedText.length,
            kind: "text",
            extractedText: truncateExtractedText(pastedText),
            previewText: pastedText.slice(0, 240),
            dataUrl: `data:text/plain;base64,${btoa(unescape(encodeURIComponent(pastedText)))}`,
          },
        ]);
      }
    };

    const canSubmit =
      !isLoading && (!!textInput.trim() || !!imagePreview || textAttachments.length > 0);

    const submitMessage = (e: React.FormEvent | React.MouseEvent) => {
      const filesToSubmit = [...textAttachments];
      const imgToSubmit = imagePreview;
      handleSubmit(e as React.FormEvent, imgToSubmit, undefined, filesToSubmit);
      setImagePreview(null);
      setTextAttachments([]);
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (canSubmit) submitMessage(e);
      }
    };

    const currentEffort = REASONING_OPTIONS.find((o) => o.value === reasoningEffort) ?? REASONING_OPTIONS[0];

    return (
      <div
        className={cn(
          "relative flex flex-col w-full mx-auto rounded-3xl overflow-hidden",
          // Theme-based adaptive card and border tokens
          "bg-card/70 border border-border/60 shadow-lg",
          "backdrop-blur-xl transition-all duration-300",
          // Focus state based on your theme's ring token
          "focus-within:border-ring/40 focus-within:shadow-xl",
          // Elevated shadows utilizing standard dark mode overlay highlights
          "dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03),0_20px_40px_-15px_rgba(0,0,0,0.5)]",
          "dark:focus-within:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05),0_25px_50px_-12px_rgba(0,0,0,0.7)]",
        )}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept={ACCEPTED_ATTACHMENT_TYPES}
          multiple
        />

        {/* Reply Preview */}
        {replyTo && (
          <div className="mx-4 mt-3 mb-1 animate-in fade-in slide-in-from-top-2">
            <div className="relative flex items-center gap-3 overflow-hidden rounded-lg bg-primary/5 px-4 py-2 text-sm backdrop-blur-sm">
              <div className="flex flex-1 flex-col overflow-hidden">
                <span className="truncate text-foreground/80 italic">
                  <Reply className="h-3.5 w-3.5" /> {replyTo}
                </span>
              </div>
              <button
                onClick={() => setReplyTo(null)}
                className="rounded-full p-1 hover:bg-primary/10 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Attachment previews */}
        {(imagePreview || textAttachments.length > 0) && (
          <div className="flex flex-wrap gap-2 px-4 pt-3 pb-1">
            <ImagePreview imagePreview={imagePreview} onRemove={() => setImagePreview(null)} />
            <FileAttachmentPreview
              files={textAttachments}
              onRemove={(i) => setTextAttachments((prev) => prev.filter((_, idx) => idx !== i))}
            />
          </div>
        )}

        {/* Textarea — always takes full width, always on its own row */}
        <textarea
          ref={internalTextareaRef}
          data-component="chat-input"
          rows={1}
          value={textInput}
          onChange={handleInputChange}
          onKeyDown={onKeyDown}
          onPaste={handlePaste}
          placeholder={
            hasActiveQuestionnaire
              ? "Or reply directly..."
              : isChatPageWithId
              ? `Message ${APP_NAME}`
              : "Message Maya"
          }
          className={cn(
            "w-full min-h-11 max-h-50 resize-none",
            "px-5 pt-4 pb-2",
            "border-0 bg-transparent",
            "text-[16px] leading-relaxed text-foreground placeholder:text-muted-foreground/50",
            "focus:ring-0 focus-visible:outline-none outline-none shadow-none",
            "custom-scrollbar",
          )}
        />

        {/* Toolbar — always a single consistent row at the bottom */}
        <div className="flex items-center justify-between px-3 pb-3 gap-2">
          {/* Left side: Plus button + active chips */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full hover:bg-secondary/70 text-foreground/60 hover:text-primary transition-all duration-200"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="top">Add tools & files</TooltipContent>
              </Tooltip>

              <DropdownMenuContent
                align="start"
                side="top"
                className="w-64 rounded-2xl p-2 mb-2 bg-background border-border/50 shadow-2xl animate-in slide-in-from-bottom-2 z-50"
              >
                  
                  <DropdownMenuItem
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 cursor-pointer"
                  >
                    <ImageIcon className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Add photos & files</span>
                  </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1 opacity-50" />

                <div className="px-1 py-1.5">
                  <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest px-2 mb-1.5">
                    Thinking
                  </p>
                  {REASONING_OPTIONS.map((opt) => (
                    <DropdownMenuItem
                      key={opt.value}
                      onClick={() => setReasoningEffort(opt.value)}
                      className="flex items-center justify-between rounded-xl px-3 py-2 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <opt.icon className={cn("h-4 w-4", opt.color)} />
                        <span
                           className={cn(
                             "text-sm font-medium",
                             reasoningEffort === opt.value ? "text-foreground" : "text-muted-foreground",
                           )}
                        >
                          {opt.label}
                        </span>
                      </div>
                      {reasoningEffort === opt.value && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </div>

                <div className="px-2 py-2 md:hidden">
                  <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest px-1 mb-2">
                    Model
                  </p>
                  <ModelSelector />
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Reasoning chip — sits in toolbar, no layout shift */}
            {reasoningEffort !== "none" && (
              <div
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border bg-background/50 transition-all shadow-sm",
                  "border-border/50",
                )}
              >
                <currentEffort.icon className={cn("h-3.5 w-3.5", currentEffort.color)} />
                <span className={currentEffort.color}>Think: {currentEffort.label}</span>
                <button
                  onClick={() => setReasoningEffort("none")}
                  className="ml-0.5 p-0.5 rounded-full hover:bg-muted transition-colors"
                  aria-label="Disable thinking"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            )}
          </div>

          {/* Right side: Mic + Send */}
          <div className="flex items-center gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={toggleListening}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full",
                    "text-foreground/60 transition-all hover:bg-secondary/70 hover:text-primary",
                    "focus-visible:outline-none",
                    isListening && "text-primary bg-primary/10",
                    isHearing && "scale-110",
                  )}
                >
                  <Mic className={cn("h-4 w-4", isListening && isHearing && "animate-pulse")} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">Voice input</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  disabled={!isLoading && !canSubmit}
                  onClick={(e) => {
                    if (isLoading) {
                      e.preventDefault();
                      stop();
                    } else {
                      submitMessage(e);
                    }
                  }}
                  size="icon"
                  className={cn(
                    "h-8 w-8 rounded-full transition-all duration-300",
                    isLoading
                      ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      : canSubmit
                      ? "bg-primary text-primary-foreground hover:opacity-90 shadow-md shadow-primary/5 active:scale-95"
                      : "bg-secondary text-secondary-foreground opacity-30 cursor-not-allowed",
                  )}
                >
                  {isLoading ? (
                    <StopCircle className="h-4 w-4" />
                  )
                  : isStreaming ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowUp className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">{isLoading ? "Stop" : "Send"}</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    );
  },
);

ChatInputBox.displayName = "ChatInputBox";

export default ChatInputBox;