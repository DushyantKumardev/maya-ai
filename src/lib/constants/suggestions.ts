import { Code2, Lightbulb, MessageSquare, PenLine } from "lucide-react";

export const SUGGESTIONS = [
  {
    id: "code",
    label: "Write code",
    prompt: "Write a React component for a responsive navbar",
    icon: Code2,
  },
  {
    id: "brainstorm",
    label: "Brainstorm ideas",
    prompt: "Brainstorm 5 innovative startup ideas in AI",
    icon: MessageSquare,
  },
  {
    id: "explain",
    label: "Explain concept",
    prompt: "Explain quantum computing like I'm 5",
    icon: Lightbulb,
  },
  {
    id: "draft",
    label: "Draft email",
    prompt: "Draft a professional email to a client about a delay",
    icon: PenLine,
  },
];

export const HOME_PAGE_GREETINGS =(username:string)=> [
  "How can I help you today?",
  "What shall we create together?",
  `Welcome back ${username}! How can I assist you?`,
  `Hello ${username}! What are we building today?`,
  "Need a hand with anything?",
  "What's on your mind?",
  "Good to see you! How can I help?",
  "What's the plan for today?",
];