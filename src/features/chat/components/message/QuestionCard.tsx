import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { useChatContext } from "@/features/chat/context/ChatContext";
import {
  MessageCircleQuestion,
  Send,
  ChevronRight,
  ChevronLeft,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

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

/**
 * QuestionCard
 *
 * The main component rendered in the chat stream.
 * It shows a compact trigger button and manages a side sheet containing the form.
 */
export function QuestionCard({
  data,
  messageId,
  isStreaming = false,
}: QuestionCardProps) {
  const { messages } = useChatContext();
  const [isOpen, setIsOpen] = useState(false);

  // Determine if this specific questionnaire has been submitted
  const isSubmitted = useMemo(() => {
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

  if (!data || !data.questions || data.questions.length === 0) return null;

  return (
    <>
      {/* Trigger Button in Chat */}
      <div className="my-4 max-w-2xl animate-in fade-in zoom-in-95 duration-300">
        <button
          onClick={() => setIsOpen(true)}
          className={cn(
            "w-full flex items-center justify-between gap-3 p-3 rounded-lg border transition-all hover:bg-muted/50 group shadow-sm",
            isSubmitted
              ? "bg-emerald-500/5 border-emerald-500/20"
              : "bg-primary/5 border-primary/20",
          )}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "flex size-8 items-center justify-center rounded-lg shadow-sm transition-colors",
                isSubmitted
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "bg-primary/10 text-primary",
              )}
            >
              <MessageCircleQuestion className="size-4" />
            </div>
            <div className="flex flex-col items-start leading-tight">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                Questionnaire
              </span>
              <span className="text-sm font-semibold text-foreground line-clamp-1">
                {data.title}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isSubmitted ? (
              <span className="text-[10px] font-bold text-emerald-500 uppercase bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                Completed
              </span>
            ) : (
              <span className="text-[10px] font-bold text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20 animate-pulse">
                Action Required
              </span>
            )}
            <ChevronRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </div>
        </button>
      </div>

      {/* Side Sheet Overlay */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="right"
          className="w-full sm:w-[500px] sm:max-w-[500px] p-0 border-l border-border/50 overflow-hidden shadow-2xl [&>button]:hidden"
          aria-describedby={undefined}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>{data.title}</SheetTitle>
          </SheetHeader>
          <QuestionFormContent
            data={data}
            messageId={messageId}
            isSubmittedExternal={isSubmitted}
            onClose={() => setIsOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}

/**
 * QuestionFormContent
 *
 * The actual interactive questionnaire logic.
 */
function QuestionFormContent({
  data,
  messageId,
  isSubmittedExternal,
  onClose,
}: {
  data: QuestionData;
  messageId: string;
  isSubmittedExternal: boolean;
  onClose: () => void;
}) {
  const { handleSubmit, messages } = useChatContext();
  const [currentStep, setCurrentStep] = useState(0);
  const [localSubmitted, setLocalSubmitted] = useState(false);

  const isSubmitted = isSubmittedExternal || localSubmitted;

  const [answers, setAnswers] = useState<Record<string, any>>(() => {
    const currentIndex = messages.findIndex((m) => m.id === messageId);
    if (currentIndex === -1) return {};

    const answerMessage = messages
      .slice(currentIndex + 1)
      .find(
        (m) =>
          m.role === "user" &&
          m.content.startsWith(`Here are my answers to "${data.title}":`),
      );

    if (answerMessage) {
      const recovered: Record<string, any> = {};
      const lines = answerMessage.content.split("\n");
      data.questions.forEach((q) => {
        const line = lines.find((l) => l.includes(`**${q.question}**:`));
        if (line) {
          const value = line.split("**: ")[1]?.trim();
          if (value) {
            if (q.type === "mcq") {
              const parts = value.split(", ");
              const standard = parts.filter((p) => !p.startsWith("Other: "));
              const custom = parts.find((p) => p.startsWith("Other: "));
              recovered[q.id] = standard;
              if (custom)
                recovered[`${q.id}_custom`] = custom.replace("Other: ", "");
            } else {
              recovered[q.id] = value;
              if (
                q.options &&
                !q.options.includes(value) &&
                value !== "No answer"
              ) {
                recovered[`${q.id}_isCustom`] = true;
              }
            }
          }
        }
      });
      return recovered;
    }
    return {};
  });

  const totalSteps = data.questions.length;
  const currentQuestion = data.questions[currentStep];
  const isLastStep = currentStep === totalSteps - 1;

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
    currentStep < totalSteps - 1 && setCurrentStep(currentStep + 1);
  const prevStep = () => currentStep > 0 && setCurrentStep(currentStep - 1);

  const onFormSubmit = async () => {
    const formattedAnswers = data.questions
      .map((q) => {
        const answer = answers[q.id];
        const customValue = answers[`${q.id}_custom`];
        let displayAnswer = "No answer";

        if (q.type === "mcq") {
          const selected = Array.isArray(answer) ? [...answer] : [];
          if (customValue?.trim())
            selected.push(`Other: ${customValue.trim()}`);
          displayAnswer =
            selected.length > 0 ? selected.join(", ") : "None selected";
        } else {
          displayAnswer = answer || "No answer";
        }
        return `- **${q.question}**: ${displayAnswer}`;
      })
      .join("\n");

    const message = `Here are my answers to "${data.title}":\n\n${formattedAnswers}`;
    await handleSubmit(null, null, message);
    setLocalSubmitted(true);
  };

  const isStepValid = () => {
    const answer = answers[currentQuestion.id];
    if (currentQuestion.type === "mcq")
      return Array.isArray(answer) && answer.length > 0;
    return !!answer;
  };

  if (isSubmitted) {
    return (
      <div className="flex flex-col h-full bg-background animate-in fade-in duration-300">
        <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <MessageCircleQuestion className="size-5" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-sm font-bold text-foreground line-clamp-1">
                {data.title}
              </h3>
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                Completed
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="size-8 rounded-lg"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
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
                className="space-y-2 border-l-2 border-emerald-500/30 pl-4 py-1"
              >
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">
                  {q.question}
                </span>
                <p className="text-sm text-foreground/90 font-medium">
                  {displayAnswer}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background animate-in fade-in slide-in-from-right duration-500">
      <div className="border-b border-border/50 bg-muted/30 p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm">
            <MessageCircleQuestion className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">{data.title}</h3>
            {totalSteps > 1 && (
              <div className="text-[10px] font-bold text-primary/70 uppercase tracking-widest mt-0.5">
                Step {currentStep + 1} of {totalSteps}
              </div>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="size-8 rounded-lg hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="size-4" />
        </Button>
      </div>

      <div className="h-1 w-full bg-muted overflow-hidden shrink-0">
        <div
          className="h-full bg-primary transition-all duration-500 ease-in-out"
          style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div
          key={currentStep}
          className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300"
        >
          <label className="text-lg font-bold text-foreground leading-tight block">
            {currentQuestion.question}
          </label>

          {currentQuestion.type === "radio" && currentQuestion.options && (
            <div className="grid grid-cols-1 gap-2.5">
              {currentQuestion.options.map((option) => (
                <button
                  key={option}
                  onClick={() => handleRadioChange(currentQuestion.id, option)}
                  className={cn(
                    "flex items-center gap-4 px-5 py-4 rounded-lg border transition-all text-sm text-left group",
                    answers[currentQuestion.id] === option &&
                      !answers[`${currentQuestion.id}_isCustom`]
                      ? "bg-primary/5 border-primary/40 text-primary ring-1 ring-primary/20 shadow-sm"
                      : "bg-card border-border/50 text-muted-foreground hover:bg-accent/50 hover:border-border/80",
                  )}
                >
                  <div
                    className={cn(
                      "size-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                      answers[currentQuestion.id] === option &&
                        !answers[`${currentQuestion.id}_isCustom`]
                        ? "border-primary"
                        : "border-muted-foreground/30 group-hover:border-muted-foreground/50",
                    )}
                  >
                    {answers[currentQuestion.id] === option &&
                      !answers[`${currentQuestion.id}_isCustom`] && (
                        <div className="size-2.5 rounded-full bg-primary animate-in zoom-in-50" />
                      )}
                  </div>
                  <span className="font-semibold text-base">{option}</span>
                </button>
              ))}

              <button
                onClick={() =>
                  setAnswers((prev) => ({
                    ...prev,
                    [currentQuestion.id]: "",
                    [`${currentQuestion.id}_isCustom`]: true,
                  }))
                }
                className={cn(
                  "flex items-center gap-4 px-5 py-4 rounded-lg border transition-all text-sm text-left group",
                  answers[`${currentQuestion.id}_isCustom`]
                    ? "bg-primary/5 border-primary/40 text-primary ring-1 ring-primary/20 shadow-sm"
                    : "bg-card border-border/50 text-muted-foreground hover:bg-accent/50 hover:border-border/80",
                )}
              >
                <div
                  className={cn(
                    "size-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                    answers[`${currentQuestion.id}_isCustom`]
                      ? "border-primary"
                      : "border-muted-foreground/30 group-hover:border-muted-foreground/50",
                  )}
                >
                  {answers[`${currentQuestion.id}_isCustom`] && (
                    <div className="size-2.5 rounded-full bg-primary animate-in zoom-in-50" />
                  )}
                </div>
                <span className="font-semibold text-base">
                  Other / Custom Answer
                </span>
              </button>

              {answers[`${currentQuestion.id}_isCustom`] && (
                <div className="mt-2 animate-in slide-in-from-top-2 duration-200">
                  <textarea
                    autoFocus
                    value={answers[currentQuestion.id] || ""}
                    onChange={(e) =>
                      handleTextChange(currentQuestion.id, e.target.value)
                    }
                    placeholder="Enter your custom answer..."
                    className="w-full bg-background border border-primary/30 rounded-lg px-5 py-4 text-base focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all min-h-32 resize-none shadow-sm"
                  />
                </div>
              )}
            </div>
          )}

          {currentQuestion.type === "mcq" && currentQuestion.options && (
            <div className="grid grid-cols-1 gap-2.5">
              {currentQuestion.options.map((option) => {
                const isSelected = (answers[currentQuestion.id] || []).includes(
                  option,
                );
                return (
                  <button
                    key={option}
                    onClick={() => handleMcqChange(currentQuestion.id, option)}
                    className={cn(
                      "flex items-center gap-4 px-5 py-4 rounded-lg border transition-all text-sm text-left group",
                      isSelected
                        ? "bg-primary/5 border-primary/40 text-primary ring-1 ring-primary/20 shadow-sm"
                        : "bg-card border-border/50 text-muted-foreground hover:bg-accent/50 hover:border-border/80",
                    )}
                  >
                    <div
                      className={cn(
                        "size-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors",
                        isSelected
                          ? "border-primary bg-primary"
                          : "border-muted-foreground/30 group-hover:border-muted-foreground/50",
                      )}
                    >
                      {isSelected && (
                        <div className="size-3 bg-primary-foreground rounded-xs" />
                      )}
                    </div>
                    <span className="font-semibold text-base">{option}</span>
                  </button>
                );
              })}

              <div className="pt-4 space-y-2">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Something else?
                </label>
                <textarea
                  value={answers[`${currentQuestion.id}_custom`] || ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({
                      ...prev,
                      [`${currentQuestion.id}_custom`]: e.target.value,
                    }))
                  }
                  placeholder="Additional details or custom answer..."
                  className="w-full bg-background border border-border/50 rounded-lg px-5 py-4 text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all placeholder:text-muted-foreground/40 min-h-32 resize-none"
                />
              </div>
            </div>
          )}

          {currentQuestion.type === "text" && (
            <div className="relative group">
              <textarea
                autoFocus
                value={answers[currentQuestion.id] || ""}
                onChange={(e) =>
                  handleTextChange(currentQuestion.id, e.target.value)
                }
                placeholder="Type your answer here..."
                className="w-full bg-background border border-border/50 rounded-lg px-5 py-4 text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all placeholder:text-secondary-foreground/40 min-h-40 resize-none shadow-inner"
              />
            </div>
          )}
        </div>
      </div>

      <div className="bg-muted/30 px-6 py-5 border-t border-border/50 flex items-center gap-4 shrink-0">
        {currentStep > 0 && (
          <Button
            variant="outline"
            onClick={prevStep}
            className="flex-1 gap-2 rounded-lg h-12 border-border/50 font-bold"
          >
            <ChevronLeft className="size-4" />
            Back
          </Button>
        )}

        {!isLastStep ? (
          <Button
            onClick={nextStep}
            disabled={!isStepValid()}
            className="flex-[2] gap-2 rounded-lg h-12 font-bold text-base shadow-sm"
          >
            Next Question
            <ChevronRight className="size-4" />
          </Button>
        ) : (
          <Button
            onClick={onFormSubmit}
            disabled={!isStepValid()}
            className="flex-[2] gap-2 rounded-lg h-12 font-bold text-base shadow-md shadow-primary/10 animate-in fade-in slide-in-from-right-2"
          >
            <Send className="size-4" />
            Send Responses
          </Button>
        )}
      </div>
    </div>
  );
}
