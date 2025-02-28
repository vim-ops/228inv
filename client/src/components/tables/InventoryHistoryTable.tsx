import React, { useState } from "react";
import { useInventoryHistory } from "../../hooks/use-inventory-history";
import { Input } from "../ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import type { ProductCategory } from "@/lib/constants";

interface InventoryHistoryTableProps {
  category: ProductCategory;
}

export const InventoryHistoryTable: React.FC<InventoryHistoryTableProps> = ({ category }) => {
  const { history, isLoading } = useInventoryHistory(category);
  const [filter, setFilter] = useState("");

  const filteredHistory = history?.filter((item) => {
    const searchTerm = filter.toLowerCase();
    return (
      item.productId?.toLowerCase().includes(searchTerm) ||
      item.type?.name?.toLowerCase().includes(searchTerm) ||
      item.staff?.name?.toLowerCase().includes(searchTerm) ||
      item.customerName?.toLowerCase().includes(searchTerm) ||
      item.purchaserName?.toLowerCase().includes(searchTerm)
    );
  });

  if (isLoading) {
    return <div>履歴を読み込み中...</div>;
  }

  if (!filteredHistory?.length) {
    return <div>履歴が見つかりません。</div>;
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="製品ID、タイプ、担当者、顧客名で検索..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="max-w-sm"
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>出庫日</TableHead>
            <TableHead>出庫番号</TableHead>
            <TableHead>製品ID</TableHead>
            <TableHead>タイプ</TableHead>
            <TableHead>担当者</TableHead>
            <TableHead>納品先</TableHead>
            <TableHead>購入者</TableHead>
            <TableHead>備考</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredHistory.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                {new Date(item.outboundDate).toLocaleDateString()}
              </TableCell>
              <TableCell>{item.outboundNumber}</TableCell>
              <TableCell>{item.productId}</TableCell>
              <TableCell>{item.type?.name}</TableCell>
              <TableCell>{item.staff?.name}</TableCell>
              <TableCell>{item.customerName || "-"}</TableCell>
              <TableCell>{item.purchaserName || "-"}</TableCell>
              <TableCell>{item.notes || "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};