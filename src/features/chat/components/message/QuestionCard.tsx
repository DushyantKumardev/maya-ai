import React, { useState, useMemo } from "react";
import { useChatContext } from "@/features/chat/context/ChatContext";
import { APP_NAME } from "@/lib/constants";
import {
  MessageCircleQuestion,
  Send,
  ChevronRight,
  ChevronLeft,
  Check,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/utils";

export interface Question {
  id: string;
  type: "radio" | "mcq" | "text";
  question: string;
  options?: string[];
}

export interface QuestionData {
  title: string;
  questions: Question[];
}

interface QuestionCardProps {
  data: QuestionData;
  messageId: string;
  isStreaming?: boolean;
}

export function QuestionCard({ data, messageId }: QuestionCardProps) {
  const { messages, handleSubmit } = useChatContext();
  const [currentStep, setCurrentStep] = useState(0);
  const [localSubmitted, setLocalSubmitted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [answers, setAnswers] = useState<Record<string, any>>(() =>
    recoverAnswers(messages, messageId, data),
  );

  const isSubmittedExternal = useMemo(() => {
    const currentIndex = messages.findIndex((m) => m.id === messageId);
    if (currentIndex === -1) return false;
    return messages
      .slice(currentIndex + 1)
      .some(
        (m) =>
          m.role === "user" &&
          m.content.startsWith(`Here are my answers to "${data.title}":`),
      );
  }, [messages, messageId, data.title]);

  const isSubmitted = isSubmittedExternal || localSubmitted;

  if (!data?.questions?.length) return null;

  const totalSteps = data.questions.length;
  const currentQuestion = data.questions[currentStep];
  const isLastStep = currentStep === totalSteps - 1;

  const isStepValid = () => {
    const answer = answers[currentQuestion.id];
    if (currentQuestion.type === "mcq")
      return Array.isArray(answer) && answer.length > 0;
    if (currentQuestion.type === "radio") {
      if (answers[`${currentQuestion.id}_isCustom`])
        return (answer || "").trim().length > 0;
      return !!answer;
    }
    return (answer || "").trim().length > 0;
  };

  const handleRadioChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
      [`${questionId}_isCustom`]: false,
    }));
  };

  const handleMcqChange = (questionId: string, value: string) => {
    setAnswers((prev) => {
      const current = prev[questionId] || [];
      const next = current.includes(value)
        ? current.filter((v: string) => v !== value)
        : [...current, value];
      return { ...prev, [questionId]: next };
    });
  };

  const handleTextChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const nextStep = () =>
    currentStep < totalSteps - 1 && setCurrentStep((s) => s + 1);
  const prevStep = () => currentStep > 0 && setCurrentStep((s) => s - 1);

  const handleSkip = () => {
    const updatedAnswers = {
      ...answers,
      [currentQuestion.id]: "Skipped",
    };
    setAnswers(updatedAnswers);

    if (!isLastStep) {
      setCurrentStep((s) => s + 1);
    } else {
      onFormSubmit(updatedAnswers);
    }
  };

  const onFormSubmit = async (overrideAnswers?: Record<string, any>) => {
    const activeAnswers = overrideAnswers || answers;
    const formattedAnswers = data.questions
      .map((q) => {
        const answer = activeAnswers[q.id];
        const customValue = activeAnswers[`${q.id}_custom`];
        let displayAnswer = "Skipped";
        if (q.type === "mcq") {
          const selected = Array.isArray(answer) ? [...answer] : [];
          if (customValue?.trim())
            selected.push(`Other: ${customValue.trim()}`);
          displayAnswer = selected.length > 0 ? selected.join(", ") : "Skipped";
        } else {
          displayAnswer = answer === "Skipped" || !answer ? "Skipped" : answer;
        }
        return `- **${q.question}**: ${displayAnswer}`;
      })
      .join("\n");

    const message = `Here are my answers to "${data.title}":\n\n${formattedAnswers}`;
    await handleSubmit(null, null, message);
    setLocalSubmitted(true);
  };

  // ── Submitted view ──────────────────────────────────────────────────────────
  if (isSubmitted) {
    return (
      <div className="my-3 max-w-md animate-in fade-in duration-300">
        <div className="rounded-lg border border-border/50 bg-card overflow-hidden">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "w-full flex items-center justify-between px-4 py-2.5 bg-muted/20 hover:bg-muted/40 transition-colors text-left group cursor-pointer",
              isExpanded && "border-b border-border/50",
            )}
          >
            <div className="flex items-center gap-2">
              <MessageCircleQuestion className="size-3.5 text-muted-foreground/70" />
              <span className="text-xs font-semibold text-foreground/90">
                {APP_NAME.split(" ")[0]} asked you
              </span>
            </div>
            <ChevronDown
              className={cn(
                "size-3.5 text-muted-foreground/60 transition-transform duration-200",
                isExpanded ? "rotate-180" : "rotate-0",
              )}
            />
          </button>
          <div
            className={cn(
              "grid transition-all duration-300 ease-in-out",
              isExpanded
                ? "grid-rows-[1fr] opacity-100"
                : "grid-rows-[0fr] opacity-0",
            )}
          >
            <div className="overflow-hidden">
              <div className="divide-y divide-border/40">
                {data.questions.map((q) => {
                  const answer = answers[q.id];
                  let displayAnswer = "No answer";
                  if (Array.isArray(answer)) {
                    displayAnswer =
                      answer.length > 0 ? answer.join(", ") : "None selected";
                  } else if (answer) {
                    displayAnswer = answer;
                  }
                  return (
                    <div
                      key={q.id}
                      className="px-4 py-3 space-y-0.5 animate-in fade-in duration-200"
                    >
                      <p className="text-[11px] font-semibold text-muted-foreground/85 uppercase tracking-wide">
                        {q.question}
                      </p>
                      <p className="text-sm text-foreground/90 font-medium">
                        {displayAnswer}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Active form ─────────────────────────────────────────────────────────────
  return (
    <div className="my-3 max-w-lg animate-in fade-in slide-in-from-bottom-1 duration-300">
      <div className="rounded-lg border border-border/50 bg-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-muted/30">
          <MessageCircleQuestion className="size-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">
            {data.title}
          </span>
          {totalSteps > 1 && (
            <span className="ml-auto text-[10px] font-medium text-muted-foreground/60">
              {currentStep + 1} / {totalSteps}
            </span>
          )}
        </div>

        {/* Progress bar */}
        {totalSteps > 1 && (
          <div className="h-px w-full bg-border/40">
            <div
              className="h-full bg-foreground/20 transition-all duration-500 ease-in-out"
              style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            />
          </div>
        )}

        {/* Question */}
        <div
          key={currentStep}
          className="p-4 space-y-3 animate-in fade-in slide-in-from-right-2 duration-200"
        >
          <p className="text-sm font-medium text-foreground leading-snug">
            {currentQuestion.question}
          </p>

          {/* Radio */}
          {currentQuestion.type === "radio" && currentQuestion.options && (
            <div className="flex flex-col gap-1.5">
              {currentQuestion.options.map((option) => {
                const isSelected =
                  answers[currentQuestion.id] === option &&
                  !answers[`${currentQuestion.id}_isCustom`];
                return (
                  <button
                    key={option}
                    onClick={() =>
                      handleRadioChange(currentQuestion.id, option)
                    }
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm text-left transition-all",
                      isSelected
                        ? "border-foreground/30 bg-foreground/5 text-foreground"
                        : "border-border/50 bg-background text-muted-foreground hover:border-border hover:bg-muted/40 hover:text-foreground",
                    )}
                  >
                    <div
                      className={cn(
                        "size-4 rounded-full border flex items-center justify-center shrink-0 transition-colors",
                        isSelected ? "border-foreground" : "border-border",
                      )}
                    >
                      {isSelected && (
                        <div className="size-2 rounded-full bg-foreground animate-in zoom-in-50 duration-150" />
                      )}
                    </div>
                    {option}
                  </button>
                );
              })}

              {/* Other option */}
              <button
                onClick={() =>
                  setAnswers((prev) => ({
                    ...prev,
                    [currentQuestion.id]: "",
                    [`${currentQuestion.id}_isCustom`]: true,
                  }))
                }
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm text-left transition-all",
                  answers[`${currentQuestion.id}_isCustom`]
                    ? "border-foreground/30 bg-foreground/5 text-foreground"
                    : "border-border/50 bg-background text-muted-foreground hover:border-border hover:bg-muted/40 hover:text-foreground",
                )}
              >
                <div
                  className={cn(
                    "size-4 rounded-full border flex items-center justify-center shrink-0",
                    answers[`${currentQuestion.id}_isCustom`]
                      ? "border-foreground"
                      : "border-border",
                  )}
                >
                  {answers[`${currentQuestion.id}_isCustom`] && (
                    <div className="size-2 rounded-full bg-foreground animate-in zoom-in-50 duration-150" />
                  )}
                </div>
                Other
              </button>

              {answers[`${currentQuestion.id}_isCustom`] && (
                <textarea
                  autoFocus
                  value={answers[currentQuestion.id] || ""}
                  onChange={(e) =>
                    handleTextChange(currentQuestion.id, e.target.value)
                  }
                  placeholder="Type your answer…"
                  rows={3}
                  className="w-full mt-1 px-3 py-2.5 rounded-lg border border-border/50 bg-background text-sm text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-1 focus:ring-foreground/20 focus:border-foreground/30 transition-all"
                />
              )}
            </div>
          )}

          {/* MCQ */}
          {currentQuestion.type === "mcq" && currentQuestion.options && (
            <div className="flex flex-col gap-1.5">
              {currentQuestion.options.map((option) => {
                const isSelected = (answers[currentQuestion.id] || []).includes(
                  option,
                );
                return (
                  <button
                    key={option}
                    onClick={() => handleMcqChange(currentQuestion.id, option)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm text-left transition-all",
                      isSelected
                        ? "border-foreground/30 bg-foreground/5 text-foreground"
                        : "border-border/50 bg-background text-muted-foreground hover:border-border hover:bg-muted/40 hover:text-foreground",
                    )}
                  >
                    <div
                      className={cn(
                        "size-4 rounded-md border flex items-center justify-center shrink-0 transition-colors",
                        isSelected
                          ? "border-foreground bg-foreground"
                          : "border-border",
                      )}
                    >
                      {isSelected && (
                        <Check className="size-2.5 text-background stroke-3" />
                      )}
                    </div>
                    {option}
                  </button>
                );
              })}

              <textarea
                value={answers[`${currentQuestion.id}_custom`] || ""}
                onChange={(e) =>
                  setAnswers((prev) => ({
                    ...prev,
                    [`${currentQuestion.id}_custom`]: e.target.value,
                  }))
                }
                placeholder="Anything else? (optional)"
                rows={2}
                className="mt-1 w-full px-3 py-2.5 rounded-lg border border-border/50 bg-background text-sm text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-1 focus:ring-foreground/20 focus:border-foreground/30 transition-all"
              />
            </div>
          )}

          {/* Text */}
          {currentQuestion.type === "text" && (
            <textarea
              autoFocus
              value={answers[currentQuestion.id] || ""}
              onChange={(e) =>
                handleTextChange(currentQuestion.id, e.target.value)
              }
              placeholder="Type your answer…"
              rows={4}
              className="w-full px-3 py-2.5 rounded-lg border border-border/50 bg-background text-sm text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-1 focus:ring-foreground/20 focus:border-foreground/30 transition-all"
            />
          )}
        </div>

        {/* Footer nav */}
        <div className="flex items-center gap-2 px-4 py-3 border-t border-border/50 bg-muted/20">
          {currentStep > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={prevStep}
              className="gap-1.5 h-8 px-3 text-xs text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="size-3.5" />
              Back
            </Button>
          )}

          <div className="flex gap-1 ml-auto items-center">
            {totalSteps > 1 &&
              data.questions.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "rounded-full transition-all duration-300",
                    i === currentStep
                      ? "w-3.5 h-1.5 bg-foreground/50"
                      : "w-1.5 h-1.5 bg-foreground/20",
                  )}
                />
              ))}
          </div>

          <div className="flex items-center gap-1.5 ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              Skip
            </Button>

            {!isLastStep ? (
              <Button
                size="sm"
                onClick={nextStep}
                disabled={!isStepValid()}
                className="gap-1.5 h-8 px-3 text-xs"
              >
                Next
                <ChevronRight className="size-3.5" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => onFormSubmit()}
                disabled={!isStepValid()}
                className="gap-1.5 h-8 px-3 text-xs"
              >
                <Send className="size-3" />
                Send
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function recoverAnswers(
  messages: any[],
  messageId: string,
  data: QuestionData,
): Record<string, any> {
  const currentIndex = messages.findIndex((m) => m.id === messageId);
  if (currentIndex === -1) return {};

  const answerMessage = messages
    .slice(currentIndex + 1)
    .find(
      (m) =>
        m.role === "user" &&
        m.content.startsWith(`Here are my answers to "${data.title}":`),
    );

  if (!answerMessage) return {};

  const recovered: Record<string, any> = {};
  const lines = answerMessage.content.split("\n");

  data.questions.forEach((q) => {
    const line = lines.find((l: string) => l.includes(`**${q.question}**:`));
    if (!line) return;
    const value = line.split("**: ")[1]?.trim();
    if (!value) return;

    if (q.type === "mcq") {
      const parts = value.split(", ");
      const standard = parts.filter((p: string) => !p.startsWith("Other: "));
      const custom = parts.find((p: string) => p.startsWith("Other: "));
      recovered[q.id] = standard;
      if (custom) recovered[`${q.id}_custom`] = custom.replace("Other: ", "");
    } else {
      recovered[q.id] = value;
      if (q.options && !q.options.includes(value) && value !== "No answer") {
        recovered[`${q.id}_isCustom`] = true;
      }
    }
  });

  return recovered;
}
