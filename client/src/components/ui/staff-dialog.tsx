import React, { useState } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { DialogFooter } from "./dialog";
import { useStaff } from "@/hooks/use-staff";

interface StaffDialogProps {
  onClose?: () => void;
}

export function StaffDialog({ onClose }: StaffDialogProps) {
  const [newStaffName, setNewStaffName] = useState("");
  const { addStaff } = useStaff();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await addStaff(newStaffName);
    setNewStaffName("");
    onClose?.();
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="name" className="text-right">
          名前
        </Label>
        <Input
          id="name"
          value={newStaffName}
          onChange={(e) => setNewStaffName(e.target.value)}
          className="col-span-3"
          placeholder="担当者名を入力"
          autoFocus
        />
      </div>
      <DialogFooter>
        <Button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-6"
        >
          追加
        </Button>
      </DialogFooter>
    </form>
  );
}