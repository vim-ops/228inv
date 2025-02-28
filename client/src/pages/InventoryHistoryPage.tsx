import React, { useState } from "react";
import { Button } from "../components/ui/button";
import { InventoryHistoryTable } from "../components/tables/InventoryHistoryTable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { InventoryHistoryForm } from "../components/forms/InventoryHistoryForm";

export const InventoryHistoryPage: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Inventory History</h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          Register History
        </Button>
      </div>

      <InventoryHistoryTable />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Register Inventory History</DialogTitle>
          </DialogHeader>
          <InventoryHistoryForm
            onSubmit={() => setIsDialogOpen(false)}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}; 