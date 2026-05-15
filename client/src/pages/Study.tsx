import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Plus, Trash2, Edit2, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Study() {
  const [activeTab, setActiveTab] = useState<"sessions" | "decks">("sessions");
  const [showNewSessionForm, setShowNewSessionForm] = useState(false);
  const [showNewDeckForm, setShowNewDeckForm] = useState(false);
  const [newSessionData, setNewSessionData] = useState({ subject: "", durationMinutes: 30 });
  const [newDeckData, setNewDeckData] = useState({ name: "" });

  const { data: sessions, isLoading: sessionsLoading, refetch: refetchSessions } = trpc.study.sessions.useQuery({});
  const { data: decks, isLoading: decksLoading, refetch: refetchDecks } = trpc.study.decks.useQuery();

  const createSessionMutation = trpc.study.createSession.useMutation({
    onSuccess: () => {
      refetchSessions();
      setNewSessionData({ subject: "", durationMinutes: 30 });
      setShowNewSessionForm(false);
      toast.success("Sessão de estudo registrada!");
    },
    onError: () => toast.error("Erro ao registrar sessão"),
  });

  const deleteSessionMutation = trpc.study.deleteSession.useMutation({
    onSuccess: () => {
      refetchSessions();
      toast.success("Sessão removida");
    },
    onError: () => toast.error("Erro ao remover sessão"),
  });

  const createDeckMutation = trpc.study.createDeck.useMutation({
    onSuccess: () => {
      refetchDecks();
      setNewDeckData({ name: "" });
      setShowNewDeckForm(false);
      toast.success("Deck criado!");
    },
    onError: () => toast.error("Erro ao criar deck"),
  });

  const deleteDeckMutation = trpc.study.deleteDeck.useMutation({
    onSuccess: () => {
      refetchDecks();
      toast.success("Deck removido");
    },
    onError: () => toast.error("Erro ao remover deck"),
  });

  function handleCreateSession() {
    if (!newSessionData.subject.trim()) {
      toast.error("Digite o nome da matéria");
      return;
    }
    createSessionMutation.mutate({
      subject: newSessionData.subject,
      durationMinutes: newSessionData.durationMinutes,
      date: new Date().toISOString().split("T")[0]!,
    });
  }

  function handleCreateDeck() {
    if (!newDeckData.name.trim()) {
      toast.error("Digite o nome do deck");
      return;
    }
    createDeckMutation.mutate({ name: newDeckData.name });
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-cyan-400" />
            Estudos
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Sessões de estudo e flashcards com revisão espaçada</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border">
          {(["sessions", "decks"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "sessions" ? "Sessões de Estudo" : "Decks de Flashcards"}
            </button>
          ))}
        </div>

        {/* Sessions Tab */}
        {activeTab === "sessions" && (
          <div className="space-y-4">
            <Button onClick={() => setShowNewSessionForm(!showNewSessionForm)} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Nova Sessão de Estudo
            </Button>

            {showNewSessionForm && (
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Matéria</label>
                    <input
                      type="text"
                      value={newSessionData.subject}
                      onChange={(e) => setNewSessionData({ ...newSessionData, subject: e.target.value })}
                      placeholder="Ex: Matemática, História..."
                      className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-secondary text-foreground text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Duração (minutos)</label>
                    <input
                      type="number"
                      value={newSessionData.durationMinutes}
                      onChange={(e) => setNewSessionData({ ...newSessionData, durationMinutes: parseInt(e.target.value) })}
                      min="5"
                      max="480"
                      className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-secondary text-foreground text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCreateSession}
                      disabled={createSessionMutation.isPending}
                      className="flex-1"
                    >
                      {createSessionMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Registrar"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowNewSessionForm(false)}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {sessionsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : sessions && sessions.length > 0 ? (
              <div className="grid gap-3">
                {sessions.map((session) => (
                  <Card key={`session-${session.id}`}>
                    <CardContent className="pt-4 pb-4 flex justify-between items-center">
                      <div>
                        <p className="font-medium text-foreground">{session.subject}</p>
                        <p className="text-xs text-muted-foreground">{session.durationMinutes} minutos</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteSessionMutation.mutate({ id: session.id })}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center">
                  <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">Nenhuma sessão registrada</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Decks Tab */}
        {activeTab === "decks" && (
          <div className="space-y-4">
            <Button onClick={() => setShowNewDeckForm(!showNewDeckForm)} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Novo Deck de Flashcards
            </Button>

            {showNewDeckForm && (
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Nome do Deck</label>
                    <input
                      type="text"
                      value={newDeckData.name}
                      onChange={(e) => setNewDeckData({ name: e.target.value })}
                      placeholder="Ex: Vocabulário Inglês..."
                      className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-secondary text-foreground text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCreateDeck}
                      disabled={createDeckMutation.isPending}
                      className="flex-1"
                    >
                      {createDeckMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowNewDeckForm(false)}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {decksLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : decks && decks.length > 0 ? (
              <div className="grid gap-3">
                {decks.map((deck) => (
                  <Card key={`deck-${deck.id}`}>
                    <CardContent className="pt-4 pb-4 flex justify-between items-center">
                      <div>
                        <p className="font-medium text-foreground">{deck.name}</p>
                        <p className="text-xs text-muted-foreground">Deck de flashcards</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteDeckMutation.mutate({ id: deck.id })}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center">
                  <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">Nenhum deck criado</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
