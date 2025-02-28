import { useParams } from "wouter";
import { useState } from "react";
import { HistoryTable } from "@/components/tables/HistoryTable";
import ProductLayout from "@/components/ProductLayout";
import { useInventory } from "@/hooks/use-inventory";
import type { ProductCategory } from "@/lib/constants";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { format, isWithinInterval, startOfMonth, endOfMonth, isValid } from "date-fns";

export default function HistoryPage() {
  const { product } = useParams<{ product: ProductCategory }>();
  const { inboundHistory, outboundHistory, isLoading } = useInventory(product);
  const [searchTerm, setSearchTerm] = useState("");
  const [monthFilter, setMonthFilter] = useState<string>("all");

  const filterRecords = (records: any[] | undefined, type: "inbound" | "outbound") => {
    if (!records) return [];

    let filtered = [...records];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((record) => {
        const searchFields = [
          record.productId,
          record.type?.name,
          record.staff?.name,
          type === "outbound" ? record.customerName : "",
          type === "outbound" ? record.purchaserName : "",
        ].filter(Boolean).join(" ").toLowerCase();

        return searchFields.includes(searchTerm.toLowerCase());
      });
    }

    // Apply month filter
    if (monthFilter && monthFilter !== "all") {
      try {
        const [year, month] = monthFilter.split("-").map(Number);
        const startDate = startOfMonth(new Date(year, month - 1));
        const endDate = endOfMonth(new Date(year, month - 1));

        if (!isValid(startDate) || !isValid(endDate)) {
          console.error("Invalid date range:", { startDate, endDate });
          return filtered;
        }

        filtered = filtered.filter((record) => {
          const recordDate = new Date(
            type === "inbound" ? record.inboundDate : record.outboundDate
          );
          return isValid(recordDate) && isWithinInterval(recordDate, { start: startDate, end: endDate });
        });
      } catch (error) {
        console.error("Error filtering by month:", error);
        return filtered;
      }
    }

    return filtered;
  };

  const getMonthOptions = () => {
    const allDates = [
      ...(inboundHistory || []).map((r) => new Date(r.inboundDate)),
      ...(outboundHistory || []).map((r) => new Date(r.outboundDate)),
    ].filter(isValid);

    const uniqueMonths = Array.from(
      new Set(
        allDates
          .filter(date => isValid(date))
          .map((date) => format(date, "yyyy-MM"))
      )
    ).sort().reverse();

    return uniqueMonths;
  };

  const monthOptions = getMonthOptions();

  return (
    <ProductLayout type="inventory" title="履歴">
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">検索</Label>
              <Input
                id="search"
                placeholder="製品ID、タイプ、担当者などで検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {monthOptions.length > 0 && (
              <div className="w-full sm:w-48">
                <Label htmlFor="month">月別フィルター</Label>
                <Select
                  value={monthFilter}
                  onValueChange={setMonthFilter}
                >
                  <SelectTrigger id="month">
                    <SelectValue placeholder="すべての期間" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべての期間</SelectItem>
                    {monthOptions.map((month) => (
                      <SelectItem key={month} value={month}>
                        {format(new Date(month), "yyyy年MM月")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <Tabs defaultValue="outbound" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="inbound">入庫履歴</TabsTrigger>
              <TabsTrigger value="outbound">出庫履歴</TabsTrigger>
            </TabsList>

            <TabsContent value="inbound" className="mt-4">
              <HistoryTable
                category={product}
                data={filterRecords(inboundHistory, "inbound")}
                type="inbound"
              />
            </TabsContent>

            <TabsContent value="outbound" className="mt-4">
              <HistoryTable
                category={product}
                data={filterRecords(outboundHistory, "outbound")}
                type="outbound"
              />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </ProductLayout>
  );
}