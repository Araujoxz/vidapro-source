import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Wallet, Plus, Trash2, TrendingUp, TrendingDown, X } from "lucide-react";

const CATEGORIES = ["Alimentação", "Transporte", "Saúde", "Lazer", "Educação", "Moradia", "Salário", "Freelance", "Outros"];

export default function Finances() {
  const utils = trpc.useUtils();
  const [currentMonth] = useState(() => new Date().toISOString().substring(0, 7));
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Outros");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]!);

  const { data: transactions, isLoading } = trpc.finances.list.useQuery({ month: currentMonth });
  const { data: balance } = trpc.finances.balance.useQuery({ month: currentMonth });

  const createMutation = trpc.finances.create.useMutation({
    onSuccess: () => {
      utils.finances.list.invalidate();
      utils.finances.balance.invalidate();
      utils.dashboard.summary.invalidate();
      setShowForm(false);
      setAmount("");
      setDescription("");
    },
  });

  const deleteMutation = trpc.finances.delete.useMutation({
    onSuccess: () => {
      utils.finances.list.invalidate();
      utils.finances.balance.invalidate();
      utils.dashboard.summary.invalidate();
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numAmount = parseFloat(amount.replace(",", "."));
    if (!numAmount || numAmount <= 0) return;
    createMutation.mutate({ type, amount: numAmount, description: description.trim() || undefined, category, date });
  }

  const monthLabel = new Date(currentMonth + "-01").toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Wallet className="w-6 h-6 text-green-400" />
              Finanças
            </h1>
            <p className="text-muted-foreground text-sm mt-1 capitalize">{monthLabel}</p>
          </div>
          <Button onClick={() => setShowForm(true)} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Lançamento
          </Button>
        </div>

        {/* Balance cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-green-400" /> Receitas
              </p>
              <p className="text-xl font-bold text-green-400 mt-1">
                R$ {(balance?.income ?? 0).toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-red-500/30 bg-red-500/5">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingDown className="w-3 h-3 text-red-400" /> Despesas
              </p>
              <p className="text-xl font-bold text-red-400 mt-1">
                R$ {(balance?.expense ?? 0).toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card className={`${(balance?.balance ?? 0) >= 0 ? "border-primary/30 bg-primary/5" : "border-red-500/30 bg-red-500/5"}`}>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">Saldo</p>
              <p className={`text-xl font-bold mt-1 ${(balance?.balance ?? 0) >= 0 ? "text-primary" : "text-red-400"}`}>
                R$ {(balance?.balance ?? 0).toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Form */}
        {showForm && (
          <Card className="border-primary/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Novo lançamento</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setType("expense")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${type === "expense" ? "bg-red-500/20 text-red-400 border border-red-500/40" : "bg-secondary text-muted-foreground border border-border"}`}
                  >
                    Despesa
                  </button>
                  <button
                    type="button"
                    onClick={() => setType("income")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${type === "income" ? "bg-green-500/20 text-green-400 border border-green-500/40" : "bg-secondary text-muted-foreground border border-border"}`}
                  >
                    Receita
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="fin-amount">Valor (R$)</Label>
                    <Input id="fin-amount" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" className="mt-1" autoFocus />
                  </div>
                  <div>
                    <Label htmlFor="fin-date">Data</Label>
                    <Input id="fin-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="fin-desc">Descrição</Label>
                  <Input id="fin-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Almoço" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="fin-cat">Categoria</Label>
                  <select
                    id="fin-cat"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button type="submit" size="sm" disabled={createMutation.isPending}>Salvar</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                    <X className="w-4 h-4 mr-1" /> Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Transactions list */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => <Skeleton key={`sk-${i}`} className="h-14 w-full rounded-xl" />)}
          </div>
        ) : transactions && transactions.length > 0 ? (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${tx.type === "income" ? "bg-green-500/15" : "bg-red-500/15"}`}>
                  {tx.type === "income" ? <TrendingUp className="w-4 h-4 text-green-400" /> : <TrendingDown className="w-4 h-4 text-red-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{tx.description || tx.category || "—"}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="secondary" className="text-xs">{tx.category}</Badge>
                    <span className="text-xs text-muted-foreground">{tx.date}</span>
                  </div>
                </div>
                <span className={`text-sm font-bold shrink-0 ${tx.type === "income" ? "text-green-400" : "text-red-400"}`}>
                  {tx.type === "income" ? "+" : "-"}R$ {tx.amount.toFixed(2)}
                </span>
                <button
                  onClick={() => deleteMutation.mutate({ id: tx.id })}
                  disabled={deleteMutation.isPending}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Wallet className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Nenhuma transação este mês.</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-1" /> Adicionar lançamento
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
