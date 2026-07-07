import {
  Bot,
  Mic,
  MicOff,
  Send,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { getAnalysisHistory, type SavedAnalysis } from '../services/analysisHistory';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

type SpeechRecognitionConstructor = new () => SpeechRecognition;

type SpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

type SpeechRecognitionEvent = {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
    length: number;
  };
};

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const quickPrompts = [
  'Improve typography',
  'Explain accessibility',
  'Improve hierarchy',
  'Make it premium',
  'Improve UX',
  'Suggest better colors',
];

export function LiveAnalysisPage() {
  const [latestAnalysis, setLatestAnalysis] = useState<SavedAnalysis | null>(null);
  const [message, setMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: crypto.randomUUID(),
      role: 'assistant',
      content:
        "Welcome back. I’ve loaded your latest design analysis, so we can jump straight into improving your interface. Ask me anything about the score, accessibility, typography, hierarchy, spacing, color, or how to make the design feel more premium.",
    },
  ]);

  useEffect(() => {
    const history = getAnalysisHistory();
    setLatestAnalysis(history[0] ?? null);
  }, []);

  const sendMessage = (text: string) => {
    const trimmedMessage = text.trim();

    if (!trimmedMessage) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmedMessage,
    };

    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: buildLocalAssistantReply(trimmedMessage, latestAnalysis),
    };

    setMessages((currentMessages) => [
      ...currentMessages,
      userMessage,
      assistantMessage,
    ]);

    setMessage('');
  };

  const handleSend = () => {
    sendMessage(message);
  };

  const handleQuickPrompt = (prompt: string) => {
    sendMessage(prompt);
  };

  const handleVoiceInput = () => {
    const SpeechRecognitionClass =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content:
            'Voice input is not supported in this desktop environment yet. You can still type your question in the chat box, and I’ll help you improve the design from there.',
        },
      ]);
      return;
    }

    const recognition = new SpeechRecognitionClass();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setMessage(transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    setIsListening(true);
    recognition.start();
  };

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-10 py-12">
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#00D97E]">
            Assistant
          </p>

          <h2 className="mt-5 text-4xl font-semibold text-[#F1F5F9]">
            Studio PAP Assistant
          </h2>

          <p className="mt-3 max-w-2xl text-slate-400">
            Ask follow-up questions about your latest design review using text or voice.
          </p>
        </div>

        <div className="rounded-xl border border-[#00D97E]/20 bg-[#00D97E]/10 px-4 py-3 text-sm text-[#7CFFB2]">
          Voice + Chat Ready
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-[#00D97E]/20 bg-[#00D97E]/[0.08] p-5 shadow-[0_0_40px_rgba(0,217,126,0.12)]">
        {latestAnalysis ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#00D97E]">
                Latest Analysis Loaded
              </p>
              <p className="mt-2 text-lg font-semibold text-[#F1F5F9]">
                {latestAnalysis.screen_type}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <ContextPill label="Score" value={`${latestAnalysis.design_score}/100`} />
              <ContextPill label="Accessibility" value={String(latestAnalysis.accessibility_score)} />
              <ContextPill label="Hierarchy" value={String(latestAnalysis.hierarchy_score)} />
              <ContextPill label="Typography" value={String(latestAnalysis.typography_score)} />
            </div>
          </div>
        ) : (
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#00D97E]">
              No Analysis Loaded
            </p>
            <p className="mt-2 text-sm text-slate-300">
              Capture and analyze a screen first, then return here to ask questions about it.
            </p>
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {quickPrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => handleQuickPrompt(prompt)}
            className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-slate-300 transition hover:border-[#00D97E]/40 hover:bg-[#00D97E]/10 hover:text-[#F1F5F9]"
          >
            {prompt}
          </button>
        ))}
      </div>

      <article className="mt-6 flex min-h-[640px] flex-1 flex-col rounded-2xl border border-white/10 bg-white/[0.06] shadow-panel">
        <div className="border-b border-white/10 px-6 py-5">
          <div className="flex items-center gap-3">
            <Bot size={22} className="text-[#00D97E]" />
            <div>
              <h3 className="text-lg font-semibold text-[#F1F5F9]">
                Design Coach
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                Ask about UX, accessibility, typography, spacing, hierarchy, color, or polish.
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {messages.map((chatMessage) => (
            <div
              key={chatMessage.id}
              className={
                chatMessage.role === 'user'
                  ? 'ml-auto max-w-[72%] rounded-2xl bg-[#00D97E] px-4 py-3 text-sm leading-6 text-[#050608]'
                  : 'mr-auto max-w-[78%] rounded-2xl border border-white/10 bg-[#050608]/70 px-4 py-3 text-sm leading-6 text-slate-300'
              }
            >
              {chatMessage.content}
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 p-5">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleVoiceInput}
              className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-[#050608]/70 text-[#00D97E] transition hover:border-[#00D97E]/40 hover:bg-[#00D97E]/10"
              aria-label="Start voice input"
            >
              {isListening ? (
                <MicOff size={18} aria-hidden="true" />
              ) : (
                <Mic size={18} aria-hidden="true" />
              )}
            </button>

            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={
                isListening
                  ? 'Listening...'
                  : 'Ask Studio PAP anything about your design...'
              }
              className="min-h-12 flex-1 resize-none rounded-xl border border-white/10 bg-[#050608]/70 px-4 py-3 text-sm text-[#F1F5F9] outline-none transition placeholder:text-slate-500 focus:border-[#00D97E]/50"
            />

            <button
              type="button"
              onClick={handleSend}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#00D97E] px-5 text-sm font-semibold text-[#050608] shadow-[0_0_30px_rgba(0,217,126,0.25)] transition hover:bg-[#16F28B]"
            >
              <Send size={17} aria-hidden="true" />
              Send
            </button>
          </div>
        </div>
      </article>
    </section>
  );
}

function ContextPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#050608]/60 px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#F1F5F9]">{value}</p>
    </div>
  );
}

