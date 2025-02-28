import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useInventory } from "@/hooks/use-inventory";
import { useInventoryHistory } from "@/hooks/use-inventory-history";
import { format } from "date-fns";
import { BarChart } from "@/components/charts/BarChart";

export default function DashboardPage() {
  const { inventory, isLoading: isInventoryLoading } = useInventory();
  const { history, isLoading: isHistoryLoading } = useInventoryHistory();

  if (isInventoryLoading || isHistoryLoading) {
    return <div>読み込み中...</div>;
  }

  // 在庫アラート対象の商品を抽出
  const alertItems = inventory.filter(item => item.quantity <= item.minQuantity);

  // カテゴリー別の在庫数を集計
  const categoryStats = inventory.reduce((acc, item) => {
    const category = item.productType?.name || "未分類";
    acc[category] = (acc[category] || 0) + item.quantity;
    return acc;
  }, {} as Record<string, number>);

  // 直近の入出庫履歴を取得（最新10件）
  const recentHistory = [...history]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">ダッシュボード</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* 在庫アラート */}
        <Card>
          <CardHeader>
            <CardTitle>在庫アラート</CardTitle>
          </CardHeader>
          <CardContent>
            {alertItems.length === 0 ? (
              <p>アラートはありません</p>
            ) : (
              <div className="space-y-4">
                {alertItems.map(item => (
                  <Alert variant="destructive" key={item.id}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{item.name}</AlertTitle>
                    <AlertDescription>
                      現在庫数: {item.quantity} (最小在庫数: {item.minQuantity})
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 在庫統計 */}
        <Card>
          <CardHeader>
            <CardTitle>在庫統計</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="text-lg font-semibold">
                総在庫数: {inventory.reduce((sum, item) => sum + item.quantity, 0)}
              </p>
            </div>
            <BarChart
              data={Object.entries(categoryStats).map(([category, count]) => ({
                name: category,
                value: count,
              }))}
            />
          </CardContent>
        </Card>
      </div>

      {/* 最近の入出庫履歴 */}
      <Card>
        <CardHeader>
          <CardTitle>最近の入出庫履歴</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentHistory.map(history => (
              <div
                key={history.id}
                className="flex items-center justify-between border-b pb-2"
              >
                <div>
                  <p className="font-semibold">{history.product.name}</p>
                  <p className="text-sm text-gray-500">
                    {history.type === "IN" ? "入庫" : "出庫"} ({history.quantity}個)
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {format(new Date(history.createdAt), "yyyy/MM/dd HH:mm")}
                  </p>
                  <p className="text-sm">{history.staff.name}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}