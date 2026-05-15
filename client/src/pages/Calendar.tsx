import { useEffect, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Plus, Trash2, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Calendar() {
  const [showNewEventForm, setShowNewEventForm] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [newEventData, setNewEventData] = useState({
    title: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    startTime: "12:00",
  });

  const { data: events, isLoading, refetch } = trpc.calendar.list.useQuery({});
  console.log(JSON.stringify(events, null, 2));

  const createEventMutation = trpc.calendar.create.useMutation({
    onSuccess: () => {
      refetch();
      setNewEventData({
        title: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
        startTime: "12:00",
      });
      setShowNewEventForm(false);
      toast.success("Evento criado!");
    },
    onError: () => toast.error("Erro ao criar evento"),
  });

  const deleteEventMutation = trpc.calendar.delete.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Evento removido");
    },
    onError: () => toast.error("Erro ao remover evento"),
  });

  function formatDate(date?: Date) {
  if (!date) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

  function handleCreateEvent() {
    if (!newEventData.title.trim()) {
      toast.error("Digite o título do evento");
      return;
    }
    createEventMutation.mutate({
      title: newEventData.title,
      description: newEventData.description,
      date: newEventData.date,
      startTime: newEventData.startTime,
    });
  }

  // Group events by date
  const eventsByDate = events?.reduce((acc, event) => {
    const date = event.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(event);
    return acc;
  }, {} as Record<string, typeof events>) || {};

  const sortedDates = Object.keys(eventsByDate).sort();

  const selectedDateString = formatDate(selectedDay);

const selectedDayEvents =
  events?.filter((event) => {
    return event.date === selectedDateString;
  }) || [];

 const daysWithEvents =
  events?.map((event) => {
    const [year, month, day] = event.date.split("-").map(Number);

    return new Date(year, month - 1, day);
  }) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-pink-400" />
            Calendário
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Seus eventos pessoais</p>
        </div>

        <Card>
  <CardContent className="pt-6 flex justify-center">
    <DayPicker
  mode="single"
  selected={selectedDay}
  onSelect={(date) => {
    if (date) {
      setSelectedDay(date);
    }
  }}
  modifiers={{
    hasEvent: daysWithEvents,
  }}
  modifiersClassNames={{
    hasEvent: "has-event-day",
  }}
/>
  </CardContent>
</Card>

        <Button onClick={() => setShowNewEventForm(!showNewEventForm)} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Novo Evento
        </Button>

        {showNewEventForm && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Título</label>
                <input
                  type="text"
                  value={newEventData.title}
                  onChange={(e) => setNewEventData({ ...newEventData, title: e.target.value })}
                  placeholder="Ex: Reunião, Aniversário..."
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-secondary text-foreground text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Descrição (opcional)</label>
                <textarea
                  value={newEventData.description}
                  onChange={(e) => setNewEventData({ ...newEventData, description: e.target.value })}
                  placeholder="Detalhes do evento..."
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-secondary text-foreground text-sm resize-none h-20"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Data</label>
                  <input
                    type="date"
                    value={newEventData.date}
                    onChange={(e) => setNewEventData({ ...newEventData, date: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-secondary text-foreground text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Hora</label>
                  <input
                    type="time"
                    value={newEventData.startTime}
                    onChange={(e) => setNewEventData({ ...newEventData, startTime: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-secondary text-foreground text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleCreateEvent}
                  disabled={createEventMutation.isPending}
                  className="flex-1"
                >
                  {createEventMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowNewEventForm(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : selectedDayEvents.length > 0 ? (
  <div className="space-y-3">
    {selectedDayEvents.map((event) => (
      <Card key={`event-${event.id}`}>
        <CardContent className="pt-4 pb-4 flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                {event.startTime || "--:--"}
              </span>

              <p className="font-medium text-foreground truncate">
                {event.title}
              </p>
            </div>

            {event.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {event.description}
              </p>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              deleteEventMutation.mutate({ id: event.id })
            }
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </CardContent>
      </Card>
    ))}
  </div> 
  ) : (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm font-medium">Nenhum evento agendado</p>
              <p className="text-muted-foreground text-xs mt-1">Crie um novo evento para começar</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
