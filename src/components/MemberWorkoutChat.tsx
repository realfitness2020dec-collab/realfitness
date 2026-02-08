import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, Dumbbell, Loader2, Volume2, VolumeX } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import FitnessIntakeForm from "@/components/FitnessIntakeForm";
import type { Member } from "@/services/supabase";
import { toast } from "sonner";

type Message = { role: "user" | "assistant"; content: string };
type FitnessProfile = {
  fitness_goal: string | null;
  alcohol_consumption: boolean | null;
  diet_type: string | null;
  physical_issues: string | null;
  activity_level: string | null;
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/workout-chat`;

const QUICK_PROMPTS = [
  "Give me today's workout 💪",
  "What should I eat today?",
  "Warm-up routine",
  "Quick fat burn workout 🔥",
];

interface MemberWorkoutChatProps {
  member: Member;
}

const MemberWorkoutChat = ({ member }: MemberWorkoutChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [fitnessProfile, setFitnessProfile] = useState<FitnessProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [needsIntake, setNeedsIntake] = useState(false);
  const [intakeSubmitting, setIntakeSubmitting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load fitness profile and chat history on mount
  useEffect(() => {
    loadFitnessProfile();
    loadChatHistory();
  }, [member.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const loadFitnessProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("member_fitness_profiles")
        .select("*")
        .eq("member_id", member.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setFitnessProfile(data);
        setNeedsIntake(false);
      } else {
        setNeedsIntake(true);
      }
    } catch (err) {
      console.error("Error loading fitness profile:", err);
    } finally {
      setProfileLoading(false);
    }
  };

  const loadChatHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("role, content, created_at")
        .eq("member_id", member.id)
        .order("created_at", { ascending: true })
        .limit(50);

      if (error) throw error;
      if (data && data.length > 0) {
        setMessages(data.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })));
      }
    } catch (err) {
      console.error("Error loading chat history:", err);
    }
  };

  const saveChatMessage = async (role: string, content: string) => {
    try {
      await supabase.from("chat_messages").insert({
        member_id: member.id,
        role,
        content,
      });
    } catch (err) {
      console.error("Error saving message:", err);
    }
  };

  const getRecentWorkouts = useCallback((): { date: string; content: string }[] => {
    // Extract assistant messages that look like workouts from the last few days
    const workoutMsgs = messages
      .filter((m) => m.role === "assistant" && (m.content.includes("Workout") || m.content.includes("🏋️") || m.content.includes("Exercise")))
      .slice(-5)
      .map((m, i) => ({
        date: `Day ${i + 1} (recent)`,
        content: m.content.slice(0, 300),
      }));
    return workoutMsgs;
  }, [messages]);

  const handleIntakeSubmit = async (data: {
    fitness_goal: string;
    alcohol_consumption: boolean;
    diet_type: string;
    physical_issues: string;
    activity_level: string;
  }) => {
    setIntakeSubmitting(true);
    try {
      const { error } = await supabase.from("member_fitness_profiles").insert({
        member_id: member.id,
        ...data,
      });

      if (error) throw error;

      setFitnessProfile(data);
      setNeedsIntake(false);
      toast.success("Profile set up! Let's start your fitness journey! 💪");
    } catch (err) {
      console.error("Error saving fitness profile:", err);
      toast.error("Failed to save profile. Please try again.");
    } finally {
      setIntakeSubmitting(false);
    }
  };

  const streamChat = async (userMessages: Message[]) => {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        messages: userMessages.slice(-20), // Send last 20 messages for context
        memberProfile: {
          name: member.full_name,
          weight: member.weight,
          height: member.height,
          isActive: member.is_active,
        },
        fitnessProfile,
        recentWorkouts: getRecentWorkouts(),
      }),
    });

    if (!resp.ok || !resp.body) {
      const errorData = await resp.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to connect to AI coach");
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantSoFar = "";
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantSoFar += content;
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                return prev.map((m, i) =>
                  i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
                );
              }
              return [...prev, { role: "assistant", content: assistantSoFar }];
            });
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    // Final flush
    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantSoFar += content;
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                return prev.map((m, i) =>
                  i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
                );
              }
              return [...prev, { role: "assistant", content: assistantSoFar }];
            });
          }
        } catch {
          /* ignore */
        }
      }
    }

    return assistantSoFar;
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Message = { role: "user", content: text.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    // Save user message
    await saveChatMessage("user", text.trim());

    try {
      const fullResponse = await streamChat(updatedMessages);
      // Save assistant response
      if (fullResponse) {
        await saveChatMessage("assistant", fullResponse);
      }
    } catch (e) {
      const errMsg = `❌ ${e instanceof Error ? e.message : "Something went wrong. Please try again."}`;
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: errMsg },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  // Text-to-Speech
  const speakText = (text: string) => {
    // Strip markdown
    const cleanText = text
      .replace(/[#*_~`>]/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\n+/g, ". ")
      .replace(/\s+/g, " ")
      .trim();

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.lang = "en-IN";
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      synthRef.current = utterance;
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    } else {
      toast.error("Voice not supported in this browser");
    }
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  if (profileLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (needsIntake) {
    return (
      <FitnessIntakeForm
        memberName={member.full_name?.split(" ")[0] || "Buddy"}
        onSubmit={handleIntakeSubmit}
        isSubmitting={intakeSubmitting}
      />
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-primary" />
          AI Workout Coach
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Your personal trainer powered by AI • Chat history is saved
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chat Messages */}
        <div
          ref={scrollRef}
          className="h-96 overflow-y-auto space-y-3 p-3 bg-muted/30 rounded-lg"
        >
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3">
              <Bot className="h-12 w-12 text-primary/50" />
              <div>
                <p className="text-foreground font-medium">
                  Hey {member.full_name?.split(" ")[0]}! 👋
                </p>
                <p className="text-sm text-muted-foreground">
                  I'm your AI fitness coach at Real Fitness, Kunnathur. Ask me for today's workout!
                </p>
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-4 py-2 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div>
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                    {/* Voice button */}
                    <div className="flex justify-end mt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                        onClick={() =>
                          isSpeaking ? stopSpeaking() : speakText(msg.content)
                        }
                        title={isSpeaking ? "Stop speaking" : "Read aloud"}
                      >
                        {isSpeaking ? (
                          <VolumeX className="h-3.5 w-3.5" />
                        ) : (
                          <Volume2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm">{msg.content}</p>
                )}
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-4 py-2 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Coach is thinking...</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Prompts */}
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((prompt) => (
              <Button
                key={prompt}
                variant="outline"
                size="sm"
                onClick={() => sendMessage(prompt)}
                disabled={isLoading}
                className="text-xs"
              >
                {prompt}
              </Button>
            ))}
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about workouts, diet, exercises..."
            disabled={isLoading}
            className="bg-background border-border text-foreground"
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default MemberWorkoutChat;
