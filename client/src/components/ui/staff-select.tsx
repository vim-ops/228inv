import * as React from "react";
import { X, Plus } from "lucide-react";
import { useStaff } from "@/hooks/use-staff";
import { StaffDialog } from "./staff-dialog";
import { Button } from "./button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import * as Dialog from "@radix-ui/react-dialog";

interface StaffSelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
}

export function StaffSelect({ value, onValueChange }: StaffSelectProps) {
  const { staff, isLoading, deleteStaff } = useStaff();
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger>
            <SelectValue placeholder="担当者を選択してください" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {isLoading ? (
                <div className="px-4 py-3">
                  <p className="text-sm text-muted-foreground">
                    読み込み中...
                  </p>
                </div>
              ) : staff.length === 0 ? (
                <div className="px-4 py-3">
                  <p className="text-sm text-muted-foreground">
                    担当者が登録されていません
                  </p>
                </div>
              ) : (
                staff.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between px-2 group"
                  >
                    <SelectItem value={member.id.toString()}>
                      {member.name}
                    </SelectItem>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        deleteStaff(member.id);
                      }}
                    >
                      <X className="h-4 w-4 text-red-500 hover:text-red-600" />
                    </Button>
                  </div>
                ))
              )}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
        <Dialog.Trigger asChild>
          <Button
            type="button"
            variant="default"
            size="default"
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-4"
          >
            <Plus className="h-4 w-4 mr-2" />
            新規追加
          </Button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg sm:rounded-lg">
            <Dialog.Title className="text-lg font-semibold">
              新規担当者の追加
            </Dialog.Title>
            <StaffDialog onClose={() => setIsOpen(false)} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}