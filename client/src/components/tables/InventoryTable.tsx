import React, { useState } from "react";
import { Input } from "../ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import type { ProductCategory } from "@/lib/constants";

interface InventoryTableProps {
  category: ProductCategory;
  data: any[];
}

export const InventoryTable: React.FC<InventoryTableProps> = ({ category, data }) => {
  const [filter, setFilter] = useState("");
  const [showOutOfStock, setShowOutOfStock] = useState(false);

  const filteredInventory = data.filter((item) => {
    const searchTerm = filter.toLowerCase();
    const matchesSearch = (
      item.productId.toLowerCase().includes(searchTerm) ||
      item.type.name.toLowerCase().includes(searchTerm) ||
      (item.lotNumber && item.lotNumber.toLowerCase().includes(searchTerm))
    );
    
    // 出庫済み製品の表示/非表示フィルタリング
    const matchesStatus = showOutOfStock || item.status === "in_stock";
    
    return matchesSearch && matchesStatus;
  });

  if (!filteredInventory?.length) {
    return <div>在庫アイテムが見つかりません。</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="製品ID、タイプ、ロット番号で検索..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center space-x-2">
          <Switch
            id="show-out-of-stock"
            checked={showOutOfStock}
            onCheckedChange={setShowOutOfStock}
          />
          <label
            htmlFor="show-out-of-stock"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            出庫済み製品を表示
          </label>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>製品ID</TableHead>
            <TableHead>タイプ</TableHead>
            <TableHead>ロット番号</TableHead>
            <TableHead>入庫番号</TableHead>
            <TableHead>ステータス</TableHead>
            {category === "pc" && (
              <>
                <TableHead>型番</TableHead>
                <TableHead>シリアル番号</TableHead>
                <TableHead>購入日</TableHead>
                <TableHead>保証期間</TableHead>
              </>
            )}
            <TableHead>担当者</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredInventory.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.productId}</TableCell>
              <TableCell>{item.type.name}</TableCell>
              <TableCell>{item.lotNumber || "-"}</TableCell>
              <TableCell>{item.inboundNumber}</TableCell>
              <TableCell>
                {item.status === "in_stock" ? "在庫中" : "出庫済み"}
              </TableCell>
              {category === "pc" && item.pcDetails && (
                <>
                  <TableCell>{item.pcDetails.modelNumber}</TableCell>
                  <TableCell>{item.pcDetails.serialNumber}</TableCell>
                  <TableCell>
                    {new Date(item.pcDetails.purchaseDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {item.pcDetails.warrantyPeriod
                      ? `${item.pcDetails.warrantyPeriod}ヶ月`
                      : "-"}
                  </TableCell>
                </>
              )}
              <TableCell>{item.staff?.name || "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};