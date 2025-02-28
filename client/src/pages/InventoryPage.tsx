import { useState } from "react";
import { Button } from "../components/ui/button";
import { Plus } from "lucide-react";
import { InventoryTable } from "../components/tables/InventoryTable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { InventoryForm } from "../components/forms/InventoryForm";
import type { InventoryItem } from "../lib/api";

export const InventoryPage = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingItem(null);
    setIsDialogOpen(true);
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">在庫一覧</h1>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          新規登録
        </Button>
      </div>

      <InventoryTable onEdit={handleEdit} />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "在庫情報の編集" : "新規在庫登録"}
            </DialogTitle>
          </DialogHeader>
          <InventoryForm item={editingItem} onSuccess={handleClose} />
        </DialogContent>
      </Dialog>
    </div>
  );
}; 