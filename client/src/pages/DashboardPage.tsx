import React from "react";
import { useInventory } from "../hooks/use-inventory";
import { useInventoryHistory } from "../hooks/use-inventory-history";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { PRODUCT_CATEGORIES } from "../lib/utils";

export const DashboardPage: React.FC = () => {
  const { inventory } = useInventory();
  const { history } = useInventoryHistory();

  // Get alerts for low stock items
  const alerts = inventory?.filter(
    (item) => item.quantity <= item.minQuantity
  ) || [];

  // Calculate stock by category
  const stockByCategory = inventory?.reduce((acc, item) => {
    const category = item.productType?.category || "unknown";
    acc[category] = (acc[category] || 0) + item.quantity;
    return acc;
  }, {} as Record<string, number>);

  // Get recent history (last 5 entries)
  const recentHistory = history
    ?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alerts</CardTitle>
            <CardDescription>Items that need to be restocked</CardDescription>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <p>No alerts at this time.</p>
            ) : (
              <ul className="space-y-2">
                {alerts.map((item) => (
                  <li key={item.id} className="flex justify-between">
                    <span>{item.name}</span>
                    <span className="text-red-500">
                      {item.quantity} / {item.minQuantity}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Stock by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Stock by Category</CardTitle>
            <CardDescription>Current stock levels by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {PRODUCT_CATEGORIES.map((category) => (
                <li key={category} className="flex justify-between">
                  <span className="capitalize">{category}</span>
                  <span>{stockByCategory?.[category] || 0}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Recent History */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Last 5 inventory transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {!recentHistory?.length ? (
              <p>No recent activity.</p>
            ) : (
              <ul className="space-y-4">
                {recentHistory.map((item) => (
                  <li key={item.id} className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{item.product?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.staff?.name} - {item.type === "IN" ? "In" : "Out"} (
                        {item.quantity})
                      </p>
                      {item.note && (
                        <p className="text-sm text-muted-foreground">
                          Note: {item.note}
                        </p>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 