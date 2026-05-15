import { useEffect, useRef, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flame, Play, Pause, RotateCcw, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const FOCUS_MINUTES = 25;
const BREAK_MINUTES = 5;

export default function Focus() {
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_MINUTES * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsToday, setSessionsToday] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedSessionRef = useRef(false);

  const today = new Date().toISOString().split("T")[0]!;
  const { data: sessions, isLoading, refetch } = trpc.focus.list.useQuery({ date: today });
  const createSessionMutation = trpc.focus.create.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Sessão registrada!");
    },
    onError: () => {
      toast.error("Erro ao registrar sessão");
    },
  });

  useEffect(() => {
    if (sessions) {
      setSessionsToday(sessions.length);
    }
  }, [sessions]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            const nextMode = mode === "focus" ? "break" : "focus";

            // Registrar sessão completada no banco
            if (!completedSessionRef.current) {
              completedSessionRef.current = true;
              createSessionMutation.mutate({
                type: mode,
                durationMinutes: mode === "focus" ? FOCUS_MINUTES : BREAK_MINUTES,
                date: today,
              });
            }

            setMode(nextMode);
            completedSessionRef.current = false;
            return nextMode === "focus" ? FOCUS_MINUTES * 60 : BREAK_MINUTES * 60;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, mode, today, createSessionMutation]);

  function handleReset() {
    setIsRunning(false);
    completedSessionRef.current = false;
    setSecondsLeft(mode === "focus" ? FOCUS_MINUTES * 60 : BREAK_MINUTES * 60);
  }

  function handleModeSwitch(newMode: "focus" | "break") {
    setIsRunning(false);
    completedSessionRef.current = false;
    setMode(newMode);
    setSecondsLeft(newMode === "focus" ? FOCUS_MINUTES * 60 : BREAK_MINUTES * 60);
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const totalSeconds = mode === "focus" ? FOCUS_MINUTES * 60 : BREAK_MINUTES * 60;
  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-md mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Flame className="w-6 h-6 text-orange-400" />
            Foco
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Timer Pomodoro — mantenha o foco!</p>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Mode selector */}
        <div className="flex gap-2">
          {(["focus", "break"] as const).map((m) => (
            <button
              key={m}
              onClick={() => handleModeSwitch(m)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === m
                  ? "bg-primary/20 text-primary border border-primary/40"
                  : "bg-secondary text-muted-foreground border border-border"
              }`}
            >
              {m === "focus" ? `Foco (${FOCUS_MINUTES}min)` : `Pausa (${BREAK_MINUTES}min)`}
            </button>
          ))}
        </div>

        {/* Timer circle */}
        <Card>
          <CardContent className="pt-8 pb-8 flex flex-col items-center gap-6">
            <div className="relative">
              <svg width="200" height="200" className="-rotate-90">
                <circle cx="100" cy="100" r={radius} fill="none" stroke="var(--border)" strokeWidth="8" />
                <circle
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="none"
                  stroke={mode === "focus" ? "oklch(0.65 0.24 275)" : "oklch(0.62 0.22 200)"}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-foreground tabular-nums">
                  {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  {mode === "focus" ? "Foco" : "Pausa"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={handleReset}
                className="w-10 h-10 rounded-full"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button
                size="lg"
                onClick={() => setIsRunning((v) => !v)}
                className="px-8 rounded-full"
              >
                {isRunning ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
                {isRunning ? "Pausar" : "Iniciar"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sessions counter */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Sessões concluídas hoje:{" "}
            <span className="font-bold text-foreground">{sessionsToday}</span>
          </p>
          <div className="flex justify-center gap-1.5 mt-2">
            {Array.from({ length: Math.max(4, sessionsToday) }, (_, i) => (
              <div
                key={`session-indicator-${i}`}
                className={`w-3 h-3 rounded-full ${i < sessionsToday ? "bg-primary" : "bg-border"}`}
              />
            ))}
          </div>
        </div>

        {/* Recent sessions */}
        {sessions && sessions.length > 0 && (
          <Card>
            <CardContent className="pt-4 pb-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Histórico de hoje</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {sessions.map((session) => (
                  <div key={`session-${session.id}`} className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>{session.type === "focus" ? "🎯 Foco" : "☕ Pausa"}</span>
                    <span>{session.durationMinutes} min</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
