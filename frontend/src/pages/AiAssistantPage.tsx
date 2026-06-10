import { FormEvent, useState, useRef, useEffect } from "react";
import { BookOpen, Bot, Send, User, Globe, Compass, Rocket, AlertCircle } from "lucide-react";
import { chatSpace, type ChatHistoryItem } from "../api/space";

const STUDY_TOPICS = [
  {
    title: "Solar Weather & Flares",
    category: "Space Weather",
    description: "Learn how Coronal Mass Ejections (CMEs) and solar flares create geomagnetic storms and aurora borealis on Earth.",
    question: "Explain how solar flares and CMEs affect Earth's magnetosphere, satellites, and grid networks.",
    icon: Globe,
    color: "text-red-400 border-red-500/10 bg-red-500/5",
  },
  {
    title: "ISS Orbital Mechanics",
    category: "Space Flight",
    description: "Discover how the International Space Station orbits at 17,500 mph (28,000 km/h) in low Earth orbit (LEO).",
    question: "Explain the orbital mechanics of the ISS, how it stays in orbit, and how it handles gravitational decay.",
    icon: Compass,
    color: "text-purple-400 border-purple-500/10 bg-purple-500/5",
  },
  {
    title: "Mars Rover Science",
    category: "Planetary Science",
    description: "Explore the geological history of Mars through the lenses of Curiosity, Spirit, and Opportunity.",
    question: "Summarize the primary scientific goals and findings of the Curiosity, Spirit, and Opportunity Mars rovers.",
    icon: Rocket,
    color: "text-orange-400 border-orange-500/10 bg-orange-500/5",
  },
];

export function AiAssistantPage() {
  const [messages, setMessages] = useState<ChatHistoryItem[]>([
    {
      role: "assistant",
      content: "Hello! I am your Mission Specialist AI Space Tutor. Click one of the Study Topics on the left to start a lesson, or type any space-related question below to explore!",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to the bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(textToSend: string) {
    if (!textToSend.trim() || isLoading) return;
    
    setError("");
    setIsLoading(true);
    
    // Add user message to history
    const userMsg: ChatHistoryItem = { role: "user", content: textToSend };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");

    try {
      // Send chat request to Gemini
      const response = await chatSpace(updatedMessages.slice(0, -1), textToSend);
      
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.data.reply },
      ]);
    } catch (err) {
      console.error("Chat request failed:", err);
      setError("The space telemetry link timed out. Please retry your transmission.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    handleSend(input);
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <div className="border-b border-white/5 pb-6 mb-8">
        <p className="text-xs uppercase tracking-wider text-space-signal font-semibold font-mono">Astronaut Training</p>
        <h1 className="mt-2 text-3xl font-extrabold text-white">Space Academy & AI Tutor</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        
        {/* Left Column: Lesson Modules */}
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-space-signal" />
              Active Study Topics
            </h2>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              Click a module below to seed the AI Tutor with a specific space lesson.
            </p>
          </div>

          <div className="grid gap-4">
            {STUDY_TOPICS.map((topic, index) => {
              const Icon = topic.icon;
              return (
                <button
                  className={[
                    "w-full text-left rounded-xl border p-5 backdrop-blur-md transition duration-300",
                    "glass-card hover:bg-white/[0.03] hover:-translate-y-0.5",
                    topic.color,
                  ].join(" ")}
                  key={index}
                  onClick={() => handleSend(topic.question)}
                  type="button"
                >
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-white/5 border border-white/10">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-[10px] font-mono font-bold tracking-wider uppercase opacity-80">
                      {topic.category}
                    </span>
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-white leading-5">{topic.title}</h3>
                  <p className="mt-2 text-xs leading-5 text-slate-300 font-normal">{topic.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Chat Interface */}
        <article className="rounded-xl border border-white/5 bg-white/[0.01] backdrop-blur-md glass-card flex flex-col h-[560px] overflow-hidden">
          {/* Header */}
          <div className="border-b border-white/5 bg-white/[0.01] px-6 py-4 flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg border border-space-signal/20 bg-space-signal/5">
              <Bot className="h-5 w-5 text-space-signal" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-white leading-none">Mission Specialist AI</h2>
              <p className="mt-1.5 text-[9px] font-mono text-space-amber font-bold leading-none uppercase tracking-wider">
                Telemetry Link Active
              </p>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, idx) => {
              const isAssistant = msg.role === "assistant";
              return (
                <div
                  className={[
                    "flex gap-3 max-w-[85%] items-start",
                    isAssistant ? "mr-auto" : "ml-auto flex-row-reverse",
                  ].join(" ")}
                  key={idx}
                >
                  <span className={[
                    "grid h-8 w-8 place-items-center rounded-full border shrink-0 text-xs",
                    isAssistant ? "bg-white/5 border-white/10 text-space-signal" : "bg-space-signal/10 border-space-signal/20 text-space-amber",
                  ].join(" ")}>
                    {isAssistant ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </span>
                  
                  <div className={[
                    "rounded-xl p-4 text-xs leading-6 font-normal whitespace-pre-wrap",
                    isAssistant ? "bg-white/5 border border-white/10 text-slate-200" : "bg-space-signal text-space-ink font-semibold",
                  ].join(" ")}>
                    {msg.content}
                  </div>
                </div>
              );
            })}
            
            {isLoading && (
              <div className="flex gap-3 max-w-[85%] items-start mr-auto">
                <span className="grid h-8 w-8 place-items-center rounded-full border shrink-0 text-xs bg-white/5 border-white/10 text-space-signal">
                  <Bot className="h-4 w-4 animate-spin" />
                </span>
                <div className="rounded-xl p-4 text-xs bg-white/5 border border-white/10 text-slate-400 italic">
                  Tutor is searching archives and compiling data...
                </div>
              </div>
            )}

            {error && (
              <div className="flex gap-3 max-w-[85%] items-start mr-auto border border-red-500/20 bg-red-950/20 rounded-xl p-4 text-xs text-red-200">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-red-400" />
                <p>{error}</p>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Form Input */}
          <form className="border-t border-white/5 bg-black/30 p-4 flex gap-2" onSubmit={handleSubmit}>
            <input
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-space-signal transition"
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about space, orbits, or alerts..."
              type="text"
              value={input}
            />
            <button
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-space-signal text-space-ink transition hover:bg-cyan-300 disabled:opacity-50"
              disabled={isLoading || !input.trim()}
              type="submit"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </article>

      </div>
    </section>
  );
}
