import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Coins, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Shop() {
  const [showRedeemConfirm, setShowRedeemConfirm] = useState<number | null>(null);
  const [redeemingId, setRedeemingId] = useState<number | null>(null);

  const { data: userGamification } = trpc.gamification.get.useQuery();
  const { data: shopItems, isLoading, refetch } = trpc.shop.items.useQuery();
  const { data: redeems } = trpc.shop.redeems.useQuery();

  const redeemMutation = trpc.shop.redeem.useMutation({
    onSuccess: () => {
      refetch();
      setShowRedeemConfirm(null);
      setRedeemingId(null);
      toast.success("Recompensa resgatada! 🎉");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao resgatar recompensa");
      setRedeemingId(null);
    },
  });

  function handleRedeem(itemId: number, cost: number) {
    if (!userGamification || userGamification.coins < cost) {
      toast.error("Moedas insuficientes!");
      return;
    }
    setRedeemingId(itemId);
    redeemMutation.mutate({ itemId, coinsCost: cost });
  }

  const userCoins = userGamification?.coins || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-yellow-400" />
            Loja de Recompensas
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Troque suas moedas por recompensas</p>
        </div>

        {/* Saldo de Moedas */}
        <Card className="bg-gradient-to-r from-yellow-900/20 to-amber-900/20 border-yellow-500/30">
          <CardContent className="pt-6 pb-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Suas Moedas</p>
              <p className="text-3xl font-bold text-yellow-400">{userCoins}</p>
            </div>
            <Coins className="w-12 h-12 text-yellow-400 opacity-50" />
          </CardContent>
        </Card>

        {/* Itens da Loja */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : shopItems && shopItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shopItems.map((item) => {
              const isAffordable = userCoins >= item.cost;
              const isRedeemed = redeems?.some((r) => r.itemId === item.id);

              return (
                <Card
                  key={`shop-item-${item.id}`}
                  className={`transition-all ${
                    isAffordable ? "hover:border-primary/50" : "opacity-60"
                  } ${isRedeemed ? "border-green-500/50 bg-green-900/10" : ""}`}
                >
                  <CardContent className="pt-6 pb-6 space-y-4">
                    <div>
                      <h3 className="font-semibold text-foreground text-lg">{item.name}</h3>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Coins className="w-5 h-5 text-yellow-400" />
                        <span className="font-bold text-yellow-400">{item.cost}</span>
                      </div>
                      {isRedeemed && (
                        <span className="text-xs font-medium text-green-400 bg-green-900/30 px-2 py-1 rounded">
                          ✓ Resgatado
                        </span>
                      )}
                    </div>

                    {showRedeemConfirm === item.id ? (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Deseja resgatar esta recompensa por {item.cost} moedas?
                        </p>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleRedeem(item.id, item.cost)}
                            disabled={redeemingId === item.id || !isAffordable}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            {redeemingId === item.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              "Confirmar"
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setShowRedeemConfirm(null)}
                            className="flex-1"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        onClick={() => setShowRedeemConfirm(item.id)}
                        disabled={!isAffordable || isRedeemed}
                        className="w-full"
                      >
                        {isRedeemed ? "Já Resgatado" : "Resgatar"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm font-medium">Nenhum item disponível</p>
              <p className="text-muted-foreground text-xs mt-1">Volte mais tarde para novas recompensas</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