function buildLocalAssistantReply(question: string, analysis: SavedAnalysis | null): string {
  const normalizedQuestion = question.toLowerCase();

  if (!analysis) {
    return 'I do not have a saved design analysis yet. Capture a screen, run an analysis, then ask me about the score, hierarchy, accessibility, typography, spacing, or color. Once I have that context, I can give much more specific feedback.';
  }

  if (normalizedQuestion.includes('accessibility')) {
    return `Your accessibility score is ${analysis.accessibility_score}/100.

You already have a workable base, but the main opportunity is making the interface easier to read and interact with. I would start by improving contrast, making secondary text less faint, and ensuring buttons or icons have enough visible touch area.

These changes help more users understand the interface quickly and reduce friction, especially on smaller screens.

If you'd like, I can also give you a checklist for improving accessibility step by step.`;
  }

  if (normalizedQuestion.includes('typography') || normalizedQuestion.includes('font')) {
    return `Your typography score is ${analysis.typography_score}/100.

The overall direction is understandable, but the hierarchy can feel stronger. I would focus on making headings more dominant, increasing contrast between titles and body text, and making small labels easier to read.

This will help users scan the screen faster and make the product feel more polished.

If you'd like, I can also suggest a cleaner typography system for this design.`;
  }

  if (normalizedQuestion.includes('spacing')) {
    return `Your spacing score is ${analysis.spacing_score}/100.

The layout has a good foundation, but the spacing can feel more intentional. I would use a consistent 8px spacing scale, keep section gaps predictable, and make sure related elements sit closer together than unrelated ones.

This will make the interface feel calmer, cleaner, and more professionally structured.

Feel free to ask me which parts of the screen need spacing changes first.`;
  }

  if (normalizedQuestion.includes('hierarchy')) {
    return `Your hierarchy score is ${analysis.hierarchy_score}/100.

The screen is understandable, but the user's attention may still be split between multiple elements. I would make the main action or most important content more visually dominant, then reduce the visual weight of competing elements around it.

This helps users immediately understand where to look and what to do next.

If you'd like, I can suggest a stronger layout hierarchy for this screen.`;
  }

  if (normalizedQuestion.includes('color')) {
    return `Your color score is ${analysis.color_score}/100, which is a solid foundation.

The biggest opportunity is creating a stronger visual system. Try using one primary accent color consistently, increasing the contrast of secondary text, and avoiding decorative colors unless they communicate something meaningful.

These small adjustments will make the interface feel cleaner, more professional, and easier to scan.

If you'd like, I can also suggest a more premium color palette or review another part of your design.`;
  }

  if (normalizedQuestion.includes('score') || normalizedQuestion.includes('why')) {
    return `Studio PAP scored this design ${analysis.design_score}/100.

That score means the design has a clear foundation, but there are still important opportunities to improve polish, clarity, and usability. The highest-impact next step is:

${analysis.top_priority}

If you'd like, I can break this down into a practical checklist you can follow inside Figma.`;
  }

  if (normalizedQuestion.includes('premium')) {
    return `This design can feel more premium with a few focused changes.

I would reduce visual noise, increase whitespace, use fewer accent colors, improve typography hierarchy, and make one focal point clearly dominant.

Premium UI usually feels calm, intentional, and restrained. Every color, shadow, and spacing decision should feel purposeful.

If you'd like, I can suggest a more luxury or Apple-inspired direction for this screen.`;
  }

  if (normalizedQuestion.includes('ux')) {
    return `For stronger UX, I would clarify the main task first.

The screen should guide users toward one clear action or understanding. Reduce unnecessary visual clutter, make interactive states obvious, and ensure the most important content is visible without effort.

These changes will make the interface easier to use and more confident.

I can also review this from a mobile app, SaaS dashboard, or Apple-style UX perspective.`;
  }

  return `Based on the latest analysis, the most important improvement is:

${analysis.top_priority}

That is the best place to start because it will have the biggest impact on clarity and perceived polish.

If you'd like, I can turn this into a step-by-step improvement plan.`;
}